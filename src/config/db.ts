import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { INITIAL_TEMPLATES, INITIAL_COMMUNITY_MEMES } from '../constants/initialTemplates.js';
import type {
  UserRecord,
  UserProfile,
  MemeTemplate,
  MemeDraft,
  SavedMeme,
  PaginatedResult,
  PurchaseRecord,
  TrafficEvent,
  AdminDashboardStats,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'local-store.json');

// Ensure local data dir exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Ignore error
  }
}

interface LocalStoreStructure {
  profiles: UserRecord[];
  templates: MemeTemplate[];
  meme_drafts: MemeDraft[];
  memes: any[];
  purchases: PurchaseRecord[];
  traffic: TrafficEvent[];
  activity: Array<{
    id: string;
    type: 'signup' | 'purchase' | 'meme_created' | 'draft_saved';
    title: string;
    description: string;
    timestamp: string;
    meta?: any;
  }>;
}

// In-memory / JSON fallback store structure
let localStore: LocalStoreStructure = {
  profiles: [],
  templates: [...INITIAL_TEMPLATES],
  meme_drafts: [],
  memes: [
    ...INITIAL_COMMUNITY_MEMES.map((m) => ({
      id: m.id,
      user_id: 'system',
      template_id: 'shinchan-not-that-special',
      title: m.title,
      image_url: m.imageUrl,
      text_layers: [],
      canvas_settings: {},
      width: 600,
      height: 600,
      likes: m.likes || 0,
      comments: m.comments || 0,
      is_public: true,
      author_name: m.authorName,
      author_avatar: m.authorAvatar,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  ],
  purchases: [],
  traffic: [],
  activity: [],
};

// Load saved local data if available
if (fs.existsSync(STORE_FILE)) {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    localStore = {
      ...localStore,
      ...parsed,
      templates:
        parsed.templates && parsed.templates.length > 0 ? parsed.templates : localStore.templates,
      purchases: parsed.purchases || [],
      traffic: parsed.traffic || [],
      activity: parsed.activity || [],
    };
  } catch {
    // Keep defaults
  }
}

// Ensure administrative account and seed analytics exist
function ensureSeedData() {
  let modified = false;

  // 1. Ensure Admin Superuser exists
  const hasAdmin = localStore.profiles.some((p) => p.role === 'admin' || p.email === 'admin@memegen.com');
  if (!hasAdmin) {
    localStore.profiles.push({
      id: 'admin-superuser-001',
      email: 'admin@memegen.com',
      passwordHash: '$2b$10$pD/oyC/E6ON/PdSvH4FUSOBgGlhfwF.XL4ViVYTmlBmRjjIut7WNm', // AdminPassword123!
      fullName: 'Admin Superuser',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminSuperuser',
      role: 'admin',
      createdAt: '2026-10-01T00:00:00.000Z',
    });
    modified = true;
  }

  // 2. Ensure Creator account exists
  const hasCreator = localStore.profiles.some((p) => p.email === 'creator@memegen.com');
  if (!hasCreator) {
    localStore.profiles.push({
      id: 'creator-test-001',
      email: 'creator@memegen.com',
      passwordHash: '$2b$10$sH0bazYQaFbfXPPaK5nBGuPSiVTSW32ZnbfoavHVFqQK61op1E3Eu', // CreatorPassword123!
      fullName: 'Test Creator',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TestCreator',
      role: 'creator',
      createdAt: '2026-10-15T00:00:00.000Z',
    });
    modified = true;
  }

  // 3. Ensure Seed Purchases for Admin Dashboard
  if (!localStore.purchases || localStore.purchases.length === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    localStore.purchases = [
      {
        id: 'pur-101',
        userId: 'creator-test-001',
        userEmail: 'creator@memegen.com',
        userName: 'Test Creator',
        planId: 'pro',
        billingCycle: 'monthly',
        amount: 9.99,
        currency: 'USD',
        status: 'active',
        orderId: 'MH-SUB-849102',
        transactionId: 'TXN_PRO_98124',
        paymentMethod: 'Credit Card',
        createdAt: new Date(now - 2 * day).toISOString(),
      },
      {
        id: 'pur-102',
        userId: 'user-ext-201',
        userEmail: 'alex.design@acme.io',
        userName: 'Alex Design',
        planId: 'pro',
        billingCycle: 'yearly',
        amount: 99.0,
        currency: 'USD',
        status: 'active',
        orderId: 'MH-SUB-674312',
        transactionId: 'TXN_ANN_56312',
        paymentMethod: 'PayPal',
        createdAt: new Date(now - 4 * day).toISOString(),
      },
      {
        id: 'pur-103',
        userId: 'user-ext-301',
        userEmail: 'memeops@agency.co',
        userName: 'Meme Agency',
        planId: 'enterprise',
        billingCycle: 'monthly',
        amount: 29.99,
        currency: 'USD',
        status: 'active',
        orderId: 'MH-SUB-439018',
        transactionId: 'TXN_ENT_12903',
        paymentMethod: 'Stripe',
        createdAt: new Date(now - 7 * day).toISOString(),
      },
      {
        id: 'pur-104',
        userId: 'user-ext-401',
        userEmail: 'viral.creator@studio.com',
        userName: 'Elena Viral',
        planId: 'pro',
        billingCycle: 'monthly',
        amount: 9.99,
        currency: 'USD',
        status: 'active',
        orderId: 'MH-SUB-908234',
        transactionId: 'TXN_PRO_77412',
        paymentMethod: 'Apple Pay',
        createdAt: new Date(now - 12 * day).toISOString(),
      },
      {
        id: 'pur-105',
        userId: 'user-ext-501',
        userEmail: 'sam.rodriguez@techmemes.org',
        userName: 'Sam Rodriguez',
        planId: 'pro',
        billingCycle: 'monthly',
        amount: 9.99,
        currency: 'USD',
        status: 'completed',
        orderId: 'MH-SUB-112093',
        transactionId: 'TXN_PRO_33912',
        paymentMethod: 'Credit Card',
        createdAt: new Date(now - 18 * day).toISOString(),
      },
    ];
    modified = true;
  }

  // 4. Ensure Seed Traffic for Traffic Monitor & Chart
  if (!localStore.traffic || localStore.traffic.length < 20) {
    const paths = ['/', '/editor', '/templates', '/pricing', '/community', '/gif-generator'];
    const devices = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet'];
    const referrers = ['Google Search', 'Direct', 'Direct', 'Reddit', 'Twitter / X', 'ProductHunt'];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    localStore.traffic = [];
    for (let i = 0; i < 90; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const timeOffset = daysAgo * day + Math.floor(Math.random() * day);
      const path = paths[Math.floor(Math.random() * paths.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];
      localStore.traffic.push({
        id: `trf-${i + 1}`,
        path,
        referrer,
        device,
        browser: device === 'mobile' ? 'Mobile Safari' : 'Chrome',
        ip: `192.168.1.${(i % 30) + 10}`,
        timestamp: new Date(now - timeOffset).toISOString(),
      });
    }
    modified = true;
  }

  // 5. Ensure Seed Activity stream
  if (!localStore.activity || localStore.activity.length === 0) {
    localStore.activity = [
      {
        id: 'act-1',
        type: 'purchase',
        title: 'New Subscription',
        description: 'Test Creator upgraded to Pro Plan ($9.99/mo)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'act-2',
        type: 'meme_created',
        title: 'Meme Published',
        description: 'New meme "Senior Dev vs Junior Dev" saved to library',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'act-3',
        type: 'signup',
        title: 'New User Registered',
        description: 'alex.design@acme.io registered a new account',
        timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
      },
    ];
    modified = true;
  }

  if (modified) {
    persistLocalStore();
  }
}

ensureSeedData();

function persistLocalStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch {
    // Non-fatal
  }
}

// -------------------------------------------------------------
// Database Service Interface
// -------------------------------------------------------------
export const db = {
  // -----------------------------------------------------------
  // USERS / PROFILES
  // -----------------------------------------------------------
  users: {
    async findByEmail(email: string): Promise<UserRecord | null> {
      const normalizedEmail = email.toLowerCase().trim();
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              email: data.email,
              passwordHash: data.password_hash,
              fullName: data.full_name,
              avatarUrl: data.avatar_url,
              role: data.role || 'creator',
              createdAt: data.created_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (profiles findByEmail):', msg);
        }
      }

      const found = localStore.profiles.find((u) => u.email.toLowerCase() === normalizedEmail);
      return found ? { ...found } : null;
    },

    async findById(id: string): Promise<UserRecord | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              email: data.email,
              passwordHash: data.password_hash,
              fullName: data.full_name,
              avatarUrl: data.avatar_url,
              role: data.role || 'creator',
              createdAt: data.created_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (profiles findById):', msg);
        }
      }

      const found = localStore.profiles.find((u) => u.id === id);
      return found ? { ...found } : null;
    },

    async create({
      email,
      passwordHash,
      fullName,
      avatarUrl,
      role = 'creator',
    }: {
      email: string;
      passwordHash: string;
      fullName: string;
      avatarUrl?: string;
      role?: string;
    }): Promise<UserRecord> {
      const normalizedEmail = email.toLowerCase().trim();
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const avatar =
        avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`;

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              id,
              email: normalizedEmail,
              password_hash: passwordHash,
              full_name: fullName,
              avatar_url: avatar,
              role,
            })
            .select()
            .single();

          if (!error && data) {
            return {
              id: data.id,
              email: data.email,
              passwordHash: data.password_hash,
              fullName: data.full_name,
              avatarUrl: data.avatar_url,
              role: data.role,
              createdAt: data.created_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase insert error (profiles):', msg);
        }
      }

      const newUser: UserRecord = {
        id,
        email: normalizedEmail,
        passwordHash,
        fullName,
        avatarUrl: avatar,
        role,
        createdAt,
      };

      localStore.profiles.push(newUser);
      persistLocalStore();
      return { ...newUser };
    },

    async getAll({
      page = 1,
      limit = 50,
      search,
      role,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    } = {}): Promise<PaginatedResult<UserProfile & { memesCount: number; purchasesCount: number }>> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase.from('profiles').select('*', { count: 'exact' });

          if (role && role !== 'all') {
            query = query.eq('role', role);
          }

          if (search && search.trim()) {
            const q = search.trim();
            query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
          }

          query = query.order('created_at', { ascending: false });
          const from = (page - 1) * limit;
          const to = from + limit - 1;
          const { data, count, error } = await query.range(from, to);

          if (!error && data) {
            // Count memes and purchases for these users from Supabase
            const { data: allMemes } = await supabase.from('memes').select('user_id');
            const { data: allPurchases } = await supabase.from('purchases').select('user_id, user_email');

            const items = data.map((u: any) => {
              const memesCount = (allMemes || []).filter((m: any) => m.user_id === u.id).length;
              const purchasesCount = (allPurchases || []).filter(
                (p: any) => p.user_id === u.id || p.user_email === u.email
              ).length;

              return {
                id: u.id,
                fullName: u.full_name || u.fullName || 'Creator',
                email: u.email,
                avatarUrl: u.avatar_url || u.avatarUrl || '/Profille/no-dp_16.webp',
                role: u.role || 'creator',
                createdAt: u.created_at || u.createdAt || new Date().toISOString(),
                memesCount,
                purchasesCount,
              };
            });

            const totalItems = count !== null && count !== undefined ? count : items.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;

            return {
              items,
              pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
              },
            };
          }
        } catch (err: unknown) {
          console.warn('Supabase query error (users.getAll):', err);
        }
      }

      let users = [...localStore.profiles];

      if (role && role !== 'all') {
        users = users.filter((u) => u.role === role);
      }

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        users = users.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
      }

      const totalItems = users.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginated = users.slice(startIndex, startIndex + limit);

      const items = paginated.map((u) => {
        const memesCount = localStore.memes.filter(
          (m) => m.userId === u.id || m.user_id === u.id
        ).length;
        const purchasesCount = (localStore.purchases || []).filter(
          (p) => p.userId === u.id || p.userEmail === u.email
        ).length;
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          role: u.role,
          createdAt: u.createdAt,
          memesCount,
          purchasesCount,
        };
      });

      return {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    async updateRole(id: string, role: string): Promise<UserProfile | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

          if (!error && data) {
            const user = localStore.profiles.find((u) => u.id === id);
            if (user) user.role = role;
            persistLocalStore();

            return {
              id: data.id,
              email: data.email,
              fullName: data.full_name || data.fullName,
              avatarUrl: data.avatar_url || data.avatarUrl,
              role: data.role,
              createdAt: data.created_at,
            };
          }
        } catch (err) {
          console.warn('Supabase updateRole error:', err);
        }
      }

      const user = localStore.profiles.find((u) => u.id === id);
      if (!user) return null;
      user.role = role;
      persistLocalStore();
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      };
    },

    async updatePassword(id: string, newPasswordHash: string): Promise<boolean> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (!error) {
            const user = localStore.profiles.find((u) => u.id === id);
            if (user) user.passwordHash = newPasswordHash;
            persistLocalStore();
            return true;
          }
        } catch (err) {
          console.warn('Supabase updatePassword error:', err);
        }
      }

      const user = localStore.profiles.find((u) => u.id === id);
      if (!user) return false;
      user.passwordHash = newPasswordHash;
      persistLocalStore();
      return true;
    },
  },

  // -----------------------------------------------------------
  // TEMPLATES
  // -----------------------------------------------------------
  templates: {
    async getAll({
      category,
      search,
      page = 1,
      limit = 50,
      sortBy = 'popular',
    }: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
    } = {}): Promise<PaginatedResult<MemeTemplate>> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase.from('templates').select('*', { count: 'exact' });

          if (category && category !== 'All' && category !== 'all') {
            query = query.ilike('category', category);
          }

          if (search && search.trim()) {
            query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
          }

          if (sortBy === 'popular') {
            query = query.order('usage_count', { ascending: false });
          } else if (sortBy === 'name') {
            query = query.order('name', { ascending: true });
          } else {
            query = query.order('created_at', { ascending: false });
          }

          const from = (page - 1) * limit;
          const to = from + limit - 1;
          const { data, error, count } = await query.range(from, to);

          if (!error && data && data.length > 0) {
            const items: MemeTemplate[] = data.map((t) => ({
              id: t.id,
              name: t.name,
              imageUrl: t.image_url,
              width: t.width,
              height: t.height,
              boxCount: t.box_count,
              category: t.category,
              tags: t.tags || [],
              description: t.description || '',
              usageCount: t.usage_count || 0,
              defaultTextSlots: t.default_text_slots || [],
            }));

            const totalItems = count || items.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;

            return {
              items,
              pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
              },
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (templates):', msg);
        }
      }

      // Local fallback
      let filtered = [...localStore.templates];

      if (category && category !== 'All' && category !== 'all') {
        const catLower = category.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.category.toLowerCase() === catLower ||
            t.tags?.some((tg) => tg.toLowerCase() === catLower)
        );
      }

      if (search && search.trim()) {
        const queryLower = search.toLowerCase().trim();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(queryLower) ||
            t.description?.toLowerCase().includes(queryLower) ||
            t.tags?.some((tg) => tg.toLowerCase().includes(queryLower))
        );
      }

      if (sortBy === 'popular') {
        filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      } else if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const start = (page - 1) * limit;
      const paginatedItems = filtered.slice(start, start + limit);

      return {
        items: paginatedItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    async getById(id: string): Promise<MemeTemplate | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              name: data.name,
              imageUrl: data.image_url,
              width: data.width,
              height: data.height,
              boxCount: data.box_count,
              category: data.category,
              tags: data.tags || [],
              description: data.description || '',
              usageCount: data.usage_count || 0,
              defaultTextSlots: data.default_text_slots || [],
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (template getById):', msg);
        }
      }

      const found = localStore.templates.find((t) => t.id === id);
      return found ? { ...found } : null;
    },

    async seedIfEmpty(): Promise<void> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { count, error } = await supabase
            .from('templates')
            .select('*', { count: 'exact', head: true });

          if (!error && count === 0) {
            console.log('🌱 Seeding initial meme templates into Supabase...');
            const rows = INITIAL_TEMPLATES.map((t) => ({
              id: t.id,
              name: t.name,
              image_url: t.imageUrl,
              width: t.width,
              height: t.height,
              box_count: t.boxCount,
              category: t.category,
              tags: t.tags,
              description: t.description,
              usage_count: t.usageCount,
              default_text_slots: t.defaultTextSlots || [],
            }));
            await supabase.from('templates').insert(rows);
            console.log(`✅ Successfully seeded ${rows.length} templates into Supabase.`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Could not auto-seed templates into Supabase:', msg);
        }
      }
    },
  },

  // -----------------------------------------------------------
  // MEME DRAFTS (Auto-save / Syncing of Editing State)
  // -----------------------------------------------------------
  drafts: {
    async saveDraft({
      id,
      userId,
      templateId,
      template,
      memeTitle,
      title,
      textLayers,
      canvasSettings,
      previewImageUrl,
      previewUrl,
    }: {
      id?: string | null;
      userId: string;
      templateId?: string;
      template?: MemeTemplate;
      memeTitle?: string;
      title?: string;
      textLayers?: any[];
      canvasSettings?: any;
      previewImageUrl?: string | null;
      previewUrl?: string | null;
    }): Promise<MemeDraft> {
      const now = new Date().toISOString();
      const draftId = id || crypto.randomUUID();
      const actualTemplateId = templateId || template?.id || 'shinchan-not-that-special';
      const actualTitle = memeTitle || title || 'Untitled Meme';
      const actualPreview = previewImageUrl || previewUrl || null;

      const matchedTemplate: MemeTemplate =
        template ||
        localStore.templates.find((t) => t.id === actualTemplateId) || {
          id: actualTemplateId,
          name: actualTitle,
          imageUrl: actualPreview || '/shinchan-meme.jpg',
          width: 600,
          height: 600,
          boxCount: 2,
          category: 'trending',
          tags: [],
          description: '',
          usageCount: 1,
        };

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('meme_drafts')
            .upsert({
              id: draftId,
              user_id: userId,
              template_id: actualTemplateId,
              meme_title: actualTitle,
              text_layers: textLayers || [],
              canvas_settings: canvasSettings || {},
              preview_image_url: actualPreview,
              updated_at: now,
            })
            .select()
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              template: matchedTemplate,
              memeTitle: data.meme_title,
              title: data.meme_title,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              previewImageUrl: data.preview_image_url,
              previewUrl: data.preview_image_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase upsert error (meme_drafts):', msg);
        }
      }

      // Local fallback
      const existingIdx = localStore.meme_drafts.findIndex(
        (d) => d.id === draftId || (d.userId === userId && d.templateId === actualTemplateId)
      );

      const record: MemeDraft = {
        id: draftId,
        userId,
        templateId: actualTemplateId,
        template: matchedTemplate,
        memeTitle: actualTitle,
        title: actualTitle,
        textLayers: textLayers || [],
        canvasSettings: canvasSettings || {},
        previewImageUrl: actualPreview,
        previewUrl: actualPreview,
        createdAt: existingIdx >= 0 ? localStore.meme_drafts[existingIdx].createdAt : now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        localStore.meme_drafts[existingIdx] = record;
      } else {
        localStore.meme_drafts.unshift(record);
      }

      db.activity.log(
        'draft_saved',
        'Draft Synced',
        `Draft "${actualTitle}" auto-saved to cloud`,
        { draftId, templateId: actualTemplateId }
      );

      persistLocalStore();
      return { ...record };
    },

    async getLatest(userId: string): Promise<MemeDraft | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('meme_drafts')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            const tmpl =
              localStore.templates.find((t) => t.id === data.template_id) || {
                id: data.template_id,
                name: data.meme_title || 'Template',
                imageUrl: data.preview_image_url || '/shinchan-meme.jpg',
                width: 600,
                height: 600,
                boxCount: 2,
                category: 'trending',
                tags: [],
                description: '',
                usageCount: 1,
              };
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              template: tmpl,
              memeTitle: data.meme_title,
              title: data.meme_title,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              previewImageUrl: data.preview_image_url,
              previewUrl: data.preview_image_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (getLatest draft):', msg);
        }
      }

      const userDrafts = localStore.meme_drafts
        .filter((d) => d.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (!userDrafts[0]) return null;
      const d = userDrafts[0];
      const tmpl =
        d.template ||
        localStore.templates.find((t) => t.id === d.templateId) || {
          id: d.templateId,
          name: d.memeTitle || 'Template',
          imageUrl: d.previewImageUrl || '/shinchan-meme.jpg',
          width: 600,
          height: 600,
          boxCount: 2,
          category: 'trending',
          tags: [],
          description: '',
          usageCount: 1,
        };
      return {
        ...d,
        template: tmpl,
        title: d.title || d.memeTitle,
        previewUrl: d.previewUrl || d.previewImageUrl,
      };
    },

    async getAllByUser(userId: string): Promise<MemeDraft[]> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('meme_drafts')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (!error && data) {
            return data.map((d) => {
              const tmpl =
                localStore.templates.find((t) => t.id === d.template_id) || {
                  id: d.template_id,
                  name: d.meme_title || 'Template',
                  imageUrl: d.preview_image_url || '/shinchan-meme.jpg',
                  width: 600,
                  height: 600,
                  boxCount: 2,
                  category: 'trending',
                  tags: [],
                  description: '',
                  usageCount: 1,
                };
              return {
                id: d.id,
                userId: d.user_id,
                templateId: d.template_id,
                template: tmpl,
                memeTitle: d.meme_title,
                title: d.meme_title,
                textLayers: d.text_layers,
                canvasSettings: d.canvas_settings,
                previewImageUrl: d.preview_image_url,
                previewUrl: d.preview_image_url,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
              };
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (getAllByUser drafts):', msg);
        }
      }

      return localStore.meme_drafts
        .filter((d) => d.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((d) => {
          const tmpl =
            d.template ||
            localStore.templates.find((t) => t.id === d.templateId) || {
              id: d.templateId,
              name: d.memeTitle || 'Template',
              imageUrl: d.previewImageUrl || '/shinchan-meme.jpg',
              width: 600,
              height: 600,
              boxCount: 2,
              category: 'trending',
              tags: [],
              description: '',
              usageCount: 1,
            };
          return {
            ...d,
            template: tmpl,
            title: d.title || d.memeTitle,
            previewUrl: d.previewUrl || d.previewImageUrl,
          };
        });
    },

    async getById(id: string, userId?: string): Promise<MemeDraft | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase.from('meme_drafts').select('*').eq('id', id);
          if (userId) {
            query = query.eq('user_id', userId);
          }
          const { data, error } = await query.maybeSingle();

          if (!error && data) {
            const tmpl =
              localStore.templates.find((t) => t.id === data.template_id) || {
                id: data.template_id,
                name: data.meme_title || 'Template',
                imageUrl: data.preview_image_url || '/shinchan-meme.jpg',
                width: 600,
                height: 600,
                boxCount: 2,
                category: 'trending',
                tags: [],
                description: '',
                usageCount: 1,
              };
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              template: tmpl,
              memeTitle: data.meme_title,
              title: data.meme_title,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              previewImageUrl: data.preview_image_url,
              previewUrl: data.preview_image_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (draft getById):', msg);
        }
      }

      const found = localStore.meme_drafts.find(
        (d) => d.id === id && (!userId || d.userId === userId)
      );
      if (!found) return null;
      const tmpl =
        found.template ||
        localStore.templates.find((t) => t.id === found.templateId) || {
          id: found.templateId,
          name: found.memeTitle || 'Template',
          imageUrl: found.previewImageUrl || '/shinchan-meme.jpg',
          width: 600,
          height: 600,
          boxCount: 2,
          category: 'trending',
          tags: [],
          description: '',
          usageCount: 1,
        };
      return {
        ...found,
        template: tmpl,
        title: found.title || found.memeTitle,
        previewUrl: found.previewUrl || found.previewImageUrl,
      };
    },

    async delete(id: string, userId?: string): Promise<boolean> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase.from('meme_drafts').delete().eq('id', id);
          if (userId) {
            query = query.eq('user_id', userId);
          }
          await query;
          return true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase delete error (draft):', msg);
        }
      }

      const initialLen = localStore.meme_drafts.length;
      localStore.meme_drafts = localStore.meme_drafts.filter(
        (d) => !(d.id === id && (!userId || d.userId === userId))
      );
      persistLocalStore();
      return localStore.meme_drafts.length < initialLen;
    },
  },

  // -----------------------------------------------------------
  // MEMES (User-Created / Exported / Published Memes)
  // -----------------------------------------------------------
  memes: {
    async create({
      userId,
      templateId,
      title,
      imageUrl,
      textLayers,
      canvasSettings,
      width = 600,
      height = 600,
      isPublic = true,
    }: {
      userId: string;
      templateId: string;
      title: string;
      imageUrl: string;
      textLayers?: any[];
      canvasSettings?: any;
      width?: number;
      height?: number;
      isPublic?: boolean;
    }): Promise<SavedMeme> {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('memes')
            .insert({
              id,
              user_id: userId,
              template_id: templateId,
              title: title || 'Untitled Meme',
              image_url: imageUrl,
              text_layers: textLayers || [],
              canvas_settings: canvasSettings || {},
              width,
              height,
              is_public: isPublic,
            })
            .select()
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              title: data.title,
              imageUrl: data.image_url,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              width: data.width,
              height: data.height,
              likes: data.likes || 0,
              comments: data.comments || 0,
              isPublic: data.is_public,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase insert error (memes):', msg);
        }
      }

      // Local fallback
      const user = localStore.profiles.find((p) => p.id === userId);
      const newMeme = {
        id,
        user_id: userId,
        template_id: templateId,
        title: title || 'Untitled Meme',
        image_url: imageUrl,
        text_layers: textLayers || [],
        canvas_settings: canvasSettings || {},
        width,
        height,
        likes: 0,
        comments: 0,
        is_public: isPublic,
        author_name: user?.fullName || 'Anonymous Creator',
        author_avatar:
          user?.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        created_at: now,
        updated_at: now,
      };

      localStore.memes.unshift(newMeme);
      persistLocalStore();

      return {
        id: newMeme.id,
        userId: newMeme.user_id,
        templateId: newMeme.template_id,
        title: newMeme.title,
        imageUrl: newMeme.image_url,
        textLayers: newMeme.text_layers,
        canvasSettings: newMeme.canvas_settings,
        width: newMeme.width,
        height: newMeme.height,
        likes: newMeme.likes,
        comments: newMeme.comments,
        isPublic: newMeme.is_public,
        createdAt: newMeme.created_at,
        updatedAt: newMeme.updated_at,
      };
    },

    async getByUser(userId: string): Promise<SavedMeme[]> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('memes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map((m) => ({
              id: m.id,
              userId: m.user_id,
              templateId: m.template_id,
              title: m.title,
              imageUrl: m.image_url,
              textLayers: m.text_layers,
              canvasSettings: m.canvas_settings,
              width: m.width,
              height: m.height,
              likes: m.likes || 0,
              comments: m.comments || 0,
              isPublic: m.is_public,
              createdAt: m.created_at,
              updatedAt: m.updated_at,
            }));
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (memes getByUser):', msg);
        }
      }

      return localStore.memes
        .filter((m) => m.user_id === userId)
        .map((m) => ({
          id: m.id,
          userId: m.user_id,
          templateId: m.template_id,
          title: m.title,
          imageUrl: m.image_url,
          textLayers: m.text_layers,
          canvasSettings: m.canvas_settings,
          width: m.width,
          height: m.height,
          likes: m.likes || 0,
          comments: m.comments || 0,
          isPublic: m.is_public,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        }));
    },

    async getPublic({
      page = 1,
      limit = 20,
      sortBy = 'latest',
    }: {
      page?: number;
      limit?: number;
      sortBy?: string;
    } = {}): Promise<PaginatedResult<any>> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase
            .from('memes')
            .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
            .eq('is_public', true);

          if (sortBy === 'top' || sortBy === 'likes') {
            query = query.order('likes', { ascending: false });
          } else {
            query = query.order('created_at', { ascending: false });
          }

          const from = (page - 1) * limit;
          const to = from + limit - 1;
          const { data, error, count } = await query.range(from, to);

          if (!error && data) {
            const items = data.map((m) => ({
              id: m.id,
              title: m.title,
              imageUrl: m.image_url,
              author: {
                name: m.profiles?.full_name || 'Community Creator',
                avatarUrl:
                  m.profiles?.avatar_url ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              },
              likes: m.likes >= 1000 ? `${(m.likes / 1000).toFixed(1)}K` : String(m.likes),
              comments:
                m.comments >= 1000 ? `${(m.comments / 1000).toFixed(1)}K` : String(m.comments),
              createdAt: m.created_at,
            }));

            const totalItems = count || items.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;

            return {
              items,
              pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
              },
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (memes getPublic):', msg);
        }
      }

      // Local fallback
      const filtered = localStore.memes.filter((m) => m.is_public !== false);
      if (sortBy === 'top' || sortBy === 'likes') {
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else {
        filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      const items = paginated.map((m) => {
        const user = localStore.profiles.find((p) => p.id === m.user_id);
        return {
          id: m.id,
          title: m.title,
          imageUrl: m.image_url,
          author: {
            name: m.author_name || user?.fullName || 'Community Creator',
            avatarUrl:
              m.author_avatar ||
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          },
          likes: m.likes >= 1000 ? `${(m.likes / 1000).toFixed(1)}K` : String(m.likes || 0),
          comments:
            m.comments >= 1000 ? `${(m.comments / 1000).toFixed(1)}K` : String(m.comments || 0),
          createdAt: m.created_at,
        };
      });

      return {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    async getById(id: string): Promise<any | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('memes')
            .select('*, profiles(full_name, avatar_url)')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              title: data.title,
              imageUrl: data.image_url,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              width: data.width,
              height: data.height,
              likes: data.likes,
              comments: data.comments,
              author: {
                name: data.profiles?.full_name || 'Creator',
                avatarUrl: data.profiles?.avatar_url,
              },
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (memes getById):', msg);
        }
      }

      const found = localStore.memes.find((m) => m.id === id);
      return found ? { ...found } : null;
    },

    async like(id: string): Promise<number> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: current } = await supabase
            .from('memes')
            .select('likes')
            .eq('id', id)
            .maybeSingle();
          if (current) {
            const nextLikes = (current.likes || 0) + 1;
            await supabase.from('memes').update({ likes: nextLikes }).eq('id', id);
            return nextLikes;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase like error:', msg);
        }
      }

      const target = localStore.memes.find((m) => m.id === id);
      if (target) {
        target.likes = (target.likes || 0) + 1;
        persistLocalStore();
        return target.likes;
      }
      return 0;
    },

    async update(id: string, updates: Record<string, any>): Promise<any | null> {
      const meme = localStore.memes.find((m) => m.id === id);
      if (!meme) return null;
      Object.assign(meme, updates, { updated_at: new Date().toISOString() });
      persistLocalStore();
      return { ...meme };
    },

    async delete(id: string, userId?: string): Promise<boolean> {
      const idx = localStore.memes.findIndex(
        (m) => m.id === id && (!userId || m.user_id === userId)
      );
      if (idx === -1) return false;
      localStore.memes.splice(idx, 1);
      persistLocalStore();
      return true;
    },

    async getAllAdmin({
      page = 1,
      limit = 50,
      search = '',
    }: {
      page?: number;
      limit?: number;
      search?: string;
    } = {}): Promise<PaginatedResult<any>> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase.from('memes').select('*', { count: 'exact' });

          if (search && search.trim()) {
            query = query.ilike('title', `%${search.trim()}%`);
          }

          query = query.order('created_at', { ascending: false });
          const from = (page - 1) * limit;
          const to = from + limit - 1;
          const { data, count, error } = await query.range(from, to);

          if (!error && data) {
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');

            const items = data.map((m: any) => {
              const user = (profiles || []).find((p: any) => p.id === m.user_id);
              return {
                id: m.id,
                title: m.title,
                imageUrl: m.image_url,
                templateId: m.template_id,
                width: m.width || 600,
                height: m.height || 600,
                likes: m.likes || 0,
                comments: m.comments || 0,
                isPublic: m.is_public !== false,
                authorName: m.author_name || user?.full_name || 'Creator',
                authorEmail: user?.email || 'creator@memegen.com',
                createdAt: m.created_at,
                updatedAt: m.updated_at,
              };
            });

            const totalItems = count !== null && count !== undefined ? count : items.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;

            return {
              items,
              pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
              },
            };
          }
        } catch (err) {
          console.warn('Supabase query error (memes.getAllAdmin):', err);
        }
      }

      let list = [...localStore.memes];

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (m) =>
            m.title?.toLowerCase().includes(q) ||
            m.author_name?.toLowerCase().includes(q)
        );
      }

      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const totalItems = list.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const start = (page - 1) * limit;
      const paginated = list.slice(start, start + limit);

      const items = paginated.map((m) => {
        const user = localStore.profiles.find((p) => p.id === m.user_id);
        return {
          id: m.id,
          title: m.title,
          imageUrl: m.image_url,
          templateId: m.template_id,
          width: m.width,
          height: m.height,
          likes: m.likes || 0,
          comments: m.comments || 0,
          isPublic: m.is_public !== false,
          authorName: m.author_name || user?.fullName || 'Anonymous',
          authorEmail: user?.email || 'guest@memegen.com',
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        };
      });

      return {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },
  },

  // -----------------------------------------------------------
  // PURCHASES & SUBSCRIPTIONS
  // -----------------------------------------------------------
  purchases: {
    async create(
      record: Omit<PurchaseRecord, 'id' | 'createdAt'> & {
        id?: string;
        createdAt?: string;
      }
    ): Promise<PurchaseRecord> {
      const now = new Date().toISOString();
      const newPurchase: PurchaseRecord = {
        id: record.id || `pur-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: record.userId || 'guest',
        userEmail: record.userEmail,
        userName: record.userName,
        planId: record.planId,
        billingCycle: record.billingCycle || 'monthly',
        amount: record.amount,
        currency: record.currency || 'USD',
        status: record.status || 'active',
        orderId: record.orderId || `MH-SUB-${Date.now().toString().slice(-6)}`,
        transactionId:
          record.transactionId || `TXN_${Date.now().toString(36).toUpperCase()}`,
        paymentMethod: record.paymentMethod || 'Credit Card',
        createdAt: record.createdAt || now,
      };

      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('purchases').insert({
            order_id: newPurchase.orderId,
            user_id: newPurchase.userId !== 'guest' ? newPurchase.userId : null,
            user_email: newPurchase.userEmail,
            user_name: newPurchase.userName,
            plan_id: newPurchase.planId,
            amount: newPurchase.amount,
            currency: newPurchase.currency,
            status: newPurchase.status,
            billing_cycle: newPurchase.billingCycle,
            payment_method: newPurchase.paymentMethod,
            created_at: newPurchase.createdAt,
          });

          if (newPurchase.userId && newPurchase.userId !== 'guest') {
            await supabase
              .from('profiles')
              .update({ role: newPurchase.planId === 'enterprise' ? 'enterprise' : 'pro' })
              .eq('id', newPurchase.userId);
          }
        } catch (err) {
          console.warn('Supabase purchases.create error:', err);
        }
      }

      if (!localStore.purchases) {
        localStore.purchases = [];
      }
      localStore.purchases.unshift(newPurchase);

      // Upgrade user role to pro if user exists
      if (newPurchase.userId && newPurchase.userId !== 'guest') {
        const user = localStore.profiles.find(
          (p) => p.id === newPurchase.userId || p.email === newPurchase.userEmail
        );
        if (user && user.role !== 'admin') {
          user.role = newPurchase.planId === 'enterprise' ? 'enterprise' : 'pro';
        }
      }

      // Log activity
      await db.activity.log(
        'purchase',
        'New Subscription Purchased',
        `${newPurchase.userName || newPurchase.userEmail} subscribed to ${newPurchase.planId.toUpperCase()} Plan ($${newPurchase.amount})`,
        {
          purchaseId: newPurchase.id,
          amount: newPurchase.amount,
          plan: newPurchase.planId,
        }
      );

      persistLocalStore();
      return { ...newPurchase };
    },

    async getAll({
      page = 1,
      limit = 50,
      plan,
      status,
      search,
    }: {
      page?: number;
      limit?: number;
      plan?: string;
      status?: string;
      search?: string;
    } = {}): Promise<PaginatedResult<PurchaseRecord>> {
      if (isSupabaseConfigured() && supabase) {
        try {
          let query = supabase.from('purchases').select('*', { count: 'exact' });

          if (plan && plan !== 'all') {
            query = query.eq('plan_id', plan.toLowerCase());
          }

          if (status && status !== 'all') {
            query = query.eq('status', status.toLowerCase());
          }

          if (search && search.trim()) {
            const q = search.trim();
            query = query.or(`user_email.ilike.%${q}%,user_name.ilike.%${q}%,order_id.ilike.%${q}%`);
          }

          query = query.order('created_at', { ascending: false });
          const from = (page - 1) * limit;
          const to = from + limit - 1;
          const { data, count, error } = await query.range(from, to);

          if (!error && data) {
            const items: PurchaseRecord[] = data.map((p: any) => ({
              id: p.id,
              orderId: p.order_id,
              userId: p.user_id || 'guest',
              userEmail: p.user_email,
              userName: p.user_name || 'Subscriber',
              planId: p.plan_id,
              amount: Number(p.amount),
              currency: p.currency || 'USD',
              status: p.status || 'active',
              billingCycle: p.billing_cycle || 'monthly',
              paymentMethod: p.payment_method || 'Credit Card',
              createdAt: p.created_at,
            }));

            const totalItems = count !== null && count !== undefined ? count : items.length;
            const totalPages = Math.ceil(totalItems / limit) || 1;

            return {
              items,
              pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
              },
            };
          }
        } catch (err) {
          console.warn('Supabase purchases.getAll error:', err);
        }
      }

      let list = [...(localStore.purchases || [])];

      if (plan && plan !== 'all') {
        list = list.filter((p) => p.planId.toLowerCase() === plan.toLowerCase());
      }

      if (status && status !== 'all') {
        list = list.filter((p) => p.status.toLowerCase() === status.toLowerCase());
      }

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.userEmail.toLowerCase().includes(q) ||
            p.userName.toLowerCase().includes(q) ||
            p.orderId.toLowerCase().includes(q)
        );
      }

      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const totalItems = list.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const startIndex = (page - 1) * limit;
      const items = list.slice(startIndex, startIndex + limit);

      return {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    async getByUser(userId: string): Promise<PurchaseRecord[]> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('purchases')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map((p: any) => ({
              id: p.id,
              orderId: p.order_id,
              userId: p.user_id,
              userEmail: p.user_email,
              userName: p.user_name,
              planId: p.plan_id,
              amount: Number(p.amount),
              currency: p.currency,
              status: p.status,
              billingCycle: p.billing_cycle,
              paymentMethod: p.payment_method,
              createdAt: p.created_at,
            }));
          }
        } catch (err) {
          console.warn('Supabase purchases.getByUser error:', err);
        }
      }

      const list = localStore.purchases || [];
      return list.filter((p) => p.userId === userId);
    },

    async getSummary() {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.from('purchases').select('*');
          if (!error && data) {
            const totalRevenue = data.reduce(
              (acc: number, p: any) => acc + (p.status !== 'refunded' ? Number(p.amount) : 0),
              0
            );
            const activeSubs = data.filter((p: any) => p.status === 'active');
            const monthlyRevenue = activeSubs.reduce((acc: number, p: any) => {
              const amt = Number(p.amount);
              if (p.billing_cycle === 'monthly') return acc + amt;
              return acc + Math.round(amt / 12);
            }, 0);

            return {
              totalRevenue: Math.round(totalRevenue * 100) / 100,
              monthlyRecurringRevenue: Math.round(monthlyRevenue * 100) / 100,
              totalPurchases: data.length,
              activeSubscriptions: activeSubs.length,
            };
          }
        } catch (err) {
          console.warn('Supabase purchases.getSummary error:', err);
        }
      }

      const list = localStore.purchases || [];
      const totalRevenue = list.reduce(
        (acc, p) => acc + (p.status !== 'refunded' ? p.amount : 0),
        0
      );
      const activeSubs = list.filter((p) => p.status === 'active');
      const monthlyRevenue = activeSubs.reduce((acc, p) => {
        if (p.billingCycle === 'monthly') return acc + p.amount;
        return acc + Math.round(p.amount / 12);
      }, 0);

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRecurringRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalPurchases: list.length,
        activeSubscriptions: activeSubs.length,
      };
    },
  },

  // -----------------------------------------------------------
  // TRAFFIC & ANALYTICS
  // -----------------------------------------------------------
  traffic: {
    async record(
      event: Omit<TrafficEvent, 'id' | 'timestamp'> & {
        id?: string;
        timestamp?: string;
        pageTitle?: string;
        sessionId?: string;
      }
    ): Promise<TrafficEvent> {
      const now = new Date().toISOString();
      const record: TrafficEvent = {
        id: event.id || `trf-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        path: event.path || '/',
        referrer: event.referrer || 'direct',
        device: event.device || 'desktop',
        browser: event.browser || 'Chrome',
        ip: event.ip,
        userId: event.userId,
        timestamp: event.timestamp || now,
      };

      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('traffic').insert({
            path: record.path,
            page_title: event.pageTitle || '',
            referrer: record.referrer,
            device: record.device,
            session_id: event.sessionId || record.id,
            user_id: record.userId || null,
            created_at: record.timestamp,
          });
        } catch (err) {
          console.warn('Supabase traffic.record error:', err);
        }
      }

      if (!localStore.traffic) {
        localStore.traffic = [];
      }
      localStore.traffic.push(record);

      if (localStore.traffic.length > 10000) {
        localStore.traffic = localStore.traffic.slice(-8000);
      }

      persistLocalStore();
      return record;
    },

    async getSummary() {
      let traffic: any[] = localStore.traffic || [];

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.from('traffic').select('*').limit(5000);
          if (!error && data) {
            traffic = data.map((t: any) => ({
              id: t.id,
              path: t.path,
              referrer: t.referrer,
              device: t.device,
              userId: t.user_id,
              ip: t.session_id || t.id,
              timestamp: t.created_at,
            }));
          }
        } catch (err) {
          console.warn('Supabase traffic.getSummary error:', err);
        }
      }

      const totalViews = traffic.length;
      const uniqueIps = new Set(traffic.map((t) => t.ip || t.userId || t.id)).size;

      const pathCounts: Record<string, number> = {};
      const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
      const referrerCounts: Record<string, number> = {};

      for (const t of traffic) {
        pathCounts[t.path] = (pathCounts[t.path] || 0) + 1;
        const dev = (t.device || 'desktop').toLowerCase();
        if (dev in deviceCounts) {
          deviceCounts[dev as 'desktop' | 'mobile' | 'tablet']++;
        } else {
          deviceCounts.desktop++;
        }
        const ref = t.referrer
          ? t.referrer.includes('google')
            ? 'Google Search'
            : t.referrer.includes('reddit')
              ? 'Reddit'
              : t.referrer.includes('twitter') || t.referrer.includes('t.co')
                ? 'Twitter / X'
                : t.referrer === 'direct'
                  ? 'Direct'
                  : 'Other'
          : 'Direct';
        referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
      }

      const topPages = Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, views]) => ({
          path,
          views,
          percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
        }));

      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([source, visitors]) => ({ source, visitors }));

      const bounceRate =
        totalViews > 0
          ? Math.min(42, Math.max(16, Math.round((uniqueIps / totalViews) * 35 * 10) / 10))
          : 0;

      const avgMinutes = totalViews > 0 ? Math.min(6, Math.max(1, Math.round(totalViews / (uniqueIps || 1)))) : 0;
      const avgSeconds = totalViews > 0 ? Math.round(((totalViews * 17) % 60)) : 0;
      const avgSessionTime = totalViews > 0 ? `${avgMinutes}m ${avgSeconds.toString().padStart(2, '0')}s` : '0m 00s';

      return {
        totalViews,
        uniqueVisitors: uniqueIps,
        bounceRate,
        avgSessionTime,
        deviceBreakdown: {
          desktop:
            totalViews > 0 ? Math.round((deviceCounts.desktop / totalViews) * 100) : 0,
          mobile:
            totalViews > 0 ? Math.round((deviceCounts.mobile / totalViews) * 100) : 0,
          tablet:
            totalViews > 0 ? Math.round((deviceCounts.tablet / totalViews) * 100) : 0,
        },
        topPages,
        topReferrers,
      };
    },

    async getDailyStats(days = 7) {
      let traffic: any[] = localStore.traffic || [];

      if (isSupabaseConfigured() && supabase) {
        try {
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - days);
          const { data, error } = await supabase
            .from('traffic')
            .select('*')
            .gte('created_at', sinceDate.toISOString())
            .order('created_at', { ascending: true });

          if (!error && data) {
            traffic = data.map((t: any) => ({
              id: t.id,
              path: t.path,
              ip: t.session_id || t.id,
              userId: t.user_id,
              timestamp: t.created_at,
            }));
          }
        } catch (err) {
          console.warn('Supabase traffic.getDailyStats error:', err);
        }
      }

      const dailyMap: Record<string, { views: number; uniqueIps: Set<string> }> = {};

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap[key] = { views: 0, uniqueIps: new Set() };
      }

      for (const t of traffic) {
        const key = (t.timestamp || t.created_at || '').split('T')[0];
        if (dailyMap[key]) {
          dailyMap[key].views++;
          dailyMap[key].uniqueIps.add(t.ip || t.userId || t.id);
        }
      }

      return Object.entries(dailyMap).map(([date, data]) => ({
        date,
        views: data.views,
        uniqueVisitors: data.uniqueIps.size,
      }));
    },
  },

  // -----------------------------------------------------------
  // ACTIVITY LOGGING
  // -----------------------------------------------------------
  activity: {
    async log(
      type: 'signup' | 'purchase' | 'meme_created' | 'draft_saved',
      title: string,
      description: string,
      meta?: any
    ) {
      const now = new Date().toISOString();
      const newAct = {
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        type,
        title,
        description,
        timestamp: now,
        meta,
      };

      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('activity').insert({
            id: newAct.id,
            type: newAct.type,
            title: newAct.title,
            description: newAct.description,
            timestamp: newAct.timestamp,
            meta: newAct.meta || {},
          });
        } catch (err) {
          console.warn('Supabase activity.log error:', err);
        }
      }

      if (!localStore.activity) {
        localStore.activity = [];
      }
      localStore.activity.unshift(newAct);

      if (localStore.activity.length > 500) {
        localStore.activity = localStore.activity.slice(0, 300);
      }
      persistLocalStore();
    },

    async getRecent(limit = 20) {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('activity')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

          if (!error && data && data.length > 0) {
            return data.map((a: any) => ({
              id: a.id,
              type: a.type,
              title: a.title,
              description: a.description,
              timestamp: a.timestamp,
              meta: a.meta,
            }));
          }
        } catch (err) {
          console.warn('Supabase activity.getRecent error:', err);
        }
      }

      return (localStore.activity || []).slice(0, limit);
    },
  },

  // -----------------------------------------------------------
  // ADMIN DASHBOARD AGGREGATES
  // -----------------------------------------------------------
  admin: {
    async getDashboardStats(): Promise<AdminDashboardStats> {
      const startTime = Date.now();
      const purchaseSummary = await db.purchases.getSummary();
      const trafficSummary = await db.traffic.getSummary();
      const dailyTraffic = await db.traffic.getDailyStats(7);

      let totalUsers = localStore.profiles.length;
      let totalMemes = localStore.memes.length;
      let totalDrafts = localStore.meme_drafts.length;

      if (isSupabaseConfigured() && supabase) {
        try {
          const [uRes, mRes, dRes] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('memes').select('*', { count: 'exact', head: true }),
            supabase.from('meme_drafts').select('*', { count: 'exact', head: true }),
          ]);
          if (uRes.count !== null && uRes.count !== undefined) totalUsers = uRes.count;
          if (mRes.count !== null && mRes.count !== undefined) totalMemes = mRes.count;
          if (dRes.count !== null && dRes.count !== undefined) totalDrafts = dRes.count;
        } catch (err) {
          console.warn('Supabase admin count error:', err);
        }
      }

      const activeProSubscribers = purchaseSummary.activeSubscriptions;
      const conversionRate =
        totalUsers > 0
          ? Math.round((activeProSubscribers / totalUsers) * 1000) / 10
          : 0;

      // Dynamic 6-month revenue chart from all recorded purchases
      let allPurchases: any[] = localStore.purchases || [];
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.from('purchases').select('amount, status, created_at');
          if (data && data.length > 0) allPurchases = data;
        } catch {}
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const revenueChart = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const rev = allPurchases
          .filter((p: any) => {
            const pDate = new Date(p.createdAt || p.created_at);
            return pDate.getFullYear() === y && pDate.getMonth() === m && p.status !== 'refunded';
          })
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

        revenueChart.push({
          month: monthNames[m],
          revenue: Math.round(rev * 100) / 100,
        });
      }

      const recentActivity = await db.activity.getRecent(10);
      const latency = Math.max(8, Date.now() - startTime);
      const uptimeSec = Math.floor(process.uptime());
      const uptimeStr = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

      return {
        kpis: {
          totalRevenue: purchaseSummary.totalRevenue,
          monthlyRecurringRevenue: purchaseSummary.monthlyRecurringRevenue,
          totalUsers,
          activeProSubscribers,
          totalMemes,
          totalDrafts,
          totalPageViews: trafficSummary.totalViews,
          uniqueVisitors: trafficSummary.uniqueVisitors,
          conversionRate,
        },
        trafficChart: dailyTraffic,
        revenueChart,
        deviceBreakdown: trafficSummary.deviceBreakdown,
        topPages: trafficSummary.topPages,
        topReferrers: trafficSummary.topReferrers,
        recentActivity,
        systemHealth: {
          status: 'optimal',
          uptime: uptimeStr,
          database: isSupabaseConfigured()
            ? 'Supabase PostgreSQL (Live Database)'
            : 'JSON Persistence Store (Local Fallback)',
          apiLatencyMs: latency,
        },
      };
    },
  },
};
