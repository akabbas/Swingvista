export const trackEvent = (event: string, data?: Record<string, unknown>) => {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data || {});
    }
    // eslint-disable-next-line no-console
    console.log('Analytics:', event, data || {});
  } catch {
    // no-op
  }
};


