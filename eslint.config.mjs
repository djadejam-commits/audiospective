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
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Prevent INC-2025-12-05-001: Discourage raw SQL queries
      // Prefer Prisma type-safe methods over $queryRaw/$executeRaw
      "no-restricted-syntax": [
        "warn",
        {
          selector: "MemberExpression[property.name='$queryRaw']",
          message: "⚠️ Raw SQL detected: prisma.$queryRaw() - Prefer Prisma type-safe methods when possible. If raw SQL is required, ensure you use snake_case table/column names matching PostgreSQL schema (see docs/RAW-SQL-BEST-PRACTICES.md). Reference: INC-2025-12-05-001"
        },
        {
          selector: "MemberExpression[property.name='$executeRaw']",
          message: "⚠️ Raw SQL detected: prisma.$executeRaw() - Prefer Prisma type-safe methods when possible. If raw SQL is required, ensure you use snake_case table/column names matching PostgreSQL schema (see docs/RAW-SQL-BEST-PRACTICES.md). Reference: INC-2025-12-05-001"
        },
        {
          selector: "MemberExpression[property.name='$queryRawUnsafe']",
          message: "❌ Unsafe raw SQL detected: prisma.$queryRawUnsafe() - This method is vulnerable to SQL injection. Use prisma.$queryRaw with parameterized queries instead. Reference: INC-2025-12-05-001"
        },
        {
          selector: "MemberExpression[property.name='$executeRawUnsafe']",
          message: "❌ Unsafe raw SQL detected: prisma.$executeRawUnsafe() - This method is vulnerable to SQL injection. Use prisma.$executeRaw with parameterized queries instead. Reference: INC-2025-12-05-001"
        }
      ],
    },
  },
  // Relaxed rules for test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow 'any' in tests for mocking
    },
  },
];

export default eslintConfig;
