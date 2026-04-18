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
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-400 mt-4 font-medium">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    'HIGH': 'bg-red-500/20 text-red-400 border-red-500/50',
    'MEDIUM': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    'LOW': 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  };

  const priorityNames: Record<string, string> = {
    'HIGH': 'Alta',
    'MEDIUM': 'Média',
    'LOW': 'Baixa'
  };

  return (
    <div className="relative pb-24">
      {/* Header Saudação */}
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl font-bold text-white mb-2">
          {greeting}, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name.split(' ')[0]}</span>!
        </h1>
        <p className="text-slate-400 text-lg">Aqui está o resumo da sua produtividade.</p>
      </div>

      {/* Cards Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Card 1: 7 Dias */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <CheckCircle2 size={28} />
            </div>
            <span className="text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full">+Produtividade</span>
          </div>
          <h3 className="text-4xl font-black text-white mb-1">
            {metrics?.completedLast7Days || 0}
          </h3>
          <p className="text-slate-400 font-medium">Tarefas concluídas nos últimos 7 dias</p>
        </div>

        {/* Card 2: Atrasadas */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl group-hover:scale-110 transition-transform">
              <AlertCircle size={28} />
            </div>
            {metrics?.overdue ? (
              <span className="text-red-400 text-sm font-medium bg-red-500/10 px-3 py-1 rounded-full">Atenção Necessária</span>
            ) : null}
          </div>
          <h3 className="text-4xl font-black text-white mb-1">
            {metrics?.overdue || 0}
          </h3>
          <p className="text-slate-400 font-medium">Tarefas atrasadas atualmente</p>
        </div>

        {/* Card 3: Total Ativas */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
              <ListTodo size={28} />
            </div>
          </div>
          <h3 className="text-4xl font-black text-white mb-1">
            {(metrics?.total || 0) - (metrics?.completed || 0)}
          </h3>
          <p className="text-slate-400 font-medium">Tarefas pendentes no total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Próximas Tarefas */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Próximas a Vencer</h2>
              <p className="text-slate-400 text-sm mt-1">Suas tarefas pendentes mais urgentes</p>
            </div>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Calendar size={20} />
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {(!metrics?.upcomingTasks || metrics.upcomingTasks.length === 0) ? (
              <div className="p-10 text-center text-slate-500">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                <p>Você não tem nenhuma tarefa pendente com data de entrega.</p>
                <p className="text-sm mt-1">Aproveite para relaxar!</p>
              </div>
            ) : (
              metrics.upcomingTasks.map((task) => (
                <div key={task.id} className="p-5 hover:bg-white/5 transition-colors flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : task.priority === 'MEDIUM' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`}></div>
                    <div>
                      <h4 className="text-white font-medium text-lg group-hover:text-indigo-300 transition-colors">{task.title}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-sm">
                        <span className="text-slate-400 flex items-center">
                          <Calendar size={14} className="mr-1.5 opacity-70" />
                          {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </span>
                        {task.category && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span style={{ color: task.category.color }} className="font-medium">
                              {task.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`hidden sm:flex text-xs px-3 py-1.5 rounded-lg border ${priorityColors[task.priority]} font-medium`}>
                    Prioridade {priorityNames[task.priority]}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gráfico de Prioridades */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Distribuição por Prioridade</h2>
            <p className="text-slate-400 text-sm mt-1">Visão geral das suas tarefas ativas</p>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            {(!metrics?.priorityDistribution || metrics.priorityDistribution.length === 0) ? (
              <p className="text-slate-500">Sem dados suficientes.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.priorityDistribution.map(p => ({
                      name: priorityNames[p.priority] || p.priority,
                      value: p.count,
                      color: p.priority === 'HIGH' ? '#ef4444' : p.priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6'
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
                      <Cell key={`cell-${index}`} fill={entry.priority === 'HIGH' ? '#ef4444' : entry.priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
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
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] hover:-translate-y-1 flex items-center justify-center transition-all duration-300 z-40 group"
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
