'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { Avatar } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { upsertShift } from '@/lib/actions';
import { WEEKDAY_OPTIONS } from '@/lib/formOptions';
import type { ShiftRow, Staff } from '@/lib/types';

export function ShiftsView({ shiftRows, staff }: { shiftRows: ShiftRow[]; staff: Staff[] }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      await upsertShift(formData);
      setOpen(false);
    });
  }

  const dayHeaders: { key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; date: number; color?: string }[] = [
    { key: 'mon', date: 23 },
    { key: 'tue', date: 24 },
    { key: 'wed', date: 25 },
    { key: 'thu', date: 26 },
    { key: 'fri', date: 27 },
    { key: 'sat', date: 28, color: 'var(--accent)' },
    { key: 'sun', date: 29, color: 'var(--rose)' },
  ];

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

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button style={navBtn}>‹</button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.weekLabel}</span>
        <button style={navBtn}>›</button>
        <button style={{ font: '500 12px var(--ui)', border: '1px solid var(--line)', background: '#fff', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', color: 'var(--ink2)' }}>{t.today}</button>
        <button onClick={() => setOpen(true)} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.addShift}</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.addShiftTitle}>
        <form action={submit}>
          <Field label={t.formStaff}>
            <Select name="staff_id" required defaultValue="">
              <option value="" disabled>{t.formSelect}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.formWeekday}>
            <Select name="weekday" defaultValue="0">
              {WEEKDAY_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>{t[w.labelKey]}</option>
              ))}
            </Select>
          </Field>
          <FieldRow>
            <Field label={t.formStart}><TextInput type="time" name="start_time" required defaultValue="09:00" /></Field>
            <Field label={t.formEnd}><TextInput type="time" name="end_time" required defaultValue="18:00" /></Field>
          </FieldRow>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setOpen(false)} pending={pending} />
        </form>
      </Modal>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(7,1fr)', gap: 8 }}>
          <div />
          {dayHeaders.map((d) => (
            <div key={d.key} style={{ textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: d.color }}>{t[d.key]}</div>
              <div style={{ fontSize: 12, color: d.color ?? 'var(--ink3)' }}>{d.date}</div>
            </div>
          ))}

          {shiftRows.map((row) => (
            <Row key={row.staff.initial} row={row} weeklyShort={t.weeklyShort} off={t.shiftOff} />
          ))}
        </div>
      </div>
    </>
  );
}

function Row({ row, weeklyShort, off }: { row: ShiftRow; weeklyShort: string; off: string }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <Avatar initial={row.staff.initial} tone={row.staff.tone} size={30} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{row.staff.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{weeklyShort} {row.staff.weeklyHours}h</div>
        </div>
      </div>
      {row.days.map((cell, i) => (
        <div key={i} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          {cell ? (
            <div
              style={{
                background: toneStyles[cell.tone].soft,
                color: toneStyles[cell.tone].darkText,
                borderRadius: 9,
                padding: '8px 4px',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              {cell.start}
              <br />
              {cell.end}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--line)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: 11, minHeight: 46 }}>{off}</div>
          )}
        </div>
      ))}
    </>
  );
}
