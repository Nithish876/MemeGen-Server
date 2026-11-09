export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  role: 'creator' | 'pro' | 'admin' | string;
  createdAt?: string;
}

export interface UserRecord extends UserProfile {
  passwordHash: string;
}

export interface AuthSuccessData {
  user: UserProfile;
  token: string;
}

export interface TextSlot {
  id: string;
  placeholder: string;
  defaultYPercent: number;
}

export interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  boxCount: number;
  category: string;
  tags: string[];
  description: string;
  usageCount: number;
  defaultTextSlots?: TextSlot[];
}

export interface TextLayer {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
  fontSize: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUppercase?: boolean;
  alignment?: 'left' | 'center' | 'right';
  fontFamily?: string;
  rotation?: number;
  opacity?: number;
}

export interface CanvasSettings {
  aspectRatio?: string;
  backgroundColor?: string;
  padding?: number;
  zoom?: number;
  fitToScreen?: boolean;
  showGrid?: boolean;
}

export interface MemeDraft {
  id: string;
  userId: string;
  templateId: string;
  template?: MemeTemplate;
  memeTitle: string;
  title?: string;
  textLayers: TextLayer[];
  canvasSettings: CanvasSettings;
  previewImageUrl?: string | null;
  previewUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedMeme {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  imageUrl: string;
  textLayers: TextLayer[];
  canvasSettings?: CanvasSettings;
  width: number;
  height: number;
  likes: number;
  comments: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    name: string;
    avatarUrl?: string;
  };
}

export interface ApiPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: ApiPagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: 'free' | 'pro' | 'enterprise' | string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled' | 'refunded';
  orderId: string;
  transactionId?: string;
  paymentMethod: string;
  createdAt: string;
}

export interface TrafficEvent {
  id: string;
  path: string;
  referrer?: string;
  device?: string;
  browser?: string;
  ip?: string;
  userId?: string;
  timestamp: string;
}

export interface AiCaptionSuggestion {
  id: string;
  topText: string;
  bottomText: string;
  singleText: string;
  tone: string;
  score?: number;
}

export interface AdminDashboardStats {
  kpis: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    totalUsers: number;
    activeProSubscribers: number;
    totalMemes: number;
    totalDrafts: number;
    totalPageViews: number;
    uniqueVisitors: number;
    conversionRate: number;
  };
  trafficChart: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
  revenueChart: Array<{
    month: string;
    revenue: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    percentage: number;
  }>;
  topReferrers: Array<{
    source: string;
    visitors: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'signup' | 'purchase' | 'meme_created' | 'draft_saved';
    title: string;
    description: string;
    timestamp: string;
    meta?: any;
  }>;
  systemHealth: {
    status: 'optimal' | 'degraded' | 'maintenance';
    uptime: string;
    database: string;
    apiLatencyMs: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
