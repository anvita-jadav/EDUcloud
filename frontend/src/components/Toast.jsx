import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  return <div className={`toast ${type}`}>{message}</div>
}