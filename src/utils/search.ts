const routeMatchers = [
  { path: '/', terms: ['dashboard', 'overview', 'home'] },
  { path: '/fraud-signals', terms: ['fraud', 'signal', 'signals'] },
  { path: '/hr-events', terms: ['hr', 'employment', 'ghost', 'payroll'] },
  { path: '/mno-events', terms: ['mno', 'sim', 'telecom', 'msisdn', 'port'] },
  { path: '/id-lookup', terms: ['lookup', 'id', 'identity', 'check'] },
  { path: '/activity-log', terms: ['activity', 'audit', 'log', 'api'] },
] as const;

export function resolveSearchQuery(raw: string): { path: string; idNumber?: string } {
  const query = raw.trim();
  if (!query) return { path: '/' };

  const digits = query.replace(/\s/g, '');
  if (/^\d{13}$/.test(digits)) {
    return { path: '/id-lookup', idNumber: digits };
  }

  const lower = query.toLowerCase();
  for (const route of routeMatchers) {
    if (route.terms.some((term) => lower.includes(term))) {
      return { path: route.path };
    }
  }

  if (/^\d+$/.test(digits)) {
    return { path: '/id-lookup', idNumber: digits };
  }

  return { path: '/fraud-signals' };
}
