'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { Avatar } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { createStaff } from '@/lib/actions';
import { TONE_OPTIONS } from '@/lib/formOptions';
import type { Staff } from '@/lib/types';

export function SettingsView({ staff }: { staff: Staff[] }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      await createStaff(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.settingsStaffTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 3 }}>{t.settingsStaffDesc}</div>
        </div>
        <button onClick={() => setOpen(true)} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.settingsAddStaff}</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.addStaffTitle}>
        <form action={submit}>
          <Field label={t.formName}><TextInput name="name" required placeholder={t.formName} /></Field>
          <FieldRow>
            <Field label={t.formInitial}><TextInput name="initial" maxLength={2} placeholder="A" /></Field>
            <Field label={t.formWeeklyHours}><TextInput type="number" name="weekly_hours" min={0} defaultValue={40} /></Field>
          </FieldRow>
          <Field label={t.formTone}>
            <Select name="tone" defaultValue="accent">
              {TONE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
              ))}
            </Select>
          </Field>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setOpen(false)} pending={pending} />
        </form>
      </Modal>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        {staff.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>{t.settingsNoStaff}</div>
        )}
        {staff.map((s, idx) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: idx === staff.length - 1 ? 'none' : '1px solid var(--line)' }}>
            <Avatar initial={s.initial} tone={s.tone} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{t.weeklyShort} {s.weeklyHours}h</div>
            </div>
            <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{s.id}</span>
          </div>
        ))}
      </div>
    </>
  );
}
