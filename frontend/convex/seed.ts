import { mutation } from "./_generated/server";

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "projectImages", "availability", "favorites", "messages",
      "conversations", "participationRequests", "reviews", "notifications",
      "reports", "savedSearches", "contactMessages", "sessions",
      "passwordResetTokens", "projects", "users", "addresses",
      "skills", "languages", "countries",
    ];
    let total = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        total++;
      }
    }
    return { status: "cleared", deletedDocuments: total };
  },
});

export const makeAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", "admin2@ecobilda.org"))
      .first();
    if (!user) return { error: "User not found" };
    await ctx.db.patch(user._id, {
      isStaff: true,
      isSuperuser: true,
      emailVerified: true,
    });
    return { status: "done", userId: user._id };
  },
});

export const seedLanguages = mutation({
  args: {},
  handler: async (ctx) => {
    const extraLanguages = [
      { code: "pl", name: "Polski" },
      { code: "ro", name: "Română" },
      { code: "cs", name: "Čeština" },
      { code: "hu", name: "Magyar" },
      { code: "sv", name: "Svenska" },
      { code: "da", name: "Dansk" },
      { code: "no", name: "Norsk" },
      { code: "fi", name: "Suomi" },
      { code: "el", name: "Ελληνικά" },
      { code: "bg", name: "Български" },
      { code: "hr", name: "Hrvatski" },
      { code: "sk", name: "Slovenčina" },
      { code: "sl", name: "Slovenščina" },
      { code: "et", name: "Eesti" },
      { code: "lv", name: "Latviešu" },
      { code: "lt", name: "Lietuvių" },
      { code: "ga", name: "Gaeilge" },
      { code: "mt", name: "Malti" },
      { code: "sq", name: "Shqip" },
      { code: "sr", name: "Српски" },
      { code: "bs", name: "Bosanski" },
      { code: "mk", name: "Македонски" },
      { code: "uk", name: "Українська" },
      { code: "ru", name: "Русский" },
      { code: "tr", name: "Türkçe" },
      { code: "ar", name: "العربية" },
      { code: "ja", name: "日本語" },
      { code: "zh", name: "中文" },
      { code: "ko", name: "한국어" },
      { code: "hi", name: "हिन्दी" },
      { code: "th", name: "ไทย" },
      { code: "vi", name: "Tiếng Việt" },
      { code: "id", name: "Bahasa Indonesia" },
      { code: "ms", name: "Bahasa Melayu" },
      { code: "sw", name: "Kiswahili" },
      { code: "he", name: "עברית" },
      { code: "fa", name: "فارسی" },
      { code: "ca", name: "Català" },
      { code: "gl", name: "Galego" },
      { code: "eu", name: "Euskara" },
    ];
    const existing = await ctx.db.query("languages").collect();
    const existingCodes = new Set(existing.map((l) => l.code));
    let added = 0;
    for (const lang of extraLanguages) {
      if (!existingCodes.has(lang.code)) {
        await ctx.db.insert("languages", lang);
        added++;
      }
    }
    return { status: "done", added };
  },
});

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
      { code: "pl", name: "Polski" },
      { code: "ro", name: "Română" },
      { code: "cs", name: "Čeština" },
      { code: "hu", name: "Magyar" },
      { code: "sv", name: "Svenska" },
      { code: "da", name: "Dansk" },
      { code: "no", name: "Norsk" },
      { code: "fi", name: "Suomi" },
      { code: "el", name: "Ελληνικά" },
      { code: "bg", name: "Български" },
      { code: "hr", name: "Hrvatski" },
      { code: "sk", name: "Slovenčina" },
      { code: "sl", name: "Slovenščina" },
      { code: "et", name: "Eesti" },
      { code: "lv", name: "Latviešu" },
      { code: "lt", name: "Lietuvių" },
      { code: "ga", name: "Gaeilge" },
      { code: "mt", name: "Malti" },
      { code: "sq", name: "Shqip" },
      { code: "sr", name: "Српски" },
      { code: "bs", name: "Bosanski" },
      { code: "mk", name: "Македонски" },
      { code: "uk", name: "Українська" },
      { code: "ru", name: "Русский" },
      { code: "tr", name: "Türkçe" },
      { code: "ar", name: "العربية" },
      { code: "ja", name: "日本語" },
      { code: "zh", name: "中文" },
      { code: "ko", name: "한국어" },
      { code: "hi", name: "हिन्दी" },
      { code: "th", name: "ไทย" },
      { code: "vi", name: "Tiếng Việt" },
      { code: "id", name: "Bahasa Indonesia" },
      { code: "ms", name: "Bahasa Melayu" },
      { code: "sw", name: "Kiswahili" },
      { code: "he", name: "עברית" },
      { code: "fa", name: "فارسی" },
      { code: "ca", name: "Català" },
      { code: "gl", name: "Galego" },
      { code: "eu", name: "Euskara" },
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
    // 6. Additional Addresses
    // ============================================
    const addr5 = await ctx.db.insert("addresses", {
      city: "Alentejo", street: "Estrada da Serra", streetNumber: "3",
      postalCode: "7100", countryId: countryIds["PT"],
      latitude: 38.5667, longitude: -7.9,
      formattedAddress: "Estrada da Serra 3, 7100 Alentejo, Portugal",
    });
    const addr6 = await ctx.db.insert("addresses", {
      city: "Cork", street: "Green Lane", streetNumber: "17",
      postalCode: "T12", countryId: countryIds["IE"],
      latitude: 51.8969, longitude: -8.4863,
      formattedAddress: "17 Green Lane, Cork, Ireland",
    });
    const addr7 = await ctx.db.insert("addresses", {
      city: "Groningen", street: "Moestuinweg", streetNumber: "4",
      postalCode: "9711", countryId: countryIds["NL"],
      latitude: 53.2194, longitude: 6.5665,
      formattedAddress: "Moestuinweg 4, 9711 Groningen, Netherlands",
    });
    const addr8 = await ctx.db.insert("addresses", {
      city: "Dordogne", street: "Lieu-dit Les Chênes",
      postalCode: "24200", countryId: countryIds["FR"],
      latitude: 44.8604, longitude: 1.2516,
      formattedAddress: "Lieu-dit Les Chênes, 24200 Dordogne, France",
    });

    // ============================================
    // 7. Projects (8 total)
    // ============================================
    const now = Date.now();

    const project1 = await ctx.db.insert("projects", {
      ownerId: user1, title: "Ferme en permaculture - Aide au potager et construction paille",
      description: "Nous cherchons des volontaires pour nous aider dans notre ferme en permaculture. Les tâches incluent l'entretien du potager, la récolte, le compostage et la construction d'un nouveau bâtiment en paille. Logement dans une yourte confortable avec vue sur la campagne wallonne.",
      projectType: "PERM", addressId: addr1, hoursPerDay: 5, daysPerWeek: 5, maxHelpers: 3,
      accommodationDetails: "Yourte privée avec électricité et chauffage. Douche et toilettes sèches partagées.",
      foodDetails: "Trois repas bio par jour, légumes du jardin. Régimes végétariens bienvenus.",
      internetProvided: true, familyFriendly: true, petsAllowed: false, smokingAllowed: false,
      skillIds: [skillIds["garden_maintenance"], skillIds["composting"], skillIds["harvesting"], skillIds["strawbale_building"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project2 = await ctx.db.insert("projects", {
      ownerId: user2, title: "Rénovation écologique - Enduits terre et chaux dans le Sud",
      description: "Projet de rénovation d'une vieille ferme avec des matériaux naturels. Nous appliquons des enduits terre et chaux sur les murs intérieurs. C'est une excellente occasion d'apprendre ces techniques ancestrales dans un cadre magnifique près de Toulouse.",
      projectType: "NATB", addressId: addr2, hoursPerDay: 6, daysPerWeek: 5, maxHelpers: 4,
      accommodationDetails: "Chambre partagée dans la ferme. Salle de bain avec eau chaude.",
      foodDetails: "Repas du midi fournis. Cuisine équipée disponible pour le petit-déjeuner et le dîner.",
      internetProvided: true, familyFriendly: false, petsAllowed: true, smokingAllowed: false,
      skillIds: [skillIds["earthen_plaster"], skillIds["lime_plaster"], skillIds["masonry"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project3 = await ctx.db.insert("projects", {
      ownerId: user1, title: "Jardin-forêt méditerranéen - Greffage et multiplication",
      description: "Création d'un jardin-forêt en climat méditerranéen. Nous cherchons des personnes intéressées par le greffage d'arbres fruitiers, la multiplication de plantes et la récolte de graines. Un projet passionnant pour les amoureux de la botanique.",
      projectType: "PERM", addressId: addr3, hoursPerDay: 4, daysPerWeek: 5, maxHelpers: 2,
      accommodationDetails: "Petite maison indépendante avec cuisine.",
      foodDetails: "Fruits et légumes du jardin à volonté. Budget repas partagé pour le reste.",
      internetProvided: false, familyFriendly: true, petsAllowed: true, smokingAllowed: false,
      skillIds: [skillIds["grafting"], skillIds["propagating"], skillIds["seeds_harvesting"], skillIds["garden_maintenance"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project4 = await ctx.db.insert("projects", {
      ownerId: user2, title: "Construction béton de chanvre - Maison passive en Forêt Noire",
      description: "Nous construisons une extension en béton de chanvre pour notre maison dans la Forêt Noire. C'est une technique isolante exceptionnelle. Venez apprendre le hempcrete et la charpenterie traditionnelle dans un cadre forestier magnifique.",
      projectType: "NATB", addressId: addr4, hoursPerDay: 7, daysPerWeek: 6, maxHelpers: 5,
      accommodationDetails: "Tente de glamping ou camping. Accès à la maison pour les douches.",
      foodDetails: "Tous les repas fournis, cuisine locale et bio.",
      internetProvided: true, familyFriendly: false, petsAllowed: false, smokingAllowed: false,
      skillIds: [skillIds["hempcrete"], skillIds["carpentry"], skillIds["lime_plaster"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project5 = await ctx.db.insert("projects", {
      ownerId: user1, title: "Éco-village en Alentejo - Permaculture et construction terre",
      description: "Rejoignez notre éco-village dans la magnifique région de l'Alentejo au Portugal. Nous développons un système de permaculture intégrale avec potager, verger et animaux. Parallèlement, nous construisons des structures en terre crue (cob). Une expérience immersive dans un cadre solaire et paisible.",
      projectType: "PERM", addressId: addr5, hoursPerDay: 5, daysPerWeek: 5, maxHelpers: 6,
      accommodationDetails: "Caravane aménagée ou tente fournie. Cuisine et sanitaires communs.",
      foodDetails: "Repas végétariens partagés, produits du potager et du marché local.",
      internetProvided: false, familyFriendly: true, petsAllowed: true, smokingAllowed: false,
      skillIds: [skillIds["garden_maintenance"], skillIds["composting"], skillIds["weeding"], skillIds["cob_building"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project6 = await ctx.db.insert("projects", {
      ownerId: user2, title: "Strawbale workshop - Learn natural building in Ireland",
      description: "We are building a strawbale studio on our smallholding in West Cork. This is a hands-on workshop where you will learn every step of strawbale construction: timber framing, bale raising, compression, and lime rendering. Beautiful Irish countryside, green and lush.",
      projectType: "NATB", addressId: addr6, hoursPerDay: 6, daysPerWeek: 5, maxHelpers: 4,
      accommodationDetails: "Shared cottage with wood stove. Hot showers available.",
      foodDetails: "All meals provided. We cook together using local and organic produce.",
      internetProvided: true, familyFriendly: false, petsAllowed: false, smokingAllowed: false,
      skillIds: [skillIds["strawbale_building"], skillIds["carpentry"], skillIds["lime_plaster"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project7 = await ctx.db.insert("projects", {
      ownerId: user1, title: "Biologische moestuin - Composteren en zaadoogst in Groningen",
      description: "Op onze biologische boerderij in Groningen zoeken we enthousiaste vrijwilligers voor het onderhouden van onze grote moestuin. Je leert over composteren, vermeerderen van planten, zaadoogst en biologische tuiniertechnieken. Een perfecte ervaring voor wie meer wil leren over duurzame landbouw.",
      projectType: "PERM", addressId: addr7, hoursPerDay: 4, daysPerWeek: 5, maxHelpers: 3,
      accommodationDetails: "Eigen kamer in de boerderij. Gedeelde badkamer.",
      foodDetails: "Ontbijt en lunch inbegrepen. Groenten uit eigen tuin.",
      internetProvided: true, familyFriendly: true, petsAllowed: true, smokingAllowed: false,
      skillIds: [skillIds["composting"], skillIds["seeds_harvesting"], skillIds["propagating"], skillIds["weeding"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });
    const project8 = await ctx.db.insert("projects", {
      ownerId: user2, title: "Restauration en Dordogne - Tadelakt et enduits naturels",
      description: "Restauration d'une maison en pierre du XVIIIe siècle en Dordogne. Nous utilisons exclusivement des enduits naturels : tadelakt pour les salles d'eau, enduit terre pour les pièces de vie, enduit chaux pour les façades. Apprenez ces techniques rares dans un cadre historique exceptionnel du Périgord.",
      projectType: "NATB", addressId: addr8, hoursPerDay: 6, daysPerWeek: 5, maxHelpers: 3,
      accommodationDetails: "Gîte indépendant sur la propriété. Tout confort.",
      foodDetails: "Tous les repas fournis. Cuisine du terroir, produits locaux.",
      internetProvided: true, familyFriendly: false, petsAllowed: false, smokingAllowed: false,
      skillIds: [skillIds["tadelakt_plaster"], skillIds["earthen_plaster"], skillIds["lime_plaster"], skillIds["masonry"]],
      isActive: true, flaggedCount: 0, status: "ACTIVE", validatedAt: now, validatedBy: user3, updatedAt: now,
    });

    // ============================================
    // 8. Project Images (from /public/projects/)
    // ============================================
    const imageMap: Record<string, string> = {
      [project1]: "1", [project2]: "2", [project3]: "3", [project4]: "10",
      [project5]: "11", [project6]: "20", [project7]: "21", [project8]: "22",
    };
    for (const [projectId, folder] of Object.entries(imageMap)) {
      for (let i = 1; i <= 5; i++) {
        await ctx.db.insert("projectImages", {
          projectId: projectId as any,
          url: `/projects/${folder}/image_${i}.png`,
          order: i - 1,
        });
      }
    }

    // ============================================
    // 9. Availabilities
    // ============================================
    const availData = [
      { id: project1, jan: false, feb: false, mar: true, apr: true, may: true, jun: true, jul: true, aug: true, sep: true, oct: true, nov: false, dec: false },
      { id: project2, jan: false, feb: false, mar: false, apr: true, may: true, jun: true, jul: false, aug: false, sep: true, oct: true, nov: true, dec: false },
      { id: project3, jan: true, feb: true, mar: true, apr: true, may: true, jun: false, jul: false, aug: false, sep: true, oct: true, nov: true, dec: true },
      { id: project4, jan: false, feb: false, mar: false, apr: false, may: true, jun: true, jul: true, aug: true, sep: true, oct: false, nov: false, dec: false },
      { id: project5, jan: true, feb: true, mar: true, apr: true, may: true, jun: true, jul: true, aug: true, sep: true, oct: true, nov: true, dec: true },
      { id: project6, jan: false, feb: false, mar: false, apr: true, may: true, jun: true, jul: true, aug: true, sep: true, oct: false, nov: false, dec: false },
      { id: project7, jan: false, feb: false, mar: true, apr: true, may: true, jun: true, jul: true, aug: true, sep: true, oct: true, nov: false, dec: false },
      { id: project8, jan: false, feb: false, mar: false, apr: true, may: true, jun: true, jul: true, aug: false, sep: true, oct: true, nov: true, dec: false },
    ];
    for (const a of availData) {
      await ctx.db.insert("availability", {
        projectId: a.id, year: 2026,
        january: a.jan, february: a.feb, march: a.mar, april: a.apr,
        may: a.may, june: a.jun, july: a.jul, august: a.aug,
        september: a.sep, october: a.oct, november: a.nov, december: a.dec,
      });
    }

    return {
      status: "seeded",
      counts: {
        countries: countriesData.length,
        languages: languagesData.length,
        skills: skillsData.length,
        users: 3,
        projects: 8,
        images: 40,
        availabilities: 8,
      },
    };
  },
});

// One-time fix: replace local seed image URLs with Unsplash URLs
export const fixSeedImages = mutation({
  args: {},
  handler: async (ctx) => {
    const unsplashImages: Record<string, string[]> = {
      "1": [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800",
        "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=800",
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800",
        "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800",
      ],
      "2": [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=800",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
        "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800",
      ],
      "3": [
        "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800",
        "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800",
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
        "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
      ],
      "10": [
        "https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      ],
      "11": [
        "https://images.unsplash.com/photo-1595514535215-95a8e2570760?w=800",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
        "https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=800",
      ],
      "20": [
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800",
        "https://images.unsplash.com/photo-1597348989645-e2098f9b0eda?w=800",
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      ],
      "21": [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        "https://images.unsplash.com/photo-1600566753086-00f18e6b0556?w=800",
        "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800",
        "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800",
        "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
      ],
      "22": [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800",
        "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
      ],
    };

    let updated = 0;
    const allImages = await ctx.db.query("projectImages").collect();
    for (const img of allImages) {
      if (img.url && img.url.startsWith("/projects/")) {
        const match = img.url.match(/^\/projects\/(\d+)\/image_(\d+)\.png$/);
        if (match) {
          const folder = match[1];
          const idx = parseInt(match[2]) - 1;
          const newUrl = unsplashImages[folder]?.[idx];
          if (newUrl) {
            await ctx.db.patch(img._id, { url: newUrl });
            updated++;
          }
        }
      }
    }
    return { updated };
  },
});
