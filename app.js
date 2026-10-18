import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  defaultCategories
} from "./data.js";

/* ==================================
   FIREBASE
================================== */

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

const roomRef = doc(
  db,
  "rooms",
  "shared-room"
);

/* ==================================
   CATEGORY ORDER
================================== */

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

/* ==================================
   CONSTANTS
================================== */

const ANSWERS = [
  "重要",
  "できれば",
  "なし"
];

/* ==================================
   STATE
================================== */

let categories =
  JSON.parse(
    JSON.stringify(defaultCategories)
  );

let selections = {};

let searchKeyword = "";

let editingCategory = null;
let editingCondition = null;

let saveTimer = null;
let firstSnapshot = true;

/* ==================================
   DOM
================================== */

const categoriesContainer =
  document.getElementById(
    "categoriesContainer"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const loadingOverlay =
  document.getElementById(
    "loadingOverlay"
  );

const toast =
  document.getElementById(
    "toast"
  );

const syncStatus =
  document.getElementById(
    "syncStatus"
  );

const lastUpdated =
  document.getElementById(
    "lastUpdated"
  );

const matchRateElement =
  document.getElementById(
    "matchRate"
  );

const answerRateElement =
  document.getElementById(
    "answerRate"
  );

const conditionCountElement =
  document.getElementById(
    "conditionCount"
  );

const unansweredCountElement =
  document.getElementById(
    "unansweredCount"
  );

/* ==================================
   UTIL
================================== */

function createKey(
  category,
  condition
) {
  return `${category}||${condition}`;
}

function showLoading() {
  loadingOverlay.classList.remove(
    "hidden"
  );
}

function hideLoading() {
  loadingOverlay.classList.add(
    "hidden"
  );
}

function showToast(
  message
) {

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 2500);
}

function updateSyncStatus(
  online = true
) {

  syncStatus.classList.remove(
    "sync-online",
    "sync-offline"
  );

  if (online) {

    syncStatus.textContent =
      "✅ Firestore同期済み";

    syncStatus.classList.add(
      "sync-online"
    );

  } else {

    syncStatus.textContent =
      "❌ Firestore接続エラー";

    syncStatus.classList.add(
      "sync-offline"
    );
  }
}

function updateLastUpdated() {

  const now =
    new Date();

  lastUpdated.textContent =
    `最終更新 ${now.toLocaleTimeString("ja-JP")}`;
}

/* ==================================
   SAVE DEBOUNCE
================================== */

function requestSave() {

  clearTimeout(
    saveTimer
  );

  saveTimer =
    setTimeout(
      async () => {

        await saveToFirestore();

      },
      500
    );
}

/* ==================================
   MATCH RATE
================================== */

function calculateMatch(
  ai,
  haruya
) {

  if (
    !ai ||
    !haruya
  ) {
    return null;
  }

  if (
    ai === haruya
  ) {
    return 100;
  }

  if (
    ai === "なし" ||
    haruya === "なし"
  ) {
    return 0;
  }

  return 70;
}

function getMatchClass(
  rate
) {

  switch (rate) {

    case 100:
      return "match-100";

    case 70:
      return "match-70";

    case 0:
      return "match-0";

    default:
      return "match-empty";
  }
}

/* ==================================
   SUMMARY
================================== */

function updateSummary() {

  console.log("categories", categories);

  let total = 0;
  let answered = 0;

  let matchCount = 0;
  let matchTotal = 0;

Object.entries(
  categories
).forEach(
  ([category, conditions]) => {

    const conditionList =
      Array.isArray(
        conditions
      )
        ? conditions
        : Object.values(
            conditions || {}
          );

    conditionList.forEach(
      condition => {

        total++;

        const key =
          createKey(
            category,
            condition
          );

        const data =
          selections[key] || {};

        if (data.ai) {
          answered++;
        }

        if (data.haruya) {
          answered++;
        }

        const match =
          calculateMatch(
            data.ai,
            data.haruya
          );

        if (
          match !== null
        ) {
          matchTotal += match;
          matchCount++;
        }
      }
    );
  }
);

  const answerRate =
    total === 0
      ? 0
      : Math.round(
          (
            answered /
            (total * 2)
          ) * 100
        );

  const matchRate =
    matchCount === 0
      ? 0
      : Math.round(
          matchTotal /
          matchCount
        );

  const unanswered =
    (total * 2) -
    answered;

  matchRateElement.textContent =
    `${matchRate}%`;

  answerRateElement.textContent =
    `${answerRate}%`;

  conditionCountElement.textContent =
    `${total}件`;

  unansweredCountElement.textContent =
    unanswered;
}

