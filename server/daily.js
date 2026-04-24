const DAILY_API = 'https://api.daily.co/v1';
const apiKey = () => process.env.DAILY_API_KEY;
const domain = () => process.env.DAILY_DOMAIN;

// Daily.co room name constraints: lowercase, numbers, hyphens, <=128 chars.
function roomNameFor(bookingId) {
  return String(bookingId).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) || `sc-${Date.now()}`;
}

async function callDaily(path, init = {}) {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Daily API ${res.status}: ${body}`);
  }
  return res.json();
}

async function ensureRoom(roomName, closeAt) {
  try {
    return await callDaily(`/rooms/${roomName}`);
  } catch (err) {
    // Create on 404; rethrow other errors.
    if (!err.message.includes('404')) throw err;
  }
  return callDaily('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        max_participants: 2,
        enable_prejoin_ui: false,
        enable_knocking: false,
        exp: Math.floor(closeAt / 1000),
      },
    }),
  });
}

async function createMeetingToken({ roomName, displayName, isOwner, closeAt }) {
  const { token } = await callDaily('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: displayName || 'Guest',
        is_owner: Boolean(isOwner),
        exp: Math.floor(closeAt / 1000),
      },
    }),
  });
  return token;
}

export async function provisionVideoSession({ bookingId, closeAt, displayName, isScholar }) {
  if (!apiKey() || !domain()) {
    // Fallback: use public Jitsi. No server-issued token — clearly marked as dev fallback.
    const roomId = `scholar-connect-${roomNameFor(bookingId)}`;
    const name = encodeURIComponent(displayName || 'Guest');
    return {
      provider: 'jitsi',
      roomUrl: `https://meet.jit.si/${roomId}#userInfo.displayName=%22${name}%22&config.prejoinPageEnabled=false`,
      warning: 'DAILY_API_KEY or DAILY_DOMAIN not set — using unauthenticated Jitsi fallback.',
    };
  }

  const roomName = roomNameFor(bookingId);
  const room = await ensureRoom(roomName, closeAt);
  const token = await createMeetingToken({
    roomName: room.name,
    displayName,
    isOwner: isScholar,
    closeAt,
  });
  return {
    provider: 'daily',
    roomUrl: `https://${domain()}.daily.co/${room.name}?t=${token}`,
    token,
    expiresAt: closeAt,
  };
}
