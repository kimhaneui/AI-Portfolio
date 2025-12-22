-- Supabase 데이터베이스 스키마 설정
-- 이 파일의 SQL을 Supabase SQL Editor에서 실행하세요

-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 키워드 응답 테이블
CREATE TABLE IF NOT EXISTS keyword_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 벡터 임베딩 테이블
CREATE TABLE IF NOT EXISTS resume_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW 인덱스 생성 (고성능 벡터 검색을 위해)
CREATE INDEX IF NOT EXISTS resume_embeddings_embedding_idx 
ON resume_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 벡터 검색 함수 생성
CREATE OR REPLACE FUNCTION match_resume_embeddings(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    resume_embeddings.id,
    resume_embeddings.content,
    resume_embeddings.metadata,
    1 - (resume_embeddings.embedding <=> query_embedding) AS similarity
  FROM resume_embeddings
  WHERE 1 - (resume_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY resume_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 샘플 키워드 데이터 (선택사항)
INSERT INTO keyword_responses (keyword, response, category) VALUES
('안녕', '안녕하세요! 포트폴리오에 대해 궁금한 것이 있으시면 언제든 물어보세요.', 'greeting'),
('안녕하세요', '안녕하세요! 포트폴리오에 대해 궁금한 것이 있으시면 언제든 물어보세요.', 'greeting'),
('이름', '제 이름은 홍길동입니다. data/resume.json 파일에서 실제 이름으로 수정하실 수 있습니다.', 'personal'),
('연락처', '이메일: hong@example.com, 전화번호: 010-1234-5678입니다. data/resume.json 파일에서 실제 연락처로 수정하실 수 있습니다.', 'personal')
ON CONFLICT (keyword) DO NOTHING;

