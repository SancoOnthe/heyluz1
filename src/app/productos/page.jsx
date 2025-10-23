import ProductosClient from '@/components/ProductosClient';

export const metadata = {
	title: 'Productos | HEYLUZ AROMAS',
	description: 'Explora nuestra colección completa de perfumes de lujo',
};

export default async function ProductosPage({ searchParams }) {
	return <ProductosClient />;
}