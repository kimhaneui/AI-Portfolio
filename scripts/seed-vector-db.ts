import { readFileSync } from 'fs'
import { join } from 'path'
import { generateEmbedding } from '../lib/openai'
import { supabaseAdmin } from '../lib/supabase'

interface ResumeData {
  personal: {
    name: string
    email: string
    phone: string
    location: string
    github?: string
    linkedin?: string
  }
  summary: string
  experience: Array<{
    company: string
    position: string
    period: string
    description: string
    technologies: string[]
  }>
  education: Array<{
    school: string
    degree: string
    period: string
    description: string
  }>
  skills: {
    frontend: string[]
    backend: string[]
    database: string[]
    tools: string[]
    ai_ml: string[]
  }
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    github?: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
  }>
  languages: Array<{
    language: string
    proficiency: string
  }>
}

// 이력서 데이터를 섹션별로 분할하여 임베딩 생성
function chunkResumeData(resume: ResumeData): Array<{ content: string; metadata: any }> {
  const chunks: Array<{ content: string; metadata: any }> = []

  // 개인 정보
  chunks.push({
    content: `이름: ${resume.personal.name}\n이메일: ${resume.personal.email}\n전화번호: ${resume.personal.phone}\n위치: ${resume.personal.location}${resume.personal.github ? `\nGitHub: ${resume.personal.github}` : ''}${resume.personal.linkedin ? `\nLinkedIn: ${resume.personal.linkedin}` : ''}`,
    metadata: { category: 'personal', section: 'contact' },
  })

  // 요약
  chunks.push({
    content: `프로필 요약:\n${resume.summary}`,
    metadata: { category: 'summary', section: 'overview' },
  })

  // 경력
  resume.experience.forEach((exp, index) => {
    chunks.push({
      content: `경력 ${index + 1}:\n회사: ${exp.company}\n직책: ${exp.position}\n기간: ${exp.period}\n설명: ${exp.description}\n기술 스택: ${exp.technologies.join(', ')}`,
      metadata: { category: 'experience', section: `experience_${index + 1}`, company: exp.company, position: exp.position },
    })
  })

  // 교육
  resume.education.forEach((edu, index) => {
    chunks.push({
      content: `교육 ${index + 1}:\n학교: ${edu.school}\n학위: ${edu.degree}\n기간: ${edu.period}\n설명: ${edu.description}`,
      metadata: { category: 'education', section: `education_${index + 1}`, school: edu.school },
    })
  })

  // 기술 스택
  const skillsContent = `기술 스택:
프론트엔드: ${resume.skills.frontend.join(', ')}
백엔드: ${resume.skills.backend.join(', ')}
데이터베이스: ${resume.skills.database.join(', ')}
도구: ${resume.skills.tools.join(', ')}
AI/ML: ${resume.skills.ai_ml.join(', ')}`
  
  chunks.push({
    content: skillsContent,
    metadata: { category: 'skills', section: 'all_skills' },
  })

  // 프로젝트
  resume.projects.forEach((project, index) => {
    chunks.push({
      content: `프로젝트 ${index + 1}:\n이름: ${project.name}\n설명: ${project.description}\n기술 스택: ${project.technologies.join(', ')}${project.github ? `\nGitHub: ${project.github}` : ''}`,
      metadata: { category: 'projects', section: `project_${index + 1}`, name: project.name },
    })
  })

  // 자격증
  resume.certifications.forEach((cert, index) => {
    chunks.push({
      content: `자격증 ${index + 1}:\n이름: ${cert.name}\n발급 기관: ${cert.issuer}\n취득일: ${cert.date}`,
      metadata: { category: 'certifications', section: `cert_${index + 1}`, name: cert.name },
    })
  })

  // 언어
  const languagesContent = `언어 능력:\n${resume.languages.map(lang => `${lang.language}: ${lang.proficiency}`).join('\n')}`
  chunks.push({
    content: languagesContent,
    metadata: { category: 'languages', section: 'all_languages' },
  })

  return chunks
}

async function seedVectorDB() {
  try {
    console.log('이력서 데이터 로딩 중...')
    const resumePath = join(process.cwd(), 'data', 'resume.json')
    const resumeData: ResumeData = JSON.parse(readFileSync(resumePath, 'utf-8'))

    console.log('이력서 데이터를 섹션별로 분할 중...')
    const chunks = chunkResumeData(resumeData)

    console.log(`총 ${chunks.length}개의 청크 생성됨`)

    // 기존 데이터 삭제 (선택사항)
    console.log('기존 벡터 데이터 삭제 중...')
    await supabaseAdmin.from('resume_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 각 청크에 대해 임베딩 생성 및 저장
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`[${i + 1}/${chunks.length}] 임베딩 생성 중: ${chunk.metadata.category} - ${chunk.metadata.section}`)

      try {
        const embedding = await generateEmbedding(chunk.content)

        const { error } = await supabaseAdmin.from('resume_embeddings').insert({
          content: chunk.content,
          embedding: embedding,
          metadata: chunk.metadata,
        })

        if (error) {
          console.error(`청크 ${i + 1} 저장 실패:`, error)
        } else {
          console.log(`✓ 청크 ${i + 1} 저장 완료`)
        }

        // API rate limit 방지를 위한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`청크 ${i + 1} 처리 중 오류:`, error)
      }
    }

    console.log('\n벡터 DB 초기화 완료!')
  } catch (error) {
    console.error('벡터 DB 초기화 실패:', error)
    process.exit(1)
  }
}

// 스크립트 실행
seedVectorDB()

