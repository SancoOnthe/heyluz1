'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect') || null;
	const prefillEmail = searchParams.get('email') || '';
	const source = searchParams.get('source');
	useEffect(() => {
		if (prefillEmail) {
			setFormData(prev => ({ ...prev, email: prefillEmail }));
		}
	}, [prefillEmail]);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};
	const onSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
	setError('');

	// Validaciones
		if (formData.password !== formData.confirmPassword) {
			setError('Las contraseñas no coinciden');
			setLoading(false);
			return;
		}

			if (formData.password.length < 6) {
				setError('La contraseña debe tener al menos 6 caracteres');
				setLoading(false);
				return;
			}

			try {
				// Aquí iría la lógica real de registro con base de datos
				// Por ahora simulamos un registro exitoso
				const res = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: formData.name,
						email: formData.email,
						password: formData.password
					})
				});
				const data = await res.json();

				if (!res.ok || !data.ok) {
					throw new Error(data.error || 'Error al registrar usuario');
				}
				// Redirigir según el parámetro o al área de usuario
				const targetUrl = redirect || data.redirect || '/user';
				window.location.href = targetUrl;
			} catch (err) {
				setError(err.message || 'Error al crear la cuenta');
				setLoading(false);
			}
		};

	return (
		<div className="container page-top" style={{ maxWidth: 480 }}>
			<h2 className="mt-lg mb-md">Crear Cuenta</h2>
			{(redirect === '/checkout' || source === 'newsletter') && (
				<div className="alert alert-info" style={{
					padding: '1rem',
		  marginBottom: '1.5rem',
		  background: 'var(--color-primary-light)',
		  border: '1px solid var(--color-primary)',
					borderRadius: '8px',
					color: 'var(--text-primary)'
				}}>
					<i className="fas fa-info-circle" /> 
					{' '}{source === 'newsletter' ? 'Crea tu cuenta para activar tu suscripción y recibir el 15% de descuento en tu correo' : 'Crea una cuenta para completar tu compra de forma segura'}
				</div>
			)}
			<form onSubmit={onSubmit} className="contact-form">
				<div className="form-group">
					<input 
						type="text" 
						name="name"
						placeholder="Nombre completo" 
			value={formData.name} 
			onChange={handleChange} 
			required 
					/>
				</div>
				<div className="form-group">
					<input 
						type="email" 
						name="email"
						placeholder="Email" 
			value={formData.email} 
			onChange={handleChange} 
			required 
					/>
				</div>
				<div className="form-group">
					<input 
						type="password" 
						name="password"
						placeholder="Contraseña (mínimo 6 caracteres)" 
			value={formData.password} 
			onChange={handleChange} 
			required 
						minLength={6}
					/>
				</div>
				<div className="form-group">
					<input 
						type="password" 
			name="confirmPassword"
			placeholder="Confirmar contraseña" 
			value={formData.confirmPassword} 
						onChange={handleChange} 
						required 
					/>
				</div>
				{error && (
					<div className="pill danger" style={{
			padding: '.5rem', 
			borderRadius: 8, 
			background: '#fee', 
						color: '#900',
						marginBottom: '1rem'
					}}>
						{error}
					</div>
				)}
				<button className="btn btn-primary" type="submit" disabled={loading}>
					{loading ? 'Creando cuenta...' : 'Crear Cuenta'}
				</button>
				<p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
					¿Ya tienes cuenta? <Link href={`/login${redirect ? `?redirect=${redirect}` : ''}`} style={{color: 'var(--color-primary)', fontWeight: '600'}}>Inicia sesión aquí</Link>
				</p>
	</form>

	{/* Beneficios de crear cuenta */}
			<div style={{marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px'}}>
				<h3 style={{marginBottom: '1rem', fontSize: '1.1rem'}}>Beneficios de crear una cuenta:</h3>
				<ul style={{listStyle: 'none', padding: 0}}>
					<li style={{padding: '.5rem 0', display: 'flex', alignItems: 'center', gap: '.5rem'}}>
						<i className="fas fa-check-circle" style={{color: 'var(--color-success)'}} />
						Proceso de pago más rápido
					</li>
					<li style={{padding: '.5rem 0', display: 'flex', alignItems: 'center', gap: '.5rem'}}>
						<i className="fas fa-check-circle" style={{color: 'var(--color-success)'}} />
						Seguimiento de pedidos
					</li>
					<li style={{padding: '.5rem 0', display: 'flex', alignItems: 'center', gap: '.5rem'}}>
						<i className="fas fa-check-circle" style={{color: 'var(--color-success)'}} />
						Historial de compras
					</li>
					<li style={{padding: '.5rem 0', display: 'flex', alignItems: 'center', gap: '.5rem'}}>
						<i className="fas fa-check-circle" style={{color: 'var(--color-success)'}} />
						Ofertas exclusivas
					</li>
				</ul>
			</div>
		</div>
	);
}
