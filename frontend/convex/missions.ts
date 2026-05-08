import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  MISSION_TYPES,
  DIFFICULTY_LEVELS,
  PRICING_MODES,
  MISSION_STATUSES,
  POSTES,
  TECHNIQUES_BY_POSTE,
  type Poste,
} from "./lib/missionConstants";

// ============================================
// Helpers
// ============================================

async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

async function enrichMission(ctx: any, mission: any) {
  // Parallel fetch of all dependencies
  const [project, owner, skillsRaw, rawImages, feedback] = await Promise.all([
    ctx.db.get(mission.projectId),
    ctx.db.get(mission.ownerId),
    Promise.all((mission.skillIds || []).map((id: any) => ctx.db.get(id))),
    ctx.db
      .query("missionImages")
      .withIndex("by_mission", (q: any) => q.eq("missionId", mission._id))
      .collect(),
    ctx.db
      .query("missionFeedback")
      .withIndex("by_mission", (q: any) => q.eq("missionId", mission._id))
      .first(),
  ]);

  // Address belongs to the project
  let address: any = null;
  let projectLanguages: any[] = [];
  if (project) {
    const [addr, langs] = await Promise.all([
      project.addressId ? ctx.db.get(project.addressId) : Promise.resolve(null),
      Promise.all((project.languageIds || []).map((id: any) => ctx.db.get(id))),
    ]);
    if (addr) {
      const country = addr.countryId ? await ctx.db.get(addr.countryId) : null;
      address = { ...addr, country };
    }
    projectLanguages = langs.filter(Boolean).map((l: any) => ({ code: l.code, name: l.name }));
  }

  // Owner picture
  let ownerPictureUrl = owner?.profilePictureUrl ?? null;
  if (owner?.profilePicture && !ownerPictureUrl) {
    ownerPictureUrl = await ctx.storage.getUrl(owner.profilePicture);
  }

  // Image URLs
  const images = await Promise.all(
    rawImages.map(async (img: any) => ({
      ...img,
      url: img.url ?? (img.storageId ? await ctx.storage.getUrl(img.storageId) : null),
    }))
  );

  // Cover image URL (if mission has coverImageId in storage)
  let coverImageUrl: string | null = null;
  if (mission.coverImageId) {
    coverImageUrl = await ctx.storage.getUrl(mission.coverImageId);
  } else if (images.length > 0) {
    const cover = images.find((i: any) => i.order === 0) ?? images[0];
    coverImageUrl = cover?.url ?? null;
  }

  const skills = skillsRaw.filter(Boolean);

  // Participant count (accepted)
  const accepted = await ctx.db
    .query("participationRequests")
    .withIndex("by_mission_status", (q: any) =>
      q.eq("missionId", mission._id).eq("status", "ACCEPTED")
    )
    .collect();
  const participantsCount = accepted.length;

  return {
    ...mission,
    project: project
      ? {
          _id: project._id,
          title: project.title,
          ownerId: project.ownerId,
          status: project.status,
          accommodationDetails: project.accommodationDetails,
          foodDetails: project.foodDetails,
          internetProvided: project.internetProvided,
          familyFriendly: project.familyFriendly,
          petsAllowed: project.petsAllowed,
          smokingAllowed: project.smokingAllowed,
          languages: projectLanguages,
          address,
        }
      : null,
    owner: owner
      ? {
          _id: owner._id,
          publicId: owner.publicId,
          firstName: owner.firstName,
          lastName: owner.lastName,
          profilePictureUrl: ownerPictureUrl,
          averageRating: owner.averageRating,
          reviewCount: owner.reviewCount,
        }
      : null,
    skills,
    images,
    coverImageUrl,
    feedback: feedback || null,
    participantsCount,
  };
}

// Validation helpers
function validateType(type: string): void {
  if (!(MISSION_TYPES as readonly string[]).includes(type)) {
    throw new Error(`Invalid mission type: ${type}`);
  }
}
function validateDifficulty(d: string): void {
  if (!(DIFFICULTY_LEVELS as readonly string[]).includes(d)) {
    throw new Error(`Invalid difficulty: ${d}`);
  }
}
function validatePricingMode(p: string): void {
  if (!(PRICING_MODES as readonly string[]).includes(p)) {
    throw new Error(`Invalid pricing mode: ${p}`);
  }
}
function validateStatus(s: string): void {
  if (!(MISSION_STATUSES as readonly string[]).includes(s)) {
    throw new Error(`Invalid status: ${s}`);
  }
}
function validatePosteAndTechnique(poste?: string, technique?: string): void {
  if (poste && !(POSTES as readonly string[]).includes(poste)) {
    throw new Error(`Invalid poste: ${poste}`);
  }
  if (poste && technique) {
    const valid = TECHNIQUES_BY_POSTE[poste as Poste] || [];
    if (valid.length > 0 && !valid.includes(technique)) {
      throw new Error(`Invalid technique '${technique}' for poste '${poste}'`);
    }
  }
}

