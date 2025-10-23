import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard.jsx';

export const metadata = {
  title: 'Dashboard | Admin - HEYLUZ AROMAS',
  description: 'Panel de administración',
  robots: 'noindex, nofollow'
};

export default async function AdminHome() {
  // Verificar autenticación
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) {
    redirect('/admin/login?redirect=/admin');
  }

  let user = null;
  try {
    user = JSON.parse(sessionCookie.value);
    
    // Verificar que sea admin o editor
    const allowedRoles = ['admin', 'editor'];
    if (!allowedRoles.includes(user.role)) {
      redirect('/admin/login?redirect=/admin');
    }
  } catch (error) {
    redirect('/admin/login?redirect=/admin');
  }

  return <AdminDashboard user={user} />;
}
