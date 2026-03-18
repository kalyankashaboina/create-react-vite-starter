#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ora from 'ora';
import enquirer from 'enquirer';

const { Select, MultiSelect, Input, Toggle } = enquirer;
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PKG_VERSION = '2.0.0';

const write = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};
const ext = (style) => style === 'scss' ? 'scss' : 'css';


const arg1 = process.argv[2];
if (arg1 === '--version' || arg1 === '-v') {
  console.log(`create-react-vite-starter v${PKG_VERSION}`);
  process.exit(0);
}
if (arg1 === '--help' || arg1 === '-h') {
  console.log([
    '',
    '  create-react-vite-starter v4.0.0',
    '',
    '  Usage:',
    '    npx create-react-vite-starter [project-name]',
    '    npx create-react-vite-starter --version | --help',
    '',
    '  Always included:',
    '    React 19 + Vite 7 + TypeScript (strict)',
    '    ESLint 9 + Prettier',
    '    Path aliases, Axios instance, ProtectedRoute',
    '    .env.example / .env.development / .env.production',
    '',
    '  Optional (prompted):',
    '    Styling:        SCSS | CSS Modules | Tailwind',
    '    State:          RTK | TanStack Query | Both | None',
    '    Testing:        Vitest + React Testing Library',
    '    CI/CD:          GitHub Actions',
    '    ENV guard:      Zod schema validation',
    '    Storybook:      Component docs + stories',
    '    Error Boundary: Global crash handler',
    '    i18n:           react-i18next (en + es)',
    '    Docker:         Dockerfile + nginx + docker-compose',
    '    Husky:          Pre-commit + Conventional Commits',
    '',
  ].join('\n'));
  process.exit(0);
}


function printBanner() {
  console.log('\n' + chalk.bold.cyan('  ╔════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║') + chalk.bold.white('   create-react-vite-starter  v4.0.0  ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ╚════════════════════════════════════════╝') + '\n');
}


async function promptUser(nameArg) {
  const answers = {};

  if (nameArg && !nameArg.startsWith('-')) {
    answers.projectName = nameArg;
  } else {
    answers.projectName = (await new Input({
      name: 'projectName', message: 'Project name', initial: 'my-react-app',
      validate: (v) => /^[a-z0-9-_]+$/i.test(v.trim()) || 'Use only letters, numbers, hyphens or underscores',
    }).run()).trim();
  }

  answers.style = await new Select({
    name: 'style', message: 'Styling method',
    choices: [
      { name: 'scss',     message: '🎨  SCSS      (variables, mixins, nesting)' },
      { name: 'css',      message: '📄  CSS       (plain CSS Modules)' },
      { name: 'tailwind', message: '💨  Tailwind  (utility-first)' },
    ],
  }).run();

  answers.stateManager = await new Select({
    name: 'stateManager', message: 'State management',
    choices: [
      { name: 'rtk',   message: '🗃️   Redux Toolkit (RTK)' },
      { name: 'query', message: '🔄  TanStack Query' },
      { name: 'both',  message: '⚡  Both RTK + TanStack Query' },
      { name: 'none',  message: '🚫  None' },
    ],
  }).run();

  answers.extras = await new MultiSelect({
    name: 'extras', message: 'Optional extras  (space = toggle, enter = confirm)',
    choices: [
      { name: 'testing',        message: '🧪  Testing         (Vitest + React Testing Library)' },
      { name: 'github-actions', message: '⚙️   GitHub Actions   (CI: lint + test + build)' },
      { name: 'env-validation', message: '🔐  ENV validation   (Zod schema guard)' },
      { name: 'storybook',      message: '📖  Storybook        (component docs + stories)' },
      { name: 'error-boundary', message: '🛡️   Error Boundary   (global crash handler)' },
      { name: 'i18n',           message: '🌍  i18n             (react-i18next, en + es)' },
      { name: 'docker',         message: '🐳  Docker           (Dockerfile + nginx + compose)' },
      { name: 'husky',          message: '🐶  Husky            (pre-commit + Conventional Commits)' },
    ],
  }).run();

  answers.packageManager = await new Select({
    name: 'packageManager', message: 'Package manager',
    choices: [
      { name: 'npm',  message: '📦  npm' },
      { name: 'yarn', message: '🧶  yarn' },
      { name: 'pnpm', message: '⚡  pnpm' },
    ],
  }).run();

  answers.git = await new Toggle({
    name: 'git', message: 'Initialise a git repository',
    enabled: 'Yes', disabled: 'No', initial: true,
  }).run();

  return answers;
}


function buildPackageJson(projectName, stateManager, style, extras, packageManager) {
  const has = (f) => extras.includes(f);
  const deps = {
    axios: '^1.10.0', react: '^19.1.0', 'react-dom': '^19.1.0', 'react-router-dom': '^7.6.3',
  };
  if (stateManager === 'rtk'   || stateManager === 'both') { deps['@reduxjs/toolkit'] = '^2.8.2'; deps['react-redux'] = '^9.2.0'; }
  if (stateManager === 'query' || stateManager === 'both') { deps['@tanstack/react-query'] = '^5.80.7'; deps['@tanstack/react-query-devtools'] = '^5.80.7'; }
  if (has('i18n'))           { deps['i18next'] = '^24.2.3'; deps['react-i18next'] = '^15.5.1'; deps['i18next-browser-languagedetector'] = '^8.0.5'; }
  if (has('env-validation')) { deps['zod'] = '^3.25.67'; }

  const devDeps = {
    '@eslint/js': '^9.30.1', '@types/node': '^24.0.0', '@types/react': '^19.1.8',
    '@types/react-dom': '^19.1.6', '@vitejs/plugin-react': '^4.6.0',
    eslint: '^9.30.1', 'eslint-config-prettier': '^10.1.5',
    'eslint-plugin-react-hooks': '^5.2.0', 'eslint-plugin-react-refresh': '^0.4.20',
    globals: '^16.3.0', prettier: '^3.5.3', typescript: '~5.8.3',
    'typescript-eslint': '^8.35.1', vite: '^7.0.4',
  };
  if (style === 'scss')     { devDeps['sass'] = '^1.89.2'; }
  if (style === 'tailwind') { devDeps['tailwindcss'] = '^3.4.17'; devDeps['autoprefixer'] = '^10.4.21'; devDeps['postcss'] = '^8.5.6'; }
  if (stateManager === 'rtk' || stateManager === 'both') { devDeps['@types/react-redux'] = '^7.1.34'; }
  if (has('testing'))  { devDeps['vitest'] = '^3.2.4'; devDeps['@vitest/coverage-v8'] = '^3.2.4'; devDeps['@testing-library/react'] = '^16.3.0'; devDeps['@testing-library/jest-dom'] = '^6.6.3'; devDeps['@testing-library/user-event'] = '^14.5.2'; devDeps['jsdom'] = '^26.1.0'; }
  if (has('husky'))    { devDeps['husky'] = '^9.1.7'; devDeps['lint-staged'] = '^15.4.3'; }
  if (has('storybook')) {
    devDeps['@storybook/react-vite'] = '^8.6.12'; devDeps['@storybook/react'] = '^8.6.12';
    devDeps['@storybook/addon-essentials'] = '^8.6.12'; devDeps['@storybook/addon-interactions'] = '^8.6.12';
    devDeps['@storybook/addon-a11y'] = '^8.6.12'; devDeps['storybook'] = '^8.6.12';
  }

  const scripts = {
    dev: 'vite', build: 'tsc -b && vite build', preview: 'vite preview',
    lint: 'eslint .', 'lint:fix': 'eslint . --fix',
    format: 'prettier --write "src/**/*.{ts,tsx,css,scss}"',
    'type-check': 'tsc --noEmit',
  };
  if (has('testing'))  { scripts['test'] = 'vitest run'; scripts['test:watch'] = 'vitest'; scripts['test:coverage'] = 'vitest run --coverage'; }
  if (has('husky'))    { scripts['prepare'] = 'husky'; }
  if (has('docker'))   { scripts['docker:dev'] = 'docker-compose up'; scripts['docker:build'] = `docker build -t ${projectName} .`; }
  if (has('storybook')){ scripts['storybook'] = 'storybook dev -p 6006'; scripts['build-storybook'] = 'storybook build'; }

  const pkg = { name: projectName, private: true, version: '0.0.0', type: 'module', scripts, dependencies: deps, devDependencies: devDeps };
  if (has('husky')) pkg['lint-staged'] = { 'src/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'], 'src/**/*.{css,scss}': ['prettier --write'] };
  return pkg;
}


