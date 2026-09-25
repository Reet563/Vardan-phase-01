import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, FlaskConical } from 'lucide-react';
import './MaterialSelector.css';

const MaterialSelector = ({ materials, selected, onSelect, loading, placeholder = "Search and select a material...", icon: Icon = FlaskConical }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const filtered = materials.filter(m =>
    m.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 80);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="selector-wrap" ref={ref}>
      <button className="selector-btn" onClick={() => setOpen(o => !o)} disabled={loading}>
        <div className="selector-btn-inner">
          <Icon size={16} className="selector-icon" />
          <span className={selected ? 'selector-text' : 'selector-placeholder'}>
            {loading ? 'Loading materials…' : selected || placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`selector-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="selector-dropdown">
          <div className="selector-search-wrap">
            <Search size={14} className="selector-search-icon" />
            <input
              autoFocus
              className="selector-search"
              placeholder="Type to filter materials…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="selector-clear" onClick={() => setQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <div className="selector-list">
            {filtered.length === 0 ? (
              <div className="selector-empty">No materials match "{query}"</div>
            ) : filtered.map(m => (
              <button
                key={m}
                className={`selector-item ${m === selected ? 'active' : ''}`}
                onClick={() => { onSelect(m); setOpen(false); setQuery(''); }}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="selector-footer">
            {filtered.length} of {materials.length} materials
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;