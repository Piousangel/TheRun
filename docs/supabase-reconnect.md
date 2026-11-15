# Supabase 복귀 절차

로컬 어댑터로 운영하다가 Supabase로 돌아갈 때의 체크리스트.

**오너가 Supabase 복귀를 확정했다** (`docs/product-decisions.md` D-06). 그래서 이 문서는 "언젠가 할 일 메모"가 아니라 **재연결을 막는 차단 조건**이다 — 아래 0번 체크리스트를 걷어내기 전에는 프로덕션에서 `NEXT_PUBLIC_DATA_ADAPTER=supabase`로 전환하지 않는다.

## 0. 재연결 차단 체크리스트 (먼저 처리)

> 출처: `docs/product-decisions.md` D-06. 4자 리뷰(코드·디자인·PM·PO)에서 나온 코드 리뷰 결함 중 오너가 재연결의 필요조건으로 승격한 항목들이다.

**원인 확인됨 (2026-11-15):** 프로젝트는 삭제된 것이 아니라 **무활동으로 일시정지**된 상태였다. 프로젝트 ref는 `ksyqntpkaqajhkddqjbd`, 리전은 ap-southeast-1(싱가포르, 오너가 유지 결정). 11-15에 오너가 복원을 시작했다. 그러니 keepalive가 맞는 처방이다.

**복원 후 실측 (2026-11-15 22:05 KST): DB가 비어 있다.** public 테이블 0개, auth.users 0명, storage 버킷 0개. 예전 데이터는 돌아오지 않았다. 따라서:
1. role 분포 확인('전원 관리자 승격' 사고)은 할 필요가 없다. 확인할 데이터가 없다.
2. 기준선 기록도 필요 없다. 마이그레이션 적용 워크플로가 `complete_schema.sql` → 1장 순서의 파일들을 **처음부터 적용**한다. 단, 이미 무효로 결정된 것(D-03 전화번호, D-08/D-10로 바뀐 가입 흐름, 소셜 전용)을 반영한 새 마이그레이션을 같이 설계한다. 낡은 스키마를 그대로 올리고 나중에 고치는 것보다 낫다.
3. 접속은 **Session pooler**(`aws-0-ap-southeast-1.pooler.supabase.com:5432`, 사용자 `postgres.ksyqntpkaqajhkddqjbd`)로 한다. Direct 주소(db.<ref>.supabase.co)는 IPv6 전용이라 GitHub Actions에서 접속되지 않는다. 시크릿은 `SUPABASE_DB_URL`이다.
4. 인증: 현재 email 제공자만 켜져 있다. Google·Kakao는 오너가 등록 중이다(owner-setup.md).

| # | 차단 항목 | 무엇이 문제인가 | 상태 |
|---|---|---|---|
| 1 | 가입 게이트 | 지금은 **로그인 = 열람 권한**. 구글 계정만 있으면 클럽 명부 전체를 읽는다. 필요한 건 인증이 아니라 인가다 | 미착수 |
| 2 | `db:promote-social-admins` 삭제 및 재발 방지 | 완료 — 아래 "왜 이 스크립트가 사라졌는가" 참고 | 완료 |
| 3 | 멤버 연결 본인 확인 | 전화번호 대조가 이미 제거됨. 아무 미연결 멤버나 가로챈 뒤 이름·번호를 덮어쓸 수 있다. D-03으로 번호를 도메인에서 빼므로 **관리자 승인 방식**이 답이다 | 미착수 |
| 4 | `get_claimable_members()` 봉인 | `security definer`인데 인증 가드도 `revoke`도 없고, 반환이 `setof members`라 번호·사진·스탯까지 나간다 | 미착수 |
| 5 | `member-photos` 비공개화 | SELECT 정책에 인증 조건이 없어 목록 조회 + 전 파일 다운로드가 가능하다 | 미착수 |
| 6 | 계약 테스트에 권한 축 추가 | 로컬 어댑터에 권한 개념이 없어 QA가 "권한은 괜찮다"는 잘못된 신호를 준다 | 미착수 |

**추가로 반드시 함께 넣을 것 (이번에 프로젝트가 사라진 재발 방지):**
- **keepalive** — GitHub Actions cron으로 주 2회 가벼운 SELECT. 무활동 일시정지 차단.
- **주간 백업** — 같은 워크플로에서 `pg_dump` → 아티팩트 보관. 20명치 데이터는 수 MB다.

### 왜 `db:promote-social-admins`가 사라졌는가

`supabase/migrations/20260313_promote_all_social_users_to_admin.sql`은 이 세션에서 삭제됐다(더 이상 레포에 없다). 원인:

