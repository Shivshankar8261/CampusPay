"use client";

export default function Error({ error, reset }) {
  return (
    <div className="page stack" style={{ padding: "2rem", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Something went wrong</h1>
      <p className="muted" style={{ margin: 0 }}>
        {error?.digest ? `Error reference: ${error.digest}` : error?.message || "Unexpected error"}
      </p>
      <button type="button" className="btn primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
