import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import {
  initDatabase,
  getAllProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  createSale,
  getAllSales,
  getSaleItems
} from './database';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  initDatabase();

  // Register IPC handlers
  registerIpcHandlers();

  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  // Product handlers
  ipcMain.handle('products:getAll', async () => {
    return getAllProducts();
  });

  ipcMain.handle('products:getByBarcode', async (_event, barcode: string) => {
    return getProductByBarcode(barcode);
  });

  ipcMain.handle('products:create', async (_event, input) => {
    return createProduct(input);
  });

  ipcMain.handle('products:update', async (_event, input) => {
    return updateProduct(input);
  });

  ipcMain.handle('products:delete', async (_event, id: number) => {
    return deleteProduct(id);
  });

  // Customer handlers
  ipcMain.handle('customers:getAll', async () => {
    return getAllCustomers();
  });

  ipcMain.handle('customers:getById', async (_event, id: number) => {
    return getCustomerById(id);
  });

  ipcMain.handle('customers:create', async (_event, input) => {
    return createCustomer(input);
  });

  ipcMain.handle('customers:update', async (_event, input) => {
    return updateCustomer(input);
  });

  // Sale handlers
  ipcMain.handle('sales:create', async (_event, input) => {
    return createSale(input);
  });

  ipcMain.handle('sales:getAll', async () => {
    return getAllSales();
  });

  ipcMain.handle('sales:getItems', async (_event, saleId: number) => {
    return getSaleItems(saleId);
  });
}
