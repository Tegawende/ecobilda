import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

// ============================================
// Session Management
// ============================================

function generatePublicId(): string {
  // 16-digit numeric string like Airbnb (1469096674124373)
  const min = 1000000000000000n;
  const max = 9999999999999999n;
  const range = max - min + 1n;
  const rand = BigInt(Math.floor(Math.random() * Number(range)));
  return (min + rand).toString();
}

async function generateUniquePublicId(ctx: any): Promise<string> {
  while (true) {
    const id = generatePublicId();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_public_id", (q: any) => q.eq("publicId", id))
      .first();
    if (!existing) return id;
  }
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// PBKDF2 password hashing using Web Crypto API (available in Convex)
const PBKDF2_ITERATIONS = 600000;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt.buffer);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );

  const hashHex = toHex(derived);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  const encoder = new TextEncoder();

  // Legacy SHA-256 support (for existing users)
  if (parts[0] === "sha256" && parts.length === 3) {
    const salt = parts[1];
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return toHex(hashBuffer) === parts[2];
  }

  // PBKDF2 verification
  if (parts[0] === "pbkdf2" && parts.length === 4) {
    const iterations = parseInt(parts[1]);
    const salt = fromHex(parts[2]);
    const expectedHash = parts[3];

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      256
    );

    return toHex(derived) === expectedHash;
  }

  return false;
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
      publicId: await generateUniquePublicId(ctx),
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

    // Send verification email in user's locale
    await ctx.scheduler.runAfter(0, internal.emails.sendVerificationEmail, {
      to: args.email.toLowerCase(),
      userName: args.firstName,
      verificationToken,
      locale: args.locale ?? "en",
    });

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

    if (!user.emailVerified) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    if (!user.legacyPasswordHash) {
      throw new Error("This account uses Google login. Please sign in with Google.");
    }

    const valid = await verifyPassword(args.password, user.legacyPasswordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    // Re-hash with PBKDF2 if using legacy SHA-256
    if (user.legacyPasswordHash.startsWith("sha256$")) {
      const newHash = await hashPassword(args.password);
      await ctx.db.patch(user._id, { legacyPasswordHash: newHash });
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
// Admin Login (password only, checks isStaff first)
// ============================================

export const adminLogin = mutation({
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

    if (!user.isStaff) {
      throw new Error("Invalid email or password.");
    }

    if (!user.legacyPasswordHash) {
      throw new Error("No password set for this account. Please contact a superadmin to set one.");
    }

    const valid = await verifyPassword(args.password, user.legacyPasswordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    // Re-hash with PBKDF2 if using legacy SHA-256
    if (user.legacyPasswordHash.startsWith("sha256$")) {
      const newHash = await hashPassword(args.password);
      await ctx.db.patch(user._id, { legacyPasswordHash: newHash });
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
        publicId: await generateUniquePublicId(ctx),
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

    // Get languages & skills in parallel
    const [languages, skills, profilePictureUrl] = await Promise.all([
      Promise.all((user.languageIds || []).map((id) => ctx.db.get(id))).then((r) => r.filter(Boolean)),
      Promise.all((user.skillIds || []).map((id) => ctx.db.get(id))).then((r) => r.filter(Boolean)),
      user.profilePicture && !user.profilePictureUrl
        ? ctx.storage.getUrl(user.profilePicture)
        : Promise.resolve(user.profilePictureUrl ?? null),
    ]);

    return {
      ...user,
      profilePictureUrl,
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
// Resend Verification Email
// ============================================

export const resendVerificationEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user || user.emailVerified) {
      return { message: "If an unverified account exists, a verification email has been sent." };
    }

    // Generate new token
    const verificationToken = generateToken().slice(0, 32);
    await ctx.db.patch(user._id, {
      emailVerificationToken: verificationToken,
      emailVerificationSentAt: Date.now(),
    });

    // Send email in user's preferred locale
    await ctx.scheduler.runAfter(0, internal.emails.sendVerificationEmail, {
      to: user.email,
      userName: user.firstName || "User",
      verificationToken,
      locale: user.notificationLanguage ?? "en",
    });

    return { message: "If an unverified account exists, a verification email has been sent." };
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

    // Send password reset email in user's preferred locale
    await ctx.scheduler.runAfter(0, internal.emails.sendPasswordResetEmail, {
      to: user.email,
      userName: user.firstName || "User",
      resetToken: token,
      locale: user.notificationLanguage ?? "en",
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
