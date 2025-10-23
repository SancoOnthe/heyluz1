import { describe, it, expect, beforeEach } from 'vitest';
import * as adminUtils from '../adminUtils';

beforeEach(() => {
  const store = {};
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
});

describe('generateInvoiceForOrder', () => {
  it('generates invoice id and increments invoiceNext', () => {
    const orders = [{ id: 'ORD-TEST-1', createdAt: new Date().toISOString(), items: [{ name: 'X', price: 10000, quantity: 1 }], total: 10000, user: { name: 'Test', email: 'test@example.com' } }];
    const settings = { invoicePrefix: 'FAC-TEST-', invoiceNext: 1 };

    adminUtils.saveOrders(orders);
    adminUtils.saveSettings(settings);

    const updated = adminUtils.generateInvoiceForOrder('ORD-TEST-1');

    expect(updated).toBeTruthy();
    expect(updated.invoiceId).toBe('FAC-TEST-0001');

    const savedSettings = adminUtils.getSettings();
    expect(savedSettings.invoiceNext).toBe(2);
  });

  it('does not overwrite existing invoiceId and does not increment', () => {
    const orders = [{ id: 'ORD-EX', invoiceId: 'FAC-EX-001', createdAt: new Date().toISOString(), items: [], total: 50, user: {} }];
    const settings = { invoicePrefix: 'FAC-EX-', invoiceNext: 5 };

    adminUtils.saveOrders(orders);
    adminUtils.saveSettings(settings);

    const res = adminUtils.generateInvoiceForOrder('ORD-EX');

    expect(res.invoiceId).toBe('FAC-EX-001');

    const s = adminUtils.getSettings();
    expect(s.invoiceNext).toBe(5);
  });
});
