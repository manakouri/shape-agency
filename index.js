import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
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

// --- MASTER MISSION REGISTRY [cite: 10] ---
const missionRegistry = {
    "1": { title: "Counting Vertices", type: "bulk", fields: [{id:"v", label:"Vertices", type:"number"}] },
    "2": { title: "Side Lengths", type: "bulk", fields: [{id:"len", label:"Length (cm)", type:"text"}] },
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

// --- APP STATE ---
let loggedInAgents = [];
let activeMissionId = 1;
let currentArchiveAgent = null;

// --- SHARED LOGIC ---
window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector('main').scrollTop = 0;
};

// --- TEACHER & AUTH SYSTEM ---
onSnapshot(doc(db, "system", "config"), (snapshot) => {
    if (snapshot.exists()) activeMissionId = snapshot.data().currentMission;
});

window.teacherLogin = () => signInWithPopup(auth, provider).catch(e => alert(e.message));

window.staffLogout = () => {
    auth.signOut().then(() => location.reload()).catch(e => console.error(e));
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadRoster();
        renderTeacherMissionGrid();
        const sel = document.getElementById('mission-release-select');
        if (sel) {
            sel.innerHTML = '';
            Object.keys(missionRegistry).forEach(k => {
                sel.innerHTML += `<option value="${k}">M${k}: ${missionRegistry[k].title}</option>`;
            });
        }
        showScreen('teacher-screen');
    }
});

function renderTeacherMissionGrid() {
    const grid = document.getElementById('teacher-mission-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 1; i <= 24; i++) {
        const mId = i.toString();
        const b = document.createElement('button');
        b.className = 'sia-btn';
        b.style.fontSize = '0.7rem';
        b.style.borderColor = i <= 10 ? 'var(--sia-blue)' : 'var(--sia-neon)';
        b.innerHTML = `INTEL: M${mId}`;
        b.onclick = () => window.viewMissionSubmissions(mId);
        grid.appendChild(b);
    }
}

window.viewMissionSubmissions = async (mId) => {
    const overlay = document.getElementById('submission-ledger-overlay');
    const content = document.getElementById('ledger-content');
    const title = document.getElementById('ledger-title');
    
    overlay.style.display = 'block';
    title.innerText = `MISSION ${mId} LEDGER`;
    content.innerHTML = "Retrieving Agent Reports...";

    try {
        const q = query(collection(db, "submissions"), where("missionId", "==", parseInt(mId)));
        const snap = await getDocs(q);
        const rosterSnap = await getDocs(collection(db, "roster"));
        const rosterMap = {};
        rosterSnap.forEach(d => { rosterMap[d.data().agentCode] = d.data().agentName; });

        content.innerHTML = snap.empty ? "<p>No field reports yet.</p>" : '';
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const names = d.agents.map(code => rosterMap[code] || `Agent ${code}`).join(' & ');
            content.innerHTML += `
                <div class="sia-card" style="border-left: 4px solid var(--sia-blue); background: #000;">
                    <div style="color:var(--sia-neon); font-weight:bold;">${names}</div>
                    <div style="font-size:0.8rem; margin:10px 0;">
                        ${d.entries.map(e => `<b>${e.polyId || e.variant}:</b> ${e.val}`).join(' | ')}
                    </div>
                    ${d.report ? `<div style="font-size:0.7rem; color:gray;">B: ${d.report.b} | BT: ${d.report.bt} | S: ${d.report.s}</div>` : ''}
                </div>`;
        });
        overlay.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { content.innerHTML = "Error retrieving data."; }
};

window.createNewAgent = async () => {
    const name = document.getElementById('new-agent-name').value;
    const code = document.getElementById('new-agent-code').value;
    if (name && code.length === 4) {
        await setDoc(doc(db, "roster", code), { agentName: name, agentCode: code });
        document.getElementById('new-agent-name').value = '';
        document.getElementById('new-agent-code').value = '';
        loadRoster();
    }
};

async function loadRoster() {
    const list = document.getElementById('roster-list');
    const snap = await getDocs(collection(db, "roster"));
    list.innerHTML = '<h4>AUTHORIZED AGENTS</h4>';
    snap.forEach(d => { list.innerHTML += `<div>${d.data().agentCode}: ${d.data().agentName}</div>`; });
}

window.releaseMission = async () => {
    const val = document.getElementById('mission-release-select').value;
    await setDoc(doc(db, "system", "config"), { currentMission: parseInt(val) });
    alert("Field Command Updated.");
};

