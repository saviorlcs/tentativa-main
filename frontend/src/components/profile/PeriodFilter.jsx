import { Button } from "@/components/ui/button";

export default function PeriodFilter({ selected, onChange }) {
  const periods = [
    { value: "7d", label: "7d" },
    { value: "14d", label: "14d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "180d", label: "180d" },
    { value: "360d", label: "360d" }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          onClick={() => onChange(period.value)}
          variant={selected === period.value ? "default" : "outline"}
          size="sm"
          className={selected === period.value ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
