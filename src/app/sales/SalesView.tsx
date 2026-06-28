'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { Avatar, Card } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { createTransaction } from '@/lib/actions';
import { SERVICE_KEYS } from '@/lib/formOptions';
import type { SalesData } from '@/lib/data';
import type { Staff } from '@/lib/types';

type Period = 'month' | 'lastMonth' | 'year';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats a whole-dollar amount as e.g. $18,420. */
function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

/** YYYY-MM-DD（ローカル日付）。 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TXN_COLS = '0.7fr 1.6fr 1.3fr 1.1fr 0.9fr';

export function SalesView({ summary: s, trend, categories, staffRank, txns, staff }: SalesData & { staff: Staff[] }) {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState<Period>('month');
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      await createTransaction(formData);
      setOpen(false);
    });
  }

  const monthLabel = (m: number) => (lang === 'ja' ? `${m}月` : EN_MONTHS[m - 1]);
  const trendMax = Math.max(...trend.map((b) => b.value), 1);

  const periodBtn = (active: boolean): React.CSSProperties => ({
    font: '600 12.5px var(--ui)',
    border: 'none',
    borderRadius: 999,
    padding: '8px 18px',
    cursor: 'pointer',
    transition: 'all .15s',
    whiteSpace: 'nowrap',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--ink2)',
  });

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 5, background: '#FBF9F5', border: '1px solid var(--line)', borderRadius: 999, padding: 4 }}>
          <button onClick={() => setPeriod('month')} style={periodBtn(period === 'month')}>{t.salesPeriodMonth}</button>
          <button onClick={() => setPeriod('lastMonth')} style={periodBtn(period === 'lastMonth')}>{t.salesPeriodLastMonth}</button>
          <button onClick={() => setPeriod('year')} style={periodBtn(period === 'year')}>{t.salesPeriodYear}</button>
        </div>
        <button onClick={() => setOpen(true)} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.btnAddSales}</button>
        <button style={{ font: '600 12.5px var(--ui)', background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>↓ {t.salesExport}</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.addSalesTitle}>
        <form action={submit}>
          <Field label={t.formCustomer}><TextInput name="customer_name" required placeholder={t.formCustomer} /></Field>
          <FieldRow>
            <Field label={t.formDate}><TextInput type="date" name="txn_date" required defaultValue={todayStr()} /></Field>
            <Field label={t.formAmount}><TextInput type="number" name="amount" required min={0} step={1} placeholder="0" /></Field>
          </FieldRow>
          <FieldRow>
            <Field label={t.formStaff}>
              <Select name="staff_id" defaultValue="">
                <option value="">{t.formNone}</option>
                {staff.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.formCategory}>
              <Select name="category" defaultValue="service">
                <option value="service">{t.catService}</option>
                <option value="retail">{t.catRetailCat}</option>
              </Select>
            </Field>
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

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 24 }}>
        <Metric label={t.mRevenue} value={money(s.monthRevenue)} foot={`▲ ${s.monthRevenueDelta}%`} footColor="var(--sage)" />
        <Metric label={t.mRevenueDelta} value={`${s.monthRevenueDelta >= 0 ? '+' : ''}${s.monthRevenueDelta}%`} foot={t.salesPeriodLastMonth} valueColor="var(--sage)" footColor="var(--ink3)" />
        <Metric label={t.mAvgSpend} value={money(s.avgSpend)} foot={t.custSpend} footColor="var(--ink3)" />
        <Metric label={t.mTxn} value={s.transactions} unit={t.uCases} foot={t.salesPeriodMonth} footColor="var(--ink3)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 22, marginBottom: 22 }}>
        {/* Revenue trend */}
        <Card>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: '0 0 18px' }}>{t.secSalesTrend}</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, padding: '0 4px' }}>
            {trend.map((b) => {
              const h = Math.round((b.value / trendMax) * 100);
              const isLast = b.month === trend[trend.length - 1].month;
              return (
                <div key={b.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500 }}>{money(Math.round(b.value / 1000))}k</div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 46,
                      height: `${h}%`,
                      borderRadius: '8px 8px 0 0',
                      background: isLast ? 'var(--accent)' : 'var(--accent-soft)',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{monthLabel(b.month)}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue breakdown */}
        <Card>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: '0 0 14px' }}>{t.secSalesBreakdown}</h2>
          {categories.map((c, idx) => {
            const tone = toneStyles[c.tone];
            return (
              <div key={c.id} style={{ padding: '11px 0', borderTop: idx === 0 ? 'none' : '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t[c.nameKey]}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink2)' }}>{money(c.amount)}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink3)', width: 38, textAlign: 'right' }}>{c.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: tone.soft, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: tone.strong }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 18, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <SplitStat label={t.salesService} value={money(s.serviceRevenue)} />
            <SplitStat label={t.salesRetailRev} value={money(s.retailRevenue)} />
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: 22 }}>
        {/* Sales by staff */}
        <Card>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: '0 0 6px' }}>{t.secSalesStaff}</h2>
          {staffRank.map((r, idx) => {
            const tone = toneStyles[r.tone];
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: '1px solid var(--line)', marginTop: idx === 0 ? 8 : 0 }}>
                <Avatar initial={r.initial} tone={r.tone} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{r.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink2)' }}>{money(r.amount)}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 5, background: tone.soft, overflow: 'hidden' }}>
                    <div style={{ width: `${r.share}%`, height: '100%', background: tone.strong }} />
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Recent transactions */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: '0 0 10px' }}>{t.secSalesRecent}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: TXN_COLS, gap: 14, padding: '10px 0', fontSize: 11, letterSpacing: 0.5, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
            <div>{t.ordDate}</div><div>{t.salesColCustomer}</div><div>{t.salesColMenu}</div><div>{t.salesColStaff}</div><div style={{ textAlign: 'right' }}>{t.salesColAmount}</div>
          </div>
          {txns.map((tx, idx) => (
            <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: TXN_COLS, gap: 14, padding: '13px 0', alignItems: 'center', borderBottom: idx === txns.length - 1 ? 'none' : '1px solid var(--line)', fontSize: 13 }}>
              <div style={{ color: 'var(--ink2)' }}>{tx.date}</div>
              <div style={{ fontWeight: 500 }}>{tx.customer}</div>
              <div style={{ color: 'var(--ink2)' }}>{t[tx.serviceKey]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar initial={tx.staffInitial} tone={tx.tone} size={24} />
                <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{tx.staffName}</span>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--serif)' }}>{money(tx.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  unit,
  foot,
  valueColor,
  footColor,
}: {
  label: string;
  value: number | string;
  unit?: string;
  foot: string;
  valueColor?: string;
  footColor: string;
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 15, padding: '18px 20px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
      <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 8 }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 600, lineHeight: 0.9, color: valueColor }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: footColor, marginTop: 9 }}>{foot}</div>
    </div>
  );
}

function SplitStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
