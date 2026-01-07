import { config } from 'dotenv'
import { join } from 'path'
import { generateEmbedding } from '../lib/gemini'
import { supabaseAdmin } from '../lib/supabase'

// .env 파일 로드
config({ path: join(process.cwd(), '.env.local') })

interface PortfolioData {
  id: string
  name: string
  email: string
  phone: string
  location: string
  github?: string
  linkedin?: string
  summary?: string
}

interface CareerData {
  company_name: string
  position: string
  start_date: string
  end_date?: string | null
  is_current?: boolean
  main_tasks?: string
  description: string
  technologies?: string[]
}

interface ProjectData {
  id: string
  project_name: string
  description: string
  technologies?: string[]
  github?: string
  role: string
}

interface SkillsData {
  category: string
  skill_name: string
  proficiency?: string
  description?: string
}

async function fetchTableData() {
  console.log('Supabase 테이블에서 데이터 가져오는 중...')

  // Portfolio 데이터
  const { data: portfolio, error: portfolioError } = await supabaseAdmin
    .from('portfolio')
    .select('*')
    .single()

  if (portfolioError && portfolioError.code !== 'PGRST116') {
    console.error('Portfolio 데이터 가져오기 실패:', portfolioError)
  }

  // Career 데이터
  const { data: careers, error: careerError } = await supabaseAdmin
    .from('career')
    .select('*')
    .order('start_date', { ascending: false })

  if (careerError) {
    console.error('Career 데이터 가져오기 실패:', careerError)
  }

  // Project 데이터
  const { data: projects, error: projectError } = await supabaseAdmin
    .from('project')
    .select('*')

  if (projectError) {
    console.error('Project 데이터 가져오기 실패:', projectError)
  }

  // Skills 데이터
  const { data: skills, error: skillsError } = await supabaseAdmin
    .from('skills')
    .select('*')

  if (skillsError) {
    console.error('Skills 데이터 가져오기 실패:', skillsError)
  }

  return {
    portfolio: portfolio as PortfolioData | null,
    careers: (careers as CareerData[]) || [],
    projects: (projects as ProjectData[]) || [],
    skills: (skills as SkillsData[]) || [],
  }
}

function createChunks(data: {
  portfolio: PortfolioData | null
  careers: CareerData[]
  projects: ProjectData[]
  skills: SkillsData[]
}): Array<{ content: string; metadata: any }> {
  const chunks: Array<{ content: string; metadata: any }> = []

  // Portfolio 정보
  if (data.portfolio) {
    const p = data.portfolio
    chunks.push({
      content: `이름: ${p.name}\n이메일: ${p.email}\n전화번호: ${p.phone}\n위치: ${p.location}${p.github ? `\nGitHub: ${p.github}` : ''}${p.linkedin ? `\nLinkedIn: ${p.linkedin}` : ''}`,
      metadata: { category: 'personal', section: 'contact', source: 'portfolio_table' },
    })

    if (p.summary) {
      chunks.push({
        content: `프로필 요약:\n${p.summary}`,
        metadata: { category: 'summary', section: 'overview', source: 'portfolio_table' },
      })
    }
  }

  // Career 정보
  data.careers.forEach((career, index) => {
    const period = career.end_date
      ? `${career.start_date} - ${career.end_date}`
      : `${career.start_date} - 현재`

    const techStack = career.technologies
      ? `\n사용한 기술: ${Array.isArray(career.technologies) ? career.technologies.join(', ') : career.technologies}`
      : ''

    chunks.push({
      content: `${career.company_name}에서 ${career.position}으로 근무 (${period})\n${career.description}${techStack}`,
      metadata: {
        category: 'experience',
        section: `experience_${index + 1}`,
        company: career.company_name,
        position: career.position,
        source: 'career_table',
      },
    })
  })

  // Project 정보
  data.projects.forEach((project, index) => {
    const techStack = project.technologies
      ? `\n사용 기술: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}`
      : ''

    const github = project.github ? `\nGitHub 저장소: ${project.github}` : ''

    chunks.push({
      content: `"${project.project_name}" 프로젝트 (${project.role})\n${project.description}${techStack}${github}`,
      metadata: {
        category: 'projects',
        section: `project_${index + 1}`,
        name: project.project_name,
        source: 'project_table',
      },
    })
  })

  // Skills 정보 - 각 스킬을 개별 청크로 생성
  data.skills.forEach((skill) => {
    const proficiencyText = skill.proficiency ? ` (숙련도: ${skill.proficiency})` : ''
    const descriptionText = skill.description ? `\n${skill.description}` : ''

    chunks.push({
      content: `기술: ${skill.skill_name}${proficiencyText}\n카테고리: ${skill.category}${descriptionText}`,
      metadata: {
        category: 'skills',
        section: skill.category.toLowerCase(),
        skill_category: skill.category,
        skill_name: skill.skill_name,
        source: 'skills_table',
      },
    })
  })

  return chunks
}

async function seedVectorDB() {
  try {
    console.log('=== Supabase 테이블 데이터 기반 벡터 DB 생성 시작 ===\n')

    // 1. Supabase 테이블에서 데이터 가져오기
    const data = await fetchTableData()

    console.log(`✓ Portfolio: ${data.portfolio ? '1개' : '0개'}`)
    console.log(`✓ Career: ${data.careers.length}개`)
    console.log(`✓ Project: ${data.projects.length}개`)
    console.log(`✓ Skills: ${data.skills.length}개\n`)

    // 2. 청크 생성
    console.log('데이터를 청크로 분할 중...')
    const chunks = createChunks(data)
    console.log(`총 ${chunks.length}개의 청크 생성됨\n`)

    // 3. 기존 벡터 데이터 삭제
    console.log('기존 벡터 데이터 삭제 중...')
    const { error: deleteError } = await supabaseAdmin
      .from('resume_embeddings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.warn('기존 데이터 삭제 중 오류:', deleteError.message)
    } else {
      console.log('✓ 기존 데이터 삭제 완료\n')
    }

    // 4. 각 청크에 대해 임베딩 생성 및 저장
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const progress = `[${i + 1}/${chunks.length}]`

      try {
        console.log(`${progress} 임베딩 생성 중: ${chunk.metadata.category} - ${chunk.metadata.section}`)

        // 임베딩 생성
        const embedding = await generateEmbedding(chunk.content)

        // Supabase에 저장
        const { error } = await supabaseAdmin.from('resume_embeddings').insert({
          content: chunk.content,
          embedding: embedding,
          metadata: chunk.metadata,
        })

        if (error) {
          console.error(`  ✗ 저장 실패:`, error.message)
          failCount++
        } else {
          console.log(`  ✓ 저장 완료`)
          successCount++
        }

        // API rate limit 방지
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`  ✗ 처리 중 오류:`, error instanceof Error ? error.message : error)
        failCount++
      }
    }

    console.log('\n=== 벡터 DB 생성 완료 ===')
    console.log(`✓ 성공: ${successCount}개`)
    console.log(`✗ 실패: ${failCount}개`)

    if (failCount > 0) {
      console.log('\n⚠️  일부 청크 저장에 실패했습니다. 로그를 확인해주세요.')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ 벡터 DB 초기화 실패:', error)
    process.exit(1)
  }
}

// 스크립트 실행
seedVectorDB()
