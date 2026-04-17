import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React 19 / Next 16의 react-hooks/set-state-in-effect 룰은 브라우저 전용
    // 초기화 및 데이터 패칭 패턴과 광범위하게 충돌함. SWR/TanStack Query 등
    // 데이터 페칭 레이어 도입 전까지 warn으로 내림 (DEV-BACKLOG R-7).
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
