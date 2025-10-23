"use client";
import { useEffect, useRef, useState } from "react";

export default function MobileMenuToggle() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    const menu = document.querySelector('.nav-menu');
    if (!btn || !menu) return;
    menuRef.current = menu;

    const update = () => {
      if (open) {
        menu.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        menu.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      }
    };
    update();
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && menuRef.current) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <button
      ref={btnRef}
      className={`menu-toggle${open ? ' active' : ''}`}
      aria-label="Menú"
      aria-controls="primary-navigation"
      aria-expanded={open ? 'true' : 'false'}
      onClick={() => setOpen(v => !v)}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
