import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Layout Component Imports
import GlobalNavbar from "@/app/components/layout/GlobalNavbar";
import PrimarySidebar from "@/app/components/layout/PrimarySidebar";
import SecondarySidebar from "@/app/components/layout/SecondarySidebar";
import TopInfoBar from "@/app/components/layout/TopInfoBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Engine MVP",
  description: "B2B Dynamic SaaS Platform with Multi-Tenant Architecture",
};

/**
 * Root Layout Component.
 * Establishes the core skeleton of the application, utilizing a dual-sidebar
 * strategy and dynamic context areas.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}
      >
        {/* Topmost persistent navigation */}
        <GlobalNavbar />

        {/* Main application wrapper (below global navbar) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Dual Sidebar Architecture */}
          <PrimarySidebar />
          <SecondarySidebar />

          {/* Right Context & Working Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-black">
            {/* Top context drawer (collapsible to the right) */}
            <TopInfoBar />

            {/* Dynamic injected view (Data Tables, JSONB Viewers, etc.) */}
            <div className="flex-1 overflow-auto p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
