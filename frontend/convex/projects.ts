import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to get user from session
async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

// Helper to enrich a project with relations
async function enrichProject(ctx: any, project: any) {
  // Owner
  const owner = await ctx.db.get(project.ownerId);

  // Address with country
  let address = null;
  if (project.addressId) {
    const addr = await ctx.db.get(project.addressId);
    if (addr) {
      let country = null;
      if (addr.countryId) country = await ctx.db.get(addr.countryId);
      address = { ...addr, country };
    }
  }

  // Skills
  const skills = [];
  for (const skillId of project.skillIds || []) {
    const skill = await ctx.db.get(skillId);
    if (skill) skills.push(skill);
  }

  // Languages
  const languages = [];
  for (const langId of project.languageIds || []) {
    const lang = await ctx.db.get(langId);
    if (lang) languages.push({ code: lang.code, name: lang.name });
  }

  // Images (resolve storage IDs to URLs, or use direct URL)
  const rawImages = await ctx.db
    .query("projectImages")
    .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
    .collect();
  const images = await Promise.all(
    rawImages.map(async (img: any) => ({
      ...img,
      url: img.url ?? (img.storageId ? await ctx.storage.getUrl(img.storageId) : null),
    }))
  );

  // Availabilities
  const availabilities = await ctx.db
    .query("availability")
    .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
    .collect();

  // Resolve owner profile picture
  let ownerProfilePictureUrl = owner?.profilePictureUrl ?? null;
  if (owner?.profilePicture && !ownerProfilePictureUrl) {
    ownerProfilePictureUrl = await ctx.storage.getUrl(owner.profilePicture);
  }

  return {
    ...project,
    owner: owner
      ? {
          _id: owner._id,
          publicId: owner.publicId,
          firstName: owner.firstName,
          lastName: owner.lastName,
          profilePictureUrl: ownerProfilePictureUrl,
          averageRating: owner.averageRating,
          reviewCount: owner.reviewCount,
        }
      : null,
    address,
    skills,
    languages,
    images,
    availabilities,
  };
}

// ============================================
// List Projects (with filters)
// ============================================

export const list = query({
  args: {
    keyword: v.optional(v.string()),
    skills: v.optional(v.array(v.string())), // skill codes
    languages: v.optional(v.array(v.string())), // language codes
    countries: v.optional(v.array(v.string())), // country codes
    projectType: v.optional(v.string()),
    internetProvided: v.optional(v.boolean()),
    familyFriendly: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    smokingAllowed: v.optional(v.boolean()),
    excludeOwner: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let projects;

    // Use search index if keyword provided
    if (args.keyword && args.keyword.length > 0) {
      projects = await ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.keyword!).eq("status", "ACTIVE").eq("isActive", true)
        )
        .collect();
    } else {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_status_active", (q) => q.eq("status", "ACTIVE").eq("isActive", true))
        .collect();
    }

    // Filter: flagged
    projects = projects.filter((p) => p.flaggedCount < 3);

    // Filter: project type
    if (args.projectType) {
      projects = projects.filter((p) => p.projectType === args.projectType);
    }

    // Filter: amenities
    if (args.internetProvided !== undefined) {
      projects = projects.filter((p) => p.internetProvided === args.internetProvided);
    }
    if (args.familyFriendly !== undefined) {
      projects = projects.filter((p) => p.familyFriendly === args.familyFriendly);
    }
    if (args.petsAllowed !== undefined) {
      projects = projects.filter((p) => p.petsAllowed === args.petsAllowed);
    }
    if (args.smokingAllowed !== undefined) {
      projects = projects.filter((p) => p.smokingAllowed === args.smokingAllowed);
    }

    // Filter: exclude own projects
    if (args.excludeOwner) {
      projects = projects.filter((p) => p.ownerId !== args.excludeOwner);
    }

    // Filter: languages
    if (args.languages && args.languages.length > 0) {
      const langDocs = await ctx.db.query("languages").collect();
      const matchingLangIds = langDocs
        .filter((l) => args.languages!.includes(l.code))
        .map((l) => l._id);
      projects = projects.filter((p) =>
        (p.languageIds || []).some((lid: any) => matchingLangIds.includes(lid))
      );
    }

    // Filter: skills (by code)
    if (args.skills && args.skills.length > 0) {
      const skillDocs = await ctx.db.query("skills").collect();
      const matchingSkillIds = skillDocs
        .filter((s) => args.skills!.includes(s.code))
        .map((s) => s._id);
      projects = projects.filter((p) =>
        p.skillIds.some((sid: any) => matchingSkillIds.includes(sid))
      );
    }

    // Filter: countries
    if (args.countries && args.countries.length > 0) {
      const countryDocs = await ctx.db.query("countries").collect();
      const matchingCountryIds = countryDocs
        .filter((c) => args.countries!.includes(c.code))
        .map((c) => c._id);
      // Need to check project addresses
      const filtered = [];
      for (const p of projects) {
        if (p.addressId) {
          const addr = await ctx.db.get(p.addressId);
          if (addr && addr.countryId && matchingCountryIds.includes(addr.countryId)) {
            filtered.push(p);
          }
        }
      }
      projects = filtered;
    }

    // Enrich with relations
    const enriched = [];
    for (const p of projects) {
      enriched.push(await enrichProject(ctx, p));
    }

    return enriched;
  },
});

