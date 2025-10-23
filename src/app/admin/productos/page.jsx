import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminProductos from '@/components/AdminProductos.jsx';

export const metadata = {
  title: 'Productos - Panel Admin | Hey Luz',
  description: 'Gestión de productos de perfumería',
  robots: 'noindex, nofollow'
};

export default async function ProductosPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/admin/login?redirect=/admin/productos');
  }

  let user;
  try {
    user = JSON.parse(sessionCookie.value);
  } catch (error) {
    redirect('/admin/login?redirect=/admin/productos');
  }

  if (user.role !== 'admin' && user.role !== 'editor') {
    redirect('/admin/login?redirect=/admin/productos');
  }

  return <AdminProductos user={user} />;
}
