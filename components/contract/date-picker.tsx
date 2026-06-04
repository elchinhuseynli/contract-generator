"use client";

import * as React from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ISO (yyyy-mm-dd) <-> Date helpers that ignore timezones.
function isoToDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function dateToIso(date?: Date): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const fmt = (d: Date) => format(d, "d. M. yyyy", { locale: cs });

// Build an ISO date from numeric parts, rejecting impossible dates (e.g. 31. 2.).
function buildIso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dateToIso(dt);
}

/**
 * Parse a typed date into ISO. Tolerant of the common Czech forms the user
 * types: "4. 6. 2026", "4.6.2026", "04. 06. 2026", "4/6/2026", and ISO
 * "2026-06-04". 2-digit years map to 20xx. Returns null if unparseable.
 */
function parseTypedDate(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return buildIso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return buildIso(y, +m[2], +m[1]);
  }
  return null;
}

type DatePickerProps = {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "d. m. rrrr",
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const date = isoToDate(value);
  const [text, setText] = React.useState(date ? fmt(date) : "");

  // Reflect external value changes (calendar pick, form reset/restore) in the
  // text — but never while the user is typing, or it would fight their input.
  React.useEffect(() => {
    if (!focused) setText(date ? fmt(date) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        className="pr-9"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          if (raw.trim() === "") {
            onChange("");
            return;
          }
          const iso = parseTypedDate(raw);
          if (iso) onChange(iso);
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Otevřít kalendář"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
            />
          }
        >
          <CalendarIcon className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              onChange(dateToIso(d));
              setOpen(false);
            }}
            locale={cs}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

type DateRangePickerProps = {
  start?: string;
  end?: string;
  onChange: (range: { start: string; end: string }) => void;
  className?: string;
};

export function DateRangePicker({
  start,
  end,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const range: DateRange | undefined = isoToDate(start)
    ? { from: isoToDate(start), to: isoToDate(end) }
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !range?.from && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-4 opacity-70" />
        {range?.from
          ? range.to
            ? `${fmt(range.from)} – ${fmt(range.to)}`
            : fmt(range.from)
          : "Vyberte období"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          defaultMonth={range?.from}
          onSelect={(r) => {
            onChange({ start: dateToIso(r?.from), end: dateToIso(r?.to) });
            if (r?.from && r?.to) setOpen(false);
          }}
          locale={cs}
          numberOfMonths={2}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
