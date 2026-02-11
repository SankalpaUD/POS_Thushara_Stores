// Database Entity Types

export interface Product {
  id: number;
  barcode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  creditLimit: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  customerId: number | null;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit' | 'card';
  createdAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Input Types for Creating/Updating Entities

export interface CreateProductInput {
  barcode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface UpdateProductInput {
  id: number;
  barcode?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email: string;
  creditLimit: number;
}

export interface UpdateCustomerInput {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  creditLimit?: number;
  balance?: number;
}

export interface CreateSaleInput {
  customerId?: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: 'cash' | 'credit' | 'card';
}

// Cart Types for UI

export interface CartItem {
  product: Product;
  quantity: number;
}

// Window API types
declare global {
  interface Window {
    electronAPI: {
      products: {
        getAll: () => Promise<Product[]>;
        getByBarcode: (barcode: string) => Promise<Product | undefined>;
        create: (input: CreateProductInput) => Promise<Product>;
        update: (input: UpdateProductInput) => Promise<Product | null>;
        delete: (id: number) => Promise<boolean>;
      };
      customers: {
        getAll: () => Promise<Customer[]>;
        getById: (id: number) => Promise<Customer | undefined>;
        create: (input: CreateCustomerInput) => Promise<Customer>;
        update: (input: UpdateCustomerInput) => Promise<Customer | null>;
      };
      sales: {
        create: (input: CreateSaleInput) => Promise<Sale>;
        getAll: () => Promise<Sale[]>;
        getItems: (saleId: number) => Promise<SaleItem[]>;
      };
    };
  }
}

export {};
