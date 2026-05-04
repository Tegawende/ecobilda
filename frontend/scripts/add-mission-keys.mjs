// Adds new mission-related i18n keys to all locale files.
// Run with: node scripts/add-mission-keys.mjs
//
// French is the canonical source. Other locales receive English placeholders
// (good enough for dev — translations can be refined later).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');
const LOCALES = ['fr', 'en', 'es', 'de', 'nl', 'pt'];

// === French (canonical) ===
const fr = {
  missions: {
    title: 'Missions',
    found: '{count} missions trouvées',
    empty: 'Aucune mission ne correspond à vos critères.',
    helpers: 'helpers',
    daysPerWeekSuffix: 'j/sem',
    types: {
      CHANTIER: 'Chantier participatif',
      FORMATION: 'Formation',
    },
    difficulty: {
      DEBUTANT: 'Débutant',
      INTERMEDIAIRE: 'Intermédiaire',
      EXPERT: 'Expert',
    },
    status: {
      DRAFT: 'Brouillon',
      PUBLISHED: 'Publiée',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    },
    poste: {
      fondations: 'Fondations',
      murs: 'Murs',
      toiture: 'Toiture',
      sol: 'Sol',
      isolation: 'Isolation',
      enduits: 'Enduits',
      menuiseries: 'Menuiseries',
      exterieur: 'Aménagement extérieur',
      autre: 'Autre',
    },
    technique: {
      pierre: 'Pierre',
      beton: 'Béton',
      pilotis: 'Pilotis',
      pneu: 'Pneu',
      paille_porteur: 'Paille porteuse',
      paille_remplissage: 'Paille (remplissage)',
      ossature_bois: 'Ossature bois',
      terre_crue: 'Terre crue',
      brique_terre: 'Brique de terre',
      parpaing: 'Parpaing',
      toit_vegetal: 'Toit végétal',
      ardoise: 'Ardoise',
      tuile: 'Tuile',
      chaume: 'Chaume',
      bardeau_bois: 'Bardeau bois',
      ondule: 'Tôle ondulée',
      terre_battue: 'Terre battue',
      beton_chanvre: 'Béton de chanvre',
      plancher_bois: 'Plancher bois',
      dalle_chaux: 'Dalle chaux',
      dalle_argile: 'Dalle argile',
      paille: 'Paille',
      laine_bois: 'Laine de bois',
      chanvre: 'Chanvre',
      liege: 'Liège',
      ouate_cellulose: 'Ouate de cellulose',
      laine_mouton: 'Laine de mouton',
      verre_expanse: 'Verre expansé',
      terre: 'Terre',
      chaux: 'Chaux',
      chaux_chanvre: 'Chaux/chanvre',
      tadelakt: 'Tadelakt',
      platre: 'Plâtre',
      bois_massif: 'Bois massif',
      recup: 'Récupération',
      double_vitrage: 'Double vitrage',
      simple_vitrage: 'Simple vitrage',
      terrasse: 'Terrasse',
      jardin_potager: 'Jardin / potager',
      mare: 'Mare',
      fosse: 'Fosse',
      recuperation_eau: 'Récupération d\'eau',
      autre: 'Autre',
    },
    filters: {
      title: 'Filtres',
      keywordPlaceholder: 'Rechercher une mission…',
      type: 'Type',
      difficulty: 'Niveau',
      poste: 'Poste',
      technique: 'Technique',
      pricingMode: 'Tarif',
      freeOnly: 'Gratuit uniquement',
      startsAfter: 'Commence après',
      endsBefore: 'Finit avant',
      skills: 'Compétences',
      languages: 'Langues',
    },
  },
  missionDetail: {
    notFound: 'Mission introuvable',
    backToMissions: 'Retour aux missions',
    about: 'À propos de la mission',
    aboutPlace: 'Le lieu',
    applyTitle: 'Rejoindre cette mission',
    applyDesc: 'Envoie ta motivation à l\'hôte. Une conversation s\'ouvrira pour vous mettre en relation.',
    applyCta: 'Postuler',
    loginToApply: 'Se connecter pour postuler',
    notOpen: 'Cette mission n\'est pas ouverte aux candidatures.',
    youAreHost: 'Tu es l\'hôte de cette mission.',
    viewHost: 'Voir le profil de l\'hôte',
    otherMissionsHere: 'Autres missions de ce lieu',
  },
  createMission: {
    title: 'Créer une mission',
    subtitle: 'Décris la mission que tu proposes : chantier participatif ou formation.',
    submitDraft: 'Sauvegarder en brouillon',
    publish: 'Publier la mission',
    unpublish: 'Repasser en brouillon',
    successTitle: 'Mission créée',
    successMessage: 'Tu peux maintenant ajouter des photos, puis publier la mission.',
    errorMessage: 'Impossible de créer la mission. Réessaie.',
    editTitle: 'Modifier la mission',
    editSuccessTitle: 'Mission mise à jour',
    editSuccessMessage: '',
    publishedTitle: 'Mission publiée',
    publishedMessage: 'La mission est maintenant visible par les helpers.',
    cancelMissionTitle: 'Annuler la mission ?',
    cancelMissionText: 'Les helpers acceptés seront notifiés. Cette action peut être annulée.',
    cancelMissionConfirm: 'Annuler la mission',
    noPlaceTitle: 'Tu n\'as pas encore de lieu',
    noPlaceMessage: 'Pour créer une mission, tu dois d\'abord créer ton lieu d\'accueil.',
    createPlaceCta: 'Créer mon lieu',
    placePendingTitle: 'Lieu en attente de validation',
    placePendingMessage: 'Ton lieu doit être validé par un administrateur avant que tu puisses publier des missions.',
    fields: {
      place: 'Lieu d\'accueil',
      placePlaceholder: 'Sélectionne un lieu',
      type: 'Type de mission',
      title: 'Titre',
      titlePlaceholder: 'Ex: Pose d\'un mur en paille porteuse',
      description: 'Description',
      descriptionPlaceholder: 'Décris ce qui sera fait, le contexte, ce que les helpers vont apprendre…',
      difficulty: 'Niveau',
      poste: 'Poste',
      technique: 'Technique',
      workSection: 'Type de travaux',
      pricingSection: 'Tarif',
      isPaid: 'Formation payante',
      price: 'Prix par participant',
      scheduleSection: 'Dates et horaires',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      maxParticipants: 'Nb max de participants',
      hoursPerDay: 'Heures par jour',
      daysPerWeek: 'Jours par semaine',
      skillsSection: 'Compétences',
    },
    validation: {
      projectRequired: 'Choisis un lieu',
      titleMin: 'Le titre doit faire au moins 5 caractères',
      descriptionMin: 'La description doit faire au moins 30 caractères',
      startDateRequired: 'Date de début requise',
      endDateRequired: 'Date de fin requise',
      endAfterStart: 'La date de fin doit être après le début',
      priceRequired: 'Indique un prix > 0',
    },
  },
  myMissions: {
    title: 'Mes missions',
    subtitle: 'Gère les missions que tu proposes.',
    createNew: 'Nouvelle mission',
    empty: 'Tu n\'as pas encore de mission. Crée-en une pour rencontrer des helpers.',
    drafts: 'Brouillons',
    published: 'Publiées / en cours',
    completed: 'Terminées',
    deleteConfirmTitle: 'Supprimer la mission ?',
    deleteConfirmText: 'Cette action supprimera définitivement la mission "{title}".',
    tabs: {
      missions: 'Missions',
    },
  },
  myPlaces: {
    createNew: 'Ajouter un lieu',
    empty: 'Tu n\'as pas encore de lieu d\'accueil.',
    addMission: 'Ajouter une mission',
    missionsCount: '{count} missions',
    deleteConfirmTitle: 'Supprimer ce lieu ?',
    deleteConfirmText: 'Le lieu "{title}" sera supprimé. Tu dois d\'abord supprimer toutes ses missions.',
    tabs: {
      places: 'Mes lieux',
    },
  },
  createPlace: {
    title: 'Créer mon lieu d\'accueil',
    subtitle: 'Décris où tu accueilles les helpers : adresse, hébergement, repas, équipements.',
    editTitle: 'Modifier mon lieu',
    submit: 'Créer le lieu',
    successTitle: 'Lieu créé',
    successMessage: 'Ton lieu est en attente de validation. Tu pourras créer des missions dès qu\'il sera validé.',
    editSuccessTitle: 'Lieu mis à jour',
    editSuccessMessage: '',
    notFound: 'Lieu introuvable',
    fields: {
      title: 'Nom du lieu',
      titlePlaceholder: 'Ex: Le Domaine des Sources',
      address: 'Adresse',
      addressPlaceholder: 'Ville, code postal…',
      hostingSection: 'Hébergement et repas',
      accommodation: 'Hébergement',
      accommodationPlaceholder: 'Décris où dorment les helpers (chambre, yourte, camping…)',
      food: 'Repas',
      foodPlaceholder: 'Décris ce qui est inclus (3 repas/jour, repas du midi, cuisine partagée…)',
      amenitiesSection: 'Équipements',
      wifi: 'WiFi',
      familyFriendly: 'Familles bienvenues',
      petsAllowed: 'Animaux acceptés',
      smokingAllowed: 'Fumeurs acceptés',
      languagesSection: 'Langues parlées sur place',
    },
    validation: {
      titleMin: 'Le nom doit faire au moins 3 caractères',
      cityRequired: 'Adresse requise',
    },
  },
  missionFeedback: {
    form: {
      title: 'Retour d\'expérience',
      subtitle: 'Partage ton retour sur la mission "{title}". Ces données aideront d\'autres porteurs de projet.',
      submit: 'Publier le retour',
      successTitle: 'Retour publié',
      successMessage: 'Merci pour ton partage.',
      tooLong: 'Trop long (max 500 caractères)',
      numericSection: 'Données chiffrées',
      narrativeSection: 'Récit',
      photosSection: 'Photos',
      totalCost: 'Coût total',
      surface: 'Surface',
      result: 'Résultat',
      difficulties: 'Difficultés rencontrées',
      learnings: 'Ce que vous avez appris',
      addPhoto: 'Ajouter une photo',
      isPublic: 'Rendre ce retour public',
      isPublicHelp: 'Si activé, ce retour sera visible sur la page "Apprenez des autres".',
    },
    display: {
      title: 'Retour d\'expérience',
      totalCost: 'Coût total',
      surface: 'Surface',
      duration: 'Durée',
      difficulties: 'Difficultés',
      learnings: 'Apprentissages',
      helperPhotos: 'Photos des helpers',
    },
    result: {
      SUCCESS: 'Réussi',
      PARTIAL_SUCCESS: 'Partiellement réussi',
      FAILURE: 'Échec',
    },
  },
  learn: {
    title: 'Apprenez des autres',
    subtitle: 'Découvre les retours d\'expérience des chantiers terminés sur Ecobilda.',
    empty: 'Aucun retour d\'expérience public pour le moment.',
  },
};

