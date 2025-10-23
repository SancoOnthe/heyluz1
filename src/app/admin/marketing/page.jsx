import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminMarketing from '@/components/AdminMarketing.jsx';

export const metadata = {
  title: 'Marketing - Panel Admin | Hey Luz',
  description: 'Gestión de cupones y banners promocionales',
  robots: 'noindex, nofollow'
};

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/admin/login?redirect=/admin/marketing');
  }

  let user;
  try {
    user = JSON.parse(sessionCookie.value);
  } catch (error) {
    redirect('/admin/login?redirect=/admin/marketing');
  }

  if (user.role !== 'admin' && user.role !== 'editor') {
    redirect('/admin/login?redirect=/admin/marketing');
  }

  return <AdminMarketing user={user} />;
}
