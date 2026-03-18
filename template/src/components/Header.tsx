
import styles from '@/styles/components/Header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h2 className={styles.logo}>MyApp Starter</h2>
      </div>
    </header>
  );
};

export default Header;
