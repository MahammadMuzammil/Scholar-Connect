export const scholars = [
  {
    id: 'sh-muzammil',
    name: 'Sheikh Muzammil',
    title: 'Mufti & Islamic Jurisprudence Scholar',
    specialties: ['Fiqh', 'Family Matters', 'Ramadan Rulings'],
    languages: ['Urdu', 'Arabic', 'English'],
    rating: 4.9,
    reviews: 1420,
    pricePerSession: 40,
    sessionMinutes: 30,
    photo: 'https://i.pravatar.cc/300?img=12',
    bio: 'Specializes in contemporary fiqh issues, family rulings, and guidance during Ramadan. Trained in the classical Hanafi tradition with 15+ years of teaching.',
    verified: true,
  },
  {
    id: 'sh-farooq',
    name: 'Sheikh Farooq',
    title: 'Aqeedah & Seerah Scholar',
    specialties: ['Aqeedah', 'Seerah', 'Dream Interpretation'],
    languages: ['Arabic', 'English', 'Urdu'],
    rating: 4.8,
    reviews: 980,
    pricePerSession: 50,
    sessionMinutes: 30,
    photo: 'https://i.pravatar.cc/300?img=33',
    bio: 'Teaches aqeedah and Prophetic biography at an international Islamic institute. Also provides Shariah-grounded dream interpretation in the tradition of Imam Ibn Sirin.',
    verified: true,
  },
];

export function getScholar(id) {
  return scholars.find((s) => s.id === id);
}

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
