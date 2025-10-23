import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminConfig from '@/components/AdminConfig.jsx';

export const metadata = {
	title: 'Configuración - Panel Admin | Hey Luz',
	description: 'Ajustes generales de la tienda, moneda, impuestos, métodos de pago, empresa',
	robots: 'noindex, nofollow'
};

export default async function ConfigPage() {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get('session');
	if (!sessionCookie) {
		redirect('/admin/login?redirect=/admin/config');
	}
	let user;
	try {
		user = JSON.parse(sessionCookie.value);
	} catch (error) {
		redirect('/admin/login?redirect=/admin/config');
	}
	if (user.role !== 'admin' && user.role !== 'editor') {
		redirect('/admin/login?redirect=/admin/config');
	}
	return <AdminConfig user={user} />;
}