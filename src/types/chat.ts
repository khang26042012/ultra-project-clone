export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface SearchSource {
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  imageUrl?: string;
  annotatedImageUrl?: string;
  visionSegmenting?: boolean;
  timestamp: string;
  isStreaming?: boolean;
  thought?: string;
  isThinking?: boolean;
  thinkingSeconds?: number;
  searchingQuery?: string;
  sources?: SearchSource[];
  model?: string;
}

export type TimeGroup = 'Today' | 'Yesterday' | 'Previous 7 Days';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
  group: TimeGroup;
  isPinned?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
  isDefault?: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type FontSizeOption = 'small' | 'medium' | 'large';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  avatar_url?: string;
}

export interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  isWebSearchEnabled: boolean;
  setIsWebSearchEnabled: (enabled: boolean) => void;
  isAutoScrollEnabled: boolean;
  setIsAutoScrollEnabled: (enabled: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (open: boolean) => void;
  isCoinModalOpen: boolean;
  setIsCoinModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  xuBalance: number;
  setXuBalance: (balance: number | ((prev: number) => number)) => void;
  subscriptionTier: string;
  isProActive: boolean;
  claimDailyBonus: () => Promise<{ awarded: boolean; amount: number; message?: string }>;
  refreshXuStatus: () => Promise<void>;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearChatHistory: () => void;
  exportBackupJson: () => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  isHydrated: boolean;
  createNewChat: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  sendMessage: (content: string, imageUrl?: string, thinkActive?: boolean) => Promise<void>;
  updateAvatar: (base64: string) => Promise<{ success: boolean; error?: string }>;
  userProfile: {
    name: string;
    email: string;
    plan?: string;
    initials: string;
    avatar_url?: string;
  };
}
