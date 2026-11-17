import { describe, expect, it } from 'vitest';
import { findForbidden, selectPending } from './migrate-lib';

describe('selectPending', () => {
  it('14자리 타임스탬프 파일만, 이미 적용된 것은 빼고 정렬해서 돌려준다', () => {
    const files = [
      'complete_schema.sql',
      '20260311_harden_rls.sql',
      '20261119000200_b.sql',
      '20261119000100_a.sql',
      '20261118000000_done.sql',
      'README.md',
    ];
    expect(selectPending(files, ['20261118000000_done.sql'])).toEqual([
      '20261119000100_a.sql',
      '20261119000200_b.sql',
    ]);
  });
});

describe('findForbidden', () => {
  it('금지 구문을 잡는다', () => {
    expect(findForbidden('DROP TABLE members;')).toContain('DROP TABLE');
    expect(findForbidden('alter table t drop column x;')).toContain('DROP COLUMN');
    expect(findForbidden('truncate members;')).toContain('TRUNCATE');
    expect(findForbidden('UPDATE app_profiles SET role = \'admin\';')).toContain('조건 없는 UPDATE');
    expect(findForbidden('delete from members;')).toContain('조건 없는 DELETE');
    expect(findForbidden("update app_profiles set role = 'admin' where id = 'x';")).toContain('역할(role) 변경');
    expect(findForbidden('alter role foo with login;')).toContain('역할(role) 변경');
  });
  it('조건 있는 UPDATE/DELETE와 일반 DDL은 통과시킨다', () => {
    expect(findForbidden('update matches set status = \'pending\' where status is null;')).toEqual([]);
    expect(findForbidden('delete from t where id = 1;')).toEqual([]);
    expect(findForbidden('create table x (id uuid primary key); drop policy if exists p on x;')).toEqual([]);
  });
  it('주석·문자열 속 단어는 무시한다', () => {
    expect(findForbidden("-- drop table x\n/* truncate y */ select 'delete from z';")).toEqual([]);
  });
});
