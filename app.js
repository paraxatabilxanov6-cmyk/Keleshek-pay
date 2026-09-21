const KEY="keleshek_pay_v3";
const state={students:[],payments:[],tab:"home"};
const $=s=>document.querySelector(s);
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x){state.students=x.students||[];state.payments=x.payments||[]}}catch(e){}}
function save(){localStorage.setItem(KEY,JSON.stringify({students:state.students,payments:state.payments}))}
function money(n){return new Intl.NumberFormat("uz-UZ").format(n)+" so'm"}
function tariff(date=new Date()){return date.getDate()<=20?250000:280000}
function monthLabel(){return new Intl.DateTimeFormat("uz-UZ",{month:"long",year:"numeric"}).format(new Date())}
function initials(n){return n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function paidThisMonth(id){return state.payments.filter(p=>p.studentId===id&&p.month===new Date().toISOString().slice(0,7)).reduce((a,p)=>a+p.amount,0)}
function due(s){return Math.max(0,tariff()-paidThisMonth(s.id))}
function render(){
 document.querySelector("#app").innerHTML=`<div class="app">
 <header class="header"><div><div class="brand">KELESHEK PAY</div><div class="month">${monthLabel()}</div></div><button class="plus" onclick="openAdd()">+</button></header>
 <main class="content">${state.tab==="home"?home():state.tab==="students"?students():state.tab==="payments"?payments():settings()}</main>
 <nav class="bottom">
 ${nav("home","⌂","Bosh sahifa")}${nav("students","👥","O‘quvchilar")}${nav("payments","▣","To‘lovlar")}${nav("settings","⚙","Sozlamalar")}
 </nav></div>`;
}
function nav(t,i,l){return `<button class="nav ${state.tab===t?"active":""}" onclick="state.tab='${t}';render()"><span class="ico">${i}</span>${l}</button>`}
function home(){
 const paid=state.students.filter(s=>due(s)===0).length, debt=state.students.filter(s=>due(s)>0), revenue=state.payments.filter(p=>p.month===new Date().toISOString().slice(0,7)).reduce((a,p)=>a+p.amount,0);
 return `<div class="grid">
 <div class="card"><div class="label">O‘quvchilar</div><div class="num blue">${state.students.length}</div></div>
 <div class="card"><div class="label">To‘laganlar</div><div class="num green">${paid}</div></div>
 <div class="card"><div class="label">Qarzdorlar</div><div class="num red">${debt.length}</div></div>
 <div class="card"><div class="label">Tushum</div><div class="num blue">${money(revenue)}</div></div>
 <div class="card tariff"><div class="label">Bugungi tarif</div><div class="num">${money(tariff())}</div><div class="sub">${new Date().getDate()<=20?"20-sanagacha":"21-sanadan boshlab"} to‘lov</div></div>
 </div>
 <div class="section-title">Tezkor amal</div><button class="primary" onclick="openAdd()">＋ O‘quvchi qo‘shish</button>
 <div class="section-title">Qarzdorlar</div>
 <div class="list">${debt.length?debt.slice(0,10).map(studentCard).join(""):`<div class="empty">Hozircha qarzdorlar yo‘q</div>`}</div>`;
}
function studentCard(s){
 const d=due(s);
 return `<button class="student" style="text-align:left" onclick="openProfile('${s.id}')"><div class="avatar">${initials(s.name)}</div><div class="student-main"><div class="student-name">${esc(s.name)}</div><div class="student-meta">${esc(s.group||"Guruh ko‘rsatilmagan")}</div></div><span class="badge ${d?"redbg":"greenbg"}">${d?money(d):"To‘langan"}</span></button>`;
}
function students(){
 return `<div class="section-title" style="margin-top:0">O‘quvchilar</div><input class="search" placeholder="O‘quvchini qidirish..." oninput="filterStudents(this.value)"><div id="studentList" class="list">${state.students.map(studentCard).join("")||`<div class="empty">Hozircha o‘quvchi yo‘q.<br><br><button class="smallbtn" onclick="openAdd()">O‘quvchi qo‘shish</button></div>`}</div>`;
}
function filterStudents(q){const x=q.toLowerCase();$("#studentList").innerHTML=state.students.filter(s=>s.name.toLowerCase().includes(x)||(s.group||"").toLowerCase().includes(x)).map(studentCard).join("")||`<div class="empty">Topilmadi</div>`}
function payments(){
 const arr=state.payments.slice().reverse();
 return `<div class="section-title" style="margin-top:0">To‘lovlar</div>${arr.length?`<div class="list">${arr.map(p=>{const s=state.students.find(x=>x.id===p.studentId);return `<div class="card"><div class="row"><b>${esc(s?.name||"O‘chirilgan o‘quvchi")}</b><span class="badge greenbg">+${money(p.amount)}</span></div><div class="sub">${p.date} · ${p.note||"Oylik to‘lov"}</div></div>`}).join("")}</div>`:`<div class="empty">Hozircha to‘lovlar tarixi yo‘q.</div>`}`;
}
function settings(){return `<div class="section-title" style="margin-top:0">Sozlamalar</div><div class="card"><div class="row"><div><b>20-sanagacha tarif</b><div class="sub">Standart: 250 000 so‘m</div></div></div></div><div class="card" style="margin-top:12px"><div class="row"><div><b>21-sanadan keyingi tarif</b><div class="sub">Standart: 280 000 so‘m</div></div></div></div><div class="card" style="margin-top:12px"><b>SMS</b><div class="sub" style="margin-top:7px">SMS yuborish uchun keyin SMS provayder API ulanadi. Hozircha ilova SMS matnini tayyorlashga tayyor.</div></div>`}
function openAdd(){
 modal(`<button class="close" onclick="closeModal()">×</button><h2>Yangi o‘quvchi</h2>
 <div class="field"><input id="f_name" placeholder="Ism-familiya *"></div>
 <div class="field"><input id="f_phone" placeholder="O‘quvchi telefoni" inputmode="tel"></div>
 <div class="field"><input id="f_parent" placeholder="Ota-ona ismi"></div>
 <div class="field"><input id="f_parentPhone" placeholder="Ota-ona telefoni" inputmode="tel"></div>
 <div class="field"><input id="f_group" placeholder="Guruh"></div>
 <div class="field"><input id="f_subject" placeholder="Fan"></div>
 <div class="field"><input id="f_dueDay" placeholder="To‘lov kuni (masalan: 20)" inputmode="numeric"></div>
 <div class="actions"><button class="cancel" onclick="closeModal()">Bekor</button><button class="save" onclick="addStudent()">Saqlash</button></div>`);
}
function addStudent(){
 const name=$("#f_name").value.trim();if(!name){alert("Ism-familiyani kiriting");return}
 state.students.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),name,phone:$("#f_phone").value.trim(),parent:$("#f_parent").value.trim(),parentPhone:$("#f_parentPhone").value.trim(),group:$("#f_group").value.trim(),subject:$("#f_subject").value.trim(),dueDay:Number($("#f_dueDay").value)||20});
 save();closeModal();render();toast("O‘quvchi saqlandi");
}
function openProfile(id){
 const s=state.students.find(x=>x.id===id);if(!s)return;
 const d=due(s), hist=state.payments.filter(p=>p.studentId===id).slice().reverse();
 modal(`<button class="close" onclick="closeModal()">×</button>
 <div class="profile-top"><div class="avatar">${initials(s.name)}</div><div><div class="profile-name">${esc(s.name)}</div><div class="sub">${esc(s.group||"Guruh yo‘q")}</div></div></div>
 <div class="payment-box"><div class="label">Shu oy qarzdorligi</div><div class="num ${d?"red":"green"}" style="font-size:34px">${d?money(d):"To‘langan"}</div><div class="sub">Bugungi tarif: ${money(tariff())}</div></div>
 ${s.phone?`<div class="detail"><b>O‘quvchi telefoni</b>${esc(s.phone)}</div>`:""}
 ${s.parent?`<div class="detail"><b>Ota-ona</b>${esc(s.parent)}</div>`:""}
 ${s.parentPhone?`<div class="detail"><b>Ota-ona telefoni</b>${esc(s.parentPhone)}</div>`:""}
 ${s.subject?`<div class="detail"><b>Fan</b>${esc(s.subject)}</div>`:""}
 <div class="actions"><button class="smallbtn" onclick="openPayment('${s.id}')">💳 To‘lov qabul qilish</button><button class="smallbtn" onclick="smsDraft('${s.id}')">✉️ SMS tayyorlash</button></div>
 <h3>To‘lov tarixi</h3>${hist.length?hist.map(p=>`<div class="history-item"><span>${p.date}</span><b>${money(p.amount)}</b></div>`).join(""):`<div class="sub">To‘lovlar hali yo‘q.</div>`}`);
}
function openPayment(id){
 const s=state.students.find(x=>x.id===id);
 modal(`<button class="close" onclick="openProfile('${id}')">×</button><h2>To‘lov qabul qilish</h2><div class="payment-box"><div class="label">Tavsiya etiladigan summa</div><div class="num blue" style="font-size:34px">${money(due(s)||tariff())}</div></div>
 <div class="field"><input id="p_amount" value="${due(s)||tariff()}" inputmode="numeric"></div>
 <div class="field"><input id="p_note" placeholder="Izoh (ixtiyoriy)"></div>
 <div class="actions"><button class="cancel" onclick="openProfile('${id}')">Bekor</button><button class="save" onclick="addPayment('${id}')">To‘lovni saqlash</button></div>`);
}
function addPayment(id){
 const amount=Number($("#p_amount").value.replace(/\D/g,""));if(!amount){alert("Summani kiriting");return}
 state.payments.push({id:Date.now().toString(),studentId:id,amount,date:new Date().toLocaleDateString("uz-UZ"),month:new Date().toISOString().slice(0,7),note:$("#p_note").value.trim()});
 save();closeModal();render();toast("To‘lov saqlandi");
}
function smsDraft(id){
 const s=state.students.find(x=>x.id===id), d=due(s), text=`Assalomu alaykum. ${s.name}ning shu oy o‘quv to‘lovi ${money(d||tariff())}. To‘lovni amalga oshirishingizni so‘raymiz. Keleshek O‘quv Orayi.`;
 if(navigator.share){navigator.share({text}).catch(()=>{})}else{navigator.clipboard?.writeText(text);toast("SMS matni nusxalandi")}
}
function modal(html){const x=document.createElement("div");x.className="modal-back";x.id="modal";x.innerHTML=`<div class="sheet">${html}</div>`;document.body.appendChild(x)}
function closeModal(){$("#modal")?.remove()}
function toast(t){const x=document.createElement("div");x.className="toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2800)}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
load();render();