import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

/** FSD 상향 import 차단. 각 레이어가 import하면 안 되는 상위 레이어 패턴. */
const upward = (...layers) => layers.map((layer) => ({ group: [`@/${layer}/*`], message: `${layer}는 상위 레이어입니다. FSD 방향(shared→entities→features→widgets→app)을 지키세요.` }));

const relativeImportBan = { group: ['./*', '../*'], message: '상대 경로 대신 @/ 별칭을 쓰세요.' };
const adapterBan = { group: ['@/shared/api/adapters/*', '@/shared/api/supabase/*'], message: '어댑터를 직접 import하지 마세요. @/shared/api/client의 getApi()를 쓰세요.' };

const config = [
  { ignores: ['node_modules/**', '.next/**', 'out/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan] }],
      // Phase 2에서 공용 Skeleton 도입 후 'error'로 승격한다.
      'no-restricted-syntax': [
        'warn',
        { selector: "JSXAttribute[name.name='className'] Literal[value=/animate-pulse/]", message: '로딩 UI는 공용 Skeleton만 씁니다. animate-pulse 직접 마크업 금지.' },
        { selector: "JSXAttribute[name.name='className'] TemplateLiteral[quasis.0.value.raw=/animate-pulse/]", message: '로딩 UI는 공용 Skeleton만 씁니다. animate-pulse 직접 마크업 금지.' },
        { selector: 'JSXText[value=/로딩 중|불러오는 중/]', message: '로딩 텍스트 대신 공용 Skeleton을 씁니다.' },
        { selector: 'JSXExpressionContainer Literal[value=/로딩 중|불러오는 중/]:not(JSXAttribute Literal)', message: '로딩 텍스트 대신 공용 Skeleton을 씁니다.' },
      ],
    },
  },
  { files: ['src/shared/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('entities', 'features', 'widgets', 'app')] }] } },
  // 어댑터를 조립하는 곳은 여기뿐이다. adapterBan만 풀고 상향 금지·상대 경로 금지는 유지한다.
  { files: ['src/shared/api/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('entities', 'features', 'widgets', 'app')] }] } },
  { files: ['src/entities/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('features', 'widgets', 'app')] }] } },
  { files: ['src/features/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('widgets', 'app')] }] } },
  { files: ['src/widgets/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, adapterBan, ...upward('app')] }] } },
  // 테스트와 테스트 헬퍼는 메모리 어댑터를 직접 꽂아야 한다. adapterBan만 풀고
  // 상대 경로 금지와 FSD 상향 금지는 레이어별로 그대로 건다(아래 블록들이 레이어 규칙을 다시 얹는다).
  { files: ['src/**/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan] }] } },
  { files: ['src/shared/**/*.test.{ts,tsx}', 'src/shared/lib/test/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('entities', 'features', 'widgets', 'app')] }] } },
  { files: ['src/entities/**/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('features', 'widgets', 'app')] }] } },
  { files: ['src/features/**/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('widgets', 'app')] }] } },
  { files: ['src/widgets/**/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan, ...upward('app')] }] } },
  // auth 라우트 두 곳(callback/confirm)은 Supabase OAuth 코드 교환·이메일 확인 트랜스포트 엔드포인트다.
  // getApi() 포트가 다루는 영역이 아니고, Next 라우팅상 app/ 아래에만 존재할 수 있어 어댑터를 직접 쓴다.
  // 그래서 adapterBan만 풀고 나머지 경계는 그대로 건다. Phase 3에서 Supabase 재연결 여부가 정해지면 정리한다.
  { files: ['src/app/auth/**/route.ts'], rules: { 'no-restricted-imports': ['error', { patterns: [relativeImportBan] }] } },
  // Sentry 런타임 설정 파일(sentry.server.config.ts, sentry.edge.config.ts)이 레포 루트에 있어야 해서
  // src/instrumentation.ts에서 상대 경로 import가 불가피하다. relativeImportBan만 빼고 나머지 제약은 유지한다.
  { files: ['src/instrumentation.ts'], rules: { 'no-restricted-imports': ['error', { patterns: [adapterBan] }] } },
];

export default config;
