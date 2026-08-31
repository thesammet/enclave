import { useEffect, useRef, useState } from 'react'
import { type ChatMessage, runAgentTurn } from '../runtime/openai'
import { isWebMcpAvailable } from '../runtime/webmcp'
import { allTools, type ToolContext } from '../tools'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

const KEY_STORAGE = 'enclave.openai.key'
const MODEL_STORAGE = 'enclave.openai.model'

const SUGGESTIONS = [
  'Which region underperformed in 2025, and when?',
  'EMEA fell in March. Find the cause and fix it.',
  'What is below its reorder level right now?',
]

export function AgentPanel({ ctx }: { ctx: ToolContext }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? '')
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_STORAGE) ?? 'gpt-5')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [thread, setThread] = useState<any[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const native = isWebMcpAvailable()

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages, busy])

  async function send(text: string) {
    if (!text.trim() || !apiKey || busy) return
    setDraft('')
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy('thinking')
    try {
      const next = [...thread, { role: 'user', content: text }]
      const result = await runAgentTurn({
        apiKey,
        model,
        input: next,
        ctx,
        onToolCall: (n) => setBusy(n),
      })
      setThread(result.input)
      setMessages((m) => [...m, { role: 'assistant', text: result.text }])
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Error: ${e instanceof Error ? e.message : String(e)}` },
      ])
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {!apiKey && (
        <div className="m-3 space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xs leading-relaxed text-neutral-500">
            {native
              ? 'ChatGPT can drive this page directly. To use this panel instead, paste an OpenAI key.'
              : 'This browser has no WebMCP. Paste an OpenAI key to use the built-in agent.'}{' '}
            The key stays in this browser and goes only to api.openai.com. Your data goes nowhere.
          </p>
          <Input
            type="password"
            placeholder="sk-…"
            onChange={(e) => {
              setApiKey(e.target.value)
              localStorage.setItem(KEY_STORAGE, e.target.value)
            }}
          />
          <Input
            value={model}
            aria-label="Model"
            onChange={(e) => {
              setModel(e.target.value)
              localStorage.setItem(MODEL_STORAGE, e.target.value)
            }}
          />
        </div>
      )}

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-3 py-2 text-sm">
        {messages.length === 0 && (
          <div className="space-y-1.5">
            <p className="pb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Try asking
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={!apiKey}
                className="block w-full rounded-md border border-neutral-200 px-2.5 py-1.5
                  text-left text-xs text-neutral-500 transition enabled:hover:border-neutral-400
                  enabled:hover:text-neutral-900 disabled:cursor-default dark:border-neutral-800
                  dark:enabled:hover:border-neutral-600 dark:enabled:hover:text-neutral-100"
              >
                {s}
              </button>
            ))}
            <p className="pt-2 text-[11px] leading-relaxed text-neutral-400">
              Whichever agent you use, it works through the same {allTools.length} tools this page
              registers — it never receives a row of your data, and anything that changes the
              business waits for your approval.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
              {m.role === 'user' ? 'You' : 'Agent'}
            </div>
            <div
              className={
                m.role === 'user'
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'whitespace-pre-wrap text-neutral-600 dark:text-neutral-300'
              }
            >
              {m.text}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
            {busy === 'thinking' ? 'thinking…' : `${busy}…`}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <Input
          value={draft}
          placeholder="Ask about your data"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(draft)}
        />
        <Button onClick={() => send(draft)} disabled={Boolean(busy) || !apiKey}>
          Send
        </Button>
      </div>
    </div>
  )
}
