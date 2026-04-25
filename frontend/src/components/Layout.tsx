import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, CheckSquare, Tags, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [themeClass, setThemeClass] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadSettings = () => {
    const savedTheme = localStorage.getItem('app-theme') || '';
    const savedFocus = localStorage.getItem('focus-mode');
    
    setThemeClass(savedTheme);
    setFocusMode(savedFocus === 'true');
  };

  const toggleFocus = () => {
    const nextFocus = !focusMode;
    setFocusMode(nextFocus);
    localStorage.setItem('focus-mode', nextFocus.toString());
    window.dispatchEvent(new Event('themeChange')); // Update other components if needed
  };

  useEffect(() => {
    loadSettings();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Focus Mode with Shift + F
      if (e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFocus();
      }
    };

    window.addEventListener('themeChange', loadSettings);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('themeChange', loadSettings);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusMode]);

  const navItems = [
    { name: 'Início', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Minhas Tarefas', path: '/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Categorias', path: '/categories', icon: <Tags size={20} /> },
    { name: 'Configurações', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className={`flex h-screen overflow-hidden ${themeClass} ${isTransitioning ? 'theme-transition' : ''}`}
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside 
        className={`flex flex-col backdrop-blur-md transition-all duration-500 overflow-hidden ${focusMode ? 'w-0 border-r-0 opacity-0' : 'w-64 opacity-100'}`}
        style={{ 
          backgroundColor: 'var(--sidebar-bg)', 
          borderRight: focusMode ? 'none' : '1px solid var(--border)' 
        }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-1">
            <span style={{ color: 'var(--accent)' }}>Kanban</span>
            <span style={{ color: 'var(--text-primary)' }}>Pro</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 min-w-[256px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={isActive ? {
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-text)',
                  fontWeight: 500,
                  border: '1px solid var(--border-strong)',
                  boxShadow: `0 0 15px var(--accent-glow)`
                } : {
                  color: 'var(--text-secondary)',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)' }}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 min-w-[256px]" style={{ borderTop: '1px solid var(--border)' }}>
          <Link 
            to="/profile" 
            className="flex items-center space-x-3 p-3 rounded-xl transition-colors cursor-pointer"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ 
                backgroundColor: user?.avatarUrl?.startsWith('preset:') 
                  ? (() => { const presets: Record<string, string> = { astronaut:'#1e3a5f', ninja:'#1a1a2e', robot:'#0d3b66', fox:'#4a2c0a', wizard:'#2d1b69', cat:'#3d2b1f', bear:'#2c1810', panda:'#1a3a1a', dragon:'#4a1a1a', alien:'#0a3a2a' }; return presets[user.avatarUrl!.replace('preset:','')] || 'var(--accent-subtle)'; })()
                  : 'var(--accent-subtle)', 
                border: '1px solid var(--border-strong)' 
              }}
            >
              {user?.avatarUrl?.startsWith('preset:') ? (
                <span className="text-lg">
                  {(() => { const emojis: Record<string, string> = { astronaut:'🧑‍🚀', ninja:'🥷', robot:'🤖', fox:'🦊', wizard:'🧙', cat:'🐱', bear:'🐻', panda:'🐼', dragon:'🐉', alien:'👽' }; return emojis[user.avatarUrl!.replace('preset:','')] || ''; })()}
                </span>
              ) : user?.avatarUrl?.startsWith('/uploads/') ? (
                <img src={`http://localhost:3001${user.avatarUrl}`} alt={user.name} className="h-full w-full object-cover" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-bold text-sm" style={{ color: 'var(--accent-text)' }}>
                  {getInitials(user?.name || '')}
                </span>
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</span>
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Ver perfil</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Floating Focus Badge */}
        {focusMode && (
          <button 
            onClick={toggleFocus}
            className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border shadow-2xl transition-all hover:scale-105 active:scale-95 animate-in slide-in-from-top-4"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--accent)',
              color: 'var(--accent-text)'
            }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="text-sm font-bold tracking-wide uppercase">Modo Foco</span>
            <span className="text-[10px] opacity-60 ml-2 border border-current px-1.5 rounded-md">Shift + F</span>
          </button>
        )}

        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, var(--radial-glow), transparent 70%)` }}
        />
        <div className={`p-8 relative z-10 flex-1 flex flex-col ${focusMode ? 'max-w-6xl mx-auto w-full transition-all duration-700' : ''}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
