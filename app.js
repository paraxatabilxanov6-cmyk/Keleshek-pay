const KEY="keleshek_pay_v6";
const OLD_KEY="keleshek_pay_v5";

const TEST_KEY="keleshek_pay_test_mode";

const state={
  students:[],
  payments:[],
  tab:"home",
  month:new Date().toISOString().slice(0,7),
  testMode:false,
  testDate:null
};

const $=s=>document.querySelector(s);


/* =========================
   SANA VA TEST REJIMI
========================= */

function appNow(){

  if(state.testMode && state.testDate){

    const d=new Date(state.testDate+"T12:00:00");

    if(!isNaN(d.getTime())){
      return d;
    }

  }

  return new Date();

}


function monthKey(d=new Date()){

  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

}


function monthLabel(k=state.month){

  const [y,m]=k.split("-").map(Number);

  return new Intl.DateTimeFormat("uz-UZ",{
    month:"long",
    year:"numeric"
  }).format(new Date(y,m-1,1));

}


function formatTestDate(value){

  const d=new Date(value+"T12:00:00");

  if(isNaN(d.getTime())) return value;

  return d.toLocaleDateString("uz-UZ",{
    day:"2-digit",
    month:"long",
    year:"numeric"
  });

}


/* =========================
   LOAD / SAVE
========================= */

function load(){

  try{

    let raw=localStorage.getItem(KEY);

    if(!raw){
      raw=localStorage.getItem(OLD_KEY);
    }

    const x=JSON.parse(raw||"null");

    if(x){

      state.students=x.students||[];
      state.payments=x.payments||[];

    }

    const test=JSON.parse(
      localStorage.getItem(TEST_KEY)||"null"
    );

    if(test && test.testMode && test.testDate){

      state.testMode=true;
      state.testDate=test.testDate;
      state.month=test.testDate.slice(0,7);

    }

  }catch(e){

    console.warn(e);

  }

}


function save(){

  localStorage.setItem(
    KEY,
    JSON.stringify({
      students:state.students,
      payments:state.payments,
      version:6,
      savedAt:new Date().toISOString()
    })
  );

}


/* =========================
   PUL
========================= */

function money(n){

  return new Intl.NumberFormat("uz-UZ")
    .format(Math.round(n||0))+" so'm";

}


function currentTariff(){

  return appNow().getDate()<=20
    ?250000
    :280000;

}


/* =========================
   TO‘LOVLAR
========================= */

function paidThisMonth(id,m=state.month){

  return state.payments
    .filter(p=>p.studentId===id&&p.month===m)
    .reduce((a,p)=>a+p.amount,0);

}


