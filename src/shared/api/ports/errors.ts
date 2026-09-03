/**
 * 어댑터가 던지는 에러. 백엔드가 준 `code`를 보존해서 호출부가 "스키마 미배포"와
 * "쿼리 실패"를 구분할 수 있게 한다. 메시지만 남기면 그 구분이 사라진다.
 */
export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** PostgREST: 스키마 캐시에 테이블이 없다(마이그레이션 미배포). */
export const SCHEMA_MISSING_CODE = 'PGRST205';

export function isSchemaMissingError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === SCHEMA_MISSING_CODE || Boolean(error.message?.includes('schema cache'));
}
