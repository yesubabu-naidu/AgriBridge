import express from 'express';
import { query } from '../config/db.js';
import { get7DayForecast } from '../services/weatherService.js';
import { generateAIWeatherAnalysis } from '../services/weatherAiService.js';

const router = express.Router();

// GET /api/weather/forecast - 7-Day Weather & AI Agronomic Advisory
router.get('/forecast', async (req, res) => {
  try {
    const {
      farmer_id = 1,
      language = 'en',
      location: queryLoc,
      district: queryDistrict,
      lat: queryLat,
      lon: queryLon
    } = req.query;

    // 1. Fetch Farmer Saved Context
    let farmerContext = {
      location: 'Ongole',
      district: 'Prakasam',
      state: 'Andhra Pradesh',
      primary_crops: 'Paddy, Tomato, Chilli, Cotton',
      soil_type: 'Loamy',
      irrigation_method: 'Drip',
      season: 'Kharif',
      lat: 15.5057,
      lon: 80.0499
    };

    const contextRows = await query('SELECT * FROM farmer_agricultural_context WHERE farmer_id = ?', [farmer_id]);
    if (contextRows && contextRows.length > 0) {
      farmerContext = { ...farmerContext, ...contextRows[0] };
    }

    const locationName = queryLoc || farmerContext.location || 'Ongole';
    const districtName = queryDistrict || farmerContext.district || 'Prakasam';
    const stateName = farmerContext.state || 'Andhra Pradesh';
    const lat = queryLat ? Number(queryLat) : null;
    const lon = queryLon ? Number(queryLon) : null;

    // 2. Fetch 7-Day Forecast (Cached or API)
    const forecastData = await get7DayForecast({
      location: locationName,
      district: districtName,
      state: stateName,
      lat,
      lon
    });

    const activeFarmerContext = {
      ...farmerContext,
      location: locationName,
      district: districtName
    };

    // 3. Generate AI Agronomic Advisories & Alerts
    const aiAnalysis = await generateAIWeatherAnalysis({
      forecastData,
      farmerContext: activeFarmerContext,
      language
    });

    res.json({
      success: true,
      location: forecastData.location,
      today: forecastData.today,
      forecast: forecastData.forecast,
      aiAnalysis,
      isCached: forecastData.isCached || false,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather Forecast API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve the 7-day weather forecast at this time. Please try again in a moment.',
      error: error.message
    });
  }
});

// POST /api/weather/location - Update Farmer Weather Location
router.post('/location', async (req, res) => {
  try {
    const {
      farmer_id = 1,
      location = 'Ongole',
      district = 'Prakasam',
      state = 'Andhra Pradesh',
      lat = 15.5057,
      lon = 80.0499
    } = req.body;

    await query(
      `INSERT INTO farmer_agricultural_context
       (farmer_id, location, district, state)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (farmer_id)
       DO UPDATE SET
         location = EXCLUDED.location,
         district = EXCLUDED.district,
         state = EXCLUDED.state`,
      [farmer_id, location, district, state]
    );

    res.json({
      success: true,
      message: `Weather location updated to ${district}, ${location} successfully!`,
      location: { location, district, state, lat, lon }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
