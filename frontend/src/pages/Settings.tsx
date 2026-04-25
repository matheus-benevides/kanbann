import { useState, useEffect } from 'react';
import { Palette, Maximize, LayoutTemplate, Save, Check, Moon, Sun, Trees, Sunset, Waves } from 'lucide-react';

const THEMES = [
  { 
    id: 'obsidian', 
    name: 'Obsidian', 
    class: '', 
    icon: Moon,
    description: 'Escuro elegante com tons azulados',
    preview: { bg: '#0a0b10', surface: '#12131a', accent: '#3b82f6' }
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    class: 'theme-forest', 
    icon: Trees,
    description: 'Escuro profundo com tons esmeralda',
    preview: { bg: '#070d0a', surface: '#0d1a13', accent: '#10b981' }
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    class: 'theme-sunset', 
    icon: Sunset,
    description: 'Escuro quente com tons âmbar',
    preview: { bg: '#0d0907', surface: '#1a1310', accent: '#f59e0b' }
  },
  { 
    id: 'ocean', 
    name: 'Ocean', 
    class: 'theme-ocean', 
    icon: Waves,
    description: 'Escuro profundo com tons ciano',
    preview: { bg: '#060d10', surface: '#0c1921', accent: '#06b6d4' }
  },
  { 
    id: 'daylight', 
    name: 'Daylight', 
    class: 'theme-daylight', 
    icon: Sun,
    description: 'Tema claro limpo e profissional',
    preview: { bg: '#f8fafc', surface: '#ffffff', accent: '#2563eb' }
  },
];

export default function Settings() {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].class);
  const [focusMode, setFocusMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    const savedFocus = localStorage.getItem('focus-mode');
    if (savedTheme !== null) setSelectedTheme(savedTheme);
    if (savedFocus === 'true') setFocusMode(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem('app-theme', selectedTheme);
    localStorage.setItem('focus-mode', focusMode.toString());
    
    window.dispatchEvent(new Event('themeChange'));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Personalize a aparência e comportamento do seu ambiente.</p>
      </div>

      <div className="space-y-8">
        
        {/* Aparência do Sistema */}
        <div 
          className="backdrop-blur-xl rounded-3xl p-6 shadow-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
              <Palette size={24} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Aparência do Sistema</h2>
          </div>
          
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Escolha o tema global que será aplicado em todo o aplicativo.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map(theme => {
              const isSelected = selectedTheme === theme.class;
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.class)}
                  className="group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer text-left"
                  style={{
                    border: isSelected 
                      ? `2px solid ${theme.preview.accent}` 
                      : '2px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--surface-hover)' : 'transparent',
                    boxShadow: isSelected ? `0 0 20px ${theme.preview.accent}33` : 'none'
                  }}
                >
                  {/* Theme Preview */}
                  <div 
                    className="h-16 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative"
                    style={{ backgroundColor: theme.preview.bg }}
                  >
                    {/* Mini sidebar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center pt-2 gap-1.5"
                      style={{ backgroundColor: theme.preview.surface, borderRight: `1px solid ${theme.preview.accent}22` }}
                    >
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.preview.accent, opacity: 0.6 }} />
                      <div className="w-3 h-1 rounded-full" style={{ backgroundColor: theme.preview.accent, opacity: 0.3 }} />
                      <div className="w-3 h-1 rounded-full" style={{ backgroundColor: theme.preview.accent, opacity: 0.2 }} />
                    </div>
                    {/* Mini cards */}
                    <div className="flex gap-1.5 ml-6">
                      <div className="w-10 h-8 rounded" style={{ backgroundColor: theme.preview.surface, border: `1px solid ${theme.preview.accent}22` }} />
                      <div className="w-10 h-8 rounded" style={{ backgroundColor: theme.preview.surface, border: `1px solid ${theme.preview.accent}22` }} />
                    </div>
                    {/* Accent dot */}
                    <div 
                      className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.preview.accent, boxShadow: `0 0 6px ${theme.preview.accent}` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} style={{ color: theme.preview.accent }} />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{theme.name}</span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{theme.description}</p>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div 
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.preview.accent }}
                    >
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Produtividade */}
        <div 
          className="backdrop-blur-xl rounded-3xl p-6 shadow-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success)' }}>
              <Maximize size={24} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Produtividade</h2>
          </div>

          <div 
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)' }}
          >
            <div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Modo Foco</h3>
              <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
                Esconde a barra lateral (sidebar) para maximizar o espaço de trabalho. Ideal para concentração profunda.
              </p>
            </div>
            
            <button 
              onClick={() => setFocusMode(!focusMode)}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors flex-shrink-0 ml-4 cursor-pointer"
              style={{ backgroundColor: focusMode ? 'var(--success)' : 'var(--surface-elevated)' }}
            >
              <span 
                className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: focusMode ? 'translateX(32px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
        </div>

        {/* Informações */}
        <div 
          className="backdrop-blur-xl rounded-3xl p-6 shadow-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
              <LayoutTemplate size={24} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Sobre o App</h2>
          </div>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p><strong>Versão:</strong> 1.0.0 Pro</p>
            <p><strong>Motor:</strong> React 19 + Vite</p>
            <p><strong>Banco de Dados:</strong> Prisma ORM v7 (Better-SQLite3)</p>
          </div>
        </div>

      </div>

      <div className="fixed bottom-8 right-8 z-50">
        {saved && (
          <div 
            className="absolute bottom-full mb-4 right-0 px-4 py-2 rounded-xl font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4 text-white"
            style={{ backgroundColor: 'var(--success)' }}
          >
            <Check size={18} /> Salvo com sucesso!
          </div>
        )}
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl transition-all font-bold text-lg text-white cursor-pointer"
          style={{ 
            backgroundColor: 'var(--accent)',
            boxShadow: `0 0 30px var(--accent-glow)`,
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 0 40px var(--accent-glow)`;
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.backgroundColor = 'var(--accent)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 0 30px var(--accent-glow)`;
          }}
        >
          <Save size={24} />
          Salvar Configurações
        </button>
      </div>

    </div>
  );
}
