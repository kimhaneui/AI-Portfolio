/**
 * 템플릿 엔진 유틸리티
 * 템플릿 문자열의 변수를 실제 데이터로 치환
 */

interface TemplateData {
  [key: string]: string | string[] | undefined
}

/**
 * 템플릿 문자열의 변수를 데이터로 치환
 * @param template 템플릿 문자열 (예: "제 이름은 {{name}}입니다.")
 * @param data 치환할 데이터 객체
 * @returns 치환된 문자열
 */
export function renderTemplate(template: string, data: TemplateData): string {
  let result = template
  
  // {{variable}} 패턴을 찾아서 치환
  const regex = /\{\{(\w+)\}\}/g
  result = result.replace(regex, (match, key) => {
    const value = data[key]
    
    if (value === undefined || value === null) {
      // 변수가 없으면 빈 문자열 반환
      return ''
    }
    
    // 배열인 경우 쉼표로 구분하여 문자열로 변환
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    return String(value)
  })
  
  return result
}

/**
 * 배열을 읽기 좋은 형식으로 포맷팅
 * @param items 배열
 * @param separator 구분자 (기본값: ", ")
 * @returns 포맷팅된 문자열
 */
export function formatArray(items: string[], separator: string = ', '): string {
  return items.join(separator)
}

/**
 * 기술 스택을 카테고리별로 그룹화하여 포맷팅
 */
export function formatSkillsByCategory(skills: Array<{ skill_name: string; category: string }>): {
  frontend_skills: string
  backend_skills: string
  database_skills: string
  tools_skills: string
} {
  const grouped: { [key: string]: string[] } = {
    frontend: [],
    backend: [],
    database: [],
    tools: []
  }
  
  skills.forEach(skill => {
    const category = skill.category.toLowerCase()
    if (grouped[category]) {
      grouped[category].push(skill.skill_name)
    }
  })
  
  return {
    frontend_skills: grouped.frontend.join(', ') || '없음',
    backend_skills: grouped.backend.join(', ') || '없음',
    database_skills: grouped.database.join(', ') || '없음',
    tools_skills: grouped.tools.join(', ') || '없음'
  }
}

