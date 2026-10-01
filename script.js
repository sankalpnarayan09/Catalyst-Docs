// ==========================================
// CONFIGURATION: CREDENTIALS
// ==========================================
// ==========================================
// CONFIGURATION: CREDENTIALS
// ==========================================
const BIN_ID = 'YOUR_ACTUAL_BIN_ID_HERE';
const API_KEY = 'YOUR_ACTUAL_MASTER_KEY_HERE';
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Get free from aistudio.google.com
// ==========================================

let documents = [];
let activeTrack = 'ALL';
let userVotes = JSON.parse(localStorage.getItem('catalyst_user_votes') || '{}');

// Fetch global documents from JSONBin cloud database
async function loadGlobalDocuments() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        if (data && data.record) {
            documents = data.record;
        }
    } catch (e) {
        console.log("Using local cache fallback");
    }
}

// Save global documents to JSONBin cloud database
async function saveGlobalDocuments() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(documents)
        });
    } catch (e) {
        console.log("Failed to sync to cloud");
    }
    localStorage.setItem('catalyst_user_votes', JSON.stringify(userVotes));
}

function toggleDarkMode() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
}

function upvoteDoc(id) {
    if (userVotes[id]) {
        alert("You have already upvoted this document.");
        return;
    }
    const doc = documents.find(d => d.id === id);
    if (doc) {
        doc.upvotes += 1;
        userVotes[id] = true;
        saveGlobalDocuments();
        applyFilters();
    }
}

function filterTrack(trackName) {
    activeTrack = trackName;
    document.querySelectorAll('.track-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    applyFilters();
}

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('linkInput').value = `local-file://${file.name}`;
        alert(`Loaded file: "${file.name}". Click 'AI Process & Add' to let Gemini analyze it!`);
    }
}

