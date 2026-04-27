import { supabase } from '../lib/supabase.js';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    specialties: row.specialties || [],
    languages: row.languages || [],
    rating: row.rating != null ? Number(row.rating) : null,
    reviews: row.reviews ?? 0,
    pricePerSession: row.price_per_session,
    sessionMinutes: row.session_minutes,
    photo: row.photo,
    bio: row.bio,
    phone: row.phone,
    verified: row.verified,
    active: row.active,
  };
}

export async function listScholars() {
  const { data, error } = await supabase
    .from('scholars')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function fetchScholarById(id) {
  const { data, error } = await supabase
    .from('scholars')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

// Upload a new profile photo for the given scholar to Supabase Storage and
// update the scholars row's `photo` URL. Requires:
//   1. a public bucket called 'scholar-photos' (see supabase/schema.sql)
//   2. an authenticated user — RLS allows any authenticated user to write
export async function uploadScholarPhoto(scholarId, file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB.');
  }

  // Use a timestamped filename so the URL changes — sidesteps any browser
  // image cache from a previous upload.
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${scholarId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('scholar-photos')
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from('scholar-photos').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: updateErr } = await supabase
    .from('scholars')
    .update({ photo: publicUrl })
    .eq('id', scholarId);
  if (updateErr) throw updateErr;

  return publicUrl;
}

// Generate available slots for a scholar (next 5 days, 6 fixed hours per day).
// Kept client-side for now; could move to DB if scholars want custom availability.
export function generateSlots(scholarId) {
  const slots = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let d = 1; d <= 5; d++) {
    for (const hour of [6, 10, 12, 15, 17, 19]) {
      const slot = new Date(now);
      slot.setDate(slot.getDate() + d);
      slot.setHours(hour);
      slots.push({
        id: `${scholarId}-${slot.toISOString()}`,
        scholarId,
        startsAt: slot.toISOString(),
      });
    }
  }
  return slots;
}
