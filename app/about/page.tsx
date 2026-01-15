import TechStack from '@/components/about/TechStack'
import Architecture from '@/components/about/Architecture'
import DataFlow from '@/components/about/DataFlow'
import Features from '@/components/about/Features'
import ProjectStructure from '@/components/about/ProjectStructure'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-purple-100 rounded-2xl shadow-sm">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gray-800">
            프로젝트 소개
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            RAG(Retrieval-Augmented Generation) 기반의 AI 챗봇 포트폴리오 웹사이트입니다.
            Supabase 테이블 데이터를 벡터 DB로 변환하고, Google Gemini API를 통해 질문에 답변합니다.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Tech Stack */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <TechStack />
          </div>

          {/* Architecture */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <Architecture />
          </div>

          {/* Data Flow */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <DataFlow />
          </div>

          {/* Features */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <Features />
          </div>

          {/* Project Structure */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <ProjectStructure />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            더 자세한 정보는{' '}
            <a
              href="https://github.com/your-username/ai-portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              GitHub 저장소
            </a>
            에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
