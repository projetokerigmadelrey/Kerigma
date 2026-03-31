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
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('painel');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
    </main>
  );
}
