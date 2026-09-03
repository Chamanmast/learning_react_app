import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../lib/hooks';
import type { ChromeProps } from '../types';

export default function Chrome({ acc = '#e4572e', inkDeep = '#14172e', sidebarHtml, children, label = 'Guide' }: ChromeProps) {
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  return (
    <div className="rv-shell" style={{ '--acc': acc, '--ink-deep': inkDeep } as React.CSSProperties}>
      <div className="rv-topbtns left">
        <button className="rv-btn icon rv-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
          <i className="bi bi-list" />
        </button>
        <Link className="rv-btn" to="/" aria-label="Back to home">
          <i className="bi bi-arrow-left" /> Home
        </Link>
      </div>
      <div className="rv-topbtns right">
        <button className="rv-btn icon" onClick={toggleTheme} title="Toggle dark or light mode" aria-label="Toggle dark or light mode">
          <i className={theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill'} />
        </button>
      </div>
      {open && <div className="rv-backdrop" onClick={() => setOpen(false)} />}
      <aside
        className={'rv-sidebar' + (open ? ' show' : '')}
        aria-label={label}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a') && window.innerWidth <= 991.98) setOpen(false);
        }}
        dangerouslySetInnerHTML={{ __html: sidebarHtml }}
      />
      <main className="rv-main">{children}</main>
    </div>
  );
}
