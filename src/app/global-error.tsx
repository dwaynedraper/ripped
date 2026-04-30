"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0a",
          color: "#a3a3a3",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "monospace",
          fontSize: "0.875rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "24rem" }}>
          <p style={{ color: "#fafafa", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </p>
          <p style={{ marginBottom: "1.5rem" }}>
            An unexpected error occurred. It has been reported automatically.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#262626",
              color: "#fafafa",
              border: "1px solid #404040",
              borderRadius: "6px",
              padding: "0.5rem 1.25rem",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
