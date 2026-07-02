# Mohan Finds

**Compare ride prices across all major platforms instantly.**

Mohan Finds is a web app that compares fares across Uber, Ola, Rapido, BluSmart, and Namma Yatri for bikes, autos, and cars — and shows the best routes on an interactive map.

---

## Features

- **Price Comparison** — Compare 14+ vehicle types across 5 platforms, sorted cheapest first
- **Interactive Map** — Leaflet.js map with OpenStreetMap tiles, route lines, and animated markers
- **Route Options** — Up to 3 alternative routes with distance, duration, and Fastest/Shortest badges
- **Vehicle Filters** — Toggle between All, Bike, Auto, and Car tabs
- **Fare Breakdown** — Click any card to see base fare, distance charge, time charge, surge, and fees
- **Surge Detection** — Real-time surge indicators based on time of day
- **Location Search** — Autocomplete powered by Nominatim geocoding
- **GPS Support** — "My Location" button for quick pickup selection
- **Map Click** — Click on the map to set pickup and drop pins
- **Savings Calculator** — Shows how much you save vs the most expensive option
- **Responsive Design** — Works on desktop and mobile

---

## Platforms Supported

| Platform     | Vehicle Types                     |
|--------------|-----------------------------------|
| Uber         | Moto, Auto, UberGo, Premier      |
| Ola          | Bike, Auto, Mini, Prime           |
| Rapido       | Bike, Auto, Cab Economy           |
| BluSmart     | Electric Sedan                    |
| Namma Yatri  | Auto, Cab                         |

---

## Tech Stack

| Layer      | Technology         |
|------------|--------------------|
| Structure  | HTML5              |
| Styling    | Vanilla CSS        |
| Logic      | Vanilla JavaScript |
| Map        | Leaflet.js         |
| Tiles      | OpenStreetMap      |
| Geocoding  | Nominatim API      |
| Routing    | OSRM API           |
| Fonts      | Google Fonts (Inter) |

No build step required. No API keys needed. Everything is free and open.

---

## How to Use

1. Open `index.html` in any modern browser
2. Enter a pickup location (e.g., "Koramangala, Bangalore")
3. Enter a drop location (e.g., "Whitefield, Bangalore")
4. Click "Compare Prices" or press Enter
5. Browse the sorted price cards — cheapest is marked "Best Price"
6. Click any card to see the full fare breakdown
7. Switch tabs (Bike / Auto / Car) to filter by vehicle type
8. Click route options to compare alternative paths

You can also click directly on the map to set pickup and drop locations.

---

## Project Structure

find the best/
├── index.html    — Main HTML page
├── style.css     — Design system and styles
├── app.js        — Application logic and fare engine
└── README.md     — This file

---

## How Fares Are Calculated

Fares are realistically simulated using the formula:

fare = (baseFare + distance × perKmRate + duration × perMinRate) × surgeMultiplier + platformFee + tax

- Each platform has unique base fares, per-km rates, and per-minute rates
- Surge pricing varies by time of day (morning rush, evening peak, late night)
- A small random variance is added for realism
- Minimum fare floors are enforced per vehicle type

> Note: Real ride-hailing APIs are not publicly available. This app uses simulated data with realistic pricing models.

---

## Screenshots

### Home Screen
Dark premium UI with interactive map centered on Bangalore.

### Price Comparison
Sorted ride cards with "Best Price" badge, surge indicators, and fare breakdowns.

---

## License

This project is open source and available for personal use.

---

Built by **Mohan**
