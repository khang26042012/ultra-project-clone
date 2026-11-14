'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProvider, useChat } from '@/context/ChatContext';
import {
  ArrowLeft,
  Pencil,
  Sparkles,
  Cpu,
  BookOpen,
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Palette,
  Type,
  Globe,
  Radio,
  Download,
  Trash2,
  Info,
  UserCheck,
  Database,
  Search,
  ChevronRight,
  Check,
  X,
  FlaskConical,
  Coins,
} from 'lucide-react';
import TankMixModal from '@/components/tankMix/TankMixModal';
import AuthModal from '@/components/modals/AuthModal';
import CoinModal from '@/components/modals/CoinModal';
import { ThemeMode, FontSizeOption } from '@/types/chat';

function SettingsView() {
  const router = useRouter();
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    selectedModel,
    setSelectedModel,
    isWebSearchEnabled,
    setIsWebSearchEnabled,
    isAutoScrollEnabled,
    setIsAutoScrollEnabled,
    clearChatHistory,
    exportBackupJson,
    logout,
    currentUser,
    updateAvatar,
    userProfile,
    xuBalance,
    isProActive,
    setIsCoinModalOpen,
    setIsAuthModalOpen,
  } = useChat();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingAvatar(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 160;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 160, 160);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          await updateAvatar(compressedBase64);
          setIsProcessingAvatar(false);
          setActiveModal(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        img.onerror = () => {
          console.error('Không thể phân tích định dạng ảnh đại diện');
          setIsProcessingAvatar(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        console.error('Lỗi đọc tệp ảnh');
        setIsProcessingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Lỗi nén và lưu avatar:', err);
      setIsProcessingAvatar(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [cropStats, setCropStats] = useState({ totalCrops: 1534, totalDiseases: 6983 });

  useEffect(() => {
    fetch('/api/crops?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.total_in_db) {
          setCropStats({
            totalCrops: data.total_in_db,
            totalDiseases: data.total_diseases_in_db || 6983,
          });
        }
      })
      .catch(() => {});
  }, []);

  const [activeModal, setActiveModal] = useState<
    'personalize' | 'model' | 'theme' | 'fontSize' | 'password' | 'clearHistory' | 'avatar' | null
  >(null);
  const [isTankMixOpen, setIsTankMixOpen] = useState(false);

  // Personalization settings: start with consistent SSR default, populate in useEffect to prevent Hydration Mismatch
  const [personalRole, setPersonalRole] = useState('Bác / Cô chú nhà vườn');
  const [farmRegion, setFarmRegion] = useState('Vĩnh Long / Đồng bằng Sông Cửu Long');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('agrivision_pref_role');
      if (savedRole) setPersonalRole(savedRole);
      const savedRegion = localStorage.getItem('agrivision_pref_region');
      if (savedRegion) setFarmRegion(savedRegion);
    }
  }, []);

  useEffect(() => {
    if (!activeModal) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSavePersonalization = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrivision_pref_role', personalRole);
      localStorage.setItem('agrivision_pref_region', farmRegion);
    }
    setActiveModal(null);
  };

  const handleSavePassword = () => {
    if (newPassword.trim().length >= 6) {
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setNewPassword('');
        setActiveModal(null);
      }, 1200);
    }
  };

  const userName = currentUser ? currentUser.name : 'Khách nhà nông';
  const userEmail = currentUser ? currentUser.email : 'Chưa đăng nhập';
  const userInitials = currentUser ? userProfile?.initials : 'AV';

  const themeLabel =
    theme === 'light' ? 'Chế độ Sáng' : theme === 'dark' ? 'Chế độ Tối' : 'Theo Hệ thống';
  const fontLabel =
    fontSize === 'small' ? 'Nhỏ (13px)' : fontSize === 'large' ? 'Lớn (17px)' : 'Vừa (15px)';
  const modelLabel =
    selectedModel === 'ag/claude-opus-4-6-thinking'
      ? 'Claude 4.6 Opus Thinking'
      : selectedModel === 'ag/claude-sonnet-4-6'
      ? 'Claude 4.6 Sonnet'
      : selectedModel === 'ag/gemini-3.8-flash'
      ? 'Gemini 3.8 Flash (Nhanh)'
      : 'Gemini 3.8 Flash High (Lâm sàng)';

  const q = searchQuery.toLowerCase().trim();

  const matchesSearch = (text: string) => {
    if (!q) return true;
    return text.toLowerCase().includes(q);
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-[#ffffff] dark:bg-[#141414] text-[#0d0d0d] dark:text-[#ececec] flex flex-col select-none">
      {/* 1. Top Bar */}
      <header className="shrink-0 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#e5e5e5]/80 dark:border-[#262626] bg-[#ffffff]/90 dark:bg-[#141414]/90 backdrop-blur-md z-20">
        <button
          type="button"
          onClick={() => router.push('/')}
          title="Quay lại trang chủ"
          className="w-10 h-10 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] dark:bg-[#212121] dark:hover:bg-[#2c2c2c] border border-black/5 dark:border-white/10 flex items-center justify-center text-[#0d0d0d] dark:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <h1 className="text-base font-semibold tracking-tight text-[#0d0d0d] dark:text-white">
          Cài đặt
        </h1>

        <div className="w-10" />
      </header>

      {/* 2. Scrollable Settings Body */}
      <main className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-4 sm:px-6 py-6 pb-28">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Profile Showcase (Center Top) */}
          <div className="flex flex-col items-center text-center space-y-2.5 pb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Bấm để đổi ảnh đại diện"
                className="w-20 h-20 rounded-full bg-[#f0f0f0] dark:bg-[#252525] border-2 border-white dark:border-[#333] shadow-md flex items-center justify-center text-2xl font-bold text-[#0d0d0d] dark:text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0d0d0d] text-white dark:bg-white dark:text-black border-2 border-white dark:border-[#141414] shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                {userName}
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3] font-normal mt-0.5">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Group 1: AgriVision của tôi */}
          {(matchesSearch('agrivision của tôi') ||
            matchesSearch('cá nhân hóa') ||
            matchesSearch('mô hình ai') ||
            matchesSearch('kho tri thức') ||
            matchesSearch('toàn thư')) && (
            <div className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                AgriVision của tôi
              </div>
              <div className="rounded-2xl bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] divide-y divide-[#e5e5e5] dark:divide-[#262626] overflow-hidden shadow-2xs">
                {matchesSearch('cá nhân hóa') && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('personalize')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Cá nhân hóa
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          Xưng hô: {personalRole}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {matchesSearch('mô hình ai') && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('model')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Mô hình AI chẩn đoán
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          {modelLabel}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {(matchesSearch('kho tri thức') || matchesSearch('toàn thư')) && (
                  <button
                    type="button"
                    onClick={() => router.push('/crops')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Kho tri thức bệnh học
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          {cropStats.totalCrops.toLocaleString('vi-VN')} loài cây trồng & {cropStats.totalDiseases.toLocaleString('vi-VN')} phác đồ bệnh học chuyên sâu
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {/* Tạm ẩn Bình phun ảo BVTV */}
                {false && (
                  <button
                    type="button"
                    onClick={() => setIsTankMixOpen(true)}
                    className="w-full flex items-center justify-between p-3.5"
                  >
                    <span>Bình phun ảo BVTV</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Group: Ví AgriXu & Gói Dịch Vụ */}
          {(matchesSearch('ví') ||
            matchesSearch('xu') ||
            matchesSearch('coin') ||
            matchesSearch('gói') ||
            matchesSearch('nạp tiền') ||
            matchesSearch('plus')) && (
            <div className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Ví AgriXu & Gói Dịch Vụ
              </div>
              <div className="rounded-2xl bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] divide-y divide-[#e5e5e5] dark:divide-[#262626] overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsCoinModalOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Coins className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0d0d0d] dark:text-white flex items-center gap-2">
                        <span>Số dư ví AgriXu</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          {isProActive ? 'PRO' : `${xuBalance} Xu`}
                        </span>
                      </div>
                      <div className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                        1 Xu / lượt chẩn đoán • Nhận +3 Xu mỗi ngày khi điểm danh
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Nạp thêm →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCoinModalOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0d0d0d] dark:text-white flex items-center gap-2">
                        <span>Gói dịch vụ: {isProActive ? 'AgriVision Plus' : 'Gói Miễn Phí'}</span>
                      </div>
                      <div className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                        {isProActive
                          ? 'Đang kích hoạt gói không giới hạn'
                          : 'Nâng cấp chỉ 30.000đ/tháng mở khóa toàn diện AI'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}

          {/* Group 2: Tài khoản */}
          {(matchesSearch('tài khoản') ||
            matchesSearch('không gian') ||
            matchesSearch('email') ||
            matchesSearch('đổi mật khẩu') ||
            matchesSearch('đăng xuất')) && (
            <div className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Tài khoản
              </div>
              <div className="rounded-2xl bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] divide-y divide-[#e5e5e5] dark:divide-[#262626] overflow-hidden shadow-2xs">
                {matchesSearch('không gian') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#0d0d0d] dark:text-white flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Không gian làm việc
                      </span>
                    </div>
                    <span className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                      Cá nhân / Nhà nông
                    </span>
                  </div>
                )}

                {matchesSearch('email') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#0d0d0d] dark:text-white flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Email
                      </span>
                    </div>
                    <span className="text-xs text-[#737373] dark:text-[#8e8e8e] truncate max-w-[180px]">
                      {userEmail}
                    </span>
                  </div>
                )}

                {matchesSearch('đổi mật khẩu') && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('password')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#0d0d0d] dark:text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Đổi mật khẩu / Bảo mật
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {matchesSearch('đăng xuất') && (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-left text-red-600 dark:text-red-400 font-medium text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span>Đăng xuất tài khoản</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Group 3: Hệ thống & Dữ liệu */}
          {(matchesSearch('hệ thống') ||
            matchesSearch('giao diện') ||
            matchesSearch('theme') ||
            matchesSearch('cỡ chữ') ||
            matchesSearch('tra cứu web') ||
            matchesSearch('bám đáy') ||
            matchesSearch('xuất dữ liệu') ||
            matchesSearch('xóa toàn bộ')) && (
            <div className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Hệ thống & Dữ liệu
              </div>
              <div className="rounded-2xl bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] divide-y divide-[#e5e5e5] dark:divide-[#262626] overflow-hidden shadow-2xs">
                {(matchesSearch('giao diện') || matchesSearch('theme')) && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('theme')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Palette className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Giao diện hiển thị
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          {themeLabel}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {matchesSearch('cỡ chữ') && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('fontSize')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Type className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Cỡ chữ văn bản
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          {fontLabel}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {matchesSearch('tra cứu web') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Tự động tra cứu Web
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          Cập nhật giá thuốc & công văn dịch bệnh
                        </div>
                      </div>
                    </div>
                    {/* iOS style Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                        isWebSearchEnabled ? 'bg-emerald-600' : 'bg-[#d1d1d1] dark:bg-[#444]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          isWebSearchEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {matchesSearch('bám đáy') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Tự động bám đáy khi chat
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          Cuộn mượt mà theo luồng chữ chạy
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                        isAutoScrollEnabled ? 'bg-emerald-600' : 'bg-[#d1d1d1] dark:bg-[#444]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          isAutoScrollEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {matchesSearch('xuất dữ liệu') && (
                  <button
                    type="button"
                    onClick={exportBackupJson}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-[#f2f2f2] dark:hover:bg-[#222222] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                          Xuất dữ liệu hội thoại JSON
                        </div>
                        <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                          Tải về sao lưu các ca bệnh đã chẩn đoán
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0" strokeWidth={1.5} />
                  </button>
                )}

                {matchesSearch('xóa toàn bộ') && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('clearHistory')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-left text-red-600 dark:text-red-400 font-medium text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span>Xóa toàn bộ lịch sử trò chuyện</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Group 4: Thông tin & Bản quyền */}
          {(matchesSearch('thông tin') ||
            matchesSearch('bản quyền') ||
            matchesSearch('phiên bản') ||
            matchesSearch('tác giả') ||
            matchesSearch('cơ sở dữ liệu') ||
            matchesSearch('vietgap')) && (
            <div className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Thông tin & Bản quyền
              </div>
              <div className="rounded-2xl bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] divide-y divide-[#e5e5e5] dark:divide-[#262626] overflow-hidden shadow-2xs">
                {matchesSearch('phiên bản') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#0d0d0d] dark:text-white flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Phiên bản
                      </span>
                    </div>
                    <span className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                      AgriVision v1.0
                    </span>
                  </div>
                )}

                {matchesSearch('tác giả') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#0d0d0d] dark:text-white flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Tác giả phát triển
                      </span>
                    </div>
                    <span className="text-xs text-[#737373] dark:text-[#8e8e8e] text-right">
                      Tác giả đề tài AgriVision (Học sinh trung học, Đơn vị nghiên cứu, xã Ba Tri, Vĩnh Long)
                    </span>
                  </div>
                )}

                {matchesSearch('cơ sở dữ liệu') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[#0d0d0d] dark:text-white flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Cơ sở dữ liệu đám mây
                      </span>
                    </div>
                    <span className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                      Supabase PostgreSQL (Singapore)
                    </span>
                  </div>
                )}

                {matchesSearch('vietgap') && (
                  <div className="flex items-center justify-between p-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-[#0d0d0d] dark:text-white">
                        Tiêu chuẩn can thiệp
                      </span>
                    </div>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      An toàn sinh học VietGAP
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. Bottom Rounded Capsule Search Bar */}
      <footer className="fixed bottom-0 inset-x-0 p-3 bg-gradient-to-t from-[#ffffff] via-[#ffffff]/95 to-transparent dark:from-[#141414] dark:via-[#141414]/95 z-20">
        <div className="max-w-xl mx-auto relative">
          <Search
            className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e8e]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm trong cài đặt..."
            className="w-full pl-11 pr-10 py-2.5 rounded-full bg-[#f4f4f4] dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] text-xs text-[#0d0d0d] dark:text-white placeholder-[#8e8e8e] focus:outline-hidden focus:border-[#0d0d0d] dark:focus:border-white transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </footer>

      {/* Virtual Spray Tank Simulator Modal */}
      <TankMixModal isOpen={isTankMixOpen} onClose={() => setIsTankMixOpen(false)} />
      <AuthModal />

      {/* SUB-MODALS */}
      {/* 1. Modal Cá nhân hóa */}
      {activeModal === 'personalize' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0d0d0d] dark:text-white">
                Cá nhân hóa chẩn đoán
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-[#eaeaea] dark:hover:bg-[#333] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-[#5d5d5d] dark:text-[#a3a3a3]">
                  Cách xưng hô ưa thích
                </label>
                <input
                  type="text"
                  value={personalRole}
                  onChange={(e) => setPersonalRole(e.target.value)}
                  placeholder="Ví dụ: Bác / Cô chú / Anh chị..."
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f7f7f7] dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] outline-none text-xs text-[#0d0d0d] dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-[#5d5d5d] dark:text-[#a3a3a3]">
                  Vùng sinh thái / Tỉnh thành
                </label>
                <input
                  type="text"
                  value={farmRegion}
                  onChange={(e) => setFarmRegion(e.target.value)}
                  placeholder="Ví dụ: Vĩnh Long, Đắk Lắk, Sơn La..."
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#f7f7f7] dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] outline-none text-xs text-[#0d0d0d] dark:text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSavePersonalization}
              className="w-full py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-[#262626] text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}

      {/* 2. Modal Chọn Model AI */}
      {activeModal === 'model' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0d0d0d] dark:text-white">
                Chọn mô hình AI
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-[#eaeaea] dark:hover:bg-[#333] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedModel('ag/gemini-3.8-flash-high');
                  setActiveModal(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedModel === 'ag/gemini-3.8-flash-high'
                    ? 'border-[#0d0d0d] dark:border-white bg-[#f7f7f7] dark:bg-[#2a2a2a]'
                    : 'border-[#e5e5e5] dark:border-[#333]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                    Gemini 3.8 Flash High
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                    Suy luận lâm sàng sâu, bóc tách ca bệnh kép (Khuyên dùng)
                  </div>
                </div>
                {selectedModel === 'ag/gemini-3.8-flash-high' && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedModel('ag/gemini-3.8-flash');
                  setActiveModal(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedModel === 'ag/gemini-3.8-flash'
                    ? 'border-[#0d0d0d] dark:border-white bg-[#f7f7f7] dark:bg-[#2a2a2a]'
                    : 'border-[#e5e5e5] dark:border-[#333]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                    Gemini 3.8 Flash
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                    Phản hồi siêu tốc cho câu hỏi thường gặp
                  </div>
                </div>
                {selectedModel === 'ag/gemini-3.8-flash' && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedModel('ag/claude-sonnet-4-6');
                  setActiveModal(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedModel === 'ag/claude-sonnet-4-6'
                    ? 'border-[#0d0d0d] dark:border-white bg-[#f7f7f7] dark:bg-[#2a2a2a]'
                    : 'border-[#e5e5e5] dark:border-[#333]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-[#0d0d0d] dark:text-white flex items-center gap-2">
                    <span>Claude 4.6 Sonnet</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      PRO
                    </span>
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                    Lập luận sắc bén, chẩn đoán bệnh học lâm sàng đa phương thức
                  </div>
                </div>
                {selectedModel === 'ag/claude-sonnet-4-6' && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedModel('ag/claude-opus-4-6-thinking');
                  setActiveModal(null);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedModel === 'ag/claude-opus-4-6-thinking'
                    ? 'border-[#0d0d0d] dark:border-white bg-[#f7f7f7] dark:bg-[#2a2a2a]'
                    : 'border-[#e5e5e5] dark:border-[#333]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-[#0d0d0d] dark:text-white flex items-center gap-2">
                    <span>Claude 4.6 Opus Thinking</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300">
                      Deep Think
                    </span>
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                    Siêu suy luận sâu với cơ chế chuỗi tư duy mở rộng cho ca bệnh phức tạp
                  </div>
                </div>
                {selectedModel === 'ag/claude-opus-4-6-thinking' && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Chọn Theme */}
      {activeModal === 'theme' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0d0d0d] dark:text-white">Giao diện</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-[#eaeaea] dark:hover:bg-[#333] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {(
                [
                  { id: 'light', label: 'Chế độ Sáng' },
                  { id: 'dark', label: 'Chế độ Tối' },
                  { id: 'system', label: 'Theo Hệ thống' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id as ThemeMode);
                    setActiveModal(null);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    theme === t.id
                      ? 'border-[#0d0d0d] dark:border-white bg-[#f7f7f7] dark:bg-[#282828] font-semibold text-[#0d0d0d] dark:text-white'
                      : 'border-transparent hover:bg-[#f0f0f0] dark:hover:bg-[#252525] text-[#555] dark:text-[#aaa]'
                  }`}
                >
                  <span>{t.label}</span>
                  {theme === t.id && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Chọn Cỡ chữ */}
      {activeModal === 'fontSize' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0d0d0d] dark:text-white">Cỡ chữ</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-[#eaeaea] dark:hover:bg-[#333] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {(
                [
                  { id: 'small', label: 'Nhỏ (13px)' },
                  { id: 'medium', label: 'Vừa (15px) — Mặc định' },
                  { id: 'large', label: 'Lớn (17px)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFontSize(f.id as FontSizeOption);
                    setActiveModal(null);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    fontSize === f.id
                      ? 'border-[#0d0d0d] dark:border-white bg-[#f7f7f7] dark:bg-[#282828] font-semibold text-[#0d0d0d] dark:text-white'
                      : 'border-transparent hover:bg-[#f0f0f0] dark:hover:bg-[#252525] text-[#555] dark:text-[#aaa]'
                  }`}
                >
                  <span>{f.label}</span>
                  {fontSize === f.id && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Đổi Mật khẩu */}
      {activeModal === 'password' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0d0d0d] dark:text-white">
                Đổi mật khẩu
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-[#eaeaea] dark:hover:bg-[#333] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                className="w-full px-3 py-2 rounded-xl bg-[#f7f7f7] dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] outline-none text-xs text-[#0d0d0d] dark:text-white"
              />
              {passwordSuccess && (
                <div className="text-xs text-emerald-600 font-medium">
                  Đã cập nhật mật khẩu thành công!
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSavePassword}
              disabled={newPassword.trim().length < 6}
              className="w-full py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-[#262626] disabled:opacity-50 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              Cập nhật
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal Xác nhận xóa toàn bộ lịch sử */}
      {activeModal === 'clearHistory' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400">
                Xác nhận xóa lịch sử?
              </h3>
              <p className="text-xs text-[#555] dark:text-[#aaa] leading-relaxed">
                Hành động này sẽ xóa vĩnh viễn toàn bộ các phiên chẩn đoán bệnh cây trên thiết bị và
                đám mây. Không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 rounded-xl bg-[#f0f0f0] dark:bg-[#2c2c2c] text-[#333] dark:text-[#ccc] text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  clearChatHistory();
                  setActiveModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Đổi Avatar */}
      {activeModal === 'avatar' && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#202020] border border-[#e5e5e5] dark:border-[#333] rounded-3xl p-5 space-y-4 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0d0d0d] dark:text-white">
                Ảnh đại diện
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-[#eaeaea] dark:hover:bg-[#333] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <div className="w-24 h-24 rounded-full bg-[#f0f0f0] dark:bg-[#252525] border-2 border-[#e5e5e5] dark:border-[#333] overflow-hidden flex items-center justify-center text-3xl font-bold shadow-inner">
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
            </div>

            <p className="text-xs text-[#5d5d5d] dark:text-[#aaa] leading-relaxed">
              Chọn ảnh từ thiết bị hoặc camera. Ảnh sẽ được tự động nén về kích thước chuẩn 160×160px và đồng bộ an toàn lên Cloud Supabase.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isProcessingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-[#262626] text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs cursor-pointer shadow-xs transition-transform active:scale-98"
              >
                {isProcessingAvatar ? 'Đang xử lý...' : 'Chọn ảnh mới từ thiết bị'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#f4f4f4] hover:bg-[#eaeaea] dark:bg-[#2c2c2c] dark:hover:bg-[#383838] text-[#555] dark:text-[#ccc] font-medium text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coin & Top-up Modal */}
      <CoinModal />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ChatProvider>
      <SettingsView />
    </ChatProvider>
  );
}
