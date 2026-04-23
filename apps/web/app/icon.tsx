import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#0D1520',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid rgba(100,255,218,0.25)',
        }}
      >
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 3, left: 3, width: 4, height: 4, borderTop: '1.5px solid rgba(100,255,218,0.5)', borderLeft: '1.5px solid rgba(100,255,218,0.5)' }} />
        <div style={{ position: 'absolute', top: 3, right: 3, width: 4, height: 4, borderTop: '1.5px solid rgba(100,255,218,0.5)', borderRight: '1.5px solid rgba(100,255,218,0.5)' }} />
        <div style={{ position: 'absolute', bottom: 3, left: 3, width: 4, height: 4, borderBottom: '1.5px solid rgba(100,255,218,0.5)', borderLeft: '1.5px solid rgba(100,255,218,0.5)' }} />
        <div style={{ position: 'absolute', bottom: 3, right: 3, width: 4, height: 4, borderBottom: '1.5px solid rgba(100,255,218,0.5)', borderRight: '1.5px solid rgba(100,255,218,0.5)' }} />
        {/* S letter */}
        <span
          style={{
            color: '#64ffda',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'monospace',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size },
  )
}
