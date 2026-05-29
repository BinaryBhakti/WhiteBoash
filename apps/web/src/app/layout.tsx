import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas Suite",
  description: "Collaborative whiteboards and structured documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body>
        <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
