'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Conversation, Message, ModelOption, ThemeMode, User, SearchSource, FontSizeOption, ChatContextType } from '@/types/chat';
import { getInitials, generateId, safeSetLocalStorage } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'ag/gemini-3.8-flash-high',
    name: 'Gemini 3.8 Flash High',
    description: 'Mô hình suy luận lâm sàng chuyên sâu, bóc tách ca bệnh kép và tra cứu Web thời gian thực',
    badge: 'Khuyên dùng',
    isDefault: true,
  },
  {
    id: 'ag/gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Mô hình phản hồi siêu tốc, trả lời nhanh cho các câu hỏi phổ thông',
    badge: 'Nhanh',
  },
  {
    id: 'ag/claude-sonnet-4-6',
    name: 'Claude 4.6 Sonnet',
    description: 'Mô hình đa phương thức cao cấp của Anthropic, phân tích bệnh học lâm sàng và xử lý sâu sắc',
    badge: 'Gói Plus',
    requiresPlus: true,
  },
  {
    id: 'ag/claude-opus-4-6-thinking',
    name: 'Claude 4.6 Opus Thinking',
    description: 'Mô hình suy luận tối thượng với chuỗi tư duy mở rộng (Thinking Mode), chẩn đoán các ca bệnh nan giải',
    badge: 'Gói Plus',
    requiresPlus: true,
  },
];

