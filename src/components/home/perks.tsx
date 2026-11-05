import { Headset, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const perks = [
  { icon: Truck, title: "Free shipping", text: "On every order over $75" },
  { icon: RotateCcw, title: "30-day returns", text: "Changed your mind? No problem" },
  { icon: ShieldCheck, title: "2-year warranty", text: "On all electronics" },
  { icon: Headset, title: "Real humans", text: "Support 7 days a week" },
];

export function Perks() {
  return (
    <section className="container">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-violet">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-sm text-ink-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