- 마이그레이션 SQL에서 `set role = 'admin'` 뒤에 세미콜론을 잘못 찍는 바람에, 첫 문장이 **조건 없는** `UPDATE app_profiles SET role='admin'`으로 실행됐다.
- 이 마이그레이션을 돌리던 러너는 psql을 `-1`(파일 전체를 한 트랜잭션으로 묶는 옵션) 없이 호출했다. 그래서 그 `UPDATE` 문장만 자동 커밋된 뒤, 다음 문장에서 구문 오류가 나며 종료됐다.
- 결과적으로 **"실패한 것처럼 보이면서 실제로는 전원을 관리자로 승격"**시키는 스크립트였다.

이 마이그레이션이 실제로 실행됐는지는 프로젝트 자체가 사라져 지금은 확인할 수 없다. `package.json`의 `db:promote-social-admins` 스크립트는 마이그레이션 파일과 함께 삭제됐고, 같은 패턴을 쓰는 남은 러너(`scripts/apply-masked-phone-migration.ts`)에는 재발 방지로 `-1`이 이미 추가돼 있다.

**복구 후 가장 먼저 돌릴 쿼리** — role 분포로 이 스크립트가 실행됐는지 확인한다:

```sql
select role, count(*) from app_profiles group by 1;
```

`member` role이 거의 없고 `admin`/`superadmin`이 대다수로 나오면 위 마이그레이션이 실행된 것이다. 그 경우 정상 가입자의 role을 수동으로 되돌려야 한다.

## 1. 프로젝트·스키마

1. Supabase 프로젝트 생성 후 SQL Editor에서 순서대로 적용: `supabase/migrations/complete_schema.sql` → `20260108_add_match_status_fields.sql` → `20260311_add_app_profiles.sql` → `20260311_harden_rls.sql` → `20260312_add_announcements.sql` → `20260312_mask_member_numbers_and_enable_self_member_updates.sql` → `20260314_add_superadmin_role.sql` → `20260316_add_superadmin_role_management.sql`
2. `20260313_promote_all_social_users_to_admin.sql`은 이 레포에 더 이상 존재하지 않는다 — 왜 삭제됐고 복구 후 뭘 확인해야 하는지는 위 "0. 재연결 차단 체크리스트"를 본다.
3. 출석 테이블 병합: `attendance_sessions`/`attendance_votes`는 더 이상 코드가 읽지 않는다. 데이터가 필요하면 `vote_sessions(type='match')`/`vote_responses`로 옮기는 마이그레이션을 새로 작성한다.
4. `member-photos` 스토리지 버킷 생성. **public read로 만들지 않는다** — 차단 항목 #5. 인증된 사용자만 읽을 수 있는 SELECT 정책으로 만든다.
5. Authentication > Providers > Google 활성화, redirect URI = `https://<도메인>/auth/callback`.

## 2. 코드 계약 확인

- 어댑터는 현행 RPC 계약만 지원한다: `link_my_member(target_member_id)`, `unlink_my_member()`, `get_claimable_members()`, `set_app_profile_role(target_profile_id, next_role)`, `update_my_member_profile(input_name, input_phone)`.
- `src/shared/api/adapters/contracts/*.contract.ts`를 Supabase 어댑터로 돌려 계약을 검증한다. 테스트 픽스처는 서비스 롤 키로 테스트 사용자 생성·정리를 해야 한다(작성 필요). 차단 항목 #6(권한 축 추가)도 이 계약 테스트 확장 작업의 일부다.
- **픽스처 작성자가 가장 먼저 볼 곳(구체 예시):** `announcements.remove` / `votes.removeSession`은 collection 어댑터에서 자식 행(`announcement_reads`, `vote_responses`)을 코드로 직접 지우지만, supabase 어댑터는 부모 행만 지우고 FK `on delete cascade`에 의존한다. 마이그레이션에 캐스케이드가 없으면 계약 위반인데 CI는 collection 어댑터로만 돌아서 아무도 모른다 — 고아 자식 행이 남는지부터 확인한다.
- 로컬에서 먼저 검증하려면 Docker + `supabase start`로 로컬 스택을 띄우고 위 마이그레이션을 적용한다.

## 3. 전환

- `.env.local` / Vercel 환경변수: `NEXT_PUBLIC_DATA_ADAPTER=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- 첫 관리자: 로그인 한 번 → `update public.app_profiles set role = 'superadmin' where email = '<이메일>';`
- 데모 로그인 버튼과 DEMO 바는 `isLocalAdapter()`가 false가 되면서 자동으로 사라진다.