// ============================================
// List Missions (with filters)
// ============================================

export const list = query({
  args: {
    keyword: v.optional(v.string()),
    type: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    poste: v.optional(v.string()),
    technique: v.optional(v.string()),
    pricingMode: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    countries: v.optional(v.array(v.string())),
    startsAfter: v.optional(v.string()), // ISO date
    endsBefore: v.optional(v.string()), // ISO date
    excludeOwner: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let missions: any[];

    // Search index when keyword provided
    if (args.keyword && args.keyword.length > 0) {
      missions = await ctx.db
        .query("missions")
        .withSearchIndex("search_title", (q) => {
          let search: any = q.search("title", args.keyword!).eq("status", "PUBLISHED");
          if (args.type) search = search.eq("type", args.type);
          return search;
        })
        .collect();
    } else if (args.type) {
      missions = await ctx.db
        .query("missions")
        .withIndex("by_type_status", (q) => q.eq("type", args.type!).eq("status", "PUBLISHED"))
        .collect();
    } else {
      missions = await ctx.db
        .query("missions")
        .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
        .collect();
    }

    // Apply remaining filters
    if (args.difficulty) {
      missions = missions.filter((m) => m.difficulty === args.difficulty);
    }
    if (args.poste) {
      missions = missions.filter((m) => m.poste === args.poste);
    }
    if (args.technique) {
      missions = missions.filter((m) => m.technique === args.technique);
    }
    if (args.pricingMode) {
      missions = missions.filter((m) => m.pricingMode === args.pricingMode);
    }
    if (args.startsAfter) {
      missions = missions.filter((m) => m.startDate >= args.startsAfter!);
    }
    if (args.endsBefore) {
      missions = missions.filter((m) => m.endDate <= args.endsBefore!);
    }
    if (args.excludeOwner) {
      missions = missions.filter((m) => m.ownerId !== args.excludeOwner);
    }

    if (args.skills && args.skills.length > 0) {
      const skillDocs = await ctx.db.query("skills").collect();
      const matchingSkillIds = skillDocs
        .filter((s) => args.skills!.includes(s.code))
        .map((s) => s._id);
      missions = missions.filter((m) =>
        (m.skillIds || []).some((sid: any) => matchingSkillIds.includes(sid))
      );
    }

    // Resolve projects to validate place is ACTIVE & not over-flagged + filter by country/language (which live on project)
    const projectIds = Array.from(new Set(missions.map((m) => m.projectId)));
    const projectMap: Record<string, any> = {};
    for (const pid of projectIds) {
      projectMap[pid] = await ctx.db.get(pid);
    }

    missions = missions.filter((m) => {
      const p = projectMap[m.projectId];
      return p && p.status === "ACTIVE" && p.flaggedCount < 3;
    });

    if (args.languages && args.languages.length > 0) {
      const langDocs = await ctx.db.query("languages").collect();
      const matchingLangIds = langDocs
        .filter((l) => args.languages!.includes(l.code))
        .map((l) => l._id);
      missions = missions.filter((m) => {
        const p = projectMap[m.projectId];
        return p && (p.languageIds || []).some((lid: any) => matchingLangIds.includes(lid));
      });
    }

    if (args.countries && args.countries.length > 0) {
      const countryDocs = await ctx.db.query("countries").collect();
      const matchingCountryIds = countryDocs
        .filter((c) => args.countries!.includes(c.code))
        .map((c) => c._id);
      const filtered: any[] = [];
      for (const m of missions) {
        const p = projectMap[m.projectId];
        if (p?.addressId) {
          const addr: any = await ctx.db.get(p.addressId);
          if (addr && addr.countryId && matchingCountryIds.includes(addr.countryId)) {
            filtered.push(m);
          }
        }
      }
      missions = filtered;
    }

    return await Promise.all(missions.map((m) => enrichMission(ctx, m)));
  },
});

