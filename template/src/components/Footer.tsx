// src/layouts/components/Footer.tsx
const Footer = () => {
  return (
    <footer style={{ background: '#333', padding: '1rem', color: '#fff', textAlign: 'center' }}>
      <small>© {new Date().getFullYear()} MyApp. All rights reserved.</small>
    </footer>
  );
};

export default Footer;