// --- AGENT/STUDENT ACTIONS ---
window.registerAgent = async () => {
    const val = document.getElementById('agent-id-input').value;
    if (val.length === 4) {
        const q = query(collection(db, "roster"), where("agentCode", "==", val));
        const agentDoc = await getDocs(q);
        if (!agentDoc.empty) {
            if (!loggedInAgents.includes(val)) {
                loggedInAgents.push(val);
                const p = document.createElement('span');
                p.className = 'agent-pill';
                p.innerText = 'AGENT ' + val;
                document.getElementById('active-agents-list').appendChild(p);
            }
        } else { alert("ACCESS DENIED."); }
        document.getElementById('agent-id-input').value = '';
    }
};

window.startOperation = () => {
    if (loggedInAgents.length > 0) {
        document.getElementById('session-controls').style.display = 'flex';
        showScreen('home-screen');
    }
};

window.renderMissionHub = () => {
    const list = document.getElementById('active-mission-list');
    list.innerHTML = `
        <div class="sia-card" onclick="openMission(${activeMissionId})" style="cursor:pointer; border-color:var(--sia-neon);">
            <h3>MISSION ${activeMissionId}</h3>
            <p>${missionRegistry[activeMissionId].title}</p>
        </div>`;
    showScreen('mission-hub');
};

window.openMission = (id) => {
    const m = missionRegistry[id];
    const container = document.getElementById('polygon-entry-list');
    container.innerHTML = '';
    if (m.type === "bulk") {
        for (let i = 1; i <= 10; i++) {
            container.innerHTML += `<div class="sia-card"><h3>POLYGON ${i}</h3>
                ${m.fields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-poly="${i}" data-f="${f.id}">`).join('')}
            </div>`;
        }
    } else {
        ['A', 'B', 'C'].forEach(v => {
            container.innerHTML += `<div class="sia-card"><h3>Variant ${v}</h3>
                ${deepFields.map(f => `<label>${f.label}</label><input class="sia-input m-in" data-variant="${v}" data-f="${f.id}">`).join('')}
            </div>`;
        });
        container.innerHTML += `<div class="sia-card"><h3>REPORT</h3><textarea id="rep-b" class="sia-input" placeholder="BECAUSE..."></textarea><textarea id="rep-bt" class="sia-input" placeholder="BUT..."></textarea><textarea id="rep-s" class="sia-input" placeholder="SO..."></textarea></div>`;
    }
    showScreen('mission-entry');
};

window.submitMissionBatch = async () => {
    const inputs = document.querySelectorAll('.m-in');
    const data = { missionId: activeMissionId, agents: loggedInAgents, timestamp: new Date(), entries: [] };
    inputs.forEach(i => { if(i.value) data.entries.push({ polyId: i.dataset.poly || null, variant: i.dataset.variant || null, field: i.dataset.f, val: i.value }); });
    if (missionRegistry[activeMissionId].type === "deep") {
        data.report = { b: document.getElementById('rep-b').value, bt: document.getElementById('rep-bt').value, s: document.getElementById('rep-s').value };
    }
    await addDoc(collection(db, "submissions"), data);
    alert("Report Sealed.");
    showScreen('home-screen');
};

// --- ARCHIVE & INTEL LOCK LOGIC ---
window.unlockArchive = () => {
    const code = document.getElementById('archive-access-id').value;
    if (loggedInAgents.includes(code)) {
        currentArchiveAgent = code;
        document.getElementById('archive-access-lock').style.display = 'none';
        document.getElementById('archive-display').style.display = 'block';
        document.getElementById('viewing-as-label').innerText = `DECRYPTING RECORDS FOR: ${code}`;
        renderPolygonArchiveGrid();
    } else { alert("ID NOT IN CURRENT SESSION."); }
};

window.relockArchive = () => {
    currentArchiveAgent = null;
    document.getElementById('archive-access-lock').style.display = 'block';
    document.getElementById('archive-display').style.display = 'none';
};

window.renderPolygonArchiveGrid = () => {
    const grid = document.getElementById('polygon-archive-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.className = 'sia-btn';
        b.innerHTML = `POLYGON ${i}`;
        b.onclick = () => window.viewPolygonDetail(i);
        grid.appendChild(b);
    }
};

window.viewPolygonDetail = async (id) => {
    const hist = document.getElementById('polygon-history');
    hist.innerHTML = "Accessing Records...";
    const q = query(collection(db, "submissions"), where("agents", "array-contains", currentArchiveAgent));
    const snap = await getDocs(q);
    hist.innerHTML = '';
    let found = false;
    snap.forEach(docSnap => {
        const d = docSnap.data();
        d.entries.forEach(e => {
            if (e.polyId == id) {
                found = true;
                hist.innerHTML += `<div class="sia-card" style="border-left:4px solid var(--sia-neon)">
                    <label>M${d.missionId}: ${missionRegistry[d.missionId].title}</label>
                    <div>${e.val}</div>
                </div>`;
            }
        });
    });
    if (!found) hist.innerHTML = "No record found for Agent " + currentArchiveAgent;
    showScreen('polygon-detail-screen');
};
