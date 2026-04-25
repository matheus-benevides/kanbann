import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX } from 'lucide-react';

export default function Pomodoro() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play();
    }
    if (mode === 'work') {
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col items-center border transition-all duration-500 animate-in zoom-in-95"
      style={{ 
        backgroundColor: 'var(--surface)', 
        borderColor: mode === 'work' ? 'var(--accent)' : 'var(--success)',
        boxShadow: isActive ? `0 0 30px ${mode === 'work' ? 'var(--accent-glow)' : 'var(--success-subtle)'}` : 'none'
      }}
    >
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsActive(false); }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'work' ? 'bg-accent text-white' : 'opacity-40 hover:opacity-100'}`}
          style={{ backgroundColor: mode === 'work' ? 'var(--accent)' : 'transparent', color: mode === 'work' ? '#fff' : 'var(--text-secondary)' }}
        >
          Trabalho
        </button>
        <button 
          onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'break' ? 'bg-success text-white' : 'opacity-40 hover:opacity-100'}`}
          style={{ backgroundColor: mode === 'break' ? 'var(--success)' : 'transparent', color: mode === 'break' ? '#fff' : 'var(--text-secondary)' }}
        >
          Pausa
        </button>
      </div>

      <div className="text-5xl font-black mb-6 tracking-tighter" style={{ color: 'var(--text-primary)' }}>
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTimer}
          className="p-4 rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-lg cursor-pointer"
          style={{ backgroundColor: isActive ? 'var(--danger)' : (mode === 'work' ? 'var(--accent)' : 'var(--success)'), color: '#fff' }}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
        </button>
        
        <button 
          onClick={resetTimer}
          className="p-3 rounded-2xl transition-all hover:rotate-180 duration-500 cursor-pointer"
          style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
        >
          <RotateCcw size={20} />
        </button>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-2xl transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-muted)' }}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest opacity-40" style={{ color: 'var(--text-secondary)' }}>
        {mode === 'work' ? <Brain size={14} /> : <Coffee size={14} />}
        {mode === 'work' ? 'Foco Máximo' : 'Descanso Merecido'}
      </div>
    </div>
  );
}