function buildViteConfig(style, extras) {
  const hasTesting = extras.includes('testing');
  const scssBlock = style === 'scss' ? `
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: \`@use "@styles/_variables.scss" as *;\n@use "@styles/_mixins.scss" as *;\`,
      },
    },
  },` : '';
  const twImports = style === 'tailwind' ? `\nimport tailwindcss from 'tailwindcss';\nimport autoprefixer from 'autoprefixer';` : '';
  const twCss     = style === 'tailwind' ? `\n  css: { postcss: { plugins: [tailwindcss, autoprefixer] } },` : '';
  const testBlock = hasTesting ? `
  test: {
    globals: true, environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'json', 'html'], exclude: ['node_modules/', 'src/test/'] },
  },` : '';

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';${twImports}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':           path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages':      path.resolve(__dirname, './src/pages'),
      '@layouts':    path.resolve(__dirname, './src/layouts'),
      '@store':      path.resolve(__dirname, './src/store'),
      '@styles':     path.resolve(__dirname, './src/styles'),
      '@utils':      path.resolve(__dirname, './src/utils'),
      '@services':   path.resolve(__dirname, './src/services'),
      '@hooks':      path.resolve(__dirname, './src/hooks'),
      '@types':      path.resolve(__dirname, './src/types'),
      '@constants':  path.resolve(__dirname, './src/constants'),
      '@assets':     path.resolve(__dirname, './src/assets'),
      '@i18n':       path.resolve(__dirname, './src/i18n'),
    },
  },${scssBlock}${twCss}${testBlock}
});
`;
}


function buildTsConfigApp() {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020', useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext',
      skipLibCheck: true, moduleResolution: 'bundler',
      allowImportingTsExtensions: true, isolatedModules: true,
      moduleDetection: 'force', noEmit: true, jsx: 'react-jsx',
      strict: true, noUnusedLocals: true, noUnusedParameters: true,
      noFallthroughCasesInSwitch: true, baseUrl: '.',
      paths: {
        '@/*': ['./src/*'], '@components/*': ['./src/components/*'],
        '@pages/*': ['./src/pages/*'], '@layouts/*': ['./src/layouts/*'],
        '@store/*': ['./src/store/*'], '@styles/*': ['./src/styles/*'],
        '@utils/*': ['./src/utils/*'], '@services/*': ['./src/services/*'],
        '@hooks/*': ['./src/hooks/*'], '@types/*': ['./src/types/*'],
        '@constants/*': ['./src/constants/*'], '@assets/*': ['./src/assets/*'],
        '@i18n/*': ['./src/i18n/*'],
      },
    },
    include: ['src'],
  }, null, 2);
}


function buildEslintConfig(hasTesting) {
  return `import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars':    ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any':   'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
${hasTesting ? `  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },\n` : ''}  eslintConfigPrettier
);
`;
}

function buildPrettierConfig() {
  return JSON.stringify({ semi: true, singleQuote: true, tabWidth: 2, trailingComma: 'es5', printWidth: 100, jsxSingleQuote: false, arrowParens: 'always', endOfLine: 'lf' }, null, 2);
}


function buildTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { primary: { DEFAULT: '#007acc', dark: '#005f99', light: '#e6f3fb' } } } },
  plugins: [],
};
`;
}
function buildPostcssConfig() { return `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`; }


function buildGlobalCss(style) {
  const base = `/* ─── CSS Custom Properties & Reset ─────────────────────────────────────────── */
:root {
  --color-primary: #007acc; --color-primary-dark: #005f99; --color-primary-light: #e6f3fb;
  --color-secondary: #6c757d; --color-text: #212529; --color-text-muted: #6c757d;
  --color-white: #ffffff; --color-black: #000000; --color-bg: #f8f9fa; --color-bg-dark: #343a40;
  --color-error: #dc3545; --color-success: #28a745; --color-warning: #ffc107; --color-info: #17a2b8;
  --font-sans: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-mono: 'Cascadia Code', 'Fira Code', monospace;
  --font-size-xs: 0.75rem; --font-size-sm: 0.875rem; --font-size-base: 1rem;
  --font-size-lg: 1.125rem; --font-size-xl: 1.25rem; --font-size-2xl: 1.5rem; --font-size-3xl: 2rem;
  --font-weight-normal: 400; --font-weight-medium: 500; --font-weight-bold: 600; --line-height: 1.6;
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem; --space-10: 2.5rem; --space-16: 4rem;
  --radius-sm: 4px; --radius: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.05); --shadow: 0 2px 4px rgba(0,0,0,.10);
  --shadow-md: 0 4px 8px rgba(0,0,0,.12); --shadow-lg: 0 8px 24px rgba(0,0,0,.15);
  --transition-fast: 150ms ease; --transition: 250ms ease; --transition-slow: 400ms ease;
  --z-sticky: 100; --z-modal: 1000; --z-toast: 1100; --z-tooltip: 1200;
}
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body { font-family: var(--font-sans); font-size: var(--font-size-base); color: var(--color-text); background-color: var(--color-bg); line-height: var(--line-height); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
button { cursor: pointer; border: none; background: none; font: inherit; }
a { color: var(--color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
ul, ol { list-style: none; }
#root { display: flex; flex-direction: column; min-height: 100vh; }
`;
  return style === 'tailwind' ? `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${base}` : base;
}

