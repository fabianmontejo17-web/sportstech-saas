import React, { createContext, useContext, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('sportstech_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    if (data.ok) {
      localStorage.setItem('sportstech_token', data.token);
      localStorage.setItem('sportstech_user', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sportstech_token');
    localStorage.removeItem('sportstech_user');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
