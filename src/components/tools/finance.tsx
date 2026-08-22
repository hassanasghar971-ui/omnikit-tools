"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, CopyButton, Field, Input, Panel, Select } from "@/components/ui";
import type { ToolProps } from "@/components/tools/dev";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/* ---------------- Loan Calculator ---------------- */

export function LoanCalculator({ onResult }: ToolProps) {
  const [amount, setAmount] = useState(250000);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(30);

  const calc = useMemo(() => {
    const r = rate / 100 / 12;
    const n = years * 12;
    if (r === 0) return { payment: amount / n, total: amount, interest: 0, schedule: [] as Array<[number, number, number]> };
    const payment = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = payment * n;
    let balance = amount;
    const schedule: Array<[number, number, number]> = [];
    for (let m = 1; m <= Math.min(n, 360); m++) {
      const interestPart = balance * r;
      const principalPart = payment - interestPart;
      balance -= principalPart;
      if (m <= 12 || m % 12 === 0) schedule.push([m, interestPart, Math.max(balance, 0)]);
    }
    return { payment, total, interest: total - amount, schedule };
  }, [amount, rate, years]);

  useEffect(() => {
    onResult?.({
      text: `Loan: ${money(amount)} @ ${rate}% for ${years} years\nMonthly payment: ${money(calc.payment)}\nTotal paid: ${money(calc.total)}\nTotal interest: ${money(calc.interest)}\n\nSchedule (month | interest | balance):\n${calc.schedule.map(([m, i, b]) => `#${m}: ${money(i)} | ${money(b)}`).join("\n")}`,
      ext: "txt",
    });
  }, [calc, amount, rate, years, onResult]);

  const inputs = [
    { label: "Loan amount ($)", value: amount, set: setAmount, step: 1000 },
    { label: "Annual interest rate (%)", value: rate, set: setRate, step: 0.1 },
    { label: "Term (years)", value: years, set: setYears, step: 1 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {inputs.map((f) => (
          <Field key={f.label} label={f.label}>
            <Input type="number" value={f.value} step={f.step} onChange={(e) => f.set(Number(e.target.value))} className="font-mono" />
          </Field>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4"><p className="text-[11px] uppercase tracking-wider text-slate-500">Monthly payment</p><p className="mt-1 font-mono text-xl font-bold text-cyan-300">{money(calc.payment)}</p></Panel>
        <Panel className="p-4"><p className="text-[11px] uppercase tracking-wider text-slate-500">Total paid</p><p className="mt-1 font-mono text-xl font-bold text-slate-200">{money(calc.total)}</p></Panel>
        <Panel className="p-4"><p className="text-[11px] uppercase tracking-wider text-slate-500">Total interest</p><p className="mt-1 font-mono text-xl font-bold text-amber-300">{money(calc.interest)}</p></Panel>
      </div>
      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">First 12 months</p>
        <div className="space-y-1.5">
          {calc.schedule.filter(([m]) => m <= 12).map(([m, i, b]) => (
            <div key={m} className="flex items-center gap-3 text-xs">
              <span className="w-16 font-mono text-slate-500">#{m}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-cyan-500/60" style={{ width: `${Math.min(100, (i / calc.payment) * 100 * 3)}%` }} />
              </div>
              <span className="w-32 text-right font-mono text-slate-400">interest {money(i)}</span>
              <span className="w-32 text-right font-mono text-slate-500">bal {money(b)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Compound Interest ---------------- */

export function CompoundInterest({ variant = "compound", onResult }: ToolProps & { variant?: "compound" | "simple" }) {
  const [principal, setPrincipal] = useState(10000);
  const [contribution, setContribution] = useState(500);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [freq, setFreq] = useState(12);

  const calc = useMemo(() => {
    const r = rate / 100;
    if (variant === "simple") {
      const total = principal * (1 + r * years);
      return { total, contributed: principal, growth: total - principal, rows: [] as Array<[number, number]> };
    }
    const n = freq;
    const factor = Math.pow(1 + r / n, n * years);
    let future = principal * factor;
    if (contribution > 0 && r > 0) {
      future += contribution * ((factor - 1) / (r / n));
    } else if (contribution > 0) {
      future += contribution * n * years;
    }
    const contributed = principal + contribution * n * years;
    const rows: Array<[number, number]> = [];
    for (let y = 0; y <= Math.min(years, 40); y++) {
      const fy = Math.pow(1 + r / n, n * y);
      let v = principal * fy;
      if (contribution > 0 && r > 0) v += contribution * ((fy - 1) / (r / n));
      else if (contribution > 0) v += contribution * n * y;
      if (y === 0 || y === years || y % 5 === 0) rows.push([y, v]);
    }
    return { total: future, contributed, growth: future - contributed, rows };
  }, [principal, contribution, rate, years, freq, variant]);

  useEffect(() => {
    onResult?.({
      text: `Future value: ${money(calc.total)}\nTotal contributed: ${money(calc.contributed)}\n${variant === "simple" ? "Simple interest earned" : "Compound growth"}: ${money(calc.growth)}\n\nYear-by-year:\n${calc.rows.map(([y, v]) => `Year ${y}: ${money(v)}`).join("\n")}`,
      ext: "txt",
    });
  }, [calc, variant, onResult]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Principal ($)"><Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="font-mono" /></Field>
        <Field label="Monthly contribution ($)"><Input type="number" value={contribution} onChange={(e) => setContribution(Number(e.target.value))} className="font-mono" /></Field>
        <Field label="Annual rate (%)"><Input type="number" step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="font-mono" /></Field>
        <Field label="Years"><Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="font-mono" /></Field>
      </div>
      {variant !== "simple" ? (
        <Field label="Compounding frequency">
          <Select value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="w-56">
            <option value={1}>Annually</option><option value={2}>Semi-annually</option><option value={4}>Quarterly</option>
            <option value={12}>Monthly</option><option value={365}>Daily</option>
          </Select>
        </Field>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4"><p className="text-[11px] uppercase tracking-wider text-slate-500">Future value</p><p className="mt-1 font-mono text-xl font-bold text-cyan-300">{money(calc.total)}</p></Panel>
        <Panel className="p-4"><p className="text-[11px] uppercase tracking-wider text-slate-500">Contributed</p><p className="mt-1 font-mono text-xl font-bold text-slate-200">{money(calc.contributed)}</p></Panel>
        <Panel className="p-4"><p className="text-[11px] uppercase tracking-wider text-slate-500">Growth</p><p className="mt-1 font-mono text-xl font-bold text-emerald-300">{money(calc.growth)}</p></Panel>
      </div>
      {calc.rows.length ? (
        <Panel className="p-4">
          <div className="flex h-28 items-end gap-1">
            {calc.rows.map(([y, v]) => (
              <div key={y} className="group relative flex-1">
                <div className="rounded-t bg-gradient-to-t from-cyan-600/60 to-cyan-400/80 transition-all group-hover:from-cyan-500 group-hover:to-cyan-300" style={{ height: `${Math.max(4, (v / Math.max(calc.total, 1)) * 100)}%` }} />
                <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-slate-400 group-hover:block">{money(v)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-600">
            <span>Y0</span>{calc.rows.slice(1).map(([y]) => <span key={y}>Y{y}</span>)}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- Tip Calculator ---------------- */

export function TipCalculator({ onResult }: ToolProps) {
  const [bill, setBill] = useState(85.5);
  const [tipPct, setTipPct] = useState(18);
  const [people, setPeople] = useState(3);

  const calc = useMemo(() => {
    const tip = bill * (tipPct / 100);
    const total = bill + tip;
    const perPerson = total / Math.max(people, 1);
    return { tip, total, perPerson };
  }, [bill, tipPct, people]);

  useEffect(() => {
    onResult?.({
      text: `Bill: ${money(bill)}\nTip (${tipPct}%): ${money(calc.tip)}\nTotal: ${money(calc.total)}\nSplit ${people} ways: ${money(calc.perPerson)} each`,
      ext: "txt",
    });
  }, [calc, bill, tipPct, people, onResult]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bill amount ($)"><Input type="number" step={0.5} value={bill} onChange={(e) => setBill(Number(e.target.value))} className="font-mono" /></Field>
        <Field label="People splitting"><Input type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} className="font-mono" /></Field>
        <Field label="Tip %"><Input type="number" value={tipPct} onChange={(e) => setTipPct(Number(e.target.value))} className="font-mono" /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {[10, 15, 18, 20, 25].map((p) => (
          <Button key={p} variant={tipPct === p ? "primary" : "ghost"} onClick={() => setTipPct(p)}>{p}%</Button>
        ))}
      </div>
      <Panel className="p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-[11px] uppercase tracking-wider text-slate-500">Tip</p><p className="mt-1 font-mono text-xl font-bold text-amber-300">{money(calc.tip)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wider text-slate-500">Total</p><p className="mt-1 font-mono text-xl font-bold text-slate-200">{money(calc.total)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wider text-slate-500">Per person</p><p className="mt-1 font-mono text-2xl font-bold text-cyan-300">{money(calc.perPerson)}</p></div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- BMI Calculator ---------------- */

export function BmiCalculator({ onResult }: ToolProps) {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(9);
  const [pounds, setPounds] = useState(154);

  const bmi = useMemo(() => {
    if (unit === "metric") {
      const m = height / 100;
      return m > 0 ? weight / (m * m) : null;
    }
    const totalInches = feet * 12 + inches;
    return totalInches > 0 ? (pounds * 703) / (totalInches * totalInches) : null;
  }, [unit, height, weight, feet, inches, pounds]);

  const category = useMemo(() => {
    if (bmi === null) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "text-sky-300", pct: 30 };
    if (bmi < 25) return { label: "Healthy weight", color: "text-emerald-300", pct: 50 };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-300", pct: 70 };
    return { label: "Obese", color: "text-rose-300", pct: 90 };
  }, [bmi]);

  useEffect(() => {
    onResult?.({
      text: bmi === null ? "" : `BMI: ${bmi.toFixed(1)}\nCategory: ${category?.label}`,
      ext: "txt",
    });
  }, [bmi, category, onResult]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Button variant={unit === "metric" ? "primary" : "ghost"} onClick={() => setUnit("metric")}>Metric (cm / kg)</Button>
        <Button variant={unit === "imperial" ? "primary" : "ghost"} onClick={() => setUnit("imperial")}>Imperial (ft / lb)</Button>
      </div>
      {unit === "metric" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Height (cm)"><Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="font-mono" /></Field>
          <Field label="Weight (kg)"><Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="font-mono" /></Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Height (ft)"><Input type="number" value={feet} onChange={(e) => setFeet(Number(e.target.value))} className="font-mono" /></Field>
          <Field label="Height (in)"><Input type="number" value={inches} onChange={(e) => setInches(Number(e.target.value))} className="font-mono" /></Field>
          <Field label="Weight (lb)"><Input type="number" value={pounds} onChange={(e) => setPounds(Number(e.target.value))} className="font-mono" /></Field>
        </div>
      )}
      {bmi !== null ? (
        <Panel className="p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Your BMI</p>
            <p className="font-mono text-3xl font-bold text-cyan-300">{bmi.toFixed(1)}</p>
          </div>
          <div className="relative mt-4 h-3 rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 via-40% to-rose-500">
            <div className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-white bg-slate-900 shadow" style={{ left: `${Math.min(100, Math.max(0, ((bmi - 14) / 26) * 100))}%` }} />
          </div>
          <p className={`mt-4 text-center text-sm font-semibold ${category?.color}`}>{category?.label} · BMI {bmi.toFixed(1)}</p>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- Percentage Calculator ---------------- */

export function PercentageCalculator({ onResult }: ToolProps) {
  const [mode, setMode] = useState("of");
  const [a, setA] = useState(25);
  const [b, setB] = useState(200);

  const modes: Array<{ id: string; label: string; calc: (x: number, y: number) => string }> = [
    { id: "of", label: "X% of Y", calc: (x, y) => `${x}% of ${y} = ${y * (x / 100)}` },
    { id: "isWhat", label: "X is what % of Y", calc: (x, y) => (y === 0 ? "Cannot divide by zero — Y must be non-zero" : `${x} is ${((x / y) * 100).toFixed(2)}% of ${y}`) },
    { id: "change", label: "% change X → Y", calc: (x, y) => (x === 0 ? "Cannot divide by zero — X must be non-zero" : `From ${x} to ${y}: ${(((y - x) / x) * 100).toFixed(2)}% change`) },
    { id: "add", label: "X + Y%", calc: (x, y) => `${x} + ${y}% = ${x * (1 + y / 100)}` },
    { id: "sub", label: "X − Y%", calc: (x, y) => `${x} − ${y}% = ${x * (1 - y / 100)}` },
  ];

  const output = useMemo(() => {
    const m = modes.find((m2) => m2.id === mode);
    return m ? m.calc(a, b) : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, a, b]);

  useEffect(() => {
    onResult?.({ text: output, ext: "txt" });
  }, [output, onResult]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <Button key={m.id} variant={mode === m.id ? "primary" : "ghost"} onClick={() => setMode(m.id)}>{m.label}</Button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="X"><Input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} className="font-mono" /></Field>
        <Field label="Y"><Input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} className="font-mono" /></Field>
      </div>
      <Panel className="p-5 text-center">
        <p className="font-mono text-2xl font-bold text-cyan-300">{output || "—"}</p>
      </Panel>
      {output ? <CopyButton text={output} className="mx-auto" /> : null}
    </div>
  );
}
