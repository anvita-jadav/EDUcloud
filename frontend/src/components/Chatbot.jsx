import { useState } from 'react'
import { api } from '../lib/api'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am EDUtech AI. Ask me about the EduCloude app, attendance, results, or any of your computer science subjects.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    setMessages((m) => [...m, { from: 'user', text }])
    try {
      const res = await api('/api/chatbot/chat', {
        method: 'POST',
        body: { message: text, history: messages },
      })
      setMessages((m) => [...m, { from: 'bot', text: res.reply || 'Sorry, I could not answer that.' }])
    } catch (err) {
      setMessages((m) => [...m, { from: 'bot', text: err.message || 'The AI assistant is unavailable right now.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="btn chat-fab" onClick={() => setOpen(!open)} title="EDUtech AI">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-window card">
          <div className="chat-head">
            <strong>EDUtech AI</strong>
            <button className="btn btn-ghost" style={{ color: '#fff', border: 'none' }} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="chat-msg bot">typing…</div>}
          </div>
          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask EDUtech AI…"
            />
            <button className="btn btn-primary" onClick={send} disabled={busy}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}