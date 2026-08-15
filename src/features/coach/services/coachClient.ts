export interface CoachChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type CoachResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'not_configured' | 'network' | 'error'; message?: string }

const ENDPOINT = '/.netlify/functions/coach'

/**
 * Calls the serverless AI Coach endpoint. The endpoint lives on Netlify and
 * holds the API key; this only sends chat turns + a data summary and reads
 * back the reply. Distinguishes "not deployed / no key" from real errors so
 * the UI can guide setup.
 */
export async function sendToCoach(
  messages: CoachChatMessage[],
  context: string,
): Promise<CoachResult> {
  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    })
  } catch {
    return { ok: false, reason: 'network' }
  }

  // The function isn't reachable (not deployed, or running the static build
  // without Netlify functions): treat as "needs setup" rather than an error.
  if (response.status === 404) return { ok: false, reason: 'not_configured' }

  let data: { text?: string; error?: string; message?: string }
  try {
    data = await response.json()
  } catch {
    return { ok: false, reason: 'error', message: `Unexpected response (HTTP ${response.status}).` }
  }

  if (data.error === 'not_configured') return { ok: false, reason: 'not_configured' }
  if (data.error) return { ok: false, reason: 'error', message: data.message }
  if (typeof data.text === 'string') return { ok: true, text: data.text }
  return { ok: false, reason: 'error', message: 'Empty response from coach.' }
}
