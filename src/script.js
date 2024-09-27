const searchButton = document.querySelector("#searchButton");
const locationButton = document.querySelector(".locationButton");
const cityInput = document.querySelector(".cityInput");
const weatherCardDiv = document.querySelector(".weatherCards");
const currentWeatherDiv = document.querySelector(".currentWeather");
const dropdownMenu = document.querySelector(".dropdown-menu"); // Dropdown menu

const API_KEY = "40030407616c178beda60a40f55a6163";
const dropdownItems = JSON.parse(localStorage.getItem('recentCities')) || [];

// Function to create weather card HTML
const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        // HTML for main Weather Card
        return `<div>
                    <h2 class="h2-custom">${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h4 class="h4-custom">Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h4>
                    <h4 class="h4-custom">Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4 class="h4-custom">Humidity: ${weatherItem.main.humidity}%</h4>
                </div>
                <div class="text-center">
                    <img class="h-20" src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="Weather-icon">
                    <h4 class="h4-custom">${weatherItem.weather[0].description}</h4>
                </div>`;
    } else {
        // HTML for other 5 days weather card
        return `<li class="li">
                    <h2 class="li-h2">(${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <img class="mt-3 h-24" src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="Weather-icon">
                    <h4 class="h4-custom">Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h4>
                    <h4 class="h4-custom">Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4 class="h4-custom">Humidity: ${weatherItem.main.humidity}%</h4>
                </li>`;
    }
};

// Function to display error message in the current weather card
const displayErrorMessage = (message) => {
    currentWeatherDiv.innerHTML = `<h4 class='h4-custom'>${message}</h4>`;
    weatherCardDiv.innerHTML = ''; // Clear the other weather cards
};

// Function to get weather details
const getWeatherDetails = async (cityName, lat, lon) => {
    const WEATHER_API_URL = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    try {
        const res = await fetch(WEATHER_API_URL);
        if (!res.ok) {
            throw new Error("Error fetching weather data.");
        }
        const data = await res.json();
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        // Clear previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardDiv.innerHTML = "";

        // Check if the response contains valid weather data
        if (fiveDaysForecast.length === 0) {
            return displayErrorMessage(`No weather data available for ${cityName}`);
        }

        // Loop through the forecast and generate weather cards
        fiveDaysForecast.forEach((weatherItem, index) => {
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
            } else {
                weatherCardDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
            }
        });
    } catch (error) {
        displayErrorMessage("Invalid location or error fetching weather data. Please try again.");
    }
};

// Function to get city coordinates
const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) {
        return displayErrorMessage("Please enter a city name.");
    }

    const GEOCODING_API_URL = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`;

    try {
        const res = await fetch(GEOCODING_API_URL);
        if (!res.ok) {
            throw new Error("Error fetching city coordinates.");
        }
        const data = await res.json();
        if (!data.length) {
            return displayErrorMessage(`No coordinates found for ${cityName}`);
        }
        const { name, lat, lon } = data[0];
        getWeatherDetails(name, lat, lon);

        // Save the city name in local storage
        const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
        if (!recentCities.includes(name)) {
            recentCities.push(name);
            localStorage.setItem('recentCities', JSON.stringify(recentCities));
        }
    } catch (error) {
        displayErrorMessage("Error fetching city coordinates. Please try again.");
    }
};

// Function to get user coordinates
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    if (!data.length) {
                        return displayErrorMessage("Unable to get your location.");
                    }
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => {
                    displayErrorMessage("Error fetching your location.");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                displayErrorMessage("Geolocation request denied. Please reset location permission to grant access again.");
            }
        }
    );
};

// Load recent cities from local storage and populate dropdown on page load
window.addEventListener("load", () => {
    if (dropdownItems.length > 0) {
        dropdownMenu.innerHTML = dropdownItems.map(city => `<li class="dropdown-item p-2 hover:bg-blue-100">${city}</li>`).join('');
        dropdownMenu.classList.add('hidden'); 
    }
});

searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getUserCoordinates);

// Event listener for city input to open dropdown and handle input
cityInput.addEventListener("input", (e) => {
    const inputValue = e.target.value;
    // Only show dropdown if there are recent cities or input value is not empty
    if (inputValue.length > 0 || dropdownItems.length > 0) {
        dropdownMenu.classList.remove('hidden');
    } else {
        dropdownMenu.classList.add('hidden');
    }
});

// Event listener for pressing 'Enter'
cityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        getCityCoordinates();
        dropdownMenu.classList.add('hidden');
    }
});

// Event listener for clicking on a city in the dropdown
dropdownMenu.addEventListener("click", (e) => {
    if (e.target.classList.contains('dropdown-item')) {
        cityInput.value = e.target.textContent; 
        getCityCoordinates(); 
        dropdownMenu.classList.add('hidden'); 
    }
});
