import { supabase } from '../lib/supabase.js';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    user: { name: row.user_name, email: row.user_email },
    scholarId: row.scholar_id,
    scholarName: row.scholar_name,
    slotId: row.slot_id,
    slotStartsAt: row.slot_starts_at,
    durationMinutes: row.duration_minutes,
    amount: row.amount,
    basePrice: row.base_price,
    postFajr: row.post_fajr,
    premiumPercent: row.premium_percent,
    topic: row.topic,
    roomId: row.room_id,
    status: row.status,
    read: row.read,
    transactionId: row.transaction_id,
    createdAt: row.created_at,
  };
}

function toRow(booking) {
  return {
    id: booking.id,
    user_id: booking.userId,
    user_name: booking.user?.name || '',
    user_email: booking.user?.email || '',
    scholar_id: booking.scholarId,
    scholar_name: booking.scholarName,
    slot_id: booking.slotId,
    slot_starts_at: booking.slotStartsAt,
    duration_minutes: booking.durationMinutes || 30,
    amount: booking.amount,
    base_price: booking.basePrice || booking.amount,
    post_fajr: Boolean(booking.postFajr),
    premium_percent: booking.premiumPercent || 0,
    topic: booking.topic || null,
    room_id: booking.roomId,
    status: booking.status || 'confirmed',
    read: Boolean(booking.read),
    transaction_id: booking.transactionId || null,
  };
}

function newId() {
  return `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newRoomId() {
  return `scholar-connect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createBooking(input) {
  const booking = {
    id: newId(),
    roomId: newRoomId(),
    status: 'confirmed',
    read: false,
    ...input,
  };
  const { data, error } = await supabase
    .from('bookings')
    .insert(toRow(booking))
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function getBooking(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

export async function getBookingsForUser(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function getBookingsForScholar(scholarId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('scholar_id', scholarId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function getBookedSlotIds(scholarId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('slot_id')
    .eq('scholar_id', scholarId);
  if (error) throw error;
  return new Set((data || []).map((r) => r.slot_id));
}

export async function markRead(id) {
  const { error } = await supabase
    .from('bookings')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

// Realtime subscription — fires whenever any booking row changes.
// Pass a filter (e.g., { scholarId } or { userId }) to scope it.
export function subscribeBookings({ scholarId, userId } = {}, onChange) {
  // Each subscription gets its own channel — Supabase forbids reusing a channel
  // name across multiple .subscribe() calls.
  const tag = Math.random().toString(36).slice(2, 9);
  const key = scholarId || userId || 'all';
  const channel = supabase
    .channel(`bookings:${key}:${tag}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        ...(scholarId ? { filter: `scholar_id=eq.${scholarId}` } : {}),
        ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
