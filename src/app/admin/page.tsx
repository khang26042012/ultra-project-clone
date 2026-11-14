'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  RotateCcw,
  Coins,
  Copy,
  Check,
  Search,
  Sparkles,
  ArrowLeft,
  Terminal,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
} from 'lucide-react';
import { ChatProvider, useChat } from '@/context/ChatContext';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  xu_balance: number;
  subscription_tier: string;
  tier_expires_at: string | null;
  created_at: string;
  updated_at: string;
  is_plus: boolean;
}

function AdminView() {
  const { currentUser, refreshXuStatus } = useChat();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const targetEmail = currentUser?.email || 'trongkhabgphan@gmail.com';

  const fastApiUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/admin/upgrade?email=${encodeURIComponent(targetEmail)}&tier=plus&xu=600`
      : `/api/admin/upgrade?email=${encodeURIComponent(targetEmail)}&tier=plus&xu=600`;

  const fastCurlCmd = `curl -X GET "${fastApiUrl}"`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchUsers = useCallback(async (query = '') => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (opts: {
    email?: string;
    userId?: string;
    tier?: string;
    xu?: number;
    action?: string;
  }) => {
    const key = `${opts.email || opts.userId}-${opts.action || opts.tier}`;
    setActionLoading(key);
    try {
      const res = await fetch('/api/admin/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      setApiResponse(data);

      if (data.success) {
        showToast(`🎉 ${data.message}`);
        // If current session user was updated, sync frontend state
        if (opts.email === currentUser?.email || opts.userId === currentUser?.id) {
          if (typeof window !== 'undefined') {
            if (data.user?.subscription_tier) {
              localStorage.setItem('agrivision_subscription_tier', data.user.subscription_tier);
              localStorage.setItem('agrivision_is_pro', data.user.is_pro_active ? 'true' : 'false');
            }
            if (typeof data.user?.xu_balance === 'number') {
              localStorage.setItem('agrivision_xu_balance', data.user.xu_balance.toString());
            }
          }
          await refreshXuStatus();
        }
        await fetchUsers(searchQuery);
      } else {
        showToast(`❌ Thao tác thất bại: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Admin action error:', err);
      showToast(`❌ Lỗi kết nối: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = (text: string, type: 'url' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
    showToast('📋 Đã sao chép vào bộ nhớ tạm!');
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#f2f2f2] font-sans flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-black font-semibold text-xs shadow-xl animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#161618]/90 backdrop-blur-md border-b border-[#29292d] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">AgriVision Admin Portal</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-[#8e8e93]">
              Bảng điều khiển quản trị, phân quyền gói cước & API quay video demo
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#232327] hover:bg-[#2d2d32] border border-[#34343a] text-xs font-medium text-[#cccccc] hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về ứng dụng</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* HERO SECTION: Fast 1-Click Upgrade Toolbar for Video Demo */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1c1c20] to-[#141416] border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2c2c32]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tiện ích quay Video Demo
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                  Tài khoản mục tiêu: {targetEmail}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                Kích hoạt Gói Plus & Bơm Xu Siêu Tốc (1-Click)
              </h2>
              <p className="text-xs text-[#9a9aa0] mt-0.5">
                Bấm nút bên dưới để nâng cấp tài khoản ngay lập tức khi đang quay video mà không cần nhập thẻ hay quét QR.
              </p>
            </div>

            {/* Quick Action Primary Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() =>
                  handleAction({
                    email: targetEmail,
                    tier: 'plus',
                    xu: 600,
                    action: 'upgrade',
                  })
                }
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ Nâng Gói Plus (+600 Xu)</span>
              </button>

              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() =>
                  handleAction({
                    email: targetEmail,
                    tier: 'free',
                    xu: 20,
                    action: 'downgrade',
                  })
                }
                className="px-3.5 py-2.5 rounded-2xl bg-[#28282e] hover:bg-[#34343c] border border-[#3e3e46] text-xs font-semibold text-[#d4d4d8] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset về Free</span>
              </button>
            </div>
          </div>

          {/* Secondary Quick Coin Injections */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#8e8e93] text-[11px] font-medium flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Nạp Xu lẻ cấp tốc:
            </span>
            <button
              type="button"
              onClick={() => handleAction({ email: targetEmail, xu: 100, action: 'add_xu' })}
              className="px-3 py-1.5 rounded-xl bg-[#232328] hover:bg-[#2d2d34] border border-[#34343c] text-xs font-semibold text-[#f0f0f0] transition-all cursor-pointer"
            >
              +100 Xu
            </button>
            <button
              type="button"
              onClick={() => handleAction({ email: targetEmail, xu: 600, action: 'add_xu' })}
              className="px-3 py-1.5 rounded-xl bg-[#232328] hover:bg-[#2d2d34] border border-[#34343c] text-xs font-semibold text-amber-300 transition-all cursor-pointer"
            >
              +600 Xu
            </button>
            <button
              type="button"
              onClick={() => handleAction({ email: targetEmail, xu: 1000, action: 'add_xu' })}
              className="px-3 py-1.5 rounded-xl bg-[#232328] hover:bg-[#2d2d34] border border-[#34343c] text-xs font-semibold text-[#f0f0f0] transition-all cursor-pointer"
            >
              +1.000 Xu
            </button>
          </div>
        </div>

        {/* SECTION 2: API Direct Call Endpoint Box for Video Demonstration */}
        <div className="p-5 rounded-3xl bg-[#161619] border border-[#2a2a2f] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">API Nâng Cấp Tự Động (Dành cho Script / Browser)</h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              GET / POST Supported
            </span>
          </div>

          <p className="text-xs text-[#8e8e93]">
            Khi quay clip thuyết trình khởi nghiệp, bạn có thể gọi endpoint GET bên dưới từ thanh địa chỉ trình duyệt hoặc chạy cURL từ terminal để minh họa tính năng kích hoạt tức thì.
          </p>

          {/* URL Box */}
          <div className="flex items-center gap-2 bg-[#0c0c0e] p-2.5 rounded-2xl border border-[#242428]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
              GET
            </span>
            <input
              type="text"
              readOnly
              value={fastApiUrl}
              className="flex-1 bg-transparent font-mono text-xs text-[#a1a1aa] focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={() => handleCopy(fastApiUrl, 'url')}
              className="px-2.5 py-1 rounded-xl bg-[#202024] hover:bg-[#2b2b30] text-[#ececec] text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Đã chép' : 'Chép URL'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(fastApiUrl);
                  const data = await res.json();
                  setApiResponse(data);
                  showToast('⚡ Đã kích hoạt API thành công!');
                  await refreshXuStatus();
                  await fetchUsers(searchQuery);
                } catch (e: any) {
                  showToast(`Lỗi gọi API: ${e.message}`);
                }
              }}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Chạy API</span>
            </button>
          </div>

          {/* cURL Command Snippet */}
          <div className="flex items-center justify-between bg-[#0c0c0e] p-2.5 rounded-2xl border border-[#242428] text-xs">
            <span className="font-mono text-[#8e8e93] truncate mr-2">{fastCurlCmd}</span>
            <button
              type="button"
              onClick={() => handleCopy(fastCurlCmd, 'curl')}
              className="px-2.5 py-1 rounded-xl bg-[#202024] hover:bg-[#2b2b30] text-[#ececec] text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Chép cURL</span>
            </button>
          </div>

          {/* Terminal output box */}
          {apiResponse && (
            <div className="p-3 rounded-2xl bg-[#09090b] border border-[#222226] font-mono text-[11px] space-y-1">
              <div className="text-[#71717a] text-[10px] flex items-center justify-between pb-1 border-b border-[#1f1f23]">
                <span>Phản hồi API JSON gần nhất</span>
                <span className="text-emerald-400">HTTP 200 OK</span>
              </div>
              <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap py-1">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* SECTION 3: User Management Table */}
        <div className="p-5 rounded-3xl bg-[#161619] border border-[#2a2a2f] shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Danh Sách Tài Khoản Người Dùng</h3>
              <span className="text-xs text-[#71717a]">({users.length} tài khoản)</span>
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="text"
                placeholder="Tìm theo email hoặc tên..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchUsers(e.target.value);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0e0e10] border border-[#27272b] text-xs text-white placeholder-[#555] focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#26262b]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1b1b1f] text-[#8e8e93] border-b border-[#26262b]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tài khoản</th>
                  <th className="py-3 px-3 font-semibold">Gói cước</th>
                  <th className="py-3 px-3 font-semibold">Số dư Xu</th>
                  <th className="py-3 px-3 font-semibold">Hạn dùng</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao tác nâng cấp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232328]">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#71717a]">
                      Đang tải dữ liệu người dùng...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#71717a]">
                      Không tìm thấy tài khoản phù hợp
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isPlus = u.is_plus;
                    const isCurrent = u.email === currentUser?.email;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-[#1a1a1e] transition-colors ${
                          isCurrent ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Account Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-black font-bold flex items-center justify-center text-[10px]">
                              {u.name ? u.name.slice(0, 2).toUpperCase() : 'AG'}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{u.name || 'Người dùng'}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                                    Đang đăng nhập
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#71717a] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Plan Badge */}
                        <td className="py-3 px-3">
                          {isPlus ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              GÓI PLUS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#26262a] text-[#8e8e93] text-[10px] font-medium">
                              Miễn phí (Free)
                            </span>
                          )}
                        </td>

                        {/* Balance */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-white flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            {u.xu_balance ?? 0} Xu
                          </span>
                        </td>

                        {/* Expiry */}
                        <td className="py-3 px-3 text-[#8e8e93] text-[11px]">
                          {u.tier_expires_at
                            ? new Date(u.tier_expires_at).toLocaleDateString('vi-VN')
                            : isPlus
                            ? 'Vô thời hạn'
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPlus ? (
                              <button
                                type="button"
                                disabled={actionLoading !== null}
                                onClick={() =>
                                  handleAction({
                                    email: u.email,
                                    userId: u.id,
                                    tier: 'plus',
                                    xu: 600,
                                    action: 'upgrade',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] shadow-sm transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 fill-current" />
                                <span>Nâng Plus (+600 Xu)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading !== null}
                                onClick={() =>
                                  handleAction({
                                    email: u.email,
                                    userId: u.id,
                                    xu: 600,
                                    action: 'add_xu',
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#27272d] hover:bg-[#33333b] border border-[#393942] text-amber-300 font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Coins className="w-3 h-3" />
                                <span>+600 Xu</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={actionLoading !== null}
                              onClick={() =>
                                handleAction({
                                  email: u.email,
                                  userId: u.id,
                                  tier: 'free',
                                  xu: 20,
                                  action: 'downgrade',
                                })
                              }
                              title="Hạ gói về Free (20 Xu)"
                              className="p-1 rounded-lg bg-[#222226] hover:bg-[#2c2c32] text-[#8e8e93] hover:text-rose-400 transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ChatProvider>
      <AdminView />
    </ChatProvider>
  );
}
