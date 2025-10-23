import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserDashboard from '@/components/UserDashboard';

export const metadata = {
	title: 'Mi Cuenta | HEYLUZ AROMAS',
	description: 'Panel de usuario - Gestiona tus pedidos y perfil',
	robots: 'noindex, nofollow'
};

export default async function UserPage() {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get('session');
	if (!sessionCookie) {
		redirect('/login?redirect=/user');
	}
	let user = null;
	try {
		user = JSON.parse(sessionCookie.value);
		const allowedRoles = ['admin', 'editor', 'viewer', 'user'];
		if (!allowedRoles.includes(user.role)) {
			redirect('/login?redirect=/user');
		}
	} catch (error) {
		redirect('/login?redirect=/user');
	}
	return <UserDashboard user={user} />;
}