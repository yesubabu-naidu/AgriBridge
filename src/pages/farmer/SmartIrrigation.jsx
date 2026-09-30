import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function SmartIrrigation() {
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Core Form Input State
  const [formData, setFormData] = useState({
    crop_type: 'Tomato',
    growth_stage: 'Vegetative',
    soil_moisture: 28,
    soil_type: 'Loamy',
    temperature: 33,
    humidity: 40,
    rainfall_mm: 0,
    rain_probability: 15,
    wind_speed: 10,
    solar_radiation: 22,
    field_area: 2.0,
    last_irrigation_hours: 48,
    available_water: 50000,
    irrigation_method: 'Drip'
  });

  // Dynamic Engine Results & Stats State
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total_consumed_litres: 18500,
    total_saved_litres: 4625,
    total_events: 7,
    efficiency_score: 92.5
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const rec = await api.getLatestIrrigationRecommendation(1);
      const histData = await api.getIrrigationHistory(1);
      const statsData = await api.getIrrigationStats(1);

      if (rec) setRecommendation(rec);
      if (histData && histData.records) setHistory(histData.records);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.warn('Initial irrigation load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateRecommendation = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccessToast('');
    setErrorToast('');

    try {
      const res = await api.generateIrrigationRecommendation(formData);
      setRecommendation(res);
      setSuccessToast('✅ Intelligent Irrigation Recommendation generated successfully!');
    } catch (err) {
      setErrorToast('Failed to generate recommendation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLiveWeather = async () => {
    setLoading(true);
    try {
      const weather = await api.getIrrigationWeather(15.5057, 80.0499);
      setFormData((prev) => ({
        ...prev,
        temperature: weather.temperature || prev.temperature,
        humidity: weather.humidity || prev.humidity,
        rain_probability: weather.rain_probability || prev.rain_probability,
        wind_speed: weather.wind_speed || prev.wind_speed
      }));
      setSuccessToast(`🌤️ Live Weather Data Synced: ${weather.temperature}°C, ${weather.humidity}% Humidity`);
    } catch (err) {
      setErrorToast('Weather sync notice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIrrigateNow = async () => {
    if (!recommendation) return;
    setLoading(true);
    try {
      await api.recordIrrigation({
        field_id: 1,
        farmer_id: 1,
        recommendation_id: recommendation.id || null,
        water_used_litres: recommendation.water_litres || 2500,
        duration_minutes: recommendation.duration_minutes || 40,
        method_used: recommendation.best_method || 'Drip'
      });

      setSuccessToast('⚡ "Irrigate Now" command executed! Water delivery started.');
      // Refresh history & stats
      const histData = await api.getIrrigationHistory(1);
      const statsData = await api.getIrrigationStats(1);
      if (histData && histData.records) setHistory(histData.records);
      if (statsData) setStats(statsData);
    } catch (err) {
      setErrorToast('Failed to record irrigation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleIrrigation = async () => {
    if (!recommendation) return;
    setLoading(true);
    try {
      await api.scheduleIrrigation({
        field_id: 1,
        farmer_id: 1,
        water_used_litres: recommendation.water_litres || 2500,
        duration_minutes: recommendation.duration_minutes || 40,
        method_used: recommendation.best_method || 'Drip',
        scheduled_time: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
      });

      setSuccessToast(`📅 Irrigation scheduled for tomorrow at ${recommendation.best_time_window}!`);
      const histData = await api.getIrrigationHistory(1);
      if (histData && histData.records) setHistory(histData.records);
    } catch (err) {
      setErrorToast('Failed to schedule irrigation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preset Scenario Handlers
  const loadScenario = (type) => {
    if (type === 'dry') {
      setFormData((prev) => ({
        ...prev,
        soil_moisture: 18,
        temperature: 37,
        humidity: 25,
        rain_probability: 5,
        rainfall_mm: 0
      }));
    } else if (type === 'rain') {
      setFormData((prev) => ({
        ...prev,
        soil_moisture: 42,
        temperature: 26,
        humidity: 82,
        rain_probability: 75,
        rainfall_mm: 18
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        soil_moisture: 36,
        temperature: 30,
        humidity: 50,
        rain_probability: 10,
        rainfall_mm: 0
      }));
    }
  };

  return (
    <div className="smart-irrigation-page pb-5 px-1 px-sm-2 px-md-3">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <span className="eyebrow text-uppercase text-muted extra-small d-block mb-1">AGRIBRAIN AI PRECISION AGRICULTURE</span>
          <h2 className="fw-black mb-1 text-success fs-3 fs-sm-2 d-flex align-items-center gap-2">
            💧 Smart Irrigation Recommendation Engine
          </h2>
          <p className="text-muted small mb-0">
            Real-time crop evapotranspiration, soil moisture analysis & LLM agronomic advisories.
          </p>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          <button className="btn btn-outline-success btn-sm w-100 w-sm-auto" onClick={handleFetchLiveWeather} disabled={loading}>
            <i className="bi bi-cloud-sun me-1"></i> Sync Live Weather
          </button>
          <button className="btn btn-success btn-sm w-100 w-sm-auto" onClick={handleGenerateRecommendation} disabled={loading}>
            <i className="bi bi-cpu me-1"></i> Run AI Engine
          </button>
        </div>
      </div>

      {/* Notifications / Toast */}
      {successToast && (
        <div className="alert alert-success alert-dismissible fade show extra-small" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successToast}
          <button type="button" className="btn-close" onClick={() => setSuccessToast('')}></button>
        </div>
      )}

      {errorToast && (
        <div className="alert alert-danger alert-dismissible fade show extra-small" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorToast}
          <button type="button" className="btn-close" onClick={() => setErrorToast('')}></button>
        </div>
      )}

      {/* Warnings & Critical Alert Banners */}
      {formData.soil_moisture < 20 && (
        <div className="alert alert-warning border-warning d-flex align-items-center gap-3 mb-4 p-3">
          <i className="bi bi-exclamation-diamond-fill fs-3 text-danger flex-shrink-0"></i>
          <div className="extra-small">
            <strong className="d-block text-danger fs-6 mb-1">⚠️ Dry Soil Warning (Moisture: {formData.soil_moisture}%)</strong>
            Soil moisture is severely below the crop wilting threshold. Immediate drip irrigation recommended.
          </div>
        </div>
      )}

      {formData.rain_probability >= 60 && (
        <div className="alert alert-info border-info d-flex align-items-center gap-3 mb-4 p-3">
          <i className="bi bi-cloud-rain-heavy-fill fs-3 text-primary flex-shrink-0"></i>
          <div className="extra-small">
            <strong className="d-block text-primary fs-6 mb-1">🌧️ Heavy Rainfall Warning ({formData.rain_probability}%)</strong>
            Precipitation likelihood is high over the next 24 hours. Hold off automated irrigation to prevent waterlogging.
          </div>
        </div>
      )}

      {/* Dashboard Sensor Stat Cards (6 Grid - Responsive 2 per row on mobile, 6 on desktop) */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-2 p-sm-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-truncate me-1">MOISTURE</span>
              <i className="bi bi-moisture text-primary fs-6"></i>
            </div>
            <h3 className="fw-black mb-1 fs-4">{formData.soil_moisture}%</h3>
            <div className="progress mt-2" style={{ height: '5px' }}>
              <div 
                className={`progress-bar ${formData.soil_moisture < 25 ? 'bg-danger' : formData.soil_moisture > 45 ? 'bg-info' : 'bg-success'}`} 
                style={{ width: `${formData.soil_moisture}%` }}
              ></div>
            </div>
            <small className="text-muted extra-small mt-1 d-block text-truncate">
              {formData.soil_moisture < 25 ? 'Critical Low' : 'Optimal Zone'}
            </small>
          </div>
        </div>

        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-2 p-sm-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-truncate me-1">TEMP</span>
              <i className="bi bi-thermometer-half text-danger fs-6"></i>
            </div>
            <h3 className="fw-black mb-1 fs-4">{formData.temperature}°C</h3>
            <span className="badge bg-light text-danger border border-danger extra-small w-100 mt-2 text-truncate">
              {formData.temperature > 34 ? '🔥 High Stress' : 'Normal Range'}
            </span>
          </div>
        </div>

        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-2 p-sm-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-truncate me-1">HUMIDITY</span>
              <i className="bi bi-droplet-half text-info fs-6"></i>
            </div>
            <h3 className="fw-black mb-1 fs-4">{formData.humidity}%</h3>
            <span className="badge bg-light text-info border border-info extra-small w-100 mt-2 text-truncate">
              {formData.humidity < 35 ? 'Dry Air' : 'Moderate'}
            </span>
          </div>
        </div>

        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-2 p-sm-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-truncate me-1">RAIN PROB</span>
              <i className="bi bi-cloud-rain text-primary fs-6"></i>
            </div>
            <h3 className="fw-black mb-1 fs-4">{formData.rain_probability}%</h3>
            <small className="text-muted extra-small mt-2 d-block text-truncate">
              {formData.rainfall_mm > 0 ? `${formData.rainfall_mm}mm Rain` : 'No Rain'}
            </small>
          </div>
        </div>

        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-2 p-sm-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-truncate me-1">WATER AVAIL</span>
              <i className="bi bi-water text-primary fs-6"></i>
            </div>
            <h3 className="fw-black mb-1 fs-4">{(formData.available_water / 1000).toFixed(0)}k L</h3>
            <div className="progress mt-2" style={{ height: '5px' }}>
              <div className="progress-bar bg-primary" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>

        <div className="col-6 col-sm-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-2 p-sm-3 bg-success text-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-white-50 extra-small fw-bold text-truncate me-1">SAVED</span>
              <i className="bi bi-piggy-bank fs-6"></i>
            </div>
            <h3 className="fw-black mb-1 fs-4">{(stats.total_saved_litres / 1000).toFixed(1)}k L</h3>
            <small className="text-white-50 extra-small mt-1 d-block text-truncate">
              ⚡ {stats.efficiency_score}% Efficiency
            </small>
          </div>
        </div>
      </div>

      {/* Main Split Layout: AI Recommendation Output & Parameter Form */}
      <div className="row g-3 g-md-4 mb-4">
        {/* Left Column: Smart AI Recommendation Decision Card */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className={`p-3 p-sm-4 ${recommendation && recommendation.is_required ? 'bg-light-success border-bottom border-success' : 'bg-light-info border-bottom border-info'}`}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="eyebrow text-uppercase extra-small">AI RECOMMENDATION DECISION</span>
                {recommendation && (
                  <span className={`badge ${recommendation.priority === 'High' ? 'bg-danger' : recommendation.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                    PRIORITY: {recommendation.priority || 'NORMAL'}
                  </span>
                )}
              </div>

              {recommendation && recommendation.is_required ? (
                <div>
                  <h3 className="fw-black text-success mb-2 d-flex align-items-center gap-2 fs-4">
                    💧 Irrigation Recommended
                  </h3>
                  <p className="text-secondary small mb-3">{recommendation.reason_text}</p>

                  <div className="row g-2 mb-3">
                    <div className="col-6 col-sm-3">
                      <div className="p-2 bg-white rounded border text-center h-100">
                        <small className="text-muted extra-small d-block text-truncate">WATER NEEDED</small>
                        <span className="fw-bold text-success fs-6">
                          {Number(recommendation.water_litres || 0).toLocaleString()} L
                        </span>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="p-2 bg-white rounded border text-center h-100">
                        <small className="text-muted extra-small d-block text-truncate">DURATION</small>
                        <span className="fw-bold text-dark fs-6">{recommendation.duration_minutes} Mins</span>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="p-2 bg-white rounded border text-center h-100">
                        <small className="text-muted extra-small d-block text-truncate">METHOD</small>
                        <span className="fw-bold text-primary fs-6">{recommendation.best_method}</span>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="p-2 bg-white rounded border text-center h-100">
                        <small className="text-muted extra-small d-block text-truncate">BEST WINDOW</small>
                        <span className="fw-bold text-dark extra-small d-block text-truncate">{recommendation.best_time_window}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="fw-black text-primary mb-2 d-flex align-items-center gap-2 fs-4">
                    🌧️ Irrigation Not Required
                  </h3>
                  <p className="text-secondary small mb-3">
                    {recommendation ? recommendation.reason_text : 'Soil moisture is optimal and rainfall is expected.'}
                  </p>
                </div>
              )}

              {/* RAG LLM Insight Box */}
              <div className="p-3 bg-white rounded border border-light mt-3">
                <h6 className="fw-bold text-success mb-1 d-flex align-items-center gap-2 extra-small">
                  <i className="bi bi-robot"></i> Agronomic RAG Advisory Note
                </h6>
                <p className="text-muted extra-small mb-0">
                  {recommendation?.ai_insights || 'Optimal water management maintains soil aeration and maximizes yield.'}
                </p>
              </div>
            </div>

            <div className="card-body p-3 p-sm-4 bg-white d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="extra-small fw-bold text-uppercase text-muted">Crop Water Demand (ETc)</span>
                  <span className="fw-bold text-dark extra-small">{recommendation?.crop_water_req || 4.5} mm/day</span>
                </div>
                <div className="progress mb-3" style={{ height: '8px' }}>
                  <div className="progress-bar bg-success" style={{ width: `${Math.min(100, (recommendation?.crop_water_req || 4.5) * 15)}%` }}></div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="extra-small fw-bold text-uppercase text-muted">Water Efficiency Score</span>
                  <span className="fw-bold text-success extra-small">{stats.efficiency_score}%</span>
                </div>
                <div className="progress mb-4" style={{ height: '8px' }}>
                  <div className="progress-bar bg-info" style={{ width: `${stats.efficiency_score}%` }}></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row g-2 pt-2">
                <div className="col-12 col-sm-6">
                  <button 
                    className="btn btn-success btn-md w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                    onClick={handleIrrigateNow}
                    disabled={loading || !recommendation?.is_required}
                  >
                    <i className="bi bi-play-circle-fill"></i> Irrigate Now
                  </button>
                </div>
                <div className="col-12 col-sm-6">
                  <button 
                    className="btn btn-outline-success btn-md w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                    onClick={handleScheduleIrrigation}
                    disabled={loading}
                  >
                    <i className="bi bi-calendar-plus"></i> Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters Form */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white py-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
              <h5 className="fw-bold mb-0 fs-6">🌾 Agricultural & Sensor Inputs</h5>
              <div className="btn-group btn-group-sm w-100 w-sm-auto">
                <button className="btn btn-outline-secondary extra-small" onClick={() => loadScenario('dry')}>Dry Soil</button>
                <button className="btn btn-outline-secondary extra-small" onClick={() => loadScenario('rain')}>Rain</button>
                <button className="btn btn-outline-secondary extra-small" onClick={() => loadScenario('normal')}>Optimal</button>
              </div>
            </div>

            <div className="card-body p-3 p-sm-4">
              <form onSubmit={handleGenerateRecommendation} className="row g-2 g-sm-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label extra-small fw-bold">Crop Type *</label>
                  <select name="crop_type" className="form-select form-select-sm" value={formData.crop_type} onChange={handleInputChange}>
                    <option value="Tomato">Tomato</option>
                    <option value="Rice">Rice</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Maize">Maize</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label extra-small fw-bold">Growth Stage *</label>
                  <select name="growth_stage" className="form-select form-select-sm" value={formData.growth_stage} onChange={handleInputChange}>
                    <option value="Seedling">Seedling</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>

                <div className="col-6 col-sm-6">
                  <label className="form-label extra-small fw-bold">Soil Moisture (%) *</label>
                  <input type="number" name="soil_moisture" className="form-control form-control-sm" value={formData.soil_moisture} onChange={handleInputChange} min="0" max="100" />
                </div>

                <div className="col-6 col-sm-6">
                  <label className="form-label extra-small fw-bold">Soil Type *</label>
                  <select name="soil_type" className="form-select form-select-sm" value={formData.soil_type} onChange={handleInputChange}>
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Clay">Clay</option>
                    <option value="Silty">Silty</option>
                  </select>
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Temp (°C)</label>
                  <input type="number" name="temperature" className="form-control form-control-sm" value={formData.temperature} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Humidity (%)</label>
                  <input type="number" name="humidity" className="form-control form-control-sm" value={formData.humidity} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Rain Prob. (%)</label>
                  <input type="number" name="rain_probability" className="form-control form-control-sm" value={formData.rain_probability} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Recent Rain (mm)</label>
                  <input type="number" name="rainfall_mm" className="form-control form-control-sm" value={formData.rainfall_mm} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Wind (km/h)</label>
                  <input type="number" name="wind_speed" className="form-control form-control-sm" value={formData.wind_speed} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Solar Rad.</label>
                  <input type="number" name="solar_radiation" className="form-control form-control-sm" value={formData.solar_radiation} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Area (acres)</label>
                  <input type="number" step="0.1" name="field_area" className="form-control form-control-sm" value={formData.field_area} onChange={handleInputChange} />
                </div>

                <div className="col-6 col-sm-4">
                  <label className="form-label extra-small fw-bold">Water (Litres)</label>
                  <input type="number" name="available_water" className="form-control form-control-sm" value={formData.available_water} onChange={handleInputChange} />
                </div>

                <div className="col-12 col-sm-4">
                  <label className="form-label extra-small fw-bold">Method *</label>
                  <select name="irrigation_method" className="form-select form-select-sm" value={formData.irrigation_method} onChange={handleInputChange}>
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Sprinkler">Sprinkler System</option>
                    <option value="Flood">Flood Irrigation</option>
                  </select>
                </div>

                <div className="col-12 mt-3">
                  <button type="submit" className="btn btn-success btn-md w-100 fw-bold" disabled={loading}>
                    {loading ? (
                      <span><span className="spinner-border spinner-border-sm me-2"></span>Computing Recommendation...</span>
                    ) : (
                      <span>⚡ Generate Recommendation</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visualizations Section (Soil Moisture & Temperature Trends) */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-white py-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
          <h5 className="fw-bold mb-0 fs-6">📊 Field Sensor Visualizations & Irrigation Analytics</h5>
          <span className="badge bg-light-green text-success border border-success extra-small">Live Sensor Sync</span>
        </div>

        <div className="card-body p-3 p-sm-4">
          <div className="row g-4">
            {/* Moisture Trend Chart */}
            <div className="col-12 col-md-6">
              <h6 className="fw-bold text-muted extra-small text-uppercase mb-2">Soil Moisture Trend vs Depletion Threshold (%)</h6>
              <div className="p-2 p-sm-3 bg-light rounded border text-center position-relative" style={{ height: '180px' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Threshold Target Line */}
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#28a745" strokeDasharray="4" strokeWidth="2" />
                  <text x="10" y="55" fill="#28a745" fontSize="10" fontWeight="bold">Target Threshold (35%)</text>
                  
                  {/* Moisture Curve */}
                  <path 
                    d="M 0,110 Q 80,40 160,95 T 320,50 T 400,80" 
                    fill="none" 
                    stroke="#0d6efd" 
                    strokeWidth="3" 
                  />
                  {/* Fill Area */}
                  <path 
                    d="M 0,110 Q 80,40 160,95 T 320,50 T 400,80 L 400,150 L 0,150 Z" 
                    fill="rgba(13, 110, 253, 0.1)" 
                  />
                </svg>
                <div className="d-flex justify-content-between text-muted extra-small mt-1 px-1">
                  <span>Mon</span><span>Wed</span><span>Fri</span><span>Today ({formData.soil_moisture}%)</span>
                </div>
              </div>
            </div>

            {/* Temperature & Water Usage Chart */}
            <div className="col-12 col-md-6">
              <h6 className="fw-bold text-muted extra-small text-uppercase mb-2">Temperature & Evapotranspiration Rate</h6>
              <div className="p-2 p-sm-3 bg-light rounded border text-center position-relative" style={{ height: '180px' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Temperature Curve */}
                  <path 
                    d="M 0,90 Q 100,20 200,45 T 400,30" 
                    fill="none" 
                    stroke="#dc3545" 
                    strokeWidth="3" 
                  />
                  <path 
                    d="M 0,90 Q 100,20 200,45 T 400,30 L 400,150 L 0,150 Z" 
                    fill="rgba(220, 53, 69, 0.08)" 
                  />
                </svg>
                <div className="d-flex justify-content-between text-muted extra-small mt-1 px-1">
                  <span>06:00 AM</span><span>12:00 PM</span><span>06:00 PM</span><span>Now ({formData.temperature}°C)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Irrigation Records Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 fs-6">📜 Recent Irrigation Executions</h5>
          <span className="badge bg-secondary extra-small">{history.length} Events</span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light extra-small text-uppercase">
                <tr>
                  <th>Event ID</th>
                  <th>Water Used</th>
                  <th>Duration</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold extra-small">#IRR-{item.id}</td>
                      <td className="text-success fw-bold extra-small">{Number(item.water_used_litres).toLocaleString()} L</td>
                      <td className="extra-small">{item.duration_minutes} Mins</td>
                      <td>
                        <span className="badge bg-light text-dark border extra-small">{item.method_used}</span>
                      </td>
                      <td>
                        <span className={`badge extra-small ${item.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="extra-small text-muted">
                        {new Date(item.executed_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted extra-small">
                      No past irrigation executions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
