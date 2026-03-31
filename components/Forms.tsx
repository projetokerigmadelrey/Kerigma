'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-surface-lowest rounded-3xl shadow-2xl z-[101] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-low/30">
              <h3 className="font-headline font-bold text-lg">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-surface-low rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="space-y-1.5 mb-4">
    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{label}</label>
    <input 
      {...props}
      className="w-full px-4 py-3 bg-surface-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm transition-all" 
    />
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
  <div className="space-y-1.5 mb-4">
    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{label}</label>
    <textarea 
      {...props}
      rows={4}
      className="w-full px-4 py-3 bg-surface-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm transition-all resize-none" 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }> = ({ label, options, ...props }) => (
  <div className="space-y-1.5 mb-4">
    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">{label}</label>
    <select 
      {...props}
      className="w-full px-4 py-3 bg-surface-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm transition-all appearance-none"
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="text-on-surface bg-surface-lowest">{opt.label}</option>)}
    </select>
  </div>
);
