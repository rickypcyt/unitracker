import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarShadcn() {
  const [date, setDate] = React.useState(new Date());

  return (
    <div className="maincard flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">shadcn/ui Calendar</h2>
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border shadow" />
      <div className="mt-4 text-lg">Selected: {date?.toLocaleDateString()}</div>
    </div>
  );
} 