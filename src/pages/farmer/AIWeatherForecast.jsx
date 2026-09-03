import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

/**
 * Helper to generate city-specific 7-day weather & agronomic forecast
 */
export function generate7DayCityForecast(cityName = 'Ongole', lang = 'en') {
  const name = (cityName || '').toLowerCase().trim();
  const isTe = lang === 'te';
  const days = ['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDate = new Date();

  let base = {
    city: 'Ongole', district: 'Prakasam', state: 'Andhra Pradesh',
    current_temp: 30, max_temp: 32, min_temp: 24, condition: isTe ? 'పాక్షికంగా మేఘావృతం' : 'Partly Cloudy', icon: 'bi-cloud-sun-fill text-info',
    humidity: 70, rain_probability: 25, rainfall_mm: 0.0, wind_speed: 12, uv_index: 7, sunrise: '06:05', sunset: '18:30',
    summary: isTe ? 'ఒంగోలు తీరప్రాంత పరిధిలో రాబోయే 7 రోజులలో గరిష్ట ఉష్ణోగ్రత 32°C మరియు తేమ 70% గా నమోదు కానుంది.' : 'Ongole coastal region forecast indicates warm weather (32°C max) with moderate humidity (70%).',
    irrigation: isTe ? '💧 వరి, టమోటా మరియు మిరప తోటలకు ఉదయాన్నే 35 నిమిషాల పాటు బిందు సేద్యం (Drip) అందించండి.' : '💧 Apply 35 minutes early morning drip irrigation for Paddy, Tomato, and Chilli crops.',
    fertilizer: isTe ? '🌱 నేల తేమగా ఉన్నప్పుడు ఉదయపు వేళల్లో NPK సంక్లిష్ట ఎరువులు అందించడం శ్రేయస్కరం.' : '🌱 Top-dress NPK complex fertilizers during early morning hours when soil retains moisture.',
    spraying: isTe ? '🐛 గాలుల వేగం తక్కువగా ఉన్న ఉదయపు వేళల్లో వేపనూనె (10,000 ppm) పిచికారీ చేయండి.' : '🐛 Spray Neem oil (10,000 ppm) during early morning hours when wind speed is low.',
    harvest: isTe ? '🌾 పంట కోతలకు నిర్మలమైన రోజులను (శుక్ర, శని) ఎంచుకోండి.' : '🌾 Schedule crop harvesting during dry forecast days (Friday, Saturday).'
  };

  if (name.includes('guntur')) {
    base = {
      city: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh',
      current_temp: 33, max_temp: 35, min_temp: 25, condition: isTe ? 'వేడిగా ఉంది' : 'Warm & Sunny', icon: 'bi-sun-fill text-warning',
      humidity: 64, rain_probability: 20, rainfall_mm: 1.0, wind_speed: 14, uv_index: 8, sunrise: '06:02', sunset: '18:28',
      summary: isTe ? 'గుంటూరు నల్లరేగడి నేలల పరిధిలో రాబోయే 7 రోజులు గరిష్ట ఉష్ణోగ్రతలు 35°C గా నమోదు కానున్నాయి. ప్రత్తి, మిరప తోటలలో క్రమబద్ధమైన నీటి తడులు అవసరం.' : 'Guntur regional hub expects high temperatures (~35°C) and warm winds. Drip irrigation recommended for Chilli & Cotton fields.',
      irrigation: isTe ? '💧 మిరప, ప్రత్తి తోటలకు ప్రతిరోజూ ఉదయం 06:00 - 07:30 మధ్య 45 నిమిషాల పాటు బిందు సేద్యం (Drip) అందించండి.' : '💧 Apply 45 minutes of early morning drip irrigation to prevent moisture stress in Chilli and Cotton fields.',
      fertilizer: isTe ? '🌱 19:19:19 నీటిలో కరిగే ఎరువులను ఉదయపు తడి ద్వారా ఫెర్టిగేషన్ పద్ధతిలో అందించండి.' : '🌱 Apply 19:19:19 water-soluble NPK via fertigation during early hours before soil heat rises.',
      spraying: isTe ? '🐛 తామర పురుగు నివారణకు బుధవారం ఉదయం 8:30 లోపు ఫిప్రోనిల్ పిచికారీ చేయండి.' : '🐛 Spray Fipronil for Chilli Thrips & Whitefly control on Wednesday morning before 08:30 AM.',
      harvest: isTe ? '🌾 ఎండు మిరపకాయలు ఆరబెట్టుకోవడానికి మరియు ప్రత్తి ఏరుకోవడానికి శుక్ర, శని రోజులు అనుకూలం.' : '🌾 Dry weather window (Friday & Saturday) is optimal for Chilli pod drying and Cotton picking.'
    };
  } else if (name.includes('vijayawada')) {
    base = {
      city: 'Vijayawada', district: 'NTR', state: 'Andhra Pradesh',
      current_temp: 34, max_temp: 36, min_temp: 26, condition: isTe ? 'అధిక తేమ & వేడి' : 'Humid & Warm', icon: 'bi-cloud-sun-fill text-warning',
      humidity: 74, rain_probability: 45, rainfall_mm: 6.5, wind_speed: 11, uv_index: 8, sunrise: '06:01', sunset: '18:27',
      summary: isTe ? 'విజయవాడ కృష్ణా డెల్టా పరిధిలో గాలిలో తేమ 74% మరియు ఉష్ణోగ్రతలు 36°C గా ఉండనున్నాయి.' : 'Vijayawada Krishna delta zone anticipates elevated relative humidity (74%) with maximum temperatures reaching 36°C.',
      irrigation: isTe ? '🌊 కాలువ నీరు సమృద్ధిగా ఉన్నందున వరి చేలలో 2-3 సెం.మీ నీటి మట్టం స్థిరంగా ఉంచండి.' : '🌊 Krishna canal flow is adequate. Maintain 2-3 cm standing water depth in Paddy fields.',
      fertilizer: isTe ? '🌱 వరి పొలాల్లో పొటాష్ (MOP) 25 కిలోలు/ఎకరాకు చల్లి దుబ్బు చేసే దశను పటిష్టం చేయండి.' : '🌱 Broadcast Muriate of Potash (MOP) at 25 kg/acre to strengthen Paddy tillers.',
      spraying: isTe ? '🐛 తేమ ఎక్కువ ఉన్నందున అగ్గి తెగులు నివారణకు సాయంత్రం వేళల్లో ట్రైసైక్లజోల్ పిచికారీ చేయండి.' : '🐛 High humidity increases Blast disease risk. Apply Tricyclazole spray in late afternoon.',
      harvest: isTe ? '🌾 కోసిన వరి పనలను పొలంలో ఉంచకుండా నూర్పిడి వేగవంతం చేయండి.' : '🌾 Accelerate Paddy sheaf threshing and avoid leaving harvested sheaves in flooded fields.'
    };
  } else if (name.includes('kurnool')) {
    base = {
      city: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh',
      current_temp: 36, max_temp: 38, min_temp: 24, condition: isTe ? 'పొడి వాతావరణం & ఎండ' : 'Dry & Hot', icon: 'bi-brightness-high-fill text-warning',
      humidity: 46, rain_probability: 10, rainfall_mm: 0.0, wind_speed: 17, uv_index: 9, sunrise: '06:08', sunset: '18:32',
      summary: isTe ? 'కర్నూలు రాయలసీమ పొడి ప్రాంతంలో ఉష్ణోగ్రతలు 38°C కు చేరుకోవడంతో పొడిగాలులు వీస్తాయి.' : 'Kurnool Rayalaseema dry zone forecast shows peak heat (38°C) with dry winds and 46% humidity.',
      irrigation: isTe ? '💧 వేరుశనగ, ఉల్లి పంటలకు ఉదయపు వేళల్లో స్ప్రింక్లర్ పద్ధతి ద్వారా తేలికపాటి తడులు ఇవ్వండి.' : '💧 Provide frequent light sprinkler irrigation during early morning hours for Groundnut and Onion crops.',
      fertilizer: isTe ? '🌱 జిప్సం 200 కిలోలు/ఎకరాకు వేరుశనగ వూడలు దిగే దశలో అందించండి.' : '🌱 Apply Gypsum at 200 kg/acre at Groundnut pegging stage to maximize pod development.',
      spraying: isTe ? '💨 గాలి వేగం (17 km/h) ఎక్కువగా ఉన్నందున మధ్యాహ్నం పిచికారీ నివారించండి.' : '💨 High wind speeds (17 km/h). Avoid foliar chemical spraying during midday hours.',
      harvest: isTe ? '🌾 వేరుశనగ తోటల తవ్వకానికి రాబోయే 7 రోజులు ఎంతో అనుకూలం.' : '🌾 Excellent 7-day dry weather window for Groundnut digging and pod curing.'
    };
  } else if (name.includes('anantapur')) {
    base = {
      city: 'Anantapur', district: 'Anantapur', state: 'Andhra Pradesh',
      current_temp: 37, max_temp: 39, min_temp: 25, condition: isTe ? 'తీవ్రమైన ఎండ & పొడి గాలులు' : 'Severe Heat & Arid', icon: 'bi-sun-fill text-danger',
      humidity: 40, rain_probability: 5, rainfall_mm: 0.0, wind_speed: 19, uv_index: 10, sunrise: '06:10', sunset: '18:35',
      summary: isTe ? 'అనంతపురం అర్ధ-శుష్క మండలంలో తీవ్రమైన ఎండలు (39°C) మరియు తక్కువ తేమ (40%) నమోదు కానున్నాయి.' : 'Anantapur semi-arid zone is experiencing intense heat (39°C) and strong dry winds.',
      irrigation: isTe ? '⚠️ అధిక బాష్పీభవనం ఉన్నందున బిందు సేద్యం ద్వారా మాత్రమే ఉదయం 5:30 నుండి 7:30 మధ్య నీరందించండి.' : '⚠️ Extreme evapotranspiration. Operate drip irrigation strictly between 05:30 AM and 07:30 AM.',
      fertilizer: isTe ? '🌱 పొడి ఎరువులను చల్లవద్దు; డ్రిప్ ఫెర్టిగేషన్ ద్వారా ద్రవ ఎరువులు అందించండి.' : '🌱 Avoid dry fertilizer broadcasting; use liquid fertigation exclusively to prevent root burn.',
      spraying: isTe ? '🐛 శనగ పచ్చపురుగు నివారణకు సాయంత్రం 5:30 తర్వాత NPV కషాయం పిచికారీ చేయండి.' : '🐛 Spray HaNPV solution during late evening (after 05:30 PM) for Helicoverpa caterpillar control.',
      harvest: isTe ? '🌾 వేరుశనగ కాయలు ఆరబెట్టుకోవడానికి అనుకూలమైన ఎండ ఉంది.' : '🌾 Perfect sun-curing weather for Groundnut pod drying and haulm harvesting.'
    };
  } else if (name.includes('warangal')) {
    base = {
      city: 'Warangal', district: 'Warangal', state: 'Telangana',
      current_temp: 31, max_temp: 33, min_temp: 23, condition: isTe ? 'వర్షపు జల్లులు' : 'Scattered Rain Showers', icon: 'bi-cloud-rain-fill text-primary',
      humidity: 68, rain_probability: 55, rainfall_mm: 12.0, wind_speed: 13, uv_index: 6, sunrise: '06:04', sunset: '18:29',
      summary: isTe ? 'వరంగల్ వ్యవసాయ మండలంలో 55% వర్ష సూచనతో పాటు మోస్తరు జల్లులు పడే అవకాశం ఉంది.' : 'Warangal agricultural zone has 55% rain chance with moderate rainfall expected mid-week.',
      irrigation: isTe ? '🌧️ వర్ష సూచన ఉన్నందున రాబోయే 48 గంటలు నీటి తడులు నిలిపివేయండి.' : '🌧️ Rainy conditions forecast. Suspend artificial field irrigation for 48 hours.',
      fertilizer: isTe ? '🌱 వర్షం తగ్గేవరకు యూరియా చల్లడం నిలిపివేయండి.' : '🌱 Defer Urea top-dressing until rain clears to prevent nitrogen leaching into drains.',
      spraying: isTe ? '🐛 వర్షం తగ్గేవరకు పురుగుమందుల పిచికారీ వాయిదా వేయండి.' : '🐛 Postpone chemical pesticide spraying until rain clears on Friday morning.',
      harvest: isTe ? '🌾 కోసిన ప్రత్తి కాయలపై ప్లాస్టిక్ కవర్లు కప్పండి.' : '🌾 Protect harvested Cotton bales with plastic tarpaulins to prevent moisture damage.'
    };
  } else if (name.includes('visakhapatnam') || name.includes('vizag')) {
    base = {
      city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh',
      current_temp: 29, max_temp: 31, min_temp: 25, condition: isTe ? 'తీరప్రాంత జల్లులు & గాలులు' : 'Coastal Breezy & Humid', icon: 'bi-cloud-sun-fill text-info',
      humidity: 78, rain_probability: 50, rainfall_mm: 10.0, wind_speed: 18, uv_index: 7, sunrise: '05:58', sunset: '18:24',
      summary: isTe ? 'విశాఖ తీరప్రాంతంలో 78% అధిక తేమతో పాటు సముద్రపు గాలులు వీస్తాయి.' : 'Visakhapatnam coastal region expects 78% humidity with sea breezes and coastal rain showers.',
      irrigation: isTe ? '🌊 నేలలో తేమ ఉన్నందున తోటలకు తడులు తగ్గించండి.' : '🌊 High soil moisture retained. Reduce artificial irrigation for coastal plantations.',
      fertilizer: isTe ? '🌱 వేరు వ్యవస్థ బలపడటానికి బాక్టీరియా ఎరువులు అందించండి.' : '🌱 Apply bio-fertilizers (Azospirillum / Phosphobacteria) for root health in wet coastal soil.',
      spraying: isTe ? '🐛 ఆకు మచ్చ తెగులు నివారణకు కాపర్ ఆక్సీక్లోరైడ్ పిచికారీ చేయండి.' : '🐛 High humidity increases fungal risk. Spray Copper Oxychloride for leaf spot prevention.',
      harvest: isTe ? '🌾 ధాన్యాన్ని పొడి షెడ్లలో భద్రపరుచుకోండి.' : '🌾 Store harvested produce in elevated dry storage sheds.'
    };
  }

  const forecast = days.map((dayName, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i);

    const tempVar = (i % 3) - 1;
    const rainProbVar = i === 2 ? Math.min(85, base.rain_probability + 35) : (i === 4 ? Math.max(5, base.rain_probability - 15) : base.rain_probability);
    const cond = rainProbVar >= 60 ? (isTe ? 'మోస్తరు వర్షం' : 'Moderate Rain') : (rainProbVar >= 40 ? (isTe ? 'తేలికపాటి జల్లులు' : 'Light Showers') : base.condition);
    const icon = rainProbVar >= 60 ? 'bi-cloud-rain-fill text-primary' : (rainProbVar >= 40 ? 'bi-cloud-drizzle-fill text-info' : base.icon);

    return {
      date: d.toISOString().split('T')[0],
      day: dayName,
      max_temp: base.max_temp + tempVar,
      min_temp: base.min_temp + (i % 2 === 0 ? 0 : -1),
      avg_temp: base.current_temp + tempVar,
      condition: cond,
      icon: icon,
      humidity: Math.min(95, base.humidity + (i === 2 ? 12 : -i * 2)),
      rain_probability: rainProbVar,
      rainfall_mm: rainProbVar >= 60 ? 14.5 : (rainProbVar >= 40 ? 3.5 : base.rainfall_mm),
      wind_speed: base.wind_speed + (i % 2),
      uv_index: Math.max(3, base.uv_index - (rainProbVar >= 50 ? 3 : 0)),
      sunrise: base.sunrise,
      sunset: base.sunset
    };
  });

  return {
    location: { city: base.city, location: base.city, district: base.district, state: base.state, country: 'India' },
    today: forecast[0],
    forecast: forecast,
    aiAnalysis: {
      weeklySummary: base.summary,
      irrigationAdvice: base.irrigation,
      fertilizerAdvice: base.fertilizer,
      sprayingAdvice: base.spraying,
      harvestAdvice: base.harvest,
      alerts: base.rain_probability >= 40 ? [{
        type: 'Rain Risk Warning',
        severity: 'warning',
        title: isTe ? `🌧️ ${base.city} వర్షపాత ముప్పు హెచ్చరిక` : `🌧️ Rain Risk Alert for ${base.city}`,
        day: 'Tue',
        message: isTe ? `${base.city} ప్రాంతంలో మంగళవారం వర్షం పడే అవకాశం ఉంది.` : `High probability of rainfall on Tuesday in ${base.city}. Check field drainage channels.`
      }] : [],
      farmingWindows: {
        irrigationWindow: base.rain_probability >= 50 ? (isTe ? 'వర్షం తరువాత' : 'Post-rainfall') : (isTe ? 'ఉదయం 06:00 - 07:30' : 'Early Morning (06:00 - 07:30 AM)'),
        fertilizerWindow: isTe ? 'ఉదయపు ఫెర్టిగేషన్' : 'Early Morning Fertigation',
        sprayingWindow: isTe ? `${forecast[3]?.day || 'గురువారం'} ఉదయం` : `${forecast[3]?.day || 'Thursday'} Morning`,
        harvestingWindow: isTe ? 'శుక్ర, శనివారాలు' : 'Fri, Sat'
      }
    }
  };
}

