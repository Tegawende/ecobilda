import {
  Hammer,
  Layers,
  Home,
  Mountain,
  Droplets,
  Wheat,
  Blocks,
  Paintbrush,
  Recycle,
  Waves,
  Trees,
  Apple,
  Bird,
  Sprout,
  Flower2,
  Sun,
  type LucideIcon,
} from 'lucide-react';

// Maps skill `code` (or `icon`) values from the Convex backend to lucide-react icon components
const skillIconMap: Record<string, LucideIcon> = {
  // Natural Building skills
  carpentry: Hammer,
  masonry: Layers,
  strawbale_building: Wheat,
  cob_building: Blocks,
  earthen_plaster: Mountain,
  lime_plaster: Droplets,
  hempcrete: Home,
  tadelakt_plaster: Paintbrush,

  // Permaculture skills
  composting: Recycle,
  weeding: Waves,
  grafting: Trees,
  harvesting: Apple,
  garden_maintenance: Bird,
  seeds_harvesting: Sprout,
  propagating: Flower2,
  pruning: Sun,
};

export function getSkillIcon(code?: string): LucideIcon {
  return (code && skillIconMap[code]) || Sprout;
}
