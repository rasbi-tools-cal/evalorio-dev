"use client"

/** Last-resort boundary (root layout failed): no i18n or styles available here. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <button onClick={reset} style={{ padding: "10px 16px", background: "#006948", color: "#fff", border: 0, borderRadius: 8 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
