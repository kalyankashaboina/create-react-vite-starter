// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/authService';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = await loginUser({ email, password });
      dispatch(login({ email: userData.email }));
      navigate('/');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="login">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
