import { NotFoundError, type CollectionStorage } from '@/shared/api/adapters/collection/storage';

/** id를 가진 행들의 컬렉션. 첫 읽기 때 seed()로 초기화한다(빈 배열이어도 저장해서 재시드 방지). */
export class Collection<T extends { id: string }> {
  constructor(
    private readonly storage: CollectionStorage,
    private readonly name: string,
    private readonly seed: () => T[],
  ) {}

  private tail: Promise<unknown> = Promise.resolve();

  /**
   * 모든 쓰기가 all() → 배열 조작 → write()라 read-modify-write다. 같은 컬렉션에 두 뮤테이션이
   * 겹치면 나중 쓰기가 앞 쓰기를 통째로 지운다. 호출부 규율 대신 컬렉션마다 쓰기를 직렬화해
   * 클래스 안에서 불변식을 닫는다. 앞 작업이 reject해도 체인은 이어진다.
   */
  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.tail.then(task, task);
    this.tail = run.catch(() => undefined);
    return run;
  }

  async all(): Promise<T[]> {
    const rows = await this.storage.read<T>(this.name);
    if (rows) return rows;
    const seeded = this.seed();
    await this.storage.write(this.name, seeded);
    // seed()는 api 수명 동안 메모이즈된 배열을 돌려준다. 그대로 넘기면 호출자의 정렬·변형이
    // 시드 캐시를 오염시켜 "데이터 초기화"가 원본을 복원하지 못한다.
    return structuredClone(seeded);
  }

  async get(id: string): Promise<T | null> {
    return (await this.all()).find((row) => row.id === id) ?? null;
  }

  async insert(row: T): Promise<T> {
    return this.enqueue(async () => {
      const rows = await this.all();
      await this.storage.write(this.name, [...rows, row]);
      return row;
    });
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    return this.enqueue(async () => {
      const rows = await this.all();
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) throw new NotFoundError(this.name, id);
      const next = { ...rows[index], ...patch };
      await this.storage.write(this.name, rows.map((row, i) => (i === index ? next : row)));
      return next;
    });
  }

  async remove(id: string): Promise<void> {
    return this.enqueue(async () => {
      const rows = await this.all();
      await this.storage.write(this.name, rows.filter((row) => row.id !== id));
    });
  }

  async replaceAll(rows: T[]): Promise<void> {
    return this.enqueue(async () => {
      await this.storage.write(this.name, rows);
    });
  }
}