// ============================================
// Get Single Project
// ============================================

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) return null;
    return await enrichProject(ctx, project);
  },
});

// ============================================
// Get Projects by IDs (for favorites page)
// ============================================

export const getByIds = query({
  args: { ids: v.array(v.id("projects")) },
  handler: async (ctx, args) => {
    const enriched = [];
    for (const id of args.ids) {
      const project = await ctx.db.get(id);
      if (project && project.isActive) {
        enriched.push(await enrichProject(ctx, project));
      }
    }
    return enriched;
  },
});

// ============================================
// Get My Projects
// ============================================

export const getMyProjects = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const enriched = [];
    for (const p of projects) {
      enriched.push(await enrichProject(ctx, p));
    }
    return enriched;
  },
});

// ============================================
// Get Map Data (optimized for markers)
// ============================================

export const getMapData = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status_active", (q) => q.eq("status", "ACTIVE").eq("isActive", true))
      .collect();

    const result = [];
    for (const p of projects.filter((p) => p.flaggedCount < 3)) {
      if (p.addressId) {
        const addr = await ctx.db.get(p.addressId);
        if (addr && addr.latitude && addr.longitude) {
          result.push({
            _id: p._id,
            title: p.title,
            projectType: p.projectType,
            latitude: addr.latitude,
            longitude: addr.longitude,
            city: addr.city,
          });
        }
      }
    }
    return result;
  },
});

