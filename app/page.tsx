"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wind, Activity, MapPin, Navigation } from "lucide-react";
import { analyzeWeather, HealthAdvice } from "@/utils/weatherLogic";

// --- Configurazione Città Popolari ---
const POPULAR_CITIES = [
  { name: "Washington D.C.", lat: 38.8951, lon: -77.0364 },
  { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "Rome", lat: 41.9028, lon: 12.4964 },
];

type CitySuggestion = {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

export default function Home() {
  // Stati principali
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  "use client";

  import { useState, useEffect, useRef } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { Search, Wind, Activity, MapPin, Navigation } from "lucide-react";
  import { analyzeWeather, HealthAdvice } from "@/utils/weatherLogic";

  // --- Configurazione Città Popolari ---
  const POPULAR_CITIES = [
    { name: "Washington D.C.", lat: 38.8951, lon: -77.0364 },
    { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "Rome", lat: 41.9028, lon: 12.4964 },
  ];

  type CitySuggestion = {
    id: number;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };

  type PopularCityData = {
    name: string;
    advice: HealthAdvice;
  };

  export default function Home() {
    // Stati principali
    const [city, setCity] = useState("");
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
  
    // Stati caricamento e risultati
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HealthAdvice | null>(null);
    const [error, setError] = useState("");

    // Stati per le città popolari
    const [popularWeather, setPopularWeather] = useState<PopularCityData[]>([]);

    // Ref per il debounce e per il click esterno
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // --- Gestione Autocomplete ---
    useEffect(() => {
      if (city.length < 3) {
        setSuggestions([]);
        return;
      }
      if (!showSuggestions) return;

      if (searchTimeout.current) clearTimeout(searchTimeout.current);

      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=5&language=en&format=json`
          );
          const data = await res.json();
          setSuggestions(data.results || []);
        } catch (e) {
          console.error("Error fetching suggestions", e);
        }
      }, 300);

      return () => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
      };
    }, [city, showSuggestions]);

    // --- Funzione per ottenere il meteo (Riutilizzabile) ---
    const fetchWeatherForCoords = async (lat: number, lon: number) => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,wind_speed_10m`
      );
      const data = await res.json();
      const current = data.current;
    
      return analyzeWeather({
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        humidity: current.relative_humidity_2m,
        isRaining: current.rain > 0,
      });
    };

    // --- Gestione Selezione Città ---
    const handleSelectCity = async (selectedCity: CitySuggestion) => {
      setCity(`${selectedCity.name}, ${selectedCity.country}`);
      setShowSuggestions(false);
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const advice = await fetchWeatherForCoords(selectedCity.latitude, selectedCity.longitude);
        setResult(advice);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolla in cima
      } catch (err) {
        setError("Could not fetch weather data.");
      } finally {
        setLoading(false);
      }
    };

    // --- NUOVA FUNZIONE: Gestione Click Città Popolare ---
    const handlePopularCityClick = (item: PopularCityData) => {
      setCity(item.name); // Aggiorna la barra di ricerca
      setResult(item.advice); // Mostra subito i risultati
      setShowSuggestions(false); // Chiudi i suggerimenti se aperti
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolla in cima per vedere il risultato
    };

    // --- Caricamento Città Popolari (All'avvio) ---
    useEffect(() => {
      const loadPopular = async () => {
        try {
          const promises = POPULAR_CITIES.map(async (city) => {
            const advice = await fetchWeatherForCoords(city.lat, city.lon);
            return { name: city.name, advice };
          });
        
          const results = await Promise.all(promises);
          setPopularWeather(results);
        } catch (e) {
          console.error("Error loading popular cities", e);
        }
      };
      loadPopular();
    }, []);

    // Gestione submit manuale (invio con Enter)
    const handleManualSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectCity(suggestions[0]);
      }
    };

    // Gestione click esterno per chiudere i suggerimenti
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-4 overflow-x-hidden relative">
      
        <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob z-0" />
        <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-2000 z-0" />

        <div className="z-10 w-full max-w-2xl mt-10 flex flex-col items-center">
        
          <motion.div /* ... */ >
            {/* Header non modificato */}
          </motion.div>

          {/* --- SEARCH BAR CON AUTOCOMPLETE --- */}
          <div ref={searchContainerRef} className="relative w-full max-w-md mb-12">
            <form onSubmit={handleManualSearch} className="relative z-50">
              <input
                type="text"
                placeholder="Search city..."
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                // --- CORREZIONE BUG VISIVO ---
                autoComplete="off"
                className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg"
              />
              {/* ... bottone di ricerca non modificato ... */}
            </form>

            {/* Dropdown Suggerimenti */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.ul /* ... */ >
                  {/* ... lista suggerimenti non modificata ... */}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* ... Error Message e RISULTATO PRINCIPALE non modificati ... */}
        
          {/* --- SEZIONE CITTÀ POPOLARI --- */}
          <div className="w-full max-w-4xl mt-8 mb-20">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 px-4">
              <Navigation size={20} className="text-blue-400" />
              Popular Cities
            </h3>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4">
              {popularWeather.length === 0 ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : (
                popularWeather.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    // --- CORREZIONE FUNZIONALITÀ ---
                    onClick={() => handlePopularCityClick(item)}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg">{item.name}</h4>
                      <div className={`w-3 h-3 rounded-full ${item.advice.color}`} />
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2 mb-3 h-10">
                      {item.advice.outfit}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Activity size={12} />
                      <span>Risk: {item.advice.riskLevel}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    );
  }
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute w-full mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40"
              >
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    onClick={() => handleSelectCity(suggestion)}
                    className="px-6 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                  >
                    <MapPin size={16} className="text-blue-400" />
                    <div>
                      <span className="font-medium text-white">{suggestion.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{suggestion.country}</span>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        {error && (
          <motion.p className="text-red-400 text-center mb-4">{error}</motion.p>
        )}

        {/* --- RISULTATO PRINCIPALE --- */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-16"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 leading-tight">{result.outfit}</h2>
                <p className="text-slate-300">{result.tempMessage}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                  <Wind className="text-blue-300 mb-2" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Wind</span>
                  <span className="font-semibold text-center text-sm mt-1">{result.windMessage}</span>
                </div>
                
                <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5 ${result.riskLevel === 'High' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  <Activity className={result.riskLevel === 'High' ? "text-red-300" : "text-green-300"} />
                  <span className="text-xs text-slate-400 mt-2 uppercase tracking-wider">Health Risk</span>
                  <span className="font-bold mt-1">{result.riskLevel}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border-l-4 border-blue-500">
                <h3 className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wider">Health Insight</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.riskDescription}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- SEZIONE CITTÀ POPOLARI --- */}
        <div className="w-full max-w-4xl mt-8 mb-20">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 px-4">
            <Navigation size={20} className="text-blue-400" />
            Popular Cities
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4">
            {popularWeather.length === 0 ? (
              // Scheletro di caricamento
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : (
              popularWeather.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl transition-all cursor-default group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <div className={`w-3 h-3 rounded-full ${item.advice.color}`} />
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2 mb-3 h-10">
                    {item.advice.outfit}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Activity size={12} />
                    <span>Risk: {item.advice.riskLevel}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
