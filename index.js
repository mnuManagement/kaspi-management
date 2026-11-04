const data = {
    2016: { m: [17.8, 137.3, 1.1, 74.6], t: "Marketplace & m-Commerce", x: "m-Commerce launched. Top 3 electronics retailers joined the platform.", s: [[15, "%", "Retail cashless share"], [3, "", "Top electronics retailers"]] },
    2017: { m: [18.0, 166.8, 4.1, 76.4], t: "Super-App Birth", x: "Kaspi.kz super-app, P2P payments, and Kaspi Juma introduced.", s: [] },
    2018: { m: [18.3, 179.3, 4.1, 78.9], t: "Trust Beyond Finance", x: "Kaspi ID biometrics launched. Government tax & utility payments integrated.", s: [] },
    2019: { m: [18.5, 181.7, 4.5, 81.9], t: "QR & International Step", x: "Kaspi QR, Kartomat, and POS rollout. Marketplaces acquired in Azerbaijan.", s: [[2, "M", "Users on acquired platforms"]] },
    2020: { m: [18.8, 169.8, -2.6, null], t: "London IPO & Gov-Tech", x: "LSE listing at $6.5B valuation. Kaspi Travel and gov services launched.", s: [[60, "%", "Population in super-app"], [22, "k", "Merchants on marketplace"]] },
    2021: { m: [18.9, 182, null, null], t: "Scale & Regional Vision", x: "10M unique customers. Net profit trending toward ~$1B.", s: [[10, "M", "Unique customers"], [80, "%", "Retail cashless transactions"]] }
};

const rows = [["Total Population (millions)", 1, ""], ["GDP (Billion $)", 1, ""], ["GDP Growth (annual %)", 1, "%"], ["Internet Users (%)", 1, "%"]];
let cur = 2020;
const sex = {2016:[51.6,48.4],2017:[51.5,48.5],2018:[51.5,48.5],2019:[51.5,48.5],2020:[51.5,48.5]}; // Exhibit 2, women/men %
const sexInfo = y => { const g = sex[y], p = data[y].m[0]; return g ? { f: g[0], m: g[1], fm: (p*g[0]/100).toFixed(2), mm: (p*g[1]/100).toFixed(2) } : null; };
function renderGender() {
  const s = sexInfo(cur);
  $("#gf").innerHTML = s ? `${s.fm}M <small>${s.f}%</small>` : "n.a.";
  $("#gm").innerHTML = s ? `${s.mm}M <small>${s.m}%</small>` : "n.a.";
  $("#gbi").style.width = (s ? s.f : 50) + "%";
  $("#gnote").textContent = s ? "" : "Sex split for 2021 is not given in the case.";
}
const $ = s => document.querySelector(s);
const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmt = (v, d, s) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(d) + s;

function count(el, to, d, s) {
    d = d || 0; s = s || "";
    if (RM) { el.textContent = fmt(to, d, s); return; }
    const t0 = performance.now();
    (function f(t) {
        const p = Math.min(1, (t - t0) / 800), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, d, s);
        if (p < 1) requestAnimationFrame(f);
    })(t0);
}

const tabs = $("#tabs");
Object.keys(data).forEach(y => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab");
    b.textContent = y;
    b.dataset.y = y;
    b.setAttribute("aria-selected", y == cur);
    b.onclick = () => setYear(+y);
    tabs.appendChild(b);
});

function render() {
    const d = data[cur];
    $("#yr").textContent = cur;
    $("#ktitle").textContent = d.t;
    $("#ktext").textContent = d.x;
    $("#mt").innerHTML = rows.map((r, i) => `<tr><td>${r[0]}</td><td class="v" data-m="${i}">${d.m[i] == null ? "n.a." : fmt(d.m[i], r[1], r[2])}</td></tr>`).join("");
    rows.forEach((r, i) => { if (d.m[i] != null) count($(`[data-m="${i}"]`), d.m[i], r[1], r[2]); });
    $("#kstats").innerHTML = d.s.map((s, i) => `<div class="f" style="padding:16px"><div class="n" data-ks="${i}" style="font-size:26px">${s[0]}${s[1]}</div><div class="cap">${s[2]}</div></div>`).join("");
    d.s.forEach((s, i) => count($(`[data-ks="${i}"]`), s[0], 0, s[1] ? " " + s[1] : ""));
    renderGender();
    if (gdpChart) {
        gdpChart.data.datasets[0].backgroundColor = Object.keys(data).map(y => y == cur ? "#F14635" : css("--line"));
        gdpChart.update();
    }
}

function setYear(y) {
    if (y === cur) return;
    cur = y;
    tabs.querySelectorAll("[role=tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.y == y));
    const sw = document.querySelectorAll(".sw");
    sw.forEach(e => e.classList.add("out"));
    setTimeout(() => { render(); sw.forEach(e => e.classList.remove("out")); }, RM ? 0 : 200);
}

function switchTab(idx) {
    document.querySelectorAll('.pill-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
    document.querySelectorAll('.tab-pane').forEach((p, i) => p.classList.toggle('active', i === idx));
}

let gdpChart = null;
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: css("--line") }, border: { display: false } } } };
const legOpts = { ...baseOpts, plugins: { legend: { display: true, position: "bottom" } } };

const gdpOpts = {
    ...baseOpts,
    interaction: { mode: "index", intersect: false },
    onClick: (e, els) => { if (els.length) setYear(+Object.keys(data)[els[0].index]); },
    onHover: (e, els) => { e.native.target.style.cursor = els.length ? "pointer" : "default"; },
    animation: { duration: RM ? 0 : 400 },
    plugins: { legend: { display: false }, tooltip: { displayColors: false, padding: 12, callbacks: {
        label: c => "GDP: $" + c.parsed.y + "B",
        afterLabel: c => { const s = sexInfo(Object.keys(data)[c.dataIndex]); return s ? [`Women: ${s.fm}M (${s.f}%)`, `Men: ${s.mm}M (${s.m}%)`] : "Sex split: n.a."; }
    } } }
};

window.addEventListener('DOMContentLoaded', () => {
    const yrs = Object.keys(data);

    gdpChart = new Chart($("#cGdp"), {
        type: "bar",
        data: { labels: yrs, datasets: [{ data: yrs.map(y => data[y].m[1]), borderRadius: 4, backgroundColor: yrs.map(y => y == cur ? "#F14635" : css("--line")) }] },
        options: gdpOpts
    });

    new Chart($("#cApp"), {
        type: "bar",
        data: { labels: ["2Q’20", "3Q’20", "4Q’20", "1Q’21", "2Q’21"], datasets: [{ label: "MAU", data: [7.8, 8.5, 9.1, 10.0, 10.2], backgroundColor: "#F14635", borderRadius: 4 }, { label: "DAU", data: [3.6, 4.3, 4.9, 5.4, 6.0], backgroundColor: css("--ink"), borderRadius: 4 }] },
        options: legOpts
    });

    new Chart($("#cFin"), {
        type: "bar",
        data: { labels: ["2Q’20", "2Q’21", "6M’20", "6M’21"], datasets: [{ label: "Revenue", data: [139, 214, 299, 397], backgroundColor: "#F14635", borderRadius: 4 }, { label: "Net Income", data: [53, 102, 116, 181], backgroundColor: css("--ink"), borderRadius: 4 }] },
        options: legOpts
    });

    render();
});