// Real Client-Side Gemini AI Engine Integration
async function processIngestion() {
    const rawInput = document.getElementById('linkInput').value.trim();
    if (!rawInput) {
        alert("Please provide a file or valid link.");
        return;
    }

    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        alert("Please paste your free Gemini API key into script.js first!");
        return;
    }

    const tokens = rawInput.split(/\s+/);
    let addedCount = 0;

    for (let token of tokens) {
        let cleanLink = token;
        let sourceTarget = cleanLink.startsWith("local-file://") ? cleanLink.replace("local-file://", "") : cleanLink;
        
        if (!cleanLink.startsWith("local-file://") && !isValidHttpUrl(cleanLink)) {
            continue; 
        }

        // Call Google Gemini API directly from browser for zero-cost intelligence
        try {
            const prompt = `Analyze this document reference or link: "${sourceTarget}". 
            Extract and output ONLY a valid JSON object with these exact keys:
            {
              "title": "Clean professional title of the document",
              "thesis": "A concise 1-2 sentence core thesis or summary of what this document covers.",
              "category": "Choose one: TECHNICAL PAPER, AI ESSAY, WORLDVIEW, VC DOCTRINE, MACRO MEMO, or SHORT / ACTIVIST",
              "track": "Choose one: AI, CRYPTO, or MACRO",
              "impact": "Estimated market impact or capital allocation figure (e.g., ~$100B Market Cap)"
            }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            const aiData = await response.json();
            const parsedResult = JSON.parse(aiData.candidates[0].content.parts[0].text);

            const newDoc = {
                id: Date.now() + Math.floor(Math.random() * 10000),
                type: "RESEARCH",
                category: parsedResult.category || "TECHNICAL PAPER",
                title: parsedResult.title || "External Research Document",
                thesis: parsedResult.thesis || "Gemini AI analyzed document summary.",
                meta: "Gemini 2.5 Flash 2026",
                link: cleanLink.startsWith("local-file://") ? "#" : cleanLink,
                impact: parsedResult.impact || "~$50B+ Impact",
                upvotes: 1,
                track: parsedResult.track || "AI"
            };

            documents.unshift(newDoc);
            addedCount++;
        } catch (err) {
            console.error("Gemini API Error:", err);
            alert("Error communicating with Gemini API. Check your API key.");
            return;
        }
    }

    if (addedCount > 0) {
        saveGlobalDocuments();
        closeModal();
        alert(`Gemini AI successfully processed and added ${addedCount} document(s)!`);
        applyFilters();
        document.getElementById('linkInput').value = '';
        document.getElementById('fileInput').value = '';
    } else {
        alert("No valid links processed.");
    }
}

function renderCards(data) {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';
    
    data.forEach(doc => {
        const hasVoted = userVotes[doc.id] ? 'voted' : '';
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span>${doc.type}</span>
                    <div class="badges">
                        <span class="impact-badge">${doc.impact}</span>
                        <span class="card-category">${doc.category}</span>
                    </div>
                </div>
                <div class="card-content">
                    <h2>${doc.title}</h2>
                    <p>${doc.thesis}</p>
                </div>
            </div>
            <div class="card-footer">
                <span class="meta-info">${doc.meta}</span>
                <div class="footer-actions">
                    <button class="upvote-btn ${hasVoted}" onclick="upvoteDoc(${doc.id})">▲ ${doc.upvotes}</button>
                    <a href="${doc.link}" target="_blank" class="read-link">Read →</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    document.getElementById('docCount').innerText = `${data.length} documents`;
}

function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    let filtered = documents.filter(doc => {
        const matchesQuery = doc.title.toLowerCase().includes(query) || 
                             doc.thesis.toLowerCase().includes(query) || 
                             doc.meta.toLowerCase().includes(query);
        const matchesCategory = category === "" || doc.category === category;
        const matchesTrack = activeTrack === 'ALL' || doc.track === activeTrack;
        return matchesQuery && matchesCategory && matchesTrack;
    });

    filtered.sort((a, b) => b.upvotes - a.upvotes);
    renderCards(filtered);
}

function openModal() {
    document.getElementById('suggestModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('suggestModal').style.display = 'none';
}

// Initialize Application with Cloud Sync
loadGlobalDocuments().then(() => {
    applyFilters();
});
// ==========================================

let documents = [];
let activeTrack = 'ALL';
let userVotes = JSON.parse(localStorage.getItem('catalyst_user_votes') || '{}');

// Fetch global documents from JSONBin cloud database
async function loadGlobalDocuments() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        if (data && data.record) {
            documents = data.record;
        }
    } catch (e) {
        console.log("Using local cache fallback");
    }
}

// Save global documents to JSONBin cloud database
async function saveGlobalDocuments() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(documents)
        });
    } catch (e) {
        console.log("Failed to sync to cloud");
    }
    localStorage.setItem('catalyst_user_votes', JSON.stringify(userVotes));
}

function toggleDarkMode() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
}

function upvoteDoc(id) {
    if (userVotes[id]) {
        alert("You have already upvoted this document.");
        return;
    }
    const doc = documents.find(d => d.id === id);
    if (doc) {
        doc.upvotes += 1;
        userVotes[id] = true;
        saveGlobalDocuments();
        applyFilters();
    }
}

function filterTrack(trackName) {
    activeTrack = trackName;
    document.querySelectorAll('.track-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    applyFilters();
}

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('linkInput').value = `local-file://${file.name}`;
        alert(`Loaded file: "${file.name}". Click 'AI Process & Add' to let Gemini analyze it!`);
    }
}