function buildScssVariables() {
  return `$color-primary: #007acc; $color-primary-dark: #005f99; $color-primary-light: #e6f3fb;
$color-secondary: #6c757d; $color-text: #212529; $color-text-muted: #6c757d;
$color-white: #ffffff; $color-black: #000000; $color-bg: #f8f9fa; $color-bg-dark: #343a40;
$color-error: #dc3545; $color-success: #28a745; $color-warning: #ffc107; $color-info: #17a2b8;
$font-sans: 'Segoe UI', system-ui, -apple-system, sans-serif;
$font-size-xs: 0.75rem; $font-size-sm: 0.875rem; $font-size-base: 1rem;
$font-size-lg: 1.125rem; $font-size-xl: 1.25rem; $font-size-2xl: 1.5rem; $font-size-3xl: 2rem;
$font-weight-normal: 400; $font-weight-medium: 500; $font-weight-bold: 600; $line-height: 1.6;
$space-1: 0.25rem; $space-2: 0.5rem; $space-3: 0.75rem; $space-4: 1rem;
$space-5: 1.25rem; $space-6: 1.5rem; $space-8: 2rem; $space-10: 2.5rem; $space-16: 4rem;
$radius-sm: 4px; $radius: 6px; $radius-md: 8px; $radius-lg: 12px; $radius-full: 9999px;
$shadow-sm: 0 1px 2px rgba(0,0,0,.05); $shadow: 0 2px 4px rgba(0,0,0,.10);
$shadow-md: 0 4px 8px rgba(0,0,0,.12); $shadow-lg: 0 8px 24px rgba(0,0,0,.15);
$transition-fast: 150ms ease; $transition: 250ms ease; $transition-slow: 400ms ease;
$breakpoint-sm: 576px; $breakpoint-md: 768px; $breakpoint-lg: 992px;
$breakpoint-xl: 1200px; $breakpoint-2xl: 1400px;
`;
}

function buildScssMixins() {
  return `@mixin flex-center     { display:flex; align-items:center; justify-content:center; }
@mixin flex-between    { display:flex; align-items:center; justify-content:space-between; }
@mixin flex-col        { display:flex; flex-direction:column; }
@mixin flex-col-center { display:flex; flex-direction:column; align-items:center; justify-content:center; }
@mixin respond-to($bp) {
  @if $bp=='sm'  { @media (min-width:$breakpoint-sm)  { @content; } }
  @if $bp=='md'  { @media (min-width:$breakpoint-md)  { @content; } }
  @if $bp=='lg'  { @media (min-width:$breakpoint-lg)  { @content; } }
  @if $bp=='xl'  { @media (min-width:$breakpoint-xl)  { @content; } }
  @if $bp=='2xl' { @media (min-width:$breakpoint-2xl) { @content; } }
}
@mixin truncate { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
@mixin line-clamp($n) { display:-webkit-box; -webkit-line-clamp:$n; -webkit-box-orient:vertical; overflow:hidden; }
@mixin visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border-width:0; }
`;
}


function buildButtonTsx(style) {
  const e = ext(style);
  return `import styles from '@styles/components/common/Button.module.${e}';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; fullWidth?: boolean;
}
const Button = ({ children, variant='primary', size='md', loading=false, fullWidth=false, disabled, className='', ...props }: ButtonProps) => {
  const cls = [styles.btn, styles[\`btn--\${variant}\`], styles[\`btn--\${size}\`], fullWidth?styles['btn--full']:'', loading?styles['btn--loading']:'', className].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled||loading} {...props}>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
};
export default Button;
`;
}

function buildButtonTailwind() {
  return `export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; fullWidth?: boolean;
}
const variantMap: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-500 text-white hover:opacity-90',
};
const sizeMap: Record<ButtonSize, string> = { sm:'px-3 py-1 text-sm', md:'px-4 py-2 text-base', lg:'px-6 py-3 text-lg' };
const Button = ({ children, variant='primary', size='md', loading=false, fullWidth=false, disabled, className='', ...props }: ButtonProps) => (
  <button className={['inline-flex items-center justify-center gap-2 rounded font-medium transition-all cursor-pointer border border-transparent', variantMap[variant], sizeMap[size], fullWidth?'w-full':'', (loading||disabled)?'opacity-60 cursor-not-allowed':'', className].filter(Boolean).join(' ')} disabled={disabled||loading} {...props}>
    {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
    {children}
  </button>
);
export default Button;
`;
}

function buildButtonCss(style) {
  if (style === 'scss') return `.btn { display:inline-flex; align-items:center; justify-content:center; gap:$space-2; padding:$space-2 $space-4; border-radius:$radius; font-size:$font-size-base; font-weight:$font-weight-medium; line-height:1.5; transition:background-color $transition, opacity $transition; cursor:pointer; border:1.5px solid transparent;
  &--primary   { background-color:$color-primary; color:$color-white; &:hover:not(:disabled) { background-color:$color-primary-dark; } }
  &--secondary { background:transparent; color:$color-primary; border-color:$color-primary; &:hover:not(:disabled) { background-color:$color-primary-light; } }
  &--ghost     { background:transparent; color:$color-text; &:hover:not(:disabled) { background-color:rgba(0,0,0,.05); } }
  &--danger    { background-color:$color-error; color:$color-white; &:hover:not(:disabled) { opacity:.88; } }
  &--sm { padding:$space-1 $space-3; font-size:$font-size-sm; }
  &--lg { padding:$space-3 $space-6; font-size:$font-size-lg; }
  &--full { width:100%; }
  &:disabled, &--loading { opacity:.6; cursor:not-allowed; }
}
.spinner { width:1em; height:1em; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
`;
  return `.btn { display:inline-flex; align-items:center; justify-content:center; gap:var(--space-2); padding:var(--space-2) var(--space-4); border-radius:var(--radius); font-size:var(--font-size-base); font-weight:var(--font-weight-medium); line-height:1.5; transition:background-color var(--transition); cursor:pointer; border:1.5px solid transparent; }
.btn--primary { background-color:var(--color-primary); color:var(--color-white); } .btn--primary:hover:not(:disabled) { background-color:var(--color-primary-dark); }
.btn--secondary { background:transparent; color:var(--color-primary); border-color:var(--color-primary); } .btn--secondary:hover:not(:disabled) { background-color:var(--color-primary-light); }
.btn--ghost { background:transparent; color:var(--color-text); } .btn--ghost:hover:not(:disabled) { background-color:rgba(0,0,0,.05); }
.btn--danger { background-color:var(--color-error); color:var(--color-white); } .btn--danger:hover:not(:disabled) { opacity:.88; }
.btn--sm { padding:var(--space-1) var(--space-3); font-size:var(--font-size-sm); }
.btn--lg { padding:var(--space-3) var(--space-6); font-size:var(--font-size-lg); }
.btn--full { width:100%; } .btn:disabled,.btn--loading { opacity:.6; cursor:not-allowed; }
.spinner { width:1em; height:1em; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
`;
}

function buildHeaderTsx(style) {
  if (style === 'tailwind') return `import { Link, useNavigate } from 'react-router-dom';
const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
        <Link to="/" className="text-xl font-bold text-blue-600 hover:opacity-80 transition">MyApp</Link>
        <nav className="flex gap-6" aria-label="Main navigation">
          <Link to="/" className="text-gray-700 font-medium hover:text-blue-600 transition">Home</Link>
        </nav>
        <button className="border border-gray-400 text-gray-600 px-4 py-1 rounded text-sm hover:bg-gray-800 hover:text-white transition"
          onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
      </div>
    </header>
  );
};
export default Header;
`;
  const e = ext(style);
  return `import { Link, useNavigate } from 'react-router-dom';
import styles from '@styles/components/Header.module.${e}';
const Header = () => {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>MyApp</Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/" className={styles.navLink}>Home</Link>
        </nav>
        <button className={styles.logoutBtn} onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
      </div>
    </header>
  );
};
export default Header;
`;
}

