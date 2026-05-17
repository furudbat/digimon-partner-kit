import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import next from 'eslint-config-next';

export default [
  js.configs.recommended,
  ...next,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'prettier/prettier': 'warn',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'warn',
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'out/', 'dist/', 'build/', 'coverage/'],
  },
];
