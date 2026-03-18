# create-react-vite-starter

[![npm version](https://img.shields.io/npm/v/create-react-vite-starter?color=0ea5e9&style=flat-square)](https://www.npmjs.com/package/create-react-vite-starter)
[![npm downloads](https://img.shields.io/npm/dm/create-react-vite-starter?color=38bdf8&style=flat-square)](https://www.npmjs.com/package/create-react-vite-starter)
[![node](https://img.shields.io/node/v/create-react-vite-starter?color=84cc16&style=flat-square)](package.json)
[![license](https://img.shields.io/npm/l/create-react-vite-starter?color=a3e635&style=flat-square)](LICENSE)

> **Scaffold a production-ready React + Vite + TypeScript project in seconds.**  
> Interactive CLI — pick your stack, get a fully wired project with best-practice defaults.

---

## Quick start

```bash
npx create-react-vite-starter my-app
cd my-app
cp .env.example .env
npm run dev
```

Or install once and reuse:

```bash
npm i -g create-react-vite-starter
create-react-vite-starter
```

---

## Demo

```
  ╔════════════════════════════════════════╗
  ║   create-react-vite-starter  v2.0.0   ║
  ╚════════════════════════════════════════╝

  ? Project name   › my-app

  ? Styling method
  ❯ ● SCSS      (variables, mixins, nesting)
    ○ CSS       (plain CSS Modules)
    ○ Tailwind  (utility-first)

  ? State management
  ❯ ● Redux Toolkit (RTK)
    ○ TanStack Query
    ○ Both RTK + TanStack Query
    ○ None

  ? Optional extras  (space = toggle, enter = confirm)
    ◉ Testing         Vitest + React Testing Library
    ◉ GitHub Actions  CI: lint + test + build
    ◉ ENV validation  Zod schema guard
    ◉ Storybook       component docs + stories
    ◉ Error Boundary  global crash handler
    ◉ i18n            react-i18next, en + es
    ◉ Docker          Dockerfile + nginx + compose
    ◉ Husky           pre-commit + Conventional Commits

  ? Package manager  ❯ npm  ○ yarn  ○ pnpm
  ? Initialise git   ❯ Yes  ○ No

  ✔ Project scaffolded!
  ✔ Dependencies installed!
  ✔ Git repository initialised!

  ✅ Project ready!

    Styling              SCSS
    State                Redux Toolkit
    Package manager      npm
    ESLint + Prettier    ✓ included
    Testing              Vitest + RTL
    CI/CD                GitHub Actions
    ENV validation       Zod
    Error Boundary       ✓

  Next steps:

    cd my-app
    cp .env.example .env
    npm run dev
```

---

## Always included (zero config)

| Layer | What you get |
|-------|-------------|
| **React 19 + Vite 7** | Latest stable, HMR, fast builds |
| **TypeScript** | Strict mode, project references |
| **ESLint 9** | Flat config, react-hooks, react-refresh, typescript-eslint |
| **Prettier** | Opinionated formatting, git-friendly |
| **React Router v7** | File-based layouts, `MainLayout` wrapper |
| **Axios** | Pre-configured instance, Bearer auth, 401 → `/login` redirect |
| **Path aliases** | `@components`, `@hooks`, `@utils`, `@store`, `@styles`, `@i18n` … |
| **ProtectedRoute** | Token-based guard, redirect to `/login` |
| **Pages** | `Home`, `Login`, `NotFound` — all wired to the router |
| **Hooks** | `useLocalStorage`, `useDebounce`, `useMediaQuery` |
| **Utils** | `classNames`, `formatDate`, `truncate`, `capitalize`, `safeJsonParse` |
| **ENV files** | `.env.example` · `.env.development` · `.env.production` |

---

## Optional extras

### 🧪 Testing — Vitest + React Testing Library

```
src/
├── test/setup.ts                    jest-dom + global config
├── components/common/Button.test.tsx
└── hooks/useLocalStorage.test.ts
```

Scripts added: `test`, `test:watch`, `test:coverage`  
`vite.config.ts` gets a full `test:` block with jsdom + coverage-v8.

---

### ⚙️ GitHub Actions CI

`.github/workflows/ci.yml`:

```
jobs:
  quality:  lint → type-check → test (if selected)
  build:    needs quality → tsc + vite build → upload artifact
```

- Concurrency group — cancels duplicate runs
- Adapts install/run commands to npm / yarn / pnpm automatically
- Codecov upload when testing is enabled

---

### 🔐 ENV Validation — Zod

`src/utils/env.ts`:

```ts
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  // add more as needed
});

export function validateEnv(): Env { ... }
```

`validateEnv()` is called in `main.tsx` before rendering — any missing or malformed variable throws immediately with a clear, actionable error.

---

### 🛡️ Error Boundary

`src/components/ErrorBoundary.tsx` — a class component that:
- Catches any render-time exception subtree-wide
- Shows a friendly fallback UI with a **Try again** reset button
- Calls `componentDidCatch` — add your Sentry / Datadog hook there
- Wraps `<Routes>` in `App.tsx` automatically

---

### 📖 Storybook

`.storybook/` configured for `@storybook/react-vite` v8:
- `Button.stories.tsx` — 8 stories covering all variants, sizes, loading, fullWidth
- a11y + interactions + essentials addons
- `autodocs` tag for automatic documentation pages

---

### 🌍 i18n — react-i18next

`src/i18n/locales/en.json` + `es.json` with namespaced keys:

```json
{
  "common": { "loading": "Loading…", "logout": "Logout" },
  "auth":   { "signIn": "Sign in", "invalidCredentials": "…" },
  "home":   { "welcome": "Welcome 👋" },
  "errors": { "notFound": "Page not found", "tryAgain": "Try again" }
}
```

Language auto-detected from the browser, persisted in `localStorage`.

---

### 🐳 Docker

- **Multi-stage `Dockerfile`** — Node 20 build → nginx 1.27 serve
- **`nginx.conf`** — SPA routing (`try_files … /index.html`), gzip, long-term asset caching
- **`docker-compose.yml`** — `app-dev` (hot reload) + `app-prod` profile
- **`.dockerignore`** — keeps images lean

---

### 🐶 Husky + Conventional Commits

`.husky/pre-commit` — runs `lint-staged` (ESLint fix + Prettier format)  
`.husky/commit-msg` — enforces `type(scope): message` format:

```
feat(auth): add login page
fix(button): correct hover state
chore: update dependencies
```

---

## Generated project structure

```
my-app/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx      (if testing)
│   │   │   └── Button.stories.tsx   (if storybook)
│   │   ├── ErrorBoundary.tsx        (if error-boundary)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ProtectedRoute.tsx
│   ├── constants/index.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   └── useLocalStorage.test.ts  (if testing)
│   ├── i18n/                        (if i18n)
│   │   ├── index.ts
│   │   └── locales/en.json, es.json
│   ├── layouts/MainLayout.tsx
│   ├── pages/Home.tsx, Login.tsx, NotFound.tsx
│   ├── services/authService.ts
│   ├── store/                       (if RTK)
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   └── slices/authSlice.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── _variables.scss          (if scss)
│   │   └── _mixins.scss             (if scss)
│   ├── test/setup.ts                (if testing)
│   ├── types/index.ts
│   └── utils/
│       ├── axiosInstance.ts
│       ├── helpers.ts
│       └── env.ts                   (if env-validation)
├── .storybook/                      (if storybook)
│   ├── main.ts
│   └── preview.ts
├── .github/workflows/ci.yml         (if github-actions)
├── .husky/pre-commit, commit-msg    (if husky)
├── Dockerfile, nginx.conf           (if docker)
├── docker-compose.yml               (if docker)
├── .env.example
├── .env.development
├── .env.production
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## CLI flags

```bash
npx create-react-vite-starter --help     # usage + feature overview
npx create-react-vite-starter --version  # print version
npx create-react-vite-starter my-app     # pre-fill project name, still interactive
```

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 (or yarn / pnpm) |

---

## Contributing

Issues and PRs welcome! Please follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

[MIT](LICENSE)
