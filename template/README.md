# ⚡ Vite + React + TypeScript + Redux Starter

A modern production-ready boilerplate built with **Vite**, **React**, **TypeScript**, **Redux Toolkit**, and **SCSS Modules** — ideal for scalable web apps.

---

## ✨ Features

- ⚛️ **React 18+** with Functional Components & Hooks  
- ⚡ **Vite 7** for lightning-fast dev experience  
- 🛠️ **TypeScript** for static typing  
- 🧱 **Redux Toolkit** + Typed Hooks  
- 🧭 **React Router v6+**  
- 🎨 **SCSS Modules** for modular styling  
- 🧩 **Alias Imports** (`@/pages`, `@/components`, `@/store`, etc.)  
- 🔐 **Auth Flow** + Protected Routes  
- 💡 **ESLint** & formatting ready  

---

## 🚀 Getting Started

```bash
git clone https://github.com/your-username/vite-react-ts-starter.git my-app
cd my-app
npm install
npm run dev
```

---

## 📁 Folder Structure

```
src/
├── components/       # Reusable UI components
├── layouts/          # Main layout with Header/Footer
├── pages/            # Route-based pages
├── services/         # API service logic (e.g. auth)
├── store/            # Redux slices & hooks
├── styles/           # Global and modular SCSS
├── utils/            # Axios instance & helpers
├── App.tsx
├── main.tsx
```

---

## ✅ ESLint Setup for Production

To expand lint rules with type checking and React best practices:

```ts
// eslint.config.js
import tseslint from 'typescript-eslint'
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,

      // React-specific rules
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

## 🧪 Coming Soon

- ✅ Unit tests with Vitest or Jest  
- ✅ Dark/Light theme toggle  
- ✅ CI/CD workflow (GitHub Actions)

---

## 📄 License

MIT – feel free to use, modify, and share this starter in your own projects.

> Built by **Kalyan Kashaboina** with ❤️
