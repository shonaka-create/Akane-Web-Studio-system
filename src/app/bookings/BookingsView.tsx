'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { createBooking } from '@/lib/actions';
import { SERVICE_KEYS } from '@/lib/formOptions';
import type { BookingBlock, Staff, Tone } from '@/lib/types';

const BOOKING_HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

/** YYYY-MM-DD（ローカル日付）。フォームの初期値に使う。 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BookingsView({
  staff,
  blocks,
  staffOptions,
}: {
  staff: { initial: string; name: string; tone: Tone }[];
  blocks: BookingBlock[];
  staffOptions: Staff[];
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      await createBooking(formData);
      setOpen(false);
    });
  }

  const navBtn: React.CSSProperties = {
    width: 32,
    height: 32,
    border: '1px solid var(--line)',
    background: '#fff',
    borderRadius: '50%',
    cursor: 'pointer',
    color: 'var(--ink2)',
    fontSize: 14,
  };

  const colCount = Math.max(staff.length, 1);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button style={navBtn}>‹</button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.resDay}</span>
        <button style={navBtn}>›</button>
        <button style={{ font: '500 12px var(--ui)', border: '1px solid var(--line)', background: '#fff', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', color: 'var(--ink2)' }}>{t.today}</button>
        <button onClick={() => setOpen(true)} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.newBooking}</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.addBookingTitle}>
        <form action={submit}>
          <Field label={t.formCustomer}><TextInput name="customer_name" required placeholder={t.formCustomer} /></Field>
          <FieldRow>
            <Field label={t.formDate}><TextInput type="date" name="booking_date" required defaultValue={todayStr()} /></Field>
            <Field label={t.formTime}><TextInput type="time" name="start_time" required defaultValue="10:00" /></Field>
          </FieldRow>
          <FieldRow>
            <Field label={t.formStaff}>
              <Select name="staff_id" defaultValue="">
                <option value="">{t.formNone}</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.formDuration}><TextInput type="number" name="duration_min" min={15} step={15} defaultValue={60} /></Field>
          </FieldRow>
          <Field label={t.formService}>
            <Select name="service_key" defaultValue="svcCut">
              {SERVICE_KEYS.map((k) => (
                <option key={k} value={k}>{t[k]}</option>
              ))}
            </Select>
          </Field>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setOpen(false)} pending={pending} />
        </form>
      </Modal>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(46,42,37,.04)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${colCount},1fr)`,
            gap: '0 6px',
            gridTemplateRows: '42px repeat(22,26px)',
            position: 'relative',
          }}
        >
          {/* Staff column headers */}
          <div style={{ gridColumn: 1, gridRow: 1 }} />
          {staff.map((s, i) => (
            <div key={`${s.initial}-${i}`} style={{ gridColumn: i + 2, gridRow: 1, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: toneStyles[s.tone].soft,
                  color: toneStyles[s.tone].strong,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--serif)',
                  fontSize: 12,
                }}
              >
                {s.initial}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</span>
            </div>
          ))}

          {/* Horizontal hour gridlines */}
          {BOOKING_HOURS.map((_, i) => (
            <div key={`line-${i}`} style={{ gridColumn: '1 / -1', gridRow: 2 + i * 2, borderTop: '1px solid var(--line)' }} />
          ))}

          {/* Hour labels */}
          {BOOKING_HOURS.map((h, i) => (
            <div key={`hr-${h}`} style={{ gridColumn: 1, gridRow: 2 + i * 2, fontSize: 10.5, color: 'var(--ink3)', transform: 'translateY(-7px)' }}>
              {h}
            </div>
          ))}

          {/* Appointment blocks */}
          {blocks.map((b) => {
            const ts = toneStyles[b.tone];
            return (
              <div
                key={b.id}
                style={{
                  gridColumn: b.col + 1,
                  gridRow: `${b.rowStart} / span ${b.rowSpan}`,
                  background: ts.soft,
                  borderLeft: `3px solid ${ts.strong}`,
                  borderRadius: 7,
                  padding: '5px 8px',
                  margin: 2,
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 10, color: ts.darkText }}>{b.time}</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{b.customer}</div>
                {b.serviceKey && <div style={{ fontSize: 10.5, color: 'var(--ink2)' }}>{t[b.serviceKey]}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
