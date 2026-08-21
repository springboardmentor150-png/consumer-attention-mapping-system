export function normalizeRole(role) {
  if (!role) return 'admin';
  const lower = String(role).toLowerCase().trim();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('manager') && !lower.includes('marketing')) return 'manager';
  if (lower.includes('analyst')) return 'analyst';
  if (lower.includes('marketing')) return 'marketing';
  return 'admin';
}

export function getDashboardPathForRole(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return '/admin-dashboard';
    case 'manager':
      return '/manager-dashboard';
    case 'analyst':
      return '/analyst-dashboard';
    case 'marketing':
      return '/marketing-dashboard';
    default:
      return '/admin-dashboard';
  }
}

export function getRoleLabel(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Store Manager';
    case 'analyst':
      return 'Retail Analyst';
    case 'marketing':
      return 'Marketing Manager';
    default:
      return 'Administrator';
  }
}
