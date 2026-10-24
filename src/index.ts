import app from './server.js';
import { db } from './config/db.js';
import { isSupabaseConfigured } from './config/supabase.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 MemeHub TypeScript Backend Server running on port ${PORT}`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api/v1`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`💾 Supabase Status: ${isSupabaseConfigured() ? 'Connected ✅' : 'Pending Keys (Using Local Resilient DB) ⚡'}`);
  console.log(`===============================================`);

  // Auto-seed templates if connected to a fresh Supabase database
  if (isSupabaseConfigured()) {
    await db.templates.seedIfEmpty();
  }
});

export default app;
