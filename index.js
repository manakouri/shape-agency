import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQ48kW1Eov65983S7J6WyHewrLcqw1-3o",
    authDomain: "geometry-87a8c.firebaseapp.com",
    projectId: "geometry-87a8c",
    storageBucket: "geometry-87a8c.firebasestorage.app",
    messagingSenderId: "535370913699",
    appId: "1:535370913699:web:e3e3e6cb05e21df8666c16",
    measurementId: "G-DQLDRDF3D8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// App State
let activeAgents = [];
let currentMission = null;

// --- NAVIGATION ---
window.showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
};

// --- LOGIN LOGIC ---
window.addAgent = () => {
    const pin = document.getElementById('pin-input').value;
    if (pin.length === 4) {
        activeAgents.push(pin);
        const pill = document.createElement('span');
        pill.className = 'agent-pill';
        pill.innerText = 'Agent ' + pin;
        document.getElementById('active-agents-list').appendChild(pill);
        document.getElementById('pin-input').value = '';
    } else {
        alert("Enter a valid 4-digit PIN");
    }
};

window.proceedToMissions = () => {
    if (activeAgents.length > 0) {
        showScreen('mission-screen');
        loadMissions();
    } else {
        alert("Log in at least one Agent.");
    }
};

// --- MISSION LOGIC ---
const missions = [
    { id: 1, title: "Mission 01: Vertex Scan", complexity: 1 },
    { id: 5, title: "Mission 05: Parallel Detect", complexity: 2 },
    { id: 17, title: "Mission 17: Triangle Sector", complexity: 3 }
];

function loadMissions() {
    const list = document.getElementById('mission-list');
    list.innerHTML = '';
    missions.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'sia-btn';
        btn.style.width = '100%';
        btn.innerText = m.title;
        btn.onclick = () => launchMission(m);
        list.appendChild(btn);
    });
}

function launchMission(mission) {
    currentMission = mission;
    document.getElementById('current-mission-title').innerText = mission.title;
    document.getElementById('mission-status-label').innerText = "MISSION ACTIVE";
    
    // Scaffolding UI based on complexity
    const container = document.getElementById('attribute-inputs');
    container.innerHTML = ''; // Clear old inputs

    if (mission.complexity >= 1) {
        container.innerHTML += `<label>Side Length (mm)</label><input type="number" id="data-sides" class="sia-input" style="width:100%">`;
    }
    if (mission.complexity >= 2) {
        container.innerHTML += `<label>Parallel Pairs</label><input type="number" id="data-parallel" class="sia-input" style="width:100%">`;
    }

    showScreen('terminal-screen');
}

// --- DATA SUBMISSION ---
window.submitMission = async () => {
    const report = {
        missionId: currentMission.id,
        agents: activeAgents,
        because: document.getElementById('box-because').value,
        but: document.getElementById('box-but').value,
        so: document.getElementById('box-so').value,
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "submissions"), report);
        alert("Intelligence Received. Returning to Mission Selection.");
        showScreen('mission-screen');
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};
