import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Unicorn rules shared between tooling configs and application code. */
const unicornOverrides = {
  // `ref`/`Ref` is an established React name (useRef, forwardRef), not an
  // abbreviation to expand to `reference`. Other abbreviations still get caught.
  'unicorn/name-replacements': ['error', { replacements: { ref: false } }],
  // Single-line JSDoc is common practice; splitting it across three lines helps nobody.
  'unicorn/single-line-block-comment-style': 'off',
  'unicorn/prefer-export-from': 'off',
  'unicorn/relative-url-style': 'off',
  'unicorn/prefer-module': 'off',
};

/**
 * Blank lines around control flow and before `return`, so branching stands out
 * from the statements around it. Fully autofixable.
 *
 * Taken from @stylistic rather than ESLint core: the core rule is deprecated and
 * is scheduled for removal in ESLint 11.
 */
const paddingLineRules = {
  '@stylistic/padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: '*', next: 'if' },
    { blankLine: 'always', prev: '*', next: 'for' },
    { blankLine: 'always', prev: '*', next: 'while' },
    { blankLine: 'always', prev: '*', next: 'switch' },
    { blankLine: 'always', prev: '*', next: 'try' },
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: 'block-like', next: '*' },
  ],
};

/** Import hygiene: all imports up top, one block, sorted, followed by a blank line. */
const importRules = {
  'import-x/first': 'error',
  'import-x/newline-after-import': 'error',
  'import-x/no-duplicates': 'error',
  'import-x/order': [
    'error',
    {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'object',
        'type',
      ],
      'pathGroups': [{ pattern: '@/**', group: 'internal', position: 'before' }],
      'pathGroupsExcludedImportTypes': ['builtin'],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc', caseInsensitive: true },
    },
  ],
};

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', '.husky/_']),

  // Tooling configs: plain JS on Node, without type-aware rules.
  {
    files: ['**/*.{js,cjs,mjs}'],
    extends: [js.configs.recommended, unicorn.configs.recommended],
    plugins: { 'import-x': importX, '@stylistic': stylistic },
    languageOptions: { globals: globals.node },
    rules: {
      ...unicornOverrides,
      ...paddingLineRules,
      ...importRules,
    },
  },

  // CommonJS files use `module` and `require` instead of ES module syntax.
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      'import-x/first': 'off',
      'import-x/newline-after-import': 'off',
      'import-x/order': 'off',
    },
  },

  // Application code.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      eslintReact.configs['recommended-type-checked'],
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      unicorn.configs.recommended,
    ],
    plugins: { 'import-x': importX, '@stylistic': stylistic },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...importRules,
      ...paddingLineRules,

      // One consistent style for type imports, matching verbatimModuleSyntax.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Numbers in template literals are routine; there is nothing to forbid.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      // Async handlers in JSX props (onClick={async () => …}) are fine.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      // A switch over a union must name every member, so adding one to the union
      // points at each switch that now has to handle it.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Components are PascalCase, everything else camelCase.
      'unicorn/filename-case': [
        'error',
        { cases: { camelCase: true, pascalCase: true } },
      ],
      ...unicornOverrides,
      // React returns null from components and refs.
      'unicorn/no-null': 'off',
    },
  },

  // Tests: catch assertions that silently pass — a missing `await` on findBy*,
  // an `expect` with no matcher, a `.only` left behind in a commit.
  {
    files: ['**/*.test.{ts,tsx}', 'vitest.setup.ts'],
    extends: [testingLibrary.configs['flat/react'], vitest.configs.recommended],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/expect-expect': 'error',
    },
  },

  // Vitest runs with `globals: false`, so React Testing Library cannot register its
  // automatic cleanup (it only does so when `afterEach` exists as a global). The
  // manual cleanup in the setup file is load-bearing: without it, a render leaks
  // into the next test.
  {
    files: ['vitest.setup.ts'],
    rules: { 'testing-library/no-manual-cleanup': 'off' },
  },

  // Turns off rules that conflict with Prettier. Always last...
  prettier,

  // ...except for `curly`, which eslint-config-prettier disables wholesale. Only the
  // `multi-line` and `multi-or-nest` options fight Prettier; `all` is safe, and it is
  // the one worth having: every block gets braces.
  {
    rules: { curly: ['error', 'all'] },
  },
]);
