import { Utensils, Bus, Wifi, BookOpen, Coffee, Receipt, HeartPulse, Shirt, Clapperboard, PawPrint, Home } from "lucide-react";

export const CATEGORY_ICONS = {
  Comida: Utensils,
  Transporte: Bus,
  Servicios: Wifi,
  Estudio: BookOpen,
  Antojos: Coffee,
  Otros: Receipt,
  Salud: HeartPulse,
  Ropa: Shirt,
  Entretenimiento: Clapperboard,
  Mascotas: PawPrint,
  Hogar: Home,
};

export function CategoryIcon({ categoria, size = 16, ...props }) {
  const Icon = CATEGORY_ICONS[categoria] || Receipt;
  return <Icon size={size} aria-hidden="true" {...props} />;
}