function paymentDate(p){

  if(p.paidAt){

    const d=new Date(p.paidAt);

    if(!isNaN(d.getTime())){
      return d;
    }

  }

  if(p.date){

    const parts=String(p.date)
      .split(/[./-]/)
      .map(Number);

    if(parts.length===3){

      let [d,m,y]=parts;

      if(y<100){
        y+=2000;
      }

      const dt=new Date(y,m-1,d);

      if(!isNaN(dt.getTime())){
        return dt;
      }

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


/* =========================
   ASOSIY QARZ HISOBLASH
========================= */

function targetForStudent(id,m=state.month){

  const [y,mo]=m.split("-").map(Number);

  const [cy,cmo]=monthKey(appNow())
    .split("-")
    .map(Number);

  const total=paidThisMonth(id,m);

  const early=paidBeforeOrOn20(id,m);

  const late=paidAfter20(id,m);


  /* O‘TGAN OY */

  if(
    y<cy ||
    (y===cy && mo<cmo)
  ){

    return 280000;

  }


  /* KELAJAK OY */

  if(
    y>cy ||
    (y===cy && mo>cmo)
  ){

    return 250000;

  }


  /* JORIY OY */

  /*
     21-sanadan keyin to‘lov qilingan bo‘lsa
     tarif 280 000 bo‘ladi.
  */

  if(late>0){

    return 280000;

  }


  /*
     20-sanagacha 250 000 to‘liq to‘langan bo‘lsa,
     keyinchalik 30 000 qo‘shilmaydi.
  */

  if(early>=250000){

    return 250000;

  }


  /*
     21-sanadan o‘tgan bo‘lsa,
     hali to‘liq yopilmagan qarz 280 000.
  */

  if(appNow().getDate()>20){

    return 280000;

  }


  return 250000;

}


function due(s,m=state.month){

  return Math.max(
    0,
    targetForStudent(s.id,m)-paidThisMonth(s.id,m)
  );

}


/* =========================
   TEST REJIMI
========================= */

function setTestDate(value){

  if(!value){
    return;
  }

  state.testMode=true;
  state.testDate=value;
  state.month=value.slice(0,7);

  localStorage.setItem(
    TEST_KEY,
    JSON.stringify({
      testMode:true,
      testDate:value
    })
  );

  render();

  toast(
    "Test sanasi: "+formatTestDate(value)
  );

}


function enableCustomTestDate(){

  const input=document.querySelector("#testDate");

  if(!input || !input.value){

    alert("Test sanasini tanlang");

    return;

  }

  setTestDate(input.value);

}


function disableTestMode(){

  state.testMode=false;
  state.testDate=null;

  localStorage.removeItem(TEST_KEY);

  state.month=monthKey(new Date());

  render();

  toast("Haqiqiy sana rejimiga qaytildi");

}


/* =========================
   YORDAMCHI
========================= */

function initials(n){

  return String(n||"")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0,2)
    .map(x=>x[0])
    .join("")
    .toUpperCase()||"?";

}


function esc(s){

  return String(s??"").replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "\"":"&quot;",
      "'":"&#39;"
    }[m])
  );

}


function nav(t,i,l){

  return `
    <button
      class="nav ${state.tab===t?"active":""}"
      onclick="state.tab='${t}';render()"
    >
      <span class="ico">${i}</span>
      ${l}
    </button>
  `;

}


/* =========================
   RENDER
========================= */

function render(){

  document.querySelector("#app").innerHTML=`

    <div class="app">

      <header class="header">

        <div>

          <div class="brand">
            KELESHEK PAY
          </div>

          <div class="month">

            ${esc(monthLabel())}

            ${
              state.testMode
              ? `<span style="
                    font-size:12px;
                    color:#e67e22;
                    margin-left:7px;
                  ">
                  🧪 TEST
                </span>`
              :""
            }

          </div>

        </div>

        <button
          class="plus"
          onclick="openAdd()"
        >
          +
        </button>

      </header>

      <main class="content">

        ${
          state.tab==="home"
          ?home()
          :state.tab==="students"
          ?students()
          :state.tab==="payments"
          ?payments()
          :state.tab==="debtors"
          ?debtors()
          :state.tab==="reports"
          ?reports()
          :settings()
        }

      </main>

      <nav class="bottom">

        ${nav("home","⌂","Bosh sahifa")}

        ${nav("students","👥","O‘quvchilar")}

        ${nav("payments","▣","To‘lovlar")}

        ${nav("debtors","🔴","Qarzlar")}

        ${nav("reports","📊","Hisobot")}

        ${nav("settings","⚙","Sozlamalar")}

      </nav>

    </div>

  `;

}


/* =========================
   BOSH SAHIFA
========================= */

function home(){

  const debt=
    state.students.filter(s=>due(s)>0);

  const paid=
    state.students.filter(s=>due(s)===0).length;

  const revenue=
    state.payments
      .filter(p=>p.month===state.month)
      .reduce((a,p)=>a+p.amount,0);

  return `

    <div class="grid">

      <div class="card">
        <div class="label">O‘quvchilar</div>
        <div class="num blue">
          ${state.students.length}
        </div>
      </div>

      <div class="card">
        <div class="label">To‘laganlar</div>
        <div class="num green">
          ${paid}
        </div>
      </div>

      <div class="card">
        <div class="label">Qarzdorlar</div>
        <div class="num red">
          ${debt.length}
        </div>
      </div>

      <div class="card">
        <div class="label">Tushum</div>
        <div class="num blue">
          ${money(revenue)}
        </div>
      </div>

      <div class="card tariff">

        <div class="label">
          Bugungi tarif
        </div>

        <div class="num">
          ${money(currentTariff())}
        </div>

        <div class="sub">

          ${
            appNow().getDate()<=20
            ?"20-sanagacha"
            :"21-sanadan boshlab"
          }

          to‘lov

        </div>

      </div>

    </div>


    <div class="section-title">
      Tezkor amal
    </div>

    <button
      class="primary"
      onclick="openAdd()"
    >
      ＋ O‘quvchi qo‘shish
    </button>


    <div class="section-title">
      Qarzdorlar
    </div>

    <div class="list">

      ${
        debt.length
        ?debt.slice(0,20).map(studentCard).join("")
        :`<div class="empty">
            Hozircha qarzdorlar yo‘q 🎉
          </div>`
      }

    </div>

  `;

}


