import * as React from "react";
import { useState, useEffect } from "react";
import Providers from "@/Providers";
import Script from "next/script";
import "../styles/globals.css";
import { Inter, Balsamiq_Sans } from "next/font/google";
import { SessionProvider, useSession } from "next-auth/react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import SidebarStudent from "./components/SidebarStudent";
// Import the Inter font
const inter = Inter({ subsets: ["latin"] });
const balsamiqSans = Balsamiq_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function AppContent({ Component, pageProps }) {
  const { data: session, status } = useSession();
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  const fontClass =
    session && session.user.role === "student"
      ? balsamiqSans.className // ? balsamiqSans.className (For Balsamiq Sans)
      : inter.className;

  return (
    <>
      <style jsx global>{`
        /* Apply the Inter font to the whole application */
        html,
        body {
          font-family: ${inter.style.fontFamily}, sans-serif;
        }
      `}</style>
      <div className={fontClass}>
        {session && !isLoading ? (
          <>
            <Header
              isCollapsed={isCollapsedSidebar}
              toggleCollapse={toggleSidebarCollapseHandler}
            />
            <div className="flex min-h-screen">
              {session.user.role === "student" ? (
                <SidebarStudent
                  isCollapsed={isCollapsedSidebar}
                  toggleCollapse={toggleSidebarCollapseHandler}
                />
              ) : session.user.role === "teacher" ? (
                <Sidebar
                  isCollapsed={isCollapsedSidebar}
                  toggleCollapse={toggleSidebarCollapseHandler}
                />
              ) : null}
              <Component {...pageProps} />
            </div>
          </>
        ) : (
          <Component {...pageProps} />
        )}
      </div>
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
