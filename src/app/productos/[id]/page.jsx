import { notFound } from "next/navigation";
import Link from "next/link";
import OptimizedImage from "../../../components/OptimizedImage";
import AddToCartButton from "../../../components/AddToCartButton";
import { dbClient as supabase } from '@/lib/dbClient';

export default async function ProductDetail({ params }) {
  const { id } = await params;
  const productId = String(id);
  const { data: products } = await supabase.from('products').select('*').eq('id', productId).limit(1);
  const product = products && products[0];
  if (!product) return notFound();

  return (
    <section className="productos page-top">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{product.nombre}</h2>
          <p className="section-subtitle">{product.categoria} · ID #{product.id}</p>
        </div>
        <div className="product-detail-grid">
          <div className="producto-image product-detail-image">
            <OptimizedImage
              src={product.img}
              alt={product.nombre}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="empty"
              priority
            />
          </div>
          <div className="producto-info product-detail-info">
            <div className="producto-category">{product.categoria}</div>
            <h3 className="producto-name" style={{marginTop:0}}>{product.nombre}</h3>
            <p className="producto-description">{product.descripcion || 'Fragancia exclusiva de larga duración con notas cuidadosamente seleccionadas.'}</p>
            <div className="producto-price" style={{alignItems:'center'}}>
              <span className="price-current">${product.precio.toFixed(2)}</span>
            </div>
            <div className="producto-actions" style={{marginTop:'1rem'}}>
              <AddToCartButton product={product} className="btn btn-primary btn-add-cart" showIcon={true} />
              <Link href="/productos" className="btn btn-outline">
                <i className="fas fa-arrow-left" /> Volver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
