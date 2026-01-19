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
}

interface DustEventContent {
  content?: string;
}

interface DustEvent {
  type: string;
  content?: DustEventContent | string;
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
        JSON.stringify({ success: false, error: 'Dust API credentials not configured. Please add DUST_API_KEY, DUST_WORKSPACE_ID, and DUST_AGENT_ID.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${profiles.length} founder profiles with Dust Agent...`);

    const enrichedFounders: EnrichedFounder[] = [];
    const errors: { name: string; error: string }[] = [];

    // Process profiles sequentially to avoid rate limits
    for (const profile of profiles) {
      try {
        console.log(`Analyzing profile: ${profile.name} (${profile.linkedinUrl})`);

        // Step 1: Create a conversation
        const convResponse = await fetch(
          `https://dust.tt/api/v1/w/${DUST_WORKSPACE_ID}/conversations`,
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
          }
        );

        if (!convResponse.ok) {
          const errorText = await convResponse.text();
          console.error(`Failed to create conversation for ${profile.name}:`, errorText);
          errors.push({ name: profile.name, error: `Failed to create conversation: ${convResponse.status}` });
          continue;
        }

        const convData = await convResponse.json() as DustConversationResponse;
        const conversationId = convData.conversation.sId;
        console.log(`Created conversation: ${conversationId}`);

        // Step 2: Send message to the agent
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

        const msgResponse = await fetch(
          `https://dust.tt/api/v1/w/${DUST_WORKSPACE_ID}/conversations/${conversationId}/messages`,
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
                profilePictureUrl: null,
                fullName: 'FundRadar Analyst',
                email: null,
                origin: 'api',
              },
            }),
          }
        );

        if (!msgResponse.ok) {
          const errorText = await msgResponse.text();
          console.error(`Failed to send message for ${profile.name}:`, errorText);
          errors.push({ name: profile.name, error: `Failed to send message: ${msgResponse.status}` });
          continue;
        }

        // Step 3: Poll for agent response using streaming events
        let agentResponse = '';
        let attempts = 0;
        const maxAttempts = 60; // Max 60 seconds wait

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;

          const eventsResponse = await fetch(
            `https://dust.tt/api/v1/w/${DUST_WORKSPACE_ID}/conversations/${conversationId}/events`,
            {
              headers: {
                'Authorization': `Bearer ${DUST_API_KEY}`,
              },
            }
          );

          if (!eventsResponse.ok) {
            continue;
          }

          const eventsData = await eventsResponse.json() as { events: DustEvent[] };
          
          // Look for agent_message_success event
          const successEvent = eventsData.events?.find(
            (e: DustEvent) => e.type === 'agent_message_success'
          );

          if (successEvent) {
            const content = successEvent.content;
            if (typeof content === 'object' && content?.content) {
              agentResponse = content.content;
            } else if (typeof content === 'string') {
              agentResponse = content;
            }
            break;
          }

          // Check for error
          const errorEvent = eventsData.events?.find(
            (e: DustEvent) => e.type === 'agent_error'
          );
          if (errorEvent) {
            throw new Error('Agent encountered an error');
          }
        }

        if (!agentResponse) {
          errors.push({ name: profile.name, error: 'Timeout waiting for agent response' });
          continue;
        }

        console.log(`Got response for ${profile.name}, parsing...`);

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

        // Small delay between profiles to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (profileError) {
        console.error(`Error analyzing ${profile.name}:`, profileError);
        errors.push({ 
          name: profile.name, 
          error: profileError instanceof Error ? profileError.message : 'Unknown error' 
        });
      }
    }

    console.log(`Analysis complete: ${enrichedFounders.length} succeeded, ${errors.length} failed`);

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
