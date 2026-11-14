import { NextRequest, NextResponse } from 'next/server';
import { getUserStatus, checkAndAwardDailyBonus } from '@/lib/xuService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id') || undefined;

    const status = await getUserStatus(userId);
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

    if (body.action === 'claim_daily_bonus' && userId) {
      const bonusResult = await checkAndAwardDailyBonus(userId);
      const status = await getUserStatus(userId);
      return NextResponse.json({ ...status, bonus_result: bonusResult });
    }

    const status = await getUserStatus(userId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('API /api/user/status POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi xử lý trạng thái người dùng' },
      { status: 500 }
    );
  }
}
