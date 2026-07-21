export const userRoles = ["user", "yetkili", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export function isUserRole(role: unknown): role is UserRole {
  return typeof role === "string" && userRoles.includes(role as UserRole);
}

export function normalizeRole(role: unknown): UserRole {
  return isUserRole(role) ? role : "user";
}

export function hasAdminPanelAccess(role: unknown) {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "yetkili";
}

export function canManageUserRoles(role: unknown) {
  return normalizeRole(role) === "admin";
}
