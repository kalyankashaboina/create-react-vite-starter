// src/pages/Home.tsx
import { useAppSelector } from '@/store/hooks';
import styles from '@styles/pages/Home.module.scss';

const Home = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <section className={styles.home}>
      <div className={styles.container}>
        <h1 className={styles.title}>🚀 React Starter Boilerplate</h1>
        <p className={styles.subtitle}>
          Welcome <strong>{user?.email || 'Guest'}</strong> 👋
        </p>

        <p className={styles.description}>
          This is a developer-friendly starter template built with modern web
          technologies, optimized for scalability, speed, and clarity.
        </p>

        <ul className={styles.features}>
          <li>
            <strong>⚡ Vite + React + TypeScript:</strong> Fast, typed, modern
            frontend stack
          </li>
          <li>
            <strong>🎯 Redux Toolkit:</strong> Scalable state management with
            typed hooks
          </li>
          <li>
            <strong>🛠️ SCSS Modules:</strong> Modular, maintainable component
            styling
          </li>
          <li>
            <strong>🧭 React Router v6+:</strong> Nested layouts and routes
            supported
          </li>
          <li>
            <strong>🧩 Folder Structure:</strong> Clean, organized architecture
            for rapid development
          </li>
          <li>
            <strong>🚀 Dev Experience:</strong> ESLint, Prettier, aliases like{' '}
            <code>@/pages</code>, <code>@/store</code>, etc.
          </li>
        </ul>

        <div className={styles.tip}>
          ✅ Clone this and start building instantly — just add your components
          and APIs!
        </div>
      </div>
    </section>
  );
};

export default Home;
