'use client';

import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* Modal: centered dialog over a dimmed overlay. Closes on overlay     */
/* click or Escape. Used by every "add / register" flow in the app.    */
/* ------------------------------------------------------------------ */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(46,42,37,.34)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '8vh 20px 40px',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          boxShadow: '0 18px 50px rgba(46,42,37,.22)',
          padding: '24px 26px 26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 21, fontWeight: 600, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="close"
            style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', color: 'var(--ink2)', fontSize: 15, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives — consistent inputs matching the salon design.      */
/* ------------------------------------------------------------------ */

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '10px 12px',
  font: '13px var(--ui)',
  background: '#FBF9F5',
  color: 'var(--ink)',
  outline: 'none',
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 13 }}>
      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink2)', marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, cursor: 'pointer', ...props.style }} />;
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

export function FormActions({
  cancelLabel,
  saveLabel,
  onCancel,
  pending,
}: {
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
      <button
        type="button"
        onClick={onCancel}
        style={{ flex: 1, font: '600 12.5px var(--ui)', background: '#fff', color: 'var(--ink2)', border: '1px solid var(--line)', borderRadius: 999, padding: 11, cursor: 'pointer' }}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={pending}
        style={{ flex: 1, font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: 11, cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}
      >
        {pending ? '…' : saveLabel}
      </button>
    </div>
  );
}