/* =========================
   O‘QUVCHI CARD
========================= */

function studentCard(s){

  const d=due(s);

  return `

    <button
      class="student"
      style="text-align:left"
      onclick="openProfile('${s.id}')"
    >

      <div class="avatar">
        ${initials(s.name)}
      </div>

      <div class="student-main">

        <div class="student-name">
          ${esc(s.name)}
        </div>

        <div class="student-meta">
          ${esc(s.group||"Guruh ko‘rsatilmagan")}
        </div>

      </div>

      <span
        class="badge ${d?"redbg":"greenbg"}"
      >

        ${d?money(d):"To‘langan"}

      </span>

    </button>

  `;

}


/* =========================
   O‘QUVCHILAR
========================= */

function students(){

  return `

    <div
      class="section-title"
      style="margin-top:0"
    >

      O‘quvchilar

      <span class="count">
        ${state.students.length}
      </span>

    </div>

    <input
      class="search"
      placeholder="O‘quvchini qidirish..."
      oninput="filterStudents(this.value)"
    >

    <div
      id="studentList"
      class="list"
    >

      ${
        state.students.map(studentCard).join("")
        ||
        `<div class="empty">

          Hozircha o‘quvchi yo‘q.

          <br><br>

          <button
            class="smallbtn"
            onclick="openAdd()"
          >
            O‘quvchi qo‘shish
          </button>

        </div>`
      }

    </div>

  `;

}


function filterStudents(q){

  const x=q.toLowerCase();

  $("#studentList").innerHTML=

    state.students

      .filter(s=>
        [
          s.name,
          s.group,
          s.phone,
          s.parent,
          s.parentPhone,
          s.subject
        ]
        .some(v=>
          String(v||"")
            .toLowerCase()
            .includes(x)
        )
      )

      .map(studentCard)
      .join("")

      ||

      `<div class="empty">
        Topilmadi
      </div>`;

}


/* =========================
   TO‘LOVLAR
========================= */

function payments(){

  const arr=
    state.payments
      .filter(p=>p.month===state.month)
      .slice()
      .reverse();

  return `

    <div
      class="section-title"
      style="margin-top:0"
    >
      ${esc(monthLabel())} to‘lovlari
    </div>

    <div class="list">

      ${
        arr.length

        ?

        arr.map(p=>{

          const s=
            state.students
              .find(x=>x.id===p.studentId);

          return `

            <div class="card">

              <div class="row">

                <b>
                  ${esc(
                    s?.name ||
                    "O‘chirilgan o‘quvchi"
                  )}
                </b>

                <span class="badge greenbg">

                  +${money(p.amount)}

                </span>

              </div>

              <div class="sub">

                ${esc(p.date)}

                ·

                ${esc(
                  p.note||
                  "Oylik to‘lov"
                )}

              </div>

            </div>

          `;

        }).join("")

        :

        `<div class="empty">
          Bu oyda to‘lovlar yo‘q.
        </div>`

      }

    </div>

  `;

}


/* =========================
   QARZDORLAR
========================= */

