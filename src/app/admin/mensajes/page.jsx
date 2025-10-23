import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MensajesAdmin from '@/components/MensajesAdmin.jsx';

export const metadata = {
  title: 'Mensajes | Admin - HEYLUZ AROMAS',
  description: 'Mensajes de contacto enviados desde la web',
  robots: 'noindex, nofollow'
};

export default async function MensajesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) redirect('/admin/login?redirect=/admin/mensajes');
  let user;
  try {
    user = JSON.parse(sessionCookie.value);
  } catch {
    redirect('/admin/login?redirect=/admin/mensajes');
  }
  if (!['admin','editor'].includes(user?.role)) redirect('/admin/login?redirect=/admin/mensajes');
  return <MensajesAdmin user={user} />;
}
