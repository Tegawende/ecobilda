import {
  IconPlant,
  IconSeedling,
  IconTree,
  IconLeaf,
  IconFlower,
  IconGrain,
  IconCarrot,
  IconRecycle,
  IconHammer,
  IconWall,
  IconStack2,
  IconHome2,
  IconMountain,
  IconDroplet,
  IconSparkles,
  IconCut,
  IconSeeding,
  type Icon,
} from '@tabler/icons-react';

// Maps the `icon` field from the backend Skill API to Tabler icon components
const skillIconMap: Record<string, Icon> = {
  // Permaculture skills
  'plant': IconPlant,
  'seedling': IconSeedling,
  'cut': IconCut,
  'carrot': IconCarrot,
  'recycle': IconRecycle,
  'grain': IconGrain,
  'flower': IconFlower,
  'seeding': IconSeeding,
  // Natural Building skills
  'hammer': IconHammer,
  'wall': IconWall,
  'stack-2': IconStack2,
  'home-2': IconHome2,
  'mountain': IconMountain,
  'droplet': IconDroplet,
  'leaf': IconLeaf,
  'sparkles': IconSparkles,
  // Seed data keys (with underscores)
  'garden_maintenance': IconPlant,
  'grafting': IconSeedling,
  'pruning': IconCut,
  'harvesting': IconCarrot,
  'composting': IconRecycle,
  'weeding': IconGrain,
  'propagating': IconFlower,
  'seeds_harvesting': IconSeeding,
  'carpentry': IconHammer,
  'masonry': IconWall,
  'strawbale_building': IconStack2,
  'cob_building': IconHome2,
  'earthen_plaster': IconMountain,
  'lime_plaster': IconDroplet,
  'hempcrete': IconLeaf,
  'tadelakt_plaster': IconSparkles,
  // Legacy keys (with dashes)
  'garden-maintenance': IconPlant,
  'seeds-harvesting': IconSeeding,
  'strawbale': IconStack2,
  'cob': IconHome2,
  'earthen-plaster': IconMountain,
  'lime-plaster': IconDroplet,
  'tadelakt': IconSparkles,
};

export function getSkillIcon(iconName?: string): Icon {
  return (iconName && skillIconMap[iconName]) || IconTree;
}
