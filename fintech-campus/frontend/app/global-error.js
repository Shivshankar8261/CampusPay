"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.25rem" }}>Something went wrong</h1>
        <p style={{ opacity: 0.8 }}>{error?.message || "Unexpected error"}</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
