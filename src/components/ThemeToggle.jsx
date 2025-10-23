"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle(){
  const [dark, setDark] = useState(false);
  useEffect(()=>{
    const saved = localStorage.getItem('theme-dark') === '1';
    setDark(saved);
    document.documentElement.classList.toggle('theme-dark', saved);
  },[]);
  const toggle=()=>{
    const next = !dark; setDark(next);
    document.documentElement.classList.toggle('theme-dark', next);
    localStorage.setItem('theme-dark', next ? '1' : '0');
  };
  return (
    <button onClick={toggle} className="nav-link" aria-label="Alternar tema" title="Tema">
      {dark ? '🌙' : '☀️'}
    </button>
  );
}
