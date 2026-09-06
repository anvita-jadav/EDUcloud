import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export function QRScannerView({ onResult }) {
  const scannerRef = useRef(null)
  const onResultRef = useRef(onResult)
  const [manual, setManual] = useState('')
  const [active, setActive] = useState(false)
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    if (!active) return
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          scanner.stop().catch(() => {})
          if (onResultRef.current) onResultRef.current(String(decoded))
        },
        () => {},
      )
      .catch(() => setScanError('Camera unavailable — enter the code manually below.'))

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {})
      scannerRef.current = null
    }
  }, [active])

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 12 }}>QR Attendance Check-in</h3>
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => setActive(!active)}>
        {active ? 'Stop camera' : 'Start camera'}
      </button>

      <div id="qr-reader" style={{ width: '100%', maxWidth: 320, display: active ? 'block' : 'none' }} />

      {scanError && <p className="muted small" style={{ marginTop: 8 }}>{scanError}</p>}

      <div className="form-row" style={{ marginTop: 16 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Or enter course code manually</label>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. CS501"
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const code = manual.trim()
            if (code) onResult(code)
          }}
          disabled={!manual.trim()}
        >
          Check in
        </button>
      </div>
    </div>
  )
}