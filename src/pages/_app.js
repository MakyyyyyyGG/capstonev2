import * as React from "react";
import { useState } from "react";
import Providers from "@/Providers";
import Script from "next/script";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import { SessionProvider, useSession } from "next-auth/react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// Import the Inter font
const inter = Inter({ subsets: ["latin"] });

function AppContent({ Component, pageProps }) {
  const { data: session } = useSession();
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  return (
    <>
      <style jsx global>{`
        /* Apply the Inter font to the whole application */
        html,
        body {
          font-family: ${inter.style.fontFamily}, sans-serif;
        }
      `}</style>
      {session ? (
        <>
          <Header
            isCollapsed={isCollapsedSidebar}
            toggleCollapse={toggleSidebarCollapseHandler}
          />
          <div className="flex">
            <Sidebar
              isCollapsed={isCollapsedSidebar}
              toggleCollapse={toggleSidebarCollapseHandler}
            />
            <Component {...pageProps} />
          </div>
        </>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <Providers>
      <SessionProvider session={session}>
        <AppContent Component={Component} pageProps={pageProps} />
      </SessionProvider>
    </Providers>
  );
}
