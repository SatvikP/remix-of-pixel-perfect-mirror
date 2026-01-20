

## Fix: Add Detailed Error Logging for AI Matching Step

### Problem
The current code only logs "AI matching error" without capturing the actual HTTP status code or error response body, making debugging impossible.

### Solution
Enhance error logging on line 336-342 of `supabase/functions/cluster-startups/index.ts` to capture and log the actual error details.

### Changes

**File: `supabase/functions/cluster-startups/index.ts`**

Replace the current error handling (lines 336-342):
```typescript
if (!matchResponse.ok) {
  console.error('AI matching error');
  return new Response(
    JSON.stringify({ success: false, error: 'AI startup matching failed' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

With detailed error handling (similar to lines 197-217 for the cluster step):
```typescript
if (!matchResponse.ok) {
  const errorText = await matchResponse.text();
  console.error('AI matching error:', matchResponse.status, errorText);
  
  if (matchResponse.status === 429) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded during matching. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (matchResponse.status === 402) {
    return new Response(
      JSON.stringify({ success: false, error: 'Payment required. Please add credits to continue.' }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ success: false, error: `AI startup matching failed: ${matchResponse.status}` }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Benefits
1. **Better debugging**: Logs will show exact HTTP status (429, 402, 500, etc.) and error message
2. **User-friendly errors**: Different error messages for rate limits vs payment issues vs generic failures
3. **Consistent handling**: Matches the error handling pattern already used for the clustering step (lines 197-217)

### Critical Files for Implementation
- `supabase/functions/cluster-startups/index.ts` - Add detailed error logging at line 336-342

