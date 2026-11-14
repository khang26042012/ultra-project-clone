import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, xu_balance, subscription_tier, tier_expires_at, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (q) {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching admin users:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const now = new Date();
    const formatted = (users || []).map((u) => ({
      ...u,
      is_plus:
        ['plus', 'pro', 'coop'].includes((u.subscription_tier || '').toLowerCase()) &&
        (!u.tier_expires_at || new Date(u.tier_expires_at) > now),
    }));

    return NextResponse.json({ success: true, count: formatted.length, users: formatted });
  } catch (err: any) {
    console.error('API /api/admin/users GET error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Lỗi server' }, { status: 500 });
  }
}
