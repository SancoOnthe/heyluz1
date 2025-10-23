"use client";
import { useRouter } from 'next/navigation';

export default function SearchButton() {
  const router = useRouter();

  return (
    <button 
      className="search-btn" 
      aria-label="Buscar productos"
      onClick={() => router.push('/productos')}
    >
      <i className="fas fa-search" />
    </button>
  );
}
