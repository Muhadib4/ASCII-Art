import { useId } from "react";
import type { ReactNode } from "react";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="studio-field"><div className="studio-field-label">{label}</div>{children}{hint && <p className="studio-field-hint">{hint}</p>}</div>;
}

export function Range({ label, value, min, max, step = 1, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  const id = useId();
  return <div className="studio-range"><div><label htmlFor={id}>{label}</label><output htmlFor={id}>{Number(value.toFixed(2))}{suffix}</output></div><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

export function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  const id = useId();
  return <div className="studio-field"><label htmlFor={id} className="studio-field-label">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="studio-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="studio-toggle-track" aria-hidden="true" /></label>;
}

export function Color({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const id = useId();
  return <div className="studio-color"><label htmlFor={id}>{label}</label><div><input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} /><span>{value.toUpperCase()}</span></div></div>;
}

export function PanelSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return <details className="studio-section" open={defaultOpen}><summary>{title}<span aria-hidden="true">+</span></summary><div className="studio-section-content">{children}</div></details>;
}
