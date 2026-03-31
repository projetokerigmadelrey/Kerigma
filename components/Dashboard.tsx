'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Megaphone, 
  Users, 
  HandHeart, 
  HeartHandshake,
  TrendingUp,
  ArrowRight,
  Plus,
  X,
  Zap,
  Sparkles,
  Loader2,
  Package,
  Activity,
  Calendar,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Modal, Input, TextArea, Select } from './Forms';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  color: string;
}

interface DashboardStats {
  evangelism: number;
  discipleship: number;
  prayers: number;
  assistance: number;
  evangelismGrowth: string;
  discipleshipGrowth: string;
}

interface DashboardAlert {
  id: string;
  title: string;
  sub: string;
  tag: string;
  color: string;
  icon: any;
  time: string;
  department_id?: string | null;
  priority: number;
}

// Static fallback in case of loading issues, will be replaced by state
const defaultChartData = [
  { name: 'Jan', evangelismo: 0, discipulado: 0, oracao: 0 },
  { name: 'Fev', evangelismo: 0, discipulado: 0, oracao: 0 },
  { name: 'Mar', evangelismo: 0, discipulado: 0, oracao: 0 },
  { name: 'Abr', evangelismo: 0, discipulado: 0, oracao: 0 },
  { name: 'Mai', evangelismo: 0, discipulado: 0, oracao: 0 },
  { name: 'Jun', evangelismo: 0, discipulado: 0, oracao: 0 },
  { name: 'Jul', evangelismo: 1, discipulado: 1, oracao: 1 },
];

const defaultDistributionData = [
  { name: 'Saúde', value: 0, color: '#003f98' },
  { name: 'Família', value: 0, color: '#4646d8' },
  { name: 'Finanças', value: 0, color: '#705d00' },
  { name: 'Espiritual', value: 0, color: '#1a56be' },
];

