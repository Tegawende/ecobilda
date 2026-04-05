import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================
// Session Management
// ============================================

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simple password hashing using Web Crypto API (available in Convex)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = generateToken().slice(0, 16);
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256$${salt}$${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "sha256") return false;
  const salt = parts[1];
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === parts[2];
}

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================
// Register
// ============================================

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check email uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(args.password);
    const verificationToken = generateToken().slice(0, 32);

    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      firstName: args.firstName,
      lastName: args.lastName,
      dateOfBirth: args.dateOfBirth,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationSentAt: Date.now(),
      hasPassword: true,
      emailNotifications: true,
      newsletter: false,
      inAppNotifications: true,
      notificationLanguage: args.locale ?? "en",
      isProfileVisible: true,
      averageRating: 0,
      reviewCount: 0,
      isStaff: false,
      isSuperuser: false,
      isActive: true,
    });

    // Store password hash in a separate internal field approach
    // We use the legacyPasswordHash field to store our hash too
    await ctx.db.patch(userId, { legacyPasswordHash: passwordHash });

    return {
      userId,
      verificationToken,
      message: "Registration successful. Please check your email to verify your account.",
    };
  },
});

// ============================================
// Login
// ============================================

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new Error("This account has been deactivated.");
    }

    if (!user.legacyPasswordHash) {
      throw new Error("This account uses Google login. Please sign in with Google.");
    }

    const valid = await verifyPassword(args.password, user.legacyPasswordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION,
    });

    // Update last login
    await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

    return {
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        isStaff: user.isStaff,
      },
    };
  },
});

// ============================================
// Google OAuth Login
// ============================================

export const googleLogin = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    pictureUrl: v.optional(v.string()),
    googleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    let created = false;

    if (!user) {
      // Create new user from Google
      const userId = await ctx.db.insert("users", {
        email: args.email.toLowerCase(),
        firstName: args.firstName,
        lastName: args.lastName,
        profilePictureUrl: args.pictureUrl,
        emailVerified: true,
        hasPassword: false,
        emailNotifications: true,
        newsletter: false,
        inAppNotifications: true,
        notificationLanguage: "en",
        isProfileVisible: true,
        averageRating: 0,
        reviewCount: 0,
        isStaff: false,
        isSuperuser: false,
        isActive: true,
      });
      user = await ctx.db.get(userId);
      created = true;
    } else {
      // Update existing user
      const updates: any = {};
      if (!user.emailVerified) updates.emailVerified = true;
      if (!user.firstName && args.firstName) updates.firstName = args.firstName;
      if (!user.lastName && args.lastName) updates.lastName = args.lastName;
      if (args.pictureUrl && !user.profilePicture) updates.profilePictureUrl = args.pictureUrl;
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
      }
    }

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user!._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION,
    });

    await ctx.db.patch(user!._id, { lastLoginAt: Date.now() });

    return {
      token,
      user: {
        _id: user!._id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        emailVerified: true,
        isStaff: user!.isStaff,
      },
      created,
    };
  },
});

// ============================================
// Logout
// ============================================

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ============================================
// Get Current User (from session token)
// ============================================

export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) return null;

    // Get address
    let address = null;
    if (user.addressId) {
      const addr = await ctx.db.get(user.addressId);
      if (addr) {
        let country = null;
        if (addr.countryId) {
          country = await ctx.db.get(addr.countryId);
        }
        address = { ...addr, country };
      }
    }

    // Get languages
    const languages = [];
    if (user.languageIds) {
      for (const langId of user.languageIds) {
        const lang = await ctx.db.get(langId);
        if (lang) languages.push(lang);
      }
    }

    // Get skills
    const skills = [];
    if (user.skillIds) {
      for (const skillId of user.skillIds) {
        const skill = await ctx.db.get(skillId);
        if (skill) skills.push(skill);
      }
    }

    return {
      ...user,
      address,
      languages,
      skills,
      legacyPasswordHash: undefined, // Never expose
    };
  },
});

// ============================================
// Verify Email
// ============================================

export const verifyEmail = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => u.emailVerificationToken === args.token);

    if (!user) {
      throw new Error("Invalid or expired verification token.");
    }

    await ctx.db.patch(user._id, {
      emailVerified: true,
      emailVerificationToken: undefined,
    });

    return { message: "Email verified successfully." };
  },
});

// ============================================
// Check Email
// ============================================

export const checkEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    return {
      exists: !!user,
      hasPassword: user?.hasPassword ?? false,
    };
  },
});

// ============================================
// Change Password
// ============================================

export const changePassword = mutation({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated.");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.legacyPasswordHash) {
      throw new Error("Cannot change password for this account.");
    }

    const valid = await verifyPassword(args.currentPassword, user.legacyPasswordHash);
    if (!valid) {
      throw new Error("Current password is incorrect.");
    }

    const newHash = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, { legacyPasswordHash: newHash });

    return { message: "Password changed successfully." };
  },
});

// ============================================
// Password Reset Request
// ============================================

export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: "If an account exists, a reset email has been sent.", token: null };
    }

    const token = generateToken().slice(0, 32);
    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      used: false,
    });

    return { message: "If an account exists, a reset email has been sent.", token };
  },
});

// ============================================
// Password Reset Confirm
// ============================================

export const confirmPasswordReset = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken || resetToken.used || resetToken.expiresAt < Date.now()) {
      throw new Error("Invalid or expired reset token.");
    }

    const newHash = await hashPassword(args.newPassword);
    await ctx.db.patch(resetToken.userId, {
      legacyPasswordHash: newHash,
      hasPassword: true,
    });
    await ctx.db.patch(resetToken._id, { used: true });

    return { message: "Password reset successfully." };
  },
});