// ============================================
// Create Project
// ============================================

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.string(),
    projectType: v.string(),
    hoursPerDay: v.number(),
    daysPerWeek: v.number(),
    maxHelpers: v.number(),
    accommodationDetails: v.optional(v.string()),
    foodDetails: v.optional(v.string()),
    internetProvided: v.boolean(),
    familyFriendly: v.boolean(),
    petsAllowed: v.boolean(),
    smokingAllowed: v.boolean(),
    skillCodes: v.array(v.string()),
    languageCodes: v.optional(v.array(v.string())),
    // Address
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    formattedAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    // Resolve skill codes to IDs
    const allSkills = await ctx.db.query("skills").collect();
    const skillIds = allSkills
      .filter((s) => args.skillCodes.includes(s.code))
      .map((s) => s._id);

    // Resolve language codes to IDs
    const allLanguages = await ctx.db.query("languages").collect();
    const languageIds = allLanguages
      .filter((l) => (args.languageCodes || []).includes(l.code))
      .map((l) => l._id);

    // Create address
    let addressId = undefined;
    if (args.city) {
      let countryId = undefined;
      if (args.countryCode) {
        const country = await ctx.db
          .query("countries")
          .withIndex("by_code", (q) => q.eq("code", args.countryCode!))
          .first();
        if (country) countryId = country._id;
      }
      addressId = await ctx.db.insert("addresses", {
        city: args.city,
        postalCode: args.postalCode,
        countryId,
        latitude: args.latitude,
        longitude: args.longitude,
        formattedAddress: args.formattedAddress,
      });
    }

    const projectId = await ctx.db.insert("projects", {
      ownerId: user._id,
      title: args.title,
      description: args.description,
      projectType: args.projectType,
      addressId,
      hoursPerDay: args.hoursPerDay,
      daysPerWeek: args.daysPerWeek,
      maxHelpers: args.maxHelpers,
      accommodationDetails: args.accommodationDetails,
      foodDetails: args.foodDetails,
      internetProvided: args.internetProvided,
      familyFriendly: args.familyFriendly,
      petsAllowed: args.petsAllowed,
      smokingAllowed: args.smokingAllowed,
      skillIds,
      languageIds,
      isActive: true,
      flaggedCount: 0,
      status: "PENDING",
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// ============================================
// Update Project
// ============================================

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    hoursPerDay: v.optional(v.number()),
    daysPerWeek: v.optional(v.number()),
    maxHelpers: v.optional(v.number()),
    accommodationDetails: v.optional(v.string()),
    foodDetails: v.optional(v.string()),
    internetProvided: v.optional(v.boolean()),
    familyFriendly: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    smokingAllowed: v.optional(v.boolean()),
    skillCodes: v.optional(v.array(v.string())),
    languageCodes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.id);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.hoursPerDay !== undefined) updates.hoursPerDay = args.hoursPerDay;
    if (args.daysPerWeek !== undefined) updates.daysPerWeek = args.daysPerWeek;
    if (args.maxHelpers !== undefined) updates.maxHelpers = args.maxHelpers;
    if (args.accommodationDetails !== undefined) updates.accommodationDetails = args.accommodationDetails;
    if (args.foodDetails !== undefined) updates.foodDetails = args.foodDetails;
    if (args.internetProvided !== undefined) updates.internetProvided = args.internetProvided;
    if (args.familyFriendly !== undefined) updates.familyFriendly = args.familyFriendly;
    if (args.petsAllowed !== undefined) updates.petsAllowed = args.petsAllowed;
    if (args.smokingAllowed !== undefined) updates.smokingAllowed = args.smokingAllowed;

    if (args.skillCodes) {
      const allSkills = await ctx.db.query("skills").collect();
      updates.skillIds = allSkills
        .filter((s) => args.skillCodes!.includes(s.code))
        .map((s) => s._id);
    }

    if (args.languageCodes !== undefined) {
      const allLanguages = await ctx.db.query("languages").collect();
      updates.languageIds = allLanguages
        .filter((l) => args.languageCodes!.includes(l.code))
        .map((l) => l._id);
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// ============================================
// Delete Project
// ============================================

export const remove = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.id);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    // Delete related data
    const images = await ctx.db
      .query("projectImages")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const img of images) await ctx.db.delete(img._id);

    const avails = await ctx.db
      .query("availability")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const a of avails) await ctx.db.delete(a._id);

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// Flag Project
// ============================================

export const flag = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found.");

    await ctx.db.patch(args.id, {
      flaggedCount: project.flaggedCount + 1,
      isActive: project.flaggedCount + 1 < 3,
    });
    return { success: true };
  },
});

// ============================================
// Set Availabilities
// ============================================

export const setAvailabilities = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    year: v.number(),
    months: v.object({
      january: v.boolean(),
      february: v.boolean(),
      march: v.boolean(),
      april: v.boolean(),
      may: v.boolean(),
      june: v.boolean(),
      july: v.boolean(),
      august: v.boolean(),
      september: v.boolean(),
      october: v.boolean(),
      november: v.boolean(),
      december: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    // Delete existing for this year
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const a of existing.filter((a) => a.year === args.year)) {
      await ctx.db.delete(a._id);
    }

    // Insert new
    await ctx.db.insert("availability", {
      projectId: args.projectId,
      year: args.year,
      ...args.months,
    });

    return { success: true };
  },
});

// ============================================
// Upload Image
// ============================================

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const removeProjectImage = mutation({
  args: {
    token: v.string(),
    imageId: v.id("projectImages"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found.");

    const project = await ctx.db.get(image.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    // Delete from Convex storage if it's an uploaded file
    if (image.storageId) {
      await ctx.storage.delete(image.storageId);
    }

    await ctx.db.delete(args.imageId);
    return { success: true };
  },
});

export const reorderProjectImages = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    imageIds: v.array(v.id("projectImages")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    // Update order based on position in array
    for (let i = 0; i < args.imageIds.length; i++) {
      await ctx.db.patch(args.imageIds[i], { order: i });
    }
    return { success: true };
  },
});

export const saveProjectImage = mutation({
  args: {
    token: v.string(),
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized.");
    }

    await ctx.db.insert("projectImages", {
      projectId: args.projectId,
      storageId: args.storageId,
      order: args.order,
    });
    return { success: true };
  },
});