export const DashboardView: React.FC = () => {
  const [isPrayerModalOpen, setIsPrayerModalOpen] = React.useState(false);
  const [isEvangelismModalOpen, setIsEvangelismModalOpen] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats>({
    evangelism: 0,
    discipleship: 0,
    prayers: 0,
    assistance: 0,
    evangelismGrowth: '+0%',
    discipleshipGrowth: '+0%'
  });
  const [monthlyStats, setMonthlyStats] = React.useState(defaultChartData);
  const [prayerDistribution, setPrayerDistribution] = React.useState(defaultDistributionData);
  const [alerts, setAlerts] = React.useState<DashboardAlert[]>([]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    fetchDepartments();
    fetchStats();
    fetchAlerts();

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  React.useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('id, name, color').order('name');
      if (data) setDepartments(data);
    } catch (e) {
      console.error('Error fetching depts', e);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      let evQuery = supabase.from('evangelism_records').select('*', { count: 'exact', head: true });
      let discQuery = supabase.from('disciples').select('*', { count: 'exact', head: true });
      let prayerQuery = supabase.from('prayers').select('*', { count: 'exact', head: true }).eq('is_answered', false);
      let familyQuery = supabase.from('assistance_families').select('*', { count: 'exact', head: true });

      if (selectedDept !== 'all') {
        evQuery = evQuery.eq('department_id', selectedDept);
        discQuery = discQuery.eq('department_id', selectedDept);
        prayerQuery = prayerQuery.eq('department_id', selectedDept);
        familyQuery = familyQuery.eq('department_id', selectedDept);
      }

      const [evRes, discRes, prayerRes, familyRes, monthlyRes, distributionRes] = await Promise.all([
        evQuery, 
        discQuery, 
        prayerQuery, 
        familyQuery,
        supabase.rpc('get_monthly_impact_stats', { p_department_id: selectedDept === 'all' ? null : selectedDept }),
        supabase.rpc('get_prayer_distribution_stats', { p_department_id: selectedDept === 'all' ? null : selectedDept })
      ]);
      
      if (monthlyRes.data) {
        setMonthlyStats(monthlyRes.data);
      }
      if (distributionRes.data) {
        setPrayerDistribution(distributionRes.data);
      }

      setDashboardStats({
        evangelism: evRes.count || 0,
        discipleship: discRes.count || 0,
        prayers: prayerRes.count || 0,
        assistance: familyRes.count || 0,
        evangelismGrowth: '+12%', // Static for now, would need historical data
        discipleshipGrowth: '+5%'
      });
    } catch (e) {
      console.error('Error fetching dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const [familiesRes, stockRes, prayersRes, evRes] = await Promise.all([
        supabase.from('assistance_families').select('id, head_name, status, urgency, department_id, created_at').or('status.eq.pendente,urgency.eq.critica,urgency.eq.alta'),
        supabase.from('assistance_stock').select('id, item_name, quantity, min_quantity'),
        supabase.from('prayers').select('id, author_name, is_urgent, content, department_id, created_at').eq('is_urgent', true).eq('is_answered', false),
        supabase.from('evangelism_records').select('id, contact_name, status, department_id, created_at').or('status.eq.visita,status.eq.contato')
      ]);

      let allAlerts: DashboardAlert[] = [];

      // Map Evangelism
      if (evRes.data) {
        evRes.data.forEach(e => {
          allAlerts.push({
            id: e.id,
            title: `Campo: ${e.contact_name}`,
            sub: e.status === 'visita' ? 'Pendente de visita campal' : 'Novo contato para acompanhamento',
            tag: 'CAMPO',
            color: 'bg-tertiary',
            icon: MapPin,
            time: '2h',
            department_id: e.department_id,
            priority: 4
          });
        });
      }

      // Map Families
      if (familiesRes.data) {
        familiesRes.data.forEach(f => {
          if (f.status === 'pendente') {
            allAlerts.push({
              id: f.id,
              title: `Novo Cadastro: ${f.head_name}`,
              sub: 'Aguardando aprovação ministerial',
              tag: 'PENDENTE',
              color: 'bg-amber-500',
              icon: Users,
              time: 'Agendado',
              department_id: f.department_id,
              priority: 2
            });
          } else if (f.urgency === 'critica' || f.urgency === 'alta') {
            allAlerts.push({
              id: f.id,
              title: `Urgência Social: ${f.head_name}`,
              sub: 'Ação imediata recomendada',
              tag: 'URGENTE',
              color: 'bg-red-500',
              icon: HeartHandshake,
              time: 'Agora',
              department_id: f.department_id,
              priority: 1
            });
          }
        });
      }

      // Map Stock
      if (stockRes.data) {
        stockRes.data.forEach(s => {
          if (s.quantity <= s.min_quantity) {
            allAlerts.push({
              id: s.id,
              title: `Estoque Baixo: ${s.item_name}`,
              sub: `Apenas ${s.quantity} unidades restantes`,
              tag: 'ESTOQUE',
              color: 'bg-orange-500',
              icon: Package,
              time: 'Reposição',
              department_id: null,
              priority: 3
            });
          }
        });
      }

      // Map Prayers
      if (prayersRes.data) {
        prayersRes.data.forEach(p => {
          allAlerts.push({
            id: p.id,
            title: `Oração Crítica: ${p.author_name}`,
            sub: p.content.substring(0, 40) + '...',
            tag: 'INTERCESSÃO',
            color: 'bg-primary',
            icon: HandHeart,
            time: 'Urgente',
            department_id: p.department_id,
            priority: 2
          });
        });
      }

      // Filter by department
      if (selectedDept !== 'all') {
        allAlerts = allAlerts.filter(a => a.department_id === selectedDept);
      }

      // Sort by priority and then limit
      allAlerts.sort((a, b) => a.priority - b.priority);
      setAlerts(allAlerts.slice(0, 5));
    } catch (e) {
      console.error('Error fetching alerts', e);
    }
  };

  const statsItems = [
    { label: 'Evangelismo', value: dashboardStats.evangelism.toLocaleString(), sub: dashboardStats.evangelismGrowth + ' este mês', icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10', glow: 'shadow-primary/20' },
    { label: 'Discipulado', value: dashboardStats.discipleship.toLocaleString(), sub: dashboardStats.discipleshipGrowth + ' este mês', icon: Users, color: 'text-tertiary', bg: 'bg-tertiary/10', glow: 'shadow-tertiary/20' },
    { label: 'Oração', value: dashboardStats.prayers.toLocaleString(), sub: 'Ativos no momento', icon: HandHeart, color: 'text-secondary', bg: 'bg-secondary/10', glow: 'shadow-secondary/20' },
    { label: 'Assistência', value: dashboardStats.assistance.toLocaleString(), sub: 'Famílias assistidas', icon: HeartHandshake, color: 'text-teal-600', bg: 'bg-teal-50', glow: 'shadow-teal-600/20' },
  ];

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden px-4 md:px-0">
      {/* Interactive Light Effect */}
      <motion.div 
        animate={{ 
          x: mousePos.x - 200,
          y: mousePos.y - 200
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100, mass: 0.5 }}
        className="fixed top-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-50 mix-blend-soft-light"
      />

      {/* Dynamic Background Glows */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -30, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-tertiary/10 rounded-full blur-[150px] -z-10" 
      />

      {/* Floating Decorative Icons */}
      <div className="absolute inset-0 pointer-events-none -z-5 overflow-hidden">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-[10%] opacity-10 text-primary"
        >
          <Sparkles size={120} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-40 left-[5%] opacity-5 text-secondary"
        >
          <Zap size={180} />
        </motion.div>
      </div>

      <section className="mb-6 md:mb-12 space-y-3 md:space-y-6 relative">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 md:gap-4"
        >
          <div className="p-1.5 md:p-3 bg-primary/10 rounded-lg md:rounded-2xl text-primary shadow-inner">
            <Sparkles size={16} className="md:w-7 md:h-7 animate-pulse" />
          </div>
          <div className="h-[1px] w-6 md:w-12 bg-primary/20" />
          <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary/70">Kerigma Dashboard</span>
        </motion.div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
          <div className="space-y-0.5 md:space-y-2">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="text-2xl md:text-7xl font-headline font-black tracking-tighter leading-[0.95] md:leading-[0.9]"
            >
              Visão Geral <br className="hidden md:block" />
              <span className="text-primary italic relative">
                Ministerial
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="absolute -bottom-0.5 md:-bottom-2 left-0 h-1 md:h-2 bg-primary/10 -z-10 rounded-full"
                />
              </span>
            </motion.h2>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-white/40 backdrop-blur-md p-1 md:p-1.5 rounded-lg border border-white/60 shadow-sm"
            >
              <span className="text-[9px] font-bold text-on-surface-variant uppercase ml-2">Filtrar Departamento:</span>
              <select 
                className="bg-transparent border-none text-[10px] font-black uppercase text-primary focus:ring-0 cursor-pointer"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="all">Todos os Ministérios</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 md:gap-4 bg-white/40 backdrop-blur-md p-1 md:p-2 rounded-lg md:rounded-2xl border border-white/60 shadow-sm w-fit"
            >
              <div className="flex -space-x-1.5 md:-space-x-3 px-1 md:px-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-white bg-surface-low overflow-hidden relative shadow-sm">
                    <Image fill src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-white bg-primary flex items-center justify-center text-white text-[7px] md:text-[10px] font-black shadow-sm">+12</div>
              </div>
              <div className="pr-1 md:pr-4">
                <p className="text-[7px] md:text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Equipe Ativa</p>
                <p className="text-[9px] md:text-xs font-bold">{selectedDept === 'all' ? '8 Ministérios' : departments.find(d => d.id === selectedDept)?.name}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 md:row-span-2 glass-card p-3 md:p-10 flex flex-col group"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-10">
            <div className="space-y-0.5">
              <h3 className="text-lg md:text-2xl font-headline font-black tracking-tight">Impacto Mensal</h3>
              <p className="text-[9px] md:text-xs text-on-surface-variant font-bold opacity-60">Evolução das atividades</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[160px] md:min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats}>
                <defs>
                  <linearGradient id="colorEvang" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDisc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tertiary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-tertiary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: 'rgba(0,0,0,0.3)', letterSpacing: '1px' }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }} />
                <Area type="monotone" dataKey="evangelismo" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorEvang)" animationDuration={2000} />
                <Area type="monotone" dataKey="discipulado" stroke="var(--color-tertiary)" strokeWidth={4} fillOpacity={1} fill="url(#colorDisc)" animationDuration={2500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {loading ? (
          <div className="md:col-span-2 md:row-span-2 flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : statsItems.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, type: "spring" }}
            className={cn(
              "glass-card p-3 md:p-8 flex flex-col justify-between h-28 md:h-52 group relative overflow-hidden",
              stat.glow
            )}
          >
            {/* Inner Glow */}
            <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500", stat.bg.replace('/10', ''))} />
            
            <div className="flex justify-between items-start relative z-10">
              <div className={cn(stat.bg, "p-2 md:p-4 rounded-lg md:rounded-[1.25rem]", stat.color, "group-hover:rotate-6 transition-transform duration-500 shadow-sm")}>
                <stat.icon size={16} className="md:w-6 md:h-6" />
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("text-[7px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em]", stat.color)}>{stat.label}</span>
                <div className="h-0.5 md:h-1 w-2 md:w-4 bg-current opacity-20 mt-0.5 md:mt-1 rounded-full" />
              </div>
            </div>
            
            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + (i * 0.1) }}
                className="text-2xl md:text-5xl font-headline font-black tracking-tighter"
              >
                {stat.value}
              </motion.div>
              <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-2">
                <div className={cn("p-0.5 md:p-1 rounded-md bg-white/50", stat.color)}>
                  <TrendingUp size={8} className="md:w-3 md:h-3" />
                </div>
                <span className="text-[8px] md:text-[11px] font-black text-on-surface-variant/70 uppercase tracking-wider">{stat.sub}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Featured Card - Spans 2 Columns */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="md:col-span-2 relative h-40 md:h-80 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/20"
        >
          <Image 
            alt="Community Impact" 
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEUJseYo-JOa4ewVn4LfW0-K_rjfCChbMG9cYonUcmwXvB5sb-oZ7Lx4CUlgHO2aI6ssfklZf9Y_hNPeTg8Tz95Fllcp9K66hQ_iSoxx-35nkvXjQ7nmp_NR45SvbhZABZv3vLMpjDwsfVWdDato1F6zLEnfjL-AqLsqtxjNR9M9ywh5qcG1ezOjqhXXRc-Q1J4hFsH0nO3Lgg2rwH9k6U7iR_rt1HWxOxlI2gq2B-dvy_ccqBFi6n9PRLxzj5KI9BjYKviuVMP9M"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-primary/95 via-primary/40 to-transparent flex flex-col justify-end p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4"
            >
              <div className="p-1 md:p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <Zap size={12} className="md:w-4.5 md:h-4.5 text-white fill-white" />
              </div>
              <span className="text-[8px] md:text-[11px] font-black text-white/80 tracking-[0.2em] md:tracking-[0.3em] uppercase">Destaque</span>
            </motion.div>
            <h4 className="text-lg md:text-4xl font-headline font-black text-white leading-[1.1] max-w-xl mb-4 md:mb-8">
              Como seu discipulado está transformando o Distrito Oeste.
            </h4>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-fit px-4 md:px-10 py-2 md:py-4 bg-white text-primary font-black rounded-full text-[9px] md:text-xs uppercase tracking-[0.2em] hover:bg-surface-low transition-all shadow-2xl"
            >
              Ler História
            </motion.button>
          </div>
        </motion.div>

        {/* Critical Alerts - Spans 2 Columns */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="md:col-span-2 glass-card p-3 md:p-10 space-y-3 md:space-y-8"
        >
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-base md:text-2xl font-headline font-black tracking-tight flex items-center gap-1.5 md:gap-3">
                <Activity size={16} className="md:w-6 md:h-6 text-red-500 animate-pulse" /> Alertas
              </h3>
              <p className="text-[9px] md:text-xs text-on-surface-variant font-bold opacity-60">Ações necessárias</p>
            </div>
            <button className="px-2 md:px-4 py-1 md:py-2 bg-surface-low rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-surface-low/80 transition-all">
              Ver Todos
            </button>
          </div>
          <div className="space-y-3 md:space-y-5">
            {alerts.length === 0 ? (
              <div className="text-center py-8 opacity-40 italic text-sm">
                Nenhum alerta crítico para este departamento.
              </div>
            ) : alerts.map((item, i) => (
              <motion.div 
                key={item.id} 
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 md:gap-5 bg-surface-low/40 p-3 md:p-5 rounded-xl md:rounded-3xl border border-outline-variant/10 hover:bg-surface-low transition-all group cursor-pointer"
              >
                <div className={cn("w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform shrink-0", item.color)}>
                  <item.icon size={16} className="md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-0.5">
                    <p className="font-black text-xs md:text-base truncate">{item.title}</p>
                    <div className="w-1 h-1 rounded-full bg-on-surface-variant/30 shrink-0" />
                    <span className="text-[7px] md:text-[10px] font-bold text-on-surface-variant/50 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[9px] md:text-xs text-on-surface-variant font-bold opacity-70 truncate">{item.sub}</p>
                </div>
                <div className="flex flex-col items-end gap-1 md:gap-2 shrink-0">
                  <span className={cn("text-[7px] md:text-[10px] font-black px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-md md:rounded-xl text-white shadow-sm", item.color)}>{item.tag}</span>
                  <ArrowRight size={12} className="md:w-4.5 md:h-4.5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 hidden sm:block" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Distribution Chart Card - Spans 2 Columns */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="md:col-span-2 glass-card p-3 md:p-10 flex flex-col"
        >
          <div className="flex justify-between items-start mb-4 md:mb-8">
            <div className="space-y-0.5">
              <h3 className="text-base md:text-2xl font-headline font-black tracking-tight">Orações</h3>
              <p className="text-[9px] md:text-xs text-on-surface-variant font-bold opacity-60">Categorias</p>
            </div>
            <div className="p-1.5 md:p-3 bg-secondary/10 rounded-lg md:rounded-2xl text-secondary">
              <HandHeart size={16} className="md:w-6 md:h-6" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 md:gap-8">
            <div className="w-full h-[140px] md:h-[200px] sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prayerDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {prayerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3 md:space-y-4">
              {prayerDistribution.map((item, i) => {
                const total = prayerDistribution.reduce((acc, curr) => acc + curr.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{item.name}</span>
                    </div>
                    <span className="text-xs font-black">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 md:bottom-28 right-4 md:right-8 flex flex-col gap-3 md:gap-5 z-40">
        <motion.button 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05, x: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPrayerModalOpen(true)}
          className="flex items-center gap-3 md:gap-4 bg-white/90 backdrop-blur-xl text-on-surface px-5 md:px-8 py-3.5 md:py-5 rounded-full shadow-2xl border border-white/60 font-black text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] hover:bg-white transition-all group"
        >
          <div className="p-1.5 md:p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
            <HandHeart size={16} className="md:w-5 md:h-5 text-secondary" />
          </div>
          <span className="hidden sm:inline">Nova Oração</span>
          <Plus size={16} className="sm:hidden" />
        </motion.button>
        <motion.button 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3 }}
          whileHover={{ scale: 1.05, x: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsEvangelismModalOpen(true)}
          className="flex items-center gap-3 md:gap-4 bg-primary text-on-primary px-6 md:px-10 py-4 md:py-6 rounded-full shadow-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] hover:bg-primary-container transition-all group"
        >
          <div className="p-1.5 md:p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
            <Megaphone size={16} className="md:w-5 md:h-5" />
          </div>
          <span className="hidden sm:inline">Novo Evangelismo</span>
          <Plus size={16} className="sm:hidden" />
        </motion.button>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isPrayerModalOpen} 
        onClose={() => setIsPrayerModalOpen(false)} 
        title="Novo Pedido de Oração"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsPrayerModalOpen(false); }}>
          <Input label="Seu Nome" placeholder="Ex: Ana Clara Silva" />
          <Select 
            label="Categoria" 
            options={[
              { value: 'saude', label: 'Saúde' },
              { value: 'familia', label: 'Família' },
              { value: 'financas', label: 'Finanças' },
              { value: 'espiritual', label: 'Espiritual' },
            ]} 
          />
          <TextArea label="Seu Pedido" placeholder="Escreva aqui seu motivo de oração..." />
          <div className="flex items-center gap-4 p-5 bg-surface-low rounded-[1.5rem] border border-outline-variant/10">
            <input type="checkbox" id="urgent" className="w-6 h-6 rounded-lg border-outline-variant text-primary focus:ring-primary/20 cursor-pointer" />
            <label htmlFor="urgent" className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] cursor-pointer">Pedido Urgente</label>
          </div>
          <button type="submit" className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all mt-4 active:scale-95">
            Enviar Pedido
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isEvangelismModalOpen} 
        onClose={() => setIsEvangelismModalOpen(false)} 
        title="Novo Registro de Evangelismo"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsEvangelismModalOpen(false); }}>
          <Input label="Nome do Contato" placeholder="Ex: Ricardo Oliveira" />
          <Input label="Telefone / WhatsApp" placeholder="(11) 98765-4321" />
          <Select 
            label="Status da Abordagem" 
            options={[
              { value: 'decisao', label: 'Decisão Tomada' },
              { value: 'visita', label: 'Pendente de Visita' },
              { value: 'discipulado', label: 'Aguardando Discipulado' },
              { value: 'contato', label: 'Apenas Contato' },
            ]} 
          />
          <TextArea label="Observações do Campo" placeholder="Como foi a conversa? Quais os próximos passos?" />
          <button type="submit" className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all mt-4 active:scale-95">
            Salvar Registro
          </button>
        </form>
      </Modal>
    </div>
  );
};
