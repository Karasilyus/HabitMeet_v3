import {
  BookOpen,
  Coffee,
  Droplet,
  Dumbbell,
  Leaf,
  Moon,
  Sparkles,
  Sunrise,
  type LucideIcon,
} from "lucide-react";

/** Alışkanlık / aktivite adına göre uygun bir ikon seçer. */
export function iconFor(text: string): LucideIcon {
  const t = (text ?? "").toLocaleLowerCase("tr-TR");
  if (/(koş|yürü|sabah)/.test(t)) return Sunrise;
  if (/(kitap|oku)/.test(t)) return BookOpen;
  if (/(spor|antrenman|fitness|kuvvet|egzersiz)/.test(t)) return Dumbbell;
  if (/(medit|yoga|nefes)/.test(t)) return Leaf;
  if (/(kahve|kafein)/.test(t)) return Coffee;
  if (/su/.test(t)) return Droplet;
  if (/(uyku|uyu)/.test(t)) return Moon;
  return Sparkles;
}
