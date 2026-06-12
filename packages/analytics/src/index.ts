export interface AnalyticsPayload {
  event: string;
  page?: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

type ReportHandler = (payload: AnalyticsPayload) => void;

let reportHandler: ReportHandler = (payload) => {
  const body = JSON.stringify(payload);
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/track', body);
  } else {
    fetch('/api/track', { method: 'POST', body, keepalive: true });
  }
};

export function setReportHandler(handler: ReportHandler) {
  reportHandler = handler;
}

export function track(event: string, properties?: Record<string, unknown>) {
  const payload: AnalyticsPayload = {
    event,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    properties,
    timestamp: Date.now(),
  };
  reportHandler(payload);
}

export function pageView() {
  track('page_view', {
    title: typeof document !== 'undefined' ? document.title : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
  });
}

export function click(elementName: string, extra?: Record<string, unknown>) {
  track('click', { element: elementName, ...extra });
}