function debtors(){

  const arr=
    state.students

      .map(s=>({
        s,
        d:due(s)
      }))

      .filter(x=>x.d>0)

      .sort((a,b)=>b.d-a.d);

  const total=
    arr.reduce(
      (a,x)=>a+x.d,
      0
    );

  return `

    <div
      class="section-title"
      style="margin-top:0"
    >
      Qarzdorlar
    </div>

    <div class="grid">

      <div class="card">

        <div class="label">
          Qarzdorlar
        </div>

        <div class="num red">
          ${arr.length}
        </div>

      </div>

      <div class="card">

        <div class="label">
          Jami qarz
        </div>

        <div
          class="num red"
          style="font-size:34px"
        >
          ${money(total)}
        </div>

      </div>

    </div>


    <div class="section-title">
      Ro‘yxat
    </div>

    <div class="list">

      ${
        arr.length

        ?arr
          .map(x=>studentCard(x.s))
          .join("")

        :`<div class="empty">
            Qarzdorlar yo‘q 🎉
          </div>`
      }

    </div>

  `;

}


/* =========================
   HISOBOT
========================= */

function reports(){

  const month=state.month;

  const monthPayments=
    state.payments
      .filter(p=>p.month===month);

  const revenue=
    monthPayments
      .reduce((a,p)=>a+p.amount,0);

  const paid=
    state.students
      .filter(s=>due(s,month)===0)
      .length;

  const debt=
    state.students
      .filter(s=>due(s,month)>0);

  const debtTotal=
    debt.reduce(
      (a,s)=>a+due(s,month),
      0
    );

  const partial=
    state.students
      .filter(s=>{

        const p=
          paidThisMonth(
            s.id,
            month
          );

        return p>0 &&
               due(s,month)>0;

      })
      .length;

  const byGroup={};

  state.students.forEach(s=>{

    const g=s.group||"Guruhsiz";

    if(!byGroup[g]){

      byGroup[g]={
        count:0,
        paid:0,
        revenue:0,
        debt:0
      };

    }

    byGroup[g].count++;

    byGroup[g].revenue+=

      monthPayments

        .filter(
          p=>p.studentId===s.id
        )

        .reduce(
          (a,p)=>a+p.amount,
          0
        );

    if(due(s,month)===0){

      byGroup[g].paid++;

    }

    byGroup[g].debt+=
      due(s,month);

  });


  return `

    <div
      class="section-title"
      style="margin-top:0"
    >
      Hisobot
    </div>


    <div class="card">

      <div class="row">

        <button
          class="smallbtn"
          onclick="changeReportMonth(-1)"
        >
          ‹ Oldingi oy
        </button>

        <b>
          ${esc(monthLabel(month))}
        </b>

        <button
          class="smallbtn"
          onclick="changeReportMonth(1)"
        >
          Keyingi ›
        </button>

      </div>

    </div>


    <div
      class="grid"
      style="margin-top:16px"
    >

      <div class="card">

        <div class="label">
          Tushum
        </div>

        <div
          class="num blue"
          style="font-size:34px"
        >
          ${money(revenue)}
        </div>

      </div>


      <div class="card">

        <div class="label">
          To‘laganlar
        </div>

        <div class="num green">
          ${paid}
        </div>

      </div>


      <div class="card">

        <div class="label">
          Qarzdorlar
        </div>

        <div class="num red">
          ${debt.length}
        </div>

      </div>


      <div class="card">

        <div class="label">
          Jami qarz
        </div>

        <div
          class="num red"
          style="font-size:34px"
        >
          ${money(debtTotal)}
        </div>

      </div>

    </div>


    <div
      class="card"
      style="margin-top:16px"
    >

      <div class="row">

        <b>
          Qisman to‘laganlar
        </b>

        <span class="badge graybg">
          ${partial}
        </span>

      </div>

      <div
        class="sub"
        style="margin-top:7px"
      >
        Bu oy pul bergan,
        lekin to‘liq yopmagan
        o‘quvchilar.
      </div>

    </div>


    <div class="section-title">
      Guruhlar bo‘yicha
    </div>


    <div class="list">

      ${
        Object.entries(byGroup)
          .map(([g,x])=>`

            <div class="card">

              <div class="row">

                <b>${esc(g)}</b>

                <span class="badge graybg">
                  ${x.count} ta
                </span>

              </div>

              <div
                class="sub"
                style="margin-top:8px"
              >

                Tushum:
                <b>${money(x.revenue)}</b>

                ·

                To‘lagan:
                <b>${x.paid}</b>

                ·

                Qarz:
                <b>${money(x.debt)}</b>

              </div>

            </div>

          `)
          .join("")

          ||

          `<div class="empty">
            Ma’lumot yo‘q
          </div>`
      }

    </div>

  `;

}


