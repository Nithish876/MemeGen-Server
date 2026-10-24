export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MemeHub REST API & Supabase Backend',
    version: '1.0.0',
    description: `
## Welcome to the MemeHub Backend API

MemeHub is a viral meme generation, canvas editing, and community publishing platform.
This API handles:
- **Authentication**: Creator sign-up, sign-in, JWT token generation, and user profile management.
- **Templates**: Curated meme templates with automatic category filtering, search, and pre-configured text layout slots.
- **Editing Drafts (Auto-Sync)**: Continuous real-time syncing of in-progress canvas layers, positions, and styling to **Supabase** (or local resilient store).
- **Meme Persistence**: Permanent storage of exported and published memes with community likes and feedback.

### Authentication
Protected endpoints require an HTTP Bearer JWT token in the \`Authorization\` header:
\`\`\`http
Authorization: Bearer <your_jwt_token>
\`\`\`
Obtain a token via \`POST /api/v1/auth/login\` or \`POST /api/v1/auth/register\`.
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
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.memegen.example.com/api/v1',
      description: 'Production Server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, login, profile verification, and session logout',
    },
    {
      name: 'Templates',
      description: 'Browse curated meme templates, search by tags and keywords, filter by category',
    },
    {
      name: 'Drafts',
      description: 'In-progress meme editing canvas state synchronization and recovery',
    },
    {
      name: 'Memes',
      description: 'User exported memes library, community explore feed, and likes',
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
