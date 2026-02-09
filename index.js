import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQ48kW1Eov65983S7J6WyHewrLcqw1-3o",
    authDomain: "geometry-87a8c.firebaseapp.com",
    projectId: "geometry-87a8c",
    storageBucket: "geometry-87a8c.firebasestorage.app",
    messagingSenderId: "535370913699",
    appId: "1:535370913699:web:e3e3e6cb05e21df8666c16"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- DATA REGISTRY (VERIFIED MISSIONS 1-10) ---
const validationRegistry = {
    "1": { "1": 3, "2": 4, "3": 4, "4": 5, "5": 6, "6": 6, "7": 7, "8": 10, "9": 10, "10": 12 },
    "2": {
        "1": [6, 6, 6], "2": [6, 4.2, 6.4, 2.4], "3": [6, 3.5, 6, 3.5], 
        "4": [4.8, 3.1, 3.6, 3.6, 4.3], "5": [3.6, 3.6, 3.6, 3.6, 3.6, 3.6],
        "6": [6, 1.8, 3, 3, 3, 4.8], "7": [3.6, 3.1, 3.1, 3, 2.6, 3, 2],
        "8": [2.2, 2.2, 1.9, 2.6, 2.8, 2.8, 2.6, 1.9, 2.2, 2.2],
        "9": [2.5, 3.1, 2.2, 3.1, 2.6, 1.9, 1.9, 2.6, 2.8, 1.3],
        "10": [3.7, 3.7, 2.7, 3.1, 1.7, 2.5, 2.5, 1.7, 3.1, 2.1, 1.3, 0.7]
    },
    "3": { "1": 0, "2": 1, "3": 2, "4": 0, "5": 3, "6": 2, "7": 0, "8": 0, "9": 0, "10": 1 },
    "4": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 },
    "5": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 },
    "6": { "1": 3, "2": 1, "3": 2, "4": 0, "5": 0, "6": 0, "7": 1, "8": 5, "9": 2, "10": 6 },
    "10": { "1": 3, "2": 0, "3": 0, "4": 0, "5": 6, "6": 0, "7": 0, "8": 1, "9": 0, "10": 0 }
};

const missionRegistry = {
    "1": { title: "Mission 01: Vertex Scan", fields: [{id:"v", label:"Vertices"}] },
    "2": { title: "Mission 02: Side Lengths", fields: [{id:"len", label:"Length (cm) - separate with commas"}] },
    "3": { title: "Mission 03: Parallel Pairs", fields: [{id:"para", label:"Parallel Pairs"}] },
    "4": { title: "Mission 04: Right Angles", fields: [{id:"right", label:"Right Angles"}] },
    "10": { title: "Mission 10: Symmetry", fields: [{id:"symm", label:"Symmetry Lines"}] }
};

let loggedInAgents = [];
let activeMissionId = 1;

// --- EXPOSE TO HTML ---
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.teacherLogin = () => signInWithPopup(auth, provider).catch(e => alert(e.message));
window.staffLogout = () => auth.signOut().then(() => location.reload());

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.showScreen('teacher-screen');
        const sel = document.getElementById('mission-release-select');
        if (sel) {
            sel.innerHTML = Object.keys(missionRegistry).map(k => `<option value="${k}">${missionRegistry[k].title}</option>`).join('');
        }
    }
});

window.registerAgent = () => {
    const input = document.getElementById('agent-id-input');
    if (input.value.length === 4) {
        if (!loggedInAgents.includes(input.value)) {
            loggedInAgents.push(input.value);
            document.getElementById('active-agents-list').innerHTML += `<span class="agent-pill">AGENT ${input.value}</span> `;
        }
    }
    input.value = '';
};

window.startOperation = () => {
    if (loggedInAgents.length > 0) {
        document.getElementById('session-controls').style.display = 'flex';
        window.showScreen('home-screen');
    }
};

window.renderMissionHub = () => {
    document.getElementById('active-mission-list').innerHTML = `
        <div class="sia-card linked" onclick="window.openMission(${activeMissionId})">
            <h3>${missionRegistry[activeMissionId].title}</h3>
            <p>ENTER DATA ARCHIVE</p>
        </div>`;
    window.showScreen('mission-hub');
};

window.openMission = (id) => {
    const m = missionRegistry[id];
    document.getElementById('polygon-entry-list').innerHTML = Array.from({length: 10}, (_, i) => `
        <div class="sia-card">
            <h3>POLYGON ${i+1}</h3>
            ${m.fields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-poly="${i+1}">`).join('')}
        </div>`).join('');
    window.showScreen('mission-entry');
};

window.releaseMission = () => {
    activeMissionId = parseInt(document.getElementById('mission-release-select').value);
    alert("HQ: Mission Broadast Updated.");
};

window.submitMissionBatch = async () => {
    const inputs = document.querySelectorAll('.m-in');
    let errors = [];
    const master = validationRegistry[activeMissionId];

    inputs.forEach(i => {
        if (!i.value) return;
        const polyId = i.dataset.poly;
        if (activeMissionId === 2) {
            const student = i.value.split(',').map(v => parseFloat(v.trim())).sort();
            const correct = [...master[polyId]].sort();
            if (student.length !== correct.length || student.some((v, idx) => Math.abs(v - correct[idx]) > 0.2)) errors.push(`P${polyId}`);
        } else if (parseInt(i.value) !== master[polyId]) {
            errors.push(`P${polyId}`);
        }
    });

    if (errors.length > 0) return alert(`SATELLITE WARNING: Discrepancy in ${errors.join(', ')}`);
    alert("INTELLIGENCE SEALED.");
    window.showScreen('home-screen');
};
