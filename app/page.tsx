import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gray-800">
            안녕하세요 프론트 개발자 김하늬입니다.
          </h1>
        </div>

        <div className="space-y-6">
          <section className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">소개</h2>
            <p className="text-gray-700 leading-relaxed">
              궁금한 점은 챗봇을 통해 물어봐주세요 :)
            </p>
          </section>

          <section className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">기술 스택</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
                <strong className="text-purple-700">프론트엔드:</strong>
                <p className="text-gray-700 mt-1">
                  Next.js 16, React, Tailwind CSS
                </p>
              </div>
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
                <strong className="text-purple-700">백엔드:</strong>
                <p className="text-gray-700 mt-1">
                  Next.js Serverless Functions
                </p>
              </div>
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
                <strong className="text-purple-700">데이터베이스:</strong>
                <p className="text-gray-700 mt-1">
                  Supabase (PostgreSQL + pgvector)
                </p>
              </div>
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
                <strong className="text-purple-700">AI 모델:</strong>
                <p className="text-gray-700 mt-1">OpenAI GPT-3.5-turbo</p>
              </div>
            </div>
          </section>
          <div className="text-center">
            <Link href="/chat">
              <button className="group inline-flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200">
                <svg
                  className="w-6 h-6 text-purple-600 group-hover:animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="text-lg font-semibold text-gray-800">
                  챗봇 시작하기
                </span>
                <svg
                  className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
