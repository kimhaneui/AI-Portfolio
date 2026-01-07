/**
 * 비용 추적 및 분석 유틸리티
 * LLM 호출 통계를 추적하여 비용 최적화에 활용
 */

interface LLMCallLog {
  question: string;
  timestamp: string;
  responseLength: number;
  estimatedTokens: number;
  matchedCategory?: string;
  usedLLM: boolean;
}

/**
 * 응답 길이로부터 토큰 수 추정 (대략적인 계산)
 * 1 토큰 ≈ 4 문자 (한글 기준)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * LLM 호출 로그 생성
 */
export function createLLMCallLog(
  question: string,
  response: string,
  usedLLM: boolean,
  matchedCategory?: string
): LLMCallLog {
  return {
    question,
    timestamp: new Date().toISOString(),
    responseLength: response.length,
    estimatedTokens: estimateTokens(question + response),
    matchedCategory,
    usedLLM,
  };
}

/**
 * 비용 추정 (Gemini 2.5 Flash 기준)
 * Input: $0.075 / 1M tokens
 * Output: $0.30 / 1M tokens
 */
export function estimateCost(tokens: number, isInput: boolean = true): number {
  const pricePerMillion = isInput ? 0.075 : 0.3;
  return (tokens / 1_000_000) * pricePerMillion;
}

/**
 * 통계 요약
 */
export interface CostStats {
  totalCalls: number;
  llmCalls: number;
  hardcodedCalls: number;
  llmCallRate: number;
  estimatedCost: number;
  averageTokensPerCall: number;
}

export function calculateStats(logs: LLMCallLog[]): CostStats {
  const totalCalls = logs.length;
  const llmCalls = logs.filter((log) => log.usedLLM).length;
  const hardcodedCalls = totalCalls - llmCalls;
  const llmCallRate = totalCalls > 0 ? (llmCalls / totalCalls) * 100 : 0;

  const llmLogs = logs.filter((log) => log.usedLLM);
  const totalTokens = llmLogs.reduce(
    (sum, log) => sum + log.estimatedTokens,
    0
  );
  const averageTokensPerCall =
    llmLogs.length > 0 ? totalTokens / llmLogs.length : 0;

  // Input + Output 비용 추정
  const estimatedCost =
    estimateCost(totalTokens * 0.5, true) +
    estimateCost(totalTokens * 0.5, false);

  return {
    totalCalls,
    llmCalls,
    hardcodedCalls,
    llmCallRate,
    estimatedCost,
    averageTokensPerCall,
  };
}

