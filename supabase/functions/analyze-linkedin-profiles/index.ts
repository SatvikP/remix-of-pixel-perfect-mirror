const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FounderProfile {
  name: string;
  linkedinUrl: string;
}

interface EnrichedFounder {
  name: string;
  linkedinUrl: string;
  pastExperience?: string;
  currentLocation?: string;
  industryTag?: string;
  notes?: string;
  analyzedAt: string;
}

interface DustConversationResponse {
  conversation: {
    sId: string;
  };
}

interface DustMessageResponse {
  message: {
    sId: string;
  };
  agentMessage?: {
    sId: string;
  };
}

interface ProfileError {
  name: string;
  error: string;
  stage: 'conversation_create' | 'message_create' | 'events_stream' | 'parse_json' | 'timeout' | 'unknown';
}

// Helper function for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper function for exponential backoff retry
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  timeoutMs: number = 30000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      
      // Retry on rate limit (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      // Wait before retry on network errors
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Network error, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// Helper to log and extract error details from non-OK responses
async function logResponseError(
  response: Response,
  context: string
): Promise<string> {
  const status = response.status;
  const contentType = response.headers.get('content-type') || 'unknown';
  let bodyPreview = '';
  
  try {
    const text = await response.text();
    bodyPreview = text.substring(0, 500);
  } catch {
    bodyPreview = '[Could not read response body]';
  }
  
  const errorDetails = `${context}: status=${status}, content-type=${contentType}, body=${bodyPreview}`;
  console.error(errorDetails);
  
  return `HTTP ${status}: ${bodyPreview.substring(0, 100)}...`;
}

