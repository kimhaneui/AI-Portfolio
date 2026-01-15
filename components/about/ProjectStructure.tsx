'use client'

import { useState } from 'react'

interface TreeNode {
  name: string
  type: 'file' | 'folder'
  description?: string
  children?: TreeNode[]
}

export default function ProjectStructure() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['app', 'components', 'lib']))

  const structure: TreeNode[] = [
    {
      name: 'app',
      type: 'folder',
      description: 'Next.js App Router',
      children: [
        { name: 'page.tsx', type: 'file', description: '홈페이지' },
        { name: 'layout.tsx', type: 'file', description: '루트 레이아웃' },
        { name: 'globals.css', type: 'file', description: '전역 스타일' },
        {
          name: 'chat',
          type: 'folder',
          description: '챗봇 페이지',
          children: [
            { name: 'page.tsx', type: 'file', description: '챗봇 메인 페이지' },
          ]
        },
        {
          name: 'api',
          type: 'folder',
          description: 'API 라우트',
          children: [
            {
              name: 'embed',
              type: 'folder',
              children: [
                { name: 'route.ts', type: 'file', description: '임베딩 API (보존용)' },
              ]
            },
          ]
        },
      ]
    },
    {
      name: 'components',
      type: 'folder',
      description: 'React 컴포넌트',
      children: [
        { name: 'ChatBot.tsx', type: 'file', description: '챗봇 메인 컴포넌트' },
        { name: 'ChatMessage.tsx', type: 'file', description: '채팅 메시지 컴포넌트' },
        { name: 'Sidebar.tsx', type: 'file', description: '사이드바 네비게이션' },
        { name: 'MainContent.tsx', type: 'file', description: '메인 콘텐츠 영역' },
        { name: 'SidebarContext.tsx', type: 'file', description: '사이드바 상태 관리' },
      ]
    },
    {
      name: 'lib',
      type: 'folder',
      description: '유틸리티 라이브러리',
      children: [
        { name: 'gemini.ts', type: 'file', description: 'Google Gemini API 클라이언트' },
        { name: 'supabase.ts', type: 'file', description: 'Supabase 클라이언트' },
        { name: 'markdown.tsx', type: 'file', description: '마크다운 렌더링' },
        { name: 'question-matcher.ts', type: 'file', description: '질문 매칭 및 분류' },
        { name: 'template-engine.ts', type: 'file', description: '템플릿 엔진' },
        { name: 'analytics.ts', type: 'file', description: '분석 및 통계' },
      ]
    },
    {
      name: 'supabase',
      type: 'folder',
      description: 'Supabase 관련 파일',
      children: [
        {
          name: 'functions',
          type: 'folder',
          children: [
            {
              name: 'ai-portfolio',
              type: 'folder',
              description: 'Edge Function',
              children: [
                { name: 'index.ts', type: 'file', description: '메인 RAG 파이프라인' },
                { name: 'deno.json', type: 'file', description: 'Deno 설정' },
                { name: 'README.md', type: 'file', description: '배포 가이드' },
              ]
            },
          ]
        },
      ]
    },
    {
      name: 'data',
      type: 'folder',
      description: '정적 데이터',
      children: [
        { name: 'resume.json', type: 'file', description: '이력서 데이터 (참고용)' },
        { name: 'predefined-answers.ts', type: 'file', description: '사전 준비된 질문 답변' },
      ]
    },
    {
      name: 'scripts',
      type: 'folder',
      description: '유틸리티 스크립트',
      children: [
        { name: 'seed-vector-db.ts', type: 'file', description: 'resume.json으로 벡터 DB 생성' },
        { name: 'seed-from-tables.ts', type: 'file', description: 'Supabase 테이블로 벡터 DB 생성' },
        { name: 'test-chatbot.ts', type: 'file', description: '챗봇 테스트 스크립트' },
      ]
    },
  ]

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const renderTree = (nodes: TreeNode[], path: string = '') => {
    return (
      <ul className="ml-4 space-y-1">
        {nodes.map((node) => {
          const nodePath = path ? `${path}/${node.name}` : node.name
          const isExpanded = expanded.has(nodePath)
          const hasChildren = node.children && node.children.length > 0

          return (
            <li key={nodePath} className="text-sm">
              <div className="flex items-center gap-2 py-1 group">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(nodePath)}
                    className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-semibold text-gray-800">{node.name}</span>
                  </button>
                ) : (
                  <span className="text-gray-700">{node.name}</span>
                )}
                {node.description && (
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    - {node.description}
                  </span>
                )}
              </div>
              {hasChildren && isExpanded && (
                <div className="ml-4 border-l-2 border-gray-200 pl-2">
                  {renderTree(node.children!, nodePath)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">프로젝트 구조</h2>
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-gray-200/50">
        <div className="font-mono text-sm">
          {renderTree(structure)}
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600">
            폴더를 클릭하여 확장/축소할 수 있습니다. 각 파일/폴더에 마우스를 올리면 설명을 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  )
}
