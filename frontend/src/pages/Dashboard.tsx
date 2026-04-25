import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, ListTodo, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import TaskModal from '../components/TaskModal';

interface DashboardMetrics {
  total: number;
  completed: number;
  overdue: number;
  completedLast7Days: number;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    category?: { name: string; color: string };
  }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/metrics');
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    }
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div 
            className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="mt-4 font-medium" style={{ color: 'var(--accent-text)' }}>Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    'HIGH': { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'var(--danger)' },
    'MEDIUM': { bg: 'var(--warning-subtle)', text: 'var(--warning)', border: 'var(--warning)' },
    'LOW': { bg: 'var(--accent-subtle)', text: 'var(--accent-text)', border: 'var(--accent)' }
  };

  const priorityNames: Record<string, string> = {
    'HIGH': 'Alta',
    'MEDIUM': 'Média',
    'LOW': 'Baixa'
  };

  const priorityChartColors: Record<string, string> = {
    'HIGH': '#ef4444',
    'MEDIUM': '#f59e0b',
    'LOW': '#3b82f6'
  };

  return (
    <div className="relative pb-24">
      {/* Header Saudação */}
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {greeting}, <span style={{ color: 'var(--accent-text)' }}>{user?.name.split(' ')[0]}</span>!
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Aqui está o resumo da sua produtividade.</p>
      </div>

      {/* Cards Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Card 1: 7 Dias */}
        <div 
          className="backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] transition-all duration-300 group cursor-default"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success)' }}>
              <CheckCircle2 size={28} />
            </div>
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color: 'var(--success)', backgroundColor: 'var(--success-subtle)' }}>+Produtividade</span>
          </div>
          <h3 className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
            {metrics?.completedLast7Days || 0}
          </h3>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tarefas concluídas nos últimos 7 dias</p>
        </div>

        {/* Card 2: Atrasadas */}
        <div 
          className="backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] transition-all duration-300 group cursor-default"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)' }}>
              <AlertCircle size={28} />
            </div>
            {metrics?.overdue ? (
              <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-subtle)' }}>Atenção Necessária</span>
            ) : null}
          </div>
          <h3 className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
            {metrics?.overdue || 0}
          </h3>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tarefas atrasadas atualmente</p>
        </div>

        {/* Card 3: Total Ativas */}
        <div 
          className="backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] transition-all duration-300 group cursor-default"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
              <ListTodo size={28} />
            </div>
          </div>
          <h3 className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
            {(metrics?.total || 0) - (metrics?.completed || 0)}
          </h3>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Tarefas pendentes no total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Próximas Tarefas */}
        <div 
          className="lg:col-span-2 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Próximas a Vencer</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Suas tarefas pendentes mais urgentes</p>
            </div>
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
              <Calendar size={20} />
            </div>
          </div>
          
          <div>
            {(!metrics?.upcomingTasks || metrics.upcomingTasks.length === 0) ? (
              <div className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                <p>Você não tem nenhuma tarefa pendente com data de entrega.</p>
                <p className="text-sm mt-1">Aproveite para relaxar!</p>
              </div>
            ) : (
              metrics.upcomingTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-5 transition-colors flex items-center justify-between group"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: task.priority === 'HIGH' ? 'var(--danger)' : task.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--accent)',
                        boxShadow: `0 0 8px ${task.priority === 'HIGH' ? 'var(--danger)' : task.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--accent)'}60`
                      }}
                    />
                    <div>
                      <h4 className="font-medium text-lg transition-colors" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-sm">
                        <span className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                          <Calendar size={14} className="mr-1.5 opacity-70" />
                          {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </span>
                        {task.category && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: task.category.color }} className="font-medium">
                              {task.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div 
                    className="hidden sm:flex text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ 
                      backgroundColor: priorityColors[task.priority]?.bg,
                      color: priorityColors[task.priority]?.text,
                      border: `1px solid ${priorityColors[task.priority]?.border}40`
                    }}
                  >
                    Prioridade {priorityNames[task.priority]}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gráfico de Prioridades */}
        <div 
          className="backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] p-6 flex flex-col"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Distribuição por Prioridade</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Visão geral das suas tarefas ativas</p>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            {(!metrics?.priorityDistribution || metrics.priorityDistribution.length === 0) ? (
              <p style={{ color: 'var(--text-muted)' }}>Sem dados suficientes.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.priorityDistribution.map(p => ({
                      name: priorityNames[p.priority] || p.priority,
                      value: p.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {metrics.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={priorityChartColors[entry.priority] || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-elevated)', 
                      backdropFilter: 'blur(10px)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      color: 'var(--text-primary)' 
                    }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 text-white rounded-2xl flex items-center justify-center transition-all duration-300 z-40 group cursor-pointer"
        style={{ 
          backgroundColor: 'var(--accent)',
          boxShadow: `0 0 30px var(--accent-glow)`
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 0 40px var(--accent-glow)`;
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.backgroundColor = 'var(--accent)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 0 30px var(--accent-glow)`;
        }}
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modal Reutilizável de Tarefa */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categories={categories || []} 
      />
    </div>
  );
}