// ============================================
// Get Single Mission
// ============================================

export const getById = query({
  args: { id: v.id("missions") },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.id);
    if (!mission) return null;
    return await enrichMission(ctx, mission);
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("missions")) },
  handler: async (ctx, args) => {
    const missions = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    const found = missions.filter((m): m is NonNullable<typeof m> => !!m);
    return await Promise.all(found.map((m) => enrichMission(ctx, m)));
  },
});

// ============================================
// Get My Missions (host)
// ============================================

export const getMyMissions = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const missions = await ctx.db
      .query("missions")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return await Promise.all(missions.map((m) => enrichMission(ctx, m)));
  },
});

// ============================================
// Get Map Data — minimal payload for markers
// ============================================

export const getMapData = query({
  args: {},
  handler: async (ctx) => {
    const missions = await ctx.db
      .query("missions")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    const result: any[] = [];
    for (const m of missions) {
      const project = await ctx.db.get(m.projectId);
      if (!project || project.status !== "ACTIVE" || project.flaggedCount >= 3) continue;
      if (!project.addressId) continue;
      const addr = await ctx.db.get(project.addressId);
      if (!addr || !addr.latitude || !addr.longitude) continue;
      const country = addr.countryId ? await ctx.db.get(addr.countryId) : null;

      // Mission images (resolve URLs)
      const rawImages = await ctx.db
        .query("missionImages")
        .withIndex("by_mission", (q) => q.eq("missionId", m._id))
        .collect();
      const images: string[] = [];
      // Cover from coverImageId first
      if (m.coverImageId) {
        const u = await ctx.storage.getUrl(m.coverImageId);
        if (u) images.push(u);
      }
      for (const img of rawImages) {
        if (img.url) images.push(img.url);
        else if (img.storageId) {
          const u = await ctx.storage.getUrl(img.storageId);
          if (u) images.push(u);
        }
      }

      result.push({
        _id: m._id,
        title: m.title,
        type: m.type,
        difficulty: m.difficulty,
        poste: m.poste,
        startDate: m.startDate,
        endDate: m.endDate,
        pricingMode: m.pricingMode,
        priceEUR: m.priceEUR,
        latitude: addr.latitude,
        longitude: addr.longitude,
        city: addr.city,
        countryName: country?.name ?? null,
        maxParticipants: m.maxParticipants,
        hoursPerDay: m.hoursPerDay,
        daysPerWeek: m.daysPerWeek,
        internetProvided: project.internetProvided,
        familyFriendly: project.familyFriendly,
        petsAllowed: project.petsAllowed,
        images,
      });
    }
    return result;
  },
});

// ============================================
// Get Missions for a project (sidebar "other missions of this place")
// ============================================

export const getByProject = query({
  args: { projectId: v.id("projects"), excludeId: v.optional(v.id("missions")) },
  handler: async (ctx, args) => {
    const missions = await ctx.db
      .query("missions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const filtered = missions.filter((m) => {
      if (args.excludeId && m._id === args.excludeId) return false;
      return m.status === "PUBLISHED" || m.status === "IN_PROGRESS" || m.status === "COMPLETED";
    });
    return await Promise.all(filtered.map((m) => enrichMission(ctx, m)));
  },
});

// ============================================
// Get Completed Public — for "Apprenez des autres"
// ============================================

export const getCompletedPublic = query({
  args: {
    poste: v.optional(v.string()),
    technique: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const completed = await ctx.db
      .query("missions")
      .withIndex("by_status", (q) => q.eq("status", "COMPLETED"))
      .collect();

    const withPublicFeedback: any[] = [];
    for (const m of completed) {
      const fb = await ctx.db
        .query("missionFeedback")
        .withIndex("by_mission", (q) => q.eq("missionId", m._id))
        .first();
      if (!fb || !fb.isPublic) continue;
      if (args.poste && m.poste !== args.poste) continue;
      if (args.technique && m.technique !== args.technique) continue;
      if (args.type && m.type !== args.type) continue;
      withPublicFeedback.push(m);
    }

    return await Promise.all(withPublicFeedback.map((m) => enrichMission(ctx, m)));
  },
});

// ============================================
// Create Mission
// ============================================

