import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [themeClass, setThemeClass] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved) setThemeClass(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${themeClass}`} style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div 
        className="max-w-md w-full rounded-2xl shadow-lg p-8"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span style={{ color: 'var(--accent)' }}>Kanban</span>
            <span style={{ color: 'var(--text-primary)' }}>Pro</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Entre na sua conta</p>
        </div>
        
        {error && (
          <div 
            className="p-3 rounded-xl mb-4 text-center text-sm"
            style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
            <input 
              type="email" 
              className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Senha</label>
            <input 
              type="password" 
              className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full text-white font-medium py-3 px-4 rounded-xl transition-all cursor-pointer"
            style={{ 
              backgroundColor: 'var(--accent)',
              boxShadow: `0 0 20px var(--accent-glow)`
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            Entrar
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Não tem uma conta?{' '}
          <Link to="/register" style={{ color: 'var(--accent-text)' }} className="hover:underline">Registre-se</Link>
        </p>
      </div>
    </div>
  );
}
