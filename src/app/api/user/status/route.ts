import { NextRequest, NextResponse } from 'next/server';
import { getUserStatus, checkAndAwardDailyBonus } from '@/lib/xuService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id') || undefined;
    const email = searchParams.get('email') || undefined;

    const status = await getUserStatus(userId, email);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('API /api/user/status GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi kiểm tra trạng thái người dùng' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id || undefined;
    const email = body.email || undefined;

    if (body.action === 'claim_daily_bonus' && (userId || email)) {
      const status = await getUserStatus(userId, email);
      const bonusResult = status.user_id !== 'guest' ? await checkAndAwardDailyBonus(status.user_id) : { awarded: false, amount: 0 };
      const updatedStatus = await getUserStatus(status.user_id, email);
      return NextResponse.json({ ...updatedStatus, bonus_result: bonusResult });
    }

    const status = await getUserStatus(userId, email);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('API /api/user/status POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi xử lý trạng thái người dùng' },
      { status: 500 }
    );
  }
}