// Real Client-Side Gemini AI Engine Integration
async function processIngestion() {
    const rawInput = document.getElementById('linkInput').value.trim();
    if (!rawInput) {
        alert("Please provide a file or valid link.");
        return;
    }

    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        alert("Please paste your free Gemini API key into script.js first!");
        return;
    }

    const tokens = rawInput.split(/\s+/);
    let addedCount = 0;

    for (let token of tokens) {
        let cleanLink = token;
        let sourceTarget = cleanLink.startsWith("local-file://") ? cleanLink.replace("local-file://", "") : cleanLink;
        
        if (!cleanLink.startsWith("local-file://") && !isValidHttpUrl(cleanLink)) {
            continue; 
        }

        // Call Google Gemini API directly from browser for zero-cost intelligence
        try {
            const prompt = `Analyze this document reference or link: "${sourceTarget}". 
            Extract and output ONLY a valid JSON object with these exact keys:
            {
              "title": "Clean professional title of the document",
              "thesis": "A concise 1-2 sentence core thesis or summary of what this document covers.",
              "category": "Choose one: TECHNICAL PAPER, AI ESSAY, WORLDVIEW, VC DOCTRINE, MACRO MEMO, or SHORT / ACTIVIST",
              "track": "Choose one: AI, CRYPTO, or MACRO",
              "impact": "Estimated market impact or capital allocation figure (e.g., ~$100B Market Cap)"
            }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            const aiData = await response.json();
            const parsedResult = JSON.parse(aiData.candidates[0].content.parts[0].text);

            const newDoc = {
                id: Date.now() + Math.floor(Math.random() * 10000),
                type: "RESEARCH",
                category: parsedResult.category || "TECHNICAL PAPER",
                title: parsedResult.title || "External Research Document",
                thesis: parsedResult.thesis || "Gemini AI analyzed document summary.",
                meta: "Gemini 2.5 Flash 2026",
                link: cleanLink.startsWith("local-file://") ? "#" : cleanLink,
                impact: parsedResult.impact || "~$50B+ Impact",
                upvotes: 1,
                track: parsedResult.track || "AI"
            };

            documents.unshift(newDoc);
            addedCount++;
        } catch (err) {
            console.error("Gemini API Error:", err);
            alert("Error communicating with Gemini API. Check your API key.");
            return;
        }
    }

    if (addedCount > 0) {
        saveGlobalDocuments();
        closeModal();
        alert(`Gemini AI successfully processed and added ${addedCount} document(s)!`);
        applyFilters();
        document.getElementById('linkInput').value = '';
        document.getElementById('fileInput').value = '';
    } else {
        alert("No valid links processed.");
    }
}

function renderCards(data) {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';
    
    data.forEach(doc => {
        const hasVoted = userVotes[doc.id] ? 'voted' : '';
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span>${doc.type}</span>
                    <div class="badges">
                        <span class="impact-badge">${doc.impact}</span>
                        <span class="card-category">${doc.category}</span>
                    </div>
                </div>
                <div class="card-content">
                    <h2>${doc.title}</h2>
                    <p>${doc.thesis}</p>
                </div>
            </div>
            <div class="card-footer">
                <span class="meta-info">${doc.meta}</span>
                <div class="footer-actions">
                    <button class="upvote-btn ${hasVoted}" onclick="upvoteDoc(${doc.id})">▲ ${doc.upvotes}</button>
                    <a href="${doc.link}" target="_blank" class="read-link">Read →</a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    document.getElementById('docCount').innerText = `${data.length} documents`;
}

function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    let filtered = documents.filter(doc => {
        const matchesQuery = doc.title.toLowerCase().includes(query) || 
                             doc.thesis.toLowerCase().includes(query) || 
                             doc.meta.toLowerCase().includes(query);
        const matchesCategory = category === "" || doc.category === category;
        const matchesTrack = activeTrack === 'ALL' || doc.track === activeTrack;
        return matchesQuery && matchesCategory && matchesTrack;
    });

    filtered.sort((a, b) => b.upvotes - a.upvotes);
    renderCards(filtered);
}

function openModal() {
    document.getElementById('suggestModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('suggestModal').style.display = 'none';
}

// Initialize Application with Cloud Sync
loadGlobalDocuments().then(() => {
    applyFilters();
});
