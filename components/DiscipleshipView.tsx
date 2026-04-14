'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Users, 
  BarChart3, 
  Droplets, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  MoreVertical,
  UserPlus,
  Loader2,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Modal, Input, Select } from './Forms';
import { ProjectManager } from './ProjectManager';

interface Disciple {
  id: string;
  mentor_id: string;
  name: string;
  status_tag: string;
  phase: string;
  phone?: string;
  birth_date?: string;
  baptism_date?: string;
  address?: string;
  notes?: string;
  last_meeting_at: string;
  created_at: string;
  department_id?: string | null;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

interface Meeting {
  id: string;
  disciple_id: string;
  mentor_id: string;
  meeting_date: string;
  summary: string;
  next_steps: string;
  created_at: string;
}

export const DiscipleshipView: React.FC = () => {
  const [disciples, setDisciples] = useState<Disciple[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedDisciple, setSelectedDisciple] = useState<Disciple | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mentor_id: '',
    department_id: '',
    status: 'ativo',
    growth_phase: 'consolidacao',
    phone: '',
    birth_date: '',
    baptism_date: '',
    address: '',
    notes: ''
  });

  const [profiles, setProfiles] = useState<{ id: string, name: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const [meetingFormData, setMeetingFormData] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    summary: '',
    next_steps: ''
  });

  useEffect(() => {
    fetchDisciples();
    fetchProfiles();
    fetchDepartments();

    const subscription = supabase
      .channel('disciples_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disciples' }, () => {
        fetchDisciples();
      })
      .subscribe();

    const meetingsSubscription = supabase
      .channel('meetings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discipleship_meetings' }, () => {
        if (selectedDisciple) fetchMeetings(selectedDisciple.id);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      meetingsSubscription.unsubscribe();
    };
  }, [selectedDisciple]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email');
      if (!error && data) {
        setProfiles(data.map(p => ({ id: p.id, name: p.full_name || p.email })));
      }
    } catch (err) {
      console.error('Error fetching profiles', err);
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

  const fetchDisciples = async () => {
    try {
      const { data, error } = await supabase
        .from('disciples')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setDisciples(data || []);
    } catch (err) {
      console.error('Error fetching disciples:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDisciples = disciples.filter(d => {
    if (selectedDeptFilter === 'all') return true;
    return d.department_id === selectedDeptFilter;
  });

  const fetchMeetings = async (discipleId: string) => {
    try {
      const { data, error } = await supabase
        .from('discipleship_meetings')
        .select('*')
        .eq('disciple_id', discipleId)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload = {
        name: formData.name,
        mentor_id: formData.mentor_id || user.id,
        status_tag: formData.status,
        phase: formData.growth_phase,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        baptism_date: formData.baptism_date || null,
        address: formData.address || null,
        notes: formData.notes || null,
        department_id: formData.department_id || null,
      };

      const { error } = await supabase.from('disciples').insert([payload]);

      if (error) throw error;
      setIsModalOpen(false);
      setFormData({ 
        name: '', 
        mentor_id: user.id || '',
        department_id: '',
        status: 'ativo', 
        growth_phase: 'consolidacao',
        phone: '',
        birth_date: '',
        baptism_date: '',
        address: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error adding disciple:', err);
      alert('Erro ao adicionar discípulo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDisciple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciple) return;
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        mentor_id: formData.mentor_id || selectedDisciple.mentor_id,
        status_tag: formData.status,
        phase: formData.growth_phase,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        baptism_date: formData.baptism_date || null,
        address: formData.address || null,
        notes: formData.notes || null,
        department_id: formData.department_id || null,
      };

      const { error } = await supabase
        .from('disciples')
        .update(payload)
        .eq('id', selectedDisciple.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchDisciples();
      if (selectedDisciple) {
        const { data } = await supabase.from('disciples').select('*').eq('id', selectedDisciple.id).single();
        if (data) setSelectedDisciple(data);
      }
    } catch (err) {
      console.error('Error updating disciple:', err);
      alert('Erro ao atualizar discípulo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDisciple = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este discípulo? Todos os encontros também serão excluídos.')) return;

    try {
      const { error } = await supabase.from('disciples').delete().eq('id', id);
      if (error) throw error;
      setIsDetailsModalOpen(false);
      fetchDisciples();
    } catch (err) {
      console.error('Error deleting disciple:', err);
      alert('Erro ao excluir discípulo.');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Excluir este registro de encontro?')) return;

    try {
      const { error } = await supabase.from('discipleship_meetings').delete().eq('id', id);
      if (error) throw error;
      if (selectedDisciple) fetchMeetings(selectedDisciple.id);
    } catch (err) {
      console.error('Error deleting meeting:', err);
      alert('Erro ao excluir encontro.');
    }
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciple) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('discipleship_meetings').insert([
        {
          ...meetingFormData,
          disciple_id: selectedDisciple.id,
          mentor_id: user.id
        }
      ]);

      if (error) throw error;

      // Update last_meeting_at in disciples table
      await supabase
        .from('disciples')
        .update({ last_meeting_at: meetingFormData.meeting_date })
        .eq('id', selectedDisciple.id);

      setIsMeetingModalOpen(false);
      setMeetingFormData({
        meeting_date: new Date().toISOString().split('T')[0],
        summary: '',
        next_steps: ''
      });
      fetchMeetings(selectedDisciple.id);
      fetchDisciples();
    } catch (err) {
      console.error('Error adding meeting:', err);
      alert('Erro ao adicionar encontro.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (disciple: Disciple) => {
    setSelectedDisciple(disciple);
    fetchMeetings(disciple.id);
    setIsDetailsModalOpen(true);
  };

  const openEdit = (disciple: Disciple) => {
    setSelectedDisciple(disciple);
    setFormData({
      name: disciple.name,
      mentor_id: disciple.mentor_id || '',
      status: disciple.status_tag,
      growth_phase: disciple.phase,
      phone: disciple.phone || '',
      birth_date: disciple.birth_date || '',
      baptism_date: disciple.baptism_date || '',
      address: disciple.address || '',
      notes: disciple.notes || '',
      department_id: disciple.department_id || ''
    });
    setIsEditModalOpen(true);
  };

  const getPhaseLabel = (phase: string | null | undefined) => {
    if (!phase) return 'NÃO DEFINIDO';
    switch (phase) {
      case 'pre-encontro': return 'PRÉ-ENCONTRO';
      case 'consolidacao': return 'CONSOLIDAÇÃO';
      case 'lideranca': return 'LIDERANÇA';
      default: return phase.toUpperCase();
    }
  };

  const getPhaseColor = (phase: string | null | undefined) => {
    if (!phase) return 'bg-surface-low text-on-surface-variant border-outline';
    switch (phase) {
      case 'pre-encontro': return 'bg-secondary/10 text-secondary border-secondary';
      case 'consolidacao': return 'bg-tertiary/10 text-tertiary border-tertiary';
      case 'lideranca': return 'bg-primary/10 text-primary border-primary';
      default: return 'bg-surface-low text-on-surface-variant border-outline';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <section className="px-1">
        <h2 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight">Crescimento Espiritual</h2>
        <p className="text-on-surface-variant text-sm md:font-medium mt-0.5 md:mt-1">Acompanhe a evolução e o cuidado de cada discípulo.</p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-primary text-white p-3 md:p-6 rounded-xl flex flex-col justify-between h-28 md:h-40 group hover:scale-[1.02] transition-transform duration-200 shadow-lg">
          <Users size={20} className="md:w-8 md:h-8 opacity-80" />
          <div>
            <p className="text-[7px] md:text-[10px] uppercase tracking-widest opacity-80 font-bold">Discípulos Ativos</p>
            <p className="text-xl md:text-4xl font-headline font-extrabold">{disciples.length}</p>
          </div>
        </div>
        <div className="tonal-card p-3 md:p-6 flex flex-col justify-between h-28 md:h-40">
          <BarChart3 size={20} className="md:w-8 md:h-8 text-secondary" />
          <div>
            <p className="text-[7px] md:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Média Frequência</p>
            <p className="text-xl md:text-4xl font-headline font-extrabold">94%</p>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-tertiary-container/30 text-tertiary p-3 md:p-6 rounded-xl flex flex-row md:flex-col items-center md:items-start justify-between h-16 md:h-40 border border-tertiary/10">
          <Droplets size={20} className="md:w-8 md:h-8 fill-tertiary/20" />
          <div className="text-right md:text-left">
            <p className="text-[7px] md:text-[10px] uppercase tracking-widest opacity-80 font-bold">Próximos Batismos</p>
            <p className="text-xl md:text-4xl font-headline font-extrabold">03</p>
          </div>
        </div>
      </section>

      {/* Dynamic Pending Reports */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg md:text-xl font-headline font-bold">Acompanhamento Semanal</h3>
          {disciples.filter(d => {
            if (!d.last_meeting_at) return true;
            const lastDate = new Date(d.last_meeting_at);
            const diff = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
            return diff > 7;
          }).length > 0 && (
            <span className="bg-red-100 text-red-600 px-2 md:px-3 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider">Atenção</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
          {disciples.filter(d => {
            if (!d.last_meeting_at) return true;
            const lastDate = new Date(d.last_meeting_at);
            const diff = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
            return diff > 7;
          }).slice(0, 4).map(overdue => (
            <div 
              key={overdue.id}
              onClick={() => {
                setSelectedDisciple(overdue);
                setIsMeetingModalOpen(true);
              }}
              className="bg-surface-low p-3 md:p-4 rounded-xl flex items-center gap-3 md:gap-4 group cursor-pointer hover:bg-surface-low/80 transition-colors border-l-4 border-red-500"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-xs md:text-sm">Registrar Discipulado</h4>
                <p className="text-[10px] md:text-xs text-on-surface-variant">
                  {overdue.name} • {overdue.last_meeting_at ? `Há ${Math.floor((new Date().getTime() - new Date(overdue.last_meeting_at).getTime()) / (1000 * 3600 * 24))} dias` : 'Aguardando 1º encontro'}
                </p>
              </div>
              <Plus size={16} className="md:w-4.5 md:h-4.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
          {disciples.length > 0 && disciples.filter(d => {
            if (!d.last_meeting_at) return true;
            const lastDate = new Date(d.last_meeting_at);
            const diff = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
            return diff > 7;
          }).length === 0 && (
            <div className="col-span-full py-6 bg-surface-low/50 rounded-xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Users size={16} />
              </div>
              <p className="text-xs font-medium italic">Tudo em dia! Todos os discípulos visitados esta semana.</p>
            </div>
          )}
        </div>
      </section>

      {/* Disciples List */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg md:text-xl font-headline font-bold">Meus Discípulos</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden sm:inline">Filtrar:</span>
            <select 
              className="bg-surface-low text-on-surface text-[10px] md:text-xs font-bold rounded-lg border-none focus:ring-1 focus:ring-primary py-1 px-2"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
            >
              <option value="all">TODOS</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="tonal-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Carregando discípulos...</p>
            </div>
          ) : filteredDisciples.length === 0 ? (
            <div className="text-center py-12 bg-surface-low rounded-2xl m-4">
              <p className="text-on-surface-variant font-medium">Nenhum discípulo encontrado.</p>
            </div>
          ) : (
            filteredDisciples.map((disciple, i) => {
              const lastDate = disciple.last_meeting_at ? new Date(disciple.last_meeting_at) : null;
              const diff = lastDate ? (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24) : 999;
              const isOverdue = diff > 7;
              const dept = departments.find(d => d.id === disciple.department_id);

              return (
                <div 
                  key={disciple.id} 
                  onClick={() => openDetails(disciple)}
                  className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:bg-surface-low transition-colors border-b border-outline-variant/10 last:border-0 cursor-pointer relative group"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-full border-2 p-0.5 relative flex items-center justify-center bg-surface-low", 
                      disciple.phase === 'lideranca' ? 'border-primary' : disciple.phase === 'pre-encontro' ? 'border-secondary' : 'border-tertiary')}>
                      <Users size={20} className="text-on-surface-variant" />
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white", isOverdue ? 'bg-red-500' : 'bg-green-500')} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base md:text-lg leading-tight flex items-center gap-2">
                        {disciple.name}
                        {isOverdue && <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter bg-red-50 px-1 rounded">Pendente</span>}
                      </h4>
                      <p className="text-[10px] md:text-xs text-on-surface-variant">
                        {dept ? (
                          <span className={cn("inline-block w-2 h-2 rounded-full mr-1", dept.color)} />
                        ) : null}
                        {dept?.name || 'Sem Depertamento'} • Último encontro: {disciple.last_meeting_at ? new Date(disciple.last_meeting_at).toLocaleDateString() : 'Nenhum'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDisciple(disciple);
                        setIsMeetingModalOpen(true);
                      }}
                      className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={14} /> Encontro
                    </button>
                    <span className={cn("px-2 md:px-3 py-0.5 md:py-1 rounded-md text-[8px] md:text-[10px] font-bold uppercase tracking-wider", getPhaseColor(disciple.phase))}>
                      {getPhaseLabel(disciple.phase)}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(disciple); }} className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition-colors">
                      <MoreVertical size={16} className="md:w-4.5 md:h-4.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <ProjectManager pillar="discipulado" />

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 md:bottom-28 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:bg-primary-container hover:scale-105 active:scale-95 transition-all z-40"
      >
        <UserPlus size={24} className="md:w-7 md:h-7" />
      </button>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Novo Discípulo"
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-4">
            <Select 
              label="Discipulador Responsável" 
              value={formData.mentor_id}
              onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione um discipulador...' },
                ...profiles.map(p => ({ value: p.id, label: p.name }))
              ]} 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Input 
              label="Nome do Discípulo" 
              placeholder="Ex: Marcos Oliveira" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input 
              label="Telefone" 
              placeholder="(00) 00000-0000" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input 
              label="Data de Nascimento" 
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
            <Input 
              label="Data de Batismo" 
              type="date"
              value={formData.baptism_date}
              onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
            />
            <Select 
              label="Departamento" 
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={[
                { value: '', label: 'Sem Departamento' },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]} 
            />
          </div>
          <Input 
            label="Endereço" 
            placeholder="Rua, Número, Bairro..." 
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Select 
              label="Fase de Crescimento" 
              value={formData.growth_phase}
              onChange={(e) => setFormData({ ...formData, growth_phase: e.target.value })}
              options={[
                { value: 'pre-encontro', label: 'Pré-Encontro' },
                { value: 'consolidacao', label: 'Consolidação' },
                { value: 'lideranca', label: 'Liderança' },
              ]} 
            />
            <Select 
              label="Status" 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'pausado', label: 'Pausado' },
              ]} 
            />
          </div>
          <Input 
            label="Observações" 
            placeholder="Alguma nota importante..." 
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Adicionar Discípulo'}
          </button>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title="Detalhes do Discípulo"
      >
        {selectedDisciple && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-surface-low rounded-2xl">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center bg-white border-2", 
                selectedDisciple.phase === 'lideranca' ? 'border-primary' : selectedDisciple.phase === 'pre-encontro' ? 'border-secondary' : 'border-tertiary')}>
                <Users size={32} className="text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedDisciple.name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider font-bold">{getPhaseLabel(selectedDisciple.phase)}</p>
                  {selectedDisciple.department_id && departments.find(d => d.id === selectedDisciple.department_id) && (
                    <span className={cn("text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded text-white capitalize", 
                      departments.find(d => d.id === selectedDisciple.department_id)?.color
                    )}>
                      {departments.find(d => d.id === selectedDisciple.department_id)?.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => openEdit(selectedDisciple)}
                  className="p-2 bg-surface-lowest rounded-full text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteDisciple(selectedDisciple.id)}
                  className="p-2 bg-surface-lowest rounded-full text-on-surface-variant hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Discipulador</p>
                <p className="text-sm font-medium">{profiles.find(p => p.id === selectedDisciple.mentor_id)?.name || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Telefone</p>
                <p className="text-sm font-medium">{selectedDisciple.phone || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status</p>
                <p className="text-sm font-medium capitalize">{selectedDisciple.status_tag}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nascimento</p>
                <p className="text-sm font-medium">{selectedDisciple.birth_date ? new Date(selectedDisciple.birth_date).toLocaleDateString() : 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Batismo</p>
                <p className="text-sm font-medium">{selectedDisciple.baptism_date ? new Date(selectedDisciple.baptism_date).toLocaleDateString() : 'Não informado'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Endereço</p>
              <p className="text-sm font-medium">{selectedDisciple.address || 'Não informado'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Observações</p>
              <p className="text-sm font-medium">{selectedDisciple.notes || 'Nenhuma observação.'}</p>
            </div>

            <div className="pt-4 border-t border-outline-variant/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-headline font-bold">Encontros</h4>
                <button 
                  onClick={() => setIsMeetingModalOpen(true)}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Novo Encontro
                </button>
              </div>

              <div className="space-y-3">
                {meetings.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-low rounded-xl">Nenhum encontro registrado.</p>
                ) : (
                  meetings.map((meeting) => (
                    <div key={meeting.id} className="p-3 bg-surface-low rounded-xl space-y-2 group">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          {new Date(meeting.meeting_date).toLocaleDateString()}
                        </span>
                        <button 
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="p-1 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-medium">{meeting.summary}</p>
                      {meeting.next_steps && (
                        <div className="pt-2 border-t border-outline-variant/5">
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Próximos Passos</p>
                          <p className="text-[10px] italic">{meeting.next_steps}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Meeting Modal */}
      <Modal 
        isOpen={isMeetingModalOpen} 
        onClose={() => setIsMeetingModalOpen(false)} 
        title="Novo Encontro"
      >
        <form className="space-y-4" onSubmit={handleAddMeeting}>
          <Input 
            label="Data do Encontro" 
            type="date"
            value={meetingFormData.meeting_date}
            onChange={(e) => setMeetingFormData({ ...meetingFormData, meeting_date: e.target.value })}
            required
          />
          <Input 
            label="Resumo do Encontro" 
            placeholder="O que foi conversado?" 
            value={meetingFormData.summary}
            onChange={(e) => setMeetingFormData({ ...meetingFormData, summary: e.target.value })}
            required
          />
          <Input 
            label="Próximos Passos" 
            placeholder="O que ficou combinado?" 
            value={meetingFormData.next_steps}
            onChange={(e) => setMeetingFormData({ ...meetingFormData, next_steps: e.target.value })}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Registrar Encontro'}
          </button>
        </form>
      </Modal>

      {/* Edit Disciple Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Discípulo"
      >
        <form className="space-y-3" onSubmit={handleUpdateDisciple}>
          <div className="grid grid-cols-1 gap-x-4">
            <Select 
              label="Discipulador Responsável" 
              value={formData.mentor_id}
              onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione um discipulador...' },
                ...profiles.map(p => ({ value: p.id, label: p.name }))
              ]} 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Input 
              label="Nome do Discípulo" 
              placeholder="Ex: Marcos Oliveira" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input 
              label="Telefone" 
              placeholder="(00) 00000-0000" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input 
              label="Data de Nascimento" 
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
            <Input 
              label="Data de Batismo" 
              type="date"
              value={formData.baptism_date}
              onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
            />
            <Select 
              label="Departamento" 
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={[
                { value: '', label: 'Sem Departamento' },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]} 
            />
          </div>
          <Input 
            label="Endereço" 
            placeholder="Rua, Número, Bairro..." 
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Select 
              label="Fase de Crescimento" 
              value={formData.growth_phase}
              onChange={(e) => setFormData({ ...formData, growth_phase: e.target.value })}
              options={[
                { value: 'pre-encontro', label: 'Pré-Encontro' },
                { value: 'consolidacao', label: 'Consolidação' },
                { value: 'lideranca', label: 'Liderança' },
              ]} 
            />
            <Select 
              label="Status" 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'pausado', label: 'Pausado' },
              ]} 
            />
          </div>
          <Input 
            label="Observações" 
            placeholder="Alguma nota importante..." 
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando Alterações...' : 'Salvar Alterações'}
          </button>
          <button 
            type="button" 
            onClick={() => {
              if (selectedDisciple) handleDeleteDisciple(selectedDisciple.id);
              setIsEditModalOpen(false);
            }}
            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-2xl border-2 border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Trash2 size={18} /> Excluir Discípulo
          </button>
        </form>
      </Modal>
    </div>
  );
};
