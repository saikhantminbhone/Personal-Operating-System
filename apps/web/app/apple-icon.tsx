import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#0D1520',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          width: 130,
          height: 130,
          borderRadius: '50%',
          border: '1.5px solid rgba(100,255,218,0.15)',
        }} />

        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 18, left: 18, width: 18, height: 18, borderTop: '2px solid rgba(100,255,218,0.4)', borderLeft: '2px solid rgba(100,255,218,0.4)' }} />
        <div style={{ position: 'absolute', top: 18, right: 18, width: 18, height: 18, borderTop: '2px solid rgba(100,255,218,0.4)', borderRight: '2px solid rgba(100,255,218,0.4)' }} />
        <div style={{ position: 'absolute', bottom: 18, left: 18, width: 18, height: 18, borderBottom: '2px solid rgba(100,255,218,0.4)', borderLeft: '2px solid rgba(100,255,218,0.4)' }} />
        <div style={{ position: 'absolute', bottom: 18, right: 18, width: 18, height: 18, borderBottom: '2px solid rgba(100,255,218,0.4)', borderRight: '2px solid rgba(100,255,218,0.4)' }} />

        {/* S letter */}
        <span
          style={{
            color: '#64ffda',
            fontSize: 96,
            fontWeight: 800,
            fontFamily: 'monospace',
            lineHeight: 1,
            letterSpacing: '-4px',
            textShadow: '0 0 30px rgba(100,255,218,0.4)',
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size },
  )
}
