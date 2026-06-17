function track(event: string, payload?: Record<string, unknown>) {
  console.log('[tracking]', event, payload ?? {});
}

export function trackPageView() {
  track('page_view');
}
