'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Activity,
  ChevronRight,
  X,
  MapPin,
  Leaf,
  Check,
  SquarePen,
} from 'lucide-react';
import { ChatProvider, useChat } from '@/context/ChatContext';
import AppSidebar from '@/components/sidebar/AppSidebar';
import CoinModal from '@/components/modals/CoinModal';
import HelpModal from '@/components/modals/HelpModal';
import { CropRecord } from '@/lib/cropSearch';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả nhóm cây', icon: '🌱' },
  { id: 'fruit', label: 'Cây ăn trái đặc sản', icon: '🍊' },
  { id: 'grain', label: 'Lương thực & Hoa màu', icon: '🌾' },
  { id: 'veg', label: 'Rau củ & Gia vị', icon: '🥬' },
  { id: 'industrial', label: 'Cây công nghiệp', icon: '☕' },
  { id: 'medicinal_forest', label: 'Dược liệu & Lâm nghiệp', icon: '🌲' },
  { id: 'exotic_flower', label: 'Cây nhập khẩu & Hoa kiểng', icon: '🌐' },
];

const PAGE_SIZE = 20;

function CropsEncyclopediaView() {
  const router = useRouter();
  const { toggleSidebar, createNewChat, isSidebarOpen } = useChat();

  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState<CropRecord | null>(null);
  const [activeDiseaseTab, setActiveDiseaseTab] = useState(0);

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside filter dropdown to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Initial fetch on debouncedQuery or selectedTopic change
  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialCrops() {
      setLoadingInitial(true);
      setHasMore(true);

      try {
        const url = `/api/crops?topic=${encodeURIComponent(
          selectedTopic
        )}&q=${encodeURIComponent(debouncedQuery)}&limit=${PAGE_SIZE}&offset=0`;
        const res = await fetch(url);
        const data = await res.json();

        if (!isCancelled && data.success) {
          const fetchedCrops = Array.isArray(data.crops) ? data.crops : [];
          setCrops(fetchedCrops);
          offsetRef.current = fetchedCrops.length;
          setTotalCount(data.total || 0);
          setHasMore(fetchedCrops.length < (data.total || 0));
        }
      } catch (err) {
        console.error('Failed to load initial crops:', err);
      } finally {
        if (!isCancelled) {
          setLoadingInitial(false);
        }
      }
    }

    fetchInitialCrops();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, selectedTopic]);

  // Load more for infinite scroll
  const offsetRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loadingInitial) return;

    setLoadingMore(true);
    try {
      const offset = offsetRef.current;
      const url = `/api/crops?topic=${encodeURIComponent(
        selectedTopic
      )}&q=${encodeURIComponent(
        debouncedQuery
      )}&limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.crops)) {
        const nextCrops = data.crops;
        if (nextCrops.length === 0) {
          setHasMore(false);
        } else {
          setCrops((prev) => {
            const combined = [...prev, ...nextCrops];
            offsetRef.current = combined.length;
            if (combined.length >= (data.total || 0)) {
              setHasMore(false);
            }
            return combined;
          });
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more crops:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMore,
    loadingInitial,
    selectedTopic,
    debouncedQuery,
  ]);

  // IntersectionObserver for infinite scrolling sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !loadingInitial) {
          loadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
        rootMargin: '250px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingInitial, loadMore]);

  const renderDangerBadge = (danger: string) => {
    if (danger.includes('Hiểm') || danger.includes('Cực kỳ') || danger.includes('Nghiêm trọng')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Hiểm nghèo
        </span>
      );
    }
    if (danger.includes('Nặng') || danger.includes('Cao')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Nguy cơ cao
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Trung bình
      </span>
    );
  };

  const activeCategory = CATEGORIES.find((c) => c.id === selectedTopic);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#ffffff] dark:bg-[#141414] text-[#0d0d0d] dark:text-[#ececec]">
      {/* 1. App Sidebar Integrated */}
      <AppSidebar />

      {/* 2. Main Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-[#ffffff] dark:bg-[#141414] overflow-hidden">
        {/* Floating Controls Bar: Đồng bộ 100% chuẩn ChatGPT App */}
        <div
          className={`fixed top-3.5 right-3.5 z-30 flex items-center justify-between pointer-events-none transition-all duration-300 ${
            isSidebarOpen ? 'md:left-[274px] left-3.5' : 'left-3.5'
          }`}
        >
          {/* Nút mở Sidebar bên trái */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isSidebarOpen ? 'Đóng menu' : 'Mở menu'}
            className="pointer-events-auto w-10 h-10 rounded-full bg-white/90 dark:bg-[#212121]/90 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none border border-black/5 dark:border-white/10 flex items-center justify-center text-[#0d0d0d] dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex flex-col gap-1.5 items-center justify-center">
              <span className="w-4 h-0.5 bg-current rounded-full" />
              <span className="w-4 h-0.5 bg-current rounded-full" />
            </div>
          </button>

          {/* Nút Tạo Chat Mới bên phải: chuyển về trang chủ và tạo đoạn chat mới */}
          <button
            type="button"
            onClick={() => {
              createNewChat();
              router.push('/');
            }}
            title="Đoạn chat mới"
            className="pointer-events-auto w-10 h-10 rounded-full bg-white/90 dark:bg-[#212121]/90 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none border border-black/5 dark:border-white/10 flex items-center justify-center text-[#0d0d0d] dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <SquarePen className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Content Viewport */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 bg-[#ffffff] dark:bg-[#141414] pt-4"
        >
          {/* Header Section */}
          <section className="pt-10 pb-6 px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0d0d0d] dark:text-white">
                Kho dữ liệu cây trồng
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a3a3a3] max-w-lg mx-auto leading-relaxed">
                Tra cứu toàn diện hồ sơ bệnh học thực vật, triệu chứng lâm sàng và phác đồ sinh học VietGAP an toàn.
              </p>
            </div>
          </section>

          {/* Search Bar & Filter Button */}
          <main className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
            <div className="max-w-2xl mx-auto space-y-2.5">
              <div className="relative flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e8e]"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên cây (sầu riêng, bưởi, lúa...), tên khoa học hoặc bệnh..."
                    className="w-full pl-11 pr-10 py-2.5 sm:py-3 rounded-[24px] bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#2e2e2e] text-xs sm:text-sm text-[#0d0d0d] dark:text-white placeholder:text-[#8e8e8e] focus:outline-hidden focus:border-[#0d0d0d] dark:focus:border-white transition-colors shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white p-1 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                {/* Filter Button */}
                <div className="relative" ref={filterMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-3 rounded-[24px] text-xs font-medium border transition-all cursor-pointer shrink-0 ${
                      selectedTopic !== 'all'
                        ? 'bg-[#0d0d0d] text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-[#f9f9f9] hover:bg-[#eaeaea] text-[#0d0d0d] dark:bg-[#1f1f1f] dark:hover:bg-[#252525] dark:text-white border-[#e5e5e5] dark:border-[#2e2e2e]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Bộ lọc</span>
                    {selectedTopic !== 'all' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                    )}
                  </button>

                  {/* Filter Dropdown Popover */}
                  {isFilterOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-[#ffffff] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#2e2e2e] shadow-xl z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
                        Chọn nhóm cây trồng
                      </div>
                      {CATEGORIES.map((cat) => {
                        const isSelected = selectedTopic === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedTopic(cat.id);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#f0f0f0] dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white font-semibold'
                                : 'hover:bg-[#f7f7f7] dark:hover:bg-[#262626] text-[#525252] dark:text-[#cccccc]'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span>{cat.icon}</span>
                              <span className="truncate">{cat.label}</span>
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Filter Pill */}
              {selectedTopic !== 'all' && activeCategory && (
                <div className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3] pl-2">
                  <span>Đang lọc:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-[#222222] text-[#0d0d0d] dark:text-white font-medium text-[11px]">
                    {activeCategory.icon} {activeCategory.label}
                    <button
                      type="button"
                      onClick={() => setSelectedTopic('all')}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Crops Grid */}
            {loadingInitial ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] animate-pulse space-y-3"
                  >
                    <div className="h-5 bg-[#e5e5e5] dark:bg-[#262626] rounded-md w-1/2" />
                    <div className="h-3 bg-[#e5e5e5] dark:bg-[#262626] rounded-md w-3/4" />
                    <div className="h-12 bg-[#e5e5e5] dark:bg-[#262626] rounded-md w-full" />
                  </div>
                ))}
              </div>
            ) : crops.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#f4f4f4] dark:bg-[#1f1f1f] flex items-center justify-center text-xl">
                  🔍
                </div>
                <h3 className="font-semibold text-sm text-[#0d0d0d] dark:text-white">
                  Không tìm thấy loài cây phù hợp
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] max-w-sm mx-auto">
                  Thử tìm kiếm với tên gọi khác hoặc chuyển về &quot;Tất cả nhóm cây&quot;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {crops.map((crop) => {
                  const diseasesCount = Array.isArray(crop.danh_sach_benh)
                    ? crop.danh_sach_benh.length
                    : 0;
                  const regions = Array.isArray(crop.dia_ban_pho_bien)
                    ? crop.dia_ban_pho_bien.slice(0, 3).join(', ')
                    : crop.dia_ban_pho_bien;

                  return (
                    <div
                      key={crop.id}
                      onClick={() => {
                        setSelectedCrop(crop);
                        setActiveDiseaseTab(0);
                      }}
                      className="group p-5 rounded-2xl bg-[#ffffff] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] hover:border-[#0d0d0d] dark:hover:border-white/40 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-[#0d0d0d] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {crop.name_vi}
                          </h3>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#f4f4f4] dark:bg-[#252525] text-[#737373] dark:text-[#a3a3a3] border border-[#e5e5e5]/50 dark:border-[#333]/50 shrink-0">
                            {diseasesCount} bệnh
                          </span>
                        </div>
                        <p className="text-xs italic font-serif text-[#737373] dark:text-[#a3a3a3] truncate">
                          {crop.scientific_name}
                        </p>
                        <p className="text-xs text-[#525252] dark:text-[#b3b3b3] line-clamp-2 leading-relaxed">
                          {crop.dac_tinh_sinh_thai}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#f0f0f0] dark:border-[#262626] flex items-center justify-between text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                        <span className="flex items-center gap-1 truncate max-w-[80%]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{regions || 'Toàn quốc'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="py-6 flex justify-center">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#a3a3a3]">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải thêm cây trồng...</span>
                </div>
              ) : !hasMore && crops.length > 0 ? (
                <div className="text-xs text-[#8e8e8e] text-center">
                  Đã tải toàn bộ {crops.length} / {totalCount} cây trồng
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>

      {/* Crop Pathology Profile Detail Modal */}
      {selectedCrop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCrop(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Clean, only close button ✕ */}
            <div className="p-5 sm:p-6 border-b border-[#e5e5e5] dark:border-[#262626] flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0d0d0d] dark:text-white truncate">
                    {selectedCrop.name_vi}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#f4f4f4] dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] font-mono text-[#737373] dark:text-[#a3a3a3] shrink-0">
                    {selectedCrop.id}
                  </span>
                </div>
                <p className="text-xs sm:text-sm italic font-serif text-[#737373] dark:text-[#a3a3a3] mt-0.5 truncate">
                  {selectedCrop.scientific_name}
                </p>
              </div>

              {/* ONLY close button ✕ */}
              <button
                type="button"
                onClick={() => setSelectedCrop(null)}
                className="p-2 rounded-full hover:bg-[#f0f0f0] dark:hover:bg-[#2b2b2b] text-[#737373] hover:text-[#0d0d0d] dark:text-[#a3a3a3] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                title="Đóng"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm no-scrollbar">
              {/* Ecology & Geography */}
              <div className="p-4 rounded-2xl bg-[#f9f9f9] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#2a2a2a] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Đặc tính nông học & Địa bàn</span>
                </div>
                <p className="text-xs text-[#525252] dark:text-[#cccccc] leading-relaxed">
                  {selectedCrop.dac_tinh_sinh_thai}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3]">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  <span>
                    {Array.isArray(selectedCrop.dia_ban_pho_bien)
                      ? selectedCrop.dia_ban_pho_bien.join(', ')
                      : selectedCrop.dia_ban_pho_bien}
                  </span>
                </div>
              </div>

              {/* Pathology Spectrum */}
              {Array.isArray(selectedCrop.danh_sach_benh) &&
                selectedCrop.danh_sach_benh.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#0d0d0d] dark:text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Hồ sơ bệnh học ({selectedCrop.danh_sach_benh.length} bệnh)</span>
                      </h3>
                    </div>

                    {/* Disease Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {selectedCrop.danh_sach_benh.map((d, dIdx) => (
                        <button
                          key={dIdx}
                          type="button"
                          onClick={() => setActiveDiseaseTab(dIdx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                            activeDiseaseTab === dIdx
                              ? 'bg-[#0d0d0d] text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                              : 'bg-[#f4f4f4] hover:bg-[#eaeaea] text-[#525252] dark:bg-[#242424] dark:hover:bg-[#2e2e2e] dark:text-[#a3a3a3]'
                          }`}
                        >
                          {d.ten_benh}
                        </button>
                      ))}
                    </div>

                    {/* Active Disease Details */}
                    {selectedCrop.danh_sach_benh[activeDiseaseTab] && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#f9f9f9] dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#2a2a2a] space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-base text-[#0d0d0d] dark:text-white">
                              {selectedCrop.danh_sach_benh[activeDiseaseTab].ten_benh}
                            </h4>
                            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                              Tác nhân:{' '}
                              {typeof selectedCrop.danh_sach_benh[activeDiseaseTab].tac_nhan === 'object'
                                ? `${selectedCrop.danh_sach_benh[activeDiseaseTab].tac_nhan.loai} (${selectedCrop.danh_sach_benh[activeDiseaseTab].tac_nhan.ten_khoa_hoc})`
                                : selectedCrop.danh_sach_benh[activeDiseaseTab].tac_nhan}
                            </p>
                          </div>
                          {renderDangerBadge(
                            selectedCrop.danh_sach_benh[activeDiseaseTab].muc_do_nguy_hiem || ''
                          )}
                        </div>

                        {/* Symptoms */}
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-[#0d0d0d] dark:text-white">
                            Triệu chứng điển hình:
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-xs text-[#525252] dark:text-[#cccccc] leading-relaxed">
                            {Array.isArray(
                              selectedCrop.danh_sach_benh[activeDiseaseTab].trieu_chung_dien_hinh
                            ) ? (
                              selectedCrop.danh_sach_benh[
                                activeDiseaseTab
                              ].trieu_chung_dien_hinh.map((s, sIdx) => (
                                <li key={sIdx}>{s}</li>
                              ))
                            ) : (
                              <li>
                                {selectedCrop.danh_sach_benh[activeDiseaseTab].trieu_chung_dien_hinh}
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Differential Diagnosis */}
                        {selectedCrop.danh_sach_benh[activeDiseaseTab].phan_biet_chan_doan_kep && (
                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Phân biệt chẩn đoán kép lâm sàng:</span>
                            </div>
                            <p className="leading-relaxed">
                              {selectedCrop.danh_sach_benh[activeDiseaseTab].phan_biet_chan_doan_kep}
                            </p>
                          </div>
                        )}

                        {/* Field Test */}
                        {selectedCrop.danh_sach_benh[activeDiseaseTab].kiem_tra_thuc_dia && (
                          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Thao tác kiểm tra thực địa:</span>
                            </div>
                            <p className="leading-relaxed">
                              {selectedCrop.danh_sach_benh[activeDiseaseTab].kiem_tra_thuc_dia}
                            </p>
                          </div>
                        )}

                        {/* VietGAP Protocol */}
                        {selectedCrop.danh_sach_benh[activeDiseaseTab].phac_do_vietgap && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                            <div className="font-semibold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Phác đồ điều trị sinh học chuẩn VietGAP:</span>
                            </div>
                            <div className="space-y-1 pl-1 leading-relaxed">
                              {selectedCrop.danh_sach_benh[activeDiseaseTab].phac_do_vietgap.canh_tac && (
                                <p>
                                  <strong>• Canh tác:</strong>{' '}
                                  {selectedCrop.danh_sach_benh[activeDiseaseTab].phac_do_vietgap.canh_tac}
                                </p>
                              )}
                              {selectedCrop.danh_sach_benh[activeDiseaseTab].phac_do_vietgap.sinh_hoc && (
                                <p>
                                  <strong>• Sinh học:</strong>{' '}
                                  {selectedCrop.danh_sach_benh[activeDiseaseTab].phac_do_vietgap.sinh_hoc}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals for Sidebar Navigation */}
      <CoinModal />
      <HelpModal />
    </div>
  );
}

export default function CropsPage() {
  return (
    <ChatProvider>
      <CropsEncyclopediaView />
    </ChatProvider>
  );
}
