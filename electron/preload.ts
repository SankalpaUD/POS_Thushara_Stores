import { contextBridge, ipcRenderer } from 'electron';
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

// Expose IPC API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Product operations
  products: {
    getAll: (): Promise<Product[]> => ipcRenderer.invoke('products:getAll'),
    getByBarcode: (barcode: string): Promise<Product | undefined> => 
      ipcRenderer.invoke('products:getByBarcode', barcode),
    create: (input: CreateProductInput): Promise<Product> => 
      ipcRenderer.invoke('products:create', input),
    update: (input: UpdateProductInput): Promise<Product | null> => 
      ipcRenderer.invoke('products:update', input),
    delete: (id: number): Promise<boolean> => 
      ipcRenderer.invoke('products:delete', id),
  },
  
  // Customer operations
  customers: {
    getAll: (): Promise<Customer[]> => ipcRenderer.invoke('customers:getAll'),
    getById: (id: number): Promise<Customer | undefined> => 
      ipcRenderer.invoke('customers:getById', id),
    create: (input: CreateCustomerInput): Promise<Customer> => 
      ipcRenderer.invoke('customers:create', input),
    update: (input: UpdateCustomerInput): Promise<Customer | null> => 
      ipcRenderer.invoke('customers:update', input),
  },
  
  // Sale operations
  sales: {
    create: (input: CreateSaleInput): Promise<Sale> => 
      ipcRenderer.invoke('sales:create', input),
    getAll: (): Promise<Sale[]> => ipcRenderer.invoke('sales:getAll'),
    getItems: (saleId: number): Promise<SaleItem[]> => 
      ipcRenderer.invoke('sales:getItems', saleId),
  }
});