export const create = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    poste: v.optional(v.string()),
    technique: v.optional(v.string()),
    difficulty: v.string(),
    pricingMode: v.string(),
    priceEUR: v.optional(v.number()),
    startDate: v.string(),
    endDate: v.string(),
    maxParticipants: v.number(),
    hoursPerDay: v.number(),
    daysPerWeek: v.number(),
    skillCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    // Validate inputs
    validateType(args.type);
    validateDifficulty(args.difficulty);
    validatePricingMode(args.pricingMode);
    validatePosteAndTechnique(args.poste, args.technique);

    if (args.pricingMode === "PAID" && (args.priceEUR === undefined || args.priceEUR < 0)) {
      throw new Error("PAID mission must have a non-negative priceEUR.");
    }
    if (args.endDate < args.startDate) {
      throw new Error("endDate must be >= startDate.");
    }

    // Verify project ownership and status
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Place not found.");
    if (project.ownerId !== user._id) throw new Error("Not authorized.");
    if (project.status !== "ACTIVE") {
      throw new Error("Your place must be approved by an admin before publishing missions.");
    }

    // Resolve skill codes
    const allSkills = await ctx.db.query("skills").collect();
    const skillIds = allSkills
      .filter((s) => args.skillCodes.includes(s.code))
      .map((s) => s._id);

    const missionId = await ctx.db.insert("missions", {
      projectId: args.projectId,
      ownerId: user._id,
      type: args.type,
      title: args.title,
      description: args.description,
      poste: args.poste,
      technique: args.technique,
      difficulty: args.difficulty,
      pricingMode: args.pricingMode,
      priceEUR: args.pricingMode === "PAID" ? args.priceEUR : undefined,
      startDate: args.startDate,
      endDate: args.endDate,
      maxParticipants: args.maxParticipants,
      hoursPerDay: args.hoursPerDay,
      daysPerWeek: args.daysPerWeek,
      skillIds,
      status: "DRAFT",
      updatedAt: Date.now(),
    });

    return missionId;
  },
});

// ============================================
// Update Mission
// ============================================

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("missions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    poste: v.optional(v.string()),
    technique: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    pricingMode: v.optional(v.string()),
    priceEUR: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    hoursPerDay: v.optional(v.number()),
    daysPerWeek: v.optional(v.number()),
    skillCodes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.id);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.poste !== undefined) updates.poste = args.poste;
    if (args.technique !== undefined) updates.technique = args.technique;
    if (args.difficulty !== undefined) {
      validateDifficulty(args.difficulty);
      updates.difficulty = args.difficulty;
    }
    if (args.pricingMode !== undefined) {
      validatePricingMode(args.pricingMode);
      updates.pricingMode = args.pricingMode;
      if (args.pricingMode === "FREE") updates.priceEUR = undefined;
    }
    if (args.priceEUR !== undefined) updates.priceEUR = args.priceEUR;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.maxParticipants !== undefined) updates.maxParticipants = args.maxParticipants;
    if (args.hoursPerDay !== undefined) updates.hoursPerDay = args.hoursPerDay;
    if (args.daysPerWeek !== undefined) updates.daysPerWeek = args.daysPerWeek;

    // Re-validate poste/technique pair if either changed
    if (updates.poste !== undefined || updates.technique !== undefined) {
      const finalPoste = updates.poste ?? mission.poste;
      const finalTechnique = updates.technique ?? mission.technique;
      validatePosteAndTechnique(finalPoste, finalTechnique);
    }

    if ((updates.startDate ?? mission.startDate) > (updates.endDate ?? mission.endDate)) {
      throw new Error("endDate must be >= startDate.");
    }

    if (args.skillCodes) {
      const allSkills = await ctx.db.query("skills").collect();
      updates.skillIds = allSkills
        .filter((s) => args.skillCodes!.includes(s.code))
        .map((s) => s._id);
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// ============================================
// Set Status (publish, cancel, etc.)
// ============================================

export const setStatus = mutation({
  args: {
    token: v.string(),
    id: v.id("missions"),
    status: v.string(),
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.id);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    validateStatus(args.status);

    // Restrict to host-controllable transitions
    const allowedHostStatuses = ["DRAFT", "PUBLISHED", "CANCELLED"];
    if (!allowedHostStatuses.includes(args.status)) {
      throw new Error("Status transition not allowed for hosts.");
    }

    // Verify project is ACTIVE before allowing PUBLISHED
    if (args.status === "PUBLISHED") {
      const project = await ctx.db.get(mission.projectId);
      if (!project || project.status !== "ACTIVE") {
        throw new Error("Your place must be approved before publishing missions.");
      }
    }

    const patch: any = { status: args.status, updatedAt: Date.now() };
    if (args.status === "CANCELLED") {
      patch.cancellationReason = args.cancellationReason || "";
    }
    await ctx.db.patch(args.id, patch);

    // Notify accepted/pending helpers when CANCELLED
    if (args.status === "CANCELLED") {
      const requests = await ctx.db
        .query("participationRequests")
        .withIndex("by_mission", (q) => q.eq("missionId", args.id))
        .collect();
      for (const req of requests) {
        if (req.status === "ACCEPTED" || req.status === "PENDING") {
          await ctx.db.insert("notifications", {
            recipientId: req.volunteerId,
            type: "MISSION",
            title: `Mission cancelled: ${mission.title}`,
            message: args.cancellationReason
              ? `Reason: ${args.cancellationReason}`
              : "The host has cancelled this mission.",
            linkUrl: `/missions/${args.id}`,
            isRead: false,
          });
        }
      }
    }

    return { success: true };
  },
});

