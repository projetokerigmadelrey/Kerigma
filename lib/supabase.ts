import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktcrbptvmpschswqhril.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mzsIpqLBihESqTSmjBuaXQ_GWlwJzzi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
