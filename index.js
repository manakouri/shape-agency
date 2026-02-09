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

// --- MASTER VALIDATION REGISTRY ---
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
    "9": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 1, "7": 0, "8": 5, "9": 0, "10": 2 },
    "10": { "1": 3, "2": 0, "3": 0, "4": 0, "5": 6, "6": 0, "7": 0, "8": 1, "9": 0, "10": 0 },
    "11":3, "12":3, "13":3, "14":4, "15":4, "16":4, "17":3, "18":5, "19":6, "20":7, "21":9, "22":10, "23":11, "24":12
};

const missionRegistry = {
    "1": { title: "M01: Vertex Scan", type: "bulk", fields: [{id:"v", label:"Vertices"}] },
    "2": { title: "M02: Side Lengths", type: "bulk", fields: [{id:"len", label:"Length (cm)"}] },
    "3": { title: "M03: Parallel Pairs", type: "bulk", fields: [{id:"para", label:"Parallel Pairs"}] },
    "4": { title: "M04: Right Angles", type: "bulk", fields: [{id:"right", label:"Right Angles"}] },
    "5": { title: "M05: Perpendicular Lines", type: "bulk", fields: [{id:"perp", label:"Perp. Pairs"}] },
    "6": { title: "M06: Acute Angles", type: "bulk", fields: [{id:"acute", label:"Acute Angles"}] },
    "7": { title: "M07: Angle Naming", type: "bulk", fields: [{id:"name", label:"Type (Acute/Obtuse/etc)"}] },
    "8": { title: "M08: Exact Angles", type: "bulk", fields: [{id:"deg", label:"Degrees (°)"}] },
    "9": { title: "M09: Reflex Angles", type: "bulk", fields: [{id:"reflex", label:"Reflex Angles"}] },
    "10": { title: "M10: Symmetry", type: "bulk", fields: [{id:"symm", label:"Symmetry Lines"}] },
    "11": { title: "M11: Equilateral", type: "deep", target: "Triangle" },
    "12": { title: "M12: Isosceles", type: "deep", target: "Triangle" },
    "13": { title: "M13: Scalene", type: "deep", target: "Triangle" },
    "14": { title: "M14: Rectangles", type: "deep", target: "Quadrilateral" },
    "15": { title: "M15: Squares", type: "deep", target: "Quadrilateral" },
    "16": { title: "M16: Rhombus", type: "deep", target: "Quadrilateral" },
    "17": { title: "M17: Regularity", type: "deep", target: "Polygon" },
    "18": { title: "M18: Pentagon", type: "deep", target: "Pentagon" },
    "19": { title: "M19: Hexagon", type: "deep", target: "Hexagon" },
    "20": { title: "M20: Septagon", type: "deep", target: "Septagon" },
    "21": { title: "M21: Nonagon", type: "deep", target: "Nonagon" },
    "22": { title: "M22: Decagon", type: "deep", target: "Decagon" },
    "23": { title: "M23: Hendecagon", type: "deep", target: "Hendecagon" },
    "24": { title: "M24: Dodecagon", type: "deep", target: "Dodecagon" }
};

const deepFields = [
    {id:"v", label:"Vertices", type:"number"},
    {id:"ang", label:"Angle Data", type:"text"},
    {id:"par", label:"Parallel Pairs", type:"number"},
    {id:"sym", label:"Symmetry Lines", type:"number"}
];

let loggedInAgents = [];
let activeMissionId = 1;

// --- DATABASE & AUTH ---
window.authoriseAgent = async () => {
    const name = document.getElementById('new-agent-name').value.trim();
    const code = document.getElementById('new-agent-code').value.trim();
    if (name && code.length === 4) {
        await setDoc(doc(db, "agents", code), { agentName: name, agentCode: code });
        document.getElementById('new-agent-name').value = '';
        document.getElementById('new-agent-code').value = '';
    }
};

const listenToRoster = () => {
    onSnapshot(collection(db, "agents"), (snap) => {
        const roster = document.getElementById('roster-list');
        if (roster) {
            roster.innerHTML = '';
            snap.forEach(d => {
                const a = d.data();
                roster.innerHTML += `<div style="padding:5px; border-bottom:1px solid #222; font-size:0.8rem;">${a.agentName} <span style="color:var(--sia-blue)">[${a.agentCode}]</span></div>`;
            });
        }
    });
};

window.registerAgent = async () => {
    const code = document.getElementById('agent-id-input').value.trim();
    if (code.length === 4) {
        const q = query(collection(db, "agents"), where("agentCode", "==", code));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const data = snap.docs[0].data();
            if (!loggedInAgents.includes(code)) {
                loggedInAgents.push(code);
                document.getElementById('active-agents-list').innerHTML += `<span class="agent-pill">AGENT ${data.agentName}</span> `;
            }
        } else { alert("ACCESS DENIED: Code Unknown."); }
    }
    document.getElementById('agent-id-input').value = '';
};

// --- MISSION LOGIC ---
window.openMission = (id) => {
    const m = missionRegistry[id];
    const container = document.getElementById('polygon-entry-list');
    container.innerHTML = '';
    const isBulk = m.type === "bulk";
    const count = isBulk ? 10 : 3;
    const fields = isBulk ? m.fields : deepFields;

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="sia-card">
                <h3>${isBulk ? 'POLYGON' : m.target} ${i}</h3>
                ${fields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-poly="${i}" data-f="${f.id}">`).join('')}
                ${!isBulk ? `<label>SIA Field Notes (Shared Traits)</label><textarea class="sia-input"></textarea>` : ''}
            </div>`;
    }
    window.showScreen('mission-entry');
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
        } else if (missionRegistry[activeMissionId].type === "bulk") {
             if (master && parseInt(i.value) !== master[polyId]) errors.push(`P${polyId}`);
        } else {
             // Deep dive validation (e.g., minimum vertices check)
             if (i.dataset.f === 'v' && parseInt(i.value) < master) errors.push(`${missionRegistry[activeMissionId].target} ${polyId}`);
        }
    });

    if (errors.length > 0) return alert(`SATELLITE WARNING: Discrepancies in ${errors.join(', ')}`);
    alert("INTELLIGENCE SEALED. Report transmitted.");
    window.showScreen('home-screen');
};

// --- NAVIGATION & UTILS ---
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
window.teacherLogin = () => signInWithPopup(auth, provider);
window.staffLogout = () => auth.signOut().then(() => location.reload());
window.releaseMission = () => {
    activeMissionId = parseInt(document.getElementById('mission-release-select').value);
    alert(`HQ: Broadcast updated to ${missionRegistry[activeMissionId].title}`);
};
window.renderMissionHub = () => {
    document.getElementById('active-mission-list').innerHTML = `<div class="sia-card linked" onclick="window.openMission(${activeMissionId})"><h3>MISSION ${activeMissionId}</h3><p>${missionRegistry[activeMissionId].title}</p></div>`;
    window.showScreen('mission-hub');
};
window.startOperation = () => loggedInAgents.length > 0 ? (document.getElementById('session-controls').style.display='flex', window.showScreen('home-screen')) : alert("IDENTIFY AGENTS");

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.showScreen('teacher-screen');
        listenToRoster();
        const sel = document.getElementById('mission-release-select');
        if (sel) sel.innerHTML = Object.keys(missionRegistry).map(k => `<option value="${k}">${missionRegistry[k].title}</option>`).join('');
    }
});
