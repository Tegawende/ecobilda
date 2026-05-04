import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// projects.ts
//
// "Project" now models the host's PLACE — a lightweight container that
// describes the location and amenities. Bookable units live in `missions`.
// ============================================

async function getUserFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

async function enrichProject(ctx: any, project: any) {
  const [owner, addr, languagesRaw, rawImages] = await Promise.all([
    ctx.db.get(project.ownerId),
    project.addressId ? ctx.db.get(project.addressId) : Promise.resolve(null),
    Promise.all((project.languageIds || []).map((id: any) => ctx.db.get(id))),
    ctx.db
      .query("projectImages")
      .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
      .collect(),
  ]);

  const [country, ownerProfilePictureUrl, images] = await Promise.all([
    addr?.countryId ? ctx.db.get(addr.countryId) : Promise.resolve(null),
    owner?.profilePictureUrl
      ? Promise.resolve(owner.profilePictureUrl)
      : owner?.profilePicture
        ? ctx.storage.getUrl(owner.profilePicture)
        : Promise.resolve(null),
    Promise.all(
      rawImages.map(async (img: any) => ({
        ...img,
        url: img.url ?? (img.storageId ? await ctx.storage.getUrl(img.storageId) : null),
      }))
    ),
  ]);

  const address = addr ? { ...addr, country } : null;
  const languages = languagesRaw
    .filter(Boolean)
    .map((lang: any) => ({ code: lang.code, name: lang.name }));

  // Count missions on this place (cheap)
  const missions = await ctx.db
    .query("missions")
    .withIndex("by_project", (q: any) => q.eq("projectId", project._id))
    .collect();

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
    languages,
    images,
    missionsCount: missions.length,
  };
}

// ============================================
// Get Single Place
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
// Get My Places (lightweight list for mission picker)
// ============================================

export const getMyPlaces = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return await Promise.all(projects.map((p) => enrichProject(ctx, p)));
  },
});

// Backwards-compat alias used by older clients
export const getMyProjects = getMyPlaces;

// ============================================
// Create Place
// ============================================

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    accommodationDetails: v.optional(v.string()),
    foodDetails: v.optional(v.string()),
    internetProvided: v.boolean(),
    familyFriendly: v.boolean(),
    petsAllowed: v.boolean(),
    smokingAllowed: v.boolean(),
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

    // Resolve language codes
    const allLanguages = await ctx.db.query("languages").collect();
    const languageIds = allLanguages
      .filter((l) => (args.languageCodes || []).includes(l.code))
      .map((l) => l._id);

    // Create address if provided
    let addressId: any = undefined;
    if (args.city) {
      let countryId: any = undefined;
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
      addressId,
      accommodationDetails: args.accommodationDetails,
      foodDetails: args.foodDetails,
      internetProvided: args.internetProvided,
      familyFriendly: args.familyFriendly,
      petsAllowed: args.petsAllowed,
      smokingAllowed: args.smokingAllowed,
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
// Update Place
// ============================================

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("projects"),
    title: v.optional(v.string()),
    accommodationDetails: v.optional(v.string()),
    foodDetails: v.optional(v.string()),
    internetProvided: v.optional(v.boolean()),
    familyFriendly: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    smokingAllowed: v.optional(v.boolean()),
    languageCodes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.id);
    if (!project || project.ownerId !== user._id) throw new Error("Not authorized.");

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.accommodationDetails !== undefined) updates.accommodationDetails = args.accommodationDetails;
    if (args.foodDetails !== undefined) updates.foodDetails = args.foodDetails;
    if (args.internetProvided !== undefined) updates.internetProvided = args.internetProvided;
    if (args.familyFriendly !== undefined) updates.familyFriendly = args.familyFriendly;
    if (args.petsAllowed !== undefined) updates.petsAllowed = args.petsAllowed;
    if (args.smokingAllowed !== undefined) updates.smokingAllowed = args.smokingAllowed;

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
// Delete Place
// ============================================

export const remove = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.id);
    if (!project || project.ownerId !== user._id) throw new Error("Not authorized.");

    // Refuse to delete a place that still has missions — host should clean those up first.
    const missions = await ctx.db
      .query("missions")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    if (missions.length > 0) {
      throw new Error("Cannot delete a place that still has missions. Delete missions first.");
    }

    const images = await ctx.db
      .query("projectImages")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const img of images) {
      if (img.storageId) await ctx.storage.delete(img.storageId);
      await ctx.db.delete(img._id);
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// Flag Place
// ============================================

export const flag = mutation({
  args: { token: v.string(), id: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Place not found.");

    await ctx.db.patch(args.id, {
      flaggedCount: project.flaggedCount + 1,
      isActive: project.flaggedCount + 1 < 3,
    });
    return { success: true };
  },
});

// ============================================
// Image management (place gallery)
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
  args: { token: v.string(), imageId: v.id("projectImages") },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Not authenticated.");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found.");

    const project = await ctx.db.get(image.projectId);
    if (!project || project.ownerId !== user._id) throw new Error("Not authorized.");

    if (image.storageId) await ctx.storage.delete(image.storageId);
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
    if (!project || project.ownerId !== user._id) throw new Error("Not authorized.");

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
    if (!project || project.ownerId !== user._id) throw new Error("Not authorized.");

    await ctx.db.insert("projectImages", {
      projectId: args.projectId,
      storageId: args.storageId,
      order: args.order,
    });
    return { success: true };
  },
});
