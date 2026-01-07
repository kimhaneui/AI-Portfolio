/**
 * 질문 횟수 제한 유틸리티
 * API 과금 방지를 위한 질문 횟수 제한 기능
 */

interface RateLimitConfig {
  maxQuestionsPerHour: number; // 시간당 최대 질문 수
  maxQuestionsPerDay: number; // 일일 최대 질문 수
}

interface QuestionLog {
  timestamp: number;
  count: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxQuestionsPerHour: 10, // 시간당 10개
  maxQuestionsPerDay: 20, // 일일 20개
};

const STORAGE_KEYS = {
  HOURLY: 'chatbot_rate_limit_hourly',
  DAILY: 'chatbot_rate_limit_daily',
  CONFIG: 'chatbot_rate_limit_config',
};

/**
 * 현재 시간을 기준으로 시간/일 단위 키 생성
 */
function getHourKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
}

function getDayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

/**
 * 로컬 스토리지에서 질문 로그 가져오기
 */
function getQuestionLogs(key: string): QuestionLog[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const logs: QuestionLog[] = JSON.parse(stored);
    // 24시간 이상 된 로그 제거
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return logs.filter(log => log.timestamp > oneDayAgo);
  } catch {
    return [];
  }
}

/**
 * 질문 로그 저장
 */
function saveQuestionLogs(key: string, logs: QuestionLog[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save question logs:', error);
  }
}

/**
 * 설정 가져오기 (환경 변수 또는 기본값)
 */
export function getRateLimitConfig(): RateLimitConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // 기본값 사용
  }
  
  return DEFAULT_CONFIG;
}

/**
 * 설정 저장
 */
export function setRateLimitConfig(config: RateLimitConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save rate limit config:', error);
  }
}

/**
 * 질문 가능 여부 확인
 */
export function canAskQuestion(): { allowed: boolean; reason?: string; remaining?: number } {
  const config = getRateLimitConfig();
  const hourKey = getHourKey();
  const dayKey = getDayKey();
  
  // 시간당 제한 확인
  const hourlyLogs = getQuestionLogs(`${STORAGE_KEYS.HOURLY}_${hourKey}`);
  const hourlyCount = hourlyLogs.reduce((sum, log) => sum + log.count, 0);
  
  if (hourlyCount >= config.maxQuestionsPerHour) {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    const minutesUntilReset = Math.ceil((nextHour.getTime() - Date.now()) / 1000 / 60);
    
    return {
      allowed: false,
      reason: `시간당 질문 제한에 도달했습니다. ${minutesUntilReset}분 후 다시 시도해주세요.`,
      remaining: 0,
    };
  }
  
  // 일일 제한 확인
  const dailyLogs = getQuestionLogs(`${STORAGE_KEYS.DAILY}_${dayKey}`);
  const dailyCount = dailyLogs.reduce((sum, log) => sum + log.count, 0);
  
  if (dailyCount >= config.maxQuestionsPerDay) {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0);
    nextDay.setMinutes(0);
    nextDay.setSeconds(0);
    const hoursUntilReset = Math.ceil((nextDay.getTime() - Date.now()) / 1000 / 60 / 60);
    
    return {
      allowed: false,
      reason: `일일 질문 제한에 도달했습니다. ${Math.ceil(hoursUntilReset)}시간 후 다시 시도해주세요.`,
      remaining: 0,
    };
  }
  
  return {
    allowed: true,
    remaining: Math.min(
      config.maxQuestionsPerHour - hourlyCount,
      config.maxQuestionsPerDay - dailyCount
    ),
  };
}

/**
 * 질문 로그 기록 (API 호출이 발생한 질문만)
 */
export function logQuestion(): void {
  const hourKey = getHourKey();
  const dayKey = getDayKey();
  
  const hourlyKey = `${STORAGE_KEYS.HOURLY}_${hourKey}`;
  const dailyKey = `${STORAGE_KEYS.DAILY}_${dayKey}`;
  
  const hourlyLogs = getQuestionLogs(hourlyKey);
  const dailyLogs = getQuestionLogs(dailyKey);
  
  const now = Date.now();
  
  // 시간당 로그 추가
  hourlyLogs.push({ timestamp: now, count: 1 });
  saveQuestionLogs(hourlyKey, hourlyLogs);
  
  // 일일 로그 추가
  dailyLogs.push({ timestamp: now, count: 1 });
  saveQuestionLogs(dailyKey, dailyLogs);
}

/**
 * 남은 질문 횟수 가져오기
 */
export function getRemainingQuestions(): {
  hourly: number;
  daily: number;
  nextResetHour?: Date;
  nextResetDay?: Date;
} {
  const config = getRateLimitConfig();
  const hourKey = getHourKey();
  const dayKey = getDayKey();
  
  const hourlyLogs = getQuestionLogs(`${STORAGE_KEYS.HOURLY}_${hourKey}`);
  const dailyLogs = getQuestionLogs(`${STORAGE_KEYS.DAILY}_${dayKey}`);
  
  const hourlyCount = hourlyLogs.reduce((sum, log) => sum + log.count, 0);
  const dailyCount = dailyLogs.reduce((sum, log) => sum + log.count, 0);
  
  const nextResetHour = new Date();
  nextResetHour.setHours(nextResetHour.getHours() + 1);
  nextResetHour.setMinutes(0);
  nextResetHour.setSeconds(0);
  
  const nextResetDay = new Date();
  nextResetDay.setDate(nextResetDay.getDate() + 1);
  nextResetDay.setHours(0);
  nextResetDay.setMinutes(0);
  nextResetDay.setSeconds(0);
  
  return {
    hourly: Math.max(0, config.maxQuestionsPerHour - hourlyCount),
    daily: Math.max(0, config.maxQuestionsPerDay - dailyCount),
    nextResetHour,
    nextResetDay,
  };
}

/**
 * 제한 초기화 (테스트용)
 */
export function resetRateLimit(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // 모든 관련 키 제거
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEYS.HOURLY) || key.startsWith(STORAGE_KEYS.DAILY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
  }
}

