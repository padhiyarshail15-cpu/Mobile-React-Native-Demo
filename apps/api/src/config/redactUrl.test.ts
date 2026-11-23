import { redactUrl } from './redactUrl';

describe('redactUrl', () => {
  it('hides lat and lon values', () => {
    expect(redactUrl('/api/v1/locations/nearest?lat=23.02&lon=72.57')).toBe(
      '/api/v1/locations/nearest?lat=[redacted]&lon=[redacted]'
    );
  });

  it('hides them in any order and any letter case', () => {
    expect(redactUrl('/x?LON=72.5&a=1&Lat=23.1')).toBe(
      '/x?LON=[redacted]&a=1&Lat=[redacted]'
    );
  });

  it('keeps other query parameters', () => {
    expect(redactUrl('/api/v1/locations/search?q=ahm&type=city')).toBe(
      '/api/v1/locations/search?q=ahm&type=city'
    );
  });

  it('does not touch parameters that merely contain "lat" or "lon"', () => {
    expect(redactUrl('/x?plat=1&salon=2&lat=3')).toBe(
      '/x?plat=1&salon=2&lat=[redacted]'
    );
  });

  it('leaves a URL with no query string alone', () => {
    expect(redactUrl('/api/v1/health')).toBe('/api/v1/health');
  });
});
