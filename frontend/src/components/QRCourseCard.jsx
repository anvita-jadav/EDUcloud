import { QRCodeSVG } from 'qrcode.react'

export function QRCourseCard({ course }) {
  if (!course) return null
  return (
    <div className="card" style={{ textAlign: 'center', maxWidth: 320 }}>
      <QRCodeSVG
        value={course.code}
        size={200}
        bgColor="#ffffff"
        fgColor="#0f172a"
        includeMargin={false}
      />
      <p style={{ marginTop: 12, fontWeight: 700 }}>{course.name}</p>
      <p className="small muted">{course.code}</p>
    </div>
  )
}