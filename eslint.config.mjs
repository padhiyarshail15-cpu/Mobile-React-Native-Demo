import js from '@eslint/js';
import reactNativeConfig from '@react-native/eslint-config/flat';
import prettierConfig from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import path from 'node:path';
import tseslint from 'typescript-eslint';

const root = import.meta.dirname;

const unusedVarsOptions = {
  vars: 'all',
  args: 'after-used',
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
  ignoreRestSiblings: true,
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/vendor/**',
      '**/ios/**',
      '**/android/**',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...reactNativeConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: [
            path.join(root, 'apps/*/tsconfig.json'),
            path.join(root, 'packages/*/tsconfig.json'),
          ],
        },
      },
    },
    rules: {
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react-native', group: 'external', position: 'before' },
            { pattern: '@repo/**', group: 'internal' },
            { pattern: '~/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['react', 'react-native'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-debugger': 'error',
      'object-shorthand': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', unusedVarsOptions],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: {
        // ESLint runs from the repo root, which has no babel.config.js.
        requireConfigFile: false,
        babelOptions: { babelrc: false, configFile: false },
      },
    },
    rules: {
      // CommonJS config files (jest, metro, babel) use require().
      '@typescript-eslint/no-require-imports': 'off',
      // Flow rules crash on ESLint 9 (they use removed getAllComments API).
      'ft-flow/define-flow-type': 'off',
      'ft-flow/use-flow-type': 'off',
    },
  },
  {
    files: ['packages/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/*', '**/apps/**'],
              message: 'Shared packages must not import from apps.',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
];
