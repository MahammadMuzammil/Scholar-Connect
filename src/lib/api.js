async function request(path, init = {}) {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function requestVideoSession(booking, viewer) {
  return request('/api/video-session', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: booking.id,
      slotStartsAt: booking.slotStartsAt,
      durationMinutes: booking.durationMinutes || 30,
      displayName: viewer.displayName,
      isScholar: viewer.isScholar,
    }),
  });
}

export function notifyBookingCreated(booking) {
  return request('/api/notify', {
    method: 'POST',
    body: JSON.stringify(booking),
  }).catch((err) => {
    // Don't block booking flow on notification failure.
    console.warn('Notification request failed:', err);
    return null;
  });
}
