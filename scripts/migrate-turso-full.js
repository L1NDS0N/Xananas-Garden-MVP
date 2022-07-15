require('dotenv').config();
const { createClient } = require('@libsql/client');
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const stmts = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
    phone TEXT, whatsapp TEXT, avatar TEXT, googleId TEXT UNIQUE, admin INTEGER DEFAULT 0,
    password TEXT NOT NULL, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT,
    price REAL, note TEXT, amount INTEGER DEFAULT 0, published INTEGER DEFAULT 1,
    videoUrl TEXT, videoPosition INTEGER DEFAULT 99, maxInstallments INTEGER DEFAULT 12,
    installmentInterest INTEGER DEFAULT 0, costPrice REAL, profitMargin REAL, lowStockThreshold INTEGER DEFAULT 5,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    categoryId TEXT, createdById TEXT, updatedById TEXT,
    FOREIGN KEY (categoryId) REFERENCES product_categories(id),
    FOREIGN KEY (createdById) REFERENCES users(id),
    FOREIGN KEY (updatedById) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY, image TEXT NOT NULL, [order] INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    productId TEXT NOT NULL, FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY, total REAL NOT NULL, discount REAL DEFAULT 0, finalTotal REAL NOT NULL,
    paymentType TEXT DEFAULT 'money', notes TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    userId TEXT, clientId TEXT,
    FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY (clientId) REFERENCES clients(id)
  )`,
  `CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY, quantity INTEGER NOT NULL, unitPrice REAL NOT NULL, subtotal REAL NOT NULL,
    saleId TEXT NOT NULL, productId TEXT NOT NULL,
    FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE, FOREIGN KEY (productId) REFERENCES products(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cash_flows (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL,
    referenceId TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, userId TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS stock_history (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, quantity INTEGER NOT NULL,
    previousAmount INTEGER NOT NULL, newAmount INTEGER NOT NULL, reason TEXT,
    referenceId TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, productId TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id)
  )`,
  `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, cpf TEXT, phone TEXT, whatsapp TEXT,
    email TEXT, address TEXT, notes TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_requests (
    id TEXT PRIMARY KEY, customerName TEXT NOT NULL, customerPhone TEXT NOT NULL, customerEmail TEXT,
    customerAddress TEXT, customerStreet TEXT, customerNumber TEXT, customerNeighborhood TEXT,
    customerCity TEXT, customerState TEXT, customerZip TEXT, customerPhoneCode TEXT DEFAULT '55',
    customerNotes TEXT, status TEXT DEFAULT 'pending', total REAL, notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    clientId TEXT, FOREIGN KEY (clientId) REFERENCES clients(id)
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_request_items (
    id TEXT PRIMARY KEY, quantity INTEGER NOT NULL, unitPrice REAL NOT NULL, subtotal REAL NOT NULL,
    requestId TEXT NOT NULL, productId TEXT NOT NULL,
    FOREIGN KEY (requestId) REFERENCES purchase_requests(id) ON DELETE CASCADE, FOREIGN KEY (productId) REFERENCES products(id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_google_accounts (
    id TEXT PRIMARY KEY, googleId TEXT NOT NULL, email TEXT NOT NULL, name TEXT,
    avatar TEXT, isPrimary INTEGER DEFAULT 0, createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    userId TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userId, googleId)
  )`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, heroTitle TEXT, heroSubtitle TEXT,
    discountType TEXT DEFAULT 'percentage', discountValue REAL DEFAULT 0,
    themeColor TEXT DEFAULT '#de818d', bgColor TEXT DEFAULT '#fff0f3',
    heroImage TEXT, heroVideo TEXT, modalImage TEXT, modalTitle TEXT, modalSubtitle TEXT,
    showModal INTEGER DEFAULT 1, startDate TEXT, endDate TEXT, active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS campaign_products (
    id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, productId TEXT NOT NULL, highlightColor TEXT,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(campaignId, productId)
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, cnpj TEXT, phone TEXT, whatsapp TEXT,
    email TEXT, address TEXT, notes TEXT, active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS supplier_products (
    id TEXT PRIMARY KEY, supplierId TEXT NOT NULL, productId TEXT NOT NULL, costPrice REAL, notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(supplierId, productId)
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY, invoice TEXT, type TEXT DEFAULT 'stock', total REAL DEFAULT 0, notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP, updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    supplierId TEXT, userId TEXT,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id), FOREIGN KEY (userId) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id TEXT PRIMARY KEY, quantity INTEGER DEFAULT 1, unitCost REAL, totalCost REAL,
    productId TEXT NOT NULL, purchaseId TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id), FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE
  )`,
];

async function run() {
  let created = 0, skipped = 0;
  for (const sql of stmts) {
    try {
      await c.execute(sql);
      created++;
    } catch (e) {
      skipped++;
    }
  }
  const tables = await c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Created:', created, 'Skipped:', skipped);
  console.log('Tables:', tables.rows.map(x => x.name).join(', '));
}
run();