function buildHeaderCss(style) {
  if (style === 'scss') return `.header { background:$color-white; border-bottom:1px solid rgba($color-black,.08); box-shadow:$shadow-sm; position:sticky; top:0; z-index:var(--z-sticky); }
.inner { @include flex-between; max-width:1200px; margin:0 auto; padding:$space-4 $space-6; }
.logo { font-size:$font-size-xl; font-weight:$font-weight-bold; color:$color-primary; text-decoration:none; &:hover { opacity:.85; } }
.nav { display:flex; gap:$space-6; }
.navLink { color:$color-text; font-weight:$font-weight-medium; text-decoration:none; transition:color $transition; &:hover { color:$color-primary; } }
.logoutBtn { background:none; border:1.5px solid $color-secondary; color:$color-secondary; padding:$space-1 $space-4; border-radius:$radius; font-size:$font-size-sm; cursor:pointer; transition:background-color $transition,color $transition;
  &:hover { background-color:$color-bg-dark; color:$color-white; border-color:$color-bg-dark; }
}
`;
  return `.header { background:var(--color-white); border-bottom:1px solid rgba(0,0,0,.08); box-shadow:var(--shadow-sm); position:sticky; top:0; z-index:var(--z-sticky); }
.inner { display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto; padding:var(--space-4) var(--space-6); }
.logo { font-size:var(--font-size-xl); font-weight:var(--font-weight-bold); color:var(--color-primary); text-decoration:none; } .logo:hover { opacity:.85; }
.nav { display:flex; gap:var(--space-6); }
.navLink { color:var(--color-text); font-weight:var(--font-weight-medium); text-decoration:none; } .navLink:hover { color:var(--color-primary); }
.logoutBtn { border:1.5px solid var(--color-secondary); color:var(--color-secondary); padding:var(--space-1) var(--space-4); border-radius:var(--radius); font-size:var(--font-size-sm); cursor:pointer; background:none; }
.logoutBtn:hover { background-color:var(--color-bg-dark); color:var(--color-white); border-color:var(--color-bg-dark); }
`;
}

function buildMainLayoutTsx(style) {
  if (style === 'tailwind') return `import { Outlet } from 'react-router-dom';
import Header from '@components/Header';
import Footer from '@components/Footer';
const MainLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10"><Outlet /></main>
    <Footer />
  </div>
);
export default MainLayout;
`;
  const e = ext(style);
  return `import { Outlet } from 'react-router-dom';
import Header from '@components/Header';
import Footer from '@components/Footer';
import styles from '@styles/layouts/MainLayout.module.${e}';
const MainLayout = () => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.main}><Outlet /></main>
    <Footer />
  </div>
);
export default MainLayout;
`;
}

function buildMainLayoutCss(style) {
  if (style === 'scss') return `.layout { @include flex-col; min-height:100vh; }
.main { flex:1; width:100%; max-width:1200px; margin:0 auto; padding:$space-8 $space-6; @include respond-to('md') { padding:$space-10 $space-8; } }
`;
  return `.layout { display:flex; flex-direction:column; min-height:100vh; }
.main { flex:1; width:100%; max-width:1200px; margin:0 auto; padding:var(--space-8) var(--space-6); }
`;
}

function buildHomeTsx(style) {
  if (style === 'tailwind') return `const Home = () => (
  <div className="flex flex-col items-center gap-4 py-24 text-center">
    <h1 className="text-5xl font-bold text-gray-800">Welcome 👋</h1>
    <p className="text-lg text-gray-500">Your Vite + React + TypeScript + Tailwind app is ready.</p>
  </div>
);
export default Home;
`;
  const e = ext(style);
  return `import styles from '@styles/pages/Home.module.${e}';
const Home = () => (
  <div className={styles.home}>
    <h1 className={styles.title}>Welcome 👋</h1>
    <p className={styles.subtitle}>Your Vite + React + TypeScript app is ready.</p>
  </div>
);
export default Home;
`;
}

function buildHomeCss(style) {
  if (style === 'scss') return `.home { @include flex-col-center; gap:$space-4; padding:$space-16 $space-8; text-align:center; }
.title { font-size:$font-size-3xl; font-weight:$font-weight-bold; color:$color-text; }
.subtitle { font-size:$font-size-lg; color:$color-text-muted; }
`;
  return `.home { display:flex; flex-direction:column; align-items:center; gap:var(--space-4); padding:var(--space-16) var(--space-8); text-align:center; }
.title { font-size:var(--font-size-3xl); font-weight:var(--font-weight-bold); color:var(--color-text); }
.subtitle { font-size:var(--font-size-lg); color:var(--color-text-muted); }
`;
}

function buildLoginTsx(style) {
  const isTw = style === 'tailwind';
  const btnImport = isTw ? `import Button from '@components/common/Button';` : `import Button from '@components/common/Button';\nimport styles from '@styles/pages/Login.module.${ext(style)}';`;
  const c = (tw, mod) => isTw ? `className="${tw}"` : `className={styles.${mod}}`;
  return `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
${btnImport}
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await new Promise((res) => setTimeout(res, 800)); navigate('/'); }
    catch { setError('Invalid email or password.'); }
    finally { setLoading(false); }
  };
  return (
    <div ${c('flex items-center justify-center min-h-screen bg-gray-50', 'page')}>
      <div ${c('bg-white rounded-xl shadow-lg p-10 w-full max-w-md', 'card')}>
        <h1 ${c('text-2xl font-bold mb-6 text-center', 'title')}>Sign in</h1>
        {error && <p ${c('bg-red-50 text-red-600 border border-red-200 rounded p-3 mb-4 text-sm', 'error')} role="alert">{error}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div ${c('mb-4', 'field')}>
            <label htmlFor="email" ${c('block text-sm font-medium mb-1', 'label')}>Email</label>
            <input id="email" type="email" ${c('w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition', 'input')}
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div ${c('mb-4', 'field')}>
            <label htmlFor="password" ${c('block text-sm font-medium mb-1', 'label')}>Password</label>
            <input id="password" type="password" ${c('w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition', 'input')}
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div ${c('mt-6', 'submitBtn')}><Button type="submit" fullWidth loading={loading}>Sign in</Button></div>
        </form>
      </div>
    </div>
  );
};
export default Login;
`;
}


function buildStoreIndex() {
  return `import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
export const store = configureStore({
  reducer: { auth: authReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: { ignoredActions: ['persist/PERSIST'] } }),
});
export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`;
}
function buildStoreHooks() {
  return `import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '.';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);
`;
}
function buildAuthSlice() {
  return `import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
interface User { id: string; email: string; name?: string; role?: string; }
interface AuthState { user: User | null; isAuthenticated: boolean; token: string | null; isLoading: boolean; }
const initialState: AuthState = { user: null, isAuthenticated: false, token: localStorage.getItem('token'), isLoading: false };
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<{ user: User; token: string }>) => {
      state.user = payload.user; state.token = payload.token; state.isAuthenticated = true;
      localStorage.setItem('token', payload.token);
    },
    setLoading: (state, { payload }: PayloadAction<boolean>) => { state.isLoading = payload; },
    logout: (state) => { state.user = null; state.token = null; state.isAuthenticated = false; localStorage.removeItem('token'); },
  },
});
export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
`;
}

