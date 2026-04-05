import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingSkills = await ctx.db.query("skills").first();
    if (existingSkills) {
      return { status: "already seeded" };
    }

    // ============================================
    // 1. Countries
    // ============================================
    const countriesData = [
      { code: "FR", name: "France" },
      { code: "BE", name: "Belgium" },
      { code: "CH", name: "Switzerland" },
      { code: "DE", name: "Germany" },
      { code: "ES", name: "Spain" },
      { code: "PT", name: "Portugal" },
      { code: "IT", name: "Italy" },
      { code: "NL", name: "Netherlands" },
      { code: "GB", name: "United Kingdom" },
      { code: "IE", name: "Ireland" },
      { code: "AT", name: "Austria" },
      { code: "LU", name: "Luxembourg" },
      { code: "GR", name: "Greece" },
      { code: "HR", name: "Croatia" },
      { code: "RO", name: "Romania" },
      { code: "BG", name: "Bulgaria" },
      { code: "PL", name: "Poland" },
      { code: "CZ", name: "Czech Republic" },
      { code: "SE", name: "Sweden" },
      { code: "DK", name: "Denmark" },
      { code: "NO", name: "Norway" },
      { code: "FI", name: "Finland" },
      { code: "MA", name: "Morocco" },
      { code: "TN", name: "Tunisia" },
      { code: "CA", name: "Canada" },
      { code: "US", name: "United States" },
    ];
    const countryIds: Record<string, any> = {};
    for (const c of countriesData) {
      countryIds[c.code] = await ctx.db.insert("countries", c);
    }

    // ============================================
    // 2. Languages
    // ============================================
    const languagesData = [
      { code: "en", name: "English" },
      { code: "fr", name: "Français" },
      { code: "es", name: "Español" },
      { code: "de", name: "Deutsch" },
      { code: "nl", name: "Nederlands" },
      { code: "pt", name: "Português" },
      { code: "it", name: "Italiano" },
    ];
    const langIds: Record<string, any> = {};
    for (const l of languagesData) {
      langIds[l.code] = await ctx.db.insert("languages", l);
    }

    // ============================================
    // 3. Skills (16 fixed)
    // ============================================
    const skillsData = [
      { code: "garden_maintenance", category: "PERM", displayNameEn: "Garden maintenance", displayNameFr: "Entretien jardin", displayNameEs: "Mantenimiento de jardín", displayNameDe: "Gartenpflege", displayNameNl: "Tuinonderhoud", displayNamePt: "Manutenção de jardim", icon: "garden_maintenance" },
      { code: "grafting", category: "PERM", displayNameEn: "Grafting", displayNameFr: "Greffage", displayNameEs: "Injerto", displayNameDe: "Pfropfen", displayNameNl: "Enten", displayNamePt: "Enxertia", icon: "grafting" },
      { code: "pruning", category: "PERM", displayNameEn: "Pruning", displayNameFr: "Taille", displayNameEs: "Poda", displayNameDe: "Beschneiden", displayNameNl: "Snoeien", displayNamePt: "Poda", icon: "pruning" },
      { code: "harvesting", category: "PERM", displayNameEn: "Harvesting", displayNameFr: "Récolte", displayNameEs: "Cosecha", displayNameDe: "Ernte", displayNameNl: "Oogsten", displayNamePt: "Colheita", icon: "harvesting" },
      { code: "composting", category: "PERM", displayNameEn: "Composting", displayNameFr: "Compostage", displayNameEs: "Compostaje", displayNameDe: "Kompostierung", displayNameNl: "Composteren", displayNamePt: "Compostagem", icon: "composting" },
      { code: "weeding", category: "PERM", displayNameEn: "Weeding", displayNameFr: "Désherbage", displayNameEs: "Deshierbe", displayNameDe: "Jäten", displayNameNl: "Wieden", displayNamePt: "Capina", icon: "weeding" },
      { code: "propagating", category: "PERM", displayNameEn: "Propagating", displayNameFr: "Multiplication", displayNameEs: "Propagación", displayNameDe: "Vermehrung", displayNameNl: "Vermeerderen", displayNamePt: "Propagação", icon: "propagating" },
      { code: "seeds_harvesting", category: "PERM", displayNameEn: "Seeds harvesting", displayNameFr: "Récolte graines", displayNameEs: "Cosecha de semillas", displayNameDe: "Samenernte", displayNameNl: "Zaadoogst", displayNamePt: "Colheita de sementes", icon: "seeds_harvesting" },
      { code: "carpentry", category: "NATB", displayNameEn: "Carpentry", displayNameFr: "Charpenterie", displayNameEs: "Carpintería", displayNameDe: "Zimmerei", displayNameNl: "Timmerwerk", displayNamePt: "Carpintaria", icon: "carpentry" },
      { code: "masonry", category: "NATB", displayNameEn: "Masonry", displayNameFr: "Maçonnerie", displayNameEs: "Albañilería", displayNameDe: "Maurerarbeit", displayNameNl: "Metselwerk", displayNamePt: "Alvenaria", icon: "masonry" },
      { code: "strawbale_building", category: "NATB", displayNameEn: "Strawbale building", displayNameFr: "Construction paille", displayNameEs: "Construcción con paja", displayNameDe: "Strohballenbau", displayNameNl: "Strobouw", displayNamePt: "Construção com palha", icon: "strawbale_building" },
      { code: "cob_building", category: "NATB", displayNameEn: "Cob building", displayNameFr: "Construction torchis", displayNameEs: "Construcción de adobe", displayNameDe: "Lehmbau", displayNameNl: "Leembouw", displayNamePt: "Construção em taipa", icon: "cob_building" },
      { code: "earthen_plaster", category: "NATB", displayNameEn: "Earthen plaster", displayNameFr: "Enduit terre", displayNameEs: "Enlucido de tierra", displayNameDe: "Lehmputz", displayNameNl: "Leempleister", displayNamePt: "Reboco de terra", icon: "earthen_plaster" },
      { code: "lime_plaster", category: "NATB", displayNameEn: "Lime plaster", displayNameFr: "Enduit chaux", displayNameEs: "Enlucido de cal", displayNameDe: "Kalkputz", displayNameNl: "Kalkpleister", displayNamePt: "Reboco de cal", icon: "lime_plaster" },
      { code: "hempcrete", category: "NATB", displayNameEn: "Hempcrete", displayNameFr: "Béton chanvre", displayNameEs: "Hormigón de cáñamo", displayNameDe: "Hanfbeton", displayNameNl: "Hennepbeton", displayNamePt: "Betão de cânhamo", icon: "hempcrete" },
      { code: "tadelakt_plaster", category: "NATB", displayNameEn: "Tadelakt plaster", displayNameFr: "Tadelakt", displayNameEs: "Enlucido tadelakt", displayNameDe: "Tadelakt-Putz", displayNameNl: "Tadelakt", displayNamePt: "Tadelakt", icon: "tadelakt_plaster" },
    ];
    const skillIds: Record<string, any> = {};
    for (const s of skillsData) {
      skillIds[s.code] = await ctx.db.insert("skills", s);
    }

    // ============================================
    // 4. Addresses
    // ============================================
    const addr1 = await ctx.db.insert("addresses", {
      city: "Liège", street: "Rue de la Ferme", streetNumber: "12",
      postalCode: "4000", countryId: countryIds["BE"],
      latitude: 50.6292, longitude: 5.5734,
      formattedAddress: "Rue de la Ferme 12, 4000 Liège, Belgium",
    });
    const addr2 = await ctx.db.insert("addresses", {
      city: "Toulouse", street: "Chemin des Amandiers", streetNumber: "5",
      postalCode: "31000", countryId: countryIds["FR"],
      latitude: 43.6047, longitude: 1.4442,
      formattedAddress: "5 Chemin des Amandiers, 31000 Toulouse, France",
    });
    const addr3 = await ctx.db.insert("addresses", {
      city: "Barcelona", street: "Carrer de la Natura", streetNumber: "8",
      postalCode: "08001", countryId: countryIds["ES"],
      latitude: 41.3874, longitude: 2.1686,
      formattedAddress: "Carrer de la Natura 8, 08001 Barcelona, Spain",
    });
    const addr4 = await ctx.db.insert("addresses", {
      city: "Freiburg", street: "Waldstraße", streetNumber: "22",
      postalCode: "79098", countryId: countryIds["DE"],
      latitude: 47.999, longitude: 7.842,
      formattedAddress: "Waldstraße 22, 79098 Freiburg, Germany",
    });
    const addrUser1 = await ctx.db.insert("addresses", {
      city: "Namur", postalCode: "5000", countryId: countryIds["BE"],
      latitude: 50.4674, longitude: 4.8720,
      formattedAddress: "Namur, Belgium",
    });
    const addrUser2 = await ctx.db.insert("addresses", {
      city: "Lyon", postalCode: "69001", countryId: countryIds["FR"],
      latitude: 45.7640, longitude: 4.8357,
      formattedAddress: "Lyon, France",
    });

    // ============================================
    // 5. Users
    // ============================================
    const user1 = await ctx.db.insert("users", {
      email: "marie@example.com",
      firstName: "Marie",
      lastName: "Dupont",
      dateOfBirth: "1985-03-15",
      gender: "F",
      bio: "Passionnée de permaculture et d'éco-construction depuis 10 ans. J'ai construit ma maison en paille et terre.",
      addressId: addrUser1,
      languageIds: [langIds["fr"], langIds["en"]],
      skillIds: [skillIds["garden_maintenance"], skillIds["composting"], skillIds["strawbale_building"], skillIds["earthen_plaster"]],
      emailVerified: true,
      hasPassword: true,
      emailNotifications: true,
      newsletter: false,
      inAppNotifications: true,
      notificationLanguage: "fr",
      isProfileVisible: true,
      averageRating: 4.7,
      reviewCount: 3,
      isStaff: false,
      isSuperuser: false,
      isActive: true,
    });

    const user2 = await ctx.db.insert("users", {
      email: "jean@example.com",
      firstName: "Jean",
      lastName: "Martin",
      dateOfBirth: "1990-07-22",
      gender: "M",
      bio: "Charpentier de formation, je me suis tourné vers les techniques de construction naturelle. Toujours prêt à partager mes connaissances.",
      addressId: addrUser2,
      languageIds: [langIds["fr"], langIds["en"], langIds["es"]],
      skillIds: [skillIds["carpentry"], skillIds["masonry"], skillIds["lime_plaster"]],
      emailVerified: true,
      hasPassword: true,
      emailNotifications: true,
      newsletter: true,
      inAppNotifications: true,
      notificationLanguage: "fr",
      isProfileVisible: true,
      averageRating: 4.9,
      reviewCount: 5,
      isStaff: false,
      isSuperuser: false,
      isActive: true,
    });

    const user3 = await ctx.db.insert("users", {
      email: "admin@ecobilda.org",
      firstName: "Admin",
      lastName: "Ecobilda",
      gender: "O",
      bio: "Platform administrator",
      languageIds: [langIds["en"], langIds["fr"]],
      skillIds: [],
      emailVerified: true,
      hasPassword: true,
      emailNotifications: true,
      newsletter: false,
      inAppNotifications: true,
      notificationLanguage: "en",
      isProfileVisible: false,
      averageRating: 0,
      reviewCount: 0,
      isStaff: true,
      isSuperuser: true,
      isActive: true,
    });

    // ============================================
    // 6. Projects
    // ============================================
    const now = Date.now();

    const project1 = await ctx.db.insert("projects", {
      ownerId: user1,
      title: "Ferme en permaculture - Aide au potager et construction paille",
      description: "Nous cherchons des volontaires pour nous aider dans notre ferme en permaculture. Les tâches incluent l'entretien du potager, la récolte, le compostage et la construction d'un nouveau bâtiment en paille. Logement dans une yourte confortable avec vue sur la campagne wallonne.",
      projectType: "PERM",
      addressId: addr1,
      hoursPerDay: 5,
      daysPerWeek: 5,
      maxHelpers: 3,
      accommodationDetails: "Yourte privée avec électricité et chauffage. Douche et toilettes sèches partagées.",
      foodDetails: "Trois repas bio par jour, légumes du jardin. Régimes végétariens bienvenus.",
      internetProvided: true,
      familyFriendly: true,
      petsAllowed: false,
      smokingAllowed: false,
      skillIds: [skillIds["garden_maintenance"], skillIds["composting"], skillIds["harvesting"], skillIds["strawbale_building"]],
      isActive: true,
      flaggedCount: 0,
      status: "ACTIVE",
      validatedAt: now,
      validatedBy: user3,
      updatedAt: now,
    });

    const project2 = await ctx.db.insert("projects", {
      ownerId: user2,
      title: "Rénovation écologique - Enduits terre et chaux dans le Sud",
      description: "Projet de rénovation d'une vieille ferme avec des matériaux naturels. Nous appliquons des enduits terre et chaux sur les murs intérieurs. C'est une excellente occasion d'apprendre ces techniques ancestrales dans un cadre magnifique près de Toulouse.",
      projectType: "NATB",
      addressId: addr2,
      hoursPerDay: 6,
      daysPerWeek: 5,
      maxHelpers: 4,
      accommodationDetails: "Chambre partagée dans la ferme. Salle de bain avec eau chaude.",
      foodDetails: "Repas du midi fournis. Cuisine équipée disponible pour le petit-déjeuner et le dîner.",
      internetProvided: true,
      familyFriendly: false,
      petsAllowed: true,
      smokingAllowed: false,
      skillIds: [skillIds["earthen_plaster"], skillIds["lime_plaster"], skillIds["masonry"]],
      isActive: true,
      flaggedCount: 0,
      status: "ACTIVE",
      validatedAt: now,
      validatedBy: user3,
      updatedAt: now,
    });

    const project3 = await ctx.db.insert("projects", {
      ownerId: user1,
      title: "Jardin-forêt méditerranéen - Greffage et multiplication",
      description: "Création d'un jardin-forêt en climat méditerranéen. Nous cherchons des personnes intéressées par le greffage d'arbres fruitiers, la multiplication de plantes et la récolte de graines. Un projet passionnant pour les amoureux de la botanique.",
      projectType: "PERM",
      addressId: addr3,
      hoursPerDay: 4,
      daysPerWeek: 5,
      maxHelpers: 2,
      accommodationDetails: "Petite maison indépendante avec cuisine.",
      foodDetails: "Fruits et légumes du jardin à volonté. Budget repas partagé pour le reste.",
      internetProvided: false,
      familyFriendly: true,
      petsAllowed: true,
      smokingAllowed: false,
      skillIds: [skillIds["grafting"], skillIds["propagating"], skillIds["seeds_harvesting"], skillIds["garden_maintenance"]],
      isActive: true,
      flaggedCount: 0,
      status: "ACTIVE",
      validatedAt: now,
      validatedBy: user3,
      updatedAt: now,
    });

    const project4 = await ctx.db.insert("projects", {
      ownerId: user2,
      title: "Construction béton de chanvre - Maison passive en Forêt Noire",
      description: "Nous construisons une extension en béton de chanvre pour notre maison dans la Forêt Noire. C'est une technique isolante exceptionnelle. Venez apprendre le hempcrete et la charpenterie traditionnelle dans un cadre forestier magnifique.",
      projectType: "NATB",
      addressId: addr4,
      hoursPerDay: 7,
      daysPerWeek: 6,
      maxHelpers: 5,
      accommodationDetails: "Tente de glamping ou camping. Accès à la maison pour les douches.",
      foodDetails: "Tous les repas fournis, cuisine locale et bio.",
      internetProvided: true,
      familyFriendly: false,
      petsAllowed: false,
      smokingAllowed: false,
      skillIds: [skillIds["hempcrete"], skillIds["carpentry"], skillIds["lime_plaster"]],
      isActive: true,
      flaggedCount: 0,
      status: "ACTIVE",
      validatedAt: now,
      validatedBy: user3,
      updatedAt: now,
    });

    // ============================================
    // 7. Availabilities
    // ============================================
    await ctx.db.insert("availability", {
      projectId: project1, year: 2026,
      january: false, february: false, march: true, april: true,
      may: true, june: true, july: true, august: true,
      september: true, october: true, november: false, december: false,
    });
    await ctx.db.insert("availability", {
      projectId: project2, year: 2026,
      january: false, february: false, march: false, april: true,
      may: true, june: true, july: false, august: false,
      september: true, october: true, november: true, december: false,
    });
    await ctx.db.insert("availability", {
      projectId: project3, year: 2026,
      january: true, february: true, march: true, april: true,
      may: true, june: false, july: false, august: false,
      september: true, october: true, november: true, december: true,
    });
    await ctx.db.insert("availability", {
      projectId: project4, year: 2026,
      january: false, february: false, march: false, april: false,
      may: true, june: true, july: true, august: true,
      september: true, october: false, november: false, december: false,
    });

    return {
      status: "seeded",
      counts: {
        countries: countriesData.length,
        languages: languagesData.length,
        skills: skillsData.length,
        users: 3,
        projects: 4,
        availabilities: 4,
      },
    };
  },
});
