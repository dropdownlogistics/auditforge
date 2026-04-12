'use client';
import { useState, useEffect } from 'react';

const COMPONENTS = ['Fieldwork', 'Planning', 'Review', 'Admin', 'Training'];
const TIME_TYPES = { Fieldwork: 'BILLABLE', Planning: 'BILLABLE', Review: 'BILLABLE', Admin: 'NON_BILLABLE', Training: 'NON_BILLABLE' };

function getWeekDays(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

function fmt(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

export default function TimeEntryGrid({ audits, currentAuditor }) {
  const [selectedAuditId, setSelectedAuditId] = useState('');
  const [weekOf, setWeekOf] = useState(isoDate(new Date()));
  const [grid, setGrid] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState(null);
  const [existing, setExisting] = useState([]);

  const days = getWeekDays(weekOf);
  const monthTag = days[0].toISOString().slice(0, 7);

  // Load existing entries when audit or week changes
  useEffect(() => {
    if (!selectedAuditId || !currentAuditor) return;
    fetch(`/api/time-entries?auditId=${selectedAuditId}&auditorId=${currentAuditor.id}&monthTag=${monthTag}`)
      .then(r => {
        if (!r.ok) throw new Error(`GET /api/time-entries failed: ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        setExisting(data.entries || []);
        setSummary(data.summary || null);
        // Pre-fill grid from existing entries
        const filled = {};
        (data.entries || []).forEach(e => {
          const key = `${e.component}__${isoDate(new Date(e.date))}`;
          filled[key] = e.hours;
        });
        setGrid(filled);
      })
      .catch(err => {
        console.error('TimeEntryGrid load fetch failed:', err);
      });
  }, [selectedAuditId, weekOf, currentAuditor]);

  function handleCell(component, date, value) {
    const key = `${component}__${isoDate(date)}`;
    setGrid(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function rowTotal(component) {
    return days.reduce((sum, d) => {
      const v = parseFloat(grid[`${component}__${isoDate(d)}`] || 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }

  function dayTotal(date) {
    return COMPONENTS.reduce((sum, c) => {
      const v = parseFloat(grid[`${c}__${isoDate(date)}`] || 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  }

  function weekTotal() {
    return COMPONENTS.reduce((sum, c) => sum + rowTotal(c), 0);
  }

  async function handleSave() {
    if (!selectedAuditId || !currentAuditor) return;
    setSaving(true);

    const entries = [];
    COMPONENTS.forEach(component => {
      days.forEach(date => {
        const key = `${component}__${isoDate(date)}`;
        const hours = parseFloat(grid[key] || 0);
        if (hours > 0) {
          entries.push({
            auditorId: currentAuditor.id,
            engagementId: selectedAuditId,
            date: isoDate(date),
            hours,
            timeType: TIME_TYPES[component] || 'BILLABLE',
            component,
            category: 'Audits',
          });
        }
      });
    });

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        // Refresh summary
        fetch(`/api/time-entries?auditId=${selectedAuditId}&auditorId=${currentAuditor.id}&monthTag=${monthTag}`)
          .then(r => {
            if (!r.ok) throw new Error(`GET /api/time-entries failed: ${r.status} ${r.statusText}`);
            return r.json();
          })
          .then(d => setSummary(d.summary))
          .catch(err => {
            console.error('TimeEntryGrid summary refresh failed:', err);
          });
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  const selectedAudit = audits?.find(a => a.id === selectedAuditId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedAuditId}
          onChange={e => { setSelectedAuditId(e.target.value); setGrid({}); setSaved(false); }}
          style={{ padding: '8px 12px', background: '#0f1e2c', border: '1px solid rgba(245,241,235,0.1)', color: '#F5F1EB', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', minWidth: '280px' }}
        >
          <option value="">Select Engagement</option>
          {(audits || []).map(a => (
            <option key={a.id} value={a.id}>{a.auditName}</option>
          ))}
        </select>

        <input
          type="date"
          value={weekOf}
          onChange={e => { setWeekOf(e.target.value); setGrid({}); setSaved(false); }}
          style={{ padding: '8px 12px', background: '#0f1e2c', border: '1px solid rgba(245,241,235,0.1)', color: '#F5F1EB', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
        />

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(245,241,235,0.35)', letterSpacing: '0.06em' }}>
          WEEK OF {days[0] ? fmt(days[0]) : '—'} → {days[6] ? fmt(days[6]) : '—'}
        </div>
      </div>

      {/* Summary strip */}
      {summary && (
        <div style={{ display: 'flex', gap: '1px', background: 'rgba(245,241,235,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            { label: 'Total Hrs', value: summary.totalHours.toFixed(1), color: '#F5F1EB' },
            { label: 'Billable', value: summary.billableHours.toFixed(1), color: '#4A9E6B' },
            { label: 'Non-Billable', value: summary.nonBillableHours.toFixed(1), color: '#C49A3C' },
            { label: 'Billable %', value: `${summary.billablePct}%`, color: summary.billablePct >= 75 ? '#4A9E6B' : '#B23531' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '10px', background: '#10202f', textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: 'rgba(245,241,235,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {selectedAuditId && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(245,241,235,0.35)', fontWeight: '600', letterSpacing: '0.08em', borderBottom: '1px solid rgba(245,241,235,0.07)', width: '120px' }}>COMPONENT</th>
                {days.map(d => (
                  <th key={isoDate(d)} style={{ padding: '8px 8px', textAlign: 'center', color: 'rgba(245,241,235,0.35)', fontWeight: '600', letterSpacing: '0.06em', borderBottom: '1px solid rgba(245,241,235,0.07)', minWidth: '72px' }}>
                    {fmt(d)}
                  </th>
                ))}
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(245,241,235,0.35)', fontWeight: '600', letterSpacing: '0.08em', borderBottom: '1px solid rgba(245,241,235,0.07)' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((component, i) => (
                <tr key={component} style={{ background: i % 2 === 0 ? 'rgba(245,241,235,0.02)' : 'transparent' }}>
                  <td style={{ padding: '6px 12px', color: TIME_TYPES[component] === 'BILLABLE' ? '#4A9E6B' : '#C49A3C', fontWeight: '600', fontSize: '10px', letterSpacing: '0.06em' }}>
                    {component.toUpperCase()}
                    <div style={{ fontSize: '8px', color: 'rgba(245,241,235,0.2)', fontWeight: '400', marginTop: '1px' }}>{TIME_TYPES[component]}</div>
                  </td>
                  {days.map(d => {
                    const key = `${component}__${isoDate(d)}`;
                    return (
                      <td key={isoDate(d)} style={{ padding: '4px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.25"
                          value={grid[key] || ''}
                          onChange={e => handleCell(component, d, e.target.value)}
                          placeholder="—"
                          style={{
                            width: '60px', padding: '5px 4px', textAlign: 'center',
                            background: grid[key] ? 'rgba(74,158,107,0.08)' : '#0f1e2c',
                            border: `1px solid ${grid[key] ? 'rgba(74,158,107,0.25)' : 'rgba(245,241,235,0.07)'}`,
                            color: '#F5F1EB', borderRadius: '4px',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: '12px',
                          }}
                        />
                      </td>
                    );
                  })}
                  <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: '700', color: rowTotal(component) > 0 ? '#F5F1EB' : 'rgba(245,241,235,0.2)' }}>
                    {rowTotal(component) > 0 ? rowTotal(component).toFixed(1) : '—'}
                  </td>
                </tr>
              ))}

              {/* Day totals row */}
              <tr style={{ borderTop: '1px solid rgba(245,241,235,0.1)' }}>
                <td style={{ padding: '8px 12px', fontWeight: '700', fontSize: '10px', color: 'rgba(245,241,235,0.35)', letterSpacing: '0.08em' }}>DAILY TOTAL</td>
                {days.map(d => (
                  <td key={isoDate(d)} style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: dayTotal(d) > 0 ? '#C49A3C' : 'rgba(245,241,235,0.15)' }}>
                    {dayTotal(d) > 0 ? dayTotal(d).toFixed(1) : '—'}
                  </td>
                ))}
                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#C49A3C', fontSize: '13px' }}>
                  {weekTotal().toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Save */}
      {selectedAuditId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving || weekTotal() === 0}
            style={{
              padding: '10px 24px', background: saved ? '#4A9E6B' : '#C49A3C',
              color: '#0D1B2A', border: 'none', borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700',
              cursor: weekTotal() === 0 ? 'not-allowed' : 'pointer', opacity: weekTotal() === 0 ? 0.4 : 1,
              letterSpacing: '0.06em',
            }}
          >
            {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE ENTRIES'}
          </button>
          {weekTotal() > 0 && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(245,241,235,0.3)' }}>
              {weekTotal().toFixed(1)} hrs · {monthTag}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