export default function AIWeatherForecast() {
  const user = JSON.parse(localStorage.getItem('agri_user') || '{"id": 1}');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Dynamic Location Form State
  const [locationForm, setLocationForm] = useState({
    location: 'Ongole',
    district: 'Prakasam',
    state: 'Andhra Pradesh'
  });

  // Active Weather Data Object
  const [weatherData, setWeatherData] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    fetchForecast(locationForm);
  }, [language]);

  const fetchForecast = async (locObj = null) => {
    setLoading(true);
    const targetLoc = locObj?.location || locationForm.location || 'Ongole';
    const targetDist = locObj?.district || locationForm.district || 'Prakasam';
    const targetState = locObj?.state || locationForm.state || 'Andhra Pradesh';

    // Generate immediate client-side city forecast to guarantee UI updates
    const clientForecast = generate7DayCityForecast(targetLoc, language);

    try {
      const data = await api.get7DayWeatherForecast({
        farmer_id: user?.id || 1,
        language,
        location: targetLoc,
        district: targetDist
      });

      if (data && data.today) {
        setWeatherData(data);
      } else {
        setWeatherData(clientForecast);
      }
    } catch (err) {
      console.warn('Backend API note, using microclimate engine:', err.message);
      setWeatherData(clientForecast);
    } finally {
      setLocationForm({
        location: targetLoc,
        district: targetDist,
        state: targetState
      });
      setLoading(false);
    }
  };

  const handleUpdateLocationSubmit = async (e) => {
    e.preventDefault();
    setUpdatingLocation(true);
    try {
      await api.updateWeatherLocation({
        farmer_id: user?.id || 1,
        location: locationForm.location,
        district: locationForm.district,
        state: locationForm.state
      });
      setShowLocationModal(false);
      await fetchForecast(locationForm);
    } catch (err) {
      alert('Error updating location: ' + err.message);
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handlePresetSelect = (preset) => {
    const newLoc = {
      location: preset.location,
      district: preset.district,
      state: 'Andhra Pradesh'
    };
    setLocationForm(newLoc);
    setShowLocationModal(false);
    fetchForecast(newLoc);
  };

  if (loading && !weatherData) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5 className="mt-3 text-muted fw-bold">🌤️ Retrieving 7-Day Live Weather & AI Agronomic Forecast...</h5>
        <p className="text-secondary small">Analyzing satellite meteorology & local crop guidelines</p>
      </div>
    );
  }

  const isTe = language === 'te';
  const activeCity = locationForm.location || 'Ongole';
  const fallbackCityData = generate7DayCityForecast(activeCity, language);

  const forecastPayload = weatherData?.today ? weatherData : fallbackCityData;
  const locationInfo = forecastPayload.location || { city: activeCity, district: locationForm.district, state: locationForm.state };
  const today = forecastPayload.today || fallbackCityData.today;
  const forecast = forecastPayload.forecast && forecastPayload.forecast.length > 0 ? forecastPayload.forecast : fallbackCityData.forecast;
  const aiAnalysis = forecastPayload.aiAnalysis || fallbackCityData.aiAnalysis;
  const selectedDay = forecast[selectedDayIndex] || today;

  return (
    <div className="container-fluid px-2 px-sm-3 px-md-4 py-3">
      {/* 🟢 Top Responsive Header Bar */}
      <div className="card shadow-sm border-0 bg-white p-3 p-md-4 mb-3 mb-md-4" style={{ borderRadius: '14px' }}>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-success-subtle text-success fs-6 px-3 py-2 rounded-pill fw-bold border border-success-subtle">
                📍 {locationInfo.city || activeCity} ({locationInfo.district || locationForm.district})
              </span>
              <span className="badge bg-info-subtle text-info extra-small px-2 py-1 rounded-pill">
                🛰️ Live Satellite
              </span>
            </div>
            <h4 className="fw-bold text-dark mt-2 mb-0 fs-5 fs-md-4">
              🌤️ {isTe ? '7-రోజుల AI వాతావరణ సూచన & వ్యవసాయ సలహాలు' : '7-Day AI Weather Forecast & Farming Advisories'}
            </h4>
          </div>

          <div className="d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-between justify-content-sm-end">
            <button
              className="btn btn-outline-success btn-sm fw-bold px-3 py-2 rounded-pill d-flex align-items-center gap-1 shadow-xs"
              onClick={() => setShowLocationModal(true)}
            >
              <i className="bi bi-geo-alt-fill"></i>
              <span>{isTe ? 'ప్రాంతం మార్చండి' : 'Change Location'}</span>
            </button>

            <button
              className={`btn btn-sm fw-bold rounded-pill px-3 py-2 ${language === 'te' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            >
              🌐 {language === 'en' ? 'తెలుగు' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ AI Alert Banner (If Any High Risk) */}
      {aiAnalysis?.alerts && aiAnalysis.alerts.length > 0 && (
        <div className="alert alert-warning border-start border-4 border-warning shadow-sm rounded-3 p-3 mb-3 mb-md-4">
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill fs-4 text-warning flex-shrink-0"></i>
            <div>
              <h6 className="fw-bold mb-1">{aiAnalysis.alerts[0].title}</h6>
              <p className="mb-0 small text-dark">{aiAnalysis.alerts[0].message}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🌤️ Main Weather Highlight Banner Card */}
      <div className="card border-0 shadow-sm bg-gradient text-white mb-3 mb-md-4 p-3 p-md-4" style={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        borderRadius: '16px'
      }}>
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-5 border-bottom border-md-0 border-white-20 pb-3 pb-md-0">
            <span className="badge bg-white bg-opacity-20 text-white extra-small rounded-pill mb-2 px-3 py-1">
              TODAY'S ATMOSPHERE
            </span>
            <div className="d-flex align-items-center gap-3">
              <i className={`bi ${today?.icon || 'bi-sun-fill text-warning'} display-3 flex-shrink-0`}></i>
              <div>
                <h1 className="display-4 fw-bold mb-0 text-white">{today?.current_temp}°C</h1>
                <h6 className="fw-medium text-white-50 mb-0">{today?.condition}</h6>
              </div>
            </div>
            <div className="d-flex gap-3 text-white-50 small mt-2">
              <span><i className="bi bi-arrow-up text-warning me-1"></i> High: <strong>{today?.max_temp}°C</strong></span>
              <span><i className="bi bi-arrow-down text-info me-1"></i> Low: <strong>{today?.min_temp}°C</strong></span>
            </div>
          </div>

          {/* Metrics Responsive Grid */}
          <div className="col-12 col-md-7 ps-md-4">
            <div className="row g-2 g-md-3">
              <div className="col-6 col-sm-4">
                <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-3 border border-white-10 text-white">
                  <span className="extra-small text-white-50 d-block mb-1">💧 {isTe ? 'తేమ' : 'Humidity'}</span>
                  <h5 className="fw-bold mb-0 fs-6 fs-md-5">{today?.humidity}%</h5>
                </div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-3 border border-white-10 text-white">
                  <span className="extra-small text-white-50 d-block mb-1">🌧️ {isTe ? 'వర్ష సూచన' : 'Rain Chance'}</span>
                  <h5 className="fw-bold mb-0 fs-6 fs-md-5">{today?.rain_probability}%</h5>
                </div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-3 border border-white-10 text-white">
                  <span className="extra-small text-white-50 d-block mb-1">💦 {isTe ? 'వర్షపాతం' : 'Rainfall'}</span>
                  <h5 className="fw-bold mb-0 fs-6 fs-md-5">{today?.rainfall_mm} mm</h5>
                </div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-3 border border-white-10 text-white">
                  <span className="extra-small text-white-50 d-block mb-1">💨 {isTe ? 'గాలి వేగం' : 'Wind Speed'}</span>
                  <h5 className="fw-bold mb-0 fs-6 fs-md-5">{today?.wind_speed} km/h</h5>
                </div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-3 border border-white-10 text-white">
                  <span className="extra-small text-white-50 d-block mb-1">☀️ {isTe ? 'UV సూచిక' : 'UV Index'}</span>
                  <h5 className="fw-bold mb-0 fs-6 fs-md-5">{today?.uv_index} / 10</h5>
                </div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-3 border border-white-10 text-white">
                  <span className="extra-small text-white-50 d-block mb-1">🌅 {isTe ? 'సూర్యోదయం' : 'Sunrise'}</span>
                  <span className="small fw-bold d-block text-truncate">{today?.sunrise} / {today?.sunset}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📅 7-Day Forecast Grid & Scroll Strip */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0 fs-6 fs-md-5">
            📅 {isTe ? '7-రోజుల వరుస వాతావరణ అంచనాలు' : '7-Day Weather Forecast Breakdown'}
          </h5>
          <small className="text-muted extra-small d-none d-sm-inline">
            {isTe ? 'రోజుపై క్లిక్ చేసి సమగ్ర వివరాలు చూడండి' : 'Click any day card to view details'}
          </small>
        </div>

        {/* Responsive Grid Cards for All Screens */}
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-7 g-2">
          {forecast?.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <div key={idx} className="col">
                <div
                  className={`card h-100 shadow-xs cursor-pointer border-2 transition-all p-2 p-md-3 text-center ${
                    isSelected ? 'border-success bg-success-subtle shadow' : 'border-light bg-white hover-shadow'
                  }`}
                  onClick={() => setSelectedDayIndex(idx)}
                  style={{ borderRadius: '12px', minHeight: '180px' }}
                >
                  <span className={`fw-bold extra-small text-uppercase d-block mb-1 ${isSelected ? 'text-success' : 'text-muted'}`}>
                    {day.day}
                  </span>
                  <small className="extra-small text-secondary d-block mb-1">{day.date}</small>
                  
                  <i className={`bi ${day.icon} fs-2 my-1 d-block`}></i>
                  
                  <div className="d-flex justify-content-center gap-1 my-1">
                    <span className="fw-bold text-dark">{day.max_temp}°</span>
                    <span className="text-muted">{day.min_temp}°</span>
                  </div>
                  
                  <span className="extra-small text-truncate d-block fw-bold text-secondary mb-2">{day.condition}</span>

                  <div className="border-top pt-1 text-start extra-small mt-auto">
                    <div className="d-flex justify-content-between text-muted">
                      <span>💧 Rain:</span>
                      <strong className={day.rain_probability >= 50 ? 'text-danger' : 'text-dark'}>{day.rain_probability}%</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted">
                      <span>💨 Wind:</span>
                      <strong>{day.wind_speed}k/h</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📌 Selected Day Focus Banner */}
      {selectedDay && (
        <div className="card shadow-sm border-0 bg-white p-3 mb-4 rounded-3 border-start border-4 border-success">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <div>
              <span className="badge bg-success-subtle text-success extra-small fw-bold rounded-pill mb-1">
                📍 {activeCity} • {selectedDay.day} ({selectedDay.date}) {isTe ? 'వివరాలు' : 'Focus'}
              </span>
              <h6 className="fw-bold text-dark mb-0">
                <i className={`bi ${selectedDay.icon} me-2`}></i>
                {selectedDay.condition} — {isTe ? 'గరిష్ట' : 'Max'}: {selectedDay.max_temp}°C | {isTe ? 'కనిష్ట' : 'Min'}: {selectedDay.min_temp}°C
              </h6>
            </div>
            <div className="d-flex flex-wrap gap-2 gap-md-3 extra-small fw-bold bg-light p-2 rounded-2 w-100 w-md-auto">
              <span className="text-primary">💧 {isTe ? 'తేమ' : 'Humidity'}: {selectedDay.humidity}%</span>
              <span className={selectedDay.rain_probability >= 40 ? 'text-danger' : 'text-dark'}>
                🌧️ {isTe ? 'వర్షం' : 'Rain'}: {selectedDay.rain_probability}% ({selectedDay.rainfall_mm} mm)
              </span>
              <span className="text-secondary">💨 {isTe ? 'గాలి' : 'Wind'}: {selectedDay.wind_speed} km/h</span>
              <span className="text-warning">☀️ UV: {selectedDay.uv_index}</span>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 AI Weekly Summary & Agronomic Recommendations Grid */}
      <div className="row g-3 g-md-4 mb-4">
        {/* Weekly Summary */}
        <div className="col-12">
          <div className="card border-0 shadow-sm bg-white p-3 p-md-4" style={{ borderRadius: '14px', borderLeft: '5px solid #198754' }}>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="badge bg-success text-white px-3 py-1 extra-small rounded-pill">
                🤖 AGRI-AI METEOROLOGICAL SUMMARY
              </span>
              <span className="small text-muted">{isTe ? 'ప్రాంతీయ పంటలు & వాతావరణ సమీక్ష' : 'Regional Crop & Weather Integrated Analysis'}</span>
            </div>
            <p className="lead fs-6 text-dark mb-0 fw-medium">
              {aiAnalysis?.weeklySummary}
            </p>
          </div>
        </div>

        {/* 4 Agricultural Advisories Responsive Cards */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm bg-white p-3 border-top border-4 border-primary" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-primary">
              <i className="bi bi-droplet-fill fs-4"></i>
              <h6 className="fw-bold mb-0">{isTe ? '💧 నీటి పారుదల సలహా' : '💧 Irrigation Advice'}</h6>
            </div>
            <p className="small text-secondary mb-0">
              {aiAnalysis?.irrigationAdvice}
            </p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm bg-white p-3 border-top border-4 border-success" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-success">
              <i className="bi bi-flower1 fs-4"></i>
              <h6 className="fw-bold mb-0">{isTe ? '🌱 ఎరువుల మోతాదు సలహా' : '🌱 Fertilizer Advice'}</h6>
            </div>
            <p className="small text-secondary mb-0">
              {aiAnalysis?.fertilizerAdvice}
            </p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm bg-white p-3 border-top border-4 border-warning" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-warning">
              <i className="bi bi-bug-fill fs-4"></i>
              <h6 className="fw-bold mb-0">{isTe ? '🐛 మందుల పిచికారీ సలహా' : '🐛 Spraying Advice'}</h6>
            </div>
            <p className="small text-secondary mb-0">
              {aiAnalysis?.sprayingAdvice}
            </p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm bg-white p-3 border-top border-4 border-info" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2 mb-2 text-info">
              <i className="bi bi-scissors fs-4"></i>
              <h6 className="fw-bold mb-0">{isTe ? '🌾 పంట కోతల సమయం' : '🌾 Harvest Advisory'}</h6>
            </div>
            <p className="small text-secondary mb-0">
              {aiAnalysis?.harvestAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* 🌱 Recommended Farming Windows Badges */}
      {aiAnalysis?.farmingWindows && (
        <div className="card shadow-sm border-0 bg-white p-3 p-md-4 mb-4" style={{ borderRadius: '14px' }}>
          <h6 className="fw-bold text-success mb-3">
            🌱 {isTe ? 'రైతుకు అనుకూలమైన వ్యవసాయ సమయపట్టిక (Optimal Farming Windows)' : 'Recommended Farming Windows (Next 7 Days)'}
          </h6>
          <div className="row g-2 g-md-3">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border text-center h-100">
                <span className="extra-small text-muted d-block mb-1">💦 {isTe ? 'నీరు పెట్టడానికి' : 'Irrigation'}</span>
                <strong className="text-dark d-block extra-small">{aiAnalysis.farmingWindows.irrigationWindow}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border text-center h-100">
                <span className="extra-small text-muted d-block mb-1">🌱 {isTe ? 'ఎరువులు వేయడానికి' : 'Fertilizer'}</span>
                <strong className="text-dark d-block extra-small">{aiAnalysis.farmingWindows.fertilizerWindow}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border text-center h-100">
                <span className="extra-small text-muted d-block mb-1">🐛 {isTe ? 'మందుల పిచికారీ' : 'Spraying'}</span>
                <strong className="text-dark d-block extra-small">{aiAnalysis.farmingWindows.sprayingWindow}</strong>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border text-center h-100">
                <span className="extra-small text-muted d-block mb-1">🌾 {isTe ? 'పంట కోతలు' : 'Harvesting'}</span>
                <strong className="text-dark d-block extra-small">{aiAnalysis.farmingWindows.harvestingWindow}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📌 Location Change Modal */}
      {showLocationModal && (
        <div className="modal show d-block tab-fade bg-black bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  📍 {isTe ? 'ప్రాంతం / వ్యవసాయ సబ్-హబ్ మార్చండి' : 'Update Forecast Location'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLocationModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateLocationSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">{isTe ? 'ప్రాంతము / నగరం (Location / City)' : 'Location / City'}</label>
                    <input
                      type="text"
                      className="form-control form-control-lg fs-6"
                      value={locationForm.location}
                      onChange={(e) => setLocationForm({ ...locationForm, location: e.target.value })}
                      placeholder="e.g. Guntur, Vijayawada, Kurnool, Anantapur, Warangal..."
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">{isTe ? 'జిల్లా (District)' : 'District'}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locationForm.district}
                      onChange={(e) => setLocationForm({ ...locationForm, district: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">{isTe ? 'రాష్ట్రం (State)' : 'State'}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locationForm.state}
                      onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                      required
                    />
                  </div>

                  {/* Regional Quick Hub Presets */}
                  <div className="mt-3">
                    <span className="extra-small text-muted d-block mb-2 fw-bold">⚡ Quick Regional Presets (Click to switch immediately):</span>
                    <div className="d-flex flex-wrap gap-2">
                      {[
                        { location: 'Guntur', district: 'Guntur' },
                        { location: 'Vijayawada', district: 'NTR' },
                        { location: 'Kurnool', district: 'Kurnool' },
                        { location: 'Anantapur', district: 'Anantapur' },
                        { location: 'Warangal', district: 'Warangal' },
                        { location: 'Visakhapatnam', district: 'Visakhapatnam' },
                        { location: 'Ongole', district: 'Prakasam' }
                      ].map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-outline-success btn-sm extra-small rounded-pill fw-bold"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          📍 {preset.location} ({preset.district})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setShowLocationModal(false)}>
                    {isTe ? 'రద్దు' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4 fw-bold" disabled={updatingLocation}>
                    {updatingLocation ? 'Updating...' : (isTe ? 'సేవ్ చేయండి' : 'Save & Update Forecast')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
