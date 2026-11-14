'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import {
  X,
  Palette,
  Eye,
  Cpu,
  Database,
  Info,
  Check,
  Settings,
  Sparkles,
  Download,
  Trash2,
  Globe,
  Radio,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { ThemeMode, FontSizeOption } from '@/types/chat';

type TabType = 'general' | 'display' | 'model' | 'data' | 'about';

export default function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
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
    conversations,
    clearChatHistory,
    exportBackupJson,
  } = useChat();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [language, setLanguage] = useState('Tiếng Việt (Mặc định)');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Calculate local storage approximate size
  const storageStats = useMemo(() => {
    try {
      const json = JSON.stringify(conversations);
      const bytes = new Blob([json]).size;
      const totalMessages = conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 0);
      return {
        kb: (bytes / 1024).toFixed(1),
        convCount: conversations.length,
        msgCount: totalMessages,
      };
    } catch {
      return { kb: '0', convCount: 0, msgCount: 0 };
    }
  }, [conversations]);

  // Close on Escape key and lock body scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setConfirmDelete(false);
        setIsSettingsOpen(false);
      }
    }
    if (isSettingsOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen, setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  const languages = ['Tiếng Việt (Mặc định)', 'English (US)'];

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Chung', icon: Settings },
    { id: 'display', label: 'Đọc & Hiển thị', icon: Eye },
    { id: 'model', label: 'Mô hình AI', icon: Cpu },
    { id: 'data', label: 'Dữ liệu', icon: Database },
    { id: 'about', label: 'Giới thiệu', icon: Info },
  ];

  const handleClearHistory = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    clearChatHistory();
    setConfirmDelete(false);
    setIsSettingsOpen(false);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSettingsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-[#ffffff] dark:bg-[#1e1e1e] border border-[#e5e5e5] dark:border-[#333333] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-[#e5e5e5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs shadow-xs">
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-base text-[#0d0d0d] dark:text-white">Cài đặt hệ thống</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              setIsSettingsOpen(false);
            }}
            title="Đóng (Esc)"
            className="p-1.5 rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] hover:text-[#0d0d0d] dark:text-[#8e8e8e] dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile Horizontal Pills Tab Bar (< md) */}
        <div className="md:hidden border-b border-[#e5e5e5] dark:border-[#333333] px-3 py-2 bg-[#fbfbfb] dark:bg-[#181818] overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`settings-tab-mobile-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setConfirmDelete(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0d0d0d] text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                      : 'bg-[#eeeeee] text-[#555555] dark:bg-[#282828] dark:text-[#a0a0a0] hover:bg-[#e4e4e4] dark:hover:bg-[#333333]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Left Tab Nav (Desktop) & Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop Tabs Sidebar (md:) */}
          <div className="hidden md:flex flex-col w-52 border-r border-[#e5e5e5] dark:border-[#333333] p-3 space-y-1 bg-[#f9f9fa] dark:bg-[#181818] shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`settings-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setConfirmDelete(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#0d0d0d] text-white dark:bg-[#2f2f2f] dark:text-white font-semibold shadow-xs'
                      : 'text-[#5d5d5d] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#eaeaea] dark:hover:bg-[#252525]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto no-scrollbar">
            {/* TAB 1: CHUNG */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">Giao diện (Theme)</h3>
                  <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mb-3">
                    Tùy chọn hiển thị ánh sáng tối ưu cho mắt khi làm việc ngoài trời hoặc ban đêm.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTheme(mode)}
                        className={`p-3 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                          theme === mode
                            ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white dark:border-white dark:bg-white dark:text-black shadow-xs'
                            : 'border-[#e5e5e5] hover:border-[#b4b4b4] text-[#5d5d5d] dark:border-[#383838] dark:hover:border-[#525252] dark:text-[#8e8e8e]'
                        }`}
                      >
                        <Palette className="w-4 h-4 mx-auto mb-1.5 opacity-85" strokeWidth={1.5} />
                        {mode === 'light' ? 'Chế độ sáng' : mode === 'dark' ? 'Chế độ tối' : 'Hệ thống'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#333333]">
                  <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">Ngôn ngữ hiển thị</h3>
                  <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mb-3">Ngôn ngữ chính cho toàn bộ giao diện.</p>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#f9f9f9] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#383838] rounded-xl px-3 py-2 text-xs text-[#0d0d0d] dark:text-white outline-none focus:border-[#0d0d0d] dark:focus:border-white cursor-pointer"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: ĐỌC & HIỂN THỊ */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">Cỡ chữ văn bản</h3>
                  <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mb-3">
                    Điều chỉnh kích thước cỡ chữ tin nhắn để phù hợp với thị lực và thói quen đọc.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: 'small', label: 'Nhỏ', px: '13px', desc: 'Mật độ cao' },
                      { key: 'medium', label: 'Vừa (Chuẩn)', px: '15px', desc: 'Mặc định' },
                      { key: 'large', label: 'Lớn', px: '17px', desc: 'Dễ đọc nhất' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        data-testid={`font-size-${item.key}`}
                        onClick={() => setFontSize(item.key as FontSizeOption)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          fontSize === item.key
                            ? 'border-[#0d0d0d] bg-[#0d0d0d] text-white dark:border-white dark:bg-white dark:text-black shadow-xs'
                            : 'border-[#e5e5e5] hover:border-[#b4b4b4] text-[#5d5d5d] dark:border-[#383838] dark:hover:border-[#525252] dark:text-[#8e8e8e]'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          <span className="text-[10px] opacity-70 font-mono">{item.px}</span>
                        </div>
                        <div className="text-[11px] opacity-80 mt-1">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#333333] flex items-center justify-between">
                  <div className="pr-4">
                    <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white">Tự động bám đáy khi trò chuyện</h3>
                    <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mt-0.5">
                      Tự động trượt xuống tin nhắn mới nhất khi trợ lý AI đang trả lời câu hỏi.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAutoScrollEnabled}
                    data-testid="toggle-auto-scroll"
                    onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      isAutoScrollEnabled ? 'bg-[#0d0d0d] dark:bg-white' : 'bg-[#e5e5e5] dark:bg-[#424242]'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full transition-transform ${
                        isAutoScrollEnabled ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: MÔ HÌNH AI */}
            {activeTab === 'model' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">Mô hình AI chẩn đoán</h3>
                  <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mb-3">
                    Lựa chọn bộ máy suy luận nông nghiệp phù hợp với nhu cầu thực tế của nhà nông.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        id: 'ag/gemini-3.8-flash-high',
                        name: 'ag/gemini-3.8-flash-high (Mặc định)',
                        badge: 'Khuyên dùng',
                        desc: 'Suy luận bệnh học chuyên sâu, hỗ trợ chuỗi tư duy reasoning_content và phác đồ điều trị đa giai đoạn.',
                      },
                      {
                        id: 'ag/gemini-3.8-flash',
                        name: 'ag/gemini-3.8-flash',
                        badge: 'Tốc độ cao',
                        desc: 'Phản hồi nhanh siêu tốc, phù hợp tra cứu tức thì danh mục thuốc BVTV và cách bón phân đơn giản.',
                      },
                      {
                        id: 'ag/claude-sonnet-4-6',
                        name: 'ag/claude-sonnet-4-6',
                        badge: 'PRO',
                        desc: 'Mô hình đa phương thức cao cấp của Anthropic, phân tích bệnh học lâm sàng sâu sắc.',
                      },
                      {
                        id: 'ag/claude-opus-4-6-thinking',
                        name: 'ag/claude-opus-4-6-thinking',
                        badge: 'Deep Think',
                        desc: 'Mô hình suy luận tối thượng với chuỗi tư duy mở rộng (Thinking Mode) cho các ca bệnh nan giải.',
                      },
                    ].map((m) => {
                      const isSelected = selectedModel === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0d0d0d] bg-[#f9f9f9] dark:border-white dark:bg-[#252525]'
                              : 'border-[#e5e5e5] hover:border-[#b4b4b4] dark:border-[#383838] dark:hover:border-[#525252]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#0d0d0d] dark:border-white'
                                    : 'border-[#b4b4b4] dark:border-[#525252]'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-[#0d0d0d] dark:bg-white" />
                                )}
                              </div>
                              <span className="font-semibold text-xs text-[#0d0d0d] dark:text-white font-mono">
                                {m.name}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#555555] dark:text-[#cccccc] font-medium">
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-xs text-[#666666] dark:text-[#a0a0a0] pl-6 leading-relaxed">
                            {m.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#333333] flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#0d0d0d] dark:text-white" strokeWidth={1.5} />
                      <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white">
                        Tự động tra cứu Web thời gian thực (Web Search)
                      </h3>
                    </div>
                    <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mt-1">
                      Cho phép AI tự động tìm kiếm thông tin dịch bệnh mới nhất, cảnh báo thời tiết và các thông tư khuyến nông ĐBSCL.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isWebSearchEnabled}
                    data-testid="toggle-web-search"
                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      isWebSearchEnabled ? 'bg-[#0d0d0d] dark:bg-white' : 'bg-[#e5e5e5] dark:bg-[#424242]'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full transition-transform ${
                        isWebSearchEnabled ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: DỮ LIỆU */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white mb-1">Tình trạng bộ nhớ</h3>
                  <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mb-3">
                    Dữ liệu được lưu trữ an toàn trên thiết bị và đồng bộ tự động lên máy chủ cơ sở dữ liệu Supabase Cloud.
                  </p>
                  <div className="p-3.5 rounded-2xl bg-[#f7f7f8] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#333] grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">Dung lượng ước tính</div>
                      <div className="text-base font-bold text-[#0d0d0d] dark:text-white mt-0.5">
                        {storageStats.kb} <span className="text-xs font-normal">KB</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">Phiên trao đổi</div>
                      <div className="text-base font-bold text-[#0d0d0d] dark:text-white mt-0.5">
                        {storageStats.convCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">Tổng số tin nhắn</div>
                      <div className="text-base font-bold text-[#0d0d0d] dark:text-white mt-0.5">
                        {storageStats.msgCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#333333] flex items-center justify-between">
                  <div className="pr-4">
                    <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-white">Xuất dữ liệu chẩn đoán (.json)</h3>
                    <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mt-0.5">
                      Tải file sao lưu toàn bộ nhật ký dịch hại và đơn thuốc khuyến cáo về máy.
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Xuất JSON"
                    data-testid="export-json-button"
                    onClick={exportBackupJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e5e5e5] hover:bg-[#f4f4f4] dark:border-[#383838] dark:hover:bg-[#2f2f2f] text-xs font-medium transition-colors cursor-pointer text-[#0d0d0d] dark:text-white shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Xuất JSON</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-[#e5e5e5] dark:border-[#333333]">
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        Xóa sạch lịch sử hội thoại
                      </h3>
                      <p className="text-xs text-[#5d5d5d] dark:text-[#8e8e8e] mt-0.5">
                        Xóa toàn bộ các cuộc trao đổi trên cả máy tính lẫn cơ sở dữ liệu Supabase.
                      </p>
                    </div>

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer shrink-0"
                      >
                        Xóa lịch sử
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-2.5 py-1.5 rounded-xl border border-[#e5e5e5] hover:bg-[#f0f0f0] text-xs text-[#5d5d5d] dark:border-[#333] dark:text-[#aaa] cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleClearHistory}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
                        >
                          Xác nhận xóa
                        </button>
                      </div>
                    )}
                  </div>
                  {confirmDelete && (
                    <div className="mt-2 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Thao tác này không thể hoàn tác. Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: GIỚI THIỆU */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f7f7f8] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#333]">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white leading-none">AgriVision</h3>
                      <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e]">Phiên bản 1.0 (Bản chính thức)</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
                    Hệ sinh thái Trí tuệ Nhân tạo & Viễn thám Giám sát Bệnh học Thực vật Thông minh, thiết kế chuyên sâu phục vụ bà con nông dân tỉnh Vĩnh Long và Đồng bằng Sông Cửu Long.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <span className="text-[#5d5d5d] dark:text-[#8e8e8e]">Tác giả phát triển:</span>
                    <span className="font-semibold text-[#0d0d0d] dark:text-white">Tác giả đề tài AgriVision</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <span className="text-[#5d5d5d] dark:text-[#8e8e8e]">Đơn vị học tập:</span>
                    <span className="font-medium text-[#0d0d0d] dark:text-white">Học sinh trung học, Đơn vị nghiên cứu (Tỉnh Vĩnh Long)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <span className="text-[#5d5d5d] dark:text-[#8e8e8e]">Mô hình AI chuyên sâu:</span>
                    <span className="font-mono text-[#0d0d0d] dark:text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                      ag/gemini-3.8-flash-high (AI Gateway)
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <span className="text-[#5d5d5d] dark:text-[#8e8e8e]">Cơ sở dữ liệu đám mây:</span>
                    <span className="font-medium text-[#0d0d0d] dark:text-white">Supabase PostgreSQL (Singapore Region)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <span className="text-[#5d5d5d] dark:text-[#8e8e8e]">Kiến trúc công nghệ:</span>
                    <span className="font-mono text-[#0d0d0d] dark:text-white">Next.js 16 • React 19 • Tailwind v4 • GSAP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <span className="text-[#5d5d5d] dark:text-[#8e8e8e]">Tiêu chuẩn can thiệp:</span>
                    <span className="font-medium text-[#0d0d0d] dark:text-white">An toàn sinh học VietGAP & Chi cục BVTV Vĩnh Long</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