function changeReportMonth(delta){

  const [y,m]=
    state.month
      .split("-")
      .map(Number);

  const d=
    new Date(
      y,
      m-1+delta,
      1
    );

  state.month=
    monthKey(d);

  render();

}


/* =========================
   SOZLAMALAR
========================= */

function settings(){

  const realToday=
    new Date();

  const defaultDate=
    realToday.getFullYear()
    +"-"
    +String(
      realToday.getMonth()+1
    ).padStart(2,"0")
    +"-"
    +String(
      realToday.getDate()
    ).padStart(2,"0");


  return `

    <div
      class="section-title"
      style="margin-top:0"
    >
      Sozlamalar
    </div>


    <div class="card">

      <b>
        To‘lov tarifi
      </b>

      <div
        class="sub"
        style="margin-top:7px"
      >

        20-sanagacha:
        <b>250 000 so‘m</b>

        <br>

        21-sanadan boshlab:
        <b>280 000 so‘m</b>

      </div>

    </div>


    <div class="section-title">
      🧪 Test rejimi
    </div>


    <div class="card">

      <div class="row">

        <div>

          <b>

            ${
              state.testMode
              ?"Test rejimi YOQILGAN"
              :"Test rejimi o‘chiq"
            }

          </b>

          <div
            class="sub"
            style="margin-top:5px"
          >

            ${
              state.testMode &&
              state.testDate

              ?

              "Test sanasi: "+
              formatTestDate(
                state.testDate
              )

              :

              "Dastur haqiqiy bugungi sanadan foydalanmoqda."

            }

          </div>

        </div>


        <span
          class="badge ${
            state.testMode
            ?"greenbg"
            :"graybg"
          }"
        >

          ${
            state.testMode
            ?"ON"
            :"OFF"
          }

        </span>

      </div>


      <div
        class="field"
        style="margin-top:15px"
      >

        <input
          id="testDate"
          type="date"
          value="${
            state.testDate ||
            defaultDate
          }"
        >

      </div>


      <div class="actions">

        <button
          class="smallbtn"
          onclick="setTestDate('2026-09-19')"
        >
          19-sentabr
        </button>

        <button
          class="smallbtn"
          onclick="setTestDate('2026-09-20')"
        >
          20-sentabr
        </button>

        <button
          class="smallbtn"
          onclick="setTestDate('2026-09-21')"
        >
          21-sentabr
        </button>

      </div>


      <div class="actions">

        <button
          class="save"
          onclick="enableCustomTestDate()"
        >
          🧪 Shu sanani test qilish
        </button>

        <button
          class="cancel"
          onclick="disableTestMode()"
        >
          ↩ Bugungi sana
        </button>

      </div>


      <div
        class="sub"
        style="margin-top:10px"
      >

        Test rejimi faqat sinov uchun.
        Haqiqiy ma’lumotlar o‘chirilmaydi.

      </div>

    </div>


    <div class="section-title">
      Zaxira nusxa
    </div>


    <div class="card">

      <div class="sub">

        Ma’lumotlarni fayl qilib saqlab qo‘ying.
        Telefon almashtirsangiz,
        qayta yuklashingiz mumkin.

      </div>


      <div class="actions">

        <button
          class="smallbtn"
          onclick="backup()"
        >
          ⬇️ Zaxira olish
        </button>

        <button
          class="smallbtn"
          onclick="document.querySelector('#restore').click()"
        >
          ⬆️ Tiklash
        </button>

      </div>


      <input
        id="restore"
        type="file"
        accept="application/json"
        style="display:none"
        onchange="restoreFile(this)"
      >

    </div>


    <div class="section-title">
      Ma’lumotlar
    </div>


    <div class="card">

      <div class="row">

        <div>

          <b>O‘quvchilar</b>

          <div class="sub">
            ${state.students.length} ta
          </div>

        </div>


        <div>

          <b>To‘lovlar</b>

          <div class="sub">
            ${state.payments.length} ta
          </div>

        </div>

      </div>


      <button
        class="smallbtn danger"
        style="margin-top:15px;width:100%"
        onclick="clearAll()"
      >
        Barcha ma’lumotlarni o‘chirish
      </button>

    </div>


    <div
      class="card"
      style="margin-top:12px"
    >

      <b>SMS</b>

      <div
        class="sub"
        style="margin-top:7px"
      >

        Hozircha SMS matni tayyorlanadi.
        Haqiqiy avtomatik SMS uchun
        keyingi bosqichda SMS provayder
        API ulanadi.

      </div>

    </div>

  `;

}


