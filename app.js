const KEY="keleshek_pay_v5"; const OLD_KEY="keleshek_pay_v4";
const state={students:[],payments:[],tab:"home",month:new Date().toISOString().slice(0,7)};
const $=s=>document.querySelector(s);
function load(){try{
 let raw=localStorage.getItem(KEY);
 if(!raw) raw=localStorage.getItem(OLD_KEY);
 const x=JSON.parse(raw||"null");
 if(x){state.students=x.students||[];state.payments=x.payments||[]}
}catch(e){console.warn(e)}}
function save(){localStorage.setItem(KEY,JSON.stringify({students:state.students,payments:state.payments,version:5,savedAt:new Date().toISOString()}))}
function money(n){return new Intl.NumberFormat("uz-UZ").format(Math.round(n||0))+" so'm"}
function monthKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function monthLabel(k=state.month){const [y,m]=k.split("-").map(Number);return new Intl.DateTimeFormat("uz-UZ",{month:"long",year:"numeric"}).format(new Date(y,m-1,1))}
function currentTariff(){return new Date().getDate()<=20?250000:280000}
function paidThisMonth(id,m=state.month){return state.payments.filter(p=>p.studentId===id&&p.month===m).reduce((a,p)=>a+p.amount,0)}
function paymentDate(p){

  if(p.paidAt){

    return new Date(p.paidAt);

  }

  // Eski to‘lovlarni saqlab qolish uchun

  // eski date formatini ham o‘qishga harakat qiladi.

  if(p.date){

    const parts=String(p.date).split(/[./-]/).map(Number);

    if(parts.length===3){

      let [d,m,y]=parts;

      if(y<100) y+=2000;

      const dt=new Date(y,m-1,d);

      if(!isNaN(dt.getTime())) return dt;

    }

  }

  return null;

}

function paidBeforeOrOn20(id,m=state.month){

  return state.payments

    .filter(p=>p.studentId===id&&p.month===m)

    .filter(p=>{

      const d=paymentDate(p);

      return d && d.getDate()<=20;

    })

    .reduce((a,p)=>a+p.amount,0);

}

