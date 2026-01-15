'use client'

import { useState } from 'react'

export default function Architecture() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const steps = [
    {
      id: 0,
      title: '사전 답변 체크',
      description: '자주 묻는 질문에 대한 사전 준비된 답변을 즉시 제공',
      icon: '⚡',
      color: 'yellow',
    },
    {
      id: 1,
      title: '키워드 매칭',
      description: 'keyword_responses 테이블에서 명시적인 키워드 매칭',
      icon: '🔍',
      color: 'blue',
    },
    {
      id: 2,
      title: '벡터 검색',
      description: 'Google Gemini 임베딩 모델을 활용한 의미론적 검색',
      icon: '📊',
      color: 'purple',
    },
    {
      id: 3,
      title: 'LLM 응답 생성',
      description: 'Gemini 2.5 Flash 모델로 컨텍스트 기반 답변 생성',
      icon: '🤖',
      color: 'pink',
    },
  ]

  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    pink: 'bg-pink-50 border-pink-200',
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">RAG 파이프라인 아키텍처</h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Step Card */}
            <div
              className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                activeStep === step.id
                  ? `${colorClasses[step.color as keyof typeof colorClasses]} shadow-lg scale-105`
                  : `${colorClasses[step.color as keyof typeof colorClasses]} hover:shadow-md`
              }`}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-500">
                      {step.id}단계
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                  {activeStep === step.id && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-700">
                        {step.id === 0 && 'predefined-answers.ts에서 즉시 응답 확인'}
                        {step.id === 1 && 'Supabase keyword_responses 테이블에서 빠른 응답 제공'}
                        {step.id === 2 && '질문을 카테고리별로 분류하여 필요한 데이터만 검색 (토큰 최적화)'}
                        {step.id === 3 && '검색된 컨텍스트를 기반으로 정확한 답변 생성 (Hallucination 방지)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
