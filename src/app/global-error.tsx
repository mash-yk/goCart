"use client";

/** Last-resort error screen if the root layout itself fails. Uses inline styles since global CSS may not load. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbf9ff", color: "#140b2e" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0 }}>Lumora is taking a breather.</h1>
            <p style={{ color: "#6a5aa8", marginTop: 12 }}>Something went wrong on our side. Please try again in a moment.</p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                border: 0,
                borderRadius: 999,
                padding: "14px 28px",
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
                background: "linear-gradient(120deg, #7c3aed, #d946ef 45%, #fb923c)",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
