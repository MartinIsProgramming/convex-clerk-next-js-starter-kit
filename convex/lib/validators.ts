import { v } from "convex/values";

// === Core Entity Validators ===

/**
 * User validator for return types.
 */
export const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  clerkId: v.string(),
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
});

/**
 * Partial user validator for API responses that don't need all fields.
 */
export const userPartialValidator = v.object({
  _id: v.id("users"),
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
});
