// Scholar profile data now lives in Supabase (`scholars` table).
// Read via the ScholarsContext (useScholars, useScholar) or the store
// functions in src/store/scholars.js.
//
// This file re-exports `generateSlots` only, which is still client-side.
export { generateSlots } from '../store/scholars.js';
