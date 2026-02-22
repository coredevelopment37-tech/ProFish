/**
 * Killer Features Service — Bite alerts, weather warnings, wind calc, PB tracker, streaks
 * #544-556 — "Can't Fish Without It" features
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// #544 — Smart Bite Alarm / Notification Engine
// ============================================
const BITE_ALERT_CONFIG = {
  // Conditions that trigger "Fish are biting!" alerts
  triggers: {
    FISHCAST_HIGH: {
      threshold: 75,
      message: '🔥 FishCast score is {score}! Great time to fish.',
    },
    PRESSURE_DROP: {
      threshold: -3,
      message: '📉 Barometric pressure dropping fast — fish are feeding!',
    },
    SOLUNAR_MAJOR: {
      windowMin: 15,
      message: '🌙 Major solunar period starts in {min} minutes.',
    },
    SUNRISE_WINDOW: {
      beforeMin: 30,
      afterMin: 60,
      message: '🌅 Golden hour! Best bite window of the day.',
    },
    SUNSET_WINDOW: {
      beforeMin: 60,
      afterMin: 30,
      message: '🌇 Evening bite window opening. Head out now!',
    },
    TIDE_CHANGE: {
      beforeMin: 30,
      message: '🌊 Tide changing in {min} minutes — prime feeding time.',
    },
    TEMPERATURE_SWEET: {
      min: 55,
      max: 75,
      message: '🌡️ Water temp in the sweet spot ({temp}°F) — fish are active.',
    },
  },
};

/**
 * Evaluate current conditions against bite triggers
 */
