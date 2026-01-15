'use client'

export default function Features() {
  const features = [
    {
      icon: '⚡',
      title: '즉시 응답 시스템',
      description: '자주 묻는 질문에 대한 사전 준비된 답변을 API 호출 없이 즉시 제공하여 빠른 사용자 경험을 제공합니다.',
      color: 'yellow',
    },
    {
      icon: '🔍',
      title: '지능형 벡터 검색',
      description: '의미론적 벡터 검색으로 정확한 정보를 제공하며, 질문 분류를 통한 토큰 최적화로 비용을 절감합니다.',
      color: 'blue',
    },
    {
      icon: '📝',
      title: '마크다운 지원',
      description: '코드 블록, 리스트, 강조 등 풍부한 형식을 지원하여 가독성 높은 응답을 제공합니다.',
      color: 'purple',
    },
    {
      icon: '🎯',
      title: '질문 분류 시스템',
      description: '질문을 8개 카테고리로 자동 분류하여 필요한 데이터만 검색하여 효율성을 극대화합니다.',
      color: 'pink',
    },
    {
      icon: '🚀',
      title: '고성능 검색',
      description: 'HNSW 인덱스를 활용한 고성능 벡터 검색으로 빠른 응답 시간을 보장합니다.',
      color: 'indigo',
    },
    {
      icon: '🛡️',
      title: 'Hallucination 방지',
      description: 'RAG 파이프라인을 통해 정확한 정보만을 기반으로 답변을 생성하여 잘못된 정보 제공을 방지합니다.',
      color: 'green',
    },
  ]

  const colorClasses = {
    yellow: 'bg-yellow-50/80 border-yellow-100',
    blue: 'bg-blue-50/80 border-blue-100',
    purple: 'bg-purple-50/80 border-purple-100',
    pink: 'bg-pink-50/80 border-pink-100',
    indigo: 'bg-indigo-50/80 border-indigo-100',
    green: 'bg-green-50/80 border-green-100',
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">주요 기능</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-105 ${colorClasses[feature.color as keyof typeof colorClasses]}`}
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
