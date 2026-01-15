'use client'

export default function TechStack() {
  const techCategories = [
    {
      category: 'Frontend',
      color: 'purple',
      technologies: [
        { name: 'Next.js 16', description: 'React 프레임워크' },
        { name: 'React', description: 'UI 라이브러리' },
        { name: 'TypeScript', description: '타입 안정성' },
        { name: 'Tailwind CSS', description: '유틸리티 CSS' },
      ]
    },
    {
      category: 'Backend',
      color: 'pink',
      technologies: [
        { name: 'Supabase Edge Functions', description: '서버리스 함수 (Deno)' },
        { name: 'Next.js API Routes', description: '서버 사이드 API' },
      ]
    },
    {
      category: 'Database',
      color: 'blue',
      technologies: [
        { name: 'Supabase PostgreSQL', description: '관계형 데이터베이스' },
        { name: 'pgvector', description: '벡터 확장' },
        { name: 'HNSW Index', description: '고성능 벡터 검색' },
      ]
    },
    {
      category: 'AI',
      color: 'indigo',
      technologies: [
        { name: 'Google Gemini 2.5 Flash', description: '채팅 모델' },
        { name: 'text-embedding-004', description: '임베딩 모델 (768차원)' },
        { name: 'RAG Pipeline', description: '검색 증강 생성' },
      ]
    },
  ]

  const colorClasses = {
    purple: 'bg-purple-50/80 border-purple-100 hover:bg-purple-100/80',
    pink: 'bg-pink-50/80 border-pink-100 hover:bg-pink-100/80',
    blue: 'bg-blue-50/80 border-blue-100 hover:bg-blue-100/80',
    indigo: 'bg-indigo-50/80 border-indigo-100 hover:bg-indigo-100/80',
  }

  const textColorClasses = {
    purple: 'text-purple-700',
    pink: 'text-pink-700',
    blue: 'text-blue-700',
    indigo: 'text-indigo-700',
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">기술 스택</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {techCategories.map((category) => (
          <div
            key={category.category}
            className={`p-6 rounded-2xl border transition-all duration-300 ${colorClasses[category.color as keyof typeof colorClasses]}`}
          >
            <h3 className={`text-xl font-bold mb-4 ${textColorClasses[category.color as keyof typeof textColorClasses]}`}>
              {category.category}
            </h3>
            <div className="space-y-3">
              {category.technologies.map((tech) => (
                <div key={tech.name} className="group">
                  <div className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                    {tech.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {tech.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
