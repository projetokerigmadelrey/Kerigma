'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export const LoginView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (viewMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        alert('Se este email estiver cadastrado, você receberá um link para redefinir sua senha.');
        setViewMode('login');
      } else if (viewMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Default name
            }
          }
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
        setViewMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4 overflow-hidden">
      {/* Immersive Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/ministry/1920/1080?blur=2" 
          alt="Background" 
          fill 
          className="object-cover opacity-40 grayscale"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary/20 via-black/60 to-black" />
      </div>

      {/* Animated Light Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] z-1" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 60, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[100px] z-1" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-6 md:p-10 relative z-10 overflow-y-auto max-h-[90vh] border border-white/20 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] scrollbar-hide"
      >
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6 md:mb-10">
          <motion.div 
            initial={{ rotate: -15, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-primary flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_30px_rgba(var(--color-primary),0.5)]"
          >
            <LogIn className="text-white w-7 h-7 md:w-10 md:h-10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-headline font-black text-white italic tracking-tighter mb-1 md:mb-2"
          >
            Kerigma
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 text-[8px] md:text-xs font-black uppercase tracking-[0.3em]"
          >
            {viewMode === 'login' ? 'Painel Ministerial' : viewMode === 'register' ? 'Nova Conta' : 'Recuperar Acesso'}
          </motion.p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-[10px] md:text-xs font-bold text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-1.5 md:space-y-2"
          >
            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 ml-1">
              E-mail
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-primary transition-colors">
                <Mail size={18} className="md:w-5 md:h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-11 md:pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium text-sm md:text-base"
              />
            </div>
          </motion.div>

          {viewMode !== 'forgot' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-1.5 md:space-y-2"
            >
              <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 ml-1">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-primary transition-colors">
                  <Lock size={18} className="md:w-5 md:h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-11 md:pl-12 pr-11 md:pr-12 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} className="md:w-5 md:h-5" /> : <Eye size={18} className="md:w-5 md:h-5" />}
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'login' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-end"
            >
              <button 
                type="button" 
                onClick={() => setViewMode('forgot')}
                className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary/80 transition-all"
              >
                Esqueceu a senha?
              </button>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(var(--color-primary), 0.4)" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-2 md:gap-3 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-[10px] md:text-xs"
          >
            {loading ? (
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {viewMode === 'login' && <><LogIn size={18} className="md:w-5 md:h-5" /> <span>Entrar</span></>}
                {viewMode === 'register' && <><UserPlus size={18} className="md:w-5 md:h-5" /> <span>Cadastrar</span></>}
                {viewMode === 'forgot' && <><KeyRound size={18} className="md:w-5 md:h-5" /> <span>Recuperar Senha</span></>}
              </>
            )}
          </motion.button>
        </form>

        {/* Toggle Login/Register/Forgot */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 md:mt-10 text-center flex flex-col gap-2"
        >
          {viewMode === 'forgot' ? (
            <button
              onClick={() => setViewMode('login')}
              className="font-black text-white/50 uppercase tracking-widest hover:text-white transition-all text-[10px] md:text-xs flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Voltar para o Login
            </button>
          ) : (
            <p className="text-[10px] md:text-xs text-white/40 font-bold">
              {viewMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => setViewMode(viewMode === 'login' ? 'register' : 'login')}
                className="ml-2 font-black text-primary uppercase tracking-widest hover:underline transition-all"
              >
                {viewMode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6 md:mt-10 pt-6 md:pt-8 border-t border-white/10 flex flex-col items-center gap-3 md:gap-4"
        >
          <span className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Acesso Rápido</span>
          <div className="flex justify-center gap-4 md:gap-6">
            <motion.button whileHover={{ y: -3 }} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <Image src="https://picsum.photos/seed/google/32/32" alt="Google" width={18} height={18} className="rounded-full opacity-60 md:w-5 md:h-5" referrerPolicy="no-referrer" />
            </motion.button>
            <motion.button whileHover={{ y: -3 }} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <Image src="https://picsum.photos/seed/apple/32/32" alt="Apple" width={18} height={18} className="rounded-full opacity-60 md:w-5 md:h-5" referrerPolicy="no-referrer" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
