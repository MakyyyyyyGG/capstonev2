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
      ? balsamiqSans.className
      : inter.className;

  return (
    <>
      <style jsx global>{`
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

      {/* Drift Script */}
      <Script
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          "use strict";
          !function() {
            var t = window.driftt = window.drift = window.driftt || [];
            if (!t.init) {
              if (t.invoked) return void (window.console && console.error && console.error("Drift snippet included twice."));
              t.invoked = !0, t.methods = [ "identify", "config", "track", "reset", "debug", "show", "ping", "page", "hide", "off", "on" ], 
              t.factory = function(e) {
                return function() {
                  var n = Array.prototype.slice.call(arguments);
                  return n.unshift(e), t.push(n), t;
                };
              }, t.methods.forEach(function(e) {
                t[e] = t.factory(e);
              }), t.load = function(t) {
                var e = 3e5, n = Math.ceil(new Date() / e) * e, o = document.createElement("script");
                o.type = "text/javascript", o.async = !0, o.crossorigin = "anonymous", o.src = "https://js.driftt.com/include/" + n + "/" + t + ".js";
                var i = document.getElementsByTagName("script")[0];
                i.parentNode.insertBefore(o, i);
              };
            }
          }();
          drift.SNIPPET_VERSION = '0.3.1';
          drift.load('7sr48xa2zh7y');
        `,
        }}
      />
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