function paidAfter20(id,m=state.month){

  return state.payments

    .filter(p=>p.studentId===id&&p.month===m)

    .filter(p=>{

      const d=paymentDate(p);

      return d && d.getDate()>20;

    })

    .reduce((a,p)=>a+p.amount,0);

}
function targetForStudent(id,m=state.month){

  const [y,mo]=m.split("-").map(Number);

  const [cy,cmo]=monthKey().split("-").map(Number);

  const total=paidThisMonth(id,m);

  const early=paidBeforeOrOn20(id,m);

  const late=paidAfter20(id,m);

  // O'TGAN OY

  if(y<cy || (y===cy && mo<cmo)){

    return 280000;

  }

  // KELAJAK OY

  if(y>cy || (y===cy && mo>cmo)){

    return 250000;

  }

  // JORIY OY

  // 21-sanadan keyin qilingan har qanday to'lov

  // tarifni 280 000 qiladi.

  if(late>0){

    return 280000;

  }

  // 20-sanagacha 250 000 to'langan bo'lsa,

  // keyinchalik 30 000 qo'shilmaydi.

  if(early>=250000){

    return 250000;

  }

  // Joriy oy 21-sanadan o'tgan bo'lsa,

  // to'liq to'lanmagan qarz 280 000 asosida.

  if(new Date().getDate()>20){

    return 280000;

  }

  return 250000;

}
function due(s,m=state.month){return Math.max(0,targetForStudent(s.id,m)-paidThisMonth(s.id,m))}
function initials(n){return String(n||"").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"?"}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function nav(t,i,l){return `<button class="nav ${state.tab===t?"active":""}" onclick="state.tab='${t}';render()"><span class="ico">${i}</span>${l}</button>`}
function render(){document.querySelector("#app").innerHTML=`<div class="app"><header class="header"><div><div class="brand">KELESHEK PAY</div><div class="month">${esc(monthLabel())}</div></div><button class="plus" onclick="openAdd()">+</button></header><main class="content">${state.tab==="home"?home():state.tab==="students"?students():state.tab==="payments"?payments():state.tab==="debtors"?debtors():state.tab==="reports"?reports():settings()}</main><nav class="bottom">${nav("home","⌂","Bosh sahifa")}${nav("students","👥","O‘quvchilar")}${nav("payments","▣","To‘lovlar")}${nav("debtors","🔴","Qarzlar")}${nav("reports","📊","Hisobot")}${nav("settings","⚙","Sozlamalar")}</nav></div>`}
function home(){const debt=state.students.filter(s=>due(s)>0), paid=state.students.filter(s=>due(s)===0).length, revenue=state.payments.filter(p=>p.month===state.month).reduce((a,p)=>a+p.amount,0);return `<div class="grid"><div class="card"><div class="label">O‘quvchilar</div><div class="num blue">${state.students.length}</div></div><div class="card"><div class="label">To‘laganlar</div><div class="num green">${paid}</div></div><div class="card"><div class="label">Qarzdorlar</div><div class="num red">${debt.length}</div></div><div class="card"><div class="label">Tushum</div><div class="num blue">${money(revenue)}</div></div><div class="card tariff"><div class="label">Bugungi tarif</div><div class="num">${money(currentTariff())}</div><div class="sub">${new Date().getDate()<=20?"20-sanagacha":"21-sanadan boshlab"} to‘lov</div></div></div><div class="section-title">Tezkor amal</div><button class="primary" onclick="openAdd()">＋ O‘quvchi qo‘shish</button><div class="section-title">Qarzdorlar</div><div class="list">${debt.length?debt.slice(0,20).map(studentCard).join(""):`<div class="empty">Hozircha qarzdorlar yo‘q 🎉</div>`}</div>`}
function studentCard(s){const d=due(s);return `<button class="student" style="text-align:left" onclick="openProfile('${s.id}')"><div class="avatar">${initials(s.name)}</div><div class="student-main"><div class="student-name">${esc(s.name)}</div><div class="student-meta">${esc(s.group||"Guruh ko‘rsatilmagan")}</div></div><span class="badge ${d?"redbg":"greenbg"}">${d?money(d):"To‘langan"}</span></button>`}
function students(){return `<div class="section-title" style="margin-top:0">O‘quvchilar <span class="count">${state.students.length}</span></div><input class="search" placeholder="O‘quvchini qidirish..." oninput="filterStudents(this.value)"><div id="studentList" class="list">${state.students.map(studentCard).join("")||`<div class="empty">Hozircha o‘quvchi yo‘q.<br><br><button class="smallbtn" onclick="openAdd()">O‘quvchi qo‘shish</button></div>`}</div>`}
function filterStudents(q){const x=q.toLowerCase();$("#studentList").innerHTML=state.students.filter(s=>[s.name,s.group,s.phone,s.parent,s.parentPhone,s.subject].some(v=>String(v||"").toLowerCase().includes(x))).map(studentCard).join("")||`<div class="empty">Topilmadi</div>`}
function payments(){const arr=state.payments.filter(p=>p.month===state.month).slice().reverse();return `<div class="section-title" style="margin-top:0">${esc(monthLabel())} to‘lovlari</div><div class="list">${arr.length?arr.map(p=>{const s=state.students.find(x=>x.id===p.studentId);return `<div class="card"><div class="row"><b>${esc(s?.name||"O‘chirilgan o‘quvchi")}</b><span class="badge greenbg">+${money(p.amount)}</span></div><div class="sub">${esc(p.date)} · ${esc(p.note||"Oylik to‘lov")}</div></div>`}).join(""):`<div class="empty">Bu oyda to‘lovlar yo‘q.</div>`}</div>`}