/* ==================================
   FIRESTORE SAVE
================================== */

async function saveToFirestore() {

  try {

    updateSyncStatus(false);

    await setDoc(
      roomRef,
      {
        categories,
        selections,

        version: "5.1",

        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

    updateSyncStatus(true);

    updateLastUpdated();

  } catch (error) {

    console.error(error);

    updateSyncStatus(false);

    showToast(
      "保存に失敗しました"
    );
  }
}

/* ==================================
   INITIALIZE FIRESTORE
================================== */

async function initializeFirestore() {

  try {

    showLoading();

    const snapshot =
      await getDoc(roomRef);

    if (
      !snapshot.exists()
    ) {

      await setDoc(
        roomRef,
        {
          categories:
            defaultCategories,

          selections: {},

          version: "5.1",

          createdAt:
            serverTimestamp()
        }
      );
    }

    subscribeRealtime();

  } catch (error) {

    console.error(error);

    hideLoading();

    updateSyncStatus(false);

    showToast(
      "Firestore接続に失敗しました"
    );
  }
}

/* ==================================
   REALTIME SYNC
================================== */

function subscribeRealtime() {

  onSnapshot(

    roomRef,

    snapshot => {

      if (
        !snapshot.exists()
      ) {
        return;
      }

      const data =
        snapshot.data();

      categories =
        data.categories ||
        JSON.parse(
          JSON.stringify(
            defaultCategories
          )
        );

      selections =
        data.selections ||
        {};

      renderCategoryStats();

      render();

      updateSyncStatus(true);

      updateLastUpdated();

      if (
        firstSnapshot
      ) {

        firstSnapshot = false;

        hideLoading();

      } else {

        showToast(
          "同期完了"
        );
      }
    },

    error => {

      console.error(error);

      updateSyncStatus(false);

      showToast(
        "リアルタイム同期エラー"
      );
    }
  );
}

/* ==================================
   SEARCH
================================== */

searchInput.addEventListener(
  "input",

  event => {

    searchKeyword =
      event.target.value
        .trim()
        .toLowerCase();

    render();
  }
);

/* ==================================
   CATEGORY STATS
================================== */

function renderCategoryStats() {

  const container =
    document.getElementById(
      "categoryStats"
    );

  container.innerHTML = "";

  CATEGORY_ORDER.forEach(
    category => {

      const conditions =
        categories[category];

      if (!conditions) {
        return;
      }

      const conditionList =
        Array.isArray(conditions)
          ? conditions
          : Object.values(
              conditions || {}
            );

      if (
        conditionList.length === 0
      ) {
        return;
      }

      let matchCount = 0;
      let totalRate = 0;

      conditionList.forEach(
        condition => {

          const key =
            createKey(
              category,
              condition
            );

          const record =
            selections[key] || {};

          const rate =
            calculateMatch(
              record.ai,
              record.haruya
            );

          if (
            rate !== null
          ) {

            totalRate += rate;
            matchCount++;
          }
        }
      );

      const average =
        matchCount === 0
          ? 0
          : Math.round(
              totalRate /
              matchCount
            );

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "category-stat-card";

      card.innerHTML = `
        <div class="category-stat-title">
        ${category}
        </div>

         <div class="category-stat-rate">
          ${average}%
        </div>
        `;
      container.appendChild(
        card
      );
    }
  );
}     

/* ==================================
   ANSWER SELECT
================================== */

function createAnswerSelect(
  key,
  person,
  currentValue
) {

  const select =
    document.createElement(
      "select"
    );

  const empty =
    document.createElement(
      "option"
    );

  empty.value = "";
  empty.textContent =
    "未選択";

  select.appendChild(
    empty
  );

  ANSWERS.forEach(
    answer => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        answer;

      option.textContent =
        answer;

      if (
        currentValue === answer
      ) {

        option.selected =
          true;
      }

      select.appendChild(
        option
      );
    }
  );

  select.addEventListener(
    "change",

    () => {

      if (
        !selections[key]
      ) {

        selections[key] = {};
      }

      selections[key][person] =
        select.value;

      updateSummary();

      requestSave();
    }
  );

  return select;
}

/* ==================================
   MATCH BADGE
================================== */

function createMatchBadge(
  rate
) {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "match-rate";

  const badge =
    document.createElement(
      "span"
    );

  badge.className =
    "match-badge";

  if (
    rate === null
  ) {

    badge.classList.add(
      "match-empty"
    );

    badge.textContent =
      "-";

  } else {

    badge.classList.add(
      getMatchClass(rate)
    );

    badge.textContent =
      `${rate}%`;
  }

  wrapper.appendChild(
    badge
  );

  return wrapper;
}

/* ==================================
   RENDER
================================== */

function render() {

  categoriesContainer.innerHTML = "";

  CATEGORY_ORDER.forEach(
    category => {

      const conditions =
        categories[category];

      if (!conditions) {
        return;
      }

      const conditionList =
        Array.isArray(conditions)
          ? conditions
          : Object.values(
              conditions || {}
            );

      if (
        conditionList.length === 0
      ) {
        return;
      }

      const filtered =
        conditionList.filter(
          condition =>
            condition.includes(
              searchKeyword
            )
        );

      if (
        filtered.length === 0
      ) {
        return;
      }

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "category-card";

      card.innerHTML = `
  <h2 class="category-title">
    ${category}
    <span class="category-count">
      (${filtered.length})
    </span>
  </h2>
`;

      filtered.forEach(
        condition => {

          card.appendChild(
            createConditionRow(
              category,
              condition
            )
          );

        }
      );

      categoriesContainer.appendChild(
        card
      );
    }
  );

  updateSummary();
}

/* ==================================
   ROW
================================== */

function createConditionRow(
  category,
  condition
) {

  const key =
    createKey(
      category,
      condition
    );

  const value =
    selections[key] || {};

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "condition-row";

  const name =
    document.createElement(
      "div"
    );

  name.className =
    "condition-name";

  name.textContent =
    condition;

  const aiSelect =
    createAnswerSelect(
      key,
      "ai",
      value.ai
    );

  const haruyaSelect =
    createAnswerSelect(
      key,
      "haruya",
      value.haruya
    );

  const matchRate =
    calculateMatch(
      value.ai,
      value.haruya
    );

  const badge =
    createMatchBadge(
      matchRate
    );

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "action-buttons";

  const editBtn =
    document.createElement(
      "button"
    );

  editBtn.className =
    "edit-btn";

  editBtn.textContent =
    "編集";

  editBtn.addEventListener(
    "click",
    () => {

      openEditModal(
        category,
        condition
      );

    }
  );

  const deleteBtn =
    document.createElement(
      "button"
    );

  deleteBtn.className =
    "delete-btn";

  deleteBtn.textContent =
    "削除";

  deleteBtn.addEventListener(
    "click",
    () => {

      deleteCondition(
        category,
        condition
      );

    }
  );

  actions.appendChild(
    editBtn
  );

  actions.appendChild(
    deleteBtn
  );

  row.appendChild(name);
  row.appendChild(aiSelect);
  row.appendChild(haruyaSelect);
  row.appendChild(badge);
  row.appendChild(actions);

  return row;
}

/* ==================================
   EDIT MODAL
================================== */

function openEditModal(
  category,
  condition
) {

  editingCategory =
    category;

  editingCondition =
    condition;

  document.getElementById(
    "editConditionInput"
  ).value =
    condition;

  document
    .getElementById(
      "editModal"
    )
    .classList.remove(
      "hidden"
    );
}

/* ==================================
   CLOSE EDIT MODAL
================================== */

document
  .getElementById(
    "closeEditModalBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "editModal"
        )
        .classList.add(
          "hidden"
        );
    }
  );

