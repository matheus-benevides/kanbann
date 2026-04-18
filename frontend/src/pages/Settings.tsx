import { useState, useEffect } from 'react';
import { Palette, Maximize, LayoutTemplate, Save, Check } from 'lucide-react';

const BACKGROUNDS = [
  { id: 'default', name: 'Escuro Clássico', class: 'bg-[#0a0a0b]' },
  { id: 'gradient-1', name: 'Aurora', class: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-[#0a0a0b]' },
  { id: 'gradient-2', name: 'Floresta Viva', class: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-[#0a0a0b]' },
  { id: 'gradient-3', name: 'Crepúsculo Profundo', class: 'bg-gradient-to-br from-slate-900 via-rose-900 to-[#0a0a0b]' },
  { id: 'light-1', name: 'Tema Claro (Soft)', class: 'bg-slate-200' },
];

export default function Settings() {
  const [bgClass, setBgClass] = useState(BACKGROUNDS[0].class);
  const [focusMode, setFocusMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedBg = localStorage.getItem('app-bg');
    const savedFocus = localStorage.getItem('focus-mode');
    if (savedBg) setBgClass(savedBg);
    if (savedFocus === 'true') setFocusMode(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem('app-bg', bgClass);
    localStorage.setItem('focus-mode', focusMode.toString());
    
    // Disparar evento para atualizar o Layout
    window.dispatchEvent(new Event('themeChange'));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-slate-400">Personalize a aparência e comportamento do seu ambiente.</p>
      </div>

      <div className="space-y-8">
        
        {/* Aparência do Sistema */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Palette size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Aparência do Sistema</h2>
          </div>
          
          <p className="text-slate-400 mb-4 text-sm">Escolha o tema global que será aplicado em todo o aplicativo.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BACKGROUNDS.map(bg => (
              <button
                key={bg.id}
                onClick={() => setBgClass(bg.class)}
                className={`h-24 rounded-2xl flex items-center justify-center border-2 transition-all group ${bgClass === bg.class ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-transparent hover:border-white/20'} ${bg.class}`}
                style={bg.id === 'light-1' ? { color: '#333' } : { color: 'white' }}
              >
                <span className={`font-medium px-4 py-1.5 rounded-full backdrop-blur-sm ${bg.id === 'light-1' ? 'bg-white/50 text-slate-800' : 'bg-black/30'}`}>
                  {bg.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Produtividade */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Maximize size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Produtividade</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
            <div>
              <h3 className="text-white font-medium mb-1">Modo Foco</h3>
              <p className="text-slate-400 text-sm max-w-md">Esconde a barra lateral (sidebar) para maximizar o espaço de trabalho. Ideal para concentração profunda.</p>
            </div>
            
            <button 
              onClick={() => setFocusMode(!focusMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${focusMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${focusMode ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <LayoutTemplate size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Sobre o App</h2>
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            <p><strong>Versão:</strong> 1.0.0 Pro</p>
            <p><strong>Motor:</strong> React 19 + Vite</p>
            <p><strong>Banco de Dados:</strong> Prisma ORM v7 (Better-SQLite3)</p>
          </div>
        </div>

      </div>

      <div className="fixed bottom-8 right-8 z-50">
        {saved && (
          <div className="absolute bottom-full mb-4 right-0 bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
            <Check size={18} /> Salvo com sucesso!
          </div>
        )}
        <button 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-6 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] font-bold text-lg hover:-translate-y-1"
        >
          <Save size={24} />
          Salvar Configurações
        </button>
      </div>

    </div>
  );
}