// === English fallback (used as base for non-FR locales) ===
const en = {
  missions: {
    title: 'Missions',
    found: '{count} missions found',
    empty: 'No mission matches your criteria.',
    helpers: 'helpers',
    daysPerWeekSuffix: 'd/wk',
    types: {
      CHANTIER: 'Participatory worksite',
      FORMATION: 'Training',
    },
    difficulty: {
      DEBUTANT: 'Beginner',
      INTERMEDIAIRE: 'Intermediate',
      EXPERT: 'Expert',
    },
    status: {
      DRAFT: 'Draft',
      PUBLISHED: 'Published',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },
    poste: {
      fondations: 'Foundations',
      murs: 'Walls',
      toiture: 'Roofing',
      sol: 'Floor',
      isolation: 'Insulation',
      enduits: 'Plasters',
      menuiseries: 'Joinery',
      exterieur: 'Exterior',
      autre: 'Other',
    },
    technique: {
      pierre: 'Stone',
      beton: 'Concrete',
      pilotis: 'Stilts',
      pneu: 'Tires',
      paille_porteur: 'Load-bearing strawbale',
      paille_remplissage: 'Strawbale infill',
      ossature_bois: 'Timber frame',
      terre_crue: 'Cob',
      brique_terre: 'Earth brick',
      parpaing: 'Cinder block',
      toit_vegetal: 'Green roof',
      ardoise: 'Slate',
      tuile: 'Tiles',
      chaume: 'Thatch',
      bardeau_bois: 'Wood shingle',
      ondule: 'Corrugated metal',
      terre_battue: 'Rammed earth',
      beton_chanvre: 'Hempcrete',
      plancher_bois: 'Wood floor',
      dalle_chaux: 'Lime slab',
      dalle_argile: 'Clay slab',
      paille: 'Straw',
      laine_bois: 'Wood fiber',
      chanvre: 'Hemp',
      liege: 'Cork',
      ouate_cellulose: 'Cellulose',
      laine_mouton: 'Sheep wool',
      verre_expanse: 'Expanded glass',
      terre: 'Earth',
      chaux: 'Lime',
      chaux_chanvre: 'Lime/hemp',
      tadelakt: 'Tadelakt',
      platre: 'Plaster',
      bois_massif: 'Solid wood',
      recup: 'Reclaimed',
      double_vitrage: 'Double glazing',
      simple_vitrage: 'Single glazing',
      terrasse: 'Terrace',
      jardin_potager: 'Vegetable garden',
      mare: 'Pond',
      fosse: 'Pit',
      recuperation_eau: 'Water harvesting',
      autre: 'Other',
    },
    filters: {
      title: 'Filters',
      keywordPlaceholder: 'Search a mission…',
      type: 'Type',
      difficulty: 'Difficulty',
      poste: 'Work area',
      technique: 'Technique',
      pricingMode: 'Pricing',
      freeOnly: 'Free only',
      startsAfter: 'Starts after',
      endsBefore: 'Ends before',
      skills: 'Skills',
      languages: 'Languages',
    },
  },
  missionDetail: {
    notFound: 'Mission not found',
    backToMissions: 'Back to missions',
    about: 'About the mission',
    aboutPlace: 'The place',
    applyTitle: 'Join this mission',
    applyDesc: 'Send your motivation to the host. A conversation will open.',
    applyCta: 'Apply',
    loginToApply: 'Log in to apply',
    notOpen: 'This mission is not open to applications.',
    youAreHost: 'You are the host of this mission.',
    viewHost: 'View host profile',
    otherMissionsHere: 'Other missions at this place',
  },
  createMission: {
    title: 'Create a mission',
    subtitle: 'Describe the mission you offer: participatory worksite or training.',
    submitDraft: 'Save as draft',
    publish: 'Publish mission',
    unpublish: 'Move back to draft',
    successTitle: 'Mission created',
    successMessage: 'You can now add photos, then publish the mission.',
    errorMessage: 'Could not create the mission. Try again.',
    editTitle: 'Edit mission',
    editSuccessTitle: 'Mission updated',
    editSuccessMessage: '',
    publishedTitle: 'Mission published',
    publishedMessage: 'The mission is now visible to helpers.',
    cancelMissionTitle: 'Cancel the mission?',
    cancelMissionText: 'Accepted helpers will be notified. This can be undone.',
    cancelMissionConfirm: 'Cancel mission',
    noPlaceTitle: 'You do not have a place yet',
    noPlaceMessage: 'To create a mission, first create your place.',
    createPlaceCta: 'Create my place',
    placePendingTitle: 'Place pending validation',
    placePendingMessage: 'Your place must be validated by an admin before you can publish missions.',
    fields: {
      place: 'Place',
      placePlaceholder: 'Select a place',
      type: 'Mission type',
      title: 'Title',
      titlePlaceholder: 'Ex: Load-bearing strawbale wall raising',
      description: 'Description',
      descriptionPlaceholder: 'Describe what will be done, the context, what helpers will learn…',
      difficulty: 'Difficulty',
      poste: 'Work area',
      technique: 'Technique',
      workSection: 'Work details',
      pricingSection: 'Pricing',
      isPaid: 'Paid training',
      price: 'Price per participant',
      scheduleSection: 'Schedule',
      startDate: 'Start date',
      endDate: 'End date',
      maxParticipants: 'Max participants',
      hoursPerDay: 'Hours per day',
      daysPerWeek: 'Days per week',
      skillsSection: 'Skills',
    },
    validation: {
      projectRequired: 'Choose a place',
      titleMin: 'Title must be at least 5 characters',
      descriptionMin: 'Description must be at least 30 characters',
      startDateRequired: 'Start date required',
      endDateRequired: 'End date required',
      endAfterStart: 'End date must be after start date',
      priceRequired: 'Price must be > 0',
    },
  },
  myMissions: {
    title: 'My missions',
    subtitle: 'Manage the missions you offer.',
    createNew: 'New mission',
    empty: 'You have no mission yet. Create one to meet helpers.',
    drafts: 'Drafts',
    published: 'Published / in progress',
    completed: 'Completed',
    deleteConfirmTitle: 'Delete the mission?',
    deleteConfirmText: 'This will permanently delete the mission "{title}".',
    tabs: {
      missions: 'Missions',
    },
  },
  myPlaces: {
    createNew: 'Add a place',
    empty: 'You have no place yet.',
    addMission: 'Add a mission',
    missionsCount: '{count} missions',
    deleteConfirmTitle: 'Delete this place?',
    deleteConfirmText: 'The place "{title}" will be deleted. You must delete all its missions first.',
    tabs: {
      places: 'My places',
    },
  },
  createPlace: {
    title: 'Create my place',
    subtitle: 'Describe where you welcome helpers: address, accommodation, food, amenities.',
    editTitle: 'Edit my place',
    submit: 'Create place',
    successTitle: 'Place created',
    successMessage: 'Your place is pending validation. You will be able to create missions once approved.',
    editSuccessTitle: 'Place updated',
    editSuccessMessage: '',
    notFound: 'Place not found',
    fields: {
      title: 'Place name',
      titlePlaceholder: 'Ex: Le Domaine des Sources',
      address: 'Address',
      addressPlaceholder: 'City, postal code…',
      hostingSection: 'Hosting and food',
      accommodation: 'Accommodation',
      accommodationPlaceholder: 'Describe where helpers sleep (room, yurt, camping…)',
      food: 'Food',
      foodPlaceholder: 'Describe what is included (3 meals/day, lunch only, shared kitchen…)',
      amenitiesSection: 'Amenities',
      wifi: 'WiFi',
      familyFriendly: 'Families welcome',
      petsAllowed: 'Pets allowed',
      smokingAllowed: 'Smokers allowed',
      languagesSection: 'Languages spoken',
    },
    validation: {
      titleMin: 'Name must be at least 3 characters',
      cityRequired: 'Address required',
    },
  },
  missionFeedback: {
    form: {
      title: 'Mission feedback',
      subtitle: 'Share your feedback for "{title}". This data will help other project owners.',
      submit: 'Publish feedback',
      successTitle: 'Feedback published',
      successMessage: 'Thanks for sharing.',
      tooLong: 'Too long (max 500 characters)',
      numericSection: 'Numerical data',
      narrativeSection: 'Story',
      photosSection: 'Photos',
      totalCost: 'Total cost',
      surface: 'Surface',
      result: 'Result',
      difficulties: 'Difficulties encountered',
      learnings: 'What you learned',
      addPhoto: 'Add a photo',
      isPublic: 'Make this feedback public',
      isPublicHelp: 'If enabled, this feedback will be visible on the "Learn from others" page.',
    },
    display: {
      title: 'Mission feedback',
      totalCost: 'Total cost',
      surface: 'Surface',
      duration: 'Duration',
      difficulties: 'Difficulties',
      learnings: 'Learnings',
      helperPhotos: 'Helper photos',
    },
    result: {
      SUCCESS: 'Success',
      PARTIAL_SUCCESS: 'Partial success',
      FAILURE: 'Failure',
    },
  },
  learn: {
    title: 'Learn from others',
    subtitle: 'Discover real feedback from completed worksites on Ecobilda.',
    empty: 'No public feedback yet.',
  },
};

