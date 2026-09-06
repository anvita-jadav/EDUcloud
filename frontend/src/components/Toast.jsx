import { useEffect, useRef } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current?.(), 3500)
    return () => clearTimeout(t)
  }, [message])

  return <div className={`toast ${type}`}>{message}</div>
}