// The live `lands` table is deliberately kept as the source of truth here.
// Presentation aliases keep the existing client readable while callers migrate
// to the canonical field names below.
export const LAND_SELECT = `
  l.*,
  l.land_type AS land_name,
  l.area_acres AS acres,
  l.price_per_year AS lease_price,
  l.land_type AS soil_type
`;

export function normalizeLandInput(body = {}) {
  const land_type = String(body.land_type ?? body.land_name ?? '').trim();
  const location = String(body.location ?? '').trim();
  const area_acres = Number(body.area_acres ?? body.acres);
  const price_per_year = Number(body.price_per_year ?? body.lease_price ?? body.price_per_acre);
  const description = String(body.description ?? '').trim();

  if (!land_type || !location || !Number.isFinite(area_acres) || area_acres <= 0 || !Number.isFinite(price_per_year) || price_per_year <= 0) {
    const error = new Error('Land type, location, area in acres, and annual price must be valid values.');
    error.status = 400;
    throw error;
  }

  return { land_type, location, area_acres, price_per_year, description };
}
