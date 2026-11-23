// Coordinates show where a person is, so they never reach the logs.
export function redactUrl(url: string): string {
  return url.replace(/([?&](?:lat|lon)=)[^&#]*/gi, '$1[redacted]');
}