function buildMainTsx(stateManager, extras) {
  const hasRTK   = stateManager === 'rtk'   || stateManager === 'both';
  const hasQuery = stateManager === 'query' || stateManager === 'both';
  const hasI18n  = extras.includes('i18n');
  const hasEnv   = extras.includes('env-validation');
  const rtkImports   = hasRTK   ? `import { Provider } from 'react-redux';\nimport { store } from '@store/index';` : '';
  const queryImports = hasQuery ? `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\nimport { ReactQueryDevtools } from '@tanstack/react-query-devtools';` : '';
  const queryInit    = hasQuery ? `\nconst queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } } });` : '';
  const i18nImport   = hasI18n  ? `import '@i18n/index';` : '';
  const envImport    = hasEnv   ? `import { validateEnv } from '@utils/env';` : '';
  const envCall      = hasEnv   ? `\nvalidateEnv();\n` : '';
  let app = '<App />';
  if (hasQuery) app = `<QueryClientProvider client={queryClient}>\n      ${app}\n      <ReactQueryDevtools initialIsOpen={false} />\n    </QueryClientProvider>`;
  if (hasRTK)   app = `<Provider store={store}>\n      ${app}\n    </Provider>`;
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
${rtkImports}
${queryImports}
${i18nImport}
${envImport}
import '@/styles/global.css';
${queryInit}
${envCall}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      ${app}
    </BrowserRouter>
  </React.StrictMode>
);
`;
}

function buildAppTsx(extras) {
  const hasEB = extras.includes('error-boundary');
  const ebImp  = hasEB ? `import ErrorBoundary from '@components/ErrorBoundary';\n` : '';
  const wrapO  = hasEB ? `<ErrorBoundary>\n  ` : '';
  const wrapC  = hasEB ? `\n  </ErrorBoundary>` : '';
  return `import { Routes, Route } from 'react-router-dom';
import MainLayout from '@layouts/MainLayout';
import Home from '@pages/Home';
import Login from '@pages/Login';
import NotFound from '@pages/NotFound';
import ProtectedRoute from '@components/ProtectedRoute';
${ebImp}
const App = () => (
  ${wrapO}<Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    </Route>
    <Route path="/login" element={<Login />} />
    <Route path="*" element={<NotFound />} />
  </Routes>${wrapC}
);
export default App;
`;
}


// ─── Testing builders ─────────────────────────────────────────────────────────
function buildTestSetup() { return `import '@testing-library/jest-dom';\n`; }

function buildButtonTest(style) {
  return `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@components/common/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
`;
}

function buildHookTest() {
  return `import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@hooks/index';

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());
  it('returns initialValue when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });
  it('persists value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', ''));
    act(() => { result.current[1]('new-value'); });
    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe('"new-value"');
  });
  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('existing'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('existing');
  });
});
`;
}

// ─── GitHub Actions CI ────────────────────────────────────────────────────────
function buildCiYml(extras, packageManager) {
  const hasTesting = extras.includes('testing');
  const pm = packageManager;
  const install  = pm==='yarn' ? 'yarn' : pm==='pnpm' ? 'pnpm install --frozen-lockfile' : 'npm ci';
  const runCmd   = pm==='yarn' ? 'yarn' : pm==='pnpm' ? 'pnpm run' : 'npm run';
  const cacheKey = pm==='yarn' ? 'yarn.lock' : pm==='pnpm' ? 'pnpm-lock.yaml' : 'package-lock.json';
  return `name: CI

on:
  push:    { branches: [main, develop] }
  pull_request: { branches: [main, develop] }

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Lint + Type Check${hasTesting ? ' + Test' : ''}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: '${pm}' }
      - name: Install
        run: ${install}
      - name: Type check
        run: ${runCmd} type-check
      - name: Lint
        run: ${runCmd} lint
${hasTesting ? `      - name: Test
        run: ${runCmd} test
      - uses: codecov/codecov-action@v4
        if: always()
        with: { files: ./coverage/coverage-final.json }
` : ''}
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: '${pm}' }
      - run: ${install}
      - run: ${runCmd} build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist/, retention-days: 7 }
