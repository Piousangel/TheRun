# 오너 설정 가이드: Supabase · Google · Kakao (2026-11-15)

11/18 전에 끝내야 스프린트(S0: Supabase 복귀 + 로그인)가 밀리지 않는다. 다 하는 데 30~40분 걸린다.
끝나면 Claude에게 "설정 끝"이라고 알린다. 공개 키로 로그인 제공자 활성화를 확인하고, 팀이 이어서 진행한다.

## 1. Supabase 프로젝트 (10분)
1. https://supabase.com/dashboard → GitHub로 로그인 → **New project**
   - Name `the-run`, **Region: Northeast Asia (Seoul)**
   - Database Password: **Generate** → 비밀번호 관리자에 저장(다시 볼 수 없다)
   - Plan: Free
   - 무료 플랜은 7일 동안 활동이 없으면 일시정지된다. 지난번에 프로젝트가 사라진 원인으로 추정한다. 팀이 keepalive 워크플로를 만든다.
2. 값 3개를 모은다.
   - **Project Settings → Data API**: `Project URL` (https://<ref>.supabase.co)
   - **Project Settings → API Keys**: `anon`(publishable) 키, `service_role`(secret) 키
   - **상단 Connect → Session pooler**의 URI. `[YOUR-PASSWORD]` 자리에 1번에서 저장한 비밀번호를 넣는다.
3. GitHub 시크릿 등록(값을 복사한 직후 하나씩):
```
! pbpaste | gh secret set SUPABASE_DB_URL --repo Piousangel/TheRun              # Session pooler URI(비밀번호 포함)
! pbpaste | gh secret set SUPABASE_SERVICE_ROLE_KEY --repo Piousangel/TheRun    # service_role 키
! pbpaste | gh secret set NEXT_PUBLIC_SUPABASE_URL --repo Piousangel/TheRun     # Project URL
! pbpaste | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo Piousangel/TheRun # anon 키
```
4. Vercel 환경변수: https://vercel.com → the-run → Settings → Environment Variables. Production·Preview 둘 다 넣는다.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DATA_ADAPTER`는 **아직 바꾸지 않는다**(local 유지). 팀이 B장을 끝냈다고 메일로 알리면 그때 `supabase`로 바꾼다.

## 2. Supabase 인증 URL (2분)
Authentication → **URL Configuration**
- Site URL: `https://the-run-iota.vercel.app`
- Redirect URLs에 3줄 추가:
  - `https://the-run-iota.vercel.app/**`
  - `http://localhost:3000/**`
  - `https://*-piousangel-hobby.vercel.app/**` (PR 미리보기)

## 3. Google 로그인 (10분)
1. https://console.cloud.google.com → 상단 프로젝트 선택 → **새 프로젝트** `The Run`
2. **Google 인증 플랫폼(OAuth 동의 화면)** → 시작하기
   - 앱 이름 `더런`, 지원 이메일은 본인 메일, 대상 **외부(External)**
3. **클라이언트** → 클라이언트 만들기 → 유형 **웹 애플리케이션**
   - 승인된 리디렉션 URI: `https://<ref>.supabase.co/auth/v1/callback` (`<ref>`는 1-2의 Project URL 앞부분)
   - 만들면 **클라이언트 ID**와 **클라이언트 보안 비밀번호**가 나온다
4. **대상(Audience)** → 게시 상태를 **프로덕션으로 게시**한다. 테스트 상태로 두면 등록한 테스트 사용자만 로그인할 수 있고 7일마다 다시 로그인해야 한다. 이메일·프로필만 쓰므로 별도 심사는 없다.
5. Supabase → Authentication → **Sign In / Providers → Google** → Enable → 클라이언트 ID와 보안 비밀번호 붙여넣기 → Save

## 4. Kakao 로그인 (10분)
1. https://developers.kakao.com → 로그인 → **내 애플리케이션 → 애플리케이션 추가하기**
   - 앱 이름 `더런`, 회사명은 개인 이름
2. **앱 설정 → 플랫폼 → Web 플랫폼 등록**: `https://the-run-iota.vercel.app`, `http://localhost:3000`
3. **제품 설정 → 카카오 로그인**
   - 활성화 설정 **ON**
   - Redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
4. **카카오 로그인 → 동의항목**: 닉네임·프로필 사진은 '필수 동의'. 카카오계정(이메일)은 설정할 수 있으면 '필수 동의'로 둔다. 개인 앱이라 이메일 항목이 잠겨 있으면 그대로 두고 5번의 옵션을 켠다.
5. **앱 설정 → 앱 키**의 **REST API 키** = Client ID. **제품 설정 → 카카오 로그인 → 보안 → Client Secret 코드 생성 + 활성화 상태 '사용함'** = Client Secret.
6. Supabase → **Providers → Kakao** → Enable → REST API 키와 Client Secret 붙여넣기. 이메일 동의를 못 켰다면 **Allow users without an email**도 켠다 → Save

## 5. 끝나면
Claude에게 "설정 끝"이라고 알린다. Claude가 확인할 것:
- 시크릿 4개가 있는지
- `https://<ref>.supabase.co/auth/v1/settings`에서 google·kakao가 켜졌는지(공개 키로 조회)
- DB 연결(팀의 마이그레이션 워크플로 첫 실행)
