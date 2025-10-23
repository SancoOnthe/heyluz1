import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminReportes from '@/components/AdminReportes.jsx';

export const metadata = {
	title: 'Reportes - Panel Admin | Hey Luz',
	description: 'Estadísticas y análisis de ventas',
	robots: 'noindex, nofollow'
};

export default async function ReportesPage() {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get('session');
	if (!sessionCookie) {
		redirect('/admin/login?redirect=/admin/reportes');
	}
	let user;
	try {
		user = JSON.parse(sessionCookie.value);
	} catch (error) {
		redirect('/admin/login?redirect=/admin/reportes');
	}
	if (user.role !== 'admin' && user.role !== 'editor') {
		redirect('/admin/login?redirect=/admin/reportes');
	}
	return <AdminReportes user={user} />;
}