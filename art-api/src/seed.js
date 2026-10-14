import { randomUUID } from 'node:crypto';
import { openDatabase } from './db/client.js';

const db = openDatabase();
await db.applySchema();

// ---------------------------------------------------------------------------
// Pools for generating realistic customer data
// ---------------------------------------------------------------------------
const CUSTOMER_FIRST_NAMES = [
  'Eleanor', 'Marcus', 'Sofia', 'Robert', 'Priya', 'Alexander', 'Charlotte', 'Liam', 'Emma',
  'Noah', 'Olivia', 'James', 'Amelia', 'Benjamin', 'Mia', 'Elijah', 'Harper', 'Lucas',
  'Evelyn', 'Mason', 'Abigail', 'Oliver', 'Emily', 'Daniel', 'Elizabeth', 'Henry', 'Mila',
  'Matthew', 'Ella', 'Jackson', 'Avery', 'Sebastian', 'Scarlett', 'David', 'Chloe', 'Joseph',
  'Victoria', 'Samuel', 'Grace', 'John', 'Zoey', 'Owen', 'Penelope', 'Dylan', 'Riley',
  'Luke', 'Nora', 'Gabriel', 'Lily', 'Anthony', 'Hannah', 'Isaac', 'Lillian', 'Julian',
  'Addison', 'Christopher', 'Aubrey', 'Joshua', 'Ellie', 'Andrew', 'Stella', 'Theodore', 'Natalie',
  'Caleb', 'Zoe', 'Ryan', 'Leah', 'Asher', 'Hazel', 'Nathan', 'Violet', 'Thomas', 'Aurora',
  'Leo', 'Savannah', 'Isaiah', 'Audrey', 'Charles', 'Brooklyn', 'Josiah', 'Bella', 'Christian', 'Claire',
];

const CUSTOMER_LAST_NAMES = [
  'Whitfield', 'Chen', 'Alvarez', 'Okonkwo', 'Natarajan', 'Smith', 'Johnson', 'Williams',
  'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez',
  'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright',
  'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson',
  'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez',
  'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins',
  'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez',
  'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard',
];

const STREET_NAMES = [
  'Harbour Lane', 'King St W', 'Rue Saint-Paul', 'Granville St', 'Elgin Ave', 'Maple St',
  'Oak Ave', 'Cedar Blvd', 'Pine Rd', 'Elm St', 'Park Ave', 'Broadway', '5th Ave',
  'Sunset Blvd', 'Market St', 'Chestnut St', 'Walnut Rd', 'Highland Ave', 'Bay St',
  'Queen St E', 'Robson St', 'Bleury St', 'Jasper Ave', 'Main St', 'River Rd',
];

const CITIES = [
  { city: 'Halifax', province: 'NS', zip: 'B3H 2Y5', area: '902' },
  { city: 'Toronto', province: 'ON', zip: 'M5H 1A1', area: '416' },
  { city: 'Montreal', province: 'QC', zip: 'H2Y 1G6', area: '514' },
  { city: 'Vancouver', province: 'BC', zip: 'V6C 1T2', area: '604' },
  { city: 'Ottawa', province: 'ON', zip: 'K1P 5W1', area: '613' },
  { city: 'Calgary', province: 'AB', zip: 'T2P 1J9', area: '403' },
  { city: 'New York', province: 'NY', zip: '10001', area: '212' },
  { city: 'Chicago', province: 'IL', zip: '60601', area: '312' },
  { city: 'San Francisco', province: 'CA', zip: '94102', area: '415' },
  { city: 'Seattle', province: 'WA', zip: '98101', area: '206' },
  { city: 'Boston', province: 'MA', zip: '02108', area: '617' },
  { city: 'Austin', province: 'TX', zip: '78701', area: '512' },
  { city: 'Denver', province: 'CO', zip: '80202', area: '303' },
];

const EMAIL_DOMAINS = ['example.com', 'example.org', 'artmail.com', 'collector.net'];

// ---------------------------------------------------------------------------
// Pools for generating realistic artists and artworks
// ---------------------------------------------------------------------------
const ARTIST_FIRST_NAMES = [
  'Mara', 'Jonas', 'Ines', 'Takeshi', 'Camille', 'Astrid', 'Mateo', 'Elena', 'Amara', 'Callum',
  'Soraya', 'Henrik', 'Kwesi', 'Lucia', 'Nikolai', 'Freja', 'Gabriel', 'Siobhan', 'Kenji', 'Zuri',
  'Aris', 'Yael', 'Celine', 'Daan', 'Nadia', 'Finnian', 'Mei-Ling', 'Thabo', 'Anouk', 'Leif',
  'Sora', 'Dario', 'Kaelen', 'Solene', 'Tariq', 'Mireille', 'Elowen', 'Bram', 'Sun-Hee', 'Malik',
  'Chiara', 'Orion', 'Zahra', 'Viggo', 'Aurelia', 'Renato', 'Linnea', 'Kiran', 'Cosima', 'Tenzin',
  'Elodie', 'Kazuki', 'Paloma', 'Ronan', 'Fatima', 'Stellan', 'Sylvie', 'Dante', 'Amina', 'Soren',
  'Livia', 'Hassan', 'Klara', 'Emre', 'Noor', 'Javier', 'Bao', 'Talia', 'Gideon', 'Rhea',
  'Idris', 'Marisol', 'Tobias', 'Althea', 'Zane', 'Saskia', 'Hamza', 'Ingrid', 'Darius', 'Mina',
];

const ARTIST_LAST_NAMES = [
  'Lindqvist', 'Okafor', 'Duarte', 'Mori', 'Laurent', 'Lindholm', 'Silva', 'Rostova', 'Vance', 'MacLeod',
  'Hadid', 'Dahl', 'Mensah', 'Ferrara', 'Voronin', 'Nielsen', 'Santos', "O'Connor", 'Takahashi', 'Mwangi',
  'Thorne', 'Ben-David', 'Moreau', 'Van Dijk', 'Kassem', 'Gallagher', 'Zhou', 'Dlamini', 'Fontaine', 'Bergstrom',
  'Tanaka', 'Castiglione', 'Beaumont', 'Belkacem', 'Hansen', 'Vassiliev', 'Sato', 'Kovacs', 'Mercier', 'Oladipo',
  'Bellerose', 'Schreiber', 'Lombardi', 'Abebe', 'Navarro', 'Holst', 'Kallio', 'Solomon', 'Dubois', 'Matsuda',
  'Larsson', 'Papadopoulos', 'Al-Mansoor', 'De Vries', 'Cabrera', 'Kaufmann', 'Bianchi', 'Sinclair', 'Adebayo', 'Fischer',
  'Montague', 'Gomez-Rey', 'Eskeland', 'Tariq', 'Valente', 'Hakimi', 'Sorensen', 'Rousseau', 'Chowdhury', 'Varga',
  'Winter', 'Ashford', 'Carvalho', 'Bautista', 'Kowalski', 'Haddad', 'Nygard', 'Correa', 'Bisset', 'Strom',
];

const ART_TITLES_ADJECTIVES = [
  'Northern', 'Tidal', 'Winter', 'Market', 'Quiet', 'Lantern', 'Fragments', 'Salt &', 'Pine in', 'Red',
  'Golden', 'Silent', 'Crimson', 'Celestial', 'Ephemeral', 'Urban', 'Velvet', 'Midnight', 'Rustic', 'Luminous',
  'Subtle', 'Infinite', 'Whispering', 'Echoing', 'Fractured', 'Solar', 'Autumn', 'Distant', 'Cobalt', 'Solitary',
  'Vibrant', 'Shadowed', 'Amber', 'Drifting', 'Still', 'Woven', 'Emerald', 'Serene', 'Radiant', 'Verdant',
  'Gilded', 'Hollow', 'Fading', 'Hidden', 'Ancient', 'Wandering', 'Prismatic', 'Sunkissed', 'Obsidian', 'Misty',
];

