'use client'

export function UpdateBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderBottom: '1px solid #33ff33',
        color: '#33ff33',
        fontSize: 13,
      }}
    >
      <span>A new version is available</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#33ff33',
          color: '#000',
          border: 'none',
          padding: '4px 12px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Refresh
      </button>
    </div>
  )
}
