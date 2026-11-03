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
  balance: number;
  debtDueDate: string | null;
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

export interface DebtBillItem extends SaleItem {
  productName: string;
  productBarcode: string;
}

export interface CustomerDebtBill extends Sale {
  items: DebtBillItem[];
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
  balance?: number;
  debtDueDate?: string | null;
}

export interface UpdateCustomerInput {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  balance?: number;
  debtDueDate?: string | null;
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
