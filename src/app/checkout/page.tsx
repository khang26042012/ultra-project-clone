'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChatProvider, useChat } from '@/context/ChatContext';
import {
  ArrowLeft,
  Coins,
  Sparkles,
  Check,
  Copy,
  QrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';

function CheckoutView() {
  const router = useRouter();
  const { currentUser, xuBalance, isProActive } = useChat();

  const [selectedPack, setSelectedPack] = useState<{
    id: string;
    name: string;
    price: string;
    priceNumber: number;
    description: string;
    code: string;
    badge?: string;
  }>({
    id: 'pack_pro_month',
    name: 'Gói Plus Tháng (Nhà Vườn)',
    price: '30.000đ',
    priceNumber: 30000,
    description: 'Không giới hạn số lượt hỏi đáp AI & phân đoạn tổn thương mô lá HUD',
    code: 'AGRI PLUS',
    badge: 'Phổ biến nhất',
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const userIdentifier = currentUser?.email || currentUser?.name || 'KHACH_NHA_NONG';
  const transferContent = `${selectedPack.code} ${userIdentifier.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

  const PACKAGES = [
    {
      id: 'pack_pro_month',
      name: 'Gói Plus Tháng (Nhà Vườn)',
      price: '30.000đ',
      priceNumber: 30000,
      description: 'Không giới hạn số lượt hỏi đáp & phân đoạn tổn thương mô lá HUD',
      code: 'AGRI PLUS',
      badge: 'Bán chạy nhất',
    },
    {
      id: 'pack_pro_year',
      name: 'Gói Năm Nhà Vườn Pro',
      price: '299.000đ',
      priceNumber: 299000,
      description: 'Trọn gói cả năm + 1.000 Xu thưởng dự phòng',
      code: 'AGRI YEAR',
      badge: 'Tiết kiệm 36%',
    },
    {
      id: 'pack_xu_30k',
      name: 'Nạp 500 Xu (Gói Tháng)',
      price: '30.000đ',
      priceNumber: 30000,
      description: 'Dành cho nhu cầu quét bệnh thực địa linh hoạt (60đ/lượt)',
      code: 'AGRI XU30',
    },
    {
      id: 'pack_xu_50k',
      name: 'Nạp 50 Xu (+5 Xu Thưởng)',
      price: '50.000đ',
      priceNumber: 50000,
      description: '55 lượt chẩn đoán AI chuẩn đoán bệnh cây trồng',
      code: 'AGRI XU50',
      badge: '+10% Xu',
    },
    {
      id: 'pack_xu_100k',
      name: 'Nạp 100 Xu (+15 Xu Thưởng)',
      price: '100.000đ',
      priceNumber: 100000,
      description: '115 lượt chẩn đoán chuyên sâu & bình phun ảo BVTV',
      code: 'AGRI XU100',
      badge: '+15% Xu',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#141414] text-[#0d0d0d] dark:text-[#ececec] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-full hover:bg-[#f0f0f0] dark:hover:bg-[#282828] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#0d0d0d] dark:text-white leading-tight">
              Thanh Toán Gói Dịch Vụ AgriVision
            </h1>
            <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
              Dự án Khởi nghiệp SPHN 2026 • Sở GD&ĐT Vĩnh Long
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>{isProActive ? 'PRO' : `${xuBalance} Xu`}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Package Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#e5e5e5] dark:border-[#2e2e2e] shadow-2xs">
              <h2 className="text-sm font-bold text-[#0d0d0d] dark:text-white uppercase tracking-wider mb-3">
                1. Chọn Gói Dịch Vụ / Nạp Xu
              </h2>

              <div className="space-y-2.5">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPack.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPack(pkg)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs'
                          : 'border-[#e5e5e5] dark:border-[#2e2e2e] hover:border-amber-500/40 bg-[#fafafa] dark:bg-[#191919]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#0d0d0d] dark:text-white">
                            {pkg.name}
                          </span>
                          {pkg.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <div className="font-black text-sm sm:text-base text-amber-600 dark:text-amber-400">
                          {pkg.price}
                        </div>
                        <div className="text-[10px] text-[#737373]">VietQR / MoMo</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Value Proposition Highlights */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#e5e5e5] dark:border-[#2e2e2e] shadow-2xs space-y-2 text-xs">
              <h3 className="font-bold text-[#0d0d0d] dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Quyền lợi vượt trội của Gói Plus 30.000đ/tháng</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#555] dark:text-[#ccc] pt-1">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Không giới hạn lượt hỏi đáp & chẩn đoán</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Kích hoạt Claude 4.6 & Gemini 3.8 Flash High</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Phân đoạn tổn thương HUD không watermark</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Mô phỏng tương thích thuốc WALES</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: VietQR Payment Box (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1e1e1e] border-2 border-amber-500/40 shadow-lg space-y-4 sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5] dark:border-[#2e2e2e]">
                <div>
                  <div className="text-xs text-[#737373] uppercase tracking-wider">Đang thanh toán</div>
                  <div className="font-bold text-sm text-[#0d0d0d] dark:text-white mt-0.5">
                    {selectedPack.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {selectedPack.price}
                  </div>
                </div>
              </div>

              {/* VietQR Image Display */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-2xl border-2 border-amber-500/30 p-2 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src="/payment-qr.jpg"
                    alt="Mã QR thanh toán VietQR Phan Trọng Khang"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-2 text-center">
                  Mở app Ngân hàng hoặc Ví MoMo / ZaloPay để quét mã QR
                </p>
              </div>

              {/* Account Details Box */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#252525] border border-[#e5e5e5] dark:border-[#333]">
                  <span className="text-[#737373] dark:text-[#8e8e8e]">Chủ tài khoản:</span>
                  <span className="font-bold text-[#0d0d0d] dark:text-white">PHAN TRỌNG KHANG</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between text-[#737373] dark:text-[#a3a3a3] text-[11px] mb-1">
                    <span>Nội dung chuyển khoản (bắt buộc):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, 'content')}
                      className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                    >
                      {copiedField === 'content' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs break-all bg-white/80 dark:bg-black/50 px-2 py-1.5 rounded-lg">
                    {transferContent}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Hệ thống tự động kích hoạt tài khoản hoặc cộng Xu sau 1-3 phút khi nhận tiền.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  alert('Đã gửi thông tin đơn hàng! Sau khi chuyển khoản, bạn có thể quay lại trang chủ để trải nghiệm.');
                  router.push('/');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Tôi đã chuyển khoản thành công
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ChatProvider>
      <CheckoutView />
    </ChatProvider>
  );
}
