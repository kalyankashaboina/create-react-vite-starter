// src/layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import styles from "@styles/layouts/MainLayout.module.scss"
import Header from "@/components/Header";

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
