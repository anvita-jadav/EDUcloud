import { useState } from 'react'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am EduCloude AI assistant. Ask me about your attendance, results, or timetable.' },
  ])
  const [input, setInput] = useState('')

  const RULES = [
    { match: /attendance/i, reply: 'You can view your attendance percentage and records from the Attendance page. Aim to stay above 75%.' },
    { match: /result|grade|marks/i, reply: 'Results are available on the Results page once published by your faculty.' },
    { match: /timetable|class|schedule/i, reply: 'Your weekly timetable is shown on your Dashboard.' },
    { match: /qr|check.?in/i, reply: 'Open the Attendance page and scan the QR displayed by your faculty to check in.' },
  ]

  function send() {
    if (!input.trim()) return
    const text = input.trim()
    const replies = RULES.filter((r) => r.match.test(text)).map((r) => r.reply)
    const botReply =
      replies.length > 0
        ? replies[0]
        : 'I can help with attendance, results, timetable, and QR check-in questions. Can you be more specific?'
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: botReply }])
    setInput('')
  }

  return (
    <>
      <button
        className="btn chat-fab"
        onClick={() => setOpen(!open)}
        title="AI Assistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-window card">
          <div className="chat-head">
            <strong>EduCloude AI Assistant</strong>
            <button className="btn btn-ghost" style={{ color: '#fff', border: 'none' }} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about attendance, results…"
            />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}