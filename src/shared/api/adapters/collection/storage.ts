/** 컬렉션 하나를 통째로 읽고 쓰는 저장소. 데이터가 작아(멤버 수십, 투표 수십) 배열 단위로 다룬다. */
export interface CollectionStorage {
  read<T>(collection: string): Promise<T[] | undefined>;
  write<T>(collection: string, rows: T[]): Promise<void>;
  clear(): Promise<void>;
}

/** 로컬 인증 세션(로그인한 데모 사용자 id) 저장소. 미들웨어도 읽어야 하므로 브라우저 구현은 쿠키도 쓴다. */
export interface SessionStore {
  get(): string | null;
  set(userId: string): void;
  clear(): void;
}

export class NotFoundError extends Error {
  constructor(collection: string, id: string) {
    super(`${collection}에서 ${id}를 찾을 수 없습니다.`);
    this.name = 'NotFoundError';
  }
}