`;
}

// ─── ENV validation ───────────────────────────────────────────────────────────
function buildEnvSchema() {
  return `import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  // Add more as needed: VITE_APP_TITLE: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    const errors = result.error.issues.map((i) => \`  • \${i.path.join('.')}: \${i.message}\`).join('\\n');
    throw new Error(\`\\n❌ Invalid environment variables:\\n\${errors}\\n\\nCheck your .env file.\`);
  }
  return result.data;
}
`;
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
function buildErrorBoundary() {
  return `import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // TODO: reportError(error, info); // send to Sentry / Datadog etc.
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem', padding:'2rem', textAlign:'center', fontFamily:'system-ui' }}>
          <h1 style={{ fontSize:'2rem', fontWeight:700, color:'#dc3545' }}>Something went wrong</h1>
          <p style={{ color:'#6c757d', maxWidth:'480px' }}>{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
          <button onClick={this.handleReset} style={{ padding:'0.5rem 1.5rem', background:'#007acc', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'1rem' }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
`;
}

// ─── i18n ─────────────────────────────────────────────────────────────────────
function buildI18nIndex() {
  return `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es } },
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
`;
}
function buildI18nEn() {
  return JSON.stringify({ common:{ loading:'Loading…', error:'An error occurred', save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit', logout:'Logout' }, nav:{ home:'Home', profile:'Profile', settings:'Settings' }, auth:{ signIn:'Sign in', email:'Email', password:'Password', invalidCredentials:'Invalid email or password.' }, home:{ welcome:'Welcome 👋', subtitle:'Your app is ready.' }, errors:{ notFound:'Page not found', goHome:'Go home', somethingWrong:'Something went wrong', tryAgain:'Try again' } }, null, 2);
}
function buildI18nEs() {
  return JSON.stringify({ common:{ loading:'Cargando…', error:'Ocurrió un error', save:'Guardar', cancel:'Cancelar', delete:'Eliminar', edit:'Editar', logout:'Cerrar sesión' }, nav:{ home:'Inicio', profile:'Perfil', settings:'Configuración' }, auth:{ signIn:'Iniciar sesión', email:'Correo electrónico', password:'Contraseña', invalidCredentials:'Email o contraseña incorrectos.' }, home:{ welcome:'Bienvenido 👋', subtitle:'Tu aplicación está lista.' }, errors:{ notFound:'Página no encontrada', goHome:'Ir al inicio', somethingWrong:'Algo salió mal', tryAgain:'Intentar de nuevo' } }, null, 2);
}

// ─── Storybook ────────────────────────────────────────────────────────────────
function buildStorybookMain() {
  return `import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: { autodocs: 'tag' },
};
export default config;
`;
}
function buildStorybookPreview() {
  return `import type { Preview } from '@storybook/react';
import '../src/styles/global.css';
const preview: Preview = {
  parameters: {
    actions:  { argTypesRegex: '^on[A-Z].*' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { default: 'light', values: [{ name:'light', value:'#f8f9fa' },{ name:'dark', value:'#343a40' }] },
  },
};
export default preview;
`;
}
function buildButtonStory() {
  return `import type { Meta, StoryObj } from '@storybook/react';
import Button from '@components/common/Button';
const meta: Meta<typeof Button> = {
  title: 'Common/Button', component: Button, tags: ['autodocs'],
  argTypes: {
    variant:   { control: 'select', options: ['primary','secondary','ghost','danger'] },
    size:      { control: 'select', options: ['sm','md','lg'] },
    loading:   { control: 'boolean' }, fullWidth: { control: 'boolean' }, disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;
export const Primary:   Story = { args: { children: 'Primary',   variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Secondary', variant: 'secondary' } };
export const Ghost:     Story = { args: { children: 'Ghost',     variant: 'ghost' } };
export const Danger:    Story = { args: { children: 'Danger',    variant: 'danger' } };
export const Loading:   Story = { args: { children: 'Loading…',  loading: true } };
export const FullWidth: Story = { args: { children: 'Full Width', fullWidth: true } };
`;
}

// ─── Docker ───────────────────────────────────────────────────────────────────
function buildDockerfile(projectName) {
  return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
}
function buildNginxConf() {
  return `server {
  listen 80; server_name _; root /usr/share/nginx/html; index index.html;
  gzip on; gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml; gzip_min_length 1000;
  location / { try_files $uri $uri/ /index.html; }
  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ { expires 1y; add_header Cache-Control "public, immutable"; }
}
`;
}
function buildDockerCompose(projectName) {
  return `version: '3.9'
services:
  app-dev:
    image: node:20-alpine
    working_dir: /app
    volumes: ['.:/app', '/app/node_modules']
    ports: ['5173:5173']
    command: sh -c "npm install && npm run dev -- --host"
    environment: [VITE_API_BASE_URL=\${VITE_API_BASE_URL:-http://localhost:5000/api}]
  app-prod:
    build: { context: ., target: production }
    image: ${projectName}:latest
    ports: ['80:80']
    restart: unless-stopped
    profiles: [prod]
`;
}
function buildDockerIgnore() { return `node_modules\ndist\n.git\n.gitignore\n*.log\n.env\n.env.*\n!.env.example\nREADME.md\n`; }

// ─── Husky ────────────────────────────────────────────────────────────────────
function buildPreCommitHook() { return `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\nnpx lint-staged\n`; }
function buildCommitMsgHook() {
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
commit_regex='^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\\(.+\\))?: .{1,72}$'
if ! grep -qE "$commit_regex" "$1"; then
  echo ""; echo "  ✗ Invalid commit message."; echo "  ✓ Use: type(scope): message"; echo "  Examples:"; echo "    feat(auth): add login page"; echo "    fix(button): correct hover state"; echo ""; exit 1
fi
`;
}

// ─── Utility builders ─────────────────────────────────────────────────────────
function buildAxiosInstance() {
  return `import axios from 'axios';
import { API_BASE_URL } from '@constants/index';
const axiosInstance = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 15_000 });
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});
axiosInstance.interceptors.response.use((res) => res, (error) => {
  if (error.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; }
  return Promise.reject(error);
});
export default axiosInstance;
`;
}
function buildConstants(projectName) {
  return `export const APP_NAME    = '${projectName}';
export const APP_VERSION = '0.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
export const TOKEN_KEY   = 'token';
export const REFRESH_KEY = 'refresh_token';
export const ROUTES = { HOME:'/', LOGIN:'/login', REGISTER:'/register', PROFILE:'/profile', NOT_FOUND:'*' } as const;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
`;
}
function buildAuthService() {
  return `import axiosInstance from '@utils/axiosInstance';
export interface LoginPayload    { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; name: string; }
export interface AuthResponse    { token: string; user: { id: string; email: string; name?: string; }; }
export const loginUser    = async (data: LoginPayload):    Promise<AuthResponse> => (await axiosInstance.post<AuthResponse>('/auth/login',    data)).data;
export const registerUser = async (data: RegisterPayload): Promise<AuthResponse> => (await axiosInstance.post<AuthResponse>('/auth/register', data)).data;
export const refreshToken = async (): Promise<{ token: string }> => (await axiosInstance.post<{ token: string }>('/auth/refresh')).data;
export const logoutUser = (): void => localStorage.removeItem('token');
`;
}
function buildHooks() {
  return `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try { const item = localStorage.getItem(key); return item ? (JSON.parse(item) as T) : initialValue; }
    catch { return initialValue; }
  });
  const setValue = (value: T | ((prev: T) => T)) => {
    try { const next = value instanceof Function ? value(storedValue) : value; setStoredValue(next); localStorage.setItem(key, JSON.stringify(next)); }
    catch (error) { console.error(error); }
  };
  return [storedValue, setValue] as const;
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => { const id = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return debouncedValue;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}
`;
}
function buildTypes() {
  return `export interface ApiError { message: string; statusCode: number; errors?: Record<string, string[]>; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; }
export interface SelectOption<T = string> { label: string; value: T; }
export type ID = string | number;
export type SortOrder = 'asc' | 'desc';
export interface TableColumn<T = unknown> { key: keyof T; label: string; sortable?: boolean; render?: (value: T[keyof T], row: T) => React.ReactNode; }
`;
}
function buildUtils() {
  return `export const formatDate = (date: string | Date, locale = 'en-US'): string => new Date(date).toLocaleDateString(locale, { year:'numeric', month:'short', day:'numeric' });
export const truncate     = (str: string, n: number): string => str.length > n ? str.slice(0, n - 1) + '…' : str;
export const sleep        = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
export const capitalize   = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);
export const unique       = <T>(arr: T[]): T[] => [...new Set(arr)];
export const safeJsonParse = <T>(json: string, fallback: T): T => { try { return JSON.parse(json) as T; } catch { return fallback; } };
export const classNames   = (...classes: (string|undefined|null|false)[]): string => classes.filter(Boolean).join(' ');
`;
}


function buildReadme({ projectName, style, stateManager, extras, packageManager }) {
  const has = (f) => extras.includes(f);
  const pm  = (cmd) => {
    if (packageManager === 'yarn') return cmd.replace('npm run ', 'yarn ').replace('npm install', 'yarn');
    if (packageManager === 'pnpm') return cmd.replace('npm run ', 'pnpm ').replace('npm install', 'pnpm install');
    return cmd;
  };
  const stateLabel = { rtk:'Redux Toolkit (RTK)', query:'TanStack Query', both:'RTK + TanStack Query', none:'None' }[stateManager];
  const runCmd     = { npm:'npm run dev', yarn:'yarn dev', pnpm:'pnpm dev' }[packageManager];
  const optRows = [
    has('testing')        && '| Testing         | Vitest + React Testing Library + coverage |',
    has('github-actions') && '| CI/CD           | GitHub Actions (lint + type-check + test + build) |',
    has('env-validation') && '| ENV guard       | Zod schema validation at startup |',
    has('storybook')      && '| Storybook       | Component docs + stories |',
    has('error-boundary') && '| Error Boundary  | Global crash handler with reset |',
    has('i18n')           && '| i18n            | react-i18next · en + es |',
    has('docker')         && '| Docker          | Multi-stage Dockerfile + nginx + compose |',
    has('husky')          && '| Git hooks       | Husky + lint-staged + Conventional Commits |',
  ].filter(Boolean).join('\n');

  return `# ${projectName}

> Scaffolded with **[create-react-vite-starter](https://npmjs.com/package/create-react-vite-starter) v4.0.0**

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 7 + TypeScript (strict) |
| Styling | ${style.toUpperCase()} |
| State | ${stateLabel} |
| HTTP | Axios (interceptors, 401 handling) |
| Router | React Router v7 |
| Linting | ESLint 9 + TypeScript-ESLint |
| Formatting | Prettier |
${optRows ? optRows + '\n' : ''}
## Quick start

\`\`\`bash
cp .env.example .env
${pm('npm install')}
${runCmd}
\`\`\`

## Scripts

| Script | Description |
|--------|-------------|
| \`${runCmd}\` | Start dev server |
| \`${pm('npm run build')}\` | Type-check + build |
| \`${pm('npm run lint')}\` | Run ESLint |
| \`${pm('npm run format')}\` | Format with Prettier |
| \`${pm('npm run type-check')}\` | TypeScript check |${has('testing') ? `
| \`${pm('npm run test')}\` | Run tests |
| \`${pm('npm run test:coverage')}\` | Tests + coverage |` : ''}${has('storybook') ? `
| \`${pm('npm run storybook')}\` | Start Storybook |` : ''}${has('docker') ? `
| \`${pm('npm run docker:dev')}\` | Docker dev server |` : ''}

