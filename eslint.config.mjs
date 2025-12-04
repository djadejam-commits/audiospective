// ESLint flat config (requires ESLint 9.x)
// Using Next.js recommended config
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      ".vercel/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
