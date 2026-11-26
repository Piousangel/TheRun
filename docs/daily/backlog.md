# 백로그 (위가 우선)

런칭 경로는 [docs/team/launch.md](../team/launch.md)가 기준이다. 여기에는 런칭 체크리스트 밖의 아이디어와 미룬 것을 쌓는다.

## 큰 기능 후보 (화·목 슬롯, 월요일에 2개 골라 스펙)
0. **오너 브리프(11-15)**: 리그전 도메인(시즌·팀·일정·쿼터 출전·골 이벤트) + 출석 체크, 경기 당일 기록 화면, 실시간 채팅, 소셜 로그인. 단계는 브리프 7장
1. UI 개편 단계 2: 공용 컴포넌트 + ESLint 금지 규칙
2. UI 개편 단계 3: 자체 로그인 + 초대 코드(D-08)
3. Supabase 운영 파이프라인: 마이그레이션 적용·keepalive·주간 백업 워크플로
4. 팀 편성 서버 저장 + 전술 보드 배선(D-01+D-04)

## 소형
2. `animate-pulse` ESLint 규칙 범위 조정(선택 링·드롭 타깃 오탐)
3. LAUNCH_BLOCKERS.md 정리: Google 로그인 항목은 D-08로 무효
4. 마이그레이션 로컬 psql 검증(`scripts/db/pg-check`)을 CI Postgres 서비스로 자동화
5. 레거시 도메인(투표·경기·공지) 스키마를 새 마이그레이션으로 이관(supabase 전환 전 필수)
6. Supabase 리그 어댑터(현재 '미적용' 스텁 — 운영 DB 스키마는 #29로 적용됨). 전환 전 필수
7. ~~시즌 설정에 미니게임 종목~~ (11/26 로컬 어댑터 완료) → 미니게임 마이그레이션(`minigames`, 결과 jsonb 또는 `minigame_results`) + Supabase 리그 어댑터 4메서드. 종목 수정(이름·승점)·동률 규칙 순서 편집 화면은 없음
8. 첫 슈퍼관리자 지정 절차(사람 확인 필요, 역할 변경 가드와 충돌 — 오너 확인)
9. 골 이벤트 마이그레이션(`goal_events`, 클라이언트 UUID PK·RLS) + Supabase 리그 어댑터에 listGoals/addGoal/removeGoal (11/25 로컬 어댑터만)
10. 골 기록 자책골 입력 UI(모델·어댑터는 `own_goal` 지원, 화면 없음)
11. 같은 쿼터·같은 득점자 10초 내 중복 경고(스펙 §2.3, Realtime과 함께)
12. 출전 명단 마이그레이션(`appearances`, 경기·쿼터·팀 단위 교체) + Supabase 리그 어댑터 listAppearances/setLineup (11/25 13시 로컬 어댑터만)
13. 출전 명단에 게스트·임대(`guest_name`, `loan_from_team_id`)와 포지션(GK) — 스펙 §2.2, 클린시트 기록의 선행
14. 연간 출석왕(스펙 §3: 연간 누적 + 시즌별) — 체크인 포트에 기간 조회(`listByRange`) 추가 + 두 어댑터·계약 테스트, 명단 화면에 연간 탭 (11/26 20시 체크인 v1에서 분리)
15. 체크인 Supabase 어댑터 + `checkins` 마이그레이션 적용 확인(지금은 Supabase 모드에서 'CHECKIN_NOT_MIGRATED')
16. 참석 가능 주차 마이그레이션(`season_availability`, PK season_id+member_id, 본인·운영진만 쓰기 RLS) + Supabase 리그 어댑터 listAvailability/setAvailability (11/27 06시 로컬 어댑터만)
17. 참석 가능 주차 미입력자에게 알림(푸시 v1과 함께) — 지금은 운영진이 목록에서 '미입력'을 보고 직접 챙긴다
