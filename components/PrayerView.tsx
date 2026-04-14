'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  HandHeart, 
  CheckCircle2, 
  Users,
  MessageSquare,
  Plus,
  MoreVertical,
  PartyPopper,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Modal, Input, TextArea, Select } from './Forms';
import { ProjectManager } from './ProjectManager';
import { supabase } from '@/lib/supabase';

interface PrayerRequest {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  category: string;
  content: string;
  is_urgent: boolean;
  is_answered: boolean;
  intercessors_count: number;
  created_at: string;
  department_id?: string | null;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

export const PrayerView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    author_name: '',
    category: 'Geral',
    department_id: '',
    content: '',
    is_urgent: false
  });

  useEffect(() => {
    fetchRequests();
    fetchUser();
    fetchDepartments();

    const subscription = supabase
      .channel('prayers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayers' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching prayers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from('departments').select('id, name, color').order('name');
      if (!error && data) {
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error fetching departments', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('prayers').insert([
        {
          ...formData,
          user_id: user.id,
          author_avatar: `https://picsum.photos/seed/${formData.author_name}/100/100`
        }
      ]);

      if (error) throw error;
      setIsModalOpen(false);
      setFormData({ author_name: '', category: 'Geral', department_id: '', content: '', is_urgent: false });
    } catch (err) {
      console.error('Error submitting prayer:', err);
      alert('Erro ao cadastrar projeto de oração.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIntercede = async (id: string, currentCount: number) => {
    try {
      const { error } = await supabase
        .from('prayers')
        .update({ intercessors_count: currentCount + 1 })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating intercessors:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto de oração?')) return;
    
    try {
      const { error } = await supabase
        .from('prayers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting prayer:', err);
      alert('Erro ao excluir projeto de oração.');
    }
  };

  const stats = {
    active: requests.filter(r => !r.is_answered).length,
    urgent: requests.filter(r => r.is_urgent && !r.is_answered).length,
    answered: requests.filter(r => r.is_answered).length,
    intercessors: requests.reduce((acc, curr) => acc + curr.intercessors_count, 0)
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = () => {
      if (activeFilter === 'Ativos') return !req.is_answered;
      if (activeFilter === 'Concluídos') return req.is_answered;
      if (activeFilter === 'Meus Projetos') return req.user_id === currentUserId;
      return true;
    };

    const matchesDept = selectedDeptFilter === 'all' || req.department_id === selectedDeptFilter;

    return matchesFilter() && matchesDept;
  });

  return (
    <div className="space-y-6 md:space-y-8 max-w-lg mx-auto">
      {/* Summary Header */}
      <section className="grid grid-cols-6 gap-2 md:gap-3">
        <div className="col-span-6 signature-gradient p-3 md:p-5 rounded-xl shadow-lg flex flex-col justify-between h-24 md:h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <HandHeart size={60} className="md:w-24 md:h-24" fill="white" />
          </div>
          <div className="z-10">
            <span className="text-white/70 font-bold text-[7px] md:text-[10px] uppercase tracking-widest">Status Geral</span>
            <h2 className="text-white font-headline text-lg md:text-2xl font-extrabold mt-0.5 md:mt-1">{stats.active} Projetos Ativos</h2>
          </div>
          <div className="z-10 flex items-center gap-1 md:gap-2">
            <span className="text-white text-[9px] md:text-xs font-medium bg-white/10 px-1 md:px-2 py-0.5 md:py-1 rounded-md">{stats.urgent} Realizando</span>
            <span className="text-white text-[9px] md:text-xs font-medium bg-white/10 px-1 md:px-2 py-0.5 md:py-1 rounded-md">Novos</span>
          </div>
        </div>
        <div className="col-span-3 tonal-card p-2.5 md:p-4 flex flex-col justify-between h-20 md:h-28">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
            <CheckCircle2 size={16} className="md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-on-surface-variant font-bold text-[7px] md:text-[10px] uppercase tracking-wider">Concluídos</span>
            <p className="text-base md:text-xl font-headline font-bold">{stats.answered}</p>
          </div>
        </div>
        <div className="col-span-3 tonal-card p-2.5 md:p-4 flex flex-col justify-between h-20 md:h-28">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            <Users size={16} className="md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-on-surface-variant font-bold text-[7px] md:text-[10px] uppercase tracking-wider">Apoios</span>
            <p className="text-base md:text-xl font-headline font-bold">{stats.intercessors}</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 md:mx-0 md:px-0">
          {['Todos', 'Ativos', 'Concluídos', 'Meus Projetos'].map((filter, i) => (
            <button 
              key={i}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold shrink-0 transition-all",
                activeFilter === filter ? "bg-primary text-white shadow-md" : "bg-surface-lowest text-on-surface-variant hover:bg-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Filtrar por Departamento:</span>
          <select 
            className="flex-1 bg-surface-low text-on-surface text-xs font-bold rounded-lg border-none focus:ring-1 focus:ring-primary py-1.5 px-3"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
          >
            <option value="all">TODOS OS DEPARTAMENTOS</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prayer List */}
      <div className="space-y-3 md:space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Carregando projetos...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-surface-low rounded-2xl">
            <p className="text-on-surface-variant font-medium">Nenhum projeto de oração encontrado para este filtro.</p>
          </div>
        ) : (
          filteredRequests.map((req, i) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="tonal-card p-4 md:p-5"
            >
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative">
                    <Image fill className="object-cover" src={req.author_avatar} alt={req.author_name} referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-sm md:text-base">{req.author_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-on-surface-variant text-[9px] md:text-[11px] font-medium uppercase">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      {req.department_id && departments.find(d => d.id === req.department_id) && (
                        <span className={cn("text-[7px] md:text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase", 
                          departments.find(d => d.id === req.department_id)?.color
                        )}>
                          {departments.find(d => d.id === req.department_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {req.is_urgent && !req.is_answered && (
                  <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-600">
                    REALIZANDO
                  </span>
                )}
                {req.is_answered && (
                  <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-tertiary/10 text-tertiary">
                    CONCLUÍDO
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed mb-3 md:mb-4">{req.content}</p>
              <div className="flex items-center justify-between border-t border-surface-low pt-3 md:pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {req.is_answered ? (
                      <div className="flex items-center gap-1 text-teal-600">
                        <PartyPopper size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-xs font-semibold">{req.intercessors_count} Apoios</span>
                      </div>
                    ) : (
                      <span className="text-on-surface-variant text-[10px] md:text-xs font-semibold">{req.intercessors_count} Apoiando o projeto</span>
                    )}
                  </div>
                  {req.user_id === currentUserId && (
                    <button 
                      onClick={() => handleDelete(req.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                      title="Excluir projeto"
                    >
                      <Trash2 size={14} className="md:w-4 md:h-4" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => !req.is_answered && handleIntercede(req.id, req.intercessors_count)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-lg font-bold text-xs md:text-sm transition-all active:scale-95",
                    req.is_answered ? "bg-surface-low text-on-surface-variant" : "bg-primary/5 text-primary hover:bg-primary/10"
                  )}
                >
                  {req.is_answered ? <PartyPopper size={14} className="md:w-4 md:h-4" /> : <HandHeart size={14} className="md:w-4 md:h-4 fill-primary/10" />}
                  {req.is_answered ? 'Celebrar' : 'Apoiar'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <ProjectManager pillar="oracao" />

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-28 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40"
      >
        <Plus size={24} className="md:w-7 md:h-7" />
      </button>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Novo Projeto de Oração"
      >
        <form className="space-y-2" onSubmit={handleSubmit}>
          <Input 
            label="Nome do Projeto" 
            placeholder="Ex: Clamor da Madrugada" 
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            required
          />
          <Select 
            label="Departamento Responsável" 
            value={formData.department_id}
            onChange={(e) => {
              const dept = departments.find(d => d.id === e.target.value);
              setFormData({ 
                ...formData, 
                department_id: e.target.value,
                category: dept ? dept.name : 'Geral'
              });
            }}
            options={[
              { value: '', label: 'Selecione um departamento...' },
              ...departments.map(d => ({ value: d.id, label: d.name }))
            ]} 
            required
          />
          <TextArea 
            label="Descrição do Projeto" 
            placeholder="Descreva o propósito e como o projeto funciona..." 
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
          />
          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="urgent-prayer" 
              className="w-4 h-4 rounded border-outline-variant text-primary" 
              checked={formData.is_urgent}
              onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
            />
            <label htmlFor="urgent-prayer" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">O projeto está sendo realizado?</label>
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Cadastrando...' : 'Cadastrar Projeto'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