const INITIAL_CONVERSATIONS: Conversation[] = [];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('ag/gemini-3.8-flash-high');
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [fontSize, setFontSizeState] = useState<FontSizeOption>('medium');
  const [isWebSearchEnabled, setIsWebSearchEnabledState] = useState<boolean>(true);
  const [isAutoScrollEnabled, setIsAutoScrollEnabledState] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [isCoinModalOpen, setIsCoinModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [xuBalance, setXuBalanceState] = useState<number>(20);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [isProActive, setIsProActive] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [customAvatar, setCustomAvatar] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef<boolean>(false);
  const conversationsRef = useRef<Conversation[]>(conversations);
  conversationsRef.current = conversations;

  // Safe client-only read for custom avatar and Xu balance to prevent Hydration Mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agrivision_custom_avatar');
      if (saved) setCustomAvatar(saved);

      const savedXu = localStorage.getItem('agrivision_xu_balance');
      if (savedXu) {
        const parsed = parseInt(savedXu, 10);
        if (!isNaN(parsed)) setXuBalanceState(parsed);
      }
      const savedTier = localStorage.getItem('agrivision_subscription_tier');
      if (savedTier) setSubscriptionTier(savedTier);
      const savedPro = localStorage.getItem('agrivision_is_pro');
      if (savedPro) setIsProActive(savedPro === 'true');
    }
  }, []);

  const isPlusActive = isProActive || ['plus', 'pro', 'coop'].includes(subscriptionTier.toLowerCase());

  // Tự động chuyển về Gemini nếu hết hạn gói Plus mà đang chọn Claude
  useEffect(() => {
    if (!isPlusActive && selectedModel.includes('claude')) {
      setSelectedModel('ag/gemini-3.8-flash-high');
    }
  }, [isPlusActive, selectedModel]);

  const handleSetSelectedModel = useCallback((modelId: string) => {
    if (modelId.includes('claude') && !isPlusActive) {
      setIsCoinModalOpen(true);
      return;
    }
    setSelectedModel(modelId);
  }, [isPlusActive]);

  // Helper to resolve user-scoped storage key
  const getChatStorageKey = useCallback((userId?: string) => {
    return `agrivision_chats_${userId || 'guest'}`;
  }, []);

  // Supabase Sync Helpers
  const syncProfileToSupabase = useCallback(async (user: User) => {
    try {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email.toLowerCase().trim(),
          name: user.name,
          password_hash: user.passwordHash,
          avatar_url: user.avatar_url || null,
          role: 'farmer',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    } catch (err) {
      console.warn('Supabase profile sync error:', err);
    }
  }, []);

  const setXuBalance = useCallback((balanceOrFn: number | ((prev: number) => number)) => {
    setXuBalanceState((prev) => {
      const next = typeof balanceOrFn === 'function' ? balanceOrFn(prev) : balanceOrFn;
      if (typeof window !== 'undefined') {
        localStorage.setItem('agrivision_xu_balance', next.toString());
      }
      return next;
    });
  }, []);

  const refreshXuStatus = useCallback(async () => {
    try {
      const userId = currentUser?.id;
      const email = currentUser?.email;
      const params = new URLSearchParams();
      if (userId && userId !== 'guest') params.set('userId', userId);
      if (email) params.set('email', email);

      const res = await fetch(`/api/user/status?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.user_id !== 'guest' || (!userId && !email)) {
            const bal = data.xu_balance ?? 20;
            setXuBalanceState(bal);
            setSubscriptionTier(data.subscription_tier || 'free');
            setIsProActive(Boolean(data.is_pro_active));
            if (typeof window !== 'undefined') {
              localStorage.setItem('agrivision_xu_balance', bal.toString());
              localStorage.setItem('agrivision_subscription_tier', data.subscription_tier || 'free');
              localStorage.setItem('agrivision_is_pro', Boolean(data.is_pro_active).toString());
            }
          }
        }
      }
    } catch (err) {
      console.warn('refreshXuStatus error:', err);
    }
  }, [currentUser]);

  // Tự động đồng bộ số dư Xu & Gói cước từ Database khi user thay đổi hoặc vào lại tab
  useEffect(() => {
    refreshXuStatus();
  }, [currentUser?.email, currentUser?.id, refreshXuStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => refreshXuStatus();
    const onVisChange = () => {
      if (document.visibilityState === 'visible') refreshXuStatus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [refreshXuStatus]);

  const claimDailyBonus = useCallback(async (): Promise<{ awarded: boolean; amount: number; message?: string }> => {
    try {
      const userId = currentUser?.id || 'guest';
      const res = await fetch('/api/user/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_daily_bonus', userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bonus_result?.awarded) {
          const newBal = data.xu_balance ?? (xuBalance + 3);
          setXuBalance(newBal);
          return { awarded: true, amount: 3 };
        } else {
          return {
            awarded: false,
            amount: 0,
            message: data.bonus_result?.amount === 0 ? 'Bạn đã nhận thưởng điểm danh hôm nay rồi, hãy quay lại sau 24h nhé!' : undefined,
          };
        }
      }
    } catch (e) {
      console.warn('claimDailyBonus network error:', e);
    }
    // Fallback for offline / guest demo
    setXuBalance((prev) => prev + 3);
    return { awarded: true, amount: 3 };
  }, [currentUser, xuBalance, setXuBalance]);

  const syncConversationToSupabase = useCallback(async (conv: Conversation, userId?: string) => {
    if (!userId) return;
    try {
      await supabase.from('conversations').upsert({
        id: conv.id,
        user_id: userId,
        title: conv.title,
        model: selectedModel,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase conversation sync error:', err);
    }
  }, [selectedModel]);

  const syncMessageToSupabase = useCallback(async (convId: string, msg: Message) => {
    try {
      await supabase.from('messages').upsert({
        id: msg.id,
        conversation_id: convId,
        role: msg.role,
        content: msg.content,
        image_url: msg.imageUrl || msg.annotatedImageUrl || null,
        thought: msg.thought || null,
        sources: msg.sources ? JSON.parse(JSON.stringify(msg.sources)) : null,
        timestamp: msg.timestamp,
      });
    } catch (err) {
      console.warn('Supabase message sync error:', err);
    }
  }, []);

  const deleteConversationFromSupabase = useCallback(async (convId: string) => {
    try {
      await supabase.from('conversations').delete().eq('id', convId);
    } catch (err) {
      console.warn('Supabase delete conversation error:', err);
    }
  }, []);

  // Auto-heal dangling streaming/thinking flags in loaded conversations
  const sanitizeLoadedConversations = (list: Conversation[]): Conversation[] => {
    return (list || []).map((conv) => ({
      ...conv,
      messages: (conv.messages || []).map((m) => ({
        ...m,
        isStreaming: false,
        isThinking: false,
        visionSegmenting: false,
      })),
    }));
  };

  // Load conversations for user: Supabase Cloud -> fallback localStorage
  const loadConversationsForUser = useCallback(async (userId?: string) => {
    const key = getChatStorageKey(userId);
    let loaded: Conversation[] = [];

    // 1. Try Supabase Cloud DB first if logged in
    if (userId) {
      try {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!convError && Array.isArray(convData) && convData.length > 0) {
          const convIds = convData.map((c) => c.id);
          const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', convIds)
            .order('timestamp', { ascending: true });

          const messagesByConv: Record<string, Message[]> = {};
          if (!msgError && Array.isArray(msgData)) {
            for (const m of msgData) {
              if (!messagesByConv[m.conversation_id]) {
                messagesByConv[m.conversation_id] = [];
              }
              messagesByConv[m.conversation_id].push({
                id: m.id,
                role: m.role,
                content: m.content || '',
                imageUrl: m.role === 'user' ? (m.image_url || undefined) : undefined,
                annotatedImageUrl: m.role === 'assistant' ? (m.image_url || undefined) : undefined,
                thought: m.thought || undefined,
                sources: m.sources || undefined,
                timestamp: m.timestamp || new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isStreaming: false,
                isThinking: false,
              });
            }
          }

          loaded = convData.map((c) => ({
            id: c.id,
            title: c.title,
            group: 'Today',
            updatedAt: c.updated_at,
            messages: messagesByConv[c.id] || [],
          }));

          const sanitized = sanitizeLoadedConversations(loaded);
          safeSetLocalStorage(key, sanitized);
          setConversations(sanitized);
          setIsHydrated(true);
          return;
        }
      } catch (sbErr) {
        console.warn('Supabase load fallback to local:', sbErr);
      }
    }

    // 2. Fallback to LocalStorage
    try {
      const local = localStorage.getItem(key);
      if (local) {
        loaded = JSON.parse(local);
      }
    } catch {
      // ignore
    }

    const sanitized = sanitizeLoadedConversations(loaded);
    setConversations(sanitized);
    setIsHydrated(true);
  }, [getChatStorageKey]);

  // Apply theme class to HTML element with persistence
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('agrivision-theme', newTheme);
      if (currentUser) {
        localStorage.setItem(`agrivision_settings_${currentUser.id}`, JSON.stringify({ theme: newTheme }));
      }
    } catch {
      // ignore
    }
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Font size setting with persistence
  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    try {
      localStorage.setItem('agrivision-font-size', size);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-size', size);
      const sizeMap = { small: '13px', medium: '15px', large: '17px' };
      document.documentElement.style.setProperty('--app-font-size', sizeMap[size]);
    }
  };

  const setIsWebSearchEnabled = (enabled: boolean) => {
    setIsWebSearchEnabledState(enabled);
    try {
      localStorage.setItem('agrivision-web-search', enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const setIsAutoScrollEnabled = (enabled: boolean) => {
    setIsAutoScrollEnabledState(enabled);
    try {
      localStorage.setItem('agrivision-auto-scroll', enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  // Initial load
  useEffect(() => {
    let initialTheme: ThemeMode = 'light';
    let initialFontSize: FontSizeOption = 'medium';
    let initialWebSearch = true;
    let initialAutoScroll = true;

    try {
      const savedTheme = localStorage.getItem('agrivision-theme') as ThemeMode | null;
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        initialTheme = savedTheme;
      }
      const savedSize = localStorage.getItem('agrivision-font-size') as FontSizeOption | null;
      if (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large') {
        initialFontSize = savedSize;
      }
      const savedSearch = localStorage.getItem('agrivision-web-search');
      if (savedSearch !== null) {
        initialWebSearch = savedSearch === 'true';
      }
      const savedScroll = localStorage.getItem('agrivision-auto-scroll');
      if (savedScroll !== null) {
        initialAutoScroll = savedScroll === 'true';
      }
    } catch {
      // ignore
    }

    setTheme(initialTheme);
    setFontSize(initialFontSize);
    setIsWebSearchEnabledState(initialWebSearch);
    setIsAutoScrollEnabledState(initialAutoScroll);

    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 768);

      try {
        const rawUser = localStorage.getItem('agrivision_current_user');
        if (rawUser) {
          const user: User = JSON.parse(rawUser);
          setCurrentUser(user);
          loadConversationsForUser(user.id);
        } else {
          loadConversationsForUser();
        }
      } catch {
        loadConversationsForUser();
      }
    }
  }, [loadConversationsForUser]);

  // Synchronize across browser tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      const key = getChatStorageKey(currentUser?.id);
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setConversations(sanitizeLoadedConversations(parsed));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUser?.id, getChatStorageKey]);

  // Persist conversations to localStorage cleanly via queueMicrotask
  const updateAndPersistConversations = useCallback(
    (updater: (prev: Conversation[]) => Conversation[]) => {
      setConversations((prev) => {
        const updated = updater(prev);
        queueMicrotask(() => {
          const key = getChatStorageKey(currentUser?.id);
          safeSetLocalStorage(key, updated);
        });
        return updated;
      });
    },
    [currentUser?.id, getChatStorageKey]
  );

  // Authentication: Register
  const register = async (name: string, email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = password.trim();

      // 1. Kiểm tra tài khoản đã tồn tại trên Supabase chưa
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        // Nếu tài khoản cũ bị null password_hash, tự động kích hoạt mật khẩu mới và đăng nhập
        if (!existingUser.password_hash) {
          await supabase
            .from('profiles')
            .update({
              name: name.trim(),
              password_hash: cleanPass,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUser.id);

          const healedUser: User = {
            id: existingUser.id,
            name: name.trim(),
            email: cleanEmail,
            passwordHash: cleanPass,
            createdAt: existingUser.created_at || new Date().toISOString(),
          };

          localStorage.setItem('agrivision_current_user', JSON.stringify(healedUser));
          setCurrentUser(healedUser);
          await loadConversationsForUser(healedUser.id);
          return { success: true };
        }

        return {
          success: false,
          error: 'Email này đã tồn tại. Vui lòng chuyển sang tab Đăng nhập để vào tài khoản.',
        };
      }

      // 2. Tạo ID user mới an toàn
      const newUserId = generateId('user');
      const newUser: User = {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash: cleanPass,
        createdAt: new Date().toISOString(),
      };

      // 3. Ghi vào Supabase bắt xung đột theo EMAIL (onConflict: 'email')
      const { error: insertError } = await supabase.from('profiles').upsert(
        {
          id: newUserId,
          email: cleanEmail,
          name: name.trim(),
          password_hash: cleanPass,
          role: 'farmer',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

      if (insertError) {
        console.error('Lỗi insert Supabase:', insertError);
        return { success: false, error: `Lỗi kết nối máy chủ: ${insertError.message}` };
      }

      // 4. Lưu bản sao vào localStorage để hoạt động tức thì
      let users: User[] = [];
      try {
        const localUsers = localStorage.getItem('agrivision_users');
        if (localUsers) users = JSON.parse(localUsers);
      } catch {}
      users = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
      users.push(newUser);
      localStorage.setItem('agrivision_users', JSON.stringify(users));
      localStorage.setItem('agrivision_current_user', JSON.stringify(newUser));

      setCurrentUser(newUser);

      // 5. Di chuyển các đoạn chat khách (guest) sang tài khoản mới và dọn dẹp
      const guestKey = getChatStorageKey();
      const guestChats = localStorage.getItem(guestKey);
      if (guestChats) {
        try {
          const parsed: Conversation[] = JSON.parse(guestChats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            safeSetLocalStorage(getChatStorageKey(newUser.id), parsed);
            setConversations(parsed);
            for (const conv of parsed) {
              syncConversationToSupabase(conv, newUser.id);
            }
          }
          localStorage.removeItem(guestKey);
        } catch {}
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error)?.message || 'Lỗi đăng ký tài khoản' };
    }
  };

  // Authentication: Login
  const login = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = password.trim();

      // 1. Truy vấn trực tiếp tài khoản từ Supabase Cloud Database
      const { data: dbUser, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbError) {
        console.warn('Supabase query error in login:', dbError);
      }

      if (dbUser) {
        // Tự động chữa lành nếu tài khoản cũ chưa có password_hash
        if (!dbUser.password_hash) {
          await supabase
            .from('profiles')
            .update({ password_hash: cleanPass })
            .eq('id', dbUser.id);
          dbUser.password_hash = cleanPass;
        }

        if (dbUser.password_hash !== cleanPass) {
          return { success: false, error: 'Mật khẩu không chính xác' };
        }

        const loggedUser: User = {
          id: dbUser.id,
          name: dbUser.name || 'Người dùng',
          email: dbUser.email,
          passwordHash: dbUser.password_hash,
          createdAt: dbUser.created_at || new Date().toISOString(),
          avatar_url: dbUser.avatar_url || undefined,
        };

        // Lưu session vào localStorage
        localStorage.setItem('agrivision_current_user', JSON.stringify(loggedUser));
        setCurrentUser(loggedUser);

        // Đồng bộ danh sách users cục bộ
        try {
          let users: User[] = [];
          const localUsers = localStorage.getItem('agrivision_users');
          if (localUsers) users = JSON.parse(localUsers);
          users = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
          users.push(loggedUser);
          localStorage.setItem('agrivision_users', JSON.stringify(users));
        } catch {}

        // Tải toàn bộ danh sách hội thoại từ Cloud về
        await loadConversationsForUser(loggedUser.id);
        refreshXuStatus();
        return { success: true };
      }

      // 2. Dự phòng: Nếu mất mạng hoặc chưa kịp lên DB, kiểm tra localStorage
      let localUsers: User[] = [];
      try {
        const raw = localStorage.getItem('agrivision_users');
        if (raw) localUsers = JSON.parse(raw);
      } catch {}

      const localMatch = localUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === cleanPass
      );

      if (localMatch) {
        syncProfileToSupabase(localMatch);
        localStorage.setItem('agrivision_current_user', JSON.stringify(localMatch));
        setCurrentUser(localMatch);
        await loadConversationsForUser(localMatch.id);
        return { success: true };
      }

      return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
    } catch (err: unknown) {
      return { success: false, error: (err as Error)?.message || 'Lỗi đăng nhập' };
    }
  };

  // Authentication: Logout
  const logout = () => {
    stopStreaming();
    setCurrentUser(null);
    try {
      localStorage.removeItem('agrivision_current_user');
    } catch {
      // ignore
    }
    loadConversationsForUser();
  };

  // Clear chat history for current user
  const clearChatHistory = () => {
    stopStreaming();
    if (currentUser?.id) {
      supabase.from('conversations').delete().eq('user_id', currentUser.id).then();
    }
    updateAndPersistConversations(() => []);
    setActiveConversationId(null);
  };

  // Export JSON Backup
  const exportBackupJson = () => {
    const backupData = {
      project: 'AgriVision',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : null,
      conversations,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrivision-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // Stop active AI stream
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSendingRef.current = false;
    setIsStreaming(false);
  }, []);

  const createNewChat = () => {
    stopStreaming();
    setActiveConversationId(null);
  };

  const selectConversation = (id: string) => {
    stopStreaming();
    setActiveConversationId(id);
  };

  const deleteConversation = (id: string) => {
    stopStreaming();
    deleteConversationFromSupabase(id);
    updateAndPersistConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const renameConversation = (id: string, newTitle: string) => {
    updateAndPersistConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, title: newTitle };
          syncConversationToSupabase(updated, currentUser?.id);
          return updated;
        }
        return c;
      })
    );
  };

  const togglePinConversation = (id: string) => {
    updateAndPersistConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, isPinned: !c.isPinned };
          syncConversationToSupabase(updated, currentUser?.id);
          return updated;
        }
        return c;
      })
    );
  };

  // Multi-step Agent Loop with Web Search & Reasoning Streaming
  const sendMessage = async (content: string, imageUrl?: string, thinkActive = false) => {
    const trimmedContent = content.trim();
    if ((!trimmedContent && !imageUrl) || isStreaming || isSendingRef.current) return;

    if (!isProActive && xuBalance <= 0) {
      setIsCoinModalOpen(true);
      return;
    }

    // Mutex lock to prevent double clicks / race conditions
    isSendingRef.current = true;

    const userMessage: Message = {
      id: generateId('msg-user'),
      role: 'user',
      content: trimmedContent || (imageUrl ? 'Chẩn đoán hình ảnh bệnh cây đính kèm' : ''),
      imageUrl: imageUrl || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let targetConvId = activeConversationId;
    let currentMessages: Message[] = [];

    // Verify targetConvId exists in current memory state
    const existingConv = targetConvId ? conversationsRef.current.find((c) => c.id === targetConvId) : null;

    if (!targetConvId || !existingConv) {
      const titleCandidate = trimmedContent || 'Chẩn đoán hình ảnh';
      const newTitle = titleCandidate.length > 32 ? `${titleCandidate.slice(0, 32)}...` : titleCandidate;
      targetConvId = generateId('conv');
      const newConv: Conversation = {
        id: targetConvId,
        title: newTitle,
        group: 'Today',
        updatedAt: new Date().toISOString(),
        messages: [userMessage],
      };
      updateAndPersistConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(targetConvId);
      currentMessages = [userMessage];

      // Sync new conversation to Supabase
      syncConversationToSupabase(newConv, currentUser?.id);

      // Fast titling trigger
      const convIdToName = targetConvId;
      fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedContent || 'Chẩn đoán hình ảnh' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.title) {
            updateAndPersistConversations((prev) =>
              prev.map((c) => {
                if (c.id === convIdToName) {
                  const updatedWithTitle = { ...c, title: data.title };
                  syncConversationToSupabase(updatedWithTitle, currentUser?.id);
                  return updatedWithTitle;
                }
                return c;
              })
            );
          }
        })
        .catch((err) => console.warn('Fast titling trigger error:', err));
    } else {
      currentMessages = [...existingConv.messages, userMessage];
      updateAndPersistConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: [...c.messages, userMessage],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    }

    // Sync user message to Supabase
    syncMessageToSupabase(targetConvId, userMessage);

    // Set up placeholder for streaming response
    const aiMessageId = generateId('msg-ai');
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      isThinking: true,
      thought: '',
    };

    updateAndPersistConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? { ...c, messages: [...c.messages, initialAiMessage] }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Prepare full API history for AI Gateway
    const apiMessages = currentMessages.map((m) => {
      if (m.imageUrl) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || 'Chẩn đoán hình ảnh cây trồng' },
            { type: 'image_url', image_url: { url: m.imageUrl } },
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const startTime = Date.now();
    let accumulatedContent = '';
    let accumulatedThought = '';
    let isThinking = true;
    let thinkingSeconds = 0;
    let searchingQuery: string | undefined = undefined;
    let currentSources: SearchSource[] = [];
    let currentAnnotatedImageUrl: string | undefined = undefined;
    let isVisionSegmenting = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLock: any = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        // @ts-ignore
        wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch {}
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel || 'ag/gemini-3.8-flash-high',
          messages: apiMessages,
          webSearchEnabled: isWebSearchEnabled,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Gateway Error (${response.status}): ${errorText || response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        let buffer = '';
        let lastRenderTime = 0;
        let streamFinished = false;

        const syncUiMessage = (force = false) => {
          const now = Date.now();
          if (!force && now - lastRenderTime < 45) return;
          lastRenderTime = now;

          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMessageId
                        ? {
                            ...m,
                            content: accumulatedContent,
                            thought: accumulatedThought || undefined,
                            isThinking,
                            thinkingSeconds:
                              thinkingSeconds ||
                              (accumulatedThought
                                ? Math.max(1, Math.round((Date.now() - startTime) / 1000))
                                : undefined),
                            searchingQuery,
                            sources: currentSources.length > 0 ? currentSources : undefined,
                            annotatedImageUrl: currentAnnotatedImageUrl,
                            visionSegmenting: isVisionSegmenting,
                            isStreaming: !force,
                          }
                        : m
                    ),
                  }
                : c
            )
          );
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done || streamFinished) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') {
              streamFinished = true;
              break;
            }
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(dataStr);

                // 1. Thinking / Reasoning token
                if (parsed.type === 'thought' && parsed.token) {
                  isThinking = true;
                  accumulatedThought += parsed.token;
                }
                // 2. Searching indicator
                else if (parsed.type === 'searching') {
                  searchingQuery = parsed.query;
                }
                // 3. Search sources returned from Web Search
                else if (parsed.type === 'sources' && Array.isArray(parsed.sources)) {
                  const existingUrls = new Set(currentSources.map((s) => s.url));
                  const newSources = parsed.sources.filter((s: SearchSource) => !existingUrls.has(s.url));
                  currentSources = [...currentSources, ...newSources];
                  searchingQuery = undefined;
                }
                // 3b. Computer Vision Lesion Segmentation indicator
                else if (parsed.type === 'vision_segmenting') {
                  isVisionSegmenting = true;
                }
                // 3c. Computer Vision HUD Result
                else if (parsed.type === 'vision_hud' && parsed.annotated_image_url) {
                  isVisionSegmenting = false;
                  currentAnnotatedImageUrl = parsed.annotated_image_url;
                }
                // 4. Content token
                else if (parsed.type === 'content' && parsed.token) {
                  if (isThinking) {
                    isThinking = false;
                    thinkingSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
                  }
                  accumulatedContent += parsed.token;
                }
                // 5. Fallback delta.content
                else if (parsed.choices?.[0]?.delta?.content) {
                  if (isThinking) {
                    isThinking = false;
                    thinkingSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
                  }
                  accumulatedContent += parsed.choices[0].delta.content;
                }

                syncUiMessage(false);
              } catch {
                // Ignore incomplete JSON chunks in SSE stream
              }
            }
          }
          if (streamFinished) break;
        }

        // Final UI synchronization after streaming ends
        syncUiMessage(true);
      }

      if (accumulatedThought && !thinkingSeconds) {
        thinkingSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      }

      const finalAiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: accumulatedContent,
        thought: accumulatedThought || undefined,
        isStreaming: false,
        isThinking: false,
        searchingQuery: undefined,
        thinkingSeconds:
          thinkingSeconds ||
          (accumulatedThought ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : undefined),
        sources: currentSources.length > 0 ? currentSources : undefined,
        annotatedImageUrl: currentAnnotatedImageUrl,
        visionSegmenting: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Mark streaming complete and persist to storage
      updateAndPersistConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === aiMessageId ? finalAiMessage : m)),
              }
            : c
        )
      );

      // Sync completed assistant message to Supabase
      syncMessageToSupabase(targetConvId, finalAiMessage);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // Preserving accumulated content on user cancellation
        updateAndPersistConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          content: accumulatedContent || '*(Đã dừng phản hồi)*',
                          thought: accumulatedThought || undefined,
                          isStreaming: false,
                          isThinking: false,
                          annotatedImageUrl: currentAnnotatedImageUrl,
                          sources: currentSources.length > 0 ? currentSources : undefined,
                        }
                      : m
                  ),
                }
              : c
          )
        );
        return;
      }
      console.error('AgriVision Streaming Error:', err);
      const errorMessage = (err as Error)?.message || 'An unexpected error occurred';

      // Resilient preservation: Never wipe out already streamed content, thoughts, or annotated image HUD
      updateAndPersistConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        content:
                          accumulatedContent ||
                          (accumulatedThought
                            ? '⚠️ **Mạng bị gián đoạn khi đang suy nghĩ**: Do bạn vừa chuyển ứng dụng hoặc mạng bị ngắt quãng. Bạn vui lòng bấm nút tạo lại bên dưới để em chẩn đoán lại nghen! 🌿'
                            : `⚠️ **Mất kết nối mạng**: ${errorMessage}. Vui lòng kiểm tra lại kết nối và thử lại.`),
                        thought: accumulatedThought || undefined,
                        isStreaming: false,
                        isThinking: false,
                        thinkingSeconds:
                          thinkingSeconds ||
                          (accumulatedThought ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : undefined),
                        sources: currentSources.length > 0 ? currentSources : undefined,
                        annotatedImageUrl: currentAnnotatedImageUrl,
                        visionSegmenting: false,
                        searchingQuery: undefined,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      if (!isProActive) {
        setXuBalance((prev) => Math.max(0, prev - 1));
      }
      if (wakeLock) {
        try {
          wakeLock.release();
        } catch {}
      }
      isSendingRef.current = false;
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Update user avatar & persist to Supabase + localStorage
  const updateAvatar = useCallback(async (compressedBase64: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedUser: User = currentUser
        ? { ...currentUser, avatar_url: compressedBase64 }
        : {
            id: 'guest',
            name: 'Khách nhà nông',
            email: '',
            passwordHash: '',
            createdAt: new Date().toISOString(),
            avatar_url: compressedBase64,
          };

      setCurrentUser(updatedUser);

      if (typeof window !== 'undefined') {
        localStorage.setItem('agrivision_current_user', JSON.stringify(updatedUser));
        localStorage.setItem('agrivision_custom_avatar', compressedBase64);
      }

      // If user has Supabase account, sync directly to profiles table
      if (currentUser?.id && currentUser.id !== 'guest') {
        const { error } = await supabase
          .from('profiles')
          .update({
            avatar_url: compressedBase64,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);

        if (error) {
          console.warn('Supabase avatar update warning:', error);
        }
      }

      setCustomAvatar(compressedBase64);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error)?.message || 'Lỗi lưu ảnh đại diện' };
    }
  }, [currentUser]);

  const userProfile = {
    name: currentUser?.name || 'Khách nhà nông',
    email: currentUser?.email || '',
    initials: currentUser ? getInitials(currentUser.name) : 'AV',
    avatar_url: currentUser?.avatar_url || customAvatar,
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        selectedModel,
        setSelectedModel: handleSetSelectedModel,
        theme,
        setTheme,
        fontSize,
        setFontSize,
        isWebSearchEnabled,
        setIsWebSearchEnabled,
        isAutoScrollEnabled,
        setIsAutoScrollEnabled,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        isSettingsOpen,
        setIsSettingsOpen,
        isHelpOpen,
        setIsHelpOpen,
        isUpgradeOpen,
        setIsUpgradeOpen,
        isCoinModalOpen,
        setIsCoinModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        xuBalance,
        setXuBalance,
        subscriptionTier,
        isProActive,
        claimDailyBonus,
        refreshXuStatus,
        currentUser,
        login,
        register,
        logout,
        clearChatHistory,
        exportBackupJson,
        updateAvatar,
        isStreaming,
        stopStreaming,
        isHydrated,
        createNewChat,
        selectConversation,
        deleteConversation,
        renameConversation,
        togglePinConversation,
        sendMessage,
        userProfile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
