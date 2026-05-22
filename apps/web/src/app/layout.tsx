import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookDrop — Instant Webhook Inspector & Request Bin",
  description: "Free, no-login webhook debugger and inspector. Get a temporary URL, capture incoming webhook payloads in real-time, and analyze headers and request bodies.",
  keywords: ["hookdrop", "webhook bin", "request bin", "webhook inspector", "webhook debugger", "webhook catcher", "API testing", "realtime webhook", "developer tools"],
  authors: [{ name: "Kaushik" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "HookDrop — Instant Webhook Inspector",
    description: "Free, no-login webhook debugger and inspector. Capture and inspect webhooks in real-time.",
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
