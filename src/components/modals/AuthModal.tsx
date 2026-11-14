'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useChat();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key and lock body scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
      }
    }
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  // GSAP 60 FPS animation on open
  useEffect(() => {
    if (isAuthModalOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.95, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' }
      );
    }
    // Reset state on open
    setError(null);
  }, [isAuthModalOpen, mode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Vui lòng nhập họ và tên');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu tối thiểu phải từ 6 ký tự');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      setLoading(true);
      const res = await register(name.trim(), email.trim(), password);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Đăng ký thất bại');
      } else {
        setIsAuthModalOpen(false);
      }
    } else {
      setLoading(true);
      const res = await login(email.trim(), password);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Email hoặc mật khẩu không chính xác');
      } else {
        setIsAuthModalOpen(false);
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsAuthModalOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#ffffff] dark:bg-[#1e1e1e] border border-[#e5e5e5] dark:border-[#333333] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#0d0d0d] dark:text-[#ececec] relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#f2f2f2] dark:hover:bg-[#282828] text-[#5d5d5d] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
            {mode === 'login' ? 'Đăng nhập AgriVision' : 'Tạo tài khoản mới'}
          </h2>
          <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mt-1.5">
            {mode === 'login'
              ? 'Lưu trữ lịch sử chẩn đoán cây trồng và cài đặt cá nhân'
              : 'Đăng ký nhanh chóng, bảo mật dữ liệu trực tiếp trong hệ thống'}
          </p>

          {/* Segmented Switcher */}
          <div className="inline-flex p-1 rounded-full bg-[#f4f4f4] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#2f2f2f] mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#ffffff] text-[#0d0d0d] dark:bg-[#2b2b2b] dark:text-white shadow-xs'
                  : 'text-[#5d5d5d] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#ffffff] text-[#0d0d0d] dark:bg-[#2b2b2b] dark:text-white shadow-xs'
                  : 'text-[#5d5d5d] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* Inline Error Alert */}
        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#5d5d5d] dark:text-[#b4b4b4] mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8e8e8e] absolute left-3.5 top-3" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Ví dụ: Tác giả đề tài AgriVision"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] dark:bg-[#171717] text-xs text-[#0d0d0d] dark:text-white placeholder-[#8e8e8e] rounded-xl border border-[#e5e5e5] dark:border-[#333333] focus:border-[#0d0d0d] dark:focus:border-white outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5d5d5d] dark:text-[#b4b4b4] mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8e8e8e] absolute left-3.5 top-3" strokeWidth={1.5} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] dark:bg-[#171717] text-xs text-[#0d0d0d] dark:text-white placeholder-[#8e8e8e] rounded-xl border border-[#e5e5e5] dark:border-[#333333] focus:border-[#0d0d0d] dark:focus:border-white outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5d5d5d] dark:text-[#b4b4b4] mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8e8e8e] absolute left-3.5 top-3" strokeWidth={1.5} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#f9f9f9] dark:bg-[#171717] text-xs text-[#0d0d0d] dark:text-white placeholder-[#8e8e8e] rounded-xl border border-[#e5e5e5] dark:border-[#333333] focus:border-[#0d0d0d] dark:focus:border-white outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#5d5d5d] dark:text-[#b4b4b4] mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8e8e8e] absolute left-3.5 top-3" strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] dark:bg-[#171717] text-xs text-[#0d0d0d] dark:text-white placeholder-[#8e8e8e] rounded-xl border border-[#e5e5e5] dark:border-[#333333] focus:border-[#0d0d0d] dark:focus:border-white outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0d0d0d] hover:bg-[#262626] text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black text-xs font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
          </button>
        </form>
      </div>
    </div>
  );
}
