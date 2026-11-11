import { TIERS, FOUNDING_PARTNER, BENEFIT_LABELS, formatUSD } from "./sponsor.js";

const el = (tag, attrs = {}, html = "") => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.innerHTML = html;
  return node;
};

// Benefit value -> short display text for cards.
const cardText = (key, value) => {
  if (!value) return null;
  const label = BENEFIT_LABELS[key];
  if (value === true) return label;
  return key === "vendor" ? `${label} (${value})` : `${label}: ${value}`;
};

const cards = document.getElementById("tier-cards");
TIERS.forEach((tier, i) => {
  const items = Object.keys(BENEFIT_LABELS).map((key) => {
    const text = cardText(key, tier.benefits[key]);
    return text ? `<li>${text}</li>` : `<li class="no">${BENEFIT_LABELS[key]}</li>`;
  });
  const card = el(
    "article",
    { class: `tier${i === 0 ? " top" : ""}` },
    `<div class="name">${tier.name}</div>
     <div class="price">${formatUSD(tier.price)}</div>
     ${tier.note ? `<div class="perk">${tier.note}</div>` : ""}
     <ul>${items.join("")}</ul>
     <a class="btn small" href="signup.html?tier=${tier.id}">Choose ${tier.name}</a>`,
  );
  cards.append(card);
});

// Comparison table
const table = document.getElementById("compare");
const head = TIERS.map((t) => `<th scope="col">${t.name}<small>${formatUSD(t.price)}</small></th>`).join("");
const rows = Object.entries(BENEFIT_LABELS)
  .map(([key, label]) => {
    const cells = TIERS.map((t) => {
      const v = t.benefits[key];
      if (!v) return `<td class="no" aria-label="Not included">—</td>`;
      if (v === true) return `<td class="yes" aria-label="Included">✔</td>`;
      return `<td>${v}</td>`;
    }).join("");
    return `<tr><th scope="row">${label}</th>${cells}</tr>`;
  })
  .join("");
table.innerHTML = `<thead><tr><th scope="col"><span class="sr-only">Benefit</span></th>${head}</tr></thead><tbody>${rows}</tbody>`;

// Founding partner highlights
document.getElementById("founding-list").innerHTML = FOUNDING_PARTNER.highlights.map((h) => `<li>${h}</li>`).join("");
