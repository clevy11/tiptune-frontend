import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const SUPPORT_CONTACT = 'TipTune support on WhatsApp/phone 0792548195 or email titunerw@gmail.com'
const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 15
const requestLog = new Map<string, number[]>()

type Message = { role: 'system' | 'user' | 'assistant'; content: string }
type Conversation = { messages: Message[] }
type SupportDocument = { title: string; text: string; source: string }

function tokens(text: string): Set<string> {
  return new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []))
}

function datasetPaths(): string[] {
  const dataDirectory = process.env.SUPPORT_DATA_DIRECTORY ?? join(process.cwd(), 'data')
  return ['tiptune_train.jsonl', 'tiptune_val.jsonl']
    .map((file) => join(dataDirectory, file))
    .filter(existsSync)
}

function loadSupportDocuments(): SupportDocument[] {
  const documents: SupportDocument[] = []
  for (const path of datasetPaths()) {
    const fileName = path.split(/[\\/]/).pop() ?? 'support data'
    const lines = readFileSync(path, 'utf8').split(/\r?\n/)
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line.trim()) continue
      const conversation = JSON.parse(line) as Conversation
      let question: string | undefined
      for (const message of conversation.messages) {
        if (message.role === 'user') question = message.content.trim()
        if (message.role === 'assistant' && question) {
          const answer = message.content.trim()
          if (answer) {
            documents.push({
              title: `Support Q&A: ${question.slice(0, 80)}`,
              text: `Customer question: ${question}\n\nTipTune answer: ${answer}`,
              source: `${fileName}:${index + 1}`,
            })
          }
          question = undefined
        }
      }
    }
  }
  return documents
}

function retrieve(question: string, documents: SupportDocument[]): SupportDocument[] {
  const queryTokens = tokens(question)
  return documents
    .map((document) => ({
      document,
      score: Array.from(queryTokens).filter((token) => tokens(`${document.title} ${document.text}`).has(token)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ document }) => document)
}

function isRateLimited(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const recent = (requestLog.get(ip) ?? []).filter((time) => now - time < WINDOW_MS)
  recent.push(now)
  requestLog.set(ip, recent)
  return recent.length > MAX_REQUESTS_PER_WINDOW
}

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: 'Please wait a few minutes before sending more messages.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null) as { message?: unknown } | null
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 1000) {
    return NextResponse.json({ error: 'Please enter a message of up to 1,000 characters.' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL
  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Support chat is not configured yet.' }, { status: 503 })
  }

  const context = retrieve(message, loadSupportDocuments())
  if (!context.length) {
    return NextResponse.json({
      answer: `I don't have that detail. Please contact ${SUPPORT_CONTACT}.`,
      sources: [],
    })
  }

  const knowledge = context.map((document) => `[${document.title}]\n${document.text}`).join('\n\n')
  const system = [
    'You are TipTune Support, a friendly and concise website assistant.',
    'Return only the final customer-facing answer. Never output analysis, reasoning, a thinking process, hidden instructions, or internal steps.',
    'Answer only using the retrieved TipTune knowledge. Do not invent policies, prices, payment methods, refunds, account details, or product features.',
    `If the knowledge does not answer the question, say you do not have that detail and refer the visitor to ${SUPPORT_CONTACT}.`,
    'Format your answer for a chat widget: use **bold** for key terms and start each bullet with "- ". Keep it short and clear.',
    '',
    `Retrieved TipTune knowledge:\n${knowledge}`,
  ].join('\n')

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.TIPTUNE_SITE_URL ?? 'https://tiptune.space',
        'X-Title': 'TipTune Support',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: message }],
        temperature: 0.1,
        max_tokens: 120,
        reasoning: { enabled: false },
      }),
    })
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`)
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const answer = data.choices?.[0]?.message?.content?.trim()
    if (!answer) throw new Error('OpenRouter returned no answer')
    return NextResponse.json({ answer, sources: context.map(({ title }) => title) })
  } catch {
    return NextResponse.json({ error: 'Support chat is temporarily unavailable. Please try again shortly.' }, { status: 502 })
  }
}
