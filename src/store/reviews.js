import { supabase } from '../lib/supabase.js';

export async function getReviewForBooking(bookingId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getReviewsForScholar(scholarId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('scholar_id', scholarId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRatingSummaries() {
  const { data, error } = await supabase
    .from('scholar_rating_summary')
    .select('*');
  if (error) {
    console.warn('Could not load rating summary:', error.message);
    return [];
  }
  return data || [];
}

export async function submitReview({ booking, rating, comment }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: booking.id,
      scholar_id: booking.scholarId,
      user_id: booking.userId,
      user_name: booking.user?.name || 'Anonymous',
      rating,
      comment: comment?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
