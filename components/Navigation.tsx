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
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <header className="fixed top-0 w-full z-50 glass-nav shadow-sm h-14 md:h-16 flex justify-between items-center px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant/20 relative">
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
        </div>
        <h1 className="font-headline font-extrabold text-primary italic text-lg md:text-xl tracking-tight">Kerigma</h1>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition-colors">
          <Search size={18} className="md:w-5 md:h-5" />
        </button>
        <button className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-low rounded-full transition-colors">
          <Bell size={18} className="md:w-5 md:h-5" />
        </button>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-1.5 md:p-2 text-error hover:bg-error/10 rounded-full transition-colors ml-1"
            title="Sair"
          >
            <LogOut size={18} className="md:w-5 md:h-5" />
          </button>
        )}
      </div>
    </header>
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
