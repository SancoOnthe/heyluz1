"use client";
import { useRouter, useSearchParams } from 'next/navigation';

export default function SortSelector({ currentSort = 'destacado' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSort === 'destacado') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    
    const queryString = params.toString();
    router.push(`/productos${queryString ? '?' + queryString : ''}`);
  };

  return (
    <div className="sort-select-wrapper">
      <select 
        className="sort-select" 
        value={currentSort}
        onChange={handleSortChange}
        aria-label="Ordenar productos"
      >
        <option value="destacado">Destacados</option>
        <option value="nuevo">Más recientes</option>
        <option value="popular">Más populares</option>
        <option value="precio-asc">Precio: menor a mayor</option>
        <option value="precio-desc">Precio: mayor a menor</option>
        <option value="nombre-asc">Nombre: A-Z</option>
        <option value="nombre-desc">Nombre: Z-A</option>
      </select>
      <i className="fas fa-chevron-down sort-icon" />
    </div>
  );
}
