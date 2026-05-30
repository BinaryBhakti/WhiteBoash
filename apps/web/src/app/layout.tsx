import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { getAppPublicEnv } from "@/lib/env/public";
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
  const { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey } = getAppPublicEnv();

  return (
    <html lang="en">
      <body>
        <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