/* =========================
   O‘QUVCHI QO‘SHISH
========================= */

function openAdd(editId=null){

  const s=
    editId
    ?state.students.find(
      x=>x.id===editId
    )
    :null;

  modal(`

    <button
      class="close"
      onclick="closeModal()"
    >
      ×
    </button>

    <h2>
      ${
        s
        ?"O‘quvchini tahrirlash"
        :"Yangi o‘quvchi"
      }
    </h2>


    <div class="field">

      <input
        id="f_name"
        value="${esc(s?.name||"")}"
        placeholder="Ism-familiya *"
      >

    </div>


    <div class="field">

      <input
        id="f_phone"
        value="${esc(s?.phone||"")}"
        placeholder="O‘quvchi telefoni"
        inputmode="tel"
      >

    </div>


    <div class="field">

      <input
        id="f_parent"
        value="${esc(s?.parent||"")}"
        placeholder="Ota-ona ismi"
      >

    </div>


    <div class="field">

      <input
        id="f_parentPhone"
        value="${esc(s?.parentPhone||"")}"
        placeholder="Ota-ona telefoni"
        inputmode="tel"
      >

    </div>


    <div class="field">

      <input
        id="f_group"
        value="${esc(s?.group||"")}"
        placeholder="Guruh"
      >

    </div>


    <div class="field">

      <input
        id="f_subject"
        value="${esc(s?.subject||"")}"
        placeholder="Fan"
      >

    </div>


    <div class="actions">

      <button
        class="cancel"
        onclick="closeModal()"
      >
        Bekor
      </button>

      <button
        class="save"
        onclick="${
          s
          ?`updateStudent('${s.id}')`
          :"addStudent()"
        }"
      >
        Saqlash
      </button>

    </div>

  `);

}


function addStudent(){

  const name=
    $("#f_name").value.trim();

  if(!name){

    alert(
      "Ism-familiyani kiriting"
    );

    return;

  }


  state.students.push({

    id:
      crypto.randomUUID
      ?crypto.randomUUID()
      :Date.now().toString(),

    name,

    phone:
      $("#f_phone").value.trim(),

    parent:
      $("#f_parent").value.trim(),

    parentPhone:
      $("#f_parentPhone").value.trim(),

    group:
      $("#f_group").value.trim(),

    subject:
      $("#f_subject").value.trim()

  });


  save();

  closeModal();

  render();

  toast(
    "O‘quvchi saqlandi"
  );

}


function updateStudent(id){

  const s=
    state.students.find(
      x=>x.id===id
    );

  if(!s)return;


  s.name=
    $("#f_name").value.trim();

  s.phone=
    $("#f_phone").value.trim();

  s.parent=
    $("#f_parent").value.trim();

  s.parentPhone=
    $("#f_parentPhone").value.trim();

  s.group=
    $("#f_group").value.trim();

  s.subject=
    $("#f_subject").value.trim();


  if(!s.name){

    alert(
      "Ism-familiyani kiriting"
    );

    return;

  }


  save();

  closeModal();

  render();

  toast(
    "Ma’lumotlar yangilandi"
  );

}


/* =========================
   PROFIL
========================= */

