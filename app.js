import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
const ROOM_ID='shared-room';

let categories=structuredClone(defaultCategories);

async function saveState(){
 await setDoc(doc(db,'rooms',ROOM_ID),{categories});
}

async function loadState(){
 const snap=await getDoc(doc(db,'rooms',ROOM_ID));
 if(snap.exists()) categories=snap.data().categories||categories;
 render();
}

window.setValue=async function(key,val){
 const [cat,index,user]=key.split('|');
 if(!categories[cat+'_state']) categories[cat+'_state']={};
 categories[cat+'_state'][index+'_'+user]=val;
 await saveState();
 render();
}

function getValue(cat,index,user){
 return categories[cat+'_state']?.[index+'_'+user]||'なし';
}

window.addCondition=async function(){
 const cat=prompt('カテゴリ');
 const name=prompt('条件名');
 if(!cat||!name) return;
 if(!categories[cat]) categories[cat]=[];
 categories[cat].push(name);
 await saveState();
 render();
}

function render(){
 const root=document.getElementById('categoryContainer');
 if(!root) return;
 root.innerHTML='';
 Object.entries(categories).forEach(([cat,items])=>{
  if(cat.endsWith('_state')) return;
  const d=document.createElement('details');
  d.open=true;
  let html='<summary>'+cat+'</summary>';
  items.forEach((name,index)=>{
   const me=getValue(cat,index,'me');
   const partner=getValue(cat,index,'partner');
   html+=`<div class="item"><b>${name}</b>
   <div class="segmented">あい ${['重要','できれば','なし'].map(v=>`<button class="seg-btn ${me===v?'active':''}" onclick="setValue('${cat}|${index}|me','${v}')">${v}</button>`).join('')}</div>
   <div class="segmented">はるや ${['重要','できれば','なし'].map(v=>`<button class="seg-btn ${partner===v?'active':''}" onclick="setValue('${cat}|${index}|partner','${v}')">${v}</button>`).join('')}</div></div>`;
  });
  d.innerHTML=html;
  root.appendChild(d);
 });
}

document.getElementById('addConditionBtn')?.addEventListener('click',addCondition);
loadState();
