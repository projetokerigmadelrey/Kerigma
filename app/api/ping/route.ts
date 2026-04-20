import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Usa a SERVICE_ROLE_KEY se existir (melhor para ignorar RLS), senão cai para a ANON_KEY
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing.');
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fazemos um select na tabela profiles apenas para despertar o banco
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      console.error('Error pinging database:', error);
      // Mesmo se der erro de RLS (Array vazio ou restrito), o banco foi pingado!
      // Mas registramos para debug caso não seja RLS.
    } else {
      console.log('Database pinged successfully.');
    }

    // Sempre retorna 200, pois a meta é pingar o BD e não vazar dados
    return NextResponse.json({ status: 'ok', message: 'Database is awake.' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in ping route:', err);
    return NextResponse.json({ status: 'error', message: 'Ping failed' }, { status: 500 });
  }
}
