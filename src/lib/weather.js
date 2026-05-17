import { useEffect, useState } from 'react';

const FARIDABAD = { lat: 28.4089, lon: 77.3178, city: 'फरीदाबाद' };
const REFRESH_MS = 30 * 60 * 1000;

export function translateWeatherCondition(code) {
  if (code === 0) return 'साफ मौसम';
  if (code >= 1 && code <= 3) return 'बादल';
  if (code === 45 || code === 48) return 'धुंध';
  if (code >= 95 && code <= 99) return 'गरज के साथ बारिश';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'वर्षा';
  return 'बादल';
}

function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

async function getLocationFromIP() {
  const response = await fetch('https://ipwho.is/');
  if (!response.ok) throw new Error('IP lookup failed');
  const data = await response.json();
  if (!data.success) throw new Error('IP lookup failed');
  return {
    lat: data.latitude,
    lon: data.longitude,
    city: data.city,
  };
}

async function fetchCityName(lat, lon) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('language', 'hi');
  url.searchParams.set('count', '1');

  const response = await fetch(url);
  if (!response.ok) throw new Error('Reverse geocoding failed');
  const data = await response.json();
  return data.results?.[0]?.name || data.results?.[0]?.admin1 || null;
}

async function fetchWeatherAt(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,weather_code');

  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather fetch failed');
  const data = await response.json();

  return {
    temp: Math.round(data.current.temperature_2m),
    condition: translateWeatherCondition(data.current.weather_code),
  };
}

export async function loadWeather() {
  let lat = FARIDABAD.lat;
  let lon = FARIDABAD.lon;
  let city = FARIDABAD.city;

  try {
    const position = await getGeolocation();
    lat = position.lat;
    lon = position.lon;
    city = (await fetchCityName(lat, lon)) || FARIDABAD.city;
  } catch {
    try {
      const ipLocation = await getLocationFromIP();
      lat = ipLocation.lat;
      lon = ipLocation.lon;
      city = ipLocation.city || (await fetchCityName(lat, lon)) || FARIDABAD.city;
    } catch {
      city = FARIDABAD.city;
    }
  }

  try {
    const weather = await fetchWeatherAt(lat, lon);
    return { city, temp: weather.temp, condition: weather.condition, unavailable: false };
  } catch {
    return { unavailable: true };
  }
}

export function useWeather() {
  const [weather, setWeather] = useState({ loading: true, unavailable: false });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const data = await loadWeather();
      if (!cancelled) setWeather({ ...data, loading: false });
    }

    refresh();
    const intervalId = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return weather;
}

export function formatWeatherLabel(weather) {
  if (weather.unavailable) return 'मौसम उपलब्ध नहीं';
  if (weather.loading || weather.temp == null) return `☼ ${FARIDABAD.city}`;
  return `☼ ${weather.city} ${weather.temp}°C, ${weather.condition}`;
}
