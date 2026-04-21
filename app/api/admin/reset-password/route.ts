import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables for /api/admin/reset-password');
}

export async function POST(request: Request) {
  try {
    // 1. Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Verify the calling user
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 3. Verify the user is an admin
    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = user.email === 'henrique.diascarlos@hotmail.com';
    const isAdmin = !profileError && profile?.role === 'admin';

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // 4. Parse the request body
    const body = await request.json();
    const { targetUserId, newPassword } = body;

    if (!targetUserId || !newPassword) {
      return NextResponse.json({ error: 'Missing targetUserId or newPassword' }, { status: 400 });
    }

    // 5. Initialize the Admin Client
    if (!supabaseServiceKey) {
       return NextResponse.json({ error: 'Server misconfiguration: Service Role Key missing' }, { status: 500 });
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 6. Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 7. Log the action
    await adminClient.from('password_logs').insert({
      target_user_id: targetUserId,
      action_by: user.id,
      action_type: 'admin_reset'
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' }, { status: 200 });

  } catch (err: any) {
    console.error('Error in /api/admin/reset-password', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
