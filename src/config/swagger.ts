export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MemeHub REST API & Admin Platform',
    version: '2.0.0',
    description: `
## Welcome to the MemeHub Backend API & Platform Suite

MemeHub is a viral meme generation, canvas editing, community publishing, and monetization platform.
This API provides comprehensive services for:
- **Authentication & Security**: Creator sign-up, sign-in, session revocation, Google OAuth, and secure password encryption using **bcrypt** (salt factor 10).
- **Templates**: Curated meme templates with automatic category filtering, search, and pre-configured text layout slots.
- **Editing Drafts (Auto-Sync)**: Continuous real-time syncing of in-progress canvas layers, positions, and styling to **Supabase** (or resilient JSON store). Supports both authenticated accounts and guest creator sessions.
- **Meme Persistence & Moderation**: Storage of exported memes with community likes, publishing moderation, and author attribution.
- **AI Caption Assistant**: Contextual caption generator generating viral punchlines across multiple tones (funny, sarcastic, relatable, punny, absurdist, professional).
- **Subscriptions & Purchases**: Monetization lifecycle with checkout, tier management (Free, Pro, Enterprise), and transaction recording.
- **Traffic Telemetry**: Client-side event tracking, device breakdown, and aggregate traffic metrics.
- **Admin Panel Suite**: Protected administrator dashboard with revenue KPIs, MRR, 7-day traffic trends, user tracking & role elevation, purchase ledgers, and meme moderation.

### Authentication
Protected endpoints require an HTTP Bearer JWT token in the \`Authorization\` header:
\`\`\`http
Authorization: Bearer <your_jwt_token>
\`\`\`
Admin endpoints require either an administrative Bearer token (\`role: 'admin'\`) or an \`x-admin-key: secret-admin\` header.
    `,
    contact: {
      name: 'MemeHub Engineering',
      url: 'https://github.com/CodeAirLines/MemeGen',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current Origin API (Auto-detected)',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://meme-gen-server.vercel.app/api/v1',
      description: 'Production Vercel Cloud Server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, login, profile verification, session logout, bcrypt password reset, and Google OAuth',
    },
    {
      name: 'Templates',
      description: 'Browse curated meme templates, search by tags and keywords, filter by category',
    },
    {
      name: 'Drafts',
      description: 'In-progress meme editing canvas state synchronization and recovery (Guest & Authenticated)',
    },
    {
      name: 'Memes',
      description: 'User exported memes library, community explore feed, publish moderation, and likes',
    },
    {
      name: 'AI Assistant',
      description: 'Contextual AI-generated meme captions with viral score ratings, customizable tone presets, and multi-language support',
    },
    {
      name: 'Subscriptions',
      description: 'Plan upgrade checkout (Free, Pro, Enterprise), payment processing, and subscription lifecycle management',
    },
    {
      name: 'Analytics',
      description: 'Client traffic telemetry, page view tracking, device breakdown, and traffic aggregation',
    },
    {
      name: 'Admin',
      description: 'Protected administration panel: KPIs, weekly traffic analytics, user tracking, role elevation, financial orders, and meme moderation',
    },
    {
      name: 'System',
      description: 'Health checks and server status monitoring',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT bearer token generated upon login/register.',
      },
    },
    schemas: {
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_FAILED' },
              message: { type: 'string', example: 'Invalid parameter provided' },
              details: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: { type: 'string' },
                },
                example: { email: ['Valid email is required.'] },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          totalItems: { type: 'integer', example: 12 },
          totalPages: { type: 'integer', example: 1 },
          hasNextPage: { type: 'boolean', example: false },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '42df87dc-e033-4e77-bd40-50d09ed55eeb' },
          fullName: { type: 'string', example: 'Sarah Connor' },
          email: { type: 'string', format: 'email', example: 'sarah@example.com' },
          avatarUrl: { type: 'string', example: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah' },
          role: { type: 'string', example: 'creator' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-24T14:29:04.786Z' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', example: 'Sarah Connor', minLength: 2 },
          email: { type: 'string', format: 'email', example: 'sarah@example.com' },
          password: { type: 'string', format: 'password', example: 'secretPass123!', minLength: 8 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sarah@example.com' },
          password: { type: 'string', format: 'password', example: 'secretPass123!' },
          rememberMe: { type: 'boolean', example: true },
        },
      },
      AuthSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserProfile' },
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
          message: { type: 'string', example: 'Account created successfully!' },
        },
      },
      TextSlot: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 't1' },
          placeholder: { type: 'string', example: 'TOP CAPTION' },
          defaultYPercent: { type: 'number', example: 15 },
        },
      },
      TemplateItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'drake-hotline-bling' },
          name: { type: 'string', example: 'Drake Hotline Bling' },
          imageUrl: { type: 'string', example: 'https://i.imgflip.com/30b1gx.jpg' },
          width: { type: 'integer', example: 1200 },
          height: { type: 'integer', example: 1200 },
          boxCount: { type: 'integer', example: 2 },
          category: { type: 'string', example: 'classic' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['drake', 'approval', 'disapproval'],
          },
          description: { type: 'string', example: 'Drake gesturing disapproval and approval' },
          usageCount: { type: 'integer', example: 1420500 },
          defaultTextSlots: {
            type: 'array',
            items: { $ref: '#/components/schemas/TextSlot' },
          },
        },
      },
      TemplateListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/TemplateItem' },
              },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          },
        },
      },
      TemplateDetailResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/TemplateItem' },
        },
      },
      TextLayer: {
        type: 'object',
        required: ['id', 'text', 'xPercent', 'yPercent', 'fontSize', 'color'],
        properties: {
          id: { type: 'string', example: 'layer-top-9812' },
          text: { type: 'string', example: 'WHEN YOUR CODE RUNS ON THE FIRST TRY' },
          xPercent: { type: 'number', example: 50 },
          yPercent: { type: 'number', example: 15 },
          fontSize: { type: 'number', example: 36 },
          color: { type: 'string', example: '#FFFFFF' },
          strokeColor: { type: 'string', example: '#000000' },
          strokeWidth: { type: 'number', example: 3 },
          isBold: { type: 'boolean', example: true },
          isItalic: { type: 'boolean', example: false },
          isUppercase: { type: 'boolean', example: true },
          alignment: { type: 'string', enum: ['left', 'center', 'right'], example: 'center' },
          fontFamily: { type: 'string', example: 'Impact' },
          rotation: { type: 'number', example: 0 },
          opacity: { type: 'number', example: 1 },
        },
      },
      CanvasSettings: {
        type: 'object',
        properties: {
          aspectRatio: { type: 'string', example: 'original' },
          backgroundColor: { type: 'string', example: '#020617' },
          padding: { type: 'number', example: 0 },
          zoom: { type: 'number', example: 1 },
          fitToScreen: { type: 'boolean', example: true },
          showGrid: { type: 'boolean', example: false },
        },
      },
      SaveDraftRequest: {
        type: 'object',
        required: ['templateId', 'textLayers'],
        properties: {
          id: { type: 'string', format: 'uuid', nullable: true, example: '83ab0b37-5eb9-4105-b7f1-c108baccf793' },
          templateId: { type: 'string', example: 'shinchan-not-that-special' },
          memeTitle: { type: 'string', example: 'Shinchan / Not That Special Meme' },
          textLayers: {
            type: 'array',
            items: { $ref: '#/components/schemas/TextLayer' },
          },
          canvasSettings: { $ref: '#/components/schemas/CanvasSettings' },
          previewImageUrl: { type: 'string', nullable: true, example: null },
        },
      },
      MemeDraftResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '83ab0b37-5eb9-4105-b7f1-c108baccf793' },
              userId: { type: 'string', format: 'uuid', example: '42df87dc-e033-4e77-bd40-50d09ed55eeb' },
              templateId: { type: 'string', example: 'shinchan-not-that-special' },
              memeTitle: { type: 'string', example: 'Shinchan / Not That Special Meme' },
              textLayers: {
                type: 'array',
                items: { $ref: '#/components/schemas/TextLayer' },
              },
              canvasSettings: { $ref: '#/components/schemas/CanvasSettings' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          message: { type: 'string', example: 'Draft synced successfully.' },
        },
      },
      SaveMemeRequest: {
        type: 'object',
        required: ['imageUrl'],
        properties: {
          templateId: { type: 'string', example: 'drake-hotline-bling' },
          title: { type: 'string', example: 'Debugging with Supabase' },
          imageUrl: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' },
          textLayers: {
            type: 'array',
            items: { $ref: '#/components/schemas/TextLayer' },
          },
          canvasSettings: { $ref: '#/components/schemas/CanvasSettings' },
          width: { type: 'integer', example: 1200 },
          height: { type: 'integer', example: 1200 },
          isPublic: { type: 'boolean', example: true },
        },
      },
      SavedMemeItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'c82ed021-d53e-4918-b76a-859d5ea23464' },
          userId: { type: 'string', format: 'uuid', example: '42df87dc-e033-4e77-bd40-50d09ed55eeb' },
          templateId: { type: 'string', example: 'shinchan-not-that-special' },
          title: { type: 'string', example: 'Shinchan / Not That Special Meme' },
          imageUrl: { type: 'string', example: '/shinchan-meme.jpg' },
          textLayers: { type: 'array', items: { $ref: '#/components/schemas/TextLayer' } },
          width: { type: 'integer', example: 600 },
          height: { type: 'integer', example: 600 },
          likes: { type: 'integer', example: 48900 },
          comments: { type: 'integer', example: 1200 },
          isPublic: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CommunityMemeItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'comm-shinchan' },
          title: { type: 'string', example: "I'm not really that special..." },
          imageUrl: { type: 'string', example: '/shinchan-meme.jpg' },
          author: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'shinchan_official' },
              avatarUrl: { type: 'string', example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
            },
          },
          likes: { type: 'string', example: '48.9K' },
          comments: { type: 'string', example: '1.2K' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CommunityMemeListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/CommunityMemeItem' },
              },
              pagination: { $ref: '#/components/schemas/Pagination' },
            },
          },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'newPassword'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sarah@example.com' },
          newPassword: { type: 'string', format: 'password', minLength: 8, example: 'NewSecretPass123!' },
        },
      },
      GoogleAuthRequest: {
        type: 'object',
        properties: {
          credential: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIs...' },
          email: { type: 'string', format: 'email', example: 'creator@gmail.com' },
          fullName: { type: 'string', example: 'Alex Developer' },
          avatarUrl: { type: 'string', example: 'https://lh3.googleusercontent.com/a/photo.jpg' },
        },
      },
      UpdateMemeRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated Meme Title' },
          isPublic: { type: 'boolean', example: true },
          textLayers: { type: 'array', items: { $ref: '#/components/schemas/TextLayer' } },
          canvasSettings: { $ref: '#/components/schemas/CanvasSettings' },
        },
      },
      AiCaptionRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', example: 'when production code works without a single bug' },
          tone: {
            type: 'string',
            enum: ['funny', 'sarcastic', 'relatable', 'punny', 'absurdist', 'professional', 'dark'],
            default: 'funny',
            example: 'sarcastic',
          },
          language: { type: 'string', default: 'en', example: 'en' },
          memeTemplateId: { type: 'string', example: 'drake' },
        },
      },
      AiCaptionSuggestion: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cap-1' },
          title: { type: 'string', example: 'Junior dev triumph' },
          topText: { type: 'string', example: 'TESTING IN PRODUCTION' },
          bottomText: { type: 'string', example: 'IT ACTUALLY WORKED ON FIRST TRY' },
          explanation: { type: 'string', example: 'Hilarious subversion of developer imposter syndrome.' },
          viralScore: { type: 'integer', example: 96 },
          tags: { type: 'array', items: { type: 'string' }, example: ['coding', 'luck', 'devops'] },
        },
      },
      SubscriptionCheckoutRequest: {
        type: 'object',
        required: ['planId'],
        properties: {
          planId: { type: 'string', enum: ['free', 'pro', 'enterprise'], example: 'pro' },
          billingCycle: { type: 'string', enum: ['monthly', 'annual'], default: 'monthly', example: 'monthly' },
          paymentMethod: { type: 'string', default: 'Credit Card', example: 'Visa •••• 4242' },
          returnUrl: { type: 'string', example: '/payment-success' },
        },
      },
      SubscriptionRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sub-7819' },
          userId: { type: 'string', example: 'user-1' },
          planId: { type: 'string', example: 'pro' },
          status: { type: 'string', enum: ['active', 'canceled', 'past_due'], example: 'active' },
          billingCycle: { type: 'string', example: 'monthly' },
          amount: { type: 'number', example: 9.99 },
          currentPeriodEnd: { type: 'string', format: 'date-time' },
        },
      },
      TrafficTrackRequest: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', example: '/editor' },
          pageTitle: { type: 'string', example: 'Meme Editor | MemeHub' },
          referrer: { type: 'string', example: 'https://google.com' },
          device: { type: 'string', enum: ['desktop', 'mobile', 'tablet'], example: 'desktop' },
          sessionId: { type: 'string', example: 'sess-91823' },
        },
      },
      AdminDashboardStats: {
        type: 'object',
        properties: {
          kpis: {
            type: 'object',
            properties: {
              totalRevenue: { type: 'number', example: 158.96 },
              monthlyRecurringRevenue: { type: 'number', example: 57.97 },
              totalUsers: { type: 'integer', example: 240 },
              activeProSubscribers: { type: 'integer', example: 18 },
              totalMemes: { type: 'integer', example: 1204 },
              totalDrafts: { type: 'integer', example: 382 },
              totalPageViews: { type: 'integer', example: 14200 },
              uniqueVisitors: { type: 'integer', example: 4850 },
              conversionRate: { type: 'number', example: 7.5 },
            },
          },
          trafficChart: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', example: '2026-11-08' },
                views: { type: 'integer', example: 1240 },
                uniqueVisitors: { type: 'integer', example: 890 },
              },
            },
          },
          revenueChart: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                month: { type: 'string', example: 'Oct' },
                revenue: { type: 'number', example: 2420 },
              },
            },
          },
          deviceBreakdown: {
            type: 'object',
            properties: {
              desktop: { type: 'integer', example: 55 },
              mobile: { type: 'integer', example: 35 },
              tablet: { type: 'integer', example: 10 },
            },
          },
          topPages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', example: '/editor' },
                views: { type: 'integer', example: 4200 },
                percentage: { type: 'integer', example: 30 },
              },
            },
          },
          recentActivity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'act-1' },
                type: { type: 'string', example: 'purchase' },
                title: { type: 'string', example: 'New Subscription' },
                description: { type: 'string', example: 'User upgraded to Pro' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
          systemHealth: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'optimal' },
              uptime: { type: 'string', example: '99.98%' },
              database: { type: 'string', example: 'Supabase / Resilient Store' },
              apiLatencyMs: { type: 'integer', example: 24 },
            },
          },
        },
      },
      AdminUserItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-1' },
          fullName: { type: 'string', example: 'Sarah Connor' },
          email: { type: 'string', format: 'email', example: 'sarah@example.com' },
          avatarUrl: { type: 'string', example: '/Profille/no-dp_16.webp' },
          role: { type: 'string', enum: ['user', 'creator', 'admin'], example: 'creator' },
          createdAt: { type: 'string', format: 'date-time' },
          purchasesCount: { type: 'integer', example: 2 },
        },
      },
      AdminUpdateRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['user', 'creator', 'admin'], example: 'admin' },
        },
      },
      PurchaseRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pur-1' },
          orderId: { type: 'string', example: 'ORD-78192' },
          userId: { type: 'string', example: 'user-1' },
          userEmail: { type: 'string', example: 'alex@example.com' },
          userName: { type: 'string', example: 'Alex Dev' },
          planId: { type: 'string', example: 'pro' },
          amount: { type: 'number', example: 9.99 },
          currency: { type: 'string', example: 'USD' },
          status: { type: 'string', example: 'active' },
          billingCycle: { type: 'string', example: 'monthly' },
          paymentMethod: { type: 'string', example: 'Credit Card' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new creator account',
        description: 'Creates a new user profile, securely hashes password with bcrypt, and returns an authenticated session JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
              },
            },
          },
          400: {
            description: 'Validation failed (e.g. invalid email or password too short)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          409: {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log into an existing account',
        description: 'Verifies email and password credentials, and issues an access JWT session token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get active authenticated user profile',
        description: 'Fetches the account profile associated with the provided JWT bearer token.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Active profile retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserProfile' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized (token missing or invalid)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke session / logout',
        description: 'Confirms session logout and local token invalidation.',
        responses: {
          200: {
            description: 'Successfully logged out',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset account password with bcrypt encryption',
        description: 'Securely hashes the new password with bcrypt (salt rounds 10) and updates the user profile credentials.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Password reset successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Password reset successfully. You can now log in.' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation failed (e.g. password too short or email missing)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
          404: {
            description: 'User with provided email not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Google OAuth Single Sign-On',
        description: 'Authenticates or registers a user via Google credentials and returns an active JWT session token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleAuthRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Google authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
              },
            },
          },
          400: {
            description: 'Invalid Google credential token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/templates': {
      get: {
        tags: ['Templates'],
        summary: 'Browse and search meme templates',
        description: 'Retrieve paginated meme templates with optional category filtering, keyword search, and sorting.',
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category (e.g. classic, trending, reactions, gaming, business)',
            schema: { type: 'string', example: 'classic' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search templates by name, description, or tags',
            schema: { type: 'string', example: 'drake' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page (default 50)',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort criteria: popular, name, latest',
            schema: { type: 'string', enum: ['popular', 'name', 'latest'], default: 'popular' },
          },
        ],
        responses: {
          200: {
            description: 'Templates list retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TemplateListResponse' },
              },
            },
          },
        },
      },
    },
    '/templates/{id}': {
      get: {
        tags: ['Templates'],
        summary: 'Get single template details',
        description: 'Fetch detailed template metadata including dimensions, usage count, tags, and default text slots.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Template identifier (e.g. drake-hotline-bling)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Template details retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TemplateDetailResponse' },
              },
            },
          },
          404: {
            description: 'Template not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/drafts': {
      post: {
        tags: ['Drafts'],
        summary: 'Auto-save in-progress meme editing draft',
        description: 'Upserts the canvas editing state (captions, coordinates, font styles, canvas zoom, and template ID) into the database.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveDraftRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Draft saved/synced successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MemeDraftResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Drafts'],
        summary: 'List all drafts for the authenticated user',
        description: 'Returns all in-progress meme drafts created by the active user.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User drafts retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SaveDraftRequest' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/drafts/latest': {
      get: {
        tags: ['Drafts'],
        summary: 'Get most recent draft to resume work',
        description: 'Retrieves the user most recent in-progress draft to seamlessly resume canvas editing.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Latest draft retrieved (or null if none)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SaveDraftRequest' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}': {
      get: {
        tags: ['Drafts'],
        summary: 'Get specific draft by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Draft retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SaveDraftRequest' },
                  },
                },
              },
            },
          },
          404: { description: 'Draft not found' },
        },
      },
      delete: {
        tags: ['Drafts'],
        summary: 'Delete draft by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Draft deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Draft deleted.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/memes': {
      post: {
        tags: ['Memes'],
        summary: 'Save a created or exported meme to the library',
        description: 'Records an exported/downloaded meme into the database so the user worked history is preserved.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveMemeRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Meme recorded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SavedMemeItem' },
                    message: { type: 'string', example: 'Meme saved to library successfully.' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Memes'],
        summary: 'Browse community memes feed',
        description: 'Retrieve paginated memes published by the community.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['latest', 'top'], default: 'latest' },
          },
        ],
        responses: {
          200: {
            description: 'Community memes list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommunityMemeListResponse' },
              },
            },
          },
        },
      },
    },
    '/memes/user': {
      get: {
        tags: ['Memes'],
        summary: 'Get all memes created/exported by authenticated user',
        description: 'Returns the full library of memes created and exported by the active user.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User memes library',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SavedMemeItem' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/memes/{id}': {
      get: {
        tags: ['Memes'],
        summary: 'Get single meme details by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meme details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SavedMemeItem' },
                  },
                },
              },
            },
          },
          404: { description: 'Meme not found' },
        },
      },
      put: {
        tags: ['Memes'],
        summary: 'Update saved meme details or canvas layers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMemeRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Meme updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SavedMemeItem' },
                  },
                },
              },
            },
          },
          404: { description: 'Meme not found' },
        },
      },
      delete: {
        tags: ['Memes'],
        summary: 'Delete saved meme from library',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meme deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Meme removed successfully.' },
                  },
                },
              },
            },
          },
          404: { description: 'Meme not found' },
        },
      },
    },
    '/memes/{id}/publish': {
      post: {
        tags: ['Memes'],
        summary: 'Toggle public publishing for community explore',
        description: 'Toggles whether a meme appears publicly on the Community Explore feed.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Publishing state updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SavedMemeItem' },
                    message: { type: 'string', example: 'Meme publishing status toggled.' },
                  },
                },
              },
            },
          },
          404: { description: 'Meme not found' },
        },
      },
    },
    '/memes/{id}/like': {
      post: {
        tags: ['Memes'],
        summary: 'Like a community meme',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meme liked',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        likes: { type: 'integer', example: 48901 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/generate-captions': {
      post: {
        tags: ['AI Assistant'],
        summary: 'Generate viral meme captions using AI',
        description: 'Generates structured, witty meme punchlines tailored to viral trends and specified humor tone presets.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiCaptionRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Captions generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AiCaptionSuggestion' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        tone: { type: 'string', example: 'sarcastic' },
                        language: { type: 'string', example: 'en' },
                        count: { type: 'integer', example: 4 },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Missing prompt or invalid tone',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/subscriptions/checkout': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Process subscription plan upgrade or checkout',
        description: 'Upgrades the user to Pro or Enterprise tier and records a financial purchase transaction.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscriptionCheckoutRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Checkout processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        subscription: { $ref: '#/components/schemas/SubscriptionRecord' },
                        purchase: { $ref: '#/components/schemas/PurchaseRecord' },
                        redirectUrl: { type: 'string', example: '/payment-success' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid plan or billing cycle' },
        },
      },
    },
    '/subscriptions/current': {
      get: {
        tags: ['Subscriptions'],
        summary: 'Get active subscription for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Active subscription details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SubscriptionRecord' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/subscriptions/cancel': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Cancel active recurring subscription',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Subscription canceled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Subscription canceled successfully.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/analytics/track': {
      post: {
        tags: ['Analytics'],
        summary: 'Record client telemetry or page view event',
        description: 'Logs incoming user traffic, device information, and referral telemetry without requiring full authentication.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TrafficTrackRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Event logged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Get platform traffic summary and trends',
        parameters: [
          {
            name: 'days',
            in: 'query',
            description: 'Analysis period in days (default 7)',
            schema: { type: 'integer', default: 7 },
          },
        ],
        responses: {
          200: {
            description: 'Traffic summary metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalViews: { type: 'integer', example: 1420 },
                            uniqueVisitors: { type: 'integer', example: 980 },
                            bounceRate: { type: 'number', example: 28.4 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Admin dashboard KPI overview and aggregated charts',
        description: 'Comprehensive administrative intelligence: revenue, MRR, user counts, 7-day traffic chart, system health, device breakdown, and live platform activity.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard stats payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AdminDashboardStats' },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden (Admin role required)' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List and search registered users with purchase stats',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search by user full name or email',
            schema: { type: 'string' },
          },
          {
            name: 'role',
            in: 'query',
            description: 'Filter by role (user, creator, admin)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/AdminUserItem' },
                        },
                        total: { type: 'integer', example: 42 },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/admin/users/{id}/role': {
      put: {
        tags: ['Admin'],
        summary: 'Elevate or modify user permission role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminUpdateRoleRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'User role updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AdminUserItem' },
                    message: { type: 'string', example: 'User role updated to admin.' },
                  },
                },
              },
            },
          },
          404: { description: 'User not found' },
        },
      },
    },
    '/admin/purchases': {
      get: {
        tags: ['Admin'],
        summary: 'Track subscription and upgrade transaction ledger',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'plan',
            in: 'query',
            description: 'Filter by planId (pro, enterprise, all)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Purchases ledger and summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/PurchaseRecord' },
                        },
                        total: { type: 'integer', example: 12 },
                        summary: {
                          type: 'object',
                          properties: {
                            totalRevenue: { type: 'number', example: 158.96 },
                            activeSubscriptions: { type: 'integer', example: 4 },
                            totalPurchases: { type: 'integer', example: 8 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/traffic': {
      get: {
        tags: ['Admin'],
        summary: 'Detailed web traffic and visitor analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'days',
            in: 'query',
            schema: { type: 'integer', default: 7 },
          },
        ],
        responses: {
          200: {
            description: 'Detailed traffic metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalViews: { type: 'integer', example: 840 },
                            uniqueVisitors: { type: 'integer', example: 420 },
                            bounceRate: { type: 'number', example: 24.5 },
                          },
                        },
                        topPages: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              path: { type: 'string' },
                              views: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/memes': {
      get: {
        tags: ['Admin'],
        summary: 'List all memes across the platform for moderation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of memes with author information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/SavedMemeItem' },
                        },
                        total: { type: 'integer', example: 9 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/memes/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Administratively remove or moderate a meme',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Meme removed by moderator',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Meme deleted by administrator.' },
                  },
                },
              },
            },
          },
          404: { description: 'Meme not found' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Server health check',
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        timestamp: { type: 'string', format: 'date-time' },
                        service: { type: 'string', example: 'MemeHub API Server' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
