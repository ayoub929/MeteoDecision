"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wind, Thermometer, Droplets, Activity } from "lucide-react";
import { analyzeWeather, HealthAdvice } from "@/utils/weatherLogic"; // Ensure path is correct

export default function Home() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthAdvice | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // 1. Geocoding (Get Lat/Lon from City Name)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results) {
        throw new Error("City not found");
      }

      const { latitude, longitude } = geoData.results[0];

      // 2. Get Weather Data
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,wind_speed_10m`
      );
      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      // 3. Analyze
      const advice = analyzeWeather({
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        humidity: current.relative_humidity_2m,
        isRaining: current.rain > 0,
      });

      setResult(advice);
    } catch (err) {
      setError("Could not fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-4 overflow-hidden relative">
      
      {/* Background Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000" />

      <div className="z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
            Outfit & Health
          </h1>
          <p className="text-slate-400 mt-2">Smart weather advice for your health.</p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          className="relative mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <input
            type="text"
            placeholder="Enter city (e.g., London, New York)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={20} />
            )}
          </button>
        </motion.form>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-center mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Results Card */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              {/* Main Outfit Advice */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">{result.outfit}</h2>
                <p className="text-slate-300">{result.tempMessage}</p>
              </div>

              {/* Grid Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                  <Wind className="text-blue-300 mb-2" />
                  <span className="text-sm text-slate-400">Wind</span>
                  <span className="font-semibold text-center text-sm">{result.windMessage}</span>
                </div>
                
                <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5 ${result.riskLevel === 'High' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  <Activity className={result.riskLevel === 'High' ? "text-red-300" : "text-green-300"} />
                  <span className="text-sm text-slate-400 mt-2">Health Risk</span>
                  <span className="font-bold">{result.riskLevel}</span>
                </div>
              </div>

              {/* Health Context */}
              <div className="bg-white/5 p-4 rounded-2xl border-l-4 border-blue-500">
                <h3 className="text-sm font-bold text-blue-300 mb-1 uppercase tracking-wider">Health Insight</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.riskDescription}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