## Project structure

\`\`\`
src/
├── assets/          Static assets
├── components/
│   ├── common/      Reusable UI (Button…)${has('error-boundary') ? '\n│   └── ErrorBoundary.tsx' : ''}
├── constants/       App-wide constants
├── hooks/           Custom hooks (useLocalStorage, useDebounce, useMediaQuery)${has('i18n') ? '\n├── i18n/            Translations (en, es)' : ''}
├── layouts/         Page layouts
├── pages/           Route-level pages
├── services/        API service functions
${stateManager !== 'none' ? '├── store/           Redux store + slices\n' : ''}├── styles/          Global CSS + modules
├── types/           Shared TypeScript types
└── utils/           Helpers, axiosInstance${has('env-validation') ? ', env schema' : ''}
${has('testing') ? 'test/\n├── setup.ts         jest-dom config\n└── *.test.tsx        co-located test files\n' : ''}${has('github-actions') ? '.github/workflows/ci.yml\n' : ''}${has('storybook') ? '.storybook/          Storybook config\n' : ''}\`\`\`
${has('husky') ? `
## Commit convention

\`\`\`
feat(scope): description
fix(scope):  description
chore:       update dependencies
\`\`\`
` : ''}${has('docker') ? `
## Docker

\`\`\`bash
docker-compose up               # dev (hot reload)
docker-compose --profile prod up # prod (nginx)
\`\`\`
` : ''}${has('i18n') ? `
## i18n

Translations in \`src/i18n/locales/\`. Language auto-detected from browser.

\`\`\`tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <h1>{t('home.welcome')}</h1>;
\`\`\`
` : ''}
## License

