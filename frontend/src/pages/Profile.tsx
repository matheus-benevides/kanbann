import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">Meu Perfil</h2>
      
      <div className="bg-[var(--color-surface)] border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        {/* Capa do Perfil (Banner) */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 w-full relative">
        </div>
        
        {/* Conteúdo do Perfil */}
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end mb-6 -mt-12 relative z-10">
            <div className="h-24 w-24 rounded-full border-4 border-[var(--color-surface)] bg-slate-800 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-4xl font-bold text-white bg-indigo-500 h-full w-full flex items-center justify-center">
                  {getInitials(user?.name || '')}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut size={18} />
              <span>Sair da Conta</span>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
              <p className="text-slate-400">@{user?.name.split(' ')[0].toLowerCase()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-6">
              <div className="flex items-center space-x-3 text-slate-300">
                <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Nome Completo</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Endereço de E-mail</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Membro desde</p>
                  <p className="font-medium">Abril 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