function debtors(){
 const arr=state.students.map(s=>({s,d:due(s)})).filter(x=>x.d>0).sort((a,b)=>b.d-a.d);
 const total=arr.reduce((a,x)=>a+x.d,0);
 return `<div class="section-title" style="margin-top:0">Qarzdorlar</div>
 <div class="grid">
   <div class="card"><div class="label">Qarzdorlar</div><div class="num red">${arr.length}</div></div>
   <div class="card"><div class="label">Jami qarz</div><div class="num red" style="font-size:34px">${money(total)}</div></div>
 </div>
 <div class="section-title">Ro‘yxat</div>
 <div class="list">${arr.length?arr.map(x=>studentCard(x.s)).join(""):`<div class="empty">Qarzdorlar yo‘q 🎉</div>`}</div>`;
}
function reports(){
 const month=state.month;
 const monthPayments=state.payments.filter(p=>p.month===month);
 const revenue=monthPayments.reduce((a,p)=>a+p.amount,0);
 const paid=state.students.filter(s=>due(s,month)===0).length;
 const debt=state.students.filter(s=>due(s,month)>0);
 const debtTotal=debt.reduce((a,s)=>a+due(s,month),0);
 const partial=state.students.filter(s=>{const p=paidThisMonth(s.id,month);return p>0&&due(s,month)>0}).length;
 const byGroup={};
 state.students.forEach(s=>{const g=s.group||"Guruhsiz";if(!byGroup[g])byGroup[g]={count:0,paid:0,revenue:0,debt:0};byGroup[g].count++;byGroup[g].revenue+=monthPayments.filter(p=>p.studentId===s.id).reduce((a,p)=>a+p.amount,0);if(due(s,month)===0)byGroup[g].paid++;byGroup[g].debt+=due(s,month)});
 return `<div class="section-title" style="margin-top:0">Hisobot</div>
 <div class="card">
   <div class="row"><button class="smallbtn" onclick="changeReportMonth(-1)">‹ Oldingi oy</button><b>${esc(monthLabel(month))}</b><button class="smallbtn" onclick="changeReportMonth(1)">Keyingi ›</button></div>
 </div>
 <div class="grid" style="margin-top:16px">
   <div class="card"><div class="label">Tushum</div><div class="num blue" style="font-size:34px">${money(revenue)}</div></div>
   <div class="card"><div class="label">To‘laganlar</div><div class="num green">${paid}</div></div>
   <div class="card"><div class="label">Qarzdorlar</div><div class="num red">${debt.length}</div></div>
   <div class="card"><div class="label">Jami qarz</div><div class="num red" style="font-size:34px">${money(debtTotal)}</div></div>
 </div>
 <div class="card" style="margin-top:16px"><div class="row"><b>Qisman to‘laganlar</b><span class="badge graybg">${partial}</span></div><div class="sub" style="margin-top:7px">Bu oy pul bergan, lekin to‘liq yopmagan o‘quvchilar.</div></div>
 <div class="section-title">Guruhlar bo‘yicha</div>
 <div class="list">${Object.entries(byGroup).map(([g,x])=>`<div class="card"><div class="row"><b>${esc(g)}</b><span class="badge graybg">${x.count} ta</span></div><div class="sub" style="margin-top:8px">Tushum: <b>${money(x.revenue)}</b> · To‘lagan: <b>${x.paid}</b> · Qarz: <b>${money(x.debt)}</b></div></div>`).join("")||`<div class="empty">Ma’lumot yo‘q</div>`}</div>`;
}
function changeReportMonth(delta){
 const [y,m]=state.month.split("-").map(Number);
 const d=new Date(y,m-1+delta,1);
 state.month=monthKey(d); render();
}
function settings(){return `<div class="section-title" style="margin-top:0">Sozlamalar</div><div class="card"><b>To‘lov tarifi</b><div class="sub" style="margin-top:7px">20-sanagacha: <b>250 000 so‘m</b><br>21-sanadan boshlab: <b>280 000 so‘m</b></div></div><div class="section-title">Zaxira nusxa</div><div class="card"><div class="sub">Ma’lumotlarni fayl qilib saqlab qo‘ying. Telefon almashtirsangiz, qayta yuklashingiz mumkin.</div><div class="actions"><button class="smallbtn" onclick="backup()">⬇️ Zaxira olish</button><button class="smallbtn" onclick="document.querySelector('#restore').click()">⬆️ Tiklash</button></div><input id="restore" type="file" accept="application/json" style="display:none" onchange="restoreFile(this)"></div><div class="section-title">Ma’lumotlar</div><div class="card"><div class="row"><div><b>O‘quvchilar</b><div class="sub">${state.students.length} ta</div></div><div><b>To‘lovlar</b><div class="sub">${state.payments.length} ta</div></div></div><button class="smallbtn danger" style="margin-top:15px;width:100%" onclick="clearAll()">Barcha ma’lumotlarni o‘chirish</button></div><div class="card" style="margin-top:12px"><b>SMS</b><div class="sub" style="margin-top:7px">Hozircha SMS matni tayyorlanadi. Haqiqiy avtomatik SMS uchun keyingi bosqichda SMS provayder API ulanadi.</div></div>`}
function openAdd(editId=null){const s=editId?state.students.find(x=>x.id===editId):null;modal(`<button class="close" onclick="closeModal()">×</button><h2>${s?"O‘quvchini tahrirlash":"Yangi o‘quvchi"}</h2><div class="field"><input id="f_name" value="${esc(s?.name||"")}" placeholder="Ism-familiya *"></div><div class="field"><input id="f_phone" value="${esc(s?.phone||"")}" placeholder="O‘quvchi telefoni" inputmode="tel"></div><div class="field"><input id="f_parent" value="${esc(s?.parent||"")}" placeholder="Ota-ona ismi"></div><div class="field"><input id="f_parentPhone" value="${esc(s?.parentPhone||"")}" placeholder="Ota-ona telefoni" inputmode="tel"></div><div class="field"><input id="f_group" value="${esc(s?.group||"")}" placeholder="Guruh"></div><div class="field"><input id="f_subject" value="${esc(s?.subject||"")}" placeholder="Fan"></div><div class="actions"><button class="cancel" onclick="closeModal()">Bekor</button><button class="save" onclick="${s?`updateStudent('${s.id}')`:"addStudent()"}">Saqlash</button></div>`)}
function addStudent(){const name=$("#f_name").value.trim();if(!name){alert("Ism-familiyani kiriting");return}state.students.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),name,phone:$("#f_phone").value.trim(),parent:$("#f_parent").value.trim(),parentPhone:$("#f_parentPhone").value.trim(),group:$("#f_group").value.trim(),subject:$("#f_subject").value.trim()});save();closeModal();render();toast("O‘quvchi saqlandi")}
function updateStudent(id){const s=state.students.find(x=>x.id===id);if(!s)return;s.name=$("#f_name").value.trim();s.phone=$("#f_phone").value.trim();s.parent=$("#f_parent").value.trim();s.parentPhone=$("#f_parentPhone").value.trim();s.group=$("#f_group").value.trim();s.subject=$("#f_subject").value.trim();if(!s.name){alert("Ism-familiyani kiriting");return}save();closeModal();render();toast("Ma’lumotlar yangilandi")}
function openProfile(id){const s=state.students.find(x=>x.id===id);if(!s)return;const d=due(s),hist=state.payments.filter(p=>p.studentId===id).slice().reverse();modal(`<button class="close" onclick="closeModal()">×</button><div class="profile-top"><div class="avatar">${initials(s.name)}</div><div><div class="profile-name">${esc(s.name)}</div><div class="sub">${esc(s.group||"Guruh yo‘q")}${s.subject?" · "+esc(s.subject):""}</div></div></div><div class="payment-box"><div class="label">${esc(monthLabel())} qarzdorligi</div><div class="num ${d?"red":"green"}" style="font-size:34px">${d?money(d):"To‘langan"}</div><div class="sub">Hisoblangan tarif: ${money(targetForStudent(s.id))}</div></div>${s.phone?`<div class="detail"><b>O‘quvchi telefoni</b>${esc(s.phone)}</div>`:""}${s.parent?`<div class="detail"><b>Ota-ona</b>${esc(s.parent)}</div>`:""}${s.parentPhone?`<div class="detail"><b>Ota-ona telefoni</b>${esc(s.parentPhone)}</div>`:""}<div class="actions"><button class="smallbtn" onclick="openPayment('${s.id}')">💳 To‘lov qabul qilish</button><button class="smallbtn" onclick="smsDraft('${s.id}')">✉️ SMS</button></div><div class="actions"><button class="smallbtn" onclick="openAdd('${s.id}')">✏️ Tahrirlash</button><button class="smallbtn danger" onclick="deleteStudent('${s.id}')">🗑 O‘chirish</button></div><h3>To‘lov tarixi</h3>${hist.length?hist.map(p=>`<div class="history-item"><span>${esc(p.date)}<small>${p.month===state.month?" · shu oy":""}</small></span><b>${money(p.amount)}</b></div>`).join(""):`<div class="sub">To‘lovlar hali yo‘q.</div>`}`)}
function openPayment(id){const s=state.students.find(x=>x.id===id),suggest=Math.max(0,due(s));modal(`<button class="close" onclick="openProfile('${id}')">×</button><h2>To‘lov qabul qilish</h2><div class="payment-box"><div class="label">Qolgan summa</div><div class="num blue" style="font-size:34px">${money(suggest)}</div></div><div class="field"><input id="p_amount" value="${suggest||currentTariff()}" inputmode="numeric"></div><div class="field"><input id="p_note" placeholder="Izoh (ixtiyoriy)"></div><div class="actions"><button class="cancel" onclick="openProfile('${id}')">Bekor</button><button class="save" onclick="addPayment('${id}')">To‘lovni saqlash</button></div>`)}
function addPayment(id){

  const amount=Number(

    $("#p_amount").value.replace(/\D/g,"")

  );

  if(!amount){

    alert("Summani kiriting");

    return;

  }

  const now=new Date();

  state.payments.push({

    id:crypto.randomUUID

      ?crypto.randomUUID()

      :Date.now().toString(),

    studentId:id,

    amount:amount,

    // Ekranda ko'rsatish uchun

    date:now.toLocaleDateString("uz-UZ"),

    // Hisob-kitob uchun ANIQ sana

    paidAt:now.toISOString(),

    month:monthKey(now),

    note:$("#p_note").value.trim()

  });

  save();

  closeModal();

  render();

  toast("To‘lov saqlandi");

}function smsDraft(id){const s=state.students.find(x=>x.id===id),d=due(s),phone=s.parentPhone||s.phone,text=`Assalomu alaykum. ${s.name}ning ${monthLabel()} o‘quv to‘lovi bo‘yicha ${money(d)} qarzdorligi mavjud. To‘lovni amalga oshirishingizni so‘raymiz. Keleshek O‘quv Orayi.`;const sms=phone?`sms:${phone}?&body=${encodeURIComponent(text)}`:"";if(sms){location.href=sms}else{navigator.clipboard?.writeText(text);toast("Telefon raqami yo‘q — SMS matni nusxalandi")}}
function deleteStudent(id){const s=state.students.find(x=>x.id===id);if(!s)return;if(confirm(`${s.name}ni o‘chirishni tasdiqlaysizmi? To‘lovlar tarixi ham o‘chiriladi.`)){state.students=state.students.filter(x=>x.id!==id);state.payments=state.payments.filter(x=>x.studentId!==id);save();closeModal();render();toast("O‘quvchi o‘chirildi")}}
function backup(){const data={version:5,exportedAt:new Date().toISOString(),students:state.students,payments:state.payments};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`keleshek-pay-backup-${monthKey()}.json`;a.click();URL.revokeObjectURL(url);toast("Zaxira fayli tayyor")}
function restoreFile(input){const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.students)||!Array.isArray(x.payments))throw new Error();if(confirm("Mavjud ma’lumotlar o‘rniga zaxiradagi ma’lumotlar yuklansinmi?")){state.students=x.students;state.payments=x.payments;save();render();toast("Zaxira tiklandi")}}catch(e){alert("Zaxira fayli noto‘g‘ri yoki buzilgan")}};r.readAsText(f);input.value=""}
function clearAll(){if(confirm("BARCHA o‘quvchilar va to‘lovlar o‘chiriladi. Davom etamizmi?")){state.students=[];state.payments=[];save();render();toast("Barcha ma’lumotlar o‘chirildi")}}
function modal(html){const x=document.createElement("div");x.className="modal-back";x.id="modal";x.innerHTML=`<div class="sheet">${html}</div>`;document.body.appendChild(x)}
function closeModal(){$("#modal")?.remove()}
function toast(t){const x=document.createElement("div");x.className="toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2800)}
load();render();
