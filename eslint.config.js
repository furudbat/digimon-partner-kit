import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default defineConfig([
  // Next.js rules (includes react, react-hooks, import, jsx-a11y and typescript-eslint)
  ...nextVitals,
  ...nextTs,
  // turn off rules that conflict with Prettier (formatting is done by `pnpm prettier:format`)
  prettier,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  globalIgnores(['node_modules/**', '.next/**', 'out/**', 'build/**', 'dist/**', 'coverage/**', 'public/**', 'next-env.d.ts']),
]);
