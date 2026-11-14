import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// CORS headers to enable effortless curl & cross-origin video demo calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || undefined;
  const userId = searchParams.get('userId') || searchParams.get('user_id') || undefined;
  const tier = (searchParams.get('tier') || searchParams.get('plan') || 'plus').toLowerCase();
  const xuParam = searchParams.get('xu') || searchParams.get('coins');
  const xu = xuParam ? parseInt(xuParam, 10) : 600;
  const action = (searchParams.get('action') || (tier === 'free' ? 'downgrade' : 'upgrade')).toLowerCase();

  return handleUpgrade({ email, userId, tier, xu, action });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = body.email || undefined;
  const userId = body.userId || body.user_id || undefined;
  const tier = (body.tier || body.plan || 'plus').toLowerCase();
  const xu = typeof body.xu === 'number' ? body.xu : body.coins ? parseInt(body.coins, 10) : 600;
  const action = (body.action || (tier === 'free' ? 'downgrade' : 'upgrade')).toLowerCase();

  return handleUpgrade({ email, userId, tier, xu, action });
}

async function handleUpgrade({
  email,
  userId,
  tier,
  xu,
  action,
}: {
  email?: string;
  userId?: string;
  tier: string;
  xu: number;
  action: string;
}) {
  try {
    // 1. Locate target profile
    let query = supabaseAdmin.from('profiles').select('*');
    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      query = query.eq('email', email.trim().toLowerCase());
    } else {
      // Default to the main demo account or most recently active
      query = query.eq('email', 'trongkhabgphan@gmail.com');
    }

    const { data: profiles, error: findError } = await query.limit(1);

    let targetProfile = profiles && profiles.length > 0 ? profiles[0] : null;

    // If still not found, fallback to first available profile
    if (!targetProfile) {
      const { data: anyProfiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (anyProfiles && anyProfiles.length > 0) {
        targetProfile = anyProfiles[0];
      }
    }

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hồ sơ người dùng trong hệ thống' },
        { status: 404, headers: corsHeaders }
      );
    }

    const targetUserId = targetProfile.id;
    const currentBalance = targetProfile.xu_balance || 0;
    const now = new Date();

    let newTier = targetProfile.subscription_tier || 'free';
    let newBalance = currentBalance;
    let newExpiresAt = targetProfile.tier_expires_at;
    let actionMessage = '';

    if (action === 'downgrade' || tier === 'free') {
      newTier = 'free';
      newBalance = 20;
      newExpiresAt = null;
      actionMessage = `Đã hạ gói ${targetProfile.email} về Miễn phí (Số dư: 20 Xu)`;
    } else if (action === 'add_xu') {
      newBalance = currentBalance + xu;
      actionMessage = `Đã cộng +${xu} Xu cho ${targetProfile.email} (Tổng: ${newBalance} Xu)`;
    } else {
      // Default: Upgrade to Plus (+600 Xu)
      newTier = 'plus';
      newBalance = currentBalance + xu;
      // Valid for 30 days
      const expireDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      newExpiresAt = expireDate.toISOString();
      actionMessage = `Đã nâng cấp ${targetProfile.email} lên Gói AgriVision Plus (+${xu} Xu, Hạn dùng: 30 ngày)`;
    }

    // 2. Update profiles in Supabase
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: newTier,
        xu_balance: newBalance,
        tier_expires_at: newExpiresAt,
        updated_at: now.toISOString(),
      })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile in admin upgrade API:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. Log transaction
    try {
      await supabaseAdmin.from('xu_transactions').insert({
        user_id: targetUserId,
        amount: action === 'downgrade' ? -currentBalance + 20 : xu,
        balance_after: newBalance,
        type: action === 'downgrade' ? 'admin_reset' : 'admin_upgrade',
        description: actionMessage,
        reference_id: `admin_${Date.now()}`,
      });
    } catch (txErr) {
      console.warn('Failed to log admin tx (non-fatal):', txErr);
    }

    return NextResponse.json(
      {
        success: true,
        action,
        message: actionMessage,
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          name: updatedProfile.name,
          subscription_tier: updatedProfile.subscription_tier,
          xu_balance: updatedProfile.xu_balance,
          tier_expires_at: updatedProfile.tier_expires_at,
          is_pro_active:
            ['plus', 'pro', 'coop'].includes((updatedProfile.subscription_tier || '').toLowerCase()) &&
            (!updatedProfile.tier_expires_at || new Date(updatedProfile.tier_expires_at) > now),
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('handleUpgrade exception:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi xử lý nâng cấp' },
      { status: 500, headers: corsHeaders }
    );
  }
}
