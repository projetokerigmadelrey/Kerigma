'use client';

import React from 'react';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  HandHelping, 
  Megaphone, 
  BookOpen, 
  HeartHandshake, 
  ShieldCheck,
  Search,
  Bell,
  LogOut,
  User,
  KeyRound,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Modal, Input } from './Forms';

export type ViewType = 'painel' | 'oracao' | 'evangelismo' | 'discipulado' | 'assistencia' | 'adm';

interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  userProfile?: {
    email: string;
    role: string;
    permissions?: {
      evangelismo: boolean;
      discipulado: boolean;
      oracao: boolean;
      assistencia: boolean;
      adm: boolean;
    };
  } | null;
}

interface TopAppBarProps {
  onLogout?: () => void;
  userProfile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onLogout, userProfile }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email!,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Senha atual incorreta.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      await supabase.from('password_logs').insert({
        target_user_id: session.user.id,
        action_by: session.user.id,
        action_type: 'user_change'
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <header className="fixed top-0 w-full z-[40] glass-nav shadow-sm h-14 md:h-16 flex justify-between items-center px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer relative"
          >
            {userProfile?.avatar_url ? (
              <Image 
                alt="User Profile" 
                fill
                className="object-cover"
                src={userProfile.avatar_url}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs md:text-sm">
                {userProfile?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-12 md:top-14 left-0 w-48 bg-surface-lowest rounded-xl md:rounded-2xl shadow-xl border border-outline-variant/10 py-2 overflow-hidden z-50">
              <div className="px-4 py-2 border-b border-outline-variant/10">
                <p className="text-[10px] md:text-xs font-bold truncate">{userProfile?.full_name}</p>
                <p className="text-[9px] md:text-[10px] text-on-surface-variant/70 truncate">{userProfile?.email}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDropdown(false);
                  setShowPasswordModal(true);
                }}
                className="w-full text-left px-4 py-2 text-[10px] md:text-xs font-bold text-on-surface hover:bg-surface-low transition-colors flex items-center gap-2"
              >
                <KeyRound size={14} /> Alterar Senha
              </button>
              {onLogout && (
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-[10px] md:text-xs font-bold text-error hover:bg-error/5 transition-colors flex items-center gap-2"
                >
                  <LogOut size={14} /> Sair
                </button>
              )}
            </div>
          )}
        </div>

        <h1 className="font-headline font-extrabold text-primary italic text-lg md:text-xl tracking-tight">Kerigma</h1>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition-colors flex items-center gap-2">
           <div className="hidden sm:inline-flex px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold bg-primary/10 text-primary">ADM</div>
           <Search size={18} className="md:w-5 md:h-5" />
        </button>
        <button className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition-colors relative">
          <Bell size={18} className="md:w-5 md:h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-surface-lowest"></span>
        </button>
      </div>
    </header>

    <Modal 
      isOpen={showPasswordModal} 
      onClose={() => setShowPasswordModal(false)}
      title="Alterar Senha de Acesso"
    >
      <form onSubmit={handleChangePassword} className="space-y-4">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-[10px] md:text-xs rounded-xl font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-teal-50 border border-teal-500/20 text-teal-600 text-[10px] md:text-xs rounded-xl font-bold">
            Senha alterada com sucesso!
          </div>
        )}
        <div className="space-y-3">
          <Input 
            label="Senha Atual" 
            placeholder="Digite a senha atual" 
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input 
            label="Nova Senha" 
            placeholder="Mínimo 6 caracteres" 
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input 
            label="Confirmar Nova Senha" 
            placeholder="Repita a nova senha" 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading || success}
          className="w-full mt-4 py-3 md:py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? 'Aguarde...' : 'Atualizar Senha'}
        </button>
      </form>
    </Modal>
    </>
  );
};

export const BottomNavBar: React.FC<NavigationProps> = ({ activeView, onViewChange, userProfile }) => {
  const isSuperAdmin = userProfile?.email === 'henrique.diascarlos@hotmail.com';
  const isAdmin = userProfile?.role === 'admin';

  const navItems = [
    { id: 'painel', label: 'Painel', icon: LayoutDashboard, visible: true },
    { id: 'oracao', label: 'Oração', icon: HandHelping, visible: isSuperAdmin || isAdmin || !!userProfile?.permissions?.oracao },
    { id: 'evangelismo', label: 'Evang.', icon: Megaphone, visible: isSuperAdmin || isAdmin || !!userProfile?.permissions?.evangelismo },
    { id: 'discipulado', label: 'Discipulado', icon: BookOpen, visible: isSuperAdmin || isAdmin || !!userProfile?.permissions?.discipulado },
    { id: 'assistencia', label: 'Assist.', icon: HeartHandshake, visible: isSuperAdmin || isAdmin || !!userProfile?.permissions?.assistencia },
    { id: 'adm', label: 'ADM', icon: ShieldCheck, visible: isSuperAdmin || isAdmin },
  ] as const;

  const visibleItems = navItems.filter(item => item.visible);

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav border-t border-outline-variant/10 rounded-t-2xl md:rounded-t-3xl shadow-[0_-4px_24px_rgba(0,63,152,0.06)] pb-4 md:pb-6 pt-2 md:pt-3 px-1 md:px-2 flex justify-around items-center">
      {visibleItems.map((item) => {
        const isActive = activeView === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 md:py-1.5 rounded-xl transition-all duration-300",
              isActive 
                ? "text-primary scale-105" 
                : "text-on-surface-variant/60 hover:text-on-surface-variant"
            )}
          >
            <div className={cn(
              "p-1.5 md:p-2 rounded-xl transition-colors duration-300",
              isActive ? "bg-primary/10" : "bg-transparent"
            )}>
              <Icon size={isActive ? 20 : 18} className={cn("md:w-6 md:h-6", isActive && "fill-primary/10")} />
            </div>
            <span className={cn(
              "text-[8px] md:text-[10px] font-bold uppercase tracking-wider mt-0.5 md:mt-1",
              isActive ? "opacity-100" : "opacity-60"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