/* ==================================
   UPDATE CONDITION
================================== */

document
  .getElementById(
    "updateConditionBtn"
  )
  .addEventListener(

    "click",

    async () => {

      const newName =
        document
          .getElementById(
            "editConditionInput"
          )
          .value
          .trim();

      if (!newName) {

        showToast(
          "条件名を入力してください"
        );

        return;
      }

      if (
        newName !==
          editingCondition &&
        categories[
          editingCategory
        ].includes(
          newName
        )
      ) {

        showToast(
          "同名条件が存在します"
        );

        return;
      }

      const oldKey =
        createKey(
          editingCategory,
          editingCondition
        );

      const newKey =
        createKey(
          editingCategory,
          newName
        );

      const index =
        categories[
          editingCategory
        ].indexOf(
          editingCondition
        );

      if (index < 0) {
        return;
      }

      categories[
        editingCategory
      ][index] =
        newName;

      /* 回答保持 */

      if (
        selections[
          oldKey
        ]
      ) {

        selections[
          newKey
        ] =
        selections[
          oldKey
        ];

        delete selections[
          oldKey
        ];
      }

      await saveToFirestore();

      document
        .getElementById(
          "editModal"
        )
        .classList.add(
          "hidden"
        );

      showToast(
        "条件を更新しました"
      );
    }
  );

