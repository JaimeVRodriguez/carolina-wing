import {
  TIERS,
  FOUNDING_PARTNER,
  getTier,
  formatUSD,
  installmentSchedule,
  validateSponsor,
  validateCard,
} from "./sponsor.js";

const $ = (id) => document.getElementById(id);
const state = { step: 1, sponsor: { tierId: "", business: "", contact: "", email: "", phone: "", notes: "", logoName: "" } };

// ---------- helpers ----------
function showErrors(errors, fields) {
  fields.forEach((f) => {
    const msg = errors[f] ?? "";
    const err = $(`err-${f}`);
    if (err) err.textContent = msg;
    const input = $(f === "name" ? "cardName" : f === "number" ? "cardNumber" : f);
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  });
  const first = fields.find((f) => errors[f]);
  if (first) ($(first === "name" ? "cardName" : first === "number" ? "cardNumber" : first) ?? $("tier-pick").querySelector("input"))?.focus();
}

function goTo(step) {
  state.step = step;
  document.querySelectorAll(".step").forEach((s) => (s.hidden = s.id !== `step${step}`));
  document.querySelectorAll("#steps li").forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle("active", n === step);
    li.classList.toggle("done", n < step);
    li.setAttribute("aria-current", n === step ? "step" : "false");
  });
  renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderSummary() {
  const tier = getTier(state.sponsor.tierId);
  $("sum-level").textContent = tier ? `${tier.name} — ${formatUSD(tier.price)}` : "Not selected";
  $("sum-business").textContent = state.sponsor.business.trim() || "—";
  const schedule = tier ? installmentSchedule(tier) : [];
  $("sum-total").textContent = formatUSD(schedule[0] ?? 0);
  const multi = schedule.length > 1;
  $("sum-sched-wrap").hidden = !multi;
  $("sum-sched").replaceChildren(
    ...schedule.map((amt, i) => {
      const li = document.createElement("li");
      li.textContent = `Payment ${i + 1}: ${formatUSD(amt)}`;
      return li;
    }),
  );
  if (tier) {
    $("pay-btn").textContent = `Pay ${formatUSD(schedule[0])}`;
    $("pay-note").textContent = multi
      ? `Today's payment is ${formatUSD(schedule[0])} (1 of ${schedule.length}). Remaining installments are invoiced before each event.`
      : "";
  }
}

// ---------- step 1: tier ----------
const pick = $("tier-pick");
[...TIERS, FOUNDING_PARTNER].forEach((t) => {
  const label = document.createElement("label");
  const input = Object.assign(document.createElement("input"), { type: "radio", name: "tierId", value: t.id });
  const box = document.createElement("span");
  box.className = "opt";
  const name = document.createElement("b");
  name.textContent = t.id === "founding" ? "Founding Partner" : t.name;
  const price = document.createElement("span");
  price.textContent = formatUSD(t.price);
  const small = document.createElement("small");
  small.textContent = t.id === "founding" ? "2 years · 4 events · 4 installments" : "";
  box.append(name, price, small);
  label.append(input, box);
  pick.append(label);
  input.addEventListener("change", () => {
    state.sponsor.tierId = t.id;
    $("err-tierId").textContent = "";
    renderSummary();
  });
});

const preselected = new URLSearchParams(location.search).get("tier");
if (preselected && getTier(preselected)) {
  state.sponsor.tierId = preselected;
  pick.querySelector(`input[value="${preselected}"]`).checked = true;
}

$("step1").addEventListener("submit", (e) => {
  e.preventDefault();
  const errors = validateSponsor({ ...state.sponsor, business: "x", contact: "x", email: "x@x.x" });
  $("err-tierId").textContent = errors.tierId ?? "";
  if (!errors.tierId) goTo(2);
});

// ---------- step 2: business ----------
$("business").addEventListener("input", (e) => {
  state.sponsor.business = e.target.value;
  renderSummary();
});

$("step2").addEventListener("submit", (e) => {
  e.preventDefault();
  Object.assign(state.sponsor, {
    business: $("business").value,
    contact: $("contact").value,
    email: $("email").value,
    phone: $("phone").value,
    notes: $("notes").value,
    logoName: $("logo").files[0]?.name ?? "",
  });
  const errors = validateSponsor(state.sponsor);
  showErrors(errors, ["business", "contact", "email", "phone"]);
  if (!Object.keys(errors).length) goTo(3);
});

// ---------- step 3: mock payment ----------
$("cardNumber").addEventListener("input", (e) => {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
  e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});
$("expiry").addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
});

$("step3").addEventListener("submit", (e) => {
  e.preventDefault();
  const card = { name: $("cardName").value, number: $("cardNumber").value, expiry: $("expiry").value, cvc: $("cvc").value };
  const errors = validateCard(card);
  showErrors(errors, ["name", "number", "expiry", "cvc"]);
  if (Object.keys(errors).length) return;

  const tier = getTier(state.sponsor.tierId);
  const reference = `CWC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  // Deliberately do NOT store card details; only the sponsor record.
  const record = { reference, ...state.sponsor, tier: tier.name, amountPaid: installmentSchedule(tier)[0], createdAt: new Date().toISOString() };
  try {
    const all = JSON.parse(localStorage.getItem("cwc-sponsors") ?? "[]");
    localStorage.setItem("cwc-sponsors", JSON.stringify([...all, record]));
  } catch {
    // Storage unavailable (private mode etc.) — confirmation still works.
  }
  renderReceipt(record, tier);
  goTo(4);
});

function renderReceipt(record, tier) {
  const rows = [
    ["Reference", record.reference],
    ["Level", `${tier.name} (${formatUSD(tier.price)})`],
    ["Paid today", formatUSD(record.amountPaid)],
    ["Business", record.business],
    ["Contact", `${record.contact} · ${record.email}`],
  ];
  if (record.logoName) rows.push(["Logo", record.logoName]);
  $("receipt").replaceChildren(
    ...rows.flatMap(([k, v]) => {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      return [dt, dd];
    }),
  );
}

// ---------- navigation ----------
document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => goTo(state.step - 1)));
$("restart").addEventListener("click", () => location.assign("signup.html"));

goTo(1);
