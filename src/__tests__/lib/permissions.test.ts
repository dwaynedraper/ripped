import { describe, it, expect } from "vitest";
import { isRoleAllowed } from "@/lib/auth";

describe("permission checks — NEGATIVE cases (these prevent breaches)", () => {
  it("rejects null staffRole for admin routes", () => {
    expect(isRoleAllowed({ staffRole: null, allowedRoles: ["admin", "super_admin"] })).toBe(false);
  });

  it("rejects content_creator from admin routes", () => {
    expect(isRoleAllowed({ staffRole: "content_creator", allowedRoles: ["admin", "super_admin"] })).toBe(false);
  });

  it("rejects admin from super_admin-only routes", () => {
    expect(isRoleAllowed({ staffRole: "admin", allowedRoles: ["super_admin"] })).toBe(false);
  });

  it("rejects content_creator from super_admin-only routes", () => {
    expect(isRoleAllowed({ staffRole: "content_creator", allowedRoles: ["super_admin"] })).toBe(false);
  });
});

describe("permission checks — POSITIVE cases", () => {
  it("allows admin for admin routes", () => {
    expect(isRoleAllowed({ staffRole: "admin", allowedRoles: ["admin", "super_admin"] })).toBe(true);
  });

  it("allows super_admin for admin routes", () => {
    expect(isRoleAllowed({ staffRole: "super_admin", allowedRoles: ["admin", "super_admin"] })).toBe(true);
  });

  it("allows super_admin for super_admin-only routes", () => {
    expect(isRoleAllowed({ staffRole: "super_admin", allowedRoles: ["super_admin"] })).toBe(true);
  });

  it("allows content_creator for staff routes", () => {
    expect(
      isRoleAllowed({ staffRole: "content_creator", allowedRoles: ["content_creator", "admin", "super_admin"] })
    ).toBe(true);
  });
});