/* ==================================
   DELETE CONDITION
================================== */

async function deleteCondition(
  category,
  condition
) {

  const ok =
    confirm(
      `「${condition}」を削除しますか？`
    );

  if (!ok) {
    return;
  }

  categories[
    category
  ] =
    categories[
      category
    ].filter(
      item =>
        item !==
        condition
    );

  delete selections[
    createKey(
      category,
      condition
    )
  ];

  await saveToFirestore();

  showToast(
    "条件を削除しました"
  );
}

/* ==================================
   LOAD CATEGORY OPTIONS
================================== */

function loadCategoryOptions() {

  const select =
    document.getElementById(
      "newCategory"
    );

  select.innerHTML = "";

  CATEGORY_ORDER.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        category;

      option.textContent =
        category;

      select.appendChild(
        option
      );
    }
  );
}

/* ==================================
   OPEN ADD MODAL
================================== */

document
  .getElementById(
    "addConditionBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "addModal"
        )
        .classList.remove(
          "hidden"
        );
    }
  );

/* ==================================
   CLOSE ADD MODAL
================================== */

document
  .getElementById(
    "closeModalBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "addModal"
        )
        .classList.add(
          "hidden"
        );
    }
  );

/* ==================================
   ADD CONDITION
================================== */

document
  .getElementById(
    "saveConditionBtn"
  )
  .addEventListener(

    "click",

    async () => {

      const category =
        document
          .getElementById(
            "newCategory"
          )
          .value;

      const condition =
        document
          .getElementById(
            "newCondition"
          )
          .value
          .trim();

      if (!condition) {

        showToast(
          "条件名を入力してください"
        );

        return;
      }

      if (
        categories[
          category
        ].includes(
          condition
        )
      ) {

        showToast(
          "同名条件が存在します"
        );

        return;
      }

      categories[
        category
      ].push(
        condition
      );

      categories[
        category
      ].sort(
        (a, b) =>
          a.localeCompare(
            b,
            "ja",
            {
              numeric: true
            }
          )
      );

      await saveToFirestore();

      document
        .getElementById(
          "newCondition"
        )
        .value = "";

      document
        .getElementById(
          "addModal"
        )
        .classList.add(
          "hidden"
        );

      showToast(
        "条件を追加しました"
      );
    }
  );

/* ==================================
   CLICK OUTSIDE MODAL
================================== */

window.addEventListener(
  "click",

  event => {

    const addModal =
      document.getElementById(
        "addModal"
      );

    const editModal =
      document.getElementById(
        "editModal"
      );

    if (
      event.target ===
      addModal
    ) {

      addModal.classList.add(
        "hidden"
      );
    }

    if (
      event.target ===
      editModal
    ) {

      editModal.classList.add(
        "hidden"
      );
    }
  }
);

/* ==================================
   ESC KEY
================================== */

window.addEventListener(
  "keydown",

  event => {

    if (
      event.key ===
      "Escape"
    ) {

      document
        .getElementById(
          "addModal"
        )
        .classList.add(
          "hidden"
        );

      document
        .getElementById(
          "editModal"
        )
        .classList.add(
          "hidden"
        );
    }
  }
);

/* ==================================
   NETWORK STATUS
================================== */

window.addEventListener(
  "online",

  () => {

    updateSyncStatus(
      true
    );

    showToast(
      "ネットワーク接続復旧"
    );
  }
);

window.addEventListener(
  "offline",

  () => {

    updateSyncStatus(
      false
    );

    showToast(
      "オフラインです"
    );
  }
);

/* ==================================
   START APP
================================== */

async function startApp() {

  loadCategoryOptions();

  updateSummary();

  await initializeFirestore();
}

/* ==================================
   START
================================== */

startApp();
