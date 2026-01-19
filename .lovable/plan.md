
## Diagnosis (from logs + current code)
- The edge function is calling Dust endpoints like:
  - `POST https://dust.tt/api/v1/w/{workspaceId}/conversations`
  - `POST https://dust.tt/api/v1/w/{workspaceId}/conversations/{cId}/messages`
  - `GET  https://dust.tt/api/v1/w/{workspaceId}/conversations/{cId}/events`
- Dust’s Assistant API endpoints require the **`/assistant/`** segment, and message event streaming is **per-message**, not per-conversation. Because of the wrong paths, Dust returns an HTML **404 page** (exactly what your logs show), so all 35 profiles fail at “create conversation”.

## Plan: Fix `analyze-linkedin-profiles` Dust API integration

### 1) Update API URLs to correct Dust Assistant endpoints
In `supabase/functions/analyze-linkedin-profiles/index.ts`, change:
- Create conversation:
  - FROM: `/api/v1/w/{wId}/conversations`
  - TO:   `/api/v1/w/{wId}/assistant/conversations`
- Create message:
  - FROM: `/api/v1/w/{wId}/conversations/{cId}/messages`
  - TO:   `/api/v1/w/{wId}/assistant/conversations/{cId}/messages`
- Events:
  - FROM: `/api/v1/w/{wId}/conversations/{cId}/events`
  - TO:   `/api/v1/w/{wId}/assistant/conversations/{cId}/messages/{mId}/events`

### 2) Fix request payload shape for “create message”
Align the body with Dust’s API shape (their docs commonly wrap data under a `message` object). Concretely:
- Include `mentions: [{ configurationId: DUST_AGENT_ID }]`
- Include `content`
- Include `context` (your current context object is fine, just place it under the right nesting if required)
- Add `blocking: true` if supported by the endpoint so the API waits for completion (otherwise we’ll rely on streaming events parsing).

### 3) Use the returned Message ID and fetch message events correctly
Right now you define `DustMessageResponse` but never read it.
- Parse the message creation response to capture `message.sId` (call it `messageId`).
- Call the message events endpoint:  
  `GET /assistant/conversations/{cId}/messages/{mId}/events`

### 4) Handle streaming events properly (avoid assuming JSON list)
Dust “events” endpoints are documented as **streaming**.
Implement one of these robust approaches:
- **Preferred**: Stream-read the response body (SSE/text stream) and accumulate events until you see an event type like `agent_message_success`, then extract the assistant content.
- **Fallback**: If Dust also supports a non-streaming “blocking=true” mode that returns final content, use that and skip streaming.

### 5) Improve error visibility (so we don’t get silent 35-failure batches again)
Add structured logging + response capture:
- Log:
  - HTTP status
  - URL called
  - response `content-type`
  - first ~500 chars of response text when non-2xx
- Return per-profile error details including whether it failed at:
  - conversation_create / message_create / events_stream / parse_json / timeout

### 6) Add timeouts and rate-limit handling
- Wrap each external fetch with an AbortController timeout (e.g., 20–30s).
- If Dust rate limits (429), implement exponential backoff retry a few times per profile.
- Keep sequential processing, but add slightly longer delay (e.g., 800–1200ms) if you see throttling.

### 7) Validate end-to-end quickly
After implementing:
1. Trigger analyze with 1–2 founders.
2. Confirm stats show `succeeded > 0`.
3. Scale to 35 again.

## Critical Files for Implementation
- `supabase/functions/analyze-linkedin-profiles/index.ts` — Primary fix: correct endpoints, message ID handling, streaming event parsing, better errors/timeouts.
- `src/lib/api.ts` — Ensure the client displays returned error details cleanly if some profiles fail.
- `src/components/FoundersAnalysis.tsx` — Improve UI feedback (e.g., show first failing reason, allow retry failed only).
- `supabase/config.toml` — Ensure the function remains enabled/configured (no major change expected).
