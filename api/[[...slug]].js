import { createApp } from '../server/app.js';

// Vercel optional-catch-all: this file handles every path under /api/* and /api.
// The Express app mounts its own routes (e.g. /api/video-session, /api/notify)
// which Vercel passes through untouched.
const app = createApp();

export default app;
