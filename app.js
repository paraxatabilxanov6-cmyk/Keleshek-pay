const KEY = "keleshek_pay_students_v2";

let students = [];
try {
  students = JSON.parse(localStorage.getItem(KEY) || "[]");
  if (!Array.isArray(students)) students = [];
} catch (e) {
  students = [];
}

let currentPage = "home";

function save() {
  localStorage.setItem(KEY, JSON.stringify(students));
}

function monthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function monthTitle() {
  return new Intl.DateTimeFormat("uz-UZ", {
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function currentPrice() {
  return new Date().getDate() <= 20 ? 250000 : 280000;
}

function money(n) {
  return new Intl.NumberFormat("uz-UZ").format(Number(n) || 0) + " so'm";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c];
  });
}

function isPaid(student) {
  return Array.isArray(student.payments) &&
    student.payments.some(p => p.month === monthKey());
}

function initials(name) {
  return escapeHtml(
    String(name || "")
      .trim()
      .split(/\s+/)
      .map(x => x[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase()
  );
}

function go(pageName) {
  currentPage = pageName;
  render();
}

function statCard(label, value, cls) {
  return `
    <div class="card">
      <div class="label">${label}</div>
      <div class="value ${cls || ""}">${value}</div>
    </div>`;
}

function studentRow(student) {
  return `
    <div class="row" onclick="openProfile('${student.id}')">
      <div class="avatar">${initials(student.name)}</div>
      <div class="grow">
        <div class="name">${escapeHtml(student.name)}</div>
        <div class="small">${escapeHtml(student.group || "Guruh kiritilmagan")}</div>
      </div>
      <span class="badge ${isPaid(student) ? "paid" : "debt"}">
        ${isPaid(student) ? "To'langan" : money(currentPrice())}
      </span>
    </div>`;
}

function homePage() {
  const paidCount = students.filter(isPaid).length;
  const debtCount = students.length - paidCount;

  const income = students.reduce((total, s) => {
    if (!Array.isArray(s.payments)) return total;
    return total + s.payments
      .filter(p => p.month === monthKey())
      .reduce((a, p) => a + Number(p.amount || 0), 0);
  }, 0);

  const debtors = students.filter(s => !isPaid(s)).slice(0, 10);

  return `
    <div class="grid">
      ${statCard("O'quvchilar", students.length, "blue")}
      ${statCard("To'laganlar", paidCount, "green")}
      ${statCard("Qarzdorlar", debtCount, "red")}
      ${statCard("Tushum", money(income), "blue")}
    </div>

    <div class="box">
      <div class="label">Bugungi tarif</div>
      <div class="value">${money(currentPrice())}</div>
      <div class="small">
        ${new Date().getDate() <= 20
          ? "20-sanagacha to'lov"
          : "21-sanadan boshlab to'lov"}
      </div>
    </div>

    <div class="title">Tezkor amal</div>
    <button class="btn" onclick="addStudent()">ï¼ O'quvchi qo'shish</button>

    <div class="title">Qarzdorlar</div>
    <div class="box">
      ${debtors.length
        ? debtors.map(studentRow).join("")
        : `<div class="empty">Hozircha qarzdorlar yo'q ð</div>`}
    </div>`;
}

function studentsPage() {
  return `
    <input
      class="search"
      id="studentSearch"
      placeholder="O'quvchi yoki guruh qidirish..."
      oninput="filterStudents(this.value)"
    >
    <button class="btn secondary" onclick="addStudent()">ï¼ Yangi o'quvchi</button>

    <div class="box" id="studentList">
      ${students.length
        ? students.map(studentRow).join("")
        : `<div class="empty">Hozircha o'quvchilar yo'q</div>`}
    </div>`;
}

function filterStudents(q) {
  const query = String(q || "").toLowerCase();
  const list = students.filter(s =>
    (String(s.name || "") + " " + String(s.group || ""))
      .toLowerCase()
      .includes(query)
  );

  const el = document.getElementById("studentList");
  if (el) {
    el.innerHTML = list.length
      ? list.map(studentRow).join("")
      : `<div class="empty">Topilmadi</div>`;
  }
}

function paymentsPage() {
  const paidStudents = students.filter(isPaid);

  const income = paidStudents.reduce((total, s) => {
    const ps = Array.isArray(s.payments) ? s.payments : [];
    return total + ps
      .filter(p => p.month === monthKey())
      .reduce((a, p) => a + Number(p.amount || 0), 0);
  }, 0);

  return `
    <div class="box">
      <div class="label">${escapeHtml(monthTitle())} tushumi</div>
      <div class="money">${money(income)}</div>
      <div class="small">${paidStudents.length} ta o'quvchi</div>
    </div>

    <div class="title">To'lov qilganlar</div>
    <div class="box">
      ${paidStudents.length
        ? paidStudents.map(studentRow).join("")
        : `<div class="empty">Bu oyda to'lovlar yo'q</div>`}
    </div>`;
}

function settingsPage() {
  return `
    <div class="title">To'lov qoidasi</div>
    <div class="box">
      <div class="row">
        <div class="grow">1â20-sana</div>
        <b>250 000 so'm</b>
      </div>
      <div class="row">
        <div class="grow">21-sanadan</div>
        <b>280 000 so'm</b>
      </div>
    </div>

    <div class="title">Ma'lumotlar</div>
    <button class="btn danger" onclick="clearAll()">
      Barcha ma'lumotlarni o'chirish
    </button>`;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (currentPage === "home") app.innerHTML = homePage();
  else if (currentPage === "students") app.innerHTML = studentsPage();
  else if (currentPage === "payments") app.innerHTML = paymentsPage();
  else app.innerHTML = settingsPage();

  const monthEl = document.getElementById("month");
  if (monthEl) monthEl.textContent = monthTitle();
}

function showModal(html) {
  closeModal();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "modal";
  modal.innerHTML = `<div class="sheet">${html}</div>`;
  document.body.appendChild(modal);
}

function closeModal() {
  const old = document.getElementById("modal");
  if (old) old.remove();
}

function addStudent() {
  showModal(`
    <h2>Yangi o'quvchi</h2>

    <input id="studentName" placeholder="Ism-familiya *">
    <input id="studentPhone" placeholder="O'quvchi telefoni" type="tel">
    <input id="parentName" placeholder="Ota-ona ismi">
    <input id="parentPhone" placeholder="Ota-ona telefoni" type="tel">
    <input id="studentGroup" placeholder="Guruh">

    <div class="actions">
      <button class="btn close" onclick="closeModal()">Bekor</button>
      <button class="btn" onclick="createStudent()">Saqlash</button>
    </div>
  `);
}

function createStudent() {
  const name = document.getElementById("studentName").value.trim();

  if (!name) {
    alert("Ism-familiyani kiriting.");
    return;
  }

  const student = {
    id: Date.now().toString(),
    name: name,
    phone: document.getElementById("studentPhone").value.trim(),
    parent: document.getElementById("parentName").value.trim(),
    parentPhone: document.getElementById("parentPhone").value.trim(),
    group: document.getElementById("studentGroup").value.trim(),
    payments: []
  };

  students.push(student);
  save();
  closeModal();
  render();
}

function openProfile(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;

  const history = (Array.isArray(s.payments) ? s.payments : [])
    .slice()
    .reverse()
    .map(p => `
      <div class="row">
        <div class="grow">
          <b>${escapeHtml(p.month)}</b>
          <div class="small">${escapeHtml(p.method || "")}</div>
        </div>
        <b>${money(p.amount)}</b>
      </div>`)
    .join("");

  showModal(`
    <h2>${escapeHtml(s.name)}</h2>

    <div class="box">
      ð ${escapeHtml(s.phone || "Kiritilmagan")}<br><br>
      ð¨âð©âð¦ ${escapeHtml(s.parent || "Kiritilmagan")}<br><br>
      ð ${escapeHtml(s.parentPhone || "Kiritilmagan")}<br><br>
      ð¥ ${escapeHtml(s.group || "Kiritilmagan")}
    </div>

    <div class="box">
      <div class="${isPaid(s) ? "green" : "red"}">
        <b>${isPaid(s) ? "â To'langan" : "Qarzdor"}</b>
      </div>

      ${!isPaid(s)
        ? `<div class="money">${money(currentPrice())}</div>
           <button class="btn" onclick="takePayment('${s.id}')">
             ð³ To'lov qabul qilish
           </button>`
        : ""}
    </div>

    <div class="title">To'lov tarixi</div>
    <div class="box">
      ${history || `<div class="empty">Tarix yo'q</div>`}
    </div>

    <button class="btn close" onclick="closeModal()">Yopish</button>
  `);
}

function takePayment(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;

  showModal(`
    <h2>To'lov qabul qilish</h2>

    <div class="box">
      <b>${escapeHtml(s.name)}</b>
      <div class="money">${money(currentPrice())}</div>
      <div class="small">${escapeHtml(monthTitle())}</div>
    </div>

    <select id="paymentMethod">
      <option>Naqd</option>
      <option>Click</option>
      <option>Payme</option>
      <option>Bank</option>
      <option>Boshqa</option>
    </select>

    <div class="actions">
      <button class="btn close" onclick="closeModal()">Bekor</button>
      <button class="btn" onclick="confirmPayment('${s.id}')">
        Tasdiqlash
      </button>
    </div>
  `);
}

function confirmPayment(id) {
  const s = students.find(x => x.id === id);
  if (!s) return;

  if (!Array.isArray(s.payments)) s.payments = [];

  s.payments.push({
    id: Date.now().toString(),
    month: monthKey(),
    amount: currentPrice(),
    method: document.getElementById("paymentMethod").value,
    date: new Date().toISOString()
  });

  save();
  closeModal();
  render();
}

function clearAll() {
  if (!confirm("Barcha o'quvchi va to'lov ma'lumotlari o'chiriladi. Davom etilsinmi?")) {
    return;
  }

  students = [];
  save();
  render();
}

document.addEventListener("DOMContentLoaded", render);
