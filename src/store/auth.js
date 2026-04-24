const SESSION_KEY = 'scholar-connect:session';
const USERS_KEY = 'scholar-connect:users';

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('session-updated'));
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession() {
  return readSession();
}

export function subscribeSession(handler) {
  const fn = () => handler(readSession());
  window.addEventListener('session-updated', fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener('session-updated', fn);
    window.removeEventListener('storage', fn);
  };
}

export function logout() {
  writeSession(null);
}

export function signupUser({ name, email, password }) {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with that email already exists.');
  }
  const user = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    email,
    password,
  };
  users.push(user);
  writeUsers(users);
  const session = { role: 'user', id: user.id, name: user.name, email: user.email };
  writeSession(session);
  return session;
}

export function loginUser({ email, password }) {
  const users = readUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) throw new Error('Invalid email or password.');
  const session = { role: 'user', id: user.id, name: user.name, email: user.email };
  writeSession(session);
  return session;
}

export function loginScholar({ scholarId, passcode }) {
  // Demo passcode — in production, scholars would have real credentials.
  if (passcode !== 'scholar123') {
    throw new Error('Invalid passcode. (Demo: use scholar123)');
  }
  const session = { role: 'scholar', id: scholarId };
  writeSession(session);
  return session;
}
