import { supabaseAdmin } from './supabaseAdmin';

export interface UserStatusResult {
  success: boolean;
  user_id: string;
  name: string;
  subscription_tier: string;
  tier_display: string;
  xu_balance: number;
  is_pro_active: boolean;
  tier_expires_at: string | null;
  total_ai_chats: number;
  total_images_diagnosed: number;
  total_deposited: number;
  total_spent: number;
  can_chat: boolean;
  daily_bonus_awarded?: boolean;
  next_bonus_available_at?: string;
  error?: string;
}

/**
 * Kiểm tra thời gian nhận thưởng hàng ngày (+3 Xu sau mỗi 24h).
 * Nếu đủ điều kiện (chưa từng nhận hoặc lần nhận gần nhất >= 24h), tự động gọi RPC add_xu.
 */
export async function checkAndAwardDailyBonus(userId: string): Promise<{
  awarded: boolean;
  amount: number;
  newBalance?: number;
  nextAvailableAt?: string;
}> {
  if (!userId || userId === 'guest') {
    return { awarded: false, amount: 0 };
  }

  try {
    const { data: txList, error: txError } = await supabaseAdmin
      .from('xu_transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('type', 'bonus')
      .ilike('description', '%Thưởng hàng ngày%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (txError) {
      console.warn('Daily bonus tx query warning:', txError);
    }

    let shouldAward = false;
    let nextAvailable: Date = new Date();

    if (!txList || txList.length === 0) {
      shouldAward = true;
    } else {
      const lastBonusTime = new Date(txList[0].created_at).getTime();
      const diffMs = Date.now() - lastBonusTime;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      if (diffMs >= twentyFourHoursMs) {
        shouldAward = true;
      } else {
        nextAvailable = new Date(lastBonusTime + twentyFourHoursMs);
      }
    }

    if (shouldAward) {
      const { data: addResult, error: addErr } = await supabaseAdmin.rpc('add_xu', {
        p_user_id: userId,
        p_amount: 3,
        p_description: 'Thưởng hàng ngày (+3 Xu)',
        p_reference_id: `daily_${new Date().toISOString().slice(0, 10)}_${Date.now()}`,
        p_type: 'bonus',
        p_metadata: { rewarded_at: new Date().toISOString() },
      });

      if (addErr) {
        console.error('Failed to award daily bonus via RPC add_xu:', addErr);
        return { awarded: false, amount: 0 };
      }

      return {
        awarded: true,
        amount: 3,
        newBalance: addResult?.new_balance,
        nextAvailableAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    return {
      awarded: false,
      amount: 0,
      nextAvailableAt: nextAvailable.toISOString(),
    };
  } catch (err) {
    console.error('Error in checkAndAwardDailyBonus:', err);
    return { awarded: false, amount: 0 };
  }
}

/**
 * Lấy toàn bộ trạng thái tài khoản người dùng:
 * - Gói hiện tại (subscription_tier)
 * - Số Xu còn lại (xu_balance)
 * - Tổng số lần đã chat/gọi AI
 * - Tổng số ảnh đã khoanh/chẩn đoán
 */
export async function getUserStatus(userId?: string): Promise<UserStatusResult> {
  if (!userId || userId === 'guest') {
    return {
      success: true,
      user_id: 'guest',
      name: 'Khách nhà nông',
      subscription_tier: 'free',
      tier_display: 'Gói Miễn phí (Khách)',
      xu_balance: 20,
      is_pro_active: false,
      tier_expires_at: null,
      total_ai_chats: 0,
      total_images_diagnosed: 0,
      total_deposited: 0,
      total_spent: 0,
      can_chat: true,
    };
  }

  // 1. Kiểm tra và cộng thưởng 3 Xu nếu đã qua 24h
  const dailyBonus = await checkAndAwardDailyBonus(userId);

  // 2. Lấy thông tin số dư Xu & Gói từ Supabase RPC
  let xuBalance = 20;
  let subscriptionTier = 'free';
  let isProActive = false;
  let tierExpiresAt: string | null = null;
  let totalDeposited = 0;
  let totalSpent = 0;

  try {
    const { data: summary, error: summaryErr } = await supabaseAdmin.rpc(
      'get_user_xu_summary',
      { p_user_id: userId }
    );

    if (summary && summary.success) {
      xuBalance = summary.xu_balance ?? 20;
      subscriptionTier = summary.subscription_tier || 'free';
      tierExpiresAt = summary.tier_expires_at || null;
      totalDeposited = summary.total_deposited || 0;
      totalSpent = summary.total_spent || 0;
      isProActive =
        ['pro', 'coop', 'plus'].includes(subscriptionTier.toLowerCase()) &&
        (!tierExpiresAt || new Date(tierExpiresAt) > new Date());
    } else {
      if (summaryErr) {
        console.warn('RPC get_user_xu_summary fallback to profiles table:', summaryErr);
      }
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        xuBalance = profile.xu_balance ?? 20;
        subscriptionTier = profile.subscription_tier || 'free';
        tierExpiresAt = profile.tier_expires_at || null;
        totalDeposited = profile.total_xu_deposited || 0;
        totalSpent = profile.total_xu_spent || 0;
        isProActive =
          ['pro', 'coop', 'plus'].includes(subscriptionTier.toLowerCase()) &&
          (!tierExpiresAt || new Date(tierExpiresAt) > new Date());
      }
    }
  } catch (err) {
    console.error('Error fetching user xu summary:', err);
  }

  // 3. Thống kê tổng số lần chat và ảnh đã khoanh/chẩn đoán
  let totalAiChats = 0;
  let totalImagesDiagnosed = 0;
  let userName = 'Bà con nông dân';

  try {
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .maybeSingle();

    if (profileData?.name) {
      userName = profileData.name;
    }

    const { data: convs } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId);

    if (convs && convs.length > 0) {
      const convIds = convs.map((c) => c.id);

      const { count: chatCount } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('role', 'assistant');

      totalAiChats = chatCount || 0;

      const { count: imgCount } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .not('image_url', 'is', null);

      totalImagesDiagnosed = imgCount || 0;
    }
  } catch (statErr) {
    console.warn('Error fetching conversation stats for user:', statErr);
  }

  const tierDisplayMap: Record<string, string> = {
    free: 'Gói Miễn phí (Tân thủ)',
    plus: 'Gói AgriVision Plus',
    pro: 'Gói AgriVision Plus',
    coop: 'Gói Hợp Tác Xã (B2B)',
  };

  const tierDisplay =
    tierDisplayMap[subscriptionTier.toLowerCase()] ||
    `Gói ${subscriptionTier.toUpperCase()}`;

  return {
    success: true,
    user_id: userId,
    name: userName,
    subscription_tier: subscriptionTier,
    tier_display: tierDisplay,
    xu_balance: xuBalance,
    is_pro_active: isProActive,
    tier_expires_at: tierExpiresAt,
    total_ai_chats: totalAiChats,
    total_images_diagnosed: totalImagesDiagnosed,
    total_deposited: totalDeposited,
    total_spent: totalSpent,
    can_chat: isProActive || xuBalance > 0,
    daily_bonus_awarded: dailyBonus.awarded,
    next_bonus_available_at: dailyBonus.nextAvailableAt,
  };
}

/**
 * Trừ 1 Xu khi phản hồi AI hoàn thành thành công.
 * Nếu tài khoản Pro / Hợp Tác Xã đang còn hạn, RPC deduct_xu sẽ miễn phí (0 Xu).
 */
export async function deductChatXu(
  userId?: string,
  referenceId?: string
): Promise<{
  success: boolean;
  new_balance?: number;
  message?: string;
  is_vip?: boolean;
}> {
  if (!userId || userId === 'guest') {
    return { success: true, message: 'Khách trải nghiệm' };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('deduct_xu', {
      p_user_id: userId,
      p_amount: 1,
      p_description: 'Trừ 1 Xu phản hồi tư vấn AI AgriVision',
      p_reference_id: referenceId || `chat_${Date.now()}`,
      p_metadata: { type: 'chat_completion', timestamp: new Date().toISOString() },
    });

    if (error) {
      console.error('deduct_xu RPC error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: data?.success ?? true,
      new_balance: data?.new_balance,
      message: data?.message,
      is_vip: data?.is_vip,
    };
  } catch (err) {
    console.error('Error in deductChatXu:', err);
    return { success: false, message: (err as Error)?.message || 'Lỗi trừ xu' };
  }
}
