"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QuickLoginButtons from '@/components/QuickLoginButtons';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect') || null;

	const onSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
				credentials: 'include'
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || 'Credenciales inválidas');
			}
			const targetUrl = redirect || data.redirect || '/';
			window.location.href = targetUrl;
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	};

	return (
		<div className="container page-top" style={{ maxWidth: 420 }}>
			<h2 className="mt-lg mb-md">Ingresar</h2>
			{redirect === '/checkout' && (
				<div className="alert alert-info" style={{
					padding: '1rem',
					marginBottom: '1.5rem',
					background: 'var(--color-primary-light)',
					border: '1px solid var(--color-primary)',
					borderRadius: '8px',
					color: 'var(--text-primary)'
				}}>
					<i className="fas fa-info-circle" /> 
					{' '}Necesitas iniciar sesión para completar tu compra
				</div>
			)}
			<form onSubmit={onSubmit} className="contact-form">
				<input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
				<input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
				{error && <div className="pill danger" style={{padding:'.5rem', borderRadius:8, background:'#fee', color:'#900'}}>{error}</div>}
				<button className="btn btn-primary" disabled={loading}>{loading? 'Ingresando...' : 'Ingresar'}</button>
				<p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
					¿No tienes cuenta? <Link href={`/register${redirect ? `?redirect=${redirect}` : ''}`} style={{color: 'var(--color-primary)', fontWeight: '600'}}>Regístrate aquí</Link>
				</p>
			</form>
			{process.env.NODE_ENV === 'development' && <QuickLoginButtons />}
			<p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
				¿Eres administrador?{' '}
				<Link href="/admin-login" style={{color: 'var(--color-primary)', fontWeight: '600'}}>Accede aquí</Link>
			</p>
		</div>
	);
}