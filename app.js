const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.error("Missing OPENWEATHER_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

app.get("/", async (req, res) => {
  const city = req.query.city;
  const templatePath = path.join(__dirname, "index.html");
  let template = fs.readFileSync(templatePath, "utf8");

  // Retain the search value in the input field
  template = template.replace("{{CITY_VALUE}}", city || "");

  if (!city) {
    res.send(
      template.replace(
        "{{DATA}}",
        '<div class="empty-state">Enter a city name to view full weather details.</div>',
      ),
    );
    return;
  }

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      { params: { q: city, appid: API_KEY } },
    );
    const data = response.data; // The full JSON object

    // Helper to format unix time
    const formatTime = (unix) =>
      new Date(unix * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    // Construct HTML for all fields
    // We'll map the JSON structure provided by the user
    const htmlContent = `
            <div class="weather-card">
                <h2 style="margin-top:0;">${data.name}, ${data.sys.country} (ID: ${data.id})</h2>
                
                <div class="section-title">Coordinates & System</div>
                <div class="grid">
                    <div class="data-item"><span class="label">Longitude</span><span class="value">${data.coord.lon}</span></div>
                    <div class="data-item"><span class="label">Latitude</span><span class="value">${data.coord.lat}</span></div>
                    <div class="data-item"><span class="label">Country</span><span class="value">${data.sys.country}</span></div>
                    <div class="data-item"><span class="label">Sunrise</span><span class="value">${formatTime(data.sys.sunrise)}</span></div>
                    <div class="data-item"><span class="label">Sunset</span><span class="value">${formatTime(data.sys.sunset)}</span></div>
                </div>

                <div class="section-title">Weather Conditions</div>
                <div class="grid">
                    <div class="data-item"><span class="label">Main</span><span class="value">${data.weather[0].main}</span></div>
                    <div class="data-item"><span class="label">Description</span><span class="value">${data.weather[0].description}</span></div>
                    <div class="data-item"><span class="label">Icon Code</span><span class="value">${data.weather[0].icon}</span></div>
                    <div class="data-item"><span class="label">ID</span><span class="value">${data.weather[0].id}</span></div>
                </div>

                <div class="section-title">Main Details</div>
                <div class="grid">
                    <div class="data-item"><span class="label">Temp</span><span class="value">${data.main.temp} K</span></div>
                    <div class="data-item"><span class="label">Feels Like</span><span class="value">${data.main.feels_like} K</span></div>
                    <div class="data-item"><span class="label">Min Temp</span><span class="value">${data.main.temp_min} K</span></div>
                    <div class="data-item"><span class="label">Max Temp</span><span class="value">${data.main.temp_max} K</span></div>
                    <div class="data-item"><span class="label">Pressure</span><span class="value">${data.main.pressure} hPa</span></div>
                    <div class="data-item"><span class="label">Humidity</span><span class="value">${data.main.humidity}%</span></div>
                    <div class="data-item"><span class="label">Sea Level</span><span class="value">${data.main.sea_level || "N/A"} hPa</span></div>
                    <div class="data-item"><span class="label">Ground Level</span><span class="value">${data.main.grnd_level || "N/A"} hPa</span></div>
                </div>

                <div class="section-title">Wind & Visibility</div>
                <div class="grid">
                    <div class="data-item"><span class="label">Speed</span><span class="value">${data.wind.speed} m/s</span></div>
                    <div class="data-item"><span class="label">Degrees</span><span class="value">${data.wind.deg}°</span></div>
                    <div class="data-item"><span class="label">Gust</span><span class="value">${data.wind.gust || "N/A"} m/s</span></div>
                    <div class="data-item"><span class="label">Visibility</span><span class="value">${data.visibility} m</span></div>
                    <div class="data-item"><span class="label">Cloudiness</span><span class="value">${data.clouds.all}%</span></div>
                </div>

                <div class="section-title">Other Info</div>
                <div class="grid">
                    <div class="data-item"><span class="label">Time of Data (dt)</span><span class="value">${formatTime(data.dt)}</span></div>
                    <div class="data-item"><span class="label">Timezone</span><span class="value">${data.timezone}</span></div>
                    <div class="data-item"><span class="label">Base</span><span class="value">${data.base}</span></div>
                    <div class="data-item"><span class="label">COD</span><span class="value">${data.cod}</span></div>
                </div>
            </div>
        `;

    res.send(template.replace("{{DATA}}", htmlContent));
  } catch (error) {
    console.error(error.message);
    let errorMsg = "Error fetching weather data.";
    if (error.response && error.response.status === 404) {
      errorMsg = `City "${city}" not found.`;
    }
    res.send(
      template.replace("{{DATA}}", `<div class="error">${errorMsg}</div>`),
    );
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
