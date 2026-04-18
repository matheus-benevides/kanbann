import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, CheckSquare, Tags, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [bgClass, setBgClass] = useState('bg-[#0a0a0b]');
  const [focusMode, setFocusMode] = useState(false);

  const loadSettings = () => {
    const savedBg = localStorage.getItem('app-bg');
    const savedFocus = localStorage.getItem('focus-mode');
    if (savedBg) setBgClass(savedBg);
    setFocusMode(savedFocus === 'true');
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('themeChange', loadSettings);
    return () => window.removeEventListener('themeChange', loadSettings);
  }, []);

  const navItems = [
    { name: 'Início', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Minhas Tarefas', path: '/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Categorias', path: '/categories', icon: <Tags size={20} /> },
    { name: 'Configurações', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const isLight = bgClass.includes('light');

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-700 ${bgClass} ${isLight ? 'text-slate-900' : 'text-white'}`}>
      {/* Sidebar Redesenhada */}
      <aside 
        className={`flex flex-col bg-slate-900/50 backdrop-blur-md border-r border-slate-800 transition-all duration-500 overflow-hidden ${focusMode ? 'w-0 border-r-0 opacity-0' : 'w-64 opacity-100'}`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
            Kanban<span className={isLight ? "text-slate-800" : "text-white"}>Pro</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 min-w-[256px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Perfil do Usuário na parte inferior */}
        <div className="p-4 border-t border-slate-800/80 min-w-[256px]">
          <Link 
            to="/profile" 
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-indigo-400 font-bold text-sm">
                  {getInitials(user?.name || '')}
                </span>
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-slate-200 truncate">{user?.name}</span>
              <span className="text-xs text-slate-500 truncate">Ver perfil</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {!isLight && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none"></div>
        )}
        <div className="p-8 relative z-10 flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
