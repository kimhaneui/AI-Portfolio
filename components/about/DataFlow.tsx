"use client";

import { useState } from "react";

export default function DataFlow() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const flowSteps = [
    {
      id: "user",
      label: "사용자 질문",
      description: "사용자가 챗봇에 질문을 입력합니다",
      color: "blue",
      icon: "👤",
    },
    {
      id: "frontend",
      label: "프론트엔드",
      description: "ChatBot.tsx에서 질문을 받아 처리합니다",
      color: "purple",
      icon: "💻",
    },
    {
      id: "predefined",
      label: "사전 답변 체크",
      description: "predefined-answers.ts에서 즉시 답변 확인",
      color: "yellow",
      icon: "⚡",
    },
    {
      id: "edge",
      label: "Edge Function",
      description: "Supabase Edge Function (ai-portfolio) 호출",
      color: "pink",
      icon: "⚙️",
    },
    {
      id: "keyword",
      label: "키워드 매칭",
      description: "keyword_responses 테이블에서 빠른 응답",
      color: "blue",
      icon: "🔍",
    },
    {
      id: "vector",
      label: "벡터 검색",
      description: "resume_embeddings 테이블에서 유사도 검색",
      color: "purple",
      icon: "📊",
    },
    {
      id: "gemini",
      label: "Gemini API",
      description: "컨텍스트 기반 답변 생성",
      color: "indigo",
      icon: "🤖",
    },
    {
      id: "response",
      label: "최종 응답",
      description: "사용자에게 마크다운 형식으로 응답 표시",
      color: "green",
      icon: "✅",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 border-blue-300",
    purple: "bg-purple-100 border-purple-300",
    yellow: "bg-yellow-100 border-yellow-300",
    pink: "bg-pink-100 border-pink-300",
    indigo: "bg-indigo-100 border-indigo-300",
    green: "bg-green-100 border-green-300",
  };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">데이터 흐름</h2>
      <div className="space-y-4">
        {flowSteps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Step Card */}
            <div
              className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                colorClasses[step.color as keyof typeof colorClasses]
              } ${
                hoveredNode === step.id
                  ? "scale-105 shadow-lg"
                  : "hover:shadow-md"
              }`}
              onMouseEnter={() => setHoveredNode(step.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white flex items-center justify-center text-3xl shadow-sm">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-500">
                      {index + 1}단계
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">
                      {step.label}
                    </h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </div>
            
            {/* Arrow between cards */}
            {index < flowSteps.length - 1 && (
              <div className="flex justify-center my-2">
                <svg 
                  className="w-8 h-8 text-purple-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600 text-center">
          각 단계에 마우스를 올려보세요. 사용자 질문부터 최종 응답까지의 전체
          흐름을 확인할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
