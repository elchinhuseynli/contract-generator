"use client";

import * as React from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  placeholder = "Vyberte datum",
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = isoToDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !date && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-4 opacity-70" />
        {date ? fmt(date) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
