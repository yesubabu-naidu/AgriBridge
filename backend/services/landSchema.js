// Canonical lands fields and aliases for seamless compatibility
export const LAND_SELECT = `
  l.*,
  l.land_name,
  l.acres,
  l.lease_price,
  l.owner_id,
  l.land_name AS land_type,
  l.acres AS area_acres,
  l.lease_price AS price_per_year,
  l.owner_id AS landowner_id
`;

export function normalizeLandInput(body = {}) {
  const land_name = String(body.land_name ?? body.land_type ?? '').trim();
  const location = String(body.location ?? '').trim();
  const acres = Number(body.acres ?? body.area_acres);
  const lease_price = Number(body.lease_price ?? body.price_per_year ?? body.price_per_acre);
  const description = String(body.description ?? '').trim();

  if (!land_name || !location || !Number.isFinite(acres) || acres <= 0 || !Number.isFinite(lease_price) || lease_price <= 0) {
    const error = new Error('Land name, location, area in acres, and annual price must be valid values.');
    error.status = 400;
    throw error;
  }

  return {
    land_name,
    land_type: land_name,
    location,
    acres,
    area_acres: acres,
    lease_price,
    price_per_year: lease_price,
    description
  };
}
