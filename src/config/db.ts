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
    };
  } catch {
    // Keep defaults
  }
}

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
      memeTitle,
      textLayers,
      canvasSettings,
      previewImageUrl,
    }: {
      id?: string | null;
      userId: string;
      templateId: string;
      memeTitle?: string;
      textLayers?: any[];
      canvasSettings?: any;
      previewImageUrl?: string | null;
    }): Promise<MemeDraft> {
      const now = new Date().toISOString();
      const draftId = id || crypto.randomUUID();

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('meme_drafts')
            .upsert({
              id: draftId,
              user_id: userId,
              template_id: templateId,
              meme_title: memeTitle || 'Untitled Meme',
              text_layers: textLayers || [],
              canvas_settings: canvasSettings || {},
              preview_image_url: previewImageUrl || null,
              updated_at: now,
            })
            .select()
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              memeTitle: data.meme_title,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              previewImageUrl: data.preview_image_url,
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
        (d) => d.id === draftId || (d.userId === userId && d.templateId === templateId)
      );

      const record: MemeDraft = {
        id: draftId,
        userId,
        templateId,
        memeTitle: memeTitle || 'Untitled Meme',
        textLayers: textLayers || [],
        canvasSettings: canvasSettings || {},
        previewImageUrl: previewImageUrl || null,
        createdAt: existingIdx >= 0 ? localStore.meme_drafts[existingIdx].createdAt : now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        localStore.meme_drafts[existingIdx] = record;
      } else {
        localStore.meme_drafts.unshift(record);
      }

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
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              memeTitle: data.meme_title,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              previewImageUrl: data.preview_image_url,
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

      return userDrafts[0] ? { ...userDrafts[0] } : null;
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
            return data.map((d) => ({
              id: d.id,
              userId: d.user_id,
              templateId: d.template_id,
              memeTitle: d.meme_title,
              textLayers: d.text_layers,
              canvasSettings: d.canvas_settings,
              previewImageUrl: d.preview_image_url,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }));
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (getAllByUser drafts):', msg);
        }
      }

      return localStore.meme_drafts
        .filter((d) => d.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },

    async getById(id: string, userId: string): Promise<MemeDraft | null> {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('meme_drafts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              templateId: data.template_id,
              memeTitle: data.meme_title,
              textLayers: data.text_layers,
              canvasSettings: data.canvas_settings,
              previewImageUrl: data.preview_image_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase query error (draft getById):', msg);
        }
      }

      const found = localStore.meme_drafts.find((d) => d.id === id && d.userId === userId);
      return found ? { ...found } : null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('meme_drafts').delete().eq('id', id).eq('user_id', userId);
          return true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('Supabase delete error (draft):', msg);
        }
      }

      const initialLen = localStore.meme_drafts.length;
      localStore.meme_drafts = localStore.meme_drafts.filter(
        (d) => !(d.id === id && d.userId === userId)
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
  },
};
