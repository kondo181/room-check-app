
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { defaultCategories } from './data.js';

const firebaseConfig = {
  apiKey: "AIzaSyDNbITEwFxS-T384Jponlgi4x3wQD2wbnQ",
  authDomain: "house-5e848.firebaseapp.com",
  projectId: "house-5e848",
  storageBucket: "house-5e848.firebasestorage.app",
  messagingSenderId: "334289118197",
  appId: "1:334289118197:web:bd06a565ed8674a21cf6bc"
};

const CATEGORY_ORDER = [
  '立地・アクセス','費用','間取り','収納','キッチン','水回り',
  '設備・建物','住み心地','周辺環境','同棲向け','将来用'
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const roomRef = doc(db,'rooms','shared-room');

let categories = JSON.parse(JSON.stringify(defaultCategories));
let selections = {};
let editingCategory = null;
let editingIndex = null;

const ANSWERS = ['重要','できれば','なし'];

const container = document.getElementById('categoriesContainer');
const searchInput = document.getElementById('searchInput');

async function saveData(){
  await setDoc(roomRef,{categories,selections},{merge:true});
}

async function initialize(){
  const snap = await getDoc(roomRef);

  if(!snap.exists()){
    await setDoc(roomRef,{categories:defaultCategories,selections:{} });
  }

  onSnapshot(roomRef,(docSnap)=>{
    const data = docSnap.data();
    categories = data?.categories || defaultCategories;
    selections = data?.selections || {};
    render();
  });
}

function getMatch(a,b){
  if(!a || !b) return null;
  if(a===b) return 100;
  if(a==='なし' || b==='なし') return 0;
  return 70;
}

function updateSummary(){
  let total=0;
  let matchSum=0;
  let answered=0;

  Object.entries(categories).forEach(([cat,list])=>{
    list.forEach(item=>{
      total++;
      const key = cat + '||' + item;
      const val = selections[key] || {};

      if(val.ai) answered++;
      if(val.haruya) answered++;

      const m = getMatch(val.ai,val.haruya);
      if(m !== null){
        matchSum += m;
      }
    });
  });

  const availableMatches = Object.values(selections).filter(v=>v.ai && v.haruya).length;
  const matchRate = availableMatches ? Math.round(matchSum/availableMatches) : 0;
  const answerRate = total ? Math.round(answered/(total*2)*100) : 0;

  document.getElementById('matchRate').textContent = matchRate + '%';
  document.getElementById('answerRate').textContent = answerRate + '%';
  document.getElementById('conditionCount').textContent = total;
}

function createSelect(person,key,current){
  const select = document.createElement('select');

  const blank = document.createElement('option');
  blank.value='';
  blank.textContent='未選択';
  select.appendChild(blank);

  ANSWERS.forEach(v=>{
    const op = document.createElement('option');
    op.value=v;
    op.textContent=v;
    if(v===current) op.selected=true;
    select.appendChild(op);
  });

  select.addEventListener('change',async()=>{
    if(!selections[key]) selections[key]={};
    selections[key][person]=select.value;
    await saveData();
  });

  return select;
}

function render(){
  container.innerHTML='';
  const keyword = searchInput.value.toLowerCase();

  CATEGORY_ORDER.forEach(cat=>{
    if(!categories[cat]) return;

    const rows = categories[cat].filter(v=>v.toLowerCase().includes(keyword));
    if(rows.length===0) return;

    const card = document.createElement('div');
    card.className='category-card';

    card.innerHTML=`<h2 class="category-title">${cat}</h2>`;

    rows.forEach(name=>{
      const key = cat + '||' + name;
      const row = document.createElement('div');
      row.className='condition-row';

      const condition = document.createElement('div');
      condition.className='condition-name';
      condition.textContent=name;

      const ai = createSelect('ai',key,selections[key]?.ai);
      const haruya = createSelect('haruya',key,selections[key]?.haruya);

      const buttons = document.createElement('div');
      buttons.className='action-buttons';

      const editBtn = document.createElement('button');
      editBtn.className='edit-btn';
      editBtn.textContent='編集';
      editBtn.onclick=()=>openEdit(cat,name);

      const delBtn = document.createElement('button');
      delBtn.className='delete-btn';
      delBtn.textContent='削除';
      delBtn.onclick=()=>removeCondition(cat,name);

      buttons.append(editBtn,delBtn);

      row.append(condition,ai,haruya,buttons);
      card.appendChild(row);
    });

    container.appendChild(card);
  });

  updateSummary();
}

function openEdit(category,name){
  editingCategory = category;
  editingIndex = categories[category].indexOf(name);
  document.getElementById('editConditionInput').value=name;
  document.getElementById('editModal').classList.remove('hidden');
}

async function removeCondition(category,name){
  if(!confirm('削除しますか？')) return;

  categories[category] = categories[category].filter(v=>v!==name);
  delete selections[category+'||'+name];

  await saveData();
}

function loadCategoryOptions(){
  const select = document.getElementById('newCategory');
  select.innerHTML='';
  CATEGORY_ORDER.forEach(cat=>{
    const op=document.createElement('option');
    op.value=cat;
    op.textContent=cat;
    select.appendChild(op);
  });
}

document.getElementById('addConditionBtn').onclick=()=>{
  document.getElementById('addModal').classList.remove('hidden');
};

document.getElementById('closeModalBtn').onclick=()=>{
 document.getElementById('addModal').classList.add('hidden');
};

document.getElementById('closeEditModalBtn').onclick=()=>{
 document.getElementById('editModal').classList.add('hidden');
};

document.getElementById('saveConditionBtn').onclick=async()=>{
 const cat=document.getElementById('newCategory').value;
 const value=document.getElementById('newCondition').value.trim();
 if(!value) return;
 categories[cat].push(value);
 await saveData();
 document.getElementById('newCondition').value='';
 document.getElementById('addModal').classList.add('hidden');
};

document.getElementById('updateConditionBtn').onclick=async()=>{
 const value=document.getElementById('editConditionInput').value.trim();
 if(!value) return;
 categories[editingCategory][editingIndex]=value;
 await saveData();
 document.getElementById('editModal').classList.add('hidden');
};

searchInput.addEventListener('input',render);

loadCategoryOptions();
initialize();
