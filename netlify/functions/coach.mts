import Anthropic from '@anthropic-ai/sdk'

/**
 * Serverless AI Coach endpoint. Runs on Netlify, keeping ANTHROPIC_API_KEY
 * server-side so it never ships to the device. The client POSTs the recent
 * chat turns plus a compact summary of the user's fitness data; this calls
 * Claude Sonnet and returns the assistant's reply as JSON.
 *
 * Endpoint: /.netlify/functions/coach
 */

const MODEL = 'claude-sonnet-5'
const MAX_TURNS = 20
const MAX_TURN_CHARS = 4000
const MAX_CONTEXT_CHARS = 6000

const SYSTEM_PROMPT = `You are the Dialed Dawg AI Coach — a knowledgeable, encouraging strength & conditioning and nutrition coach built into a fitness app.

You are given a snapshot of the user's own data (workouts, recovery, nutrition, body weight, personal records) in a <user_data> block. Ground your advice in that data: reference their actual numbers, recent training, recovery readiness, and goals rather than giving generic answers.

Style:
- Talk like a sharp, supportive coach. Be direct, specific, and motivating.
- Keep replies concise and skimmable on a phone — a few short paragraphs or a tight list, not an essay.
- Give concrete, actionable recommendations (what to train, target sets/reps/loads, calorie or protein adjustments) tied to their data.
- When you make a suggestion, briefly say why.

Boundaries:
- You are a fitness coach, not a doctor. For pain, injury, or medical concerns, recommend consulting a qualified professional; don't diagnose or prescribe treatment.
- If the data needed to answer isn't present, say what you'd want them to log rather than inventing numbers.`

interface IncomingMessage {
  role?: unknown
  content?: unknown
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return json({ error: 'not_configured' })

  let payload: { messages?: unknown; context?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'bad_request', message: 'Invalid JSON body.' }, 400)
  }

  const rawMessages = Array.isArray(payload.messages) ? (payload.messages as IncomingMessage[]) : []
  const messages = rawMessages
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: String(m.content ?? '').slice(0, MAX_TURN_CHARS),
    }))
    .filter((m) => m.content.trim().length > 0)

  if (messages.length === 0) {
    return json({ error: 'bad_request', message: 'No messages provided.' }, 400)
  }

  const context =
    typeof payload.context === 'string' ? payload.context.slice(0, MAX_CONTEXT_CHARS) : ''
  const system = context ? `${SYSTEM_PROMPT}\n\n<user_data>\n${context}\n</user_data>` : SYSTEM_PROMPT

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 900,
      // Chat replies favor low latency over deliberation; the answer is
      // grounded in the supplied data rather than multi-step reasoning.
      thinking: { type: 'disabled' },
      system,
      messages,
    })

    if (response.stop_reason === 'refusal') {
      return json({
        text: "I can't help with that one — let's keep it to training, recovery, and nutrition. What would you like to work on?",
      })
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    return json({ text: text || "I didn't catch that — could you rephrase?" })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return json({ error: 'api_error', message })
  }
}
