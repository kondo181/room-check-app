import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNbITEwFxS-T384Jponlgi4x3wQD2wbnQ",
  authDomain: "house-5e848.firebaseapp.com",
  projectId: "house-5e848",
  storageBucket: "house-5e848.firebasestorage.app",
  messagingSenderId: "334289118197",
  appId: "1:334289118197:web:bd06a565ed8674a21cf6bc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ROOM_ID = "shared-room";

let categories = structuredClone(defaultCategories);
let selections = {};

async function saveState() {
  await setDoc(
    doc(db, "rooms", ROOM_ID),
    {
      categories,
      selections
    },
    { merge: true }
  );
}

async function loadState() {
  const snap = await getDoc(
    doc(db, "rooms", ROOM_ID)
  );

  if (snap.exists()) {
    const data = snap.data();

    if (data.categories) {
      categories = data.categories;
    }

    if (data.selections) {
      selections = data.selections;
    }
  }

  render();
}

function score(me, partner) {
  if (me === partner) return 100;
  if (me === "なし" || partner === "なし") return 0;
  return 70;
}

function getValue(id) {
  return selections[id] || "なし";
}

window.setValue = async function(id, value) {
  selections[id] = value;

  await saveState();

  render();
};

window.addCondition = async function() {
  const cat = prompt("カテゴリ");
  const name = prompt("条件名");

  if (!cat || !name) return;

  if (!categories[cat]) {
    categories[cat] = [];
  }

  categories[cat].push(name);

  await saveState();

  render();
};

function render() {
  const root =
    document.getElementById("categoryContainer");

  if (!root) return;

  root.innerHTML = "";

  Object.entries(categories).forEach(
    ([cat, items]) => {
      const details =
        document.createElement("details");

      details.open = true;

      let html =
        `<summary>${cat}</summary>`;

      items.forEach((name, index) => {
        const meKey =
          `${cat}-${index}-me`;

        const partnerKey =
          `${cat}-${index}-partner`;

        const me =
          getValue(meKey);

        const partner =
          getValue(partnerKey);

        html += `
        <div class="item">

          <b>${name}</b>

          <div>
            一致度:
            ${score(me, partner)}%
          </div>

          <div class="segmented">
            あい

            ${
              ["重要","できれば","なし"]
              .map(v => `
              <button
              class="seg-btn ${me===v?"active":""}"
              onclick="setValue('${meKey}','${v}')">
              ${v}
              </button>
              `)
              .join("")
            }

          </div>

          <div class="segmented">
            はるや

            ${
              ["重要","できれば","なし"]
              .map(v => `
              <button
              class="seg-btn ${partner===v?"active":""}"
              onclick="setValue('${partnerKey}','${v}')">
              ${v}
              </button>
              `)
              .join("")
            }

          </div>

        </div>
        `;
      });

      details.innerHTML = html;

      root.appendChild(details);
    }
  );
}

document
  .getElementById("addConditionBtn")
  ?.addEventListener(
    "click",
    addCondition
  );

loadState();

onSnapshot(
  doc(db, "rooms", ROOM_ID),
  (snapshot) => {

    if (!snapshot.exists()) return;

    const data = snapshot.data();

    categories =
      data.categories ||
      categories;

    selections =
      data.selections ||
      {};

    render();
  }
);