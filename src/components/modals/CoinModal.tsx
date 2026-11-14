'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import {
  X,
  Coins,
  Sparkles,
  Check,
  Copy,
  Gift,
  QrCode,
  ShieldCheck,
  Zap,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export default function CoinModal() {
  const {
    isCoinModalOpen,
    setIsCoinModalOpen,
    xuBalance,
    isProActive,
    claimDailyBonus,
    refreshXuStatus,
    currentUser,
    setIsUpgradeOpen,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'packages' | 'topup' | 'qr'>('packages');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bonusState, setBonusState] = useState<{ loading: boolean; message: string | null }>({
    loading: false,
    message: null,
  });

  const [selectedPack, setSelectedPack] = useState<{
    id: string;
    name: string;
    price: string;
    xu: string;
    code: string;
  }>({
    id: 'pack_plus_month',
    name: 'Gói Plus Tháng (Nhà Vườn)',
    price: '50.000đ',
    xu: 'Được cấp 600 Xu / Không giới hạn',
    code: 'AGRI PLUS',
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsCoinModalOpen(false);
      }
    }
    if (isCoinModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      refreshXuStatus();
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCoinModalOpen, setIsCoinModalOpen]);

  if (!isCoinModalOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDailyClaim = async () => {
    setBonusState({ loading: true, message: null });
    try {
      const res = await claimDailyBonus();
      if (res.awarded) {
        setBonusState({ loading: false, message: `🎉 Chúc mừng! Bạn nhận được +${res.amount} Xu điểm danh hôm nay!` });
      } else {
        setBonusState({ loading: false, message: res.message || 'Bạn đã nhận thưởng điểm danh hôm nay rồi, hãy quay lại sau 24h nhé!' });
      }
    } catch {
      setBonusState({ loading: false, message: 'Lỗi kết nối điểm danh, vui lòng thử lại sau.' });
    }
  };

  const userIdentifier = currentUser?.email || currentUser?.name || 'KHACH_NHA_NONG';
  const transferContent = `${selectedPack.code} ${userIdentifier.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCoinModalOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-[#ffffff] dark:bg-[#1e1e1e] border border-[#e5e5e5] dark:border-[#333333] rounded-3xl shadow-2xl p-5 sm:p-7 text-[#0d0d0d] dark:text-[#ececec] relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsCoinModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#f0f0f0] dark:hover:bg-[#2c2c2c] text-[#737373] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Coins className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0d0d0d] dark:text-white leading-tight flex items-center gap-2">
              <span>Ví AgriXu & Nạp Tiền</span>
              {isProActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                  PRO PLUS
                </span>
              )}
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-0.5">
              Hệ thống quản lý Tokenomics & Gói cước AI AgriVision
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
          {/* Balance & Daily Bonus Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-500/15 dark:via-neutral-900 dark:to-neutral-900/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Số dư ví khả dụng
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-baseline gap-1.5">
                <span>{xuBalance}</span>
                <span className="text-sm font-semibold">Xu</span>
                {isProActive && (
                  <span className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] ml-1">
                    (Gói Plus không giới hạn)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-1">
                1 Xu = 1 lượt chẩn đoán AI & phân đoạn tổn thương mô lá HUD
              </div>
            </div>

            <button
              type="button"
              disabled={bonusState.loading}
              onClick={handleDailyClaim}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-60"
            >
              <Gift className="w-4 h-4" />
              <span>{bonusState.loading ? 'Đang nhận...' : 'Điểm danh +3 Xu'}</span>
            </button>
          </div>

          {bonusState.message && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{bonusState.message}</span>
            </div>
          )}

          {/* Segmented Navigation Tabs */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-[#f4f4f4] dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#2e2e2e] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-white dark:bg-[#252525] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              Gói Hội Viên
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('topup')}
              className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'topup'
                  ? 'bg-white dark:bg-[#252525] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              Nạp Xu Lẻ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'qr'
                  ? 'bg-white dark:bg-[#252525] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Quét QR</span>
            </button>
          </div>

          {/* TAB 1: Gói Hội Viên */}
          {activeTab === 'packages' && (
            <div className="space-y-3">
              {/* Plus Month Package (Bestseller) */}
              <div
                onClick={() => {
                  setSelectedPack({
                    id: 'pack_plus_month',
                    name: 'Gói Plus Tháng (Nhà Vườn)',
                    price: '50.000đ',
                    xu: 'Được cấp 600 Xu / Không giới hạn',
                    code: 'AGRI PLUS',
                  });
                  setActiveTab('qr');
                }}
                className="p-4 rounded-2xl border-2 border-amber-500/50 bg-[#ffffff] dark:bg-[#242424] hover:border-amber-500 transition-all cursor-pointer relative shadow-sm hover:shadow-md"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  <span>BÁN CHẠY NHẤT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                      AgriVision Plus (1 Tháng)
                    </div>
                    <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                      Chỉ bằng 1 ly cà phê sáng cho cả tháng
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">50.000đ</span>
                  <span className="text-xs text-[#737373] dark:text-[#8e8e8e]">/ tháng</span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#404040] dark:text-[#d4d4d4]">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                    <span>Không giới hạn số lượt hỏi đáp & chẩn đoán AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                    <span>Ưu tiên mô hình cao cấp Claude 4.6 & Gemini 3.8 Flash High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                    <span>Thị giác máy tính YOLO26 bóc tách đa giác sạch, không watermark</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                    <span className="font-semibold text-amber-600 dark:text-amber-400">Được cấp 600 Xu sử dụng hàng tháng</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#f0f0f0] dark:border-[#2e2e2e]">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Bấm để lấy mã QR thanh toán
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-xs"
                  >
                    Nâng cấp 50.000đ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Nạp Xu Lẻ */}
          {activeTab === 'topup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'pack_xu_30k',
                  name: '500 Xu (Gói Tháng)',
                  price: '30.000đ',
                  xu: '500 Xu',
                  badge: '60đ/lượt',
                  code: 'AGRI XU30',
                },
                {
                  id: 'pack_xu_50k',
                  name: '50 Xu (+5 Xu Thưởng)',
                  price: '50.000đ',
                  xu: '55 Xu',
                  badge: '+10% Xu',
                  code: 'AGRI XU50',
                },
                {
                  id: 'pack_xu_100k',
                  name: '100 Xu (+15 Xu Thưởng)',
                  price: '100.000đ',
                  xu: '115 Xu',
                  badge: '+15% Xu',
                  code: 'AGRI XU100',
                },
                {
                  id: 'pack_xu_200k',
                  name: '200 Xu (+40 Xu Thưởng)',
                  price: '200.000đ',
                  xu: '240 Xu',
                  badge: '+20% Xu',
                  code: 'AGRI XU200',
                },
              ].map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => {
                    setSelectedPack(pack);
                    setActiveTab('qr');
                  }}
                  className="p-3.5 rounded-2xl border border-[#e5e5e5] dark:border-[#333] bg-[#fafafa] dark:bg-[#212121] hover:border-amber-500/60 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0d0d0d] dark:text-white">
                      {pack.xu}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {pack.badge}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {pack.price}
                    </span>
                    <span className="text-[11px] text-neutral-500 hover:text-amber-600">
                      Nạp ngay →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Quét QR & Thanh Toán */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#fafafa] dark:bg-[#191919] border border-[#e5e5e5] dark:border-[#2e2e2e]">
                <div className="text-xs font-semibold text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wider mb-2">
                  Đơn hàng đang chọn
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5] dark:border-[#2b2b2b]">
                  <span className="font-bold text-sm text-[#0d0d0d] dark:text-white">
                    {selectedPack.name}
                  </span>
                  <span className="font-black text-base text-amber-600 dark:text-amber-400">
                    {selectedPack.price}
                  </span>
                </div>

                {/* QR Code display */}
                <div className="mt-3 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-40 h-40 shrink-0 rounded-2xl border-2 border-amber-500/40 p-1.5 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="/payment-qr.jpg"
                      alt="Mã QR thanh toán VietQR Phan Trọng Khang"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-xs w-full">
                    {/* Beneficiary */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#232323] border border-[#e5e5e5] dark:border-[#333]">
                      <span className="text-[#737373] dark:text-[#8e8e8e]">Chủ tài khoản:</span>
                      <span className="font-bold text-[#0d0d0d] dark:text-white">PHAN TRỌNG KHANG</span>
                    </div>

                    {/* Syntax / Transfer Content */}
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between text-[#737373] dark:text-[#a3a3a3] text-[11px] mb-1">
                        <span>Nội dung chuyển khoản chuẩn:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferContent, 'content')}
                          className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                        >
                          {copiedField === 'content' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Đã sao chép
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Sao chép
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs break-all bg-white/60 dark:bg-black/40 px-2 py-1 rounded-lg">
                        {transferContent}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Hệ thống tự động kích hoạt tài khoản hoặc cộng Xu sau 1-3 phút</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#e5e5e5] dark:border-[#2e2e2e] flex items-center justify-between text-xs shrink-0">
          <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
            Đề tài KHKT & SPHN 2026 • Sở GD&ĐT Vĩnh Long
          </div>
          <button
            type="button"
            onClick={() => setIsCoinModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
