# SHDWNET Data Sources

## Currently Implemented

### 1. NOAA Space Weather Prediction Center
**Type:** Solar/Geomagnetic Activity
**API:** https://services.swpc.noaa.gov/

| Endpoint | Data | Update Freq | Signal Use |
|----------|------|-------------|------------|
| `/products/noaa-planetary-k-index.json` | K-index (geomagnetic) | 3 hours | K≥5 = storm = chaos mode |
| `/json/goes/primary/xrays-7-day.json` | Solar X-ray flux | 1 min | Flare detection |
| `/products/solar-wind/` | Solar wind speed/density | 1 min | Continuous signal mod |
| `/json/ovation_aurora_latest.json` | Aurora forecast | 30 min | "Veil is thin" events |

### 2. USGS Earthquake Hazards
**Type:** Seismic Activity
**API:** https://earthquake.usgs.gov/earthquakes/feed/v1.0/

| Endpoint | Data | Update Freq | Signal Use |
|----------|------|-------------|------------|
| `/summary/all_hour.geojson` | All quakes, past hour | 1 min | Real-time detection |
| `/summary/significant_day.geojson` | M4.5+ events | 1 min | Major event triggers |
| `/summary/all_day.geojson` | All quakes, 24h | 1 min | Activity baseline |

---

## Recommended Additions

### 3. NASA DONKI (Space Weather Database)
**Type:** Solar Events, CMEs, Flares
**API:** https://api.nasa.gov/DONKI/
**Auth:** Free API key from api.nasa.gov

| Endpoint | Data | Signal Use |
|----------|------|------------|
| `/CME` | Coronal Mass Ejections | Major cosmic events |
| `/FLR` | Solar Flares | X-class = max signal |
| `/GST` | Geomagnetic Storms | Storm intensity |
| `/IPS` | Interplanetary Shocks | "Something approaches" |

**Example:** `https://api.nasa.gov/DONKI/FLR?startDate=2024-01-01&api_key=DEMO_KEY`

### 4. NOAA GOES Satellite Imagery
**Type:** Real-time Earth/Sun imagery
**API:** https://cdn.star.nesdis.noaa.gov/

- Solar imagery (SUVI)
- Full disk Earth views
- Hurricane tracking
- Could extract for visual content

### 5. Schumann Resonance Monitors
**Type:** Earth's electromagnetic "heartbeat"
**Sources:** 
- HeartMath GCI: https://www.heartmath.org/gci/
- Tomsk Russia data (historical)

**Signal Use:** Baseline Earth frequency fluctuations - very on-brand for "universal vibration"

### 6. NOAA Tides & Currents
**Type:** Ocean data
**API:** https://api.tidesandcurrents.noaa.gov/api/prod/

- Water levels, currents
- Extreme tide events
- Ocean temperature anomalies

### 7. GOES Lightning Mapper
**Type:** Real-time lightning detection
**Source:** NOAA GOES-16/17/18

- Global lightning activity
- Storm tracking
- Could trigger "electric" music modes

### 8. Radio Propagation Data
**Type:** Ionospheric conditions
**Sources:**
- https://www.swpc.noaa.gov/products/d-region-absorption-predictions
- https://prop.kc2g.com/ (ham radio propagation)

**Signal Use:** When the ionosphere is disturbed, radio signals behave strangely - metaphor for "transmission quality"

### 9. Volcano Monitoring (USGS)
**Type:** Volcanic activity
**API:** https://volcanoes.usgs.gov/vsc/api/

- Alert levels for active volcanoes
- Eruption notifications
- Seismic swarms near volcanoes

### 10. Near-Earth Objects (NASA)
**Type:** Asteroid/Comet approaches
**API:** https://api.nasa.gov/neo/rest/v1/

- Close approach data
- "Something passes near" events
- Rare but dramatic triggers

---

## Signal Mapping Strategy

### Composite Signal Formula
```
signal = baseline (0.3)
       + (k_index / 9) * 0.25        # Geomagnetic: 0-0.25
       + (solar_flux / 200) * 0.15   # Solar: 0-0.15
       + (quake_mag_sum / 50) * 0.15 # Seismic: 0-0.15
       + (special_events) * 0.15     # CME, aurora, etc: 0-0.15
       
signal = clamp(signal, 0, 1)
```

### Event Triggers (X Bot)
| Event | Threshold | Post Type |
|-------|-----------|-----------|
| X-class flare | Any | "The Sun speaks" |
| K-index | ≥5 | "Geomagnetic storm" |
| Earthquake | M6.0+ | "The Earth remembers" |
| CME Earth-directed | Any | "Something approaches" |
| Aurora visible | Kp≥6 | "The veil glows" |

---

## Implementation Priority

1. **Phase 1 (Now):** NOAA K-index + USGS Earthquakes ✅
2. **Phase 2:** NASA DONKI (CME, flares) + Solar wind
3. **Phase 3:** Schumann resonance + Radio propagation
4. **Phase 4:** NEO tracking + Volcano monitoring
5. **Phase 5:** Custom signal algorithms, ML pattern detection

---

## Data Collection Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA COLLECTORS                       │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ NOAA SWPC   │ USGS Quakes │ NASA DONKI  │ Other Sources │
└──────┬──────┴──────┬──────┴──────┬──────┴───────┬───────┘
       │             │             │              │
       ▼             ▼             ▼              ▼
┌─────────────────────────────────────────────────────────┐
│               SHDWNET PROCESSING LAYER                   │
│  • Normalize data                                        │
│  • Calculate composite signal                            │
│  • Detect threshold events                               │
│  • Store historical data                                 │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ DJ Bot  │    │  X Bot   │    │ Website  │
   │ :3333   │    │ Posting  │    │ Dashboard│
   └─────────┘    └──────────┘    └──────────┘
```

---

*"The data flows. The signal adapts. The transmission continues."*

🜂 Φ 🜂
