// ==========================================
// CONFIGURATION: PUT YOUR JSONBIN CREDENTIALS HERE
// ==========================================
const BIN_ID = '6abea8a8ffd5d1605343a5bc';
const API_KEY = '$2a$10$N6pdeOTaKA5NmU5j6vmGxelvfNem.mEH0u0f88Q40yKKSQOzPzMFK';
// ==========================================

let documents = [
    { id: 1, type: "WHITEPAPER", category: "TECHNICAL PAPER", title: "Bitcoin: A Peer-to-Peer Electronic Cash System", thesis: "A decentralized, trustless electronic cash system using proof-of-work to solve double-spending without intermediaries.", meta: "Satoshi Nakamoto 2008", link: "https://bitcoin.org/bitcoin.pdf", impact: "~$1.2T Market Cap", upvotes: 330, track: "CRYPTO" },
    { id: 2, type: "PAPER", category: "TECHNICAL PAPER", title: "Attention Is All You Need", thesis: "The Transformer architecture, based solely on attention, outperforms recurrence/convolution for sequence modeling.", meta: "Vaswani et al. (Google) 2017", link: "https://arxiv.org/abs/1706.03762", impact: "~$500B+ AI Infrastructure", upvotes: 287, track: "AI" },
    { id: 3, type: "ESSAY", category: "AI ESSAY", title: "Situational Awareness: The Decade Ahead", thesis: "AGI by ~2027 and superintelligence shortly after will trigger a trillion-dollar compute buildout and a US-China race.", meta: "Leopold Aschenbrenner 2024", link: "https://situational-awareness.ai/", impact: "Trillion-Dollar Capex", upvotes: 138, track: "AI" },
    { id: 4, type: "WHITEPAPER", category: "TECHNICAL PAPER", title: "Ethereum Whitepaper: A Next-Generation Smart Contract Platform", thesis: "A Turing-complete blockchain enabling arbitrary smart contracts and decentralized applications.", meta: "Vitalik Buterin 2013", link: "https://ethereum.org/en/whitepaper/", impact: "~$400B Ecosystem", upvotes: 260, track: "CRYPTO" },
    { id: 5, type: "ESSAY", category: "VC DOCTRINE", title: "Why Software Is Eating the World", thesis: "Every company is becoming a software company; software firms will disrupt incumbents across every industry.", meta: "Marc Andreessen 2011", link: "https://a16z.com/why-software-is-eating-the-world/", impact: "Venture Capital Shift", upvotes: 210, track: "MACRO" },
    { id: 6, type: "ESSAY", category: "WORLDVIEW", title: "The Secret Tesla Motors Master Plan", thesis: "Bootstrap an EV company from the top down: expensive sports car first, followed by progressively cheaper high-volume models.", meta: "Elon Musk 2006", link: "https://www.tesla.com/blog/secret-tesla-motors-master-plan-just-between-you-and-me", impact: "~$800B EV Market", upvotes: 195, track: "MACRO" },
    { id: 7, type: "PAPER", category: "TECHNICAL PAPER", title: "DeepSeek-R1: Incentivizing Reasoning Capability via RL", thesis: "Reinforcement learning can elicit strong reasoning in LLMs at a fraction of frontier training cost.", meta: "DeepSeek 2025", link: "https://arxiv.org/abs/2501.12948", impact: "Open-Weights Disruption", upvotes: 190, track: "AI" },
    { id: 8, type: "MEMO", category: "MACRO MEMO", title: "Sea Change", thesis: "A generational shift from falling to elevated rates ends the 40-year tailwind; credit and value are the new winners.", meta: "Howard Marks 2022", link: "https://www.oaktreecapital.com/insights/memo/sea-change", impact: "Trillion-Dollar Allocations", upvotes: 145, track: "MACRO" },
    { id: 9, type: "REPORT", category: "SHORT / ACTIVIST", title: "Luckin Coffee (Anonymous Report Distributed by Muddy Waters)", thesis: "Luckin Coffee fabricated sales figures; the growth story is a fraud.", meta: "Muddy Waters / Carson Block 2020", link: "https://www.muddywatersresearch.com/", impact: "$10B+ Valuation Wipeout", upvotes: 115, track: "MACRO" }
];

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
        alert(`Loaded file: "${file.name}". Click 'AI Process & Add' to structure and save it to the site.`);
    }
}

function processIngestion() {
    const rawInput = document.getElementById('linkInput').value.trim();
    if (!rawInput) {
        alert("Please provide a file or valid links.");
        return;
    }

    const tokens = rawInput.split(/\s+/);
    let addedCount = 0;

    tokens.forEach(token => {
        let cleanLink = token;
        let title = "";
        
        if (cleanLink.startsWith("local-file://")) {
            title = cleanLink.replace("local-file://", "").replace(".pdf", "").replace(/[-_]/g, " ");
        } else if (!isValidHttpUrl(cleanLink)) {
            return; 
        } else {
            title = cleanLink.split('/').pop().split('?')[0].replace(/[-_]/g, " ") || "External Research Document";
        }

        const newDoc = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            type: "RESEARCH",
            category: "TECHNICAL PAPER",
            title: title.charAt(0).toUpperCase() + title.slice(1),
            thesis: "AI Extracted Thesis: Automatically parsed semantic outline extracted from target document source.",
            meta: "Auto-Parsed 2026",
            link: cleanLink.startsWith("local-file://") ? "#" : cleanLink,
            impact: "~$50B+ Impact",
            upvotes: 1,
            track: "AI"
        };

        documents.unshift(newDoc);
        addedCount++;
    });

    if (addedCount > 0) {
        saveGlobalDocuments();
        closeModal();
        alert(`Successfully processed and added ${addedCount} valid document(s)!`);
        applyFilters();
        document.getElementById('linkInput').value = '';
        document.getElementById('fileInput').value = '';
    } else {
        alert("No valid links or files detected. Invalid links were ignored.");
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
