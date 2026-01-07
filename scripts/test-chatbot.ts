/**
 * 챗봇 테스트 스크립트
 * 하드코딩 응답과 LLM 폴백을 테스트
 */

import dotenv from 'dotenv';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL || 
  'https://zdpehfjfqrvfmkpnyzbz.supabase.co/functions/v1/ai-portfolio';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface TestCase {
  name: string;
  question: string;
  expectedType: 'hardcoded' | 'llm';
  description: string;
}

const testCases: TestCase[] = [
  {
    name: '기술 스택 질문 (하드코딩)',
    question: '어떤 기술 스택을 사용하세요?',
    expectedType: 'hardcoded',
    description: '하드코딩된 템플릿 응답이어야 함'
  },
  {
    name: 'React 경험 질문 (하드코딩)',
    question: 'React 경험이 있나요?',
    expectedType: 'hardcoded',
    description: '하드코딩된 템플릿 응답이어야 함'
  },
  {
    name: '최근 프로젝트 질문 (하드코딩)',
    question: '가장 최근에 진행한 프로젝트는 무엇인가요?',
    expectedType: 'hardcoded',
    description: '하드코딩된 템플릿 + DB 데이터 응답이어야 함'
  },
  {
    name: '현재 회사 질문 (하드코딩)',
    question: '현재 회사에서 무엇을 하나요?',
    expectedType: 'hardcoded',
    description: '하드코딩된 템플릿 + DB 데이터 응답이어야 함'
  },
  {
    name: '코드 리뷰 질문 (하드코딩)',
    question: '코드 리뷰 경험이 있나요?',
    expectedType: 'hardcoded',
    description: '하드코딩된 정적 응답이어야 함'
  },
  {
    name: '성능 최적화 질문 (하드코딩)',
    question: 'React 성능 최적화 방법을 설명해주세요',
    expectedType: 'hardcoded',
    description: '하드코딩된 정적 응답이어야 함'
  },
  {
    name: '이름 질문 (하드코딩)',
    question: '이름이 뭐예요?',
    expectedType: 'hardcoded',
    description: '하드코딩된 템플릿 + DB 데이터 응답이어야 함'
  },
  {
    name: '맥락 기반 질문 (하드코딩 시도)',
    question: '그 프로젝트에서 더 자세히 설명해주세요',
    expectedType: 'hardcoded',
    description: '맥락 처리 후 하드코딩 응답 시도'
  },
  {
    name: '복잡한 질문 (LLM 폴백)',
    question: '프로젝트에서 가장 어려웠던 기술적 도전과제는 무엇이었고, 어떻게 해결했나요?',
    expectedType: 'llm',
    description: '하드코딩 매칭 실패 시 LLM 폴백'
  },
  {
    name: '인사말 (하드코딩)',
    question: '안녕하세요',
    expectedType: 'hardcoded',
    description: '인사말 하드코딩 응답'
  }
];

async function testQuestion(question: string, conversationHistory: any[] = []): Promise<{
  response: string;
  responseTime: number;
  responseLength: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: question,
        conversationHistory
      }),
    });

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`API Error: ${data.error || data.details || 'Unknown error'}`);
    }

    return {
      response: data.response,
      responseTime,
      responseLength: data.response?.length || 0
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'} (${responseTime}ms)`);
  }
}

async function runTests() {
  console.log('🧪 챗봇 테스트 시작\n');
  console.log(`📍 Edge Function URL: ${EDGE_FUNCTION_URL}\n`);
  console.log('='.repeat(80));

  const results: Array<{
    testCase: TestCase;
    success: boolean;
    responseTime: number;
    responseLength: number;
    error?: string;
  }> = [];

  let conversationHistory: any[] = [];

  for (const testCase of testCases) {
    console.log(`\n📝 테스트: ${testCase.name}`);
    console.log(`   질문: "${testCase.question}"`);
    console.log(`   예상: ${testCase.expectedType === 'hardcoded' ? '하드코딩 응답' : 'LLM 폴백'}`);
    
    try {
      const result = await testQuestion(testCase.question, conversationHistory);
      
      // 대화 히스토리 업데이트
      conversationHistory.push(
        { role: 'user', content: testCase.question },
        { role: 'assistant', content: result.response }
      );
      conversationHistory = conversationHistory.slice(-10); // 최근 10개만 유지

      console.log(`   ✅ 성공 (${result.responseTime}ms, ${result.responseLength}자)`);
      console.log(`   응답: ${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}`);
      
      results.push({
        testCase,
        success: true,
        responseTime: result.responseTime,
        responseLength: result.responseLength
      });

      // 응답 시간이 짧으면 하드코딩, 길면 LLM (대략적인 판단)
      const isLikelyHardcoded = result.responseTime < 500;
      if (testCase.expectedType === 'hardcoded' && !isLikelyHardcoded) {
        console.log(`   ⚠️  경고: 하드코딩 응답 예상이지만 응답 시간이 깁니다 (${result.responseTime}ms)`);
      }
    } catch (error) {
      console.log(`   ❌ 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        testCase,
        success: false,
        responseTime: 0,
        responseLength: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 요청 간 딜레이 (Rate limiting 방지)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 결과 요약
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 테스트 결과 요약\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const hardcodedTests = results.filter(r => r.testCase.expectedType === 'hardcoded' && r.success);
  const llmTests = results.filter(r => r.testCase.expectedType === 'llm' && r.success);

  const avgResponseTime = successful > 0
    ? Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / successful)
    : 0;

  const avgHardcodedTime = hardcodedTests.length > 0
    ? Math.round(hardcodedTests.reduce((sum, r) => sum + r.responseTime, 0) / hardcodedTests.length)
    : 0;

  const avgLlmTime = llmTests.length > 0
    ? Math.round(llmTests.reduce((sum, r) => sum + r.responseTime, 0) / llmTests.length)
    : 0;

  console.log(`✅ 성공: ${successful}/${testCases.length}`);
  console.log(`❌ 실패: ${failed}/${testCases.length}`);
  console.log(`\n⚡ 응답 시간:`);
  console.log(`   평균: ${avgResponseTime}ms`);
  console.log(`   하드코딩 평균: ${avgHardcodedTime}ms`);
  console.log(`   LLM 평균: ${avgLlmTime}ms`);

  console.log(`\n💰 비용 최적화:`);
  const hardcodedRate = (hardcodedTests.length / successful * 100).toFixed(1);
  console.log(`   하드코딩 응답 비율: ${hardcodedRate}%`);
  console.log(`   LLM 호출 비율: ${((llmTests.length / successful) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log(`\n❌ 실패한 테스트:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.testCase.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

// 실행
runTests().catch(console.error);

