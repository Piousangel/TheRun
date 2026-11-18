\set ON_ERROR_STOP 0
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000a1','admin@x'),('00000000-0000-0000-0000-0000000000b1','bob@x'),('00000000-0000-0000-0000-0000000000c1','eve@x');
select count(*) as profiles_created from app_profiles;
-- 테스트 셋업: 관리자 지정(슈퍼유저 직접)
update app_profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a1';
insert into members(id,name) values ('11111111-1111-1111-1111-111111111111','밥'),('22222222-2222-2222-2222-222222222222','앨리스');
grant select on all tables in schema public to authenticated;
set role authenticated;
-- eve(미연결): 명부 못 읽음
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
select 'eve_members(0 기대)', count(*) from members;
-- eve 자가 승격 시도: 정책 없음 → 0행
update app_profiles set role='superadmin' where id=auth.uid();
select 'eve_role(member 기대)', role from app_profiles where id=auth.uid();
-- eve 코드 발급 시도 → 실패
select issue_invite_code('11111111-1111-1111-1111-111111111111','ABCD-EFGH-2345');
-- 관리자 발급
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
select 'issued', issue_invite_code('11111111-1111-1111-1111-111111111111','RUN-ABCD-EFGH') is not null;
select 'admin_sees_codes(1)', count(*) from invite_codes;
select 'admin_members(2)', count(*) from members;
-- 잘못된 코드 → 실패, 올바른 코드 bob → 성공
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000b1';
select redeem_invite_code('RUN-XXXX-YYYY');
select 'bob_redeem', redeem_invite_code('run abcd efgh');
select 'bob_members(2)', count(*) from members;
select 'bob_codes(0)', count(*) from invite_codes;
-- 재사용(eve) 실패
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
select redeem_invite_code('RUN-ABCD-EFGH');
select 'eve_still_0', count(*) from members;
-- 연결된 멤버에게 재발급 불가
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000a1';
select issue_invite_code('11111111-1111-1111-1111-111111111111','RUN-NEWW-CODE');
-- 재발급: 앨리스 두 번 → 이전 코드 폐기
select issue_invite_code('22222222-2222-2222-2222-222222222222','RUN-AAAA-1111');
select issue_invite_code('22222222-2222-2222-2222-222222222222','RUN-BBBB-2222');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
select redeem_invite_code('RUN-AAAA-1111');
select 'eve_redeem_new', redeem_invite_code('RUN-BBBB-2222');
-- anon은 함수·테이블 접근 불가
reset role; set role anon;
select redeem_invite_code('x');
select count(*) from members;
