// SHDWNET Live Data Feeds
// OSINT + HUMINT aggregation → Master Signal

const FEEDS = {
    // OSINT
    solarXray: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json',
    kindex: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    plasma: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json',
    earthquakes: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    
    // HUMINT
    redditWorld: 'https://www.reddit.com/r/worldnews/.json',
    redditTech: 'https://www.reddit.com/r/technology/.json',
    hackerNews: 'https://hacker-news.firebaseio.com/v0/topstories.json'
};

// Crisis/hype keywords
const CRISIS_KEYWORDS = ['breaking', 'urgent', 'war', 'attack', 'explosion', 'crisis', 'emergency', 'earthquake', 'tsunami'];
const TECH_KEYWORDS = ['ai', 'quantum', 'breakthrough', 'spacex', 'nasa', 'fusion', 'crypto'];

// Sigil mappings
const SIGILS = {
    phi: 'Φ', vesica: '⦿', seed: '✧', flower: '❀', metatron: '✡',
    hexagram: '⬡', pentacle: '⛤', ouroboros: '☯', eye: '👁', spiral: '🌀'
};

const logOutput = document.getElementById('log-output');
let data = {};

function log(message, type = 'info') {
    const p = document.createElement('p');
    const color = type === 'alert' ? '#ff0000' : type === 'warn' ? '#ffaa00' : '#00ff00';
    p.innerHTML = `> <span style="color:${color}">${message}</span>`;
    const blink = logOutput.querySelector('.blink');
    if (blink) blink.parentElement.remove();
    logOutput.appendChild(p);
    const cursor = document.createElement('p');
    cursor.innerHTML = '> <span class="blink">_</span>';
    logOutput.appendChild(cursor);
    logOutput.scrollTop = logOutput.scrollHeight;
}

// === OSINT FETCHERS ===

async function fetchSolarXray() {
    try {
        const res = await fetch(FEEDS.solarXray);
        const json = await res.json();
        const flux = json[json.length - 1]?.flux || 1e-8;
        
        let level, signal;
        if (flux >= 1e-4) { level = 'X-CLASS 🔥'; signal = 1.0; }
        else if (flux >= 1e-5) { level = 'M-Class'; signal = 0.8; }
        else if (flux >= 1e-6) { level = 'C-Class'; signal = 0.5; }
        else if (flux >= 1e-7) { level = 'B-Class'; signal = 0.3; }
        else { level = 'Quiet'; signal = 0.15; }
        
        document.getElementById('solar-flux').textContent = flux.toExponential(1);
        document.getElementById('solar-status').textContent = level;
        
        if (signal >= 0.8) {
            document.getElementById('solar-feed').style.borderColor = '#ff0000';
            log(`☀️ SOLAR FLARE: ${level}`, 'alert');
        }
        
        return { flux, level, signal };
    } catch (e) {
        log('Solar X-ray feed error', 'warn');
        return { signal: 0.3 };
    }
}

async function fetchKIndex() {
    try {
        const res = await fetch(FEEDS.kindex);
        const json = await res.json();
        const kValue = parseFloat(json[json.length - 1][1]);
        
        let status = 'Quiet';
        if (kValue >= 7) status = 'SEVERE STORM';
        else if (kValue >= 5) status = 'Storm';
        else if (kValue >= 4) status = 'Active';
        
        document.getElementById('kindex').textContent = kValue.toFixed(0);
        document.getElementById('kindex-status').textContent = status;
        
        if (kValue >= 5) {
            document.getElementById('kindex-feed').style.borderColor = '#ff0000';
            log(`🧲 GEOMAGNETIC STORM: K=${kValue}`, 'alert');
        }
        
        return { kValue, status, signal: Math.min(1, kValue / 9) };
    } catch (e) {
        log('K-Index feed error', 'warn');
        return { signal: 0.2 };
    }
}

async function fetchPlasma() {
    try {
        const res = await fetch(FEEDS.plasma);
        const json = await res.json();
        const latest = json[json.length - 1];
        const density = parseFloat(latest[1]) || 3;
        const speed = parseFloat(latest[2]) || 400;
        const temp = parseFloat(latest[3]) || 100000;
        
        document.getElementById('plasma-speed').textContent = speed.toFixed(0);
        document.getElementById('plasma-density').textContent = `Density: ${density.toFixed(1)} p/cm³`;
        
        return {
            density: Math.min(1, density / 15),
            speed: Math.min(1, (speed - 250) / 500),
            temp: Math.min(1, temp / 500000),
            raw: { density, speed, temp }
        };
    } catch (e) {
        log('Plasma feed error', 'warn');
        return { density: 0.3, speed: 0.4, temp: 0.3 };
    }
}

