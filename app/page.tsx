'use client';

import React, { useState, useEffect } from 'react';
import { TopAppBar, BottomNavBar, ViewType } from '@/components/Navigation';
import { DashboardView } from '@/components/Dashboard';
import { PrayerView } from '@/components/PrayerView';
import { EvangelismView } from '@/components/EvangelismView';
import { DiscipleshipView } from '@/components/DiscipleshipView';
import { AssistanceView } from '@/components/AssistanceView';
import { AdminView } from '@/components/AdminView';
import { LoginView } from '@/components/LoginView';
import { Modal, Input } from '@/components/Forms';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('painel');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (recoveryPassword.length < 6) {
      setRecoveryError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (recoveryPassword !== recoveryConfirm) {
      setRecoveryError('As senhas não coincidem.');
      return;
    }
    
    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;
      
      if (session) {
        await supabase.from('password_logs').insert({
          target_user_id: session.user.id,
          action_by: session.user.id,
          action_type: 'user_change'
        });
      }
      
      alert('Senha redefinida com sucesso!');
      setIsRecovering(false);
    } catch (err: any) {
      setRecoveryError(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const renderView = () => {
    const isSuperAdmin = profile?.email === 'henrique.diascarlos@hotmail.com';
    const isAdmin = profile?.role === 'admin';
    const permissions = profile?.permissions || {};

    // Check permissions
    const hasPermission = (view: ViewType) => {
      if (view === 'painel') return true;
      if (isSuperAdmin || isAdmin) return true;
      
      switch (view) {
        case 'oracao': return !!permissions.oracao;
        case 'evangelismo': return !!permissions.evangelismo;
        case 'discipulado': return !!permissions.discipulado;
        case 'assistencia': return !!permissions.assistencia;
        case 'adm': return false; // Only admins can access ADM
        default: return true;
      }
    };

    const currentView = hasPermission(activeView) ? activeView : 'painel';

    switch (currentView) {
      case 'painel':
        return <DashboardView />;
      case 'oracao':
        return <PrayerView />;
      case 'evangelismo':
        return <EvangelismView />;
      case 'discipulado':
        return <DiscipleshipView />;
      case 'assistencia':
        return <AssistanceView />;
      case 'adm':
        return <AdminView />;
      default:
        return <DashboardView />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-lowest flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <main className="min-h-screen pb-24 md:pb-32 pt-16 md:pt-24 px-3 md:px-8 lg:px-12 max-w-screen-2xl mx-auto">
      <TopAppBar onLogout={handleLogout} userProfile={profile} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      <BottomNavBar activeView={activeView} onViewChange={setActiveView} userProfile={profile} />

      <Modal 
        isOpen={isRecovering} 
        onClose={() => {}} // Block closing it until password is saved or logged out
        title="Redefinição de Senha"
      >
        <form onSubmit={handleRecoverySubmit} className="space-y-4">
          <p className="text-xs text-on-surface-variant font-bold mb-4">
            Você solicitou a recuperação de senha. Por favor, defina sua nova senha abaixo.
          </p>
          {recoveryError && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-[10px] md:text-xs rounded-xl font-bold">
              {recoveryError}
            </div>
          )}
          <Input 
            label="Nova Senha" 
            placeholder="Mínimo 6 caracteres" 
            type="password"
            value={recoveryPassword}
            onChange={(e) => setRecoveryPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input 
            label="Confirmar Nova Senha" 
            placeholder="Repita a nova senha" 
            type="password"
            value={recoveryConfirm}
            onChange={(e) => setRecoveryConfirm(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={recoveryLoading}
            className="w-full mt-4 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all shadow-lg"
          >
            {recoveryLoading ? 'Aguarde...' : 'Definir Nova Senha'}
          </button>
        </form>
      </Modal>
    </main>
  );
}
