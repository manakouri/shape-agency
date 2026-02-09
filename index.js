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
// --- MASTER VALIDATION REGISTRY (VERIFIED AGAINST S.I.A DATA) ---
const validationRegistry = {
    "1": { "1": 3, "2": 4, "3": 4, "4": 5, "5": 6, "6": 6, "7": 7, "8": 10, "9": 10, "10": 12 },
    "2": { // Mission 2: Side Lengths (Accepts comma separated values)
        "1": [6, 6, 6],
        "2": [6, 4.2, 6.4, 2.4],
        "3": [6, 3.5, 6, 3.5],
        "4": [4.8, 3.1, 3.6, 3.6, 4.3],
        "5": [3.6, 3.6, 3.6, 3.6, 3.6, 3.6],
        "6": [6, 1.8, 3, 3, 3, 4.8],
        "7": [2.4, 2.4, 2.4, 2.4, 3.5, 3.5, 3.5],
        "8": [3.5, 3.5, 4.9],
        "9": [1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9],
        "10": [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
    },
    "3": { "1": 0, "2": 1, "3": 2, "4": 0, "5": 3, "6": 2, "7": 0, "8": 0, "9": 0, "10": 1 },
    "4": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 },
    "5": { "1": 0, "2": 2, "3": 0, "4": 0, "5": 0, "6": 5, "7": 0, "8": 0, "9": 0, "10": 0 },
    "6": { "1": 3, "2": 1, "3": 2, "4": 0, "5": 0, "6": 0, "7": 1, "8": 5, "9": 2, "10": 6 },
    "9": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 1, "7": 0, "8": 5, "9": 0, "10": 2 },
    "10": { "1": 3, "2": 0, "3": 0, "4": 0, "5": 6, "6": 0, "7": 0, "8": 1, "9": 0, "10": 0 },
    // Deep Dives (Min Vertices)
    "11":3, "12":3, "13":3, "14":4, "15":4, "16":4, "18":5, "19":6, "20":7, "21":9, "22":10, "23":11, "24":12
};

const missionRegistry = {
    "1": { title: "Counting Vertices", type: "bulk", fields: [{id:"v", label:"Vertices", type:"number"}] },
    "2": { title: "Side Lengths", type: "bulk", fields: [{id:"len", label:"Length (cm) - separate with commas", type:"text"}] },
    "3": { title: "Parallel Pairs", type: "bulk", fields: [{id:"para", label:"Parallel Pairs", type:"number"}] },
    "4": { title: "Right Angles", type: "bulk", fields: [{id:"right", label:"Right Angles", type:"number"}] },
    "5": { title: "Perpendicular Lines", type: "bulk", fields: [{id:"perp", label:"Perp. Pairs", type:"number"}] },
    "6": { title: "Acute Angles", type: "bulk", fields: [{id:"acute", label:"Acute Angles", type:"number"}] },
    "7": { title: "Naming Angles (0-180°)", type: "bulk", fields: [{id:"est", label:"Estimate", type:"number"}] },
    "8": { title: "Exact Measurements", type: "bulk", fields: [{id:"exact", label:"Degrees (°)", type:"number"}] },
    "9": { title: "Reflex Angles", type: "bulk", fields: [{id:"reflex", label:"Reflex Angles", type:"number"}] },
    "10": { title: "Lines of Symmetry", type: "bulk", fields: [{id:"symm", label:"Symmetry Lines", type:"number"}] },
    "11": { title: "Equilateral Triangles", type: "deep", target: "Triangle" },
    "12": { title: "Isosceles Triangles", type: "deep", target: "Triangle" },
    "13": { title: "Scalene Triangles", type: "deep", target: "Triangle" },
    "14": { title: "Rectangles", type: "deep", target: "Quadrilateral" },
    "15": { title: "Squares", type: "deep", target: "Quadrilateral" },
    "16": { title: "Rhombus", type: "deep", target: "Quadrilateral" },
    "17": { title: "Regularity Standard", type: "deep", target: "Polygon" },
    "18": { title: "Pentagon", type: "deep", target: "Pentagon" },
    "19": { title: "Hexagon", type: "deep", target: "Hexagon" },
    "20": { title: "Septagon", type: "deep", target: "Septagon" },
    "21": { title: "Nonagon", type: "deep", target: "Nonagon" },
    "22": { title: "Decagon", type: "deep", target: "Decagon" },
    "23": { title: "Hendecagon", type: "deep", target: "Hendecagon" },
    "24": { title: "Dodecagon", type: "deep", target: "Dodecagon" }
};

const deepFields = [
    {id:"v", label:"Vertices", type:"number"},
    {id:"ang", label:"Angle Data", type:"text"},
    {id:"par", label:"Parallel Pairs", type:"number"},
    {id:"per", label:"Perp. Pairs", type:"number"},
    {id:"sym", label:"Symmetry Lines", type:"number"}
];

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
