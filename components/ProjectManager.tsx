'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Target, 
  Users, 
  Info, 
  Trash2, 
  Loader2, 
  PlusCircle, 
  History,
  Trophy,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Modal, Input, Select, TextArea } from './Forms';

interface Project {
  id: string;
  name: string;
  pillar: string;
  department_id: string;
  leader_id: string;
  start_date: string;
  time: string;
  location: string;
  frequency: string;
  goal_participants: number;
  status: string;
  description: string;
  created_at: string;
}

interface Activity {
  id: string;
  project_id: string;
  activity_date: string;
  participants_count: number;
  description: string;
  results: string;
  responsible_id: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  color: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface ProjectManagerProps {
  pillar: 'oracao' | 'evangelismo' | 'discipulado' | 'assistencia';
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ pillar }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    department_id: '',
    leader_id: '',
    start_date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    frequency: 'unico',
    goal_participants: 0,
    status: 'ativo',
    description: ''
  });

  const [activityFormData, setActivityFormData] = useState({
    activity_date: new Date().toISOString().split('T')[0],
    participants_count: 0,
    description: '',
    results: '',
    responsible_id: ''
  });

  useEffect(() => {
    fetchData();
    
    // Realtime subscriptions
    const projectsSub = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ministry_projects', filter: `pillar=eq.${pillar}` }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      projectsSub.unsubscribe();
    };
  }, [pillar]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProjects(),
      fetchDepartments(),
      fetchProfiles()
    ]);
    setLoading(false);
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('ministry_projects')
        .select('*')
        .eq('pillar', pillar)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
      
      // Fetch all activities for these projects
      if (data && data.length > 0) {
        const projectIds = data.map(p => p.id);
        const { data: actData, error: actError } = await supabase
          .from('project_activities')
          .select('*')
          .in('project_id', projectIds)
          .order('activity_date', { ascending: false });
        
        if (!actError) setActivities(actData || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (!error) setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
      if (!error) setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('ministry_projects').insert([{
        ...projectFormData,
        pillar
      }]);
      
      if (error) throw error;
      setIsProjectModalOpen(false);
      setProjectFormData({
        name: '',
        department_id: '',
        leader_id: '',
        start_date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        frequency: 'unico',
        goal_participants: 0,
        status: 'ativo',
        description: ''
      });
      fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Erro ao criar projeto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('project_activities').insert([{
        ...activityFormData,
        project_id: selectedProject.id
      }]);
      
      if (error) throw error;
      setIsActivityModalOpen(false);
      setActivityFormData({
        activity_date: new Date().toISOString().split('T')[0],
        participants_count: 0,
        description: '',
        results: '',
        responsible_id: ''
      });
      
      // Refresh activities
      const { data: actData } = await supabase
        .from('project_activities')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('activity_date', { ascending: false });
      if (actData) {
        setActivities(prev => {
          const others = prev.filter(a => a.project_id !== selectedProject.id);
          return [...others, ...actData];
        });
      }
    } catch (err) {
      console.error('Error registering activity:', err);
      alert('Erro ao registrar atividade.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Excluir este projeto e todos os seus registros?')) return;
    try {
      const { error } = await supabase.from('ministry_projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setIsDetailModalOpen(false);
        setSelectedProject(null);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesDept = selectedDeptFilter === 'all' || p.department_id === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
    return matchesDept && matchesStatus;
  });

  const stats = {
    active: projects.filter(p => p.status === 'ativo' || p.status === 'em_andamento').length,
    participants: activities.reduce((acc, curr) => acc + (curr.participants_count || 0), 0),
    totalActivities: activities.length
  };

  return (
    <div className="space-y-6">
      <section className="bg-surface-low p-4 rounded-2xl border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-headline font-bold">Projetos / Ações por Departamento</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              title="Novo Projeto"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Mini Dash */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-outline-variant/5">
            <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Ativos</p>
            <p className="text-lg font-headline font-bold text-primary">{stats.active}</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-outline-variant/5">
            <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Participantes</p>
            <p className="text-lg font-headline font-bold text-secondary">{stats.participants}</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-outline-variant/5">
            <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Ações</p>
            <p className="text-lg font-headline font-bold text-tertiary">{stats.totalActivities}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1.5 rounded-full border border-outline-variant/10">
            <Filter size={12} className="text-on-surface-variant" />
            <select 
              className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
            >
              <option value="all">TODOS DEPTS</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1.5 rounded-full border border-outline-variant/10">
            <Target size={12} className="text-on-surface-variant" />
            <select 
              className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="all">TODOS STATUS</option>
              <option value="ativo">ATIVOS</option>
              <option value="em_andamento">EM ANDAMENTO</option>
              <option value="finalizado">FINALIZADOS</option>
            </select>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredProjects.length === 0 ? (
            <p className="text-center py-8 text-xs text-on-surface-variant italic">Nenhum projeto registrado neste pilar.</p>
          ) : (
            filteredProjects.map(project => {
              const dept = departments.find(d => d.id === project.department_id);
              const projectActs = activities.filter(a => a.project_id === project.id);
              const projectParticipants = projectActs.reduce((acc, curr) => acc + curr.participants_count, 0);

              return (
                <div 
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setIsDetailModalOpen(true);
                  }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/5 hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm leading-tight text-on-surface group-hover:text-primary transition-colors">{project.name}</h4>
                      <div className="flex items-center gap-2">
                        {dept && (
                          <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-tighter", dept.color)}>
                            {dept.name}
                          </span>
                        )}
                        <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">{project.frequency}</span>
                      </div>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase", 
                      project.status === 'finalizado' ? 'bg-surface-low text-on-surface-variant' : 'bg-green-100 text-green-700')}>
                      {project.status.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <Users size={12} />
                        <span className="text-[10px] font-bold">{projectParticipants}</span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <History size={12} />
                        <span className="text-[10px] font-bold">{projectActs.length}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Detail & Activities Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detalhes do Projeto">
        {selectedProject && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-headline font-bold text-primary">{selectedProject.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{selectedProject.description}</p>
                </div>
                <button onClick={() => handleDeleteProject(selectedProject.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Responsável</p>
                  <p className="text-xs font-medium">{profiles.find(p => p.id === selectedProject.leader_id)?.full_name || 'Não definido'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Início</p>
                  <p className="text-xs font-medium">{new Date(selectedProject.start_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Local</p>
                  <p className="text-xs font-medium flex items-center gap-1"><MapPin size={10} /> {selectedProject.location || 'Não definido'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Horário / Freq</p>
                  <p className="text-xs font-medium">{selectedProject.time || '--:--'} • {selectedProject.frequency}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/10">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <History size={16} /> Atividades Realizadas
                </h4>
                <button 
                  onClick={() => setIsActivityModalOpen(true)}
                  className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                >
                  <PlusCircle size={14} /> Registrar
                </button>
              </div>

              <div className="space-y-3">
                {activities.filter(a => a.project_id === selectedProject.id).length === 0 ? (
                  <p className="text-center py-4 text-[10px] text-on-surface-variant italic bg-surface-low rounded-xl">Nenhuma atividade registrada ainda.</p>
                ) : (
                  activities.filter(a => a.project_id === selectedProject.id).map(act => (
                    <div key={act.id} className="bg-surface-low p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{new Date(act.activity_date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 text-secondary">
                          <Users size={10} />
                          <span className="text-[10px] font-bold">{act.participants_count}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium">{act.description}</p>
                      {act.results && (
                        <div className="flex items-start gap-1.5 pt-1.5 border-t border-outline-variant/10 mt-1.5">
                          <Trophy size={10} className="text-tertiary mt-0.5 shrink-0" />
                          <p className="text-[10px] italic text-on-surface-variant">{act.results}</p>
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

      {/* New Project Modal */}
      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Novo Projeto">
        <form onSubmit={handleProjectSubmit} className="space-y-1">
          <Input 
            label="Nome do Projeto" 
            placeholder="Ex: Campanha de Oração" 
            value={projectFormData.name}
            onChange={e => setProjectFormData({...projectFormData, name: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Departamento" 
              value={projectFormData.department_id}
              onChange={e => setProjectFormData({...projectFormData, department_id: e.target.value})}
              options={[
                { value: '', label: 'Selecione...' },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]}
              required
            />
            <Select 
              label="Líder Responsável" 
              value={projectFormData.leader_id}
              onChange={e => setProjectFormData({...projectFormData, leader_id: e.target.value})}
              options={[
                { value: '', label: 'Selecione...' },
                ...profiles.map(p => ({ value: p.id, label: p.full_name || p.email }))
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Data de Início" 
              type="date"
              value={projectFormData.start_date}
              onChange={e => setProjectFormData({...projectFormData, start_date: e.target.value})}
            />
            <Input 
              label="Horário" 
              type="time"
              value={projectFormData.time}
              onChange={e => setProjectFormData({...projectFormData, time: e.target.value})}
            />
          </div>
          <Input 
            label="Local" 
            placeholder="Ex: Templo Principal / Sala 2" 
            value={projectFormData.location}
            onChange={e => setProjectFormData({...projectFormData, location: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Frequência" 
              value={projectFormData.frequency}
              onChange={e => setProjectFormData({...projectFormData, frequency: e.target.value})}
              options={[
                { value: 'unico', label: 'Evento Único' },
                { value: 'semanal', label: 'Semanal' },
                { value: 'mensal', label: 'Mensal' },
                { value: 'continuo', label: 'Contínuo / Diário' },
              ]}
            />
            <Input 
              label="Meta (Participantes)" 
              type="number"
              value={projectFormData.goal_participants}
              onChange={e => setProjectFormData({...projectFormData, goal_participants: parseInt(e.target.value) || 0})}
            />
          </div>
          <TextArea 
            label="Descrição / Objetivo" 
            placeholder="O que se espera com este projeto?" 
            value={projectFormData.description}
            onChange={e => setProjectFormData({...projectFormData, description: e.target.value})}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Projeto
          </button>
        </form>
      </Modal>

      {/* New Activity Modal */}
      <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Registrar Atividade">
        <form onSubmit={handleActivitySubmit} className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Data da Atividade" 
              type="date"
              value={activityFormData.activity_date}
              onChange={e => setActivityFormData({...activityFormData, activity_date: e.target.value})}
              required
            />
            <Input 
              label="Qtd. Participantes" 
              type="number"
              value={activityFormData.participants_count}
              onChange={e => setActivityFormData({...activityFormData, participants_count: parseInt(e.target.value) || 0})}
              required
            />
          </div>
          <TextArea 
            label="O que foi realizado?" 
            placeholder="Resumo das ações..." 
            value={activityFormData.description}
            onChange={e => setActivityFormData({...activityFormData, description: e.target.value})}
            required
          />
          <TextArea 
            label="Resultados Alcançados" 
            placeholder="Decisões, contatos, conversões, etc..." 
            value={activityFormData.results}
            onChange={e => setActivityFormData({...activityFormData, results: e.target.value})}
          />
          <Select 
            label="Responsável Pelo Registro" 
            value={activityFormData.responsible_id}
            onChange={e => setActivityFormData({...activityFormData, responsible_id: e.target.value})}
            options={[
              { value: '', label: 'Selecione...' },
              ...profiles.map(p => ({ value: p.id, label: p.full_name || p.email }))
            ]}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Atividade
          </button>
        </form>
      </Modal>
    </div>
  );
};
