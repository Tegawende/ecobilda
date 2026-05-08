import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      // Mission-related (delete first because of FKs)
      "helperMissionPhotos",
      "missionFeedback",
      "missionImages",
      "missions",
      // Project-related
      "projectImages",
      "favorites",
      "messages",
      "conversations",
      "participationRequests",
      "reviews",
      "notifications",
      "reports",
      "savedSearches",
      "contactMessages",
      "sessions",
      "passwordResetTokens",
      "typingIndicators",
      "projects",
      "users",
      "addresses",
      "skills",
      "languages",
      "countries",
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

// Set password for admin@ecobilda.org (uses same PBKDF2 hash as auth.ts)
export const setAdminPassword = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(new Uint8Array(salt.buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(args.password), "PBKDF2", false, ["deriveBits"]);
    const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
    const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
    const hash = `pbkdf2$100000$${saltHex}$${hashHex}`;
    await ctx.runMutation(internal.seed._setPasswordHash, { email: "admin@ecobilda.org", hash });
    return { status: "done" };
  },
});

export const _setPasswordHash = internalMutation({
  args: { email: v.string(), hash: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", args.email)).first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { legacyPasswordHash: args.hash, hasPassword: true });
  },
});

// Create-or-update an admin account with a hashed password.
// Usage: npx convex run 'seed:setupAdminAccount' '{"email":"admin2@ecobilda.org","password":"Admin123!"}'
export const setupAdminAccount = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ status: string; email: string }> => {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(new Uint8Array(salt.buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(args.password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const hashHex = Array.from(new Uint8Array(derived))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const hash = `pbkdf2$100000$${saltHex}$${hashHex}`;
    await ctx.runMutation(internal.seed._upsertAdminUser, {
      email: args.email,
      hash,
      firstName: args.firstName ?? "Admin",
      lastName: args.lastName ?? "User",
    });
    return { status: "done", email: args.email };
  },
});

export const _upsertAdminUser = internalMutation({
  args: { email: v.string(), hash: v.string(), firstName: v.string(), lastName: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        legacyPasswordHash: args.hash,
        hasPassword: true,
        isStaff: true,
        isSuperuser: true,
        emailVerified: true,
        isActive: true,
      });
      return { action: "updated" as const, userId: existing._id };
    }
    const userId = await ctx.db.insert("users", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      legacyPasswordHash: args.hash,
      emailVerified: true,
      hasPassword: true,
      emailNotifications: false,
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
    return { action: "created" as const, userId };
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

// ============================================
// seedAll — reference data + 3 test users.
// Projects and missions are repopulated manually via the UI.
// ============================================

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSkills = await ctx.db.query("skills").first();
    if (existingSkills) {
      return { status: "already seeded" };
    }

    // ---- 1. Countries ----
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

    // ---- 2. Languages ----
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

    // ---- 3. Skills (16 fixed) ----
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
    for (const s of skillsData) {
      await ctx.db.insert("skills", s);
    }

    // ---- 4. Test users (admin + 2 demo accounts) ----
    const adminAddr = await ctx.db.insert("addresses", {
      city: "Brussels", postalCode: "1000", countryId: countryIds["BE"],
      latitude: 50.8503, longitude: 4.3517,
      formattedAddress: "Brussels, Belgium",
    });

    await ctx.db.insert("users", {
      email: "admin@ecobilda.org",
      firstName: "Admin",
      lastName: "Ecobilda",
      gender: "O",
      bio: "Platform administrator",
      addressId: adminAddr,
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

    return {
      status: "seeded",
      counts: {
        countries: countriesData.length,
        languages: languagesData.length,
        skills: skillsData.length,
        users: 1,
      },
    };
  },
});

// Extra languages — kept as utility for incremental enrichment
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

// ============================================
// seedSampleMissions — creates 2 hosts + 2 places + 4 demo missions
// (1 PUBLISHED CHANTIER, 1 PUBLISHED FORMATION, 2 COMPLETED with public feedback)
// Re-runnable: skips if any mission already exists.
// ============================================

export const seedSampleMissions = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("missions").first();
    if (existing) return { status: "missions already exist, skipped" };

    const skills = await ctx.db.query("skills").collect();
    const langs = await ctx.db.query("languages").collect();
    const countries = await ctx.db.query("countries").collect();
    const skillByCode = (code: string) => skills.find((s) => s.code === code)?._id;
    const langByCode = (code: string) => langs.find((l) => l.code === code)?._id;
    const countryByCode = (code: string) => countries.find((c) => c.code === code)?._id;

    // Helper hosts (Marie + Jean). Created without password — admin patches them later if needed.
    const findOrCreateUser = async (
      email: string,
      firstName: string,
      lastName: string,
      bio: string,
      langCodes: string[]
    ): Promise<any> => {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (existing) return existing._id;
      return await ctx.db.insert("users", {
        email,
        firstName,
        lastName,
        bio,
        languageIds: langCodes.map(langByCode).filter(Boolean) as any,
        skillIds: [],
        emailVerified: true,
        hasPassword: false,
        emailNotifications: true,
        newsletter: false,
        inAppNotifications: true,
        notificationLanguage: "fr",
        isProfileVisible: true,
        averageRating: 0,
        reviewCount: 0,
        isStaff: false,
        isSuperuser: false,
        isActive: true,
      });
    };

    const marieId = await findOrCreateUser(
      "marie@ecobilda.demo",
      "Marie",
      "Dupont",
      "Passionnée de permaculture et d'éco-construction depuis 10 ans. J'ai construit ma maison en paille et terre.",
      ["fr", "en"]
    );
    const jeanId = await findOrCreateUser(
      "jean@ecobilda.demo",
      "Jean",
      "Martin",
      "Charpentier de formation, je me suis tourné vers les techniques de construction naturelle.",
      ["fr", "en", "es"]
    );

    // Addresses
    const addr1 = await ctx.db.insert("addresses", {
      city: "Namur",
      postalCode: "5000",
      countryId: countryByCode("BE"),
      latitude: 50.4674,
      longitude: 4.8720,
      formattedAddress: "Namur, Belgium",
    });
    const addr2 = await ctx.db.insert("addresses", {
      city: "Toulouse",
      postalCode: "31000",
      countryId: countryByCode("FR"),
      latitude: 43.6047,
      longitude: 1.4442,
      formattedAddress: "Toulouse, France",
    });

    // Place 1 — Marie (Namur)
    const place1 = await ctx.db.insert("projects", {
      ownerId: marieId,
      title: "Le Domaine des Sources",
      addressId: addr1,
      accommodationDetails: "Yourte privée avec électricité et chauffage. Douche et toilettes sèches partagées.",
      foodDetails: "Trois repas bio par jour, légumes du jardin. Régimes végétariens bienvenus.",
      internetProvided: true,
      familyFriendly: true,
      petsAllowed: false,
      smokingAllowed: false,
      languageIds: [langByCode("fr"), langByCode("en")].filter(Boolean) as any,
      isActive: true,
      flaggedCount: 0,
      status: "ACTIVE",
      validatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Place 2 — Jean (Toulouse)
    const place2 = await ctx.db.insert("projects", {
      ownerId: jeanId,
      title: "Ferme rénovée du Sud",
      addressId: addr2,
      accommodationDetails: "Chambre partagée dans la ferme. Salle de bain avec eau chaude.",
      foodDetails: "Repas du midi fournis. Cuisine équipée disponible.",
      internetProvided: true,
      familyFriendly: false,
      petsAllowed: true,
      smokingAllowed: false,
      languageIds: [langByCode("fr"), langByCode("en"), langByCode("es")].filter(Boolean) as any,
      isActive: true,
      flaggedCount: 0,
      status: "ACTIVE",
      validatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Helper to format ISO date
    const iso = (d: Date) => d.toISOString().split("T")[0];

    // Mission 1 — PUBLISHED, CHANTIER, Marie, mur paille (in 2 weeks)
    const m1Start = new Date(now + 14 * dayMs);
    const m1End = new Date(now + 19 * dayMs);
    await ctx.db.insert("missions", {
      projectId: place1,
      ownerId: marieId,
      type: "CHANTIER",
      title: "Pose d'un mur en paille porteur",
      description: "Sur 5 jours, on monte ensemble un mur ouest en paille porteuse. Tu apprendras à compresser, ajuster et préparer la structure pour l'enduit. Niveau débutant accepté.",
      poste: "murs",
      technique: "paille_porteur",
      difficulty: "DEBUTANT",
      pricingMode: "FREE",
      startDate: iso(m1Start),
      endDate: iso(m1End),
      maxParticipants: 4,
      hoursPerDay: 6,
      daysPerWeek: 5,
      skillIds: [skillByCode("strawbale_building"), skillByCode("carpentry")].filter(Boolean) as any,
      status: "PUBLISHED",
      updatedAt: now,
    });

    // Mission 2 — PUBLISHED, FORMATION PAYANTE, Jean, enduit terre (in 1 month)
    const m2Start = new Date(now + 30 * dayMs);
    const m2End = new Date(now + 33 * dayMs);
    await ctx.db.insert("missions", {
      projectId: place2,
      ownerId: jeanId,
      type: "FORMATION",
      title: "Formation enduit terre intérieur — 3 jours intensifs",
      description: "Formation complète sur l'enduit terre : préparation du support, dosage du mélange (terre + sable + paille hachée), application en 2 couches, finition. Repas inclus.",
      poste: "enduits",
      technique: "terre",
      difficulty: "INTERMEDIAIRE",
      pricingMode: "PAID",
      priceEUR: 250,
      startDate: iso(m2Start),
      endDate: iso(m2End),
      maxParticipants: 6,
      hoursPerDay: 7,
      daysPerWeek: 5,
      skillIds: [skillByCode("earthen_plaster"), skillByCode("masonry")].filter(Boolean) as any,
      status: "PUBLISHED",
      updatedAt: now,
    });

    // Mission 3 — COMPLETED + public feedback — Marie, fondations (3 months ago)
    const m3Start = new Date(now - 90 * dayMs);
    const m3End = new Date(now - 80 * dayMs);
    const m3Id = await ctx.db.insert("missions", {
      projectId: place1,
      ownerId: marieId,
      type: "CHANTIER",
      title: "Fondations drainantes — hérisson ventilé",
      description: "On a construit les fondations en pierre sèche + hérisson ventilé pour une nouvelle annexe. Apprentissage du nivellement et des écoulements.",
      poste: "fondations",
      technique: "pierre",
      difficulty: "DEBUTANT",
      pricingMode: "FREE",
      startDate: iso(m3Start),
      endDate: iso(m3End),
      maxParticipants: 3,
      hoursPerDay: 6,
      daysPerWeek: 5,
      skillIds: [skillByCode("masonry")].filter(Boolean) as any,
      status: "COMPLETED",
      feedbackNotifiedAt: now - 75 * dayMs,
      feedbackDeadlineAt: now - 68 * dayMs,
      updatedAt: now,
    });
    await ctx.db.insert("missionFeedback", {
      missionId: m3Id,
      totalCostEUR: 850,
      surfaceM2: 12,
      actualDurationDays: 11,
      result: "SUCCESS",
      difficultiesText:
        "Le drainage en zone argileuse a demandé plus de pierres que prévu. Bien anticiper les volumes.",
      learningsText:
        "Nivellement précis avant de poser les pierres. Penser à la pente d'écoulement (1 cm/m mini).",
      photoIds: [],
      isPublic: true,
      submittedAt: now - 70 * dayMs,
    });

    // Mission 4 — COMPLETED + public feedback — Jean, toiture (2 months ago)
    const m4Start = new Date(now - 60 * dayMs);
    const m4End = new Date(now - 53 * dayMs);
    const m4Id = await ctx.db.insert("missions", {
      projectId: place2,
      ownerId: jeanId,
      type: "CHANTIER",
      title: "Toiture végétalisée extensive",
      description: "Pose d'une toiture végétalisée sur 30m² : étanchéité, drainage, substrat, plantes sedum.",
      poste: "toiture",
      technique: "toit_vegetal",
      difficulty: "INTERMEDIAIRE",
      pricingMode: "FREE",
      startDate: iso(m4Start),
      endDate: iso(m4End),
      maxParticipants: 4,
      hoursPerDay: 7,
      daysPerWeek: 5,
      skillIds: [skillByCode("carpentry"), skillByCode("garden_maintenance")].filter(Boolean) as any,
      status: "COMPLETED",
      feedbackNotifiedAt: now - 50 * dayMs,
      feedbackDeadlineAt: now - 43 * dayMs,
      updatedAt: now,
    });
    await ctx.db.insert("missionFeedback", {
      missionId: m4Id,
      totalCostEUR: 1850,
      surfaceM2: 30,
      actualDurationDays: 8,
      result: "PARTIAL_SUCCESS",
      difficultiesText:
        "L'étanchéité EPDM est plus délicate qu'on pensait, surtout sur les angles. On a dû refaire 2 jonctions.",
      learningsText:
        "Prévoir 30% de marge sur le substrat. Les sedums prennent 6 mois pour bien couvrir.",
      photoIds: [],
      isPublic: true,
      submittedAt: now - 45 * dayMs,
    });

    return {
      status: "seeded",
      counts: { hosts: 2, places: 2, missions: 4, feedbacks: 2 },
    };
  },
});
