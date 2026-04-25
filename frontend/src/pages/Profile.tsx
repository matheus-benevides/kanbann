import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, LogOut, Mail, Calendar, Camera, Check, Upload, ImageIcon, 
  Shield, Edit3, Save, TrendingUp, CheckCircle2, Clock, BarChart3, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PRESET_AVATARS = [
  { id: 'astronaut', emoji: '🧑‍🚀', bg: '#1e3a5f' },
  { id: 'ninja', emoji: '🥷', bg: '#1a1a2e' },
  { id: 'robot', emoji: '🤖', bg: '#0d3b66' },
  { id: 'fox', emoji: '🦊', bg: '#4a2c0a' },
  { id: 'wizard', emoji: '🧙', bg: '#2d1b69' },
  { id: 'cat', emoji: '🐱', bg: '#3d2b1f' },
  { id: 'bear', emoji: '🐻', bg: '#2c1810' },
  { id: 'panda', emoji: '🐼', bg: '#1a3a1a' },
  { id: 'dragon', emoji: '🐉', bg: '#4a1a1a' },
  { id: 'alien', emoji: '👽', bg: '#0a3a2a' },
];

const PRESET_BANNERS = [
  { id: 'accent', name: 'Accent', style: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' },
  { id: 'sunset', name: 'Sunset', style: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { id: 'ocean', name: 'Oceano', style: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { id: 'forest', name: 'Floresta', style: 'linear-gradient(135deg, #10b981, #059669)' },
  { id: 'aurora', name: 'Aurora', style: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { id: 'midnight', name: 'Meia-Noite', style: 'linear-gradient(135deg, #1e293b, #0f172a)' },
  { id: 'fire', name: 'Fogo', style: 'linear-gradient(135deg, #dc2626, #f97316)' },
  { id: 'neon', name: 'Neon', style: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)' },
];

const API_BASE = 'http://localhost:3001';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [newName, setNewName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const { data } = await api.get('/profile/stats');
      return data;
    }
  });

  const handleLogout = () => { logout(); navigate('/login'); };
  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  const selectPresetAvatar = async (preset: typeof PRESET_AVATARS[0]) => {
    setSaving(true);
    try {
      const avatarUrl = `preset:${preset.id}`;
      const { data } = await api.put('/profile', { avatarUrl });
      updateUser({ avatarUrl: data.avatarUrl });
      setShowAvatarPicker(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatarUrl: data.avatarUrl });
      setShowAvatarPicker(false);
    } catch { /* ignore */ }
    setUploadingAvatar(false);
  };

  const selectPresetBanner = async (preset: typeof PRESET_BANNERS[0]) => {
    setSaving(true);
    try {
      const bannerUrl = `gradient:${preset.id}`;
      const { data } = await api.put('/profile', { bannerUrl });
      updateUser({ bannerUrl: data.bannerUrl });
      setShowBannerPicker(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const uploadBanner = async (file: File) => {
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const { data } = await api.post('/profile/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ bannerUrl: data.bannerUrl });
      setShowBannerPicker(false);
    } catch { /* ignore */ }
    setUploadingBanner(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const updateData: any = { name: newName };
      if (newPassword) updateData.password = newPassword;

      const { data } = await api.put('/profile', updateData);
      updateUser(data);
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Erro ao atualizar.', type: 'error' });
    }
    setSaving(false);
  };

  const getAvatarContent = () => {
    const url = user?.avatarUrl;
    if (!url) return null;
    if (url.startsWith('preset:')) {
      const presetId = url.replace('preset:', '');
      const preset = PRESET_AVATARS.find(p => p.id === presetId);
      if (preset) return (
        <div className="h-full w-full flex items-center justify-center text-5xl" style={{ backgroundColor: preset.bg }}>
          {preset.emoji}
        </div>
      );
    }
    if (url.startsWith('/uploads/')) {
      return <img src={`${API_BASE}${url}`} alt="Avatar" className="h-full w-full object-cover" />;
    }
    return <img src={url} alt="Avatar" className="h-full w-full object-cover" />;
  };

  const getBannerStyle = (): React.CSSProperties => {
    const url = user?.bannerUrl;
    if (!url) return { background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' };
    if (url.startsWith('gradient:')) {
      const id = url.replace('gradient:', '');
      const preset = PRESET_BANNERS.find(p => p.id === id);
      if (preset) return { background: preset.style };
    }
    if (url.startsWith('/uploads/')) {
      return { backgroundImage: `url(${API_BASE}${url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' };
  };

  const avatarRendered = getAvatarContent();

  return (
    <div className="max-w-5xl mx-auto mt-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Meu Perfil</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas informações e veja seu desempenho.</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)44' }}
        >
          <LogOut size={18} /><span>Sair</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Perfil e Edição */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl overflow-hidden shadow-2xl border backdrop-blur-md" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Banner */}
            <div className="h-48 w-full relative group cursor-pointer" style={getBannerStyle()} onClick={() => setShowBannerPicker(!showBannerPicker)}>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white font-bold bg-black/50 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/20">
                  <Camera size={20} /> Alterar Capa
                </div>
              </div>
            </div>

            {/* Banner Picker Overlay */}
            {showBannerPicker && (
              <div className="p-6 animate-in slide-in-from-top-4" style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <ImageIcon size={16} /> Estilos de Fundo
                </p>
                <div className="flex flex-wrap gap-3">
                  {PRESET_BANNERS.map(b => (
                    <button key={b.id} onClick={() => selectPresetBanner(b)} disabled={saving}
                      className="w-20 h-12 rounded-xl transition-all cursor-pointer hover:scale-110 disabled:opacity-50 ring-offset-2 ring-offset-black"
                      style={{ background: b.style, border: user?.bannerUrl === `gradient:${b.id}` ? '2px solid var(--accent)' : '2px solid transparent' }}
                    />
                  ))}
                  <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                    className="w-20 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 border-2 border-dashed"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                  >
                    {uploadingBanner ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /> : <Upload size={20} />}
                  </button>
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]); e.target.value = ''; }}
                />
              </div>
            )}
            
            {/* Content Profile Section */}
            <div className="px-8 pb-8 relative">
              <div className="flex justify-between items-end mb-8 -mt-16 relative z-10">
                {/* Avatar with Camera Icon */}
                <div className="relative group">
                  <div className="h-32 w-32 rounded-3xl flex items-center justify-center overflow-hidden cursor-pointer shadow-2xl transition-transform hover:scale-105 active:scale-95"
                    style={{ border: '6px solid var(--surface)', backgroundColor: 'var(--surface-elevated)' }}
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  >
                    {avatarRendered || (
                      <div className="text-6xl font-black text-white h-full w-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                        {getInitials(user?.name || '')}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Camera size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <button onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all font-bold cursor-pointer text-white shadow-lg hover:scale-105"
                    style={{ backgroundColor: 'var(--accent)', boxShadow: `0 0 20px var(--accent-glow)` }}
                  >
                    <Edit3 size={18} /><span>Editar Perfil</span>
                  </button>
                )}
              </div>

              {/* Avatar Picker Overlay */}
              {showAvatarPicker && (
                <div className="mb-8 p-6 rounded-3xl animate-in zoom-in-95 duration-300" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Escolha seu Avatar:</p>
                  <div className="flex flex-wrap gap-4 items-center">
                    {PRESET_AVATARS.map(a => (
                      <button key={a.id} onClick={() => selectPresetAvatar(a)} disabled={saving}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all cursor-pointer hover:scale-110 active:scale-90 disabled:opacity-50"
                        style={{ backgroundColor: a.bg, border: user?.avatarUrl === `preset:${a.id}` ? '3px solid var(--accent)' : '3px solid transparent' }}
                      >
                        {a.emoji}
                      </button>
                    ))}
                    <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 border-3 border-dashed"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                    >
                      {uploadingAvatar ? <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /> : <ImageIcon size={24} />}
                    </button>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); e.target.value = ''; }}
                  />
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1" style={{ color: 'var(--text-secondary)' }}>Nome de Usuário</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                        <input 
                          type="text" 
                          value={newName} 
                          onChange={e => setNewName(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent/40 transition-all border"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1" style={{ color: 'var(--text-secondary)' }}>E-mail (Não alterável)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                        <input 
                          type="email" 
                          value={user?.email} 
                          disabled
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border opacity-50 cursor-not-allowed"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1" style={{ color: 'var(--text-secondary)' }}>Nova Senha</label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                        <input 
                          type="password" 
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent/40 transition-all border"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1" style={{ color: 'var(--text-secondary)' }}>Confirmar Senha</label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                        <input 
                          type="password" 
                          placeholder="Confirme a nova senha"
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent/40 transition-all border"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {message.text && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in shake-100`}
                      style={{ 
                        backgroundColor: message.type === 'success' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                        color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}44`
                      }}>
                      {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      <span className="font-medium text-sm">{message.text}</span>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg text-white hover:scale-102 active:scale-98 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)', boxShadow: `0 0 20px var(--accent-glow)` }}
                    >
                      {saving ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)}
                      className="px-8 py-4 rounded-2xl font-bold transition-all border hover:bg-white/5"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex flex-col">
                    <h3 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{user?.name}</h3>
                    <p className="text-lg opacity-60" style={{ color: 'var(--text-secondary)' }}>@{user?.name?.split(' ')[0].toLowerCase()}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <div className="flex items-center space-x-4 group">
                      <div className="p-3.5 rounded-2xl transition-colors group-hover:scale-110" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--text-secondary)' }}>E-mail</p>
                        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 group">
                      <div className="p-3.5 rounded-2xl transition-colors group-hover:scale-110" style={{ backgroundColor: 'var(--warning-subtle)', color: 'var(--warning)' }}>
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--text-secondary)' }}>Membro desde</p>
                        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Abril 2026'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Estatísticas */}
        <div className="space-y-6">
          <div className="rounded-3xl p-6 shadow-2xl border backdrop-blur-md sticky top-8" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h3>
            </div>

            {statsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stat Cards */}
                <div className="p-5 rounded-2xl border transition-all hover:translate-x-2" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase opacity-50">Total de Tarefas</span>
                    <BarChart3 size={16} className="text-accent" />
                  </div>
                  <p className="text-3xl font-black">{stats?.total || 0}</p>
                </div>

                <div className="p-5 rounded-2xl border transition-all hover:translate-x-2" style={{ backgroundColor: 'var(--success-subtle)', borderColor: 'var(--success)22' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase" style={{ color: 'var(--success)' }}>Concluídas</span>
                    <CheckCircle2 size={16} className="text-success" />
                  </div>
                  <p className="text-3xl font-black" style={{ color: 'var(--success)' }}>{stats?.done || 0}</p>
                </div>

                <div className="p-5 rounded-2xl border transition-all hover:translate-x-2" style={{ backgroundColor: 'var(--warning-subtle)', borderColor: 'var(--warning)22' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase" style={{ color: 'var(--warning)' }}>Em Aberto</span>
                    <Clock size={16} className="text-warning" />
                  </div>
                  <p className="text-3xl font-black" style={{ color: 'var(--warning)' }}>{stats?.pending || 0}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold">Taxa de Conclusão</span>
                    <span className="text-2xl font-black" style={{ color: 'var(--accent-text)' }}>{stats?.completionRate || 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-accent transition-all duration-1000 ease-out"
                      style={{ width: `${stats?.completionRate || 0}%`, backgroundColor: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }}
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl text-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                    🔥 {stats?.completedToday || 0} tarefas finalizadas hoje!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
