'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Megaphone, 
  TrendingUp, 
  PlusCircle, 
  User,
  MapPin,
  ChevronRight,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Modal, Input, Select, TextArea } from './Forms';

interface EvangelismRecord {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  status: string;
  notes: string;
  location: string;
  created_at: string;
  department_id?: string | null;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

export const EvangelismView: React.FC = () => {
  const [records, setRecords] = useState<EvangelismRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_phone: '',
    status: 'contato',
    location: '',
    notes: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchDepartments();
    
    const subscription = supabase
      .channel('evangelism_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evangelism_records' }, () => {
        fetchRecords();
      })
      .subscribe();

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('evangelism_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching evangelism records:', err);
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

  const filteredRecords = records.filter(record => {
    if (selectedDeptFilter === 'all') return true;
    return record.department_id === selectedDeptFilter;
  });

  const handleEdit = (record: EvangelismRecord) => {
    setEditingId(record.id);
    setFormData({
      contact_name: record.contact_name,
      contact_phone: record.contact_phone || '',
      status: record.status || 'contato',
      location: record.location || '',
      notes: record.notes || '',
      department_id: record.department_id || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ contact_name: '', contact_phone: '', status: 'contato', location: '', notes: '', department_id: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingId) {
        const { error } = await supabase
          .from('evangelism_records')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('evangelism_records').insert([
          {
            ...formData,
            user_id: user.id
          }
        ]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ contact_name: '', contact_phone: '', status: 'contato', location: '', notes: '', department_id: '' });
    } catch (err) {
      console.error('Error submitting record:', err);
      alert('Erro ao salvar registro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      const { error } = await supabase
        .from('evangelism_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Erro ao excluir registro.');
    }
  };

  const stats = {
    total: records.length,
    decisions: records.filter(r => r.status === 'decisao').length,
    visits: records.filter(r => r.status === 'visita').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'decisao': return 'bg-tertiary/10 text-tertiary';
      case 'visita': return 'bg-secondary/10 text-secondary';
      case 'discipulado': return 'bg-primary/10 text-primary';
      default: return 'bg-surface-low text-on-surface-variant';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'decisao': return 'Decisão Tomada';
      case 'visita': return 'Pendente de Visita';
      case 'discipulado': return 'Em Discipulado';
      case 'contato': return 'Contato Inicial';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <section className="px-1">
        <h2 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight mb-0.5 md:mb-1">Evangelismo</h2>
        <p className="text-on-surface-variant text-sm md:font-medium">Painel de Missões e Colheita</p>
      </section>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="md:col-span-2 signature-gradient p-4 md:p-8 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="relative z-10 text-white">
            <p className="text-[7px] md:text-[10px] uppercase tracking-widest opacity-80 mb-1 md:mb-2 font-bold">Impacto Total</p>
            <h3 className="text-3xl md:text-5xl font-headline font-extrabold mb-4 md:mb-8">{stats.total}</h3>
            <div className="flex items-center gap-1 md:gap-2 text-white/80">
              <TrendingUp size={12} className="md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm font-semibold">Vidas alcançadas</span>
            </div>
            <p className="mt-1 md:mt-2 text-white/60 text-[10px] md:text-sm">Contatos Realizados em campo</p>
          </div>
          <Megaphone size={100} className="md:w-40 md:h-40 absolute -right-4 md:-right-8 -bottom-4 md:-bottom-8 text-white/10 rotate-12" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
          <div className="tonal-card p-3 md:p-6 border-l-4 border-tertiary">
            <p className="text-[7px] md:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Novas Decisões</p>
            <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
              <span className="text-xl md:text-3xl font-headline font-bold text-tertiary">{stats.decisions}</span>
              <span className="text-[9px] md:text-xs text-on-surface-variant">Vidas</span>
            </div>
          </div>
          <div className="tonal-card p-3 md:p-6 border-l-4 border-secondary">
            <p className="text-[7px] md:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Visitas Agendadas</p>
            <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
              <span className="text-xl md:text-3xl font-headline font-bold text-secondary">{stats.visits}</span>
              <span className="text-[9px] md:text-xs text-on-surface-variant">Pendentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 bg-surface-low p-4 md:p-6 rounded-xl">
        <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
          <h4 className="text-base md:text-xl font-headline font-bold">Registro de Campo</h4>
          <p className="text-on-surface-variant text-[10px] md:text-sm">Inicie um novo registro de abordagem evangelística.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="w-full md:w-auto bg-primary text-white px-5 md:px-8 py-2.5 md:py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-primary-container active:scale-95 transition-all text-xs md:text-base"
        >
          <PlusCircle size={16} className="md:w-5 md:h-5" />
          Novo Registro
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Contacts */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base md:text-lg font-headline font-bold">Contatos Recentes</h3>
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
          <div className="space-y-2.5 md:space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Carregando contatos...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 bg-surface-low rounded-2xl">
                <p className="text-on-surface-variant font-medium">Nenhum registro encontrado.</p>
              </div>
            ) : (
              filteredRecords.map((record, i) => {
                const dept = departments.find(d => d.id === record.department_id);
                return (
                  <div 
                    key={record.id} 
                    onClick={() => handleEdit(record)}
                    className="w-full text-left tonal-card p-3 md:p-4 flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-surface-low flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <User size={18} className="md:w-5 md:h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm md:text-base">{record.contact_name}</h5>
                        <p className="text-[10px] md:text-xs text-on-surface-variant">
                          {dept ? (
                            <span className={cn("inline-block w-2 h-2 rounded-full mr-1", dept.color)} />
                          ) : null}
                          {dept?.name || 'Sem Departamento'} • {record.contact_phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 md:gap-2">
                      <div className="flex items-center gap-2">
                        {record.user_id === currentUserId && (
                          <button
                            onClick={(e) => handleDelete(e, record.id)}
                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Excluir contato"
                          >
                            <Trash2 size={14} className="md:w-4 md:h-4" />
                          </button>
                        )}
                        <span className={cn("px-2 md:px-3 py-0.5 md:py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-md", getStatusColor(record.status))}>
                          {getStatusLabel(record.status)}
                        </span>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-on-surface-variant">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Geographic Progress */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-base md:text-lg font-headline font-bold px-1">Bairros Alcançados</h3>
          <div className="tonal-card overflow-hidden">
            <div className="h-40 md:h-48 w-full bg-slate-200 relative">
              <Image 
                alt="Map view" 
                fill
                className="object-cover opacity-60 grayscale" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbMbygaFoxf6fbDoP5bGRNEMQRrtVxUC5eIIQ2-QS07NCpc_c3oVxdH7gBTeXcBZ6Zn3iBeNbAEpxx66AxX9TQKPcXBMngYZo7d6dCMGwj9dNPbOdglr9zW46dj9OOooGB5VlYMCHDLLiUm9eZBo6RBK3HgFBzbH9f6_Nsk03p47IW1npHw5XH8VsKoDWPFuhszAXds2uKMS2JklXqG089F_6PZs91omas7rWIG3f5tlYaN1V8lXT6E9gReF8G3JM_g-MuYkaoB64"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-md flex items-center gap-1.5 md:gap-2">
                  <MapPin size={14} className="text-primary fill-primary/20 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs font-bold text-primary">8 Bairros Ativos</span>
                </div>
              </div>
            </div>
            <div className="p-3 md:p-4 space-y-3 md:space-y-4">
              {[
                { name: 'Jardim Paulista', progress: 85 },
                { name: 'Pinheiros', progress: 60 },
                { name: 'Itaim Bibi', progress: 42 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 md:w-24 h-1.5 md:h-2 bg-surface-low rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className="text-[9px] md:text-[10px] font-bold">{item.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }} 
        title={editingId ? "Editar Registro" : "Novo Registro de Evangelismo"}
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input 
            label="Nome do Contato" 
            placeholder="Ex: Ricardo Oliveira" 
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            required
          />
          <Input 
            label="Telefone" 
            placeholder="(11) 98765-4321" 
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          />
          <Input 
            label="Localização / Bairro" 
            placeholder="Ex: Jardim Paulista" 
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <Select 
            label="Departamento Responsável" 
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            options={[
              { value: '', label: 'Sem Departamento' },
              ...departments.map(d => ({ value: d.id, label: d.name }))
            ]} 
          />
          <Select 
            label="Status" 
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'contato', label: 'Contato Inicial' },
              { value: 'decisao', label: 'Decisão Tomada' },
              { value: 'visita', label: 'Pendente de Visita' },
              { value: 'discipulado', label: 'Em Discipulado' },
            ]} 
          />
          <TextArea 
            label="Observações" 
            placeholder="Detalhes sobre a abordagem..." 
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
