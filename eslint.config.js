import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      prettier,
      import: importPlugin,
      "@typescript-eslint": tseslint,
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs["flat/recommended"],
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ],
      "prettier/prettier": "error",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "import/no-cycle": "error",
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./jsconfig.json", "./tsconfig.json"],
        },
      },
    },
  },
  {
    files: [
      "tests/**/*.{js,jsx,ts,tsx}",
      "src/components/__tests__/**/*.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
        jest: "readonly",
      },
    },
    rules: {
      "import/order": "off",
    },
  },
  {
    files: ["supabase/functions/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.worker,
        Deno: "readonly",
      },
    },
    rules: {
      "import/order": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["e2e/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        cy: "readonly",
        Cypress: "readonly",
        expect: "readonly",
      },
    },
  },
]);
