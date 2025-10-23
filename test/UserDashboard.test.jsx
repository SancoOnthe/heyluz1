import React from 'react';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }));

import UserDashboard from '../src/components/UserDashboard.jsx';
import { ToastProvider } from '../src/contexts/ToastContext.jsx';

const FAKE_ORDERS = [
  {
    id: 'order-test-1',
    createdAt: new Date().toISOString(),
    status: 'pagado',
    total: 12345,
    items: [{ id: 'p1', name: 'Producto A', quantity: 1, price: 12345 }],
    user: { id: 'u1', username: 'user1' }
  }
];

describe('UserDashboard component', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, data: FAKE_ORDERS, total: 1 }) }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders orders and opens modal with action buttons', async () => {
    render(
      <ToastProvider>
        <UserDashboard user={{ id: 'u1', username: 'user1', name: 'User One', role: 'admin' }} />
      </ToastProvider>
    );

    // Click on 'Mis compras' tab
    const tab = screen.getByRole('link', { name: /Mis compras/i });
    fireEvent.click(tab);

    // Wait for table row to appear
    await waitFor(() => expect(screen.getByText(/order-test-1/i)).toBeInTheDocument());

    // Click 'Ver detalles' (button with eye icon)
    const viewBtns = screen.getAllByTitle(/Ver detalles/i);
    fireEvent.click(viewBtns[0]);

    // Modal should show action buttons
    await waitFor(() => expect(screen.getByText(/Marcar recibido/i)).toBeInTheDocument());
    expect(screen.getByText(/Solicitar devolución/i)).toBeInTheDocument();
    expect(screen.getByText(/Marcar enviado/i)).toBeInTheDocument();
  });
});
