// Client-side mirror of the access tiers in
// backend/app/core/dependencies.py. The backend is the enforcement point —
// this table only decides what the UI offers, so the two must be kept in step.
// Every role-based decision in the app reads from here rather than comparing
// role strings inline.

// Internal identifiers — these are the exact strings stored in the roles table
// and carried in the JWT. They are never shown to users; ROLE_LABELS below
// supplies the display name.
export const SUPER_ADMIN = "SuperAdmin";
export const STORE_MANAGER = "StoreManager";
export const ANALYST = "Analyst";
export const MARKETING_MANAGER = "MarketingManager";

// Same tiers the API gates on. MarketingManager is a read-only analytics
// consumer, so it sits in ALL_ROLES beside Analyst and in neither management
// tier.
export const ALL_ROLES = [
  SUPER_ADMIN,
  STORE_MANAGER,
  ANALYST,
  MARKETING_MANAGER,
];
export const MANAGEMENT_ROLES = [SUPER_ADMIN, STORE_MANAGER];
export const ADMIN_ONLY = [SUPER_ADMIN];

// Roles that may browse store records in the UI. MarketingManager is excluded:
// its remit is analytics, so the Stores page and nav entry stay hidden from it.
export const STORE_VIEW_ROLES = [SUPER_ADMIN, STORE_MANAGER, ANALYST];

// Display names. The internal identifier stays as-is everywhere it is checked;
// only what the user reads changes — "SuperAdmin" surfaces as "Administrator".
export const ROLE_LABELS: Record<string, string> = {
  [SUPER_ADMIN]: "Administrator",
  [STORE_MANAGER]: "Store Manager",
  [ANALYST]: "Analyst",
  [MARKETING_MANAGER]: "Marketing Manager",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

// One entry per gated capability. Read capabilities are open to every signed-in
// role; anything that creates, edits or deletes is restricted, which is what
// keeps Analyst read-only everywhere it has access.
export const PERMISSIONS = {
  viewDashboard: ALL_ROLES,

  // Store records are browsable by the operational roles; only a SuperAdmin
  // may create, edit or delete them.
  viewStores: STORE_VIEW_ROLES,
  manageStores: ADMIN_ONLY,

  // Shelf management is operational configuration, not open to Analyst.
  viewShelves: MANAGEMENT_ROLES,
  manageShelves: MANAGEMENT_ROLES,

  // Read-only analytical surfaces. These currently render as panels inside the
  // Dashboard page rather than as their own routes; the entries exist so each
  // is already gated if it is promoted to a route later.
  viewAnalytics: ALL_ROLES,
  viewHeatmaps: ALL_ROLES,
  viewSegmentation: ALL_ROLES,
  viewAttractiveness: ALL_ROLES,
  viewRecommendations: ALL_ROLES,
  viewReports: ALL_ROLES,

  // Notifications are readable by everyone, but read state is shared rather
  // than per-user, so clearing all of them is a write against what other
  // users see and stays with the operational roles.
  viewNotifications: ALL_ROLES,
  markAllNotificationsRead: MANAGEMENT_ROLES,

  // No UI exists for these yet; declared so they are gated from the start.
  cameraControls: MANAGEMENT_ROLES,
  manageUsers: ADMIN_ONLY,
} as const;

export type Capability = keyof typeof PERMISSIONS;

export function can(role: string, capability: Capability): boolean {
  return (PERMISSIONS[capability] as readonly string[]).includes(role);
}

// Navigable modules and the capability that governs each, so the nav bar and
// the route guards agree by construction.
export const NAV_ITEMS: {
  href: string;
  label: string;
  capability: Capability;
}[] = [
  { href: "/dashboard", label: "Dashboard", capability: "viewDashboard" },
  { href: "/stores", label: "Stores", capability: "viewStores" },
  { href: "/shelves", label: "Shelves", capability: "viewShelves" },
];
