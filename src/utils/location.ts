import type { Coordinates, Shelter } from "../types";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

export const calculateDistance = (from: Coordinates, to: Coordinates): number => {
  const latitudeDifference = toRadians(to.lat - from.lat);
  const longitudeDifference = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(fromLatitude)
      * Math.cos(toLatitude)
      * Math.sin(longitudeDifference / 2) ** 2;

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * angularDistance;
};

export const findNearestShelter = (
  from: Coordinates,
  shelters: Shelter[],
): { shelter: Shelter; distanceKm: number } | null => {
  if (shelters.length === 0) {
    return null;
  }

  return shelters.reduce<{ shelter: Shelter; distanceKm: number } | null>((nearest, shelter) => {
    const distanceKm = calculateDistance(from, { lat: shelter.lat, lng: shelter.lng });

    if (!nearest || distanceKm < nearest.distanceKm) {
      return { shelter, distanceKm };
    }

    return nearest;
  }, null);
};
