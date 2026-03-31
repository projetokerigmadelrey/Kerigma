'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  MoreVertical, 
  Lock, 
  Eye, 
  Edit3, 
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Modal, Input, Select, TextArea } from './Forms';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  permissions?: {
    evangelismo: boolean;
    discipulado: boolean;
    oracao: boolean;
    assistencia: boolean;
    adm: boolean;
  };
  department_id?: string | null;
}

interface Department {
  id: string;
  name: string;
  leader_id: string | null;
  color: string;
  member_count?: number;
  description?: string;
}

export const AdminView: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [deptForm, setDeptForm] = useState({
    name: '',
    leader_id: '',
    description: '',
    color: 'bg-primary'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (profilesData) {
        setProfiles(profilesData);
        // Preserve selected user or default to first
        setSelectedUser(prev => {
          if (prev) {
            const updated = profilesData.find(p => p.id === prev.id);
            return updated || profilesData[0] || null;
          }
          return profilesData[0] || null;
        });
      }
      if (deptsData) setDepartments(deptsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async () => {
    if (!deptForm.name.trim()) {
      alert('Digite o nome do departamento.');
      return;
    }
    try {
      const { error } = await supabase
        .from('departments')
        .insert([{ 
          name: deptForm.name, 
          leader_id: deptForm.leader_id || null, 
          description: deptForm.description,
          color: deptForm.color 
        }]);

      if (error) {
        alert('Erro ao criar departamento: ' + error.message);
        return;
      }

      setShowNewDeptModal(false);
      setDeptForm({ name: '', leader_id: '', description: '', color: 'bg-primary' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating department:', error);
      alert('Erro ao criar departamento: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      // If setting to admin, grant all permissions
      const updates: any = { role: newRole };
      if (newRole === 'admin') {
        updates.permissions = {
          evangelismo: true,
          discipulado: true,
          oracao: true,
          assistencia: true,
          adm: true
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (!error) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleTogglePermission = async (userId: string, permission: string, currentValue: boolean) => {
    const user = profiles.find(p => p.id === userId);
    if (!user) return;

    // Henrique always has all permissions
    if (user.email === 'henrique.diascarlos@hotmail.com') return;

    const newPermissions = {
      ...(user.permissions || {
        evangelismo: false,
        discipulado: false,
        oracao: true,
        assistencia: false,
        adm: false
      }),
      [permission]: !currentValue
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ permissions: newPermissions })
        .eq('id', userId);

      if (!error) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handleUpdateDepartment = async (userId: string, deptId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department_id: deptId || null })
        .eq('id', userId);

      if (!error) {
        fetchData();
      } else {
        alert('Erro ao atualizar departamento: ' + error.message);
      }
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-0.5 md:space-y-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight">Administração</h1>
          <p className="text-xs md:text-base text-on-surface-variant font-medium">Gerencie departamentos e usuários.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="flex-1 md:flex-none bg-primary text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-base font-bold hover:bg-primary-container transition-all shadow-lg flex items-center justify-center gap-1.5 md:gap-2" onClick={() => setShowNewDeptModal(true)}>
            <Plus size={16} /> Novo Departamento
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Departments List */}
        <section className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="tonal-card p-4 md:p-6 space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-headline font-bold flex items-center gap-2">
              <Settings size={18} className="text-primary" /> Departamentos
            </h2>
            <div className="space-y-2 md:space-y-3">
              {departments.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">Nenhum departamento criado.</p>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-2.5 md:p-3 bg-surface-low rounded-lg md:rounded-xl group cursor-pointer hover:bg-surface-low/80 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", dept.color)} />
                        <span className="font-bold text-xs md:text-sm truncate">{dept.name}</span>
                      </div>
                      {dept.description && (
                        <p className="text-[10px] md:text-xs text-on-surface-variant truncate mt-0.5 ml-3.5 md:ml-5">{dept.description}</p>
                      )}
                    </div>
                    <ChevronRight size={12} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* User Management */}
        <section className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-headline font-bold flex items-center gap-2">
              <Users size={18} className="text-primary" /> Usuários
            </h2>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-surface-low text-on-surface rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-xs md:text-sm" 
                placeholder="Buscar..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="tonal-card overflow-hidden">
            {selectedUser && (
              <>
                <div className="p-4 md:p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-low/50">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden relative border-2 border-primary bg-surface-low">
                      {selectedUser.avatar_url ? (
                        <Image 
                          fill
                          className="object-cover" 
                          src={selectedUser.avatar_url} 
                          alt={selectedUser.full_name} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                          {selectedUser.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">{selectedUser.full_name}</h3>
                      <p className="text-[10px] md:text-xs text-on-surface-variant">{selectedUser.role} • {selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Select 
                      label=""
                      value={selectedUser.role}
                      onChange={(e) => handleUpdateRole(selectedUser.id, e.target.value)}
                      options={[
                        { value: 'admin', label: 'Administrador' },
                        { value: 'leader', label: 'Líder' },
                        { value: 'member', label: 'Membro' },
                        { value: 'assistance', label: 'Assistência' }
                      ]}
                    />
                    <Select 
                      label=""
                      value={selectedUser.department_id || ''}
                      onChange={(e) => handleUpdateDepartment(selectedUser.id, e.target.value)}
                      options={[
                        { value: '', label: 'Sem Departamento' },
                        ...departments.map(d => ({ value: d.id, label: d.name }))
                      ]}
                    />
                  </div>
                </div>

                <div className="p-4 md:p-8 space-y-4 md:space-y-8">
                  <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant">Permissões do Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {[
                      { key: 'evangelismo', title: 'Evangelismo', desc: 'Acesso total a relatórios' },
                      { key: 'discipulado', title: 'Discipulado', desc: 'Visualização de discípulos' },
                      { key: 'oracao', title: 'Oração', desc: 'Gerenciamento de pedidos' },
                      { key: 'assistencia', title: 'Assistência', desc: 'Acesso a famílias e estoque' },
                    ].map((perm) => {
                      const isSuperAdmin = selectedUser.email === 'henrique.diascarlos@hotmail.com';
                      const isAdmin = selectedUser.role === 'admin';
                      const isActive = isSuperAdmin || isAdmin || !!selectedUser.permissions?.[perm.key as keyof typeof selectedUser.permissions];
                      const canToggle = !isSuperAdmin && !isAdmin;

                      return (
                        <div 
                          key={perm.key} 
                          className={cn(
                            "flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-surface-low rounded-xl md:rounded-2xl border border-transparent transition-all",
                            canToggle ? "cursor-pointer hover:border-outline-variant/20" : "opacity-80"
                          )}
                          onClick={() => canToggle && handleTogglePermission(selectedUser.id, perm.key, isActive)}
                        >
                          <div className={cn(
                            "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-colors", 
                            isActive ? "bg-primary text-white" : "bg-surface-lowest text-on-surface-variant"
                          )}>
                            {isActive ? <ShieldCheck size={16} /> : <Lock size={16} />}
                          </div>
                          <div className="flex-1 space-y-0.5 md:space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs md:text-sm">{perm.title}</span>
                              <div className={cn(
                                "w-8 h-4 md:w-10 md:h-5 rounded-full relative transition-colors", 
                                isActive ? "bg-primary" : "bg-outline-variant"
                              )}>
                                <motion.div 
                                  animate={{ x: isActive ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 20) : 0 }}
                                  className="absolute top-0.5 md:top-1 left-0.5 md:left-1 w-2 md:w-3 h-2 md:h-3 bg-white rounded-full transition-all" 
                                />
                              </div>
                            </div>
                            <p className="text-[10px] md:text-xs text-on-surface-variant leading-tight md:leading-relaxed">{perm.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-headline font-bold">Todos os Usuários</h3>
            <div className="space-y-2 md:space-y-3">
              {filteredProfiles.map((user) => (
                <div 
                  key={user.id} 
                  className={cn(
                    "tonal-card p-3 md:p-4 flex items-center justify-between group cursor-pointer transition-all",
                    selectedUser?.id === user.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-surface-low"
                  )}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative bg-surface-low">
                      {user.avatar_url ? (
                        <Image fill className="object-cover" src={user.avatar_url} alt={user.full_name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                          {user.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs md:text-sm">{user.full_name}</h5>
                      <p className="text-[10px] md:text-xs text-on-surface-variant">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className={cn(
                      "text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 md:px-2 py-0.5 md:py-1 rounded",
                      user.role === 'admin' ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"
                    )}>
                      {user.role}
                    </span>
                    <button className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Modal 
        isOpen={showNewDeptModal} 
        onClose={() => setShowNewDeptModal(false)} 
        title="Novo Departamento"
      >
        <div className="space-y-4">
          <Input 
            label="Nome do Departamento" 
            placeholder="Ex: Jovens, Casais..." 
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />
          <Select 
            label="Líder Responsável"
            value={deptForm.leader_id}
            onChange={(e) => setDeptForm({ ...deptForm, leader_id: e.target.value })}
            options={[
              { value: '', label: 'Selecione um líder...' },
              ...profiles.map(p => ({ value: p.id, label: p.full_name }))
            ]}
          />
          <TextArea 
            label="Descrição" 
            placeholder="O que este departamento faz?" 
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cor de Identificação</label>
            <div className="flex gap-3">
              {['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-red-500', 'bg-teal-500', 'bg-purple-500'].map((color) => (
                <button 
                  key={color} 
                  onClick={() => setDeptForm({ ...deptForm, color })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all", 
                    color,
                    deptForm.color === color ? "border-on-surface scale-110" : "border-white"
                  )} 
                />
              ))}
            </div>
          </div>
          <button 
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all mt-4"
            onClick={handleCreateDept}
          >
            Criar Departamento
          </button>
        </div>
      </Modal>
    </div>
  );
};