function openProfile(id){

  const s=
    state.students.find(
      x=>x.id===id
    );

  if(!s)return;


  const d=due(s);

  const hist=
    state.payments
      .filter(p=>p.studentId===id)
      .slice()
      .reverse();


  modal(`

    <button
      class="close"
      onclick="closeModal()"
    >
      ×
    </button>


    <div class="profile-top">

      <div class="avatar">
        ${initials(s.name)}
      </div>

      <div>

        <div class="profile-name">
          ${esc(s.name)}
        </div>

        <div class="sub">

          ${esc(
            s.group||
            "Guruh yo‘q"
          )}

          ${
            s.subject
            ?" · "+esc(s.subject)
            :""
          }

        </div>

      </div>

    </div>


    <div class="payment-box">

      <div class="label">

        ${esc(monthLabel())}
        qarzdorligi

      </div>


      <div
        class="num ${d?"red":"green"}"
        style="font-size:34px"
      >

        ${
          d
          ?money(d)
          :"To‘langan"
        }

      </div>


      <div class="sub">

        Hisoblangan tarif:
        ${money(
          targetForStudent(
            s.id
          )
        )}

      </div>

    </div>


    ${
      s.phone
      ?

      `<div class="detail">
        <b>O‘quvchi telefoni</b>
        ${esc(s.phone)}
      </div>`

      :""
    }


    ${
      s.parent
      ?

      `<div class="detail">
        <b>Ota-ona</b>
        ${esc(s.parent)}
      </div>`

      :""
    }


    ${
      s.parentPhone
      ?

      `<div class="detail">
        <b>Ota-ona telefoni</b>
        ${esc(s.parentPhone)}
      </div>`

      :""
    }


    <div class="actions">

      <button
        class="smallbtn"
        onclick="openPayment('${s.id}')"
      >
        💳 To‘lov qabul qilish
      </button>

      <button
        class="smallbtn"
        onclick="smsDraft('${s.id}')"
      >
        ✉️ SMS
      </button>

    </div>


    <div class="actions">

      <button
        class="smallbtn"
        onclick="openAdd('${s.id}')"
      >
        ✏️ Tahrirlash
      </button>

      <button
        class="smallbtn danger"
        onclick="deleteStudent('${s.id}')"
      >
        🗑 O‘chirish
      </button>

    </div>


    <h3>
      To‘lov tarixi
    </h3>


    ${
      hist.length

      ?

      hist.map(p=>`

        <div class="history-item">

          <span>

            ${esc(p.date)}

            <small>

              ${
                p.month===state.month
                ?" · shu oy"
                :""
              }

            </small>

          </span>

          <b>
            ${money(p.amount)}
          </b>

        </div>

      `).join("")

      :

      `<div class="sub">
        To‘lovlar hali yo‘q.
      </div>`

    }

  `);

}


/* =========================
   TO‘LOV QABUL QILISH
========================= */

function openPayment(id){

  const s=
    state.students.find(
      x=>x.id===id
    );

  const suggest=
    Math.max(
      0,
      due(s)
    );


  modal(`

    <button
      class="close"
      onclick="openProfile('${id}')"
    >
      ×
    </button>


    <h2>
      To‘lov qabul qilish
    </h2>


    <div class="payment-box">

      <div class="label">
        Qolgan summa
      </div>

      <div
        class="num blue"
        style="font-size:34px"
      >
        ${money(suggest)}
      </div>

    </div>


    <div class="field">

      <input
        id="p_amount"
        value="${
          suggest||
          currentTariff()
        }"
        inputmode="numeric"
      >

    </div>


    <div class="field">

      <input
        id="p_note"
        placeholder="Izoh (ixtiyoriy)"
      >

    </div>


    <div class="actions">

      <button
        class="cancel"
        onclick="openProfile('${id}')"
      >
        Bekor
      </button>

      <button
        class="save"
        onclick="addPayment('${id}')"
      >
        To‘lovni saqlash
      </button>

    </div>

  `);

}


function addPayment(id){

  const amount=
    Number(
      $("#p_amount")
        .value
        .replace(/\D/g,"")
    );


  if(!amount){

    alert(
      "Summani kiriting"
    );

    return;

  }


  /*
     TEST REJIMI YOQILGAN BO‘LSA
     shu test sanasi ishlatiladi.
  */

  const now=appNow();


  state.payments.push({

    id:
      crypto.randomUUID
      ?crypto.randomUUID()
      :Date.now().toString(),

    studentId:id,

    amount:amount,

    date:
      now.toLocaleDateString(
        "uz-UZ"
      ),

    paidAt:
      now.toISOString(),

    month:
      monthKey(now),

    note:
      $("#p_note")
        .value
        .trim()

  });


  save();

  closeModal();

  render();

  toast(
    "To‘lov saqlandi"
  );

}


