import * as React from "react";
import Providers from "@/Providers";
import Script from "next/script";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";

// Import the Inter font
const inter = Inter({ subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <Providers>
      <SessionProvider session={session}>
        <style jsx global>{`
          /* Apply the Inter font to the whole application */
          html,
          body {
            font-family: ${inter.style.fontFamily}, sans-serif;
          }
        `}</style>
        <Component {...pageProps} />
      </SessionProvider>
    </Providers>
  );
}