async function fetchEarthquakes() {
    try {
        const res = await fetch(FEEDS.earthquakes);
        const json = await res.json();
        const features = json.features || [];
        const count = features.length;
        const maxMag = features.length ? Math.max(...features.map(f => f.properties.mag || 0)) : 0;
        
        document.getElementById('quake-count').textContent = count;
        document.getElementById('quake-max').textContent = `Max: M${maxMag.toFixed(1)}`;
        
        if (maxMag >= 5) {
            document.getElementById('seismic-feed').style.borderColor = '#ffaa00';
            log(`🌍 Significant quake: M${maxMag.toFixed(1)}`, 'warn');
        }
        
        const signal = Math.min(1, maxMag / 7) * 0.7 + Math.min(1, count / 10) * 0.3;
        return { count, maxMag, signal };
    } catch (e) {
        log('Seismic feed error', 'warn');
        return { signal: 0.2 };
    }
}

// === HUMINT FETCHERS ===

async function fetchReddit() {
    try {
        const res = await fetch(FEEDS.redditWorld);
        const json = await res.json();
        const posts = json.data?.children || [];
        
        let crisisCount = 0;
        let totalScore = 0;
        
        posts.slice(0, 25).forEach(p => {
            const title = p.data.title.toLowerCase();
            totalScore += p.data.score;
            if (CRISIS_KEYWORDS.some(k => title.includes(k))) crisisCount++;
        });
        
        const avgScore = totalScore / Math.min(25, posts.length);
        const activity = Math.min(1, avgScore / 50000);
        const crisis = Math.min(1, crisisCount / 5);
        
        document.getElementById('reddit-activity').textContent = (activity * 100).toFixed(0) + '%';
        document.getElementById('reddit-crisis').textContent = crisisCount > 0 ? `${crisisCount} crisis keywords` : 'Normal';
        
        if (crisisCount >= 3) {
            document.getElementById('reddit-feed').style.borderColor = '#ff0000';
            log(`📱 High crisis activity on Reddit: ${crisisCount} flags`, 'alert');
        }
        
        return { activity, crisis, signal: (activity * 0.5 + crisis * 0.5) };
    } catch (e) {
        document.getElementById('reddit-activity').textContent = 'N/A';
        return { signal: 0.3 };
    }
}

async function fetchHackerNews() {
    try {
        const res = await fetch(FEEDS.hackerNews);
        const ids = await res.json();
        
        // Just use count of top stories as proxy
        const activity = Math.min(1, ids.length / 500);
        document.getElementById('hn-activity').textContent = ids.length;
        document.getElementById('hn-tech').textContent = 'Tech pulse active';
        
        return { activity, signal: activity * 0.5 };
    } catch (e) {
        document.getElementById('hn-activity').textContent = 'N/A';
        return { signal: 0.3 };
    }
}

// === PLANETARY ===

function calculatePlanetary() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const hour = now.getHours() + now.getMinutes() / 60;
    
    // Moon phase (simplified)
    const moonCycle = 29.53;
    const knownNewMoon = new Date('2024-01-11');
    const daysSinceNew = (now - knownNewMoon) / 86400000;
    const moonPhase = (daysSinceNew % moonCycle) / moonCycle;
    
    let moonName;
    if (moonPhase < 0.03 || moonPhase > 0.97) moonName = 'New Moon 🌑';
    else if (moonPhase < 0.22) moonName = 'Waxing Crescent 🌒';
    else if (moonPhase < 0.28) moonName = 'First Quarter 🌓';
    else if (moonPhase < 0.47) moonName = 'Waxing Gibbous 🌔';
    else if (moonPhase < 0.53) moonName = 'Full Moon 🌕';
    else if (moonPhase < 0.72) moonName = 'Waning Gibbous 🌖';
    else if (moonPhase < 0.78) moonName = 'Last Quarter 🌗';
    else moonName = 'Waning Crescent 🌘';
    
    document.getElementById('moon-phase').textContent = (moonPhase * 100).toFixed(0) + '%';
    document.getElementById('moon-name').textContent = moonName;
    
    // Simplified aspect calculation
    const planets = {
        mercury: (dayOfYear * 4.15) % 360,
        venus: (dayOfYear * 1.62) % 360,
        mars: (dayOfYear * 0.52) % 360,
        jupiter: (dayOfYear * 0.083) % 360,
        saturn: (dayOfYear * 0.034) % 360
    };
    
    const sunPos = (dayOfYear * 0.986) % 360;
    const aspects = [];
    
    Object.entries(planets).forEach(([name, pos]) => {
        const diff = Math.abs(pos - sunPos);
        if (diff < 10 || diff > 350) aspects.push(`${name} ☌`);
        else if (Math.abs(diff - 180) < 10) aspects.push(`${name} ☍`);
        else if (Math.abs(diff - 120) < 10) aspects.push(`${name} △`);
    });
    
    document.getElementById('aspect-count').textContent = aspects.length;
    document.getElementById('aspect-list').textContent = aspects.length ? aspects.join(', ') : 'None active';
    
    return { moonPhase, aspects, planets };
}

