import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookDropp — Instant Webhook Inspector",
  description: "Free, no-login webhook inspection tool. Get a temporary URL, capture webhooks in real-time, inspect headers, body, and more. No account required.",
  keywords: ["webhook", "inspector", "debug", "API", "testing", "developer tools", "webhook catcher", "request bin"],
  authors: [{ name: "Kaushik" }],
  openGraph: {
    title: "HookDropp — Instant Webhook Inspector",
    description: "Free, no-login webhook inspection tool. Capture and inspect webhooks in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="noise-overlay grid-bg">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.05em',
            },
            success: {
              iconTheme: { primary: 'var(--accent)', secondary: 'var(--bg)' },
            },
            error: {
              iconTheme: { primary: 'var(--status-error)', secondary: 'var(--bg)' },
            },
          }}
        />
      </body>
    </html>
  );
}
