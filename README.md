# messenger-web-client

A web client for Telegram messaging via [GREEN-API](https://green-api.com/telegram).
Docs [GREEN-API: Telegram](https://green-api.com/telegram/docs/api/)

Stack: React 19, TypeScript, Vite, CSS Modules.

## Scripts

| Command                               | Purpose                        |
| ------------------------------------- | ------------------------------ |
| `npm run dev`                         | Vite dev server                |
| `npm run build`                       | Type check + production build  |
| `npm run preview`                     | Serve the built bundle locally |
| `npm run typecheck`                   | `tsc -b` without bundling      |
| `npm run lint` / `lint:fix`           | ESLint (zero warnings allowed) |
| `npm run stylelint` / `stylelint:fix` | Stylelint over CSS             |
| `npm run format` / `format:check`     | Prettier                       |
| `npm test` / `test:watch`             | Vitest + Testing Library       |

## Code quality

- **TypeScript** in strict mode: `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` and more.
  Shared options live in `tsconfig.base.json`.
- **ESLint** (flat config): `typescript-eslint` with `strictTypeChecked` +
  `stylisticTypeChecked` (type-aware rules), `react-hooks`, `react-refresh`,
  `unicorn`, and import ordering via `import-x`. `eslint-config-prettier` comes last.
- **Stylelint**: `stylelint-config-standard` plus property ordering, with camelCase
  class names for CSS Modules.
- **Prettier** is the single source of truth for formatting.

## Git hooks

Installed automatically by `npm install` (`prepare: husky`).

- `pre-commit` — `lint-staged` over changed files, then `npm run typecheck`
- `commit-msg` — `commitlint` with [Conventional Commits](https://www.conventionalcommits.org/)
- `pre-push` — `npm test`

Commit message format: `<type>(<scope>): <description>`, for example
`feat(chat): send text message`.
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`.

## Import alias

`@/*` maps to `src/*` (configured in `tsconfig.app.json` and `vite.config.ts`).