MIT
`;
}


// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  printBanner();
  const nameArg = process.argv[2];
  let answers;
  try { answers = await promptUser(nameArg); }
  catch { console.log(chalk.red('\n❌ Cancelled.')); process.exit(1); }

  const { projectName, style, stateManager, extras, packageManager, git } = answers;
  const has = (f) => extras.includes(f);
  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.log(chalk.red(`\n❌ Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  const spinner = ora();
  const cleanup = () => { spinner.stop(); if (fs.existsSync(targetDir)) fs.removeSync(targetDir); console.log(chalk.red('\n❌ Interrupted. Cleaned up.')); process.exit(1); };
  process.on('SIGINT', cleanup);
  console.log('');
  spinner.start(chalk.cyan('Scaffolding project…'));

  try {
    const src = path.join(targetDir, 'src');

    // ── Directories ──────────────────────────────────────────────────────────
    const dirs = ['src/assets','src/components/common','src/pages','src/layouts','src/services','src/utils','src/hooks','src/types','src/constants','public'];
    if (style !== 'tailwind') dirs.push('src/styles/components/common','src/styles/components','src/styles/layouts','src/styles/pages');
    else dirs.push('src/styles');
    if (stateManager === 'rtk' || stateManager === 'both') dirs.push('src/store/slices');
    if (has('testing'))        dirs.push('src/test');
    if (has('i18n'))           dirs.push('src/i18n/locales');
    if (has('github-actions')) dirs.push('.github/workflows');
    if (has('storybook'))      dirs.push('.storybook');
    for (const d of dirs) fs.mkdirSync(path.join(targetDir, d), { recursive: true });

    // ── Root files ────────────────────────────────────────────────────────────
    write(path.join(targetDir, 'package.json'),      JSON.stringify(buildPackageJson(projectName, stateManager, style, extras, packageManager), null, 2));
    write(path.join(targetDir, 'vite.config.ts'),    buildViteConfig(style, extras));
    write(path.join(targetDir, 'eslint.config.js'),  buildEslintConfig(has('testing')));
    write(path.join(targetDir, '.prettierrc'),        buildPrettierConfig());
    write(path.join(targetDir, '.prettierignore'),    'dist\nnode_modules\nstorybook-static\ncoverage\n');
    write(path.join(targetDir, '.gitignore'),         `node_modules/\ndist/\ndist-ssr/\n*.local\n.env\n.env.*\n!.env.example\nlogs/\n*.log\n.DS_Store\nThumbs.db\ncoverage/\nstorybook-static/\n`);
    write(path.join(targetDir, '.env.example'),       `VITE_API_BASE_URL=http://localhost:5000/api\n`);
    write(path.join(targetDir, '.env.development'),   `VITE_API_BASE_URL=http://localhost:5000/api\n`);
    write(path.join(targetDir, '.env.production'),    `VITE_API_BASE_URL=https://api.yourdomain.com\n`);
    write(path.join(targetDir, 'tsconfig.json'),      JSON.stringify({ files:[], references:[{path:'./tsconfig.app.json'},{path:'./tsconfig.node.json'}] }, null, 2));
    write(path.join(targetDir, 'tsconfig.app.json'),  buildTsConfigApp());
    write(path.join(targetDir, 'tsconfig.node.json'), JSON.stringify({ compilerOptions:{ target:'ES2022', lib:['ES2023'], module:'ESNext', skipLibCheck:true, moduleResolution:'bundler', allowImportingTsExtensions:true, isolatedModules:true, moduleDetection:'force', noEmit:true, strict:true }, include:['vite.config.ts'] }, null, 2));
    write(path.join(targetDir, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
    write(path.join(targetDir, 'README.md'), buildReadme({ projectName, style, stateManager, extras, packageManager }));

    // ── Tailwind ──────────────────────────────────────────────────────────────
    if (style === 'tailwind') {
      write(path.join(targetDir, 'tailwind.config.js'), buildTailwindConfig());
      write(path.join(targetDir, 'postcss.config.js'),  buildPostcssConfig());
    }

    // ── Styles ────────────────────────────────────────────────────────────────
    write(path.join(src, 'styles/global.css'), buildGlobalCss(style));
    if (style === 'scss') { write(path.join(src, 'styles/_variables.scss'), buildScssVariables()); write(path.join(src, 'styles/_mixins.scss'), buildScssMixins()); }
    if (style !== 'tailwind') {
      const e = ext(style);
      write(path.join(src, `styles/components/common/Button.module.${e}`), buildButtonCss(style));
      write(path.join(src, `styles/components/Header.module.${e}`),        buildHeaderCss(style));
      write(path.join(src, `styles/layouts/MainLayout.module.${e}`),       buildMainLayoutCss(style));
      write(path.join(src, `styles/pages/Home.module.${e}`),               buildHomeCss(style));
    }

    // ── Components ────────────────────────────────────────────────────────────
    write(path.join(src, 'components/common/Button.tsx'), style === 'tailwind' ? buildButtonTailwind() : buildButtonTsx(style));
    write(path.join(src, 'components/Header.tsx'),  buildHeaderTsx(style));
    write(path.join(src, 'components/Footer.tsx'),  `const Footer = () => (<footer style={{ textAlign:'center', padding:'1.5rem', color:'var(--color-text-muted)', fontSize:'var(--font-size-sm)' }}>© {new Date().getFullYear()} ${projectName}</footer>);\nexport default Footer;\n`);
    write(path.join(src, 'components/ProtectedRoute.tsx'), `import { Navigate } from 'react-router-dom';\ninterface ProtectedRouteProps { children: React.ReactNode; }\nconst ProtectedRoute = ({ children }: ProtectedRouteProps) => { const token = localStorage.getItem('token'); return token ? <>{children}</> : <Navigate to="/login" replace />; };\nexport default ProtectedRoute;\n`);
    if (has('error-boundary')) write(path.join(src, 'components/ErrorBoundary.tsx'), buildErrorBoundary());

    // ── Layouts + Pages ───────────────────────────────────────────────────────
    write(path.join(src, 'layouts/MainLayout.tsx'), buildMainLayoutTsx(style));
    write(path.join(src, 'pages/Home.tsx'),   buildHomeTsx(style));
    write(path.join(src, 'pages/Login.tsx'),  buildLoginTsx(style));
    write(path.join(src, 'pages/NotFound.tsx'), `import { Link } from 'react-router-dom';\nconst NotFound = () => (<div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem', textAlign:'center' }}><h1 style={{ fontSize:'5rem', fontWeight:700, color:'var(--color-text-muted)' }}>404</h1><p style={{ color:'var(--color-text-muted)' }}>Page not found</p><Link to="/">Go home</Link></div>);\nexport default NotFound;\n`);

    // ── Store ─────────────────────────────────────────────────────────────────
    if (stateManager === 'rtk' || stateManager === 'both') {
      write(path.join(src, 'store/index.ts'),            buildStoreIndex());
      write(path.join(src, 'store/hooks.ts'),            buildStoreHooks());
      write(path.join(src, 'store/slices/authSlice.ts'), buildAuthSlice());
    }

    // ── Utils / Services / Hooks / Types / Constants ──────────────────────────
    write(path.join(src, 'utils/axiosInstance.ts'), buildAxiosInstance());
    write(path.join(src, 'utils/helpers.ts'),        buildUtils());
    write(path.join(src, 'services/authService.ts'), buildAuthService());
    write(path.join(src, 'hooks/index.ts'),          buildHooks());
    write(path.join(src, 'types/index.ts'),          buildTypes());
    write(path.join(src, 'constants/index.ts'),      buildConstants(projectName));
    write(path.join(src, 'assets/.gitkeep'),         '');

    // ── Optional features ─────────────────────────────────────────────────────
    if (has('env-validation'))  write(path.join(src, 'utils/env.ts'),             buildEnvSchema());
    if (has('i18n')) {
      write(path.join(src, 'i18n/index.ts'),         buildI18nIndex());
      write(path.join(src, 'i18n/locales/en.json'),  buildI18nEn());
      write(path.join(src, 'i18n/locales/es.json'),  buildI18nEs());
    }
    if (has('testing')) {
      write(path.join(src, 'test/setup.ts'),                           buildTestSetup());
      write(path.join(src, 'components/common/Button.test.tsx'),       buildButtonTest(style));
      write(path.join(src, 'hooks/useLocalStorage.test.ts'),           buildHookTest());
    }
    if (has('storybook')) {
      write(path.join(targetDir, '.storybook/main.ts'),    buildStorybookMain());
      write(path.join(targetDir, '.storybook/preview.ts'), buildStorybookPreview());
      write(path.join(src, 'components/common/Button.stories.tsx'), buildButtonStory());
    }
    if (has('github-actions')) write(path.join(targetDir, '.github/workflows/ci.yml'), buildCiYml(extras, packageManager));
    if (has('docker')) {
      write(path.join(targetDir, 'Dockerfile'),         buildDockerfile(projectName));
      write(path.join(targetDir, 'nginx.conf'),         buildNginxConf());
      write(path.join(targetDir, 'docker-compose.yml'), buildDockerCompose(projectName));
      write(path.join(targetDir, '.dockerignore'),      buildDockerIgnore());
    }

    // ── Entry points ─────────────────────────────────────────────────────────
    write(path.join(src, 'main.tsx'),       buildMainTsx(stateManager, extras));
    write(path.join(src, 'App.tsx'),        buildAppTsx(extras));
    write(path.join(src, 'vite-env.d.ts'), '/// <reference types="vite/client" />\n');

    spinner.succeed(chalk.green('Project scaffolded!'));

    // ── Install ───────────────────────────────────────────────────────────────
    spinner.start(chalk.cyan(`Installing dependencies with ${packageManager}…`));
    const installCmd = { npm:'npm install', yarn:'yarn', pnpm:'pnpm install' }[packageManager];
    try { execSync(installCmd, { stdio:'pipe', cwd:targetDir }); spinner.succeed(chalk.green('Dependencies installed!')); }
    catch { spinner.warn(chalk.yellow('Install failed — run it manually.')); }

    // ── Git + Husky ───────────────────────────────────────────────────────────
    if (git) {
      try { execSync('git init && git add -A && git commit -m "chore: initial scaffold"', { stdio:'pipe', cwd:targetDir }); spinner.succeed(chalk.green('Git repository initialised!')); }
      catch { /* ok */ }
    }
    if (has('husky') && git) {
      try {
        execSync('npx husky init', { stdio:'pipe', cwd:targetDir });
        write(path.join(targetDir, '.husky/pre-commit'), buildPreCommitHook());
        write(path.join(targetDir, '.husky/commit-msg'), buildCommitMsgHook());
        execSync('chmod +x .husky/pre-commit .husky/commit-msg', { stdio:'pipe', cwd:targetDir });
        spinner.succeed(chalk.green('Husky hooks configured!'));
      } catch { spinner.warn(chalk.yellow('Husky setup failed — run "npx husky init" manually.')); }
    }

    process.removeListener('SIGINT', cleanup);

    // ── Summary ───────────────────────────────────────────────────────────────
    const stateLabel = { rtk:'Redux Toolkit', query:'TanStack Query', both:'RTK + TanStack Query', none:'None' };
    const runCmd     = { npm:'npm run dev', yarn:'yarn dev', pnpm:'pnpm dev' }[packageManager];
    const row = (label, val) => console.log(`    ${label.padEnd(22)} ${chalk.cyan(val)}`);

    console.log('\n' + chalk.bold.green('  ✅ Project ready!\n'));
    console.log(chalk.bold('  Stack:'));
    row('Styling',             style.toUpperCase());
    row('State',               stateLabel[stateManager]);
    row('Package manager',     packageManager);
    row('ESLint + Prettier',   '✓ included');
    if (has('testing'))        row('Testing',           'Vitest + RTL');
    if (has('github-actions')) row('CI/CD',             'GitHub Actions');
    if (has('env-validation')) row('ENV validation',    'Zod');
    if (has('storybook'))      row('Storybook',         '✓');
    if (has('error-boundary')) row('Error Boundary',    '✓');
    if (has('i18n'))           row('i18n',              'en + es');
    if (has('docker'))         row('Docker',            '✓');
    if (has('husky'))          row('Husky',             '✓ + Conventional Commits');

    console.log(chalk.bold('\n  Next steps:\n'));
    console.log(`    ${chalk.cyan(`cd ${projectName}`)}`);
    console.log(`    ${chalk.cyan('cp .env.example .env')}`);
    console.log(`    ${chalk.cyan(runCmd)}\n`);

  } catch (err) {
    cleanup();
    console.error(chalk.red(`\n❌ Error: ${err.message}`));
    process.exit(1);
  }
}

main();
