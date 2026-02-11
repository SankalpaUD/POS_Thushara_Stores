# POS_Thushara_Stores

An offline-first Desktop POS engineered for supermarkets using Electron, React, and SQLite. Key features include real-time inventory tracking with audit trails and a strict debtor credit control system. Designed for high-speed transactions and local data reliability, this solution offers a modern, scalable architecture for retail management.

## 📸 Application Preview

![POS Application Screenshot](https://github.com/user-attachments/assets/26061d0b-6b92-4a3f-9508-0e3adc4bc1ad)
*Point of Sale view with product lookup and shopping cart*

## 🚀 Features

### Core Functionality
- **📦 Inventory Management**: Full CRUD operations for products with barcode support
- **💰 Point of Sale**: Fast checkout with barcode scanning and product search
- **👥 Customer Management**: Track customer credit limits and balances
- **📊 Sales Tracking**: Comprehensive sales history and reporting
- **💳 Multiple Payment Methods**: Cash, credit, and card payments
- **🔒 Credit Control**: Automatic credit limit validation for customers

### Technical Highlights
- **Offline-First**: Fully functional without internet connection
- **Real-time Updates**: Instant stock level updates after sales
- **Transaction Safety**: Atomic database transactions for data integrity
- **Strict TypeScript**: Full type safety across the application
- **Modern UI**: Beautiful responsive design with gradient sidebar

## 📋 Database Schema

### Products Table
```typescript
{
  id: number;
  barcode: string;        // Unique barcode
  name: string;
  description: string;
  price: number;
  stock: number;          // Current stock level
  createdAt: string;
  updatedAt: string;
}
```

### Customers Table
```typescript
{
  id: number;
  name: string;
  phone: string;
  email: string;
  creditLimit: number;    // Maximum credit allowed
  balance: number;        // Current outstanding balance
  createdAt: string;
  updatedAt: string;
}
```

### Sales Table
```typescript
{
  id: number;
  customerId: number | null;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit' | 'card';
  createdAt: string;
}
```

### Sale Items Table
```typescript
{
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

## 🛠️ Technology Stack

- **Electron 28**: Desktop application framework
- **React 18**: UI library
- **Vite 5**: Build tool and dev server
- **TypeScript 5**: Type-safe JavaScript
- **better-sqlite3**: Fast, synchronous SQLite3 database
- **React Router**: Client-side routing

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/SankalpaUD/POS_Thushara_Stores.git
cd POS_Thushara_Stores

# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build
```

## 🎮 Usage

### Running the Application

**Development Mode:**
```bash
npm run dev
```
This starts Vite dev server and opens the Electron window with hot reload enabled.

**Production Build:**
```bash
npm run build
```
This compiles TypeScript, builds the React app, and packages the Electron application.

### Application Views

#### 1. Point of Sale (POS)
- **Barcode Scanner**: Enter or scan product barcodes
- **Product Search**: Search products by name or barcode
- **Shopping Cart**: Add items, adjust quantities, remove items
- **Customer Selection**: Choose customer for credit tracking
- **Payment Processing**: Select payment method and complete sale

#### 2. Inventory Management
- **Add Products**: Create new products with barcode, name, price, and stock
- **Edit Products**: Update product details
- **Delete Products**: Remove products from inventory
- **Stock Adjustment**: Quick +/- buttons for stock updates
- **Low Stock Alerts**: Visual indicators for low stock items

#### 3. Sales History
- **View Transactions**: Complete list of all sales
- **Statistics**: Total sales, revenue, and average sale amount
- **Payment Details**: See payment methods used

#### 4. Customer Management
- **Add Customers**: Create customer profiles with credit limits
- **Edit Customers**: Update customer information
- **Credit Tracking**: Monitor customer balances and available credit
- **Balance Display**: Real-time outstanding balance tracking

## 🔧 Development

### Project Structure
```
POS_Thushara_Stores/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script for IPC
│   ├── database.ts       # SQLite database operations
│   └── types.ts          # TypeScript type definitions
├── src/                  # React application
│   ├── views/            # Application views
│   │   ├── POSView.tsx
│   │   ├── InventoryView.tsx
│   │   ├── SalesView.tsx
│   │   └── CustomersView.tsx
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # React entry point
│   └── types.ts          # Shared type definitions
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
└── package.json          # Project dependencies
```

### IPC Communication

The application uses Electron's IPC (Inter-Process Communication) to safely communicate between the renderer process (React) and the main process (Node.js/SQLite).

**Available APIs:**
```typescript
window.electronAPI.products.getAll()
window.electronAPI.products.getByBarcode(barcode)
window.electronAPI.products.create(input)
window.electronAPI.products.update(input)
window.electronAPI.products.delete(id)

window.electronAPI.customers.getAll()
window.electronAPI.customers.getById(id)
window.electronAPI.customers.create(input)
window.electronAPI.customers.update(input)

window.electronAPI.sales.create(input)
window.electronAPI.sales.getAll()
window.electronAPI.sales.getItems(saleId)
```

## 🔒 Security Features

- **Context Isolation**: Renderer process is isolated from Node.js
- **No Node Integration**: Renderer cannot directly access Node APIs
- **Preload Script**: Safe bridge between main and renderer processes
- **SQL Injection Protection**: Prepared statements for all queries
- **Credit Limit Validation**: Prevents sales exceeding customer credit

## 📝 Sample Data

The application includes sample products on first run:
- Rice 5kg - Rs. 850.00
- Sugar 1kg - Rs. 180.00
- Tea 100g - Rs. 120.00
- Milk Powder 400g - Rs. 680.00
- Bread - Rs. 95.00

## 🐛 Troubleshooting

### Database Location
The SQLite database is stored in the user's application data directory:
- **Windows**: `%APPDATA%/pos-thushara-stores/pos.db`
- **macOS**: `~/Library/Application Support/pos-thushara-stores/pos.db`
- **Linux**: `~/.config/pos-thushara-stores/pos.db`

### Build Issues
If you encounter build issues with better-sqlite3:
1. Ensure you have Python and build tools installed
2. Clear node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**SankalpaUD**

## 🙏 Acknowledgments

- Electron for the amazing desktop framework
- React team for the UI library
- better-sqlite3 for the fast SQLite binding
- Vite for the blazing fast build tool
