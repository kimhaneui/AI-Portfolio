import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AI Portfolio",
  description: "RAG 기반 AI 챗봇 포트폴리오",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