function evaluateBiteConditions(conditions) {
  const {
    fishcastScore,
    pressureChange,
    solunarMinutes,
    sunriseMinutes,
    sunsetMinutes,
    tideMinutes,
    waterTemp,
  } = conditions;
  const alerts = [];

  if (fishcastScore >= BITE_ALERT_CONFIG.triggers.FISHCAST_HIGH.threshold) {
    alerts.push({
      type: 'FISHCAST_HIGH',
      message: BITE_ALERT_CONFIG.triggers.FISHCAST_HIGH.message.replace(
        '{score}',
        fishcastScore,
      ),
      priority: 1,
    });
  }
  if (pressureChange <= BITE_ALERT_CONFIG.triggers.PRESSURE_DROP.threshold) {
    alerts.push({
      type: 'PRESSURE_DROP',
      message: BITE_ALERT_CONFIG.triggers.PRESSURE_DROP.message,
      priority: 2,
    });
  }
  if (
    solunarMinutes !== null &&
    solunarMinutes <= BITE_ALERT_CONFIG.triggers.SOLUNAR_MAJOR.windowMin &&
    solunarMinutes >= 0
  ) {
    alerts.push({
      type: 'SOLUNAR_MAJOR',
      message: BITE_ALERT_CONFIG.triggers.SOLUNAR_MAJOR.message.replace(
        '{min}',
        solunarMinutes,
      ),
      priority: 2,
    });
  }
  if (
    waterTemp >= BITE_ALERT_CONFIG.triggers.TEMPERATURE_SWEET.min &&
    waterTemp <= BITE_ALERT_CONFIG.triggers.TEMPERATURE_SWEET.max
  ) {
    alerts.push({
      type: 'TEMPERATURE_SWEET',
      message: BITE_ALERT_CONFIG.triggers.TEMPERATURE_SWEET.message.replace(
        '{temp}',
        waterTemp,
      ),
      priority: 3,
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

// ============================================
// #545 — Tide Change Alert Service
// ============================================
async function scheduleTideAlerts(tideData) {
  // Store upcoming tide times for notification scheduling
  if (!tideData || !tideData.predictions) return;

  const upcoming = tideData.predictions
    .filter(t => new Date(t.time) > new Date())
    .slice(0, 4); // Next 4 tide events

  try {
    await AsyncStorage.setItem(
      '@profish_tide_alerts',
      JSON.stringify(upcoming),
    );
  } catch (e) {
    /* ignore */
  }

  return upcoming;
}

// ============================================
// #546 — Weather Danger Alerts
// ============================================
const WEATHER_DANGER_THRESHOLDS = {
  LIGHTNING: {
    message: '⚡ Lightning detected nearby! Get off the water immediately!',
    priority: 'critical',
  },
  HIGH_WIND: {
    speedKmh: 40,
    message: '💨 Wind speeds exceeding 40 km/h. Small craft advisory.',
    priority: 'warning',
  },
  STORM: {
    message: '🌩️ Thunderstorm approaching. Seek shelter within 30 minutes.',
    priority: 'critical',
  },
  FOG: {
    visibilityKm: 1,
    message: '🌫️ Dense fog — visibility under 1km. Use GPS navigation.',
    priority: 'warning',
  },
  EXTREME_HEAT: {
    tempC: 38,
    message: '🥵 Extreme heat advisory. Stay hydrated, take shade breaks.',
    priority: 'warning',
  },
  EXTREME_COLD: {
    tempC: -15,
    message: '🥶 Extreme cold warning. Risk of frostbite and hypothermia.',
    priority: 'warning',
  },
  ROUGH_SEAS: {
    waveHeightM: 2.5,
    message: '🌊 Rough seas — wave height above 2.5m. Stay in port.',
    priority: 'critical',
  },
};

function checkWeatherDangers(weatherData) {
  const dangers = [];

  if (
    weatherData.windSpeedKmh >= WEATHER_DANGER_THRESHOLDS.HIGH_WIND.speedKmh
  ) {
    dangers.push({ ...WEATHER_DANGER_THRESHOLDS.HIGH_WIND, type: 'HIGH_WIND' });
  }
  if (weatherData.tempC >= WEATHER_DANGER_THRESHOLDS.EXTREME_HEAT.tempC) {
    dangers.push({
      ...WEATHER_DANGER_THRESHOLDS.EXTREME_HEAT,
      type: 'EXTREME_HEAT',
    });
  }
  if (weatherData.tempC <= WEATHER_DANGER_THRESHOLDS.EXTREME_COLD.tempC) {
    dangers.push({
      ...WEATHER_DANGER_THRESHOLDS.EXTREME_COLD,
      type: 'EXTREME_COLD',
    });
  }
  if (
    weatherData.visibilityKm !== undefined &&
    weatherData.visibilityKm < WEATHER_DANGER_THRESHOLDS.FOG.visibilityKm
  ) {
    dangers.push({ ...WEATHER_DANGER_THRESHOLDS.FOG, type: 'FOG' });
  }
  if (
    weatherData.waveHeightM !== undefined &&
    weatherData.waveHeightM >= WEATHER_DANGER_THRESHOLDS.ROUGH_SEAS.waveHeightM
  ) {
    dangers.push({
      ...WEATHER_DANGER_THRESHOLDS.ROUGH_SEAS,
      type: 'ROUGH_SEAS',
    });
  }

  return dangers.sort((a, b) => (a.priority === 'critical' ? -1 : 1));
}

// ============================================
// #547 — Personal Best (PB) Tracker
// ============================================
async function updatePersonalBest(
  speciesId,
  weight,
  length,
  date,
  photoUri = null,
) {
  const KEY = '@profish_personal_bests';
  try {
    const data = JSON.parse((await AsyncStorage.getItem(KEY)) || '{}');
    const existing = data[speciesId];

    let isNewPB = false;
    if (!existing || weight > existing.weight) {
      data[speciesId] = {
        weight,
        length,
        date,
        photoUri,
        previousBest: existing?.weight || null,
      };
      isNewPB = true;
    }

    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    return { isNewPB, current: data[speciesId], species: speciesId };
  } catch (e) {
    return { isNewPB: false, error: e.message };
  }
}

async function getPersonalBests() {
  try {
    return JSON.parse(
      (await AsyncStorage.getItem('@profish_personal_bests')) || '{}',
    );
  } catch (e) {
    return {};
  }
}

// ============================================
// #550 — Wind Speed & Direction Calculator
// ============================================
function calculateWindEffect(windSpeedKmh, windDirection, castingDirection) {
  // Wind impact on casting
  const windRad = (windDirection * Math.PI) / 180;
  const castRad = (castingDirection * Math.PI) / 180;
  const angleDiff = Math.abs(windRad - castRad);
  const headwindFactor = Math.cos(angleDiff); // 1 = headwind, -1 = tailwind

  let effect = 'neutral';
  let recommendation = '';

  if (headwindFactor > 0.5) {
    effect = 'headwind';
    recommendation =
      'Cast lower and harder. Use heavier lures. Consider switching to a wind-resistant presentation.';
  } else if (headwindFactor < -0.5) {
    effect = 'tailwind';
    recommendation =
      'Great casting conditions! You can throw lighter lures farther. Use the wind to your advantage.';
  } else {
    effect = 'crosswind';
    recommendation =
      'Cast at an angle to compensate for drift. Watch your line for wind bows.';
  }

  // Fishing quality based on wind
  let fishingImpact = 'neutral';
  if (windSpeedKmh < 5) {
    fishingImpact = 'Calm — fish may be spooky. Use finesse presentations.';
  } else if (windSpeedKmh < 15) {
    fishingImpact = 'Light breeze — ideal conditions. Surface activity likely.';
  } else if (windSpeedKmh < 25) {
    fishingImpact =
      'Moderate wind — fish windblown banks and points. Reaction baits excel.';
  } else if (windSpeedKmh < 40) {
    fishingImpact =
      'Strong wind — challenging but fish are often active. Fish protected areas.';
  } else {
    fishingImpact = 'Dangerous conditions. Consider postponing your trip.';
  }

  return {
    effect,
    headwindFactor,
    recommendation,
    fishingImpact,
    windSpeedKmh,
    windDirection,
  };
}

// ============================================
// #552 — Photo Watermark Config
// ============================================
const WATERMARK_CONFIG = {
  enabled: true,
  position: 'bottom-right',
  opacity: 0.7,
  template: '{app_name} • {species} • {weight} • {date} • {location}',
  appName: 'ProFish',
  logoSize: 24,
  fontSize: 12,
  color: '#FFFFFF',
  backgroundColor: '#00000080',
  padding: 8,
};

function generateWatermarkText(catchData) {
  let text = WATERMARK_CONFIG.template;
  text = text.replace('{app_name}', WATERMARK_CONFIG.appName);
  text = text.replace('{species}', catchData.speciesName || 'Unknown');
  text = text.replace(
    '{weight}',
    catchData.weight ? `${catchData.weight} lbs` : '',
  );
  text = text.replace(
    '{date}',
    new Date(catchData.date || Date.now()).toLocaleDateString(),
  );
  text = text.replace('{location}', catchData.location || '');
  return text.replace(/ • $/g, '').replace(/ • {2}• /g, ' • ');
}

// ============================================
// #553 — Fishing Streaks
// ============================================
async function updateFishingStreak() {
  const KEY = '@profish_fishing_streak';
  try {
    const data = JSON.parse((await AsyncStorage.getItem(KEY)) || '{}');
    const today = new Date().toISOString().split('T')[0];

    if (data.lastFishDate === today)
      return { streak: data.currentStreak, isNew: false };

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];
    if (data.lastFishDate === yesterday) {
      data.currentStreak = (data.currentStreak || 0) + 1;
    } else {
      data.currentStreak = 1;
    }

    data.lastFishDate = today;
    data.longestStreak = Math.max(data.longestStreak || 0, data.currentStreak);
    data.totalDaysFished = (data.totalDaysFished || 0) + 1;

    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    return {
      streak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalDays: data.totalDaysFished,
      isNew: true,
    };
  } catch (e) {
    return { streak: 0, isNew: false };
  }
}

// ============================================
// #555 — Sunrise/Sunset Widget Data
// ============================================
function calculateSunTimes(lat, lon, date = new Date()) {
  // Simplified sunrise/sunset calculation
  const J = Math.floor(date.getTime() / 86400000) + 2440587.5;
  const n = J - 2451545.0 + 0.0008;
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C =
    1.9148 * Math.sin((M * Math.PI) / 180) +
    0.02 * Math.sin((2 * M * Math.PI) / 180);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const delta =
    (Math.asin(
      Math.sin((lambda * Math.PI) / 180) * Math.sin((23.44 * Math.PI) / 180),
    ) *
      180) /
    Math.PI;
  const cosOmega =
    (Math.sin((-0.83 * Math.PI) / 180) -
      Math.sin((lat * Math.PI) / 180) * Math.sin((delta * Math.PI) / 180)) /
    (Math.cos((lat * Math.PI) / 180) * Math.cos((delta * Math.PI) / 180));

  if (cosOmega > 1 || cosOmega < -1) {
    return { sunrise: null, sunset: null, goldenHour: null, blueHour: null };
  }

  const omega = (Math.acos(cosOmega) * 180) / Math.PI;
  const Jtransit =
    2451545.0 +
    Js +
    0.0053 * Math.sin((M * Math.PI) / 180) -
    0.0069 * Math.sin((2 * lambda * Math.PI) / 180);
  const Jrise = Jtransit - omega / 360;
  const Jset = Jtransit + omega / 360;

  const toDate = jd => new Date((jd - 2440587.5) * 86400000);

  const sunrise = toDate(Jrise);
  const sunset = toDate(Jset);

  return {
    sunrise: sunrise.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    sunset: sunset.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    goldenHourMorning: {
      start: sunrise.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      end: new Date(sunrise.getTime() + 3600000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    goldenHourEvening: {
      start: new Date(sunset.getTime() - 3600000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      end: sunset.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    dayLength: Math.round((sunset - sunrise) / 60000), // minutes
  };
}

// ============================================
// #548 — Fishing Buddy finder (nearby anglers)
// ============================================
const BUDDY_CONFIG = {
  maxRadiusKm: 50,
  defaultRadiusKm: 10,
  requireOptIn: true,
  shareLocation: false, // Default — user must opt in
  anonymousMode: true,
  // Firestore collection: /fishing_buddies/{userId}
};

// ============================================
// #556 — Voice command config
// ============================================
const VOICE_COMMANDS = [
  {
    command: 'log catch',
    action: 'NAVIGATE_LOG_CATCH',
    desc: 'Open catch logging screen',
  },
  {
    command: 'tide chart',
    action: 'NAVIGATE_TIDES',
    desc: 'Open tide calendar',
  },
  {
    command: 'weather',
    action: 'NAVIGATE_WEATHER',
    desc: 'Check current weather',
  },
  {
    command: 'fish cast',
    action: 'NAVIGATE_FISHCAST',
    desc: 'Open FishCast score',
  },
  { command: 'what knot', action: 'NAVIGATE_KNOTS', desc: 'Open knot guide' },
  {
    command: 'is it legal',
    action: 'NAVIGATE_LEGAL',
    desc: 'Check fishing regulations',
  },
  {
    command: 'moon phase',
    action: 'NAVIGATE_MOON',
    desc: 'Open moon calendar',
  },
  {
    command: 'start trip',
    action: 'NAVIGATE_TRIP_PLANNER',
    desc: 'Open trip planner',
  },
  {
    command: 'take photo',
    action: 'OPEN_CAMERA',
    desc: 'Open camera for catch photo',
  },
  {
    command: 'my spots',
    action: 'NAVIGATE_SPOTS',
    desc: 'View saved fishing spots',
  },
];

export {
  BITE_ALERT_CONFIG,
  WEATHER_DANGER_THRESHOLDS,
  WATERMARK_CONFIG,
  BUDDY_CONFIG,
  VOICE_COMMANDS,
  evaluateBiteConditions,
  scheduleTideAlerts,
  checkWeatherDangers,
  updatePersonalBest,
  getPersonalBests,
  calculateWindEffect,
  generateWatermarkText,
  updateFishingStreak,
  calculateSunTimes,
};

export default {
  evaluateBiteConditions,
  scheduleTideAlerts,
  checkWeatherDangers,
  updatePersonalBest,
  getPersonalBests,
  calculateWindEffect,
  generateWatermarkText,
  updateFishingStreak,
  calculateSunTimes,
};
