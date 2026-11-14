'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, Check, Sparkles, Coins } from 'lucide-react';

export default function UpgradeModal() {
  const { isUpgradeOpen, setIsUpgradeOpen, setIsCoinModalOpen } = useChat();
  const [tab, setTab] = useState<'personal' | 'business'>('personal');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsUpgradeOpen(false);
      }
    }
    if (isUpgradeOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUpgradeOpen, setIsUpgradeOpen]);

  if (!isUpgradeOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsUpgradeOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-[#ffffff] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#383838] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#0d0d0d] dark:text-[#ececec] relative">
        {/* Close Button */}
        <button
          onClick={() => setIsUpgradeOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#0d0d0d] dark:text-white mb-4">
            Nâng Cấp Gói Dịch Vụ AgriVision
          </h2>

          {/* Segmented Tab */}
          <div className="inline-flex p-1 rounded-full bg-[#f4f4f4] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#333333]">
            <button
              onClick={() => setTab('personal')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                tab === 'personal'
                  ? 'bg-[#ffffff] text-[#0d0d0d] dark:bg-[#2f2f2f] dark:text-white shadow-xs'
                  : 'text-[#5d5d5d] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              Cá nhân / Nhà nông
            </button>
            <button
              onClick={() => setTab('business')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                tab === 'business'
                  ? 'bg-[#ffffff] text-[#0d0d0d] dark:bg-[#2f2f2f] dark:text-white shadow-xs'
                  : 'text-[#5d5d5d] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              Hợp tác xã / Doanh nghiệp
            </button>
          </div>
        </div>

        {/* Pricing Cards Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Free Plan */}
          <div className="p-5 rounded-2xl border border-[#e5e5e5] dark:border-[#383838] bg-[#f9f9f9] dark:bg-[#1a1a1a] flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">
                Gói Miễn Phí (Tân thủ)
              </div>
              <div className="text-xl font-bold text-[#0d0d0d] dark:text-white mb-2">
                0đ <span className="text-xs font-normal text-[#8e8e8e]">/ tháng</span>
              </div>
              <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mb-4">
                Tặng sẵn 20 Xu khởi nghiệp & nhận thưởng +3 Xu mỗi ngày khi điểm danh.
              </p>

              <div className="space-y-2 text-xs text-[#5d5d5d] dark:text-[#b4b4b4]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#0d0d0d] dark:text-white shrink-0" strokeWidth={1.5} />
                  <span>Mô hình Gemini 3.8 Flash High</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#0d0d0d] dark:text-white shrink-0" strokeWidth={1.5} />
                  <span>Chẩn đoán qua mô tả hình ảnh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#0d0d0d] dark:text-white shrink-0" strokeWidth={1.5} />
                  <span>Tra cứu 1.534+ cây trồng Đồng bằng Sông Cửu Long</span>
                </div>
              </div>
            </div>

            <button
              disabled
              className="mt-6 w-full py-2.5 rounded-xl bg-[#e5e5e5] dark:bg-[#2a2a2a] text-[#8e8e8e] text-xs font-semibold cursor-not-allowed border border-[#d4d4d4] dark:border-[#333333]"
            >
              Gói hiện tại
            </button>
          </div>

          {/* Card 2: Plus Plan */}
          <div className="p-5 rounded-2xl border-2 border-amber-500 bg-[#ffffff] dark:bg-[#1f1f1f] flex flex-col justify-between relative shadow-lg">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                PRO PLUS
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                <span>AgriVision Plus</span>
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                50.000đ <span className="text-xs font-normal text-[#8e8e8e]">/ tháng</span>
              </div>
              <p className="text-xs text-[#5d5d5d] dark:text-[#b4b4b4] mb-4">
                Không giới hạn lượt chẩn đoán AI, mở khóa Claude 4.6 & cấp 600 Xu hàng tháng.
              </p>

              <div className="space-y-2 text-xs text-[#0d0d0d] dark:text-[#ececec]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                  <span>Không giới hạn lượt hỏi đáp & phân tích bệnh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                  <span>Kích hoạt Claude 4.6 & Gemini 3.8 Flash High</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                  <span>Thị giác máy tính YOLO26 bóc tách đa giác sạch</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Được cấp 600 Xu sử dụng hàng tháng</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsUpgradeOpen(false);
                setIsCoinModalOpen(true);
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Nâng cấp ngay qua VietQR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
