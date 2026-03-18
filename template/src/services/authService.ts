import axios from '@/utils/axiosInstance';

export const loginUser = async (data: { email: string; password: string }) => {
  const response = await axios.post('/auth/login', data);
  const token = response.data.token;
  localStorage.setItem('token', token);
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
};

export const getToken = () => {
  return localStorage.getItem('token');
};
