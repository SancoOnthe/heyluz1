import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminVentas from '@/components/AdminVentas.jsx';

export const metadata = {
	title: 'Ventas - Panel Admin | Hey Luz',
	description: 'Gestión de pedidos y ventas',
	robots: 'noindex, nofollow'
};

export default async function VentasPage() {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get('session');
	if (!sessionCookie) {
		redirect('/admin/login?redirect=/admin/ventas');
	}
	let user;
	try {
		user = JSON.parse(sessionCookie.value);
	} catch (error) {
		redirect('/admin/login?redirect=/admin/ventas');
	}
	if (user.role !== 'admin' && user.role !== 'editor') {
		redirect('/admin/login?redirect=/admin/ventas');
	}
	return <AdminVentas user={user} />;
}