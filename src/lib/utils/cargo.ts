export interface CargoType {
  value: string;
  icon?: string;
}

export const CARGO_TYPES: CargoType[] = [
  { value: "GENERAL", icon: "📦" },
  { value: "CONSTRUCTION_MATERIALS", icon: "🧱" },
  { value: "FOODSTUFF", icon: "🍎" },
  { value: "PERISHABLE", icon: "❄️" },
  { value: "LIQUID", icon: "🛢️" },
  { value: "HAZARDOUS", icon: "☣️" },
  { value: "EQUIPMENT", icon: "⚙️" },
  { value: "VEHICLES", icon: "🚗" },
  { value: "CONTAINER", icon: "🚢" },
];

export function cargoLabelKey(cargoType: string): string {
  return `orders.cargoTypes.${cargoType}`;
}
