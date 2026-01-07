import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight - 가장 먼저 처리
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // POST 요청만 처리
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 환경 변수
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!GEMINI_API_KEY || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    // 요청 본문 파싱
    const { message, conversationHistory = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    async function generateChatCompletion(
      systemPrompt: string,
      userMessage: string
    ): Promise<string> {
      const response = await fetch(GEMINI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n사용자 질문: ${userMessage}` },
              ],
            },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(`Gemini Chat error: ${JSON.stringify(data)}`);
      return data.candidates[0]?.content?.parts[0]?.text || "";
    }

    // 질문 정규화
    function normalizeQuestion(question: string): string {
      return question
        .toLowerCase()
        .trim()
        .replace(/[^\w\s가-힣]/g, "")
        .replace(/\s+/g, " ");
    }

    // 키워드 추출
    function extractKeywords(question: string): string[] {
      return normalizeQuestion(question)
        .split(/\s+/)
        .filter((word) => word.length > 1);
    }

    // Supabase에서 hardcoded_responses 데이터 가져오기 (캐싱)
    let cachedHardcodedResponses: any[] | null = null;
    async function getHardcodedResponses(): Promise<any[]> {
      if (cachedHardcodedResponses) {
        return cachedHardcodedResponses;
      }
      try {
        const { data, error } = await supabaseAdmin
          .from("hardcoded_responses")
          .select("*")
          .order("id");
        if (error) {
          console.error("Failed to fetch hardcoded responses:", error);
          return [];
        }
        cachedHardcodedResponses = data || [];
        return cachedHardcodedResponses;
      } catch (error) {
        console.error("Error fetching hardcoded responses:", error);
        return [];
      }
    }

    // 정확 매칭
    async function exactMatch(query: string): Promise<any> {
      const normalized = normalizeQuestion(query);
      const hardcodedQuestions = await getHardcodedResponses();
      for (const q of hardcodedQuestions) {
        for (const p of q.patterns || []) {
          if (normalizeQuestion(p) === normalized) {
            return q;
          }
        }
      }
      return null;
    }

    // 키워드 매칭 (하드코딩 질문 패턴)
    async function keywordMatchPattern(query: string): Promise<any> {
      const normalized = normalizeQuestion(query);
      const questionKeywords = extractKeywords(query);
      const hardcodedQuestions = await getHardcodedResponses();

      let bestMatch: any = null;
      let bestScore = 0;

      for (const pattern of hardcodedQuestions) {
        if (
          pattern.match_type !== "keyword" &&
          pattern.match_type !== "similarity"
        ) {
          continue;
        }

        const patternKeywords = (pattern.keywords || []).map((k: string) =>
          k.toLowerCase()
        );
        const matchedKeywords = questionKeywords.filter((qk) =>
          patternKeywords.some((pk) => qk.includes(pk) || pk.includes(qk))
        );

        const score =
          matchedKeywords.length /
          Math.max(patternKeywords.length, questionKeywords.length);

        if (score >= 0.3 && score > bestScore) {
          bestScore = score;
          bestMatch = pattern;
        }
      }

      return bestMatch;
    }

    // 템플릿 렌더링
    function renderTemplate(
      template: string,
      data: Record<string, any>
    ): string {
      let result = template;
      const regex = /\{\{(\w+)\}\}/g;
      result = result.replace(regex, (match, key) => {
        const value = data[key];
        if (value === undefined || value === null) return "";
        if (Array.isArray(value)) return value.join(", ");
        return String(value);
      });
      
      // 빈 값이나 "없음", "없습니다"가 포함된 라인 제거
      result = result
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          // 빈 라인은 유지 (구조 유지)
          if (trimmed === "") return true;
          // "없음" 또는 "없습니다"가 포함된 라인 제거
          if (trimmed.includes("없음") || trimmed.includes("없습니다")) return false;
          // **카테고리**: (빈 값) 형태의 라인 제거
          if (/^\*\*[^*]+\*\*:\s*$/.test(trimmed)) return false;
          // **카테고리**: 없음 형태의 라인 제거
          if (/^\*\*[^*]+\*\*:\s*없음/.test(trimmed)) return false;
          return true;
        })
        .join("\n");
      
      // 연속된 빈 줄 정리 (최대 2개 연속만 허용)
      result = result.replace(/\n{3,}/g, "\n\n");
      
      return result.trim();
    }

    // 맥락 참조 감지 및 처리
    function detectContextReference(
      query: string,
      history: any[]
    ): {
      hasReference: boolean;
      referencedEntity?: string;
      entityType?: string;
    } {
      const contextKeywords = [
        "그",
        "그것",
        "위에서",
        "앞서",
        "이전에",
        "방금",
        "그 프로젝트",
        "그 기술",
      ];
      const lowerQuery = query.toLowerCase();

      const hasReference = contextKeywords.some((kw) =>
        lowerQuery.includes(kw)
      );

      if (!hasReference) {
        return { hasReference: false };
      }

      // 이전 대화에서 엔티티 추출 (프로젝트명, 기술명 등)
      let referencedEntity: string | undefined;
      let entityType: string | undefined;

      if (history.length > 0) {
        // 최근 응답에서 프로젝트명, 기술명 추출
        const recentResponses = history
          .filter((m: any) => m.role === "assistant")
          .slice(-3)
          .map((m: any) => m.content)
          .join(" ");

        // 프로젝트명 패턴 (볼드 처리된 것)
        const projectMatch = recentResponses.match(/\*\*([^*]+)\*\*/g);
        if (projectMatch && lowerQuery.includes("프로젝트")) {
          referencedEntity = projectMatch[0].replace(/\*\*/g, "");
          entityType = "project";
        }

        // 기술명 패턴
        if (!referencedEntity && lowerQuery.includes("기술")) {
          const techMatch = recentResponses.match(/\*\*([^*]+)\*\*/g);
          if (techMatch) {
            referencedEntity = techMatch[0].replace(/\*\*/g, "");
            entityType = "technology";
          }
        }
      }

      return {
        hasReference,
        referencedEntity,
        entityType,
      };
    }

    // 하드코딩 질문 매칭 (우선순위: 정확 > 키워드)
    async function matchHardcodedQuestion(
      query: string
    ): Promise<string | null> {
      // 맥락 참조가 있는 경우 처리
      const contextRef = detectContextReference(query, conversationHistory);
      if (contextRef.hasReference && contextRef.referencedEntity) {
        // 맥락 기반 질문도 하드코딩으로 처리 시도
        // 예: "그 프로젝트에서 더 자세히 설명해주세요"
        if (contextRef.entityType === "project") {
          const { data: projects } = await supabaseAdmin
            .from("project")
            .select("*");

          if (projects) {
            const matchedProject = projects.find((p: any) =>
              p.project_name?.includes(contextRef.referencedEntity || "")
            );

            if (matchedProject) {
              return `**${
                matchedProject.project_name
              }** 프로젝트에 대해 더 자세히 설명드리면:\n\n${
                matchedProject.description
              }\n\n**역할**: ${matchedProject.role}\n**기술 스택**: ${
                matchedProject.technologies?.join(", ") || ""
              }`;
            }
          }
        }
      }

      // 1. 정확 매칭
      let matched = await exactMatch(query);
      if (!matched) {
        // 2. 키워드 매칭
        matched = await keywordMatchPattern(query);
      }

      if (!matched) {
        return null;
      }

      // 정적 응답인 경우 바로 반환
      if (matched.response_type === "static") {
        return matched.template;
      }

      // 템플릿인 경우 DB에서 데이터 가져와서 채우기
      const templateData: Record<string, any> = {};

      try {
        // Personal 정보
        if (matched.category === "personal") {
          try {
            const { data: personal, error } = await supabaseAdmin
              .from("portfolio")
              .select("*")
              .maybeSingle();
            if (personal && !error) {
              templateData.name = personal.name || "";
              templateData.email = personal.email || "";
              templateData.phone = personal.phone || "";
              templateData.github = personal.github || "";
            }
          } catch (error) {
            console.warn("Failed to fetch personal info:", error);
          }
        }

        // Skills 정보
        if (matched.category === "skills") {
          const { data: skills } = await supabaseAdmin
            .from("skills")
            .select("*");
          if (skills) {
            const grouped: Record<string, string[]> = {
              frontend: [],
              backend: [],
              database: [],
              tools: [],
            };
            skills.forEach((skill: any) => {
              const cat = skill.category?.toLowerCase() || "";
              if (grouped[cat]) {
                grouped[cat].push(skill.skill_name);
              }
            });
            templateData.frontend_skills =
              grouped.frontend.length > 0 ? grouped.frontend.join(", ") : "";
            templateData.backend_skills =
              grouped.backend.length > 0 ? grouped.backend.join(", ") : "";
            templateData.database_skills =
              grouped.database.length > 0 ? grouped.database.join(", ") : "";
            templateData.tools_skills =
              grouped.tools.length > 0 ? grouped.tools.join(", ") : "";

            // React/TypeScript 관련 프로젝트 찾기
            const { data: projects } = await supabaseAdmin
              .from("project")
              .select("*");
            if (projects) {
              const reactProjects = projects
                .filter((p: any) =>
                  p.technologies?.some((t: string) =>
                    t.toLowerCase().includes("react")
                  )
                )
                .map((p: any) => p.project_name);
              templateData.react_projects =
                reactProjects.length > 0
                  ? `${reactProjects.join(", ")} 프로젝트에서 사용했습니다.`
                  : "여러 프로젝트에서 사용했습니다.";

              const tsProjects = projects
                .filter((p: any) =>
                  p.technologies?.some((t: string) =>
                    t.toLowerCase().includes("typescript")
                  )
                )
                .map((p: any) => p.project_name);
              templateData.typescript_projects =
                tsProjects.length > 0
                  ? `${tsProjects.join(", ")} 프로젝트에서 사용했습니다.`
                  : "여러 프로젝트에서 사용했습니다.";

              const frameworks = new Set<string>();
              projects.forEach((p: any) => {
                p.technologies?.forEach((t: string) => {
                  if (
                    ["react", "vue", "angular", "next", "svelte"].some((f) =>
                      t.toLowerCase().includes(f)
                    )
                  ) {
                    frameworks.add(t);
                  }
                });
              });
              templateData.frontend_frameworks =
                frameworks.size > 0 ? Array.from(frameworks).join(", ") : "";
            }
          }
        }

        // Projects 정보
        if (matched.category === "projects") {
          const { data: projects } = await supabaseAdmin
            .from("project")
            .select("*")
            .order("created_at", { ascending: false });
          if (projects && projects.length > 0) {
            const latest = projects[0];
            templateData.project_name = latest.project_name || "";
            templateData.description = latest.description || "";
            templateData.role = latest.role || "";
            templateData.technologies = latest.technologies?.join(", ") || "";
            templateData.github = latest.github || "";
          }
        }

        // Experience 정보
        if (matched.category === "experience") {
          const { data: careers } = await supabaseAdmin
            .from("career")
            .select("*")
            .order("start_date", { ascending: false });
          if (careers && careers.length > 0) {
            const current =
              careers.find(
                (c: any) => c.end_date?.includes("현재") || !c.end_date
              ) || careers[0];
            templateData.current_company = current.company || "";
            templateData.position = current.position || "";
            templateData.current_description = current.description || "";
            templateData.current_technologies =
              current.technologies?.join(", ") || "";

            // 경력 기간 계산
            if (careers.length > 0) {
              const first = careers[careers.length - 1];
              const startYear = first.start_date
                ? parseInt(first.start_date.split(".")[0])
                : null;
              const currentYear = new Date().getFullYear();
              if (startYear) {
                templateData.total_years = currentYear - startYear;
                templateData.career_summary = `${careers.length}개 회사에서 근무했습니다.`;
              }
            }
          }
        }

        // Education 정보
        if (matched.template.includes("{{education_info}}")) {
          try {
            const { data: portfolio } = await supabaseAdmin
              .from("portfolio")
              .select("*")
              .maybeSingle();
            if (portfolio && portfolio.education) {
              templateData.education_info = portfolio.education;
            } else {
              templateData.education_info = "";
            }
          } catch (error) {
            console.warn("Failed to fetch education info:", error);
            templateData.education_info = "";
          }
        }

        // 자기소개
        if (matched.template.includes("{{summary}}")) {
          try {
            const { data: portfolio } = await supabaseAdmin
              .from("portfolio")
              .select("*")
              .maybeSingle();
            if (portfolio) {
              templateData.name = portfolio.name || "";
              templateData.summary = portfolio.summary || "";
              templateData.career_highlights =
                "주요 경력과 프로젝트에 대해 더 자세히 물어보시면 설명드리겠습니다.";
            }
          } catch (error) {
            console.warn("Failed to fetch summary:", error);
          }
        }

        // 리더십 경험
        if (matched.template.includes("{{leadership_experience}}")) {
          const { data: careers } = await supabaseAdmin
            .from("career")
            .select("*");
          const hasLeadership = careers?.some(
            (c: any) =>
              c.description?.toLowerCase().includes("리더") ||
              c.position?.toLowerCase().includes("리더") ||
              c.position?.toLowerCase().includes("시니어")
          );
          templateData.leadership_experience = hasLeadership
            ? "팀 리더나 시니어 개발자로서 팀을 이끌고 멘토링한 경험이 있습니다."
            : "팀 내에서 기술적 의사결정에 참여하고 동료들을 지원한 경험이 있습니다.";
        }

        return renderTemplate(matched.template, templateData);
      } catch (error) {
        console.error("Template rendering error:", error);
        return matched.template; // 에러 시 템플릿 그대로 반환
      }
    }

    // 기존 keyword_responses 테이블에서 매칭
    async function keywordMatchFromDB(query: string): Promise<string | null> {
      try {
        const { data } = await supabaseAdmin
          .from("keyword_responses")
          .select("response")
          .ilike("keyword", `%${query.toLowerCase().trim()}%`)
          .limit(1)
          .maybeSingle();
        return data?.response || null;
      } catch (error) {
        console.error("Keyword match error:", error);
        return null;
      }
    }

    async function getRelevantData(categories: string[]): Promise<string[]> {
      try {
        const contexts: string[] = [];

        // Skills 가져오기
        if (categories.length === 0 || categories.includes("skills")) {
          const { data: skills } = await supabaseAdmin
            .from("skills")
            .select("*");
          if (skills) {
            skills.forEach((skill) => {
              const proficiencyText = skill.proficiency
                ? ` (숙련도: ${skill.proficiency})`
                : "";
              const descriptionText = skill.description
                ? `\n${skill.description}`
                : "";
              contexts.push(
                `기술: ${skill.skill_name}${proficiencyText}\n카테고리: ${skill.category}${descriptionText}`
              );
            });
          }
        }

        // Projects 가져오기
        if (categories.length === 0 || categories.includes("projects")) {
          const { data: projects } = await supabaseAdmin
            .from("project")
            .select("*");
          if (projects) {
            projects.forEach((project) => {
              const techStack = project.technologies
                ? `\n사용 기술: ${project.technologies.join(", ")}`
                : "";
              contexts.push(
                `"${project.project_name}" 프로젝트 (${project.role})\n${project.description}${techStack}`
              );
            });
          }
        }

        // Personal info 가져오기
        if (categories.length === 0 || categories.includes("personal")) {
          const { data: personal } = await supabaseAdmin
            .from("portfolio")
            .select("*")
            .single();
          if (personal) {
            contexts.push(
              `이름: ${personal.name}\n이메일: ${personal.email}${
                personal.github ? `\nGitHub: ${personal.github}` : ""
              }`
            );
          }
        }

        return contexts;
      } catch (error) {
        console.error("Data fetch error:", error);
        return [];
      }
    }

    async function generateResponse(
      query: string,
      context: string[],
      categories: string[]
    ): Promise<string> {
      const systemPrompt = `당신은 개발자 김하늬를 대신해서 친근하고 자연스럽게 대화하는 AI 어시스턴트입니다.

**중요: 절대 규칙**
- 아래 제공된 "김하늬 이력서 정보"는 Supabase 데이터베이스의 personal, skills, career, project 테이블에서 직접 가져온 실제 데이터입니다
- **무조건 이 Supabase 테이블 데이터만을 기반으로 답변하세요**
- 제공된 정보에 명시된 내용만 사용하세요
- 제공된 정보에 없는 기술, 경력, 프로젝트는 절대 언급하지 마세요. 일반적인 기술을 추측하거나 상상해서 말하지 마세요.
- 당신의 일반적인 개발자 지식을 사용하지 말고, 오직 제공된 Supabase 테이블 정보만 사용하세요
- 정보가 불충분하면 "제 이력서에 그 부분이 없네요"라고 솔직하게 말하세요

답변 가이드라인:
- 친근하고 편안한 말투로 대화하듯이 답변하세요
- 1인칭 시점으로 답변하세요 ("저는...", "제가...")
- 김하늬의 관점에서 답변하세요
- 한국어로 답변하세요
- 기술 스택을 물어보면 제공된 정보의 모든 기술을 빠짐없이 나열하세요
- "가장 최근 프로젝트" 또는 "최근에 한 일"을 물어보면 TeamRemited(현재 회사)에서 작업한 내용을 자세히 설명하세요
- 기술명, 프로젝트명, 회사명 등 중요한 단어는 **볼드**로 강조하세요 (예: **TypeScript**, **React Native**, **영끌 App**)
- 따옴표("")를 사용하지 말고, 대신 볼드 처리를 사용하세요
${
  categories.length > 0
    ? `- 이 질문은 다음 주제에 관한 것입니다: ${categories.join(", ")}`
    : ""
}`;
      const contextText =
        context.length > 0
          ? `\n\n===김하늬 이력서 정보 (이것만 사용하세요)===\n${context.join(
              "\n\n"
            )}`
          : "";
      return await generateChatCompletion(
        systemPrompt,
        `${query}${contextText}`
      );
    }

    // 하드코딩 질문 매칭 (최우선)
    const hardcodedResponse = await matchHardcodedQuestion(message);
    if (hardcodedResponse) {
      console.log("✅ Hardcoded response matched");
      return new Response(JSON.stringify({ response: hardcodedResponse }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 기존 keyword_responses 테이블 매칭
    const keywordResponse = await keywordMatchFromDB(message);
    if (keywordResponse) {
      console.log("✅ Keyword response matched");
      return new Response(JSON.stringify({ response: keywordResponse }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 인사말 간단 체크
    const greetings = ["안녕", "안녕하세요", "하이", "헬로", "hello", "hi"];
    if (greetings.some((g) => message.toLowerCase().includes(g))) {
      return new Response(
        JSON.stringify({
          response:
            "안녕하세요! 저는 개발자 김하늬입니다 😊 제 포트폴리오에 대해 궁금한 게 있으시면 편하게 물어보세요. 경력이나 프로젝트, 기술 스택 뭐든지 좋아요!",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 하드코딩 매칭 실패 시에만 LLM 호출 (폴백)
    console.log("⚠️ No hardcoded match found, using LLM fallback");
    console.log("📊 LLM Call Log:", {
      question: message,
      timestamp: new Date().toISOString(),
      conversationLength: conversationHistory.length,
    });

    // 상세한 키워드 기반 카테고리 매칭
    function detectCategories(query: string): string[] {
      const lowerQuery = query.toLowerCase();
      const categories = new Set<string>();

      // Skills 관련 키워드
      const skillsKeywords = [
        "기술",
        "스택",
        "기술스택",
        "다룰 수 있",
        "사용 가능",
        "할 줄 아",
        "사용해",
        "언어",
        "프레임워크",
        "react",
        "next",
        "typescript",
        "javascript",
        "vue",
        "node",
        "개발 도구",
        "툴",
        "tool",
        "skill",
        "능력",
        "역량",
      ];
      if (skillsKeywords.some((kw) => lowerQuery.includes(kw))) {
        categories.add("skills");
      }

      // Projects 관련 키워드
      const projectsKeywords = [
        "프로젝트",
        "만든",
        "개발한",
        "작업한",
        "진행한",
        "참여한",
        "포트폴리오",
        "작품",
        "project",
        "구현",
        "제작",
      ];
      if (projectsKeywords.some((kw) => lowerQuery.includes(kw))) {
        // "최근 프로젝트"는 현재 회사 경력을 의미
        if (
          lowerQuery.includes("최근") ||
          lowerQuery.includes("요즘") ||
          lowerQuery.includes("현재")
        ) {
          categories.add("experience");
        } else {
          categories.add("projects");
        }
      }
      // Personal 관련 키워드
      const personalKeywords = [
        "이름",
        "연락처",
        "이메일",
        "전화",
        "메일",
        "깃허브",
        "github",
        "나이",
        "생년월일",
        "소개",
        "링크드인",
        "linkedin",
        "위치",
        "거주",
        "소개",
      ];
      if (personalKeywords.some((kw) => lowerQuery.includes(kw))) {
        categories.add("personal");
      }

      return Array.from(categories);
    }

    const searchCategories = detectCategories(message);
    console.log("🔍 Detected categories:", searchCategories);

    // 카테고리에 따라 관련 데이터 가져오기
    const contexts = await getRelevantData(searchCategories);
    console.log("📦 Found contexts:", contexts.length);
    console.log(
      "📝 Context preview:",
      contexts.map((c) => c.substring(0, 80))
    );

    const response = await generateResponse(
      message,
      contexts,
      searchCategories
    );

    // LLM 호출 통계 로깅 (선택사항: chat_sessions 테이블에 저장)
    try {
      await supabaseAdmin.from("chat_sessions").insert({
        session_id: "default", // 실제로는 세션 ID를 사용
        question: message,
        response: response,
        extracted_entities: {
          categories: searchCategories,
          hasContextReference: detectContextReference(
            message,
            conversationHistory
          ).hasReference,
        },
      });
    } catch (error) {
      // 로깅 실패는 무시 (선택사항 기능)
      console.warn("Failed to log chat session:", error);
    }

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
