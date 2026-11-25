import { LOCATION_LEVEL_LABELS, type Location } from './types';

// The state is skipped when it is the place's own name (Gujarat, Gujarat).
function stateOf(location: Location): string | null {
  return location.admin1 && location.admin1 !== location.name
    ? location.admin1
    : null;
}

// "City · Gujarat · IN"
export function describeLocation(location: Location): string {
  return [
    LOCATION_LEVEL_LABELS[location.level],
    stateOf(location),
    location.countryCode,
  ]
    .filter(Boolean)
    .join(' · ');
}

// "Mumbai, Maharashtra, IN"
export function formatPlace(location: Location): string {
  return [location.name, stateOf(location), location.countryCode]
    .filter(Boolean)
    .join(', ');
}
