'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
            padding: 16,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              padding: 32,
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: 8, fontSize: 14, color: '#4b5563' }}>
              We could not load this page. Please refresh and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                reset()
                window.location.reload()
              }}
              style={{
                marginTop: 24,
                width: '100%',
                border: 0,
                borderRadius: 8,
                background: '#2563eb',
                color: '#fff',
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
