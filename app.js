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

const CATEGORY_ORDER = [
  "立地・アクセス",
  "費用",
  "間取り",
  "収納",
  "キッチン",
  "水回り",
  "設備・建物",
  "住み心地",
  "周辺環境",
  "同棲向け",
  "将来用"
];

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
  const snapshot = await getDoc(
    doc(db, "rooms", ROOM_ID)
  );

  if (snapshot.exists()) {
    const data = snapshot.data();

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

function getValue(key) {
  return selections[key] || "なし";
}

window.setValue = async function(key, value) {

  selections[key] = value;

  render();

  await saveState();
};

window.addCondition = async function() {

  const category = prompt("カテゴリ");

  if (!category) return;

  const item = prompt("条件名");

  if (!item) return;

  if (!categories[category]) {
    categories[category] = [];
  }

  categories[category].push(item);

  await saveState();

  render();
};

function render() {

  const root =
    document.getElementById(
      "categoryContainer"
    );

  if (!root) return;

  root.innerHTML = "";

  const orderedCategories = [

    ...CATEGORY_ORDER,

    ...Object.keys(categories).filter(
      cat => !CATEGORY_ORDER.includes(cat)
    )

  ];

  orderedCategories.forEach(cat => {

    const items = categories[cat];

    if (!items) return;

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

        <div style="margin:8px 0;">
          一致度:
          <strong>${score(me, partner)}%</strong>
        </div>

        <div class="segmented">

          <span style="width:50px;">
            あい
          </span>

          ${
            ["重要","できれば","なし"]
            .map(v => `
            <button
              class="seg-btn ${
                me === v ? "active" : ""
              }"
              onclick="
                setValue(
                  '${meKey}',
                  '${v}'
                )
              ">
              ${v}
            </button>
            `)
            .join("")
          }

        </div>

        <div class="segmented">

          <span style="width:50px;">
            はるや
          </span>

          ${
            ["重要","できれば","なし"]
            .map(v => `
            <button
              class="seg-btn ${
                partner === v
                  ? "active"
       