// Prueba rápida de generateInvoiceForOrder usando un localStorage simulado en Node
const fs = require('fs');

// Simular un localStorage simple
const localStorage = (() => {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
})();

// Cargar el módulo utils (leer archivo y eval en contexto con localStorage)
const modPath = './src/utils/adminUtils.js';
const code = fs.readFileSync(modPath, 'utf8');

// Ejecutar el módulo en un contexto con localStorage y window mock
const vm = require('vm');
const sandbox = { console, localStorage, window: {} };
vm.createContext(sandbox);

// Transform export statements to attach to sandbox.exports
const wrapped = `
var exports = {};
var module = { exports };
(function(){
${code}
})();
exports = module.exports;
`;

vm.runInContext(wrapped, sandbox);
const utils = sandbox.module.exports || sandbox.exports || {};

// Sembrar orders y settings
const demoOrders = [
  { id: 'ORD-TEST-1', createdAt: new Date().toISOString(), items: [{ name: 'X', price: 10000, quantity: 1 }], total: 10000, user: { name: 'Test', email: 'test@example.com' } }
];
const demoSettings = {
  invoicePrefix: 'FAC-TEST-',
  invoiceNext: 42
};
localStorage.setItem('heyluz_orders', JSON.stringify(demoOrders));
localStorage.setItem('heyluz_settings', JSON.stringify(demoSettings));

// Ejecutar generateInvoiceForOrder
const result = utils.generateInvoiceForOrder('ORD-TEST-1');
console.log('Result:', result);
console.log('Orders in storage:', JSON.parse(localStorage.getItem('heyluz_orders')));
console.log('Settings in storage:', JSON.parse(localStorage.getItem('heyluz_settings')));

// Comprobaciones simples
if (!result || !result.invoiceId) {
  console.error('❌ generateInvoiceForOrder no generó invoiceId correctamente');
  process.exit(1);
}
if ((JSON.parse(localStorage.getItem('heyluz_settings'))).invoiceNext !== 43) {
  console.error('❌ invoiceNext no incrementado correctamente');
  process.exit(1);
}
console.log('✅ Test passed');
