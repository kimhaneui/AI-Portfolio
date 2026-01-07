"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import { predefinedAnswers } from "@/data/predefined-answers";
import {
  canAskQuestion,
  logQuestion,
  getRemainingQuestions,
} from "@/lib/rate-limit";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState(
    getRemainingQuestions()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "어떤 기술 스택을 사용하세요?",
    "가장 최근에 진행한 프로젝트는 무엇인가요?",
    "현재 회사에서 무엇을 하나요?",
    "React 경험이 있나요?",
    "경력은 몇 년인가요?",
  ];

  const handleSuggestionClick = async (suggestion: string) => {
    // 사전 준비된 답변이 있으면 즉시 표시
    if (predefinedAnswers[suggestion]) {
      const userMessage = suggestion;
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      // 약간의 딜레이를 주어 자연스러운 흐름을 만듦
      await new Promise((resolve) => setTimeout(resolve, 300));

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: predefinedAnswers[suggestion] },
      ]);
    } else {
      // 사전 답변이 없으면 기존처럼 input에만 설정
      setInput(suggestion);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 남은 질문 횟수 업데이트
  useEffect(() => {
    const updateRemaining = () => {
      setRemainingQuestions(getRemainingQuestions());
    };

    updateRemaining();
    // 1분마다 업데이트
    const interval = setInterval(updateRemaining, 60000);

    return () => clearInterval(interval);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // 사전 답변 체크 (사전 답변은 제한에 포함하지 않음)
    if (predefinedAnswers[input.trim()]) {
      const userMessage = input.trim();
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: predefinedAnswers[userMessage] },
      ]);
      return;
    }

    // 질문 횟수 제한 확인
    const rateLimitCheck = canAskQuestion();
    if (!rateLimitCheck.allowed) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${rateLimitCheck.reason}\n\n사전 준비된 질문은 제한 없이 사용할 수 있습니다.`,
        },
      ]);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // 질문 로그 기록
    logQuestion();
    setRemainingQuestions(getRemainingQuestions());

    try {
      // Supabase Edge Function URL 사용
      const edgeFunctionUrl =
        process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL ||
        "https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio";

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 에러 응답의 상세 메시지 표시
        const errorMessage =
          data.details || data.error || "Failed to get response";
        console.error("API Error:", errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `오류가 발생했습니다: ${errorMessage}\n\n환경 변수가 올바르게 설정되었는지 확인해주세요.`,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);

      // 남은 질문 횟수 업데이트
      setRemainingQuestions(getRemainingQuestions());
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `죄송합니다. 오류가 발생했습니다: ${errorMessage}\n\n다시 시도해주세요.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto">
            {/* Header with Icon */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-purple-500 rounded-2xl shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">AI 챗봇</h1>
              <p className="text-xl text-gray-600">
                포트폴리오에 대해 무엇이든 물어보세요
              </p>
            </div>

            {/* Suggestions */}
            <div className="w-full max-w-2xl">
              <p className="text-sm text-gray-500 mb-4 text-center">
                질문 제안
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-left border border-gray-200/50"
                  >
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}

            {/* Loading Animation */}
            {isLoading && (
              <div className="flex justify-start animate-slide-in-right">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center shadow-lg animate-pulse">
                      <svg
                        className="w-6 h-6 text-purple-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-purple-100/90 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-purple-200">
                    <div className="flex space-x-2 items-center">
                      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      ></div>
                      <div
                        className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 sm:p-6 bg-white/30 backdrop-blur-md border-t border-white/50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* 질문 횟수 표시 */}
          {remainingQuestions.daily > 0 && (
            <div className="mb-3 text-center">
              <span className="text-xs text-gray-600 bg-white/60 px-3 py-1 rounded-full">
                남은 질문: {remainingQuestions.daily}개
                {remainingQuestions.hourly < remainingQuestions.daily && (
                  <span className="ml-2 text-gray-500">
                    (시간당 {remainingQuestions.hourly}개)
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex gap-3 items-center">
            {/* Input Container */}
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="포트폴리오에 대해 무엇이든 물어보세요..."
                className="w-full px-5 py-4 bg-white/80 backdrop-blur-md border-2 rounded-full
                  focus:outline-none focus:border-purple-400 transition-all duration-300 text-gray-900 placeholder-gray-500
                  border-gray-300/50 shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || remainingQuestions.daily === 0}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                !input.trim() ||
                remainingQuestions.daily === 0 ||
                !canAskQuestion().allowed
              }
              className="flex-shrink-0 w-12 h-12 bg-purple-500
                text-white rounded-full flex items-center justify-center
                hover:scale-110 hover:bg-purple-600 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                transition-all duration-300 shadow-lg"
            >
              <svg
                className={`w-6 h-6 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isLoading ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                )}
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