// === SIGIL SELECTION ===

function selectSigil(data) {
    let sigil = 'phi';
    
    if (data.solar?.signal > 0.7) sigil = 'eye';
    else if (data.earthquake?.signal > 0.6) sigil = 'spiral';
    else if (data.planetary?.moonPhase > 0.45 && data.planetary?.moonPhase < 0.55) sigil = 'flower';
    else if (data.planetary?.aspects?.length > 2) sigil = 'metatron';
    else if (data.plasma?.speed > 0.6) sigil = 'ouroboros';
    else {
        const idx = Math.floor(Date.now() / 300000) % Object.keys(SIGILS).length;
        sigil = Object.keys(SIGILS)[idx];
    }
    
    document.getElementById('current-sigil').textContent = SIGILS[sigil];
    document.getElementById('sigil-name').textContent = sigil;
    
    return sigil;
}

// === MASTER SIGNAL ===

function calculateMasterSignal(data) {
    const weights = {
        earthquake: 0.20,
        solar: 0.15,
        kindex: 0.10,
        plasma: 0.15,
        reddit: 0.15,
        hn: 0.10,
        chaos: 0.15
    };
    
    let signal = 
        (data.earthquake?.signal || 0.2) * weights.earthquake +
        (data.solar?.signal || 0.3) * weights.solar +
        (data.kindex?.signal || 0.2) * weights.kindex +
        (data.plasma?.speed || 0.3) * weights.plasma +
        (data.reddit?.signal || 0.3) * weights.reddit +
        (data.hn?.signal || 0.3) * weights.hn +
        Math.random() * weights.chaos;
    
    signal = Math.max(0.1, Math.min(1.0, signal));
    
    document.getElementById('master-signal').textContent = signal.toFixed(2);
    document.getElementById('master-signal-bar').style.width = (signal * 100) + '%';
    
    // Color based on level
    const bar = document.getElementById('master-signal-bar');
    if (signal >= 0.7) bar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
    else if (signal >= 0.5) bar.style.background = 'linear-gradient(90deg, #ffaa00, #ffff00)';
    else bar.style.background = 'linear-gradient(90deg, #00ff00, #00ffaa)';
    
    return signal;
}

// === MAIN UPDATE ===

async function updateFeeds() {
    log('Polling all data sources...');
    
    // Fetch all in parallel
    const [solar, kindex, plasma, earthquake, reddit, hn] = await Promise.all([
        fetchSolarXray(),
        fetchKIndex(),
        fetchPlasma(),
        fetchEarthquakes(),
        fetchReddit(),
        fetchHackerNews()
    ]);
    
    const planetary = calculatePlanetary();
    
    data = { solar, kindex, plasma, earthquake, reddit, hn, planetary };
    
    const sigil = selectSigil(data);
    const masterSignal = calculateMasterSignal(data);
    
    log(`Master Signal: ${(masterSignal * 100).toFixed(0)}% | Sigil: ${sigil}`);
    
    // Check downstream status (placeholder)
    document.getElementById('dj-status').textContent = '●';
    document.getElementById('dj-status').style.color = '#00ff00';
    document.getElementById('hydra-status').textContent = '●';
    document.getElementById('hydra-status').style.color = '#00ff00';
    document.getElementById('xbot-status').textContent = '●';
    document.getElementById('xbot-status').style.color = '#888';
}

// === INIT ===

log('SHDWNET Signal Intelligence v2.0');
log('Initializing OSINT feeds...');
log('Initializing HUMINT feeds...');
log('Calculating celestial positions...');

setTimeout(async () => {
    await updateFeeds();
    log('All streams synchronized. Refresh: 5 min.');
}, 1500);

setInterval(updateFeeds, 5 * 60 * 1000);
