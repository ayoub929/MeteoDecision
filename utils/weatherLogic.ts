// utils/weatherLogic.ts

export type WeatherData = {
  temperature: number;
  windSpeed: number;
  humidity: number;
  isRaining: boolean;
};

export type HealthAdvice = {
  outfit: string;
  riskLevel: "Low" | "Moderate" | "High";
  riskDescription: string;
  windMessage: string;
  tempMessage: string;
  color: string; // For UI theming
};

export function analyzeWeather(data: WeatherData): HealthAdvice {
  const { temperature, windSpeed, humidity, isRaining } = data;
  
  const advice: HealthAdvice = {
    outfit: "",
    riskLevel: "Low",
    riskDescription: "",
    windMessage: "",
    tempMessage: "",
    color: "bg-green-500",
  };

  // 1. Temperature & Outfit Logic
  if (temperature >= 25) {
    advice.outfit = "T-shirt and shorts. Don't forget sunglasses.";
    advice.tempMessage = "It's hot outside.";
    advice.color = "bg-orange-500";
  } else if (temperature >= 18) {
    advice.outfit = "T-shirt and jeans, maybe a light hoodie.";
    advice.tempMessage = "It's pleasant.";
    advice.color = "bg-yellow-500";
  } else if (temperature >= 10) {
    advice.outfit = "Light jacket or a sweater.";
    advice.tempMessage = "It's getting chilly.";
    advice.color = "bg-blue-400";
  } else {
    advice.outfit = "Heavy coat, scarf, and gloves.";
    advice.tempMessage = "It's freezing.";
    advice.color = "bg-blue-700";
  }

  if (isRaining) {
    advice.outfit += " Take an umbrella!";
  }

  // 2. Wind Logic
  if (windSpeed > 20) {
    advice.windMessage = "It's very windy. Wind chill is a factor.";
    if (temperature < 15) advice.outfit += " Wear a windbreaker.";
  } else {
    advice.windMessage = "Calm breeze.";
  }

  // 3. Health Risk Calculation (Simplified Logic)
  // Cold + High Humidity + Wind = Higher Risk
  let riskScore = 0;
  
  if (temperature < 10) riskScore += 30;
  if (temperature < 5) riskScore += 20;
  if (humidity > 70 && temperature < 15) riskScore += 20; // Damp cold
  if (windSpeed > 15 && temperature < 15) riskScore += 20; // Wind chill
  if (isRaining && temperature < 15) riskScore += 20;

  if (riskScore > 60) {
    advice.riskLevel = "High";
    advice.riskDescription = "High risk of catching a cold. Keep your throat warm.";
  } else if (riskScore > 30) {
    advice.riskLevel = "Moderate";
    advice.riskDescription = "Moderate risk. Don't stay out in the cold too long.";
  } else {
    advice.riskLevel = "Low";
    advice.riskDescription = "Low risk. Enjoy the fresh air.";
  }

  return advice;
}
