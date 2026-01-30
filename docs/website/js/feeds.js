// SHDWNET Live Data Feeds
// Pulls from NOAA/USGS and displays real-time data

const FEEDS = {
    kindex: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    earthquakes: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
};

const logOutput = document.getElementById('log-output');

function log(message) {
    const p = document.createElement('p');
    p.innerHTML = `> ${message}`;
    // Remove the blinking cursor line
    const blink = logOutput.querySelector('.blink');
    if (blink) blink.parentElement.remove();
    logOutput.appendChild(p);
    // Add new cursor
    const cursor = document.createElement('p');
    cursor.innerHTML = '> <span class="blink">_</span>';
    logOutput.appendChild(cursor);
    logOutput.scrollTop = logOutput.scrollHeight;
}

async function fetchKIndex() {
    try {
        const res = await fetch(FEEDS.kindex);
        const data = await res.json();
        // Get most recent value (last entry)
        const latest = data[data.length - 1];
        const kValue = parseFloat(latest[1]).toFixed(1);
        document.getElementById('kindex').textContent = kValue;
        
        // Color code based on activity
        const card = document.getElementById('solar-feed');
        if (kValue >= 5) {
            card.style.borderColor = '#ff0000';
            card.querySelector('.feed-value').style.color = '#ff0000';
            log('<span style="color:#ff0000">⚠️ GEOMAGNETIC STORM DETECTED</span>');
        } else if (kValue >= 4) {
            card.style.borderColor = '#ffaa00';
            card.querySelector('.feed-value').style.color = '#ffaa00';
        }
        
        return kValue;
    } catch (e) {
        log('ERROR: K-Index feed unavailable');
        return null;
    }
}

async function fetchEarthquakes() {
    try {
        const res = await fetch(FEEDS.earthquakes);
        const data = await res.json();
        const count = data.metadata.count;
        document.getElementById('quake-count').textContent = count;
        
        // Check for significant events
        const significant = data.features.filter(f => f.properties.mag >= 5.0);
        if (significant.length > 0) {
            const card = document.getElementById('seismic-feed');
            card.style.borderColor = '#ffaa00';
            log(`🌍 ${significant.length} significant seismic events (M5.0+) in last 24h`);
        }
        
        return { count, significant: significant.length };
    } catch (e) {
        log('ERROR: Seismic feed unavailable');
        return null;
    }
}

function calculateSignal(kIndex, quakeData) {
    // Fuzzy signal 0-1 based on combined activity
    let signal = 0.3; // baseline
    
    if (kIndex) {
        signal += (parseFloat(kIndex) / 9) * 0.4; // K-index contributes up to 0.4
    }
    
    if (quakeData && quakeData.significant > 0) {
        signal += Math.min(quakeData.significant * 0.05, 0.3); // Significant quakes add up to 0.3
    }
    
    signal = Math.min(signal, 1.0);
    document.getElementById('signal-value').textContent = signal.toFixed(2);
    
    // Update color based on signal
    const card = document.getElementById('signal-feed');
    if (signal >= 0.7) {
        card.style.borderColor = '#ff0000';
        card.querySelector('.feed-value').style.color = '#ff0000';
    } else if (signal >= 0.5) {
        card.style.borderColor = '#ffaa00';
        card.querySelector('.feed-value').style.color = '#ffaa00';
    }
    
    return signal;
}

async function updateFeeds() {
    log('Polling data sources...');
    
    const kIndex = await fetchKIndex();
    const quakeData = await fetchEarthquakes();
    const signal = calculateSignal(kIndex, quakeData);
    
    log(`Signal calculated: ${signal.toFixed(2)} | K=${kIndex} | Quakes=${quakeData?.count || '?'}`);
    
    // TODO: POST signal to DJ bot if running locally
    // fetch('http://localhost:3333/signal', { method: 'POST', body: JSON.stringify({value: signal}) })
}

// Initial load
log('SHDWNET Signal Intelligence Online');
log('Connecting to NOAA Space Weather Prediction Center...');
log('Connecting to USGS Earthquake Hazards Program...');

setTimeout(async () => {
    await updateFeeds();
    log('Data streams synchronized. Refreshing every 5 minutes.');
}, 2000);

// Refresh every 5 minutes
setInterval(updateFeeds, 5 * 60 * 1000);