// ============================================
// Delete Mission
// ============================================

export const remove = mutation({
  args: { token: v.string(), id: v.id("missions") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.id);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    // Cascade: images, feedback, participationRequests, helperPhotos, favorites
    const images = await ctx.db
      .query("missionImages")
      .withIndex("by_mission", (q) => q.eq("missionId", args.id))
      .collect();
    for (const img of images) {
      if (img.storageId) await ctx.storage.delete(img.storageId);
      await ctx.db.delete(img._id);
    }

    const feedback = await ctx.db
      .query("missionFeedback")
      .withIndex("by_mission", (q) => q.eq("missionId", args.id))
      .first();
    if (feedback) await ctx.db.delete(feedback._id);

    const helperPhotos = await ctx.db
      .query("helperMissionPhotos")
      .withIndex("by_mission", (q) => q.eq("missionId", args.id))
      .collect();
    for (const ph of helperPhotos) {
      if (ph.storageId) await ctx.storage.delete(ph.storageId);
      await ctx.db.delete(ph._id);
    }

    const requests = await ctx.db
      .query("participationRequests")
      .withIndex("by_mission", (q) => q.eq("missionId", args.id))
      .collect();
    for (const r of requests) await ctx.db.delete(r._id);

    const favorites = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("missionId"), args.id))
      .collect();
    for (const f of favorites) await ctx.db.delete(f._id);

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// Duplicate Mission (for recurring formations)
// ============================================

export const duplicate = mutation({
  args: { token: v.string(), id: v.id("missions") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const original = await ctx.db.get(args.id);
    if (!original || original.ownerId !== user._id) throw new Error("Not authorized.");

    const newId = await ctx.db.insert("missions", {
      projectId: original.projectId,
      ownerId: original.ownerId,
      type: original.type,
      title: original.title + " (copie)",
      description: original.description,
      poste: original.poste,
      technique: original.technique,
      difficulty: original.difficulty,
      pricingMode: original.pricingMode,
      priceEUR: original.priceEUR,
      startDate: original.startDate,
      endDate: original.endDate,
      maxParticipants: original.maxParticipants,
      hoursPerDay: original.hoursPerDay,
      daysPerWeek: original.daysPerWeek,
      skillIds: original.skillIds,
      status: "DRAFT",
      updatedAt: Date.now(),
    });

    return newId;
  },
});

// ============================================
// Image management
// ============================================

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveMissionImage = mutation({
  args: {
    token: v.string(),
    missionId: v.id("missions"),
    storageId: v.id("_storage"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    await ctx.db.insert("missionImages", {
      missionId: args.missionId,
      storageId: args.storageId,
      order: args.order,
    });
    return { success: true };
  },
});

export const removeMissionImage = mutation({
  args: { token: v.string(), imageId: v.id("missionImages") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found.");
    const mission = await ctx.db.get(image.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    if (image.storageId) await ctx.storage.delete(image.storageId);
    await ctx.db.delete(args.imageId);
    return { success: true };
  },
});

export const reorderMissionImages = mutation({
  args: {
    token: v.string(),
    missionId: v.id("missions"),
    imageIds: v.array(v.id("missionImages")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const mission = await ctx.db.get(args.missionId);
    if (!mission || mission.ownerId !== user._id) throw new Error("Not authorized.");

    for (let i = 0; i < args.imageIds.length; i++) {
      await ctx.db.patch(args.imageIds[i], { order: i });
    }
    return { success: true };
  },
});
