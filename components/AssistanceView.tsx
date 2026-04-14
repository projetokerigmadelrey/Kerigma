'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  Wallet,
  Search,
  MoreVertical,
  Edit2,
  Plus,
  Package,
  HeartHandshake,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Modal, Input, Select, TextArea } from './Forms';
import { ProjectManager } from './ProjectManager';

interface AssistanceFamily {
  id: string;
  head_name: string;
  status: string;
  phone?: string;
  address?: string;
  members_count: number;
  adults_count: number;
  children_count: number;
  dependents_description?: string;
  needs?: string;
  urgency: string;
  notes?: string;
  approved_at?: string;
  approved_by?: string;
  last_visit_at: string;
  created_at: string;
  department_id?: string | null;
}

interface AssistanceStock {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  category: string;
  updated_at: string;
  department_id?: string | null;
}

interface AssistanceTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  source: string;
  date: string;
  created_at: string;
  department_id?: string | null;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

export const AssistanceView: React.FC = () => {
  const [families, setFamilies] = useState<AssistanceFamily[]>([]);
  const [stock, setStock] = useState<AssistanceStock[]>([]);
  const [transactions, setTransactions] = useState<AssistanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isEditFamilyModalOpen, setIsEditFamilyModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<AssistanceFamily | null>(null);
  const [editingStockItem, setEditingStockItem] = useState<AssistanceStock | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockCategory, setSelectedStockCategory] = useState<string>('todos');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  const [familyForm, setFamilyForm] = useState({
    head_name: '',
    status: 'pendente',
    phone: '',
    address: '',
    adults_count: 1,
    children_count: 0,
    dependents_description: '',
    needs: '',
    urgency: 'baixa',
    notes: '',
    department_id: ''
  });

  const [stockForm, setStockForm] = useState({
    item_name: '',
    quantity: 0,
    unit: 'un',
    min_quantity: 5,
    category: 'alimentos',
    department_id: ''
  });

  const [financeForm, setFinanceForm] = useState({
    description: '',
    amount: 0,
    type: 'entrada',
    source: '',
    department_id: ''
  });

  useEffect(() => {
    fetchData();
    fetchDepartments();
    
    const familiesSub = supabase
      .channel('families_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_families' }, () => {
        fetchData();
      })
      .subscribe();

    const stockSub = supabase
      .channel('stock_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_stock' }, () => {
        fetchData();
      })
      .subscribe();

    const financeSub = supabase
      .channel('finance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_transactions' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      familiesSub.unsubscribe();
      stockSub.unsubscribe();
      financeSub.unsubscribe();
    };
  }, []);

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

  const fetchData = async () => {
    try {
      const [familiesRes, stockRes, financeRes] = await Promise.all([
        supabase.from('assistance_families').select('*').order('head_name', { ascending: true }),
        supabase.from('assistance_stock').select('*').order('item_name', { ascending: true }),
        supabase.from('assistance_transactions').select('*').order('date', { ascending: false })
      ]);

      if (familiesRes.error) throw familiesRes.error;
      if (stockRes.error) throw stockRes.error;
      if (financeRes.error) throw financeRes.error;

      setFamilies(familiesRes.data || []);
      setStock(stockRes.data || []);
      setTransactions(financeRes.data || []);
    } catch (err) {
      console.error('Error fetching assistance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalData = {
        ...familyForm,
        members_count: (familyForm.adults_count || 0) + (familyForm.children_count || 0)
      };

      if (editingFamily) {
        const { error } = await supabase
          .from('assistance_families')
          .update(finalData)
          .eq('id', editingFamily.id);
        if (error) throw error;
        setIsEditFamilyModalOpen(false);
        setEditingFamily(null);
      } else {
        const { error } = await supabase.from('assistance_families').insert([finalData]);
        if (error) throw error;
        setIsFamilyModalOpen(false);
      }
      
      setFamilyForm({ 
        head_name: '', 
        status: 'pendente',
        phone: '',
        address: '',
        adults_count: 1,
        children_count: 0,
        dependents_description: '',
        needs: '',
        urgency: 'baixa',
        notes: '',
        department_id: ''
      });
      fetchData();
    } catch (err: any) {
      console.error('Error saving family:', err);
      alert('Erro ao salvar: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFamily = (family: AssistanceFamily) => {
    setEditingFamily(family);
    setFamilyForm({
      head_name: family.head_name,
      status: family.status,
      phone: family.phone || '',
      address: family.address || '',
      adults_count: family.adults_count || 1,
      children_count: family.children_count || 0,
      dependents_description: family.dependents_description || '',
      needs: family.needs || '',
      urgency: family.urgency || 'baixa',
      notes: family.notes || '',
      department_id: family.department_id || ''
    });
    setIsEditFamilyModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('assistance_stock').insert([stockForm]);
      if (error) throw error;
      setIsStockModalOpen(false);
      setStockForm({ item_name: '', quantity: 0, unit: 'un', min_quantity: 5, category: 'alimentos', department_id: '' });
      fetchData();
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('Erro ao adicionar item ao estoque.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStock = (item: AssistanceStock) => {
    setEditingStockItem(item);
    setStockForm({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity || 5,
      category: item.category || 'outros',
      department_id: item.department_id || ''
    });
    setIsEditStockModalOpen(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('assistance_stock')
        .update(stockForm)
        .eq('id', editingStockItem.id);
      
      if (error) throw error;
      setIsEditStockModalOpen(false);
      setEditingStockItem(null);
      setStockForm({ item_name: '', quantity: 0, unit: 'un', min_quantity: 5, category: 'alimentos', department_id: '' });
      fetchData();
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Erro ao atualizar item do estoque.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('assistance_transactions').insert([financeForm]);
      if (error) throw error;
      setFinanceForm({ description: '', amount: 0, type: 'entrada', source: '', department_id: '' });
      fetchData();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Erro ao salvar movimentação financeira.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFamilies = families.filter(f => {
    const matchesSearch = f.head_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === 'all' || f.department_id === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredTransactions = transactions.filter(t => {
    return selectedDeptFilter === 'all' || t.department_id === selectedDeptFilter;
  });

  const filteredStock = stock.filter(s => {
    return selectedDeptFilter === 'all' || s.department_id === selectedDeptFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-700';
      case 'aprovado': return 'bg-green-100 text-green-700';
      case 'rejeitado': return 'bg-red-100 text-red-600';
      case 'prioridade': return 'bg-tertiary/10 text-tertiary';
      case 'regular': return 'bg-secondary/10 text-secondary';
      case 'critico': return 'bg-red-100 text-red-600';
      default: return 'bg-surface-low text-on-surface-variant';
    }
  };

  const handleApproveFamily = async (family: AssistanceFamily) => {
    try {
      const { error } = await supabase
        .from('assistance_families')
        .update({ status: 'aprovado', approved_at: new Date().toISOString(), approved_by: 'admin' })
        .eq('id', family.id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao aprovar: ' + (err?.message || ''));
    }
  };

  const handleRejectFamily = async (family: AssistanceFamily) => {
    try {
      const { error } = await supabase
        .from('assistance_families')
        .update({ status: 'rejeitado' })
        .eq('id', family.id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao rejeitar: ' + (err?.message || ''));
    }
  };

  const pendingFamilies = families.filter(f => f.status === 'pendente');

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critica': return 'bg-red-500 text-white';
      case 'alta': return 'bg-orange-500 text-white';
      case 'media': return 'bg-yellow-500 text-black';
      case 'baixa': return 'bg-green-500 text-white';
      default: return 'bg-surface-low text-on-surface-variant';
    }
  };

  const lowStockItems = stock.filter(item => item.quantity <= item.min_quantity);
  const criticalFamilies = families.filter(f => f.urgency === 'critica' || f.urgency === 'alta').slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight">Assistência Social</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hidden md:inline">Filtrar por Departamento:</span>
            <select 
              className="bg-surface-low text-on-surface text-xs font-bold rounded-lg border-none focus:ring-1 focus:ring-primary py-1.5 px-3"
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
        <div className="flex gap-2">
          <button 
            onClick={() => setIsFamilyModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-container transition-all text-sm font-bold"
          >
            <Plus size={18} /> Família
          </button>
          <button 
            onClick={() => setIsFinanceModalOpen(true)}
            className="flex items-center gap-2 bg-surface-lowest text-tertiary px-4 py-2.5 rounded-xl shadow-sm border border-outline-variant/10 hover:bg-surface-low transition-all text-sm font-bold"
          >
            <Wallet size={18} /> Financeiro
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-2 tonal-card p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Saldo em Caixa</p>
              <h3 className="text-3xl font-headline font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredTransactions.reduce((acc, t) => t.type === 'entrada' ? acc + t.amount : acc - t.amount, 0)
                )}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                <ArrowUpRight size={14} /> 
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0)
                )}
              </span>
              <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                <ArrowDownRight size={14} />
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0)
                )}
              </span>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-24 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <path 
                d="M 0 80 Q 25 20, 50 60 T 100 40 L 100 100 L 0 100 Z" 
                fill="url(#gradient-finance)"
              />
              <defs>
                <linearGradient id="gradient-finance" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="tonal-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">IMPACTO</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-headline font-bold">{families.length}</h3>
            <p className="text-sm text-on-surface-variant font-medium">Famílias Atendidas</p>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">ALERTA</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-headline font-bold text-red-600">
              {filteredFamilies.filter(f => f.urgency === 'critica').length}
            </h3>
            <p className="text-sm text-red-600/80 font-medium">Casos Críticos</p>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-headline font-bold flex items-center gap-2 text-primary">
                <ClipboardCheck size={18} /> Atendimentos
                <span className="text-[10px] text-on-surface-variant ml-1">({filteredFamilies.length})</span>
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  className="pl-9 pr-4 py-1.5 bg-surface-low text-on-surface rounded-lg text-xs w-48 focus:ring-2 focus:ring-primary/20 border-none" 
                  placeholder="Buscar família..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="tonal-card overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-surface-low/50">
                     <tr>
                       <th className="px-4 py-3 text-[10px] font-bold uppercase text-on-surface-variant">Família</th>
                       <th className="px-4 py-3 text-[10px] font-bold uppercase text-on-surface-variant">Status</th>
                       <th className="px-4 py-3 text-[10px] font-bold uppercase text-on-surface-variant">Urgência</th>
                       <th className="px-4 py-3"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-outline-variant/10">
                     {filteredFamilies.filter(f => f.status === 'aprovado' || f.status === 'regular').slice(0, 6).map(row => (
                       <tr key={row.id} className="hover:bg-surface-low/50 transition-colors group/row">
                         <td className="px-4 py-3">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold">{row.head_name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tight">{row.phone || 'Sem contato'}</span>
                                {row.department_id && departments.find(d => d.id === row.department_id) && (
                                  <span className={cn("text-[7px] font-bold px-1 py-0.2 rounded text-white uppercase", 
                                    departments.find(d => d.id === row.department_id)?.color
                                  )}>
                                    {departments.find(d => d.id === row.department_id)?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                         <td className="px-4 py-3">
                           <span className={cn("px-2 py-0.5 text-[8px] font-bold uppercase rounded-full", getStatusColor(row.status))}>
                             {row.status === 'aprovado' ? '✓ Aprovado' : row.status}
                           </span>
                         </td>
                         <td className="px-4 py-3">
                           <span className={cn("px-2 py-0.5 text-[8px] font-bold uppercase rounded-full", getUrgencyBadge(row.urgency))}>
                             {row.urgency}
                           </span>
                         </td>
                         <td className="px-4 py-3 text-right">
                           <button onClick={() => handleEditFamily(row)} className="p-1.5 hover:bg-primary/10 text-primary rounded-full opacity-0 group-hover/row:opacity-100 transition-all">
                             <Edit2 size={14} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-headline font-bold flex items-center gap-2 text-amber-600">
              <Clock size={18} /> Aguardando Aprovação
              {filteredFamilies.filter(f => f.status === 'pendente').length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{filteredFamilies.filter(f => f.status === 'pendente').length}</span>
              )}
            </h2>
            <div className="space-y-3">
              {filteredFamilies.filter(f => f.status === 'pendente').length === 0 ? (
                <div className="tonal-card p-8 text-center text-on-surface-variant">
                   <p className="text-xs font-medium">Nenhum cadastro pendente.</p>
                </div>
              ) : (
                filteredFamilies.filter(f => f.status === 'pendente').map(f => (
                  <div key={f.id} className="tonal-card p-4 bg-white border-l-4 border-amber-400 shadow-sm relative overflow-hidden">
                    {f.department_id && departments.find(d => d.id === f.department_id) && (
                      <div className={cn("absolute top-0 right-0 px-2 py-0.5 text-[7px] font-bold text-white uppercase rounded-bl-lg shadow-sm z-10", 
                        departments.find(d => d.id === f.department_id)?.color
                      )}>
                        {departments.find(d => d.id === f.department_id)?.name}
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{f.head_name}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{f.phone || 'Sem contato'} • {f.adults_count + f.children_count} membros</p>
                        <p className="text-[10px] text-on-surface-variant mt-1 line-clamp-1">{f.needs || 'Sem necessidades descritas'}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 text-[8px] font-bold uppercase rounded-full", getUrgencyBadge(f.urgency))}>
                        {f.urgency}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleApproveFamily(f)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 size={14} /> APROVAR
                      </button>
                      <button 
                        onClick={() => handleRejectFamily(f)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-100 text-red-600 text-[10px] font-bold py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <XCircle size={14} /> REJEITAR
                      </button>
                      <button 
                        onClick={() => handleEditFamily(f)}
                        className="flex items-center justify-center gap-1 bg-surface-low text-on-surface-variant text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-surface-low/80 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-headline font-bold flex items-center gap-2">
              <Package size={18} className="text-orange-500" /> Estoque Crítico
            </h2>
            <button 
              onClick={() => setIsStockModalOpen(true)}
              className="p-1.5 bg-surface-low hover:bg-surface-low/80 rounded-lg text-primary"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="tonal-card p-5 space-y-4">
            {filteredStock.filter(item => item.quantity <= item.min_quantity).length === 0 ? (
              <p className="text-center text-xs text-on-surface-variant py-4 italic">Estoque OK.</p>
            ) : (
              filteredStock.filter(item => item.quantity <= item.min_quantity).slice(0, 5).map(item => {
                const dept = departments.find(d => d.id === item.department_id);
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{item.item_name}</span>
                        {dept && (
                          <span className={cn("text-[7px] font-bold w-fit mt-0.5 px-1 py-0.2 rounded text-white uppercase", dept.color)}>
                            {dept.name}
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-headline font-bold text-red-500">{item.quantity}</span>
                    </div>
                    <div className="w-full bg-red-100 h-1.5 rounded-full">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${(item.quantity / (item.min_quantity || 1)) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <ProjectManager pillar="assistencia" />

      {/* Modals */}
      <Modal 
        isOpen={isFamilyModalOpen || isEditFamilyModalOpen} 
        onClose={() => {
          setIsFamilyModalOpen(false);
          setIsEditFamilyModalOpen(false);
          setEditingFamily(null);
          setFamilyForm({ 
            head_name: '', 
            status: 'pendente',
            phone: '',
            address: '',
            adults_count: 1,
            children_count: 0,
            dependents_description: '',
            needs: '',
            urgency: 'baixa',
            notes: '',
            department_id: ''
          });
        }} 
        title={editingFamily ? "Editar Registro de Família" : "Novo Registro de Família"}
      >
        <form className="space-y-4" onSubmit={handleFamilySubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Departamento Responsável" 
              value={familyForm.department_id}
              onChange={(e) => setFamilyForm({ ...familyForm, department_id: e.target.value })}
              options={[
                { value: '', label: 'Sem Departamento' },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]} 
              required
            />
            <Input 
              label="Nome do Chefe da Família" 
              placeholder="Ex: Elena Rodriguez" 
              value={familyForm.head_name}
              onChange={(e) => setFamilyForm({ ...familyForm, head_name: e.target.value })}
              required
            />
            <Input 
              label="Telefone de Contato" 
              placeholder="(00) 00000-0000" 
              value={familyForm.phone}
              onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
            />
            {editingFamily ? (
              <Select 
                label="Status do Cadastro" 
                value={familyForm.status}
                onChange={(e) => setFamilyForm({ ...familyForm, status: e.target.value })}
                options={[
                  { value: 'pendente', label: '⏳ Pendente' },
                  { value: 'aprovado', label: '✓ Aprovado' },
                  { value: 'rejeitado', label: '✗ Rejeitado' },
                ]} 
              />
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Status</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2.5 rounded-xl text-center">⏳ Aguardando Aprovação</span>
              </div>
            )}
            <Select 
              label="Nível de Urgência" 
              value={familyForm.urgency}
              onChange={(e) => setFamilyForm({ ...familyForm, urgency: e.target.value })}
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
                { value: 'critica', label: 'Crítica' },
              ]} 
            />
          </div>
          
          <Input 
            label="Endereço Completo" 
            placeholder="Rua, Número, Bairro, Cidade..." 
            value={familyForm.address}
            onChange={(e) => setFamilyForm({ ...familyForm, address: e.target.value })}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input 
              label="Adultos" 
              type="number"
              value={familyForm.adults_count}
              onChange={(e) => setFamilyForm({ ...familyForm, adults_count: Math.max(0, parseInt(e.target.value) || 0) })}
              required
            />
            <Input 
              label="Filhos/Crianças" 
              type="number"
              value={familyForm.children_count}
              onChange={(e) => setFamilyForm({ ...familyForm, children_count: Math.max(0, parseInt(e.target.value) || 0) })}
              required
            />
            <div className="flex flex-col justify-end pb-1.5 md:pb-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total</span>
              <span className="text-lg font-headline font-bold text-primary">
                {(familyForm.adults_count || 0) + (familyForm.children_count || 0)} membros
              </span>
            </div>
          </div>

          <TextArea 
            label="Informações dos Integrantes / Dependentes" 
            placeholder="Ex: 1 bebê de 6 meses, 1 idoso acamado, filhos em idade escolar..." 
            value={familyForm.dependents_description}
            onChange={(e) => setFamilyForm({ ...familyForm, dependents_description: e.target.value })}
            rows={2}
          />

          <TextArea 
            label="Necessidades / Auxílios Solicitados" 
            placeholder="Descreva as demandas da família..." 
            value={familyForm.needs}
            onChange={(e) => setFamilyForm({ ...familyForm, needs: e.target.value })}
            rows={3}
          />

          <TextArea 
            label="Observações do Assistente" 
            placeholder="Notas sobre a visita ou situação..." 
            value={familyForm.notes}
            onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
            rows={2}
          />

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : editingFamily ? 'Salvar Alterações' : 'Salvar Registro'}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isStockModalOpen || isEditStockModalOpen} 
        onClose={() => {
          setIsStockModalOpen(false);
          setIsEditStockModalOpen(false);
          setEditingStockItem(null);
          setStockForm({ item_name: '', quantity: 0, unit: 'un', min_quantity: 5, category: 'alimentos', department_id: '' });
        }} 
        title={editingStockItem ? "Editar Item do Estoque" : "Novo Item do Estoque"}
      >
        <form className="space-y-4" onSubmit={editingStockItem ? handleUpdateStock : handleStockSubmit}>
          <Select 
            label="Departamento Responsável" 
            value={stockForm.department_id}
            onChange={(e) => setStockForm({ ...stockForm, department_id: e.target.value })}
            options={[
              { value: '', label: 'Sem Departamento' },
              ...departments.map(d => ({ value: d.id, label: d.name }))
            ]} 
            required
          />
          <Input 
            label="Nome do Item / Produto" 
            placeholder="Ex: Arroz, Feijão, Sabonete..." 
            value={stockForm.item_name}
            onChange={(e) => setStockForm({ ...stockForm, item_name: e.target.value })}
            required
          />
          
          <Select 
            label="Tipo / Categoria do Item" 
            value={stockForm.category}
            onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
            options={[
              { value: 'alimentos', label: 'Alimentos' },
              { value: 'higiene', label: 'Higiene de Uso Pessoal' },
              { value: 'limpeza', label: 'Produtos de Limpeza' },
              { value: 'roupas', label: 'Vestuário / Roupas' },
              { value: 'outros', label: 'Outros / Diversos' },
            ]} 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantidade Atual" 
              type="number"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 0 })}
              required
            />
            <Input 
              label="Medida (Unidade)" 
              placeholder="Ex: un, kg, pacotes" 
              value={stockForm.unit}
              onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })}
              required
            />
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <Input 
              label="Alerta de Estoque Baixo" 
              type="number"
              value={stockForm.min_quantity}
              onChange={(e) => setStockForm({ ...stockForm, min_quantity: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-[10px] text-red-600/70 mt-1">O sistema avisará quando o estoque for menor ou igual a este valor.</p>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary-container transition-all mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando...' : editingStockItem ? 'Salvar Alterações' : 'Salvar Registro'}
          </button>
        </form>
      </Modal>

      {/* Finance Modal */}
      <Modal 
        isOpen={isFinanceModalOpen} 
        onClose={() => setIsFinanceModalOpen(false)} 
        title="Controle Financeiro - Assistência"
      >
        <div className="space-y-6">
          <div className="bg-surface-low p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Saldo Atual</p>
              <p className="text-2xl font-headline font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  transactions.reduce((acc, t) => t.type === 'entrada' ? acc + t.amount : acc - t.amount, 0)
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="text-right">
                <p className="text-[8px] font-bold text-green-600 uppercase">Entradas</p>
                <p className="text-sm font-bold text-green-600">
                  +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    transactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="text-right border-l pl-2">
                <p className="text-[8px] font-bold text-red-600 uppercase">Saídas</p>
                <p className="text-sm font-bold text-red-600">
                  -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    transactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-3 p-4 border-2 border-dashed border-outline-variant/30 rounded-2xl" onSubmit={handleFinanceSubmit}>
            <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">Registrar Nova Movimentação</p>
            <div className="grid grid-cols-2 gap-3">
              <Select 
                label="Tipo" 
                value={financeForm.type}
                onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value as 'entrada' | 'saida' })}
                options={[
                  { value: 'entrada', label: 'Entrada (+)' },
                  { value: 'saida', label: 'Saída (-)' }
                ]}
              />
              <Input 
                label="Valor (R$)" 
                type="number"
                placeholder="0,00"
                value={financeForm.amount}
                onChange={(e) => setFinanceForm({ ...financeForm, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <Input 
              label="Origem / Destino" 
              placeholder="De onde veio or Para onde vai?"
              value={financeForm.source}
              onChange={(e) => setFinanceForm({ ...financeForm, source: e.target.value })}
              required
            />
            <Input 
              label="Descrição / Motivo" 
              placeholder="Ex: Doação Especial do Mês"
              value={financeForm.description}
              onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
              required
            />
            <button 
              type="submit" 
              disabled={submitting}
              className={cn(
                "w-full py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                financeForm.type === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
              {financeForm.type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
            </button>
          </form>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase text-on-surface-variant">Histórico Recente</p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {transactions.length === 0 ? (
                <p className="text-center py-8 text-xs text-on-surface-variant italic">Nenhuma transação registrada.</p>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-surface-lowest border border-outline-variant/10 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <div className={cn(
                        "p-2 rounded-full",
                        t.type === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      )}>
                        {t.type === 'entrada' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{t.description}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">{t.source} • {new Date(t.date || t.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-bold",
                      t.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {t.type === 'entrada' ? '+' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