// Parse SSE stream and accumulate agent response
async function parseSSEStream(
  response: Response,
  profileName: string
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body to read');
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  let agentContent = '';
  let foundSuccess = false;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Skip empty lines and comments
        
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') {
            foundSuccess = true;
            break;
          }
          
          try {
            const event = JSON.parse(jsonStr);
            
            // Handle different event types
            if (event.type === 'agent_message_success') {
              foundSuccess = true;
              if (event.message?.content) {
                agentContent = event.message.content;
              } else if (typeof event.content === 'string') {
                agentContent = event.content;
              } else if (event.content?.content) {
                agentContent = event.content.content;
              }
              break;
            }
            
            // Accumulate content from generation tokens
            if (event.type === 'generation_tokens' && event.text) {
              agentContent += event.text;
            }
            
            // Check for agent message content
            if (event.type === 'agent_message' && event.message?.content) {
              agentContent = event.message.content;
            }
            
            // Check for error events
            if (event.type === 'agent_error' || event.type === 'error') {
              throw new Error(event.error?.message || event.message || 'Agent error occurred');
            }
          } catch (parseError) {
            // Not valid JSON, might be partial - continue
            if (parseError instanceof SyntaxError) {
              continue;
            }
            throw parseError;
          }
        }
      }
      
      if (foundSuccess) break;
    }
  } finally {
    reader.releaseLock();
  }
  
  // Process any remaining buffer
  if (buffer.trim() && !foundSuccess) {
    if (buffer.startsWith('data: ')) {
      const jsonStr = buffer.slice(6);
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === 'agent_message_success') {
          if (event.message?.content) {
            agentContent = event.message.content;
          } else if (typeof event.content === 'string') {
            agentContent = event.content;
          }
        }
      } catch {
        // Ignore parse errors in final buffer
      }
    }
  }
  
  console.log(`SSE stream complete for ${profileName}, content length: ${agentContent.length}`);
  return agentContent;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profiles } = await req.json() as { profiles: FounderProfile[] };

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profiles array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DUST_API_KEY = Deno.env.get('DUST_API_KEY');
    const DUST_WORKSPACE_ID = Deno.env.get('DUST_WORKSPACE_ID');
    const DUST_AGENT_ID = Deno.env.get('DUST_AGENT_ID');

    if (!DUST_API_KEY || !DUST_WORKSPACE_ID || !DUST_AGENT_ID) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dust API credentials not configured. Please add DUST_API_KEY, DUST_WORKSPACE_ID, and DUST_AGENT_ID.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${profiles.length} founder profiles with Dust Agent...`);
    console.log(`Workspace: ${DUST_WORKSPACE_ID}, Agent: ${DUST_AGENT_ID}`);

    const enrichedFounders: EnrichedFounder[] = [];
    const errors: ProfileError[] = [];
    const baseUrl = `https://dust.tt/api/v1/w/${DUST_WORKSPACE_ID}`;

    // Process profiles sequentially to avoid rate limits
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      console.log(`\n=== Processing profile ${i + 1}/${profiles.length}: ${profile.name} ===`);
      
      try {
        // Step 1: Create a conversation (with /assistant/ path)
        const convUrl = `${baseUrl}/assistant/conversations`;
        console.log(`Creating conversation at: ${convUrl}`);
        
        const convResponse = await fetchWithRetry(
          convUrl,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DUST_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `Analysis: ${profile.name}`,
              visibility: 'unlisted',
            }),
          },
          3,
          30000
        );

        if (!convResponse.ok) {
          const errorMsg = await logResponseError(convResponse, `Create conversation for ${profile.name}`);
          errors.push({ name: profile.name, error: errorMsg, stage: 'conversation_create' });
          continue;
        }

        const convData = await convResponse.json() as DustConversationResponse;
        const conversationId = convData.conversation.sId;
        console.log(`Created conversation: ${conversationId}`);

        // Step 2: Send message to the agent (with /assistant/ path)
        const analysisPrompt = `Analyze this LinkedIn profile and extract structured information for an investor:

LinkedIn URL: ${profile.linkedinUrl}
Name: ${profile.name}

Please analyze the profile and provide:
1. Past Experience: Summarize key roles and companies (focus on relevant startup/tech experience)
2. Current Location: City and Country
3. Industry Tags: Relevant sectors/industries they work in (comma-separated, e.g., "AI, SaaS, Enterprise Software")
4. Notes: Key insights for investors - notable achievements, skills, potential as a founder, any red/green flags

Return your analysis in this exact JSON format:
{
  "pastExperience": "Summary of key roles...",
  "currentLocation": "City, Country",
  "industryTag": "Tag1, Tag2, Tag3",
  "notes": "Key insights for investors..."
}`;

        const msgUrl = `${baseUrl}/assistant/conversations/${conversationId}/messages`;
        console.log(`Sending message to: ${msgUrl}`);
        
        const msgResponse = await fetchWithRetry(
          msgUrl,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DUST_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: analysisPrompt,
              mentions: [{ configurationId: DUST_AGENT_ID }],
              context: {
                timezone: 'UTC',
                username: 'fundradar-api',
                profilePictureUrl: null,
                fullName: 'FundRadar Analyst',
                email: null,
                origin: 'api',
              },
            }),
          },
          3,
          30000
        );

        if (!msgResponse.ok) {
          const errorMsg = await logResponseError(msgResponse, `Send message for ${profile.name}`);
          errors.push({ name: profile.name, error: errorMsg, stage: 'message_create' });
          continue;
        }

        const msgData = await msgResponse.json() as DustMessageResponse;
        const messageId = msgData.message?.sId || msgData.agentMessage?.sId;
        console.log(`Message created, messageId: ${messageId || 'not found'}`);

        // Step 3: Stream events for the message
        let agentResponse = '';
        
        // Use message-specific events endpoint if we have messageId, otherwise fallback to conversation events
        const eventsUrl = messageId 
          ? `${baseUrl}/assistant/conversations/${conversationId}/messages/${messageId}/events`
          : `${baseUrl}/assistant/conversations/${conversationId}/events`;
        
        console.log(`Fetching events from: ${eventsUrl}`);
        
        // Add initial delay to allow Dust agent to start processing
        console.log(`Waiting 1s before fetching events to allow agent processing...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Poll for events with streaming support
        let attempts = 0;
        const maxAttempts = 90; // Max 90 seconds wait (with 1s intervals)
        
        while (attempts < maxAttempts && !agentResponse) {
          attempts++;
          
          try {
            const eventsResponse = await fetchWithTimeout(
              eventsUrl,
              {
                headers: {
                  'Authorization': `Bearer ${DUST_API_KEY}`,
                  'Accept': 'text/event-stream',
                },
              },
              30000
            );

            if (!eventsResponse.ok) {
              if (attempts === 1) {
                console.log(`Events endpoint returned ${eventsResponse.status}, will retry...`);
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }

            const contentType = eventsResponse.headers.get('content-type') || '';
            
            if (contentType.includes('text/event-stream')) {
              // Parse SSE stream
              agentResponse = await parseSSEStream(eventsResponse, profile.name);
            } else {
              // Try JSON response
              const eventsData = await eventsResponse.json();
              
              // Look for agent_message_success event
              const events = eventsData.events || eventsData;
              if (Array.isArray(events)) {
                const successEvent = events.find(
                  (e: { type: string }) => e.type === 'agent_message_success'
                );
                
                if (successEvent) {
                  const content = successEvent.content || successEvent.message?.content;
                  if (typeof content === 'object' && content?.content) {
                    agentResponse = content.content;
                  } else if (typeof content === 'string') {
                    agentResponse = content;
                  }
                }
                
                // Check for agent_message with content
                const msgEvent = events.find(
                  (e: { type: string }) => e.type === 'agent_message'
                );
                if (!agentResponse && msgEvent?.message?.content) {
                  agentResponse = msgEvent.message.content;
                }
                
                // Check for error
                const errorEvent = events.find(
                  (e: { type: string }) => e.type === 'agent_error' || e.type === 'error'
                );
                if (errorEvent) {
                  throw new Error(errorEvent.error?.message || errorEvent.message || 'Agent error');
                }
              }
            }
            
            if (!agentResponse) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (eventError) {
            if (eventError instanceof Error && eventError.message.includes('timeout')) {
              console.log(`Events fetch timeout, attempt ${attempts}/${maxAttempts}`);
            } else {
              throw eventError;
            }
          }
        }

        if (!agentResponse) {
          errors.push({ 
            name: profile.name, 
            error: `Timeout after ${maxAttempts}s waiting for agent response`, 
            stage: 'timeout' 
          });
          continue;
        }

        console.log(`Got response for ${profile.name} (${agentResponse.length} chars), parsing...`);

        // Parse the JSON response from the agent
        let parsed: { pastExperience?: string; currentLocation?: string; industryTag?: string; notes?: string } = {};
        try {
          // Try to extract JSON from the response
          const jsonMatch = agentResponse.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: use the whole response as notes
            parsed = { notes: agentResponse };
          }
        } catch (parseError) {
          console.log(`Could not parse JSON for ${profile.name}, using raw response`);
          parsed = { notes: agentResponse };
          errors.push({ 
            name: profile.name, 
            error: 'JSON parse failed, using raw response', 
            stage: 'parse_json' 
          });
        }

        enrichedFounders.push({
          name: profile.name,
          linkedinUrl: profile.linkedinUrl,
          pastExperience: parsed.pastExperience || undefined,
          currentLocation: parsed.currentLocation || undefined,
          industryTag: parsed.industryTag || undefined,
          notes: parsed.notes || undefined,
          analyzedAt: new Date().toISOString(),
        });

        console.log(`✓ Successfully analyzed ${profile.name}`);

        // Delay between profiles to avoid rate limits (1 second)
        if (i < profiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (profileError) {
        const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error';
        console.error(`✗ Error analyzing ${profile.name}:`, errorMessage);
        errors.push({ 
          name: profile.name, 
          error: errorMessage,
          stage: 'unknown'
        });
      }
    }

    console.log(`\n=== Analysis complete: ${enrichedFounders.length} succeeded, ${errors.length} failed ===`);

    return new Response(
      JSON.stringify({
        success: true,
        founders: enrichedFounders,
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          total: profiles.length,
          analyzed: enrichedFounders.length,
          failed: errors.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-linkedin-profiles:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
