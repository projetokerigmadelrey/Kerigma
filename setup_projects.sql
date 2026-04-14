-- Script para criação das tabelas de Projetos e Atividades
-- Execute este script no SQL Editor do seu painel Supabase

-- 1. Tabela de Projetos Ministeriais
CREATE TABLE IF NOT EXISTS public.ministry_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    pillar TEXT NOT NULL, -- 'oracao', 'evangelismo', 'discipulado', 'assistencia'
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    time TEXT,
    location TEXT,
    frequency TEXT DEFAULT 'unico', -- 'unico', 'semanal', 'mensal', 'continuo'
    goal_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ativo', -- 'ativo', 'em_andamento', 'finalizado'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Registro de Atividades/Eventos do Projeto
CREATE TABLE IF NOT EXISTS public.project_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.ministry_projects(id) ON DELETE CASCADE,
    activity_date DATE DEFAULT CURRENT_DATE,
    participants_count INTEGER DEFAULT 0,
    description TEXT,
    results TEXT,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.ministry_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- 4. Poltiticas de Segurança Básicas (Ajuste conforme sua necessidade de permissões)
-- Permitir leitura para todos autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.ministry_projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura para usuários autenticados" ON public.project_activities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserção para todos autenticados (ou refine por role)
CREATE POLICY "Permitir inserção para usuários autenticados" ON public.ministry_projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.project_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir update/delete para admins ou o próprio líder (exemplo simplificado)
CREATE POLICY "Permitir update para usuários autenticados" ON public.ministry_projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir delete para usuários autenticados" ON public.ministry_projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ministry_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activities;
