# Source Map Leak Demo

2026년 3월 31일 Claude Code npm 패키지에서 `.map` 파일이 제거되지 않은 채 배포되어
내부 소스코드 전체가 노출된 사건을 재현하는 데모 프로젝트입니다.

## 배경

- npm 패키지에 source map(`.map`) 파일이 포함되면, `sourcesContent` 필드에
  원본 TypeScript 소스가 그대로 들어 있음
- 빌드 파이프라인에서 `.map` 파일을 제거하지 않으면 **누구나** 원본 코드를 복원 가능
- 이 데모에서는 가상의 AI 에이전트 코드(프롬프트, 툴 라우팅, 오케스트레이션)를 사용하여
  동일한 상황을 시뮬레이션합니다

## Quick Start

```bash
npm install
```

### 1. 취약한 빌드 (source map 포함)

```bash
npm run build:vulnerable
npm run demo:extract    # .map에서 원본 소스 추출
```

### 2. 안전한 빌드 (source map 제거)

```bash
npm run build:safe
npm run demo:extract    # .map 파일이 없으므로 추출 불가
```

### 3. 패키지 비교

```bash
npm run demo:compare    # .tgz 내부 파일 목록 확인
```

## 프로젝트 구조

```
src/
├── index.ts                 # Public API (이것만 공개 의도)
├── agent/
│   ├── orchestrator.ts      # 에이전트 오케스트레이션 (비공개 의도)
│   └── types.ts             # 내부 타입 정의
├── prompts/
│   └── templates.ts         # 시스템 프롬프트 & 숨겨진 지시사항
└── tools/
    └── router.ts            # 툴 라우팅 & 샌드박싱 로직
```

## 교훈

| 방어 방법 | 설명 |
|-----------|------|
| `.npmignore`에 `*.map` 추가 | 가장 간단한 방법 |
| `tsconfig.json`에서 `"sourceMap": false` | 프로덕션 빌드에서 아예 생성하지 않음 |
| 빌드 스크립트에서 `.map` 삭제 | 이 데모의 `strip-sourcemaps.js` 방식 |
| `package.json`의 `files` 필드에서 `*.map` 제외 | allowlist 방식 |
| CI/CD에서 `.map` 포함 여부 검사 | 자동화된 방어선 |

## .npmignore 예시

```
# Source maps — 프로덕션 패키지에 절대 포함하지 말 것
**/*.map
```