/* =========================
   SMS
========================= */

function smsDraft(id){

  const s=
    state.students.find(
      x=>x.id===id
    );

  const d=due(s);

  const phone=
    s.parentPhone||
    s.phone;


  const text=
    `Assalomu alaykum. ${
      s.name
    }ning ${
      monthLabel()
    } o‘quv to‘lovi bo‘yicha ${
      money(d)
    } qarzdorligi mavjud. To‘lovni amalga oshirishingizni so‘raymiz. Keleshek O‘quv Orayi.`;


  const sms=
    phone
    ?`sms:${phone}?&body=${
      encodeURIComponent(text)
    }`
    :"";


  if(sms){

    location.href=sms;

  }else{

    navigator.clipboard
      ?.writeText(text);

    toast(
      "Telefon raqami yo‘q — SMS matni nusxalandi"
    );

  }

}


/* =========================
   O‘CHIRISH
========================= */

function deleteStudent(id){

  const s=
    state.students.find(
      x=>x.id===id
    );

  if(!s)return;


  if(
    confirm(
      `${s.name}ni o‘chirishni tasdiqlaysizmi? To‘lovlar tarixi ham o‘chiriladi.`
    )
  ){

    state.students=
      state.students.filter(
        x=>x.id!==id
      );

    state.payments=
      state.payments.filter(
        x=>x.studentId!==id
      );


    save();

    closeModal();

    render();

    toast(
      "O‘quvchi o‘chirildi"
    );

  }

}


/* =========================
   BACKUP
========================= */

function backup(){

  const data={
    version:6,
    exportedAt:
      new Date().toISOString(),
    students:
      state.students,
    payments:
      state.payments
  };


  const blob=
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:"application/json"
      }
    );


  const url=
    URL.createObjectURL(blob);

  const a=
    document.createElement("a");

  a.href=url;

  a.download=
    `keleshek-pay-backup-${monthKey()}.json`;

  a.click();

  URL.revokeObjectURL(url);

  toast(
    "Zaxira fayli tayyor"
  );

}


/* =========================
   RESTORE
========================= */

function restoreFile(input){

  const f=
    input.files?.[0];

  if(!f)return;


  const r=
    new FileReader();


  r.onload=()=>{

    try{

      const x=
        JSON.parse(
          r.result
        );


      if(
        !Array.isArray(x.students)||
        !Array.isArray(x.payments)
      ){

        throw new Error();

      }


      if(
        confirm(
          "Mavjud ma’lumotlar o‘rniga zaxiradagi ma’lumotlar yuklansinmi?"
        )
      ){

        state.students=
          x.students;

        state.payments=
          x.payments;

        save();

        render();

        toast(
          "Zaxira tiklandi"
        );

      }

    }catch(e){

      alert(
        "Zaxira fayli noto‘g‘ri yoki buzilgan"
      );

    }

  };


  r.readAsText(f);

  input.value="";

}


/* =========================
   BARCHASINI O‘CHIRISH
========================= */

function clearAll(){

  if(
    confirm(
      "BARCHA o‘quvchilar va to‘lovlar o‘chiriladi. Davom etamizmi?"
    )
  ){

    state.students=[];

    state.payments=[];

    save();

    render();

    toast(
      "Barcha ma’lumotlar o‘chirildi"
    );

  }

}


/* =========================
   MODAL
========================= */

function modal(html){

  const x=
    document.createElement("div");

  x.className="modal-back";

  x.id="modal";

  x.innerHTML=
    `<div class="sheet">
      ${html}
    </div>`;

  document.body.appendChild(x);

}


function closeModal(){

  $("#modal")?.remove();

}


/* =========================
   TOAST
========================= */

function toast(t){

  const x=
    document.createElement("div");

  x.className="toast";

  x.textContent=t;

  document.body.appendChild(x);

  setTimeout(
    ()=>x.remove(),
    2800
  );

}


/* =========================
   START
========================= */

load();

render();
