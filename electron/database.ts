import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type {
  Product,
  Customer,
  Sale,
  SaleItem,
  CreateProductInput,
  UpdateProductInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateSaleInput
} from './types';

let db: Database.Database;

export function initDatabase(): Database.Database {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos.db');
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Create tables
  createTables();
  
  // Seed initial data if tables are empty
  seedDatabase();
  
  return db;
}

function createTables(): void {
  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      creditLimit REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL CHECK(paymentMethod IN ('cash', 'credit', 'card')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customerId) REFERENCES customers(id)
    )
  `);

  // Sale items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customerId);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(saleId);
  `);
}

function seedDatabase(): void {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  
  if (productCount.count === 0) {
    // Add some sample products
    const sampleProducts = [
      { barcode: '1001', name: 'Rice 5kg', description: 'Basmati Rice', price: 850.00, stock: 50 },
      { barcode: '1002', name: 'Sugar 1kg', description: 'White Sugar', price: 180.00, stock: 100 },
      { barcode: '1003', name: 'Tea 100g', description: 'Black Tea', price: 120.00, stock: 75 },
      { barcode: '1004', name: 'Milk Powder 400g', description: 'Full Cream', price: 680.00, stock: 40 },
      { barcode: '1005', name: 'Bread', description: 'White Bread', price: 95.00, stock: 30 },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (barcode, name, description, price, stock)
      VALUES (@barcode, @name, @description, @price, @stock)
    `);

    const insertMany = db.transaction((products: typeof sampleProducts) => {
      for (const product of products) {
        insertProduct.run(product);
      }
    });

    insertMany(sampleProducts);
  }
}

// Product operations
export function getAllProducts(): Product[] {
  return db.prepare('SELECT * FROM products ORDER BY name').all() as Product[];
}

export function getProductByBarcode(barcode: string): Product | undefined {
  return db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode) as Product | undefined;
}

export function createProduct(input: CreateProductInput): Product {
  const stmt = db.prepare(`
    INSERT INTO products (barcode, name, description, price, stock)
    VALUES (@barcode, @name, @description, @price, @stock)
  `);
  
  const result = stmt.run(input);
  return db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid) as Product;
}

export function updateProduct(input: UpdateProductInput): Product | null {
  const updates: string[] = [];
  const params: Record<string, any> = { id: input.id };

  if (input.barcode !== undefined) {
    updates.push('barcode = @barcode');
    params.barcode = input.barcode;
  }
  if (input.name !== undefined) {
    updates.push('name = @name');
    params.name = input.name;
  }
  if (input.description !== undefined) {
    updates.push('description = @description');
    params.description = input.description;
  }
  if (input.price !== undefined) {
    updates.push('price = @price');
    params.price = input.price;
  }
  if (input.stock !== undefined) {
    updates.push('stock = @stock');
    params.stock = input.stock;
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');

  const stmt = db.prepare(`
    UPDATE products SET ${updates.join(', ')} WHERE id = @id
  `);
  
  stmt.run(params);
  return db.prepare('SELECT * FROM products WHERE id = ?').get(input.id) as Product | null;
}

export function deleteProduct(id: number): boolean {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

// Customer operations
export function getAllCustomers(): Customer[] {
  return db.prepare('SELECT * FROM customers ORDER BY name').all() as Customer[];
}

export function getCustomerById(id: number): Customer | undefined {
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined;
}

export function createCustomer(input: CreateCustomerInput): Customer {
  const stmt = db.prepare(`
    INSERT INTO customers (name, phone, email, creditLimit, balance)
    VALUES (@name, @phone, @email, @creditLimit, 0)
  `);
  
  const result = stmt.run(input);
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as Customer;
}

export function updateCustomer(input: UpdateCustomerInput): Customer | null {
  const updates: string[] = [];
  const params: Record<string, any> = { id: input.id };

  if (input.name !== undefined) {
    updates.push('name = @name');
    params.name = input.name;
  }
  if (input.phone !== undefined) {
    updates.push('phone = @phone');
    params.phone = input.phone;
  }
  if (input.email !== undefined) {
    updates.push('email = @email');
    params.email = input.email;
  }
  if (input.creditLimit !== undefined) {
    updates.push('creditLimit = @creditLimit');
    params.creditLimit = input.creditLimit;
  }
  if (input.balance !== undefined) {
    updates.push('balance = @balance');
    params.balance = input.balance;
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');

  const stmt = db.prepare(`
    UPDATE customers SET ${updates.join(', ')} WHERE id = @id
  `);
  
  stmt.run(params);
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(input.id) as Customer | null;
}

// Sale operations
export function createSale(input: CreateSaleInput): Sale {
  const transaction = db.transaction(() => {
    // Calculate total
    let totalAmount = 0;
    for (const item of input.items) {
      totalAmount += item.unitPrice * item.quantity;
    }

    // Create sale
    const saleStmt = db.prepare(`
      INSERT INTO sales (customerId, totalAmount, paymentMethod)
      VALUES (@customerId, @totalAmount, @paymentMethod)
    `);
    
    const saleResult = saleStmt.run({
      customerId: input.customerId || null,
      totalAmount,
      paymentMethod: input.paymentMethod
    });

    const saleId = saleResult.lastInsertRowid as number;

    // Insert sale items and update stock
    const saleItemStmt = db.prepare(`
      INSERT INTO sale_items (saleId, productId, quantity, unitPrice, subtotal)
      VALUES (@saleId, @productId, @quantity, @unitPrice, @subtotal)
    `);

    const updateStockStmt = db.prepare(`
      UPDATE products SET stock = stock - @quantity WHERE id = @productId
    `);

    for (const item of input.items) {
      const subtotal = item.unitPrice * item.quantity;
      saleItemStmt.run({
        saleId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal
      });

      updateStockStmt.run({
        productId: item.productId,
        quantity: item.quantity
      });
    }

    // If credit payment, update customer balance
    if (input.paymentMethod === 'credit' && input.customerId) {
      db.prepare(`
        UPDATE customers SET balance = balance + @amount WHERE id = @customerId
      `).run({
        amount: totalAmount,
        customerId: input.customerId
      });
    }

    return db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as Sale;
  });

  return transaction();
}

export function getAllSales(): Sale[] {
  return db.prepare('SELECT * FROM sales ORDER BY createdAt DESC').all() as Sale[];
}

export function getSaleItems(saleId: number): SaleItem[] {
  return db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(saleId) as SaleItem[];
}

export function getDatabase(): Database.Database {
  return db;
}