const ART_TITLES_NOUNS = [
  'Reverie', 'Memory', 'Static', 'at Dusk', 'Harbour', 'Street', 'No. 7', 'Copper', 'Fog', 'Gate',
  'Horizon', 'Symphony', 'Solitude', 'Passage', 'Reflection', 'Mirage', 'Current', 'Tapestry', 'Sanctuary', 'Echo',
  'Tide', 'Twilight', 'Dawn', 'Canopy', 'Rhythm', 'Silhouette', 'Resonance', 'Meadow', 'Monolith', 'Chamber',
  'Spire', 'Shores', 'Oasis', 'Labyrinth', 'Constellation', 'Solstice', 'Bloom', 'Nocturne', 'Pulse', 'Mirage',
  'Equinox', 'Glade', 'Summit', 'Vortex', 'Haven', 'Cascade', 'Genesis', 'Fable', 'Illusion', 'Zenith',
];

const ART_MEDIA = ['Oils', 'Acrylic', 'Watercolour', 'Mixed media', 'Ink', 'Charcoal', 'Gouache', 'Pastel', 'Encaustic'];
const ART_STYLES = ['Abstract', 'Impressionism', 'Realism', 'Contemporary', 'Minimalism', 'Expressionism', 'Surrealism', 'Cubism'];
const ART_SIZES = ['16 x 20 in', '18 x 24 in', '20 x 20 in', '24 x 30 in', '24 x 36 in', '30 x 40 in', '36 x 48 in', '40 x 40 in', '48 x 60 in', '12 x 16 in'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Simple seeded PRNG for consistent yet varied generation
let seed = 42;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function randInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function sample(array) {
  return array[Math.floor(random() * array.length)];
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function formatDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// ---------------------------------------------------------------------------
// Generate 100 unique customers
// ---------------------------------------------------------------------------
const customers = [];
const customerNamesUsed = new Set();

while (customers.length < 100) {
  const firstName = sample(CUSTOMER_FIRST_NAMES);
  const lastName = sample(CUSTOMER_LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  if (customerNamesUsed.has(fullName)) continue;
  customerNamesUsed.add(fullName);

  const cityInfo = sample(CITIES);
  const streetNum = randInt(10, 999);
  const street = sample(STREET_NAMES);
  const unit = random() > 0.65 ? `, Unit ${randInt(101, 1405)}` : '';
  const address = `${streetNum} ${street}${unit}, ${cityInfo.city}, ${cityInfo.province} ${cityInfo.zip}`;

  const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const sanitizedLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const domain = sample(EMAIL_DOMAINS);
  const email = `${sanitizedFirst}.${sanitizedLast}@${domain}`;

  const phone = `${cityInfo.area}-555-${pad(randInt(1, 99))}${pad(randInt(0, 99))}`;
  const age = randInt(22, 78);
  const credit = sample([0, 0, 250, 500, 750, 1000, 1500, 2500, 3500, 5000, 7500, 10000, 12500, 15000]);

  customers.push({
    id: randomUUID(),
    name: fullName,
    age,
    email,
    phone,
    address,
    credit,
  });
}

// ---------------------------------------------------------------------------
// Generate 100 unique artists (minimum 80 required) with avatars & bios
// ---------------------------------------------------------------------------
const artistsUsed = new Set();
const artists = [];

while (artists.length < 100) {
  const firstName = sample(ARTIST_FIRST_NAMES);
  const lastName = sample(ARTIST_LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  if (artistsUsed.has(fullName)) continue;
  artistsUsed.add(fullName);

  const id = randomUUID();
  const avatar = `https://i.pravatar.cc/300?u=${id}`;
  const bio = `${sample(['Renowned', 'Emerging', 'Acclaimed', 'Contemporary', 'Visionary', 'Award-winning', 'Prolific'])} artist exploring ${sample(ART_STYLES).toLowerCase()} themes through ${sample(ART_MEDIA).toLowerCase()}.`;

  artists.push({
    id,
    name: fullName,
    avatar,
    bio,
  });
}

// ---------------------------------------------------------------------------
// Generate artworks: 1-to-many relationship (each artist has 1 to 10 artworks)
// Varied styles per artist (e.g., 1 cubism, 1 impressionism, etc.)
// ---------------------------------------------------------------------------
const titlesUsed = new Set();
const artworks = [];

for (const artist of artists) {
  // Between 1 and 10 artworks per artist
  const artworkCount = randInt(1, 10);
  const shuffledStyles = [...ART_STYLES].sort(() => random() - 0.5);

  for (let j = 0; j < artworkCount; j++) {
    let title = '';
    do {
      const adj = sample(ART_TITLES_ADJECTIVES);
      const noun = sample(ART_TITLES_NOUNS);
      const variant = random() > 0.8 ? ` No. ${randInt(1, 20)}` : '';
      title = `${adj} ${noun}${variant}`;
    } while (titlesUsed.has(title));
    titlesUsed.add(title);

    // Varied styles across this artist's artworks (e.g., Cubism, Impressionism, etc.)
    const style = shuffledStyles[j % shuffledStyles.length];
    const media = sample(ART_MEDIA);
    const size = sample(ART_SIZES);

    // Date created between 2019 and 2025
    const createYear = randInt(2019, 2025);
    const createMonth = randInt(1, 12);
    const createDay = randInt(1, 28);
    const date_created = formatDate(createYear, createMonth, createDay);

    // Price rounded to nearest 50 between 400 and 12,000
    const price = randInt(8, 240) * 50;

    // Approximately 35% of artworks sold, linked to a customer
    const isSold = random() < 0.35;
    let customer_id = null;
    let sold_date = null;

    if (isSold) {
      const buyer = sample(customers);
      customer_id = buyer.id;

      // Sold date is after date_created
      const soldYear = randInt(createYear, 2026);
      const soldMonth = soldYear === createYear ? randInt(createMonth, 12) : randInt(1, 10);
      const soldDay = (soldYear === createYear && soldMonth === createMonth)
        ? randInt(createDay, 28)
        : randInt(1, 28);
      sold_date = formatDate(soldYear, soldMonth, soldDay);
    }

    artworks.push({
      id: randomUUID(),
      artist_id: artist.id,
      artist_name: artist.name,
      title,
      media,
      size,
      style,
      date_created,
      price,
      status: isSold ? 'sold' : 'available',
      customer_id,
      sold_date,
    });
  }
}

// ---------------------------------------------------------------------------
// Execute database insertion
// ---------------------------------------------------------------------------
const statements = [
  { sql: 'DELETE FROM artworks' },
  { sql: 'DELETE FROM artists' },
  { sql: 'DELETE FROM customers' },
  ...customers.map((c) => ({
    sql: 'INSERT INTO customers (id, name, age, email, phone, address, credit) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [c.id, c.name, c.age, c.email, c.phone, c.address, c.credit],
  })),
  ...artists.map((ar) => ({
    sql: 'INSERT INTO artists (id, name, avatar, bio) VALUES (?, ?, ?, ?)',
    args: [ar.id, ar.name, ar.avatar, ar.bio],
  })),
  ...artworks.map((a) => ({
    sql: `INSERT INTO artworks
            (id, artist_id, artist_name, title, media, size, style, date_created, price, status, customer_id, sold_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      a.id,
      a.artist_id,
      a.artist_name,
      a.title,
      a.media,
      a.size,
      a.style,
      a.date_created,
      a.price,
      a.status,
      a.customer_id,
      a.sold_date,
    ],
  })),
];

await db.batch(statements);
await db.close();

const sold = artworks.filter((a) => a.customer_id).length;
console.log(`Seeded ${customers.length} customers, ${artists.length} artists (with image avatars), and ${artworks.length} artworks (${sold} sold, 1-10 pieces per artist).`);