// Common keys to ensure exist
const common = {
  any: 'Any',
  reset: 'Reset',
  back: 'Back',
  saved: 'Saved',
  deleted: 'Deleted',
  rejected: 'Rejected',
  loading: 'Loading…',
};
const commonFr = {
  any: 'Tout',
  reset: 'Réinitialiser',
  back: 'Retour',
  saved: 'Enregistré',
  deleted: 'Supprimé',
  rejected: 'Rejeté',
  loading: 'Chargement…',
};

// favorites.browseMissions key
const favoritesPatch = {
  fr: { browseMissions: 'Parcourir les missions' },
  default: { browseMissions: 'Browse missions' },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      // Only set if missing (don't overwrite existing translations)
      if (target[key] === undefined) target[key] = source[key];
    }
  }
}

function process(locale) {
  const file = path.join(localesDir, locale, 'translation.json');
  if (!fs.existsSync(file)) {
    console.warn(`[skip] ${file} not found`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const source = locale === 'fr' ? fr : en;

  deepMerge(data, source);

  // Common
  if (!data.common) data.common = {};
  deepMerge(data.common, locale === 'fr' ? commonFr : common);

  // favorites.browseMissions
  if (!data.favorites) data.favorites = {};
  const fav = locale === 'fr' ? favoritesPatch.fr : favoritesPatch.default;
  if (data.favorites.browseMissions === undefined) {
    data.favorites.browseMissions = fav.browseMissions;
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`[ok] updated ${locale}`);
}

for (const locale of LOCALES) process(locale);
console.log('Done.');
