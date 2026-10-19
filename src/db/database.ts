import * as SQLite from 'expo-sqlite';

// Single shared connection for the whole app.
const db = SQLite.openDatabaseSync('ccb.db');
function seedStatuses() {
  if (!tableIsEmpty('statuses')) return;

  const statuses = [
    {
      contact_id: 1,
      caption: 'Getting ready for the stokvel meeting! 🇿🇦',
      bg_color: '#0D5740',
      timestamp: '08:00',
      viewed: 0,
    },
    {
      contact_id: 2,
      caption: 'Good morning everyone! ☀️',
      bg_color: '#F5A623',
      timestamp: '08:30',
      viewed: 0,
    },
    {
      contact_id: 4,
      caption: 'Beautiful day today ❤️',
      bg_color: '#D64545',
      timestamp: '09:15',
      viewed: 0,
    },
  ];

  statuses.forEach((s) => {
    db.runSync(
      `INSERT INTO statuses
       (contact_id, caption, bg_color, timestamp, viewed)
       VALUES (?, ?, ?, ?, ?)`,
      [
        s.contact_id,
        s.caption,
        s.bg_color,
        s.timestamp,
        s.viewed,
      ]
    );
  });
}

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      is_online INTEGER DEFAULT 0,
      language TEXT DEFAULT 'English'
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      is_sent INTEGER NOT NULL,
      translated INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts (id)
    );

    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      banner_color TEXT,
      member_count INTEGER DEFAULT 0,
      joined INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      counterparty TEXT NOT NULL,
      amount REAL NOT NULL,
      direction TEXT NOT NULL, -- 'sent' | 'received'
      timestamp TEXT NOT NULL
    );

   CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT,
  username TEXT,
  phone TEXT,
  avatar_color TEXT,
  photo_url TEXT,
  balance REAL DEFAULT 0,
  dark_mode INTEGER DEFAULT 0
);

    CREATE TABLE IF NOT EXISTS statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      caption TEXT NOT NULL,
      bg_color TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      viewed INTEGER DEFAULT 0,
      FOREIGN KEY (contact_id) REFERENCES contacts (id)
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      rating REAL DEFAULT 4.5,
      banner_color TEXT NOT NULL,
      description TEXT,
      address TEXT,
      phone TEXT,
      featured INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS business_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses (id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date_label TEXT NOT NULL,
      location TEXT NOT NULL,
      banner_color TEXT NOT NULL
    );
  `);

  migrateColumns();

  // Each seed function checks its own table, so a table added in a later
  // update still gets seeded even on a device that already has older data.
  seedContactsAndMessages();
  seedCommunities();
  seedTransactions();
  
  seedBusinesses();
  seedEvents();
}

// SQLite has no "ADD COLUMN IF NOT EXISTS" — try the ALTER and swallow the
// error if the column is already there (e.g. from an earlier app version).
function migrateColumns() {
  const tryAlter = (sql: string) => {
    try {
      db.execSync(sql);
    } catch {
      // column already exists — safe to ignore
    }
  };
  tryAlter('ALTER TABLE communities ADD COLUMN description TEXT');
  tryAlter('ALTER TABLE communities ADD COLUMN banner_color TEXT');
  tryAlter('ALTER TABLE profile ADD COLUMN balance REAL DEFAULT 0');
  tryAlter('ALTER TABLE profile ADD COLUMN dark_mode INTEGER DEFAULT 0');
  tryAlter('ALTER TABLE profile ADD COLUMN photo_url TEXT');
}

function tableIsEmpty(table: string): boolean {
  const row = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
  return !row || row.count === 0;
}

function seedContactsAndMessages() {
  if (!tableIsEmpty('contacts')) return;

  const contacts = [
    { name: 'Thabo Nkosi', color: '#0D5740', online: 1, language: 'Zulu' },
    { name: 'Lerato Molefe', color: '#F5A623', online: 1, language: 'Sesotho' },
    { name: 'Sipho Dlamini', color: '#1A6B4A', online: 0, language: 'Zulu' },
    { name: 'Nomvula Khumalo', color: '#D64545', online: 1, language: 'Xhosa' },
    { name: 'Ayanda Mahlangu', color: '#3FBF6F', online: 0, language: 'Ndebele' },
  ];

  contacts.forEach((c) => {
    db.runSync(
      'INSERT INTO contacts (name, avatar_color, is_online, language) VALUES (?, ?, ?, ?)',
      [c.name, c.color, c.online, c.language]
    );
  });

  db.runSync(
    "INSERT INTO messages (contact_id, text, is_sent, translated, timestamp) VALUES (1, 'Sawubona! Are we still on for the stokvel meeting?', 0, 1, '08:12')"
  );
  db.runSync(
    "INSERT INTO messages (contact_id, text, is_sent, translated, timestamp) VALUES (1, 'Yes, 100%! I will bring the snacks.', 1, 0, '08:14')"
  );
}

function seedCommunities() {
  if (!tableIsEmpty('communities')) return;

  const communities = [
    {
      name: 'Soweto Small Business Network',
      category: 'Business',
      description: 'Local entrepreneurs sharing leads, suppliers, and advice.',
      color: '#0D5740',
      members: 1204,
      joined: 1,
    },
    {
      name: 'Joburg Stokvel Circle',
      category: 'Finance',
      description: 'A community stokvel for saving and investing together.',
      color: '#F5A623',
      members: 342,
      joined: 1,
    },
    {
      name: 'Cape Town Foodies',
      category: 'Lifestyle',
      description: 'Sharing the best kota spots, recipes, and food events.',
      color: '#D64545',
      members: 890,
      joined: 0,
    },
    {
      name: 'Durban Matric Class of 2026',
      category: 'Education',
      description: 'Study groups, past papers, and exam prep support.',
      color: '#1A6B4A',
      members: 156,
      joined: 0,
    },
    {
      name: 'Amateur Football Jozi',
      category: 'Sports',
      description: 'Organising weekend five-a-side games across Joburg.',
      color: '#3FBF6F',
      members: 512,
      joined: 0,
    },
    {
      name: 'SA Creatives Collective',
      category: 'Arts',
      description: 'Artists, musicians and designers showcasing local work.',
      color: '#6B4EC6',
      members: 673,
      joined: 0,
    },
  ];

  communities.forEach((c) => {
    db.runSync(
      'INSERT INTO communities (name, category, description, banner_color, member_count, joined) VALUES (?, ?, ?, ?, ?, ?)',
      [c.name, c.category, c.description, c.color, c.members, c.joined]
    );
  });
}

function seedTransactions() {
  if (!tableIsEmpty('transactions')) return;

  const transactions = [
    { counterparty: 'Thabo Nkosi', amount: 250, direction: 'sent' },
    { counterparty: 'Kota Corner Spaza', amount: 45, direction: 'sent' },
    { counterparty: 'Lerato Molefe', amount: 500, direction: 'received' },
  ];
  transactions.forEach((t) => {
    db.runSync(
      "INSERT INTO transactions (counterparty, amount, direction, timestamp) VALUES (?, ?, ?, datetime('now'))",
      [t.counterparty, t.amount, t.direction]
    );
  });
}

function seedBusinesses() {
  if (!tableIsEmpty('businesses')) return;

  const businesses = [
    {
      name: "Mama Thandi's Kitchen",
      category: 'Food',
      rating: 4.8,
      color: '#F5A623',
      description: 'Home-style South African cooking — bunny chow, pap & wors, and daily specials.',
      address: '14 Vilakazi St, Soweto',
      phone: '+27 71 234 5678',
      featured: 1,
      services: [
        { name: 'Bunny chow (medium)', price: 'R55' },
        { name: 'Pap, wors & chakalaka', price: 'R65' },
        { name: 'Catering for 20 people', price: 'R950' },
      ],
    },
    {
      name: 'Sithole Auto Repairs',
      category: 'Automotive',
      rating: 4.6,
      color: '#1C1C2E',
      description: 'Trusted local mechanic for services, diagnostics, and tyre changes.',
      address: '88 Main Rd, Katlehong',
      phone: '+27 82 345 6789',
      featured: 1,
      services: [
        { name: 'Full service', price: 'R850' },
        { name: 'Brake pad replacement', price: 'R450' },
        { name: 'Tyre change (each)', price: 'R120' },
      ],
    },
    {
      name: 'Glow Hair & Beauty',
      category: 'Beauty',
      rating: 4.9,
      color: '#D64545',
      description: 'Braids, weaves, and nail care by appointment or walk-in.',
      address: '5 Bree St, Johannesburg CBD',
      phone: '+27 63 456 7890',
      featured: 1,
      services: [
        { name: 'Box braids', price: 'R450' },
        { name: 'Gel manicure', price: 'R180' },
        { name: 'Silk press', price: 'R250' },
      ],
    },
    {
      name: 'Nkosi Legal Services',
      category: 'Services',
      rating: 4.7,
      color: '#0D5740',
      description: 'Affordable legal advice for contracts, small claims, and family matters.',
      address: '22 Church St, Pretoria',
      phone: '+27 12 345 6789',
      featured: 0,
      services: [
        { name: 'Initial consultation', price: 'R300' },
        { name: 'Contract review', price: 'R650' },
      ],
    },
    {
      name: 'Corner Spaza Shop',
      category: 'Retail',
      rating: 4.3,
      color: '#3FBF6F',
      description: 'Everyday essentials, airtime, and cold drinks — open till late.',
      address: '3 Ndlovu St, Soweto',
      phone: '+27 71 987 6543',
      featured: 0,
      services: [
        { name: 'Airtime & data', price: 'From R5' },
        { name: 'Bread & milk', price: 'From R15' },
      ],
    },
    {
      name: 'Vitality Wellness Clinic',
      category: 'Health',
      rating: 4.8,
      color: '#6B4EC6',
      description: 'General check-ups, chronic medication, and wellness screenings.',
      address: '10 Voortrekker Rd, Cape Town',
      phone: '+27 21 456 7890',
      featured: 0,
      services: [
        { name: 'General consultation', price: 'R350' },
        { name: 'Blood pressure check', price: 'Free' },
      ],
    },
  ];

  businesses.forEach((b) => {
    const result = db.runSync(
      'INSERT INTO businesses (name, category, rating, banner_color, description, address, phone, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [b.name, b.category, b.rating, b.color, b.description, b.address, b.phone, b.featured]
    );
    b.services.forEach((s) => {
      db.runSync(
        'INSERT INTO business_services (business_id, name, price) VALUES (?, ?, ?)',
        [result.lastInsertRowId, s.name, s.price]
      );
    });
  });
}

function seedEvents() {
  if (!tableIsEmpty('events')) return;

  const events = [
    { title: 'Soweto Wine & Lifestyle Festival', category: 'Lifestyle', date_label: 'Sat 27 Sep', location: 'Soweto Theatre', color: '#0D5740' },
    { title: 'Joburg Small Business Expo', category: 'Business', date_label: 'Wed 1 Oct', location: 'Sandton Convention Centre', color: '#F5A623' },
    { title: 'Community Football Tournament', category: 'Sports', date_label: 'Sun 5 Oct', location: 'Orlando Stadium grounds', color: '#3FBF6F' },
    { title: 'Local Artists Market', category: 'Arts', date_label: 'Sat 11 Oct', location: 'Maboneng Precinct', color: '#6B4EC6' },
  ];

  events.forEach((e) => {
    db.runSync(
      'INSERT INTO events (title, category, date_label, location, banner_color) VALUES (?, ?, ?, ?, ?)',
      [e.title, e.category, e.date_label, e.location, e.color]
    );
  });
}

export type ChatListItem = {
  id: number;
  name: string;
  avatar_color: string;
  is_online: number;
  language: string;
  last_message_text: string | null;
  last_message_is_sent: number | null;
  last_message_translated: number | null;
  last_message_timestamp: string | null;
};

export function getChatList(): ChatListItem[] {
  return db.getAllSync<ChatListItem>(`
    SELECT
      c.id,
      c.name,
      c.avatar_color,
      c.is_online,
      c.language,
      m.text AS last_message_text,
      m.is_sent AS last_message_is_sent,
      m.translated AS last_message_translated,
      m.timestamp AS last_message_timestamp
    FROM contacts c
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE contact_id = c.id ORDER BY id DESC LIMIT 1
    )
    ORDER BY c.id ASC
  `);
}

export type Profile = {
  id: number;
  name: string;
  username: string;
  phone: string;
  avatar_color: string;
  photo_url: string | null;
  balance: number;
  dark_mode: number;
};

export function saveProfile(
  profile: Omit<Profile, 'id'>
) {
  db.runSync(
    `
      INSERT INTO profile (
        id,
        name,
        username,
        phone,
        avatar_color,
        photo_url,
        balance,
        dark_mode
      )
      VALUES (
        1,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        username = excluded.username,
        phone = excluded.phone,
        avatar_color = excluded.avatar_color,
        photo_url = excluded.photo_url,
        balance = excluded.balance,
        dark_mode = excluded.dark_mode
    `,
    [
      profile.name,
      profile.username,
      profile.phone,
      profile.avatar_color,
      profile.photo_url,
      profile.balance,
      profile.dark_mode,
    ]
  );
}

export function getProfile(): Profile | null {
  const row = db.getFirstSync<Profile>('SELECT * FROM profile WHERE id = 1');
  return row ?? null;
}

export type Message = {
  id: number;
  contact_id: number;
  text: string;
  is_sent: number;
  translated: number;
  timestamp: string;
};

export function getMessagesForContact(contactId: number): Message[] {
  return db.getAllSync<Message>(
    'SELECT * FROM messages WHERE contact_id = ? ORDER BY id ASC',
    [contactId]
  );
}

export function sendMessage(contactId: number, text: string): Message {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const result = db.runSync(
    'INSERT INTO messages (contact_id, text, is_sent, translated, timestamp) VALUES (?, ?, 1, 0, ?)',
    [contactId, text, timestamp]
  );

  return {
    id: result.lastInsertRowId,
    contact_id: contactId,
    text,
    is_sent: 1,
    translated: 0,
    timestamp,
  };
}

export type StatusItem = {
  status_id: number;
  contact_id: number;
  name: string;
  avatar_color: string;
  caption: string;
  bg_color: string;
  timestamp: string;
  viewed: number;
};

export function getStatusUpdates(): StatusItem[] {
  return db.getAllSync<StatusItem>(`
    SELECT
      s.id AS status_id,
      c.id AS contact_id,
      c.name,
      c.avatar_color,
      s.caption,
      s.bg_color,
      s.timestamp,
      s.viewed
    FROM statuses s
    JOIN contacts c ON c.id = s.contact_id
    ORDER BY s.viewed ASC, s.id DESC
  `);
}

export function markStatusViewed(statusId: number) {
  db.runSync('UPDATE statuses SET viewed = 1 WHERE id = ?', [statusId]);
}

export type Community = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  banner_color: string | null;
  member_count: number;
  joined: number;
};

export function getCommunities(): Community[] {
  return db.getAllSync<Community>('SELECT * FROM communities ORDER BY joined DESC, member_count DESC');
}

export function toggleJoinCommunity(id: number) {
  db.runSync(
    `UPDATE communities
     SET joined = CASE WHEN joined = 1 THEN 0 ELSE 1 END,
         member_count = member_count + CASE WHEN joined = 1 THEN -1 ELSE 1 END
     WHERE id = ?`,
    [id]
  );
}

export type Business = {
  id: number;
  name: string;
  category: string;
  rating: number;
  banner_color: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  featured: number;
};

export type BusinessService = {
  id: number;
  business_id: number;
  name: string;
  price: string;
};

export function getBusinesses(): Business[] {
  return db.getAllSync<Business>('SELECT * FROM businesses ORDER BY featured DESC, rating DESC');
}

export function getBusinessById(id: number): Business | null {
  const row = db.getFirstSync<Business>('SELECT * FROM businesses WHERE id = ?', [id]);
  return row ?? null;
}

export function getServicesForBusiness(businessId: number): BusinessService[] {
  return db.getAllSync<BusinessService>(
    'SELECT * FROM business_services WHERE business_id = ?',
    [businessId]
  );
}

export type EventItem = {
  id: number;
  title: string;
  category: string;
  date_label: string;
  location: string;
  banner_color: string;
};

export function getEvents(): EventItem[] {
  return db.getAllSync<EventItem>('SELECT * FROM events ORDER BY id ASC');
}

export type Transaction = {
  id: number;
  counterparty: string;
  amount: number;
  direction: 'sent' | 'received';
  timestamp: string;
};

export function getTransactions(): Transaction[] {
  return db.getAllSync<Transaction>('SELECT * FROM transactions ORDER BY id DESC');
}

export function getWalletBalance(): number {
  const row = db.getFirstSync<{ balance: number }>('SELECT balance FROM profile WHERE id = 1');
  return row?.balance ?? 2500;
}

export function sendMoney(counterparty: string, amount: number) {
  db.runSync('UPDATE profile SET balance = balance - ? WHERE id = 1', [amount]);
  db.runSync(
    "INSERT INTO transactions (counterparty, amount, direction, timestamp) VALUES (?, ?, 'sent', datetime('now'))",
    [counterparty, amount]
  );
}

export function requestMoney(counterparty: string, amount: number) {
  // In a real app this would notify the counterparty; here we just log the request as a transaction.
  db.runSync(
    "INSERT INTO transactions (counterparty, amount, direction, timestamp) VALUES (?, ?, 'received', datetime('now'))",
    [`Request to ${counterparty}`, amount]
  );
}

export function topUpWallet(amount: number) {
  db.runSync('UPDATE profile SET balance = balance + ? WHERE id = 1', [amount]);
  db.runSync(
    "INSERT INTO transactions (counterparty, amount, direction, timestamp) VALUES ('Wallet top-up', ?, 'received', datetime('now'))",
    [amount]
  );
}

export type ProfileStats = {
  contactsCount: number;
  communitiesCount: number;
  transactionsCount: number;
};

export function getProfileStats(): ProfileStats {
  const contacts = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM contacts');
  const communities = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM communities WHERE joined = 1'
  );
  const transactions = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions'
  );
  return {
    contactsCount: contacts?.count ?? 0,
    communitiesCount: communities?.count ?? 0,
    transactionsCount: transactions?.count ?? 0,
  };
}

export function setDarkModePref(enabled: boolean) {
  db.runSync('UPDATE profile SET dark_mode = ? WHERE id = 1', [enabled ? 1 : 0]);
}

export default db;
