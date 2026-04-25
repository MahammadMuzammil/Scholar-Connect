import { createApp } from '../server/app.js';

// Single Vercel serverless function. The vercel.json rewrite forwards every
// /api/* request to /api/index, where this Express app handles the routing.
const app = createApp();

export default app;
