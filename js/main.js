/* Hiển thị nội dung từ thư mục content/ (sửa qua trang /admin) — thường không cần sửa file này. */
(async () => {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // "250000" -> "250.000đ"; chữ ("Liên hệ", "Từ 1.500.000đ") giữ nguyên
  const money = (v) => {
    const s = String(v ?? "").trim();
    return /^\d+$/.test(s) ? Number(s).toLocaleString("vi-VN") + "đ" : esc(s);
  };
  const src = (p) => esc(String(p).replace(/^\//, "")); // chạy được cả khi web nằm trong thư mục con
  const ph = (label) => `<div class="ph"><span>${esc(label)}</span></div>`;
  const img = (p, alt) => (p ? `<img src="${src(p)}" alt="${esc(alt)}" loading="lazy">` : ph(alt));

  // Ảnh lỗi đường dẫn -> thay bằng ô màu tạm
  document.addEventListener("error", (e) => {
    const el = e.target;
    if (el.tagName === "IMG") el.outerHTML = ph(el.alt);
  }, true);

  /* ---------- Tải nội dung ---------- */
  const names = ["settings", "home", "services", "courses", "nailbox", "gallery", "feedback"];
  let settings, home, services, courses, nailbox, gallery, feedback;
  try {
    [settings, home, services, courses, nailbox, gallery, feedback] = await Promise.all(
      names.map((n) => fetch(`content/${n}.json`, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(n);
        return r.json();
      })));
  } catch (err) {
    document.body.insertAdjacentHTML("afterbegin",
      `<p style="padding:16px;background:#fee;color:#900;text-align:center">Không tải được nội dung (${esc(err.message)}). ` +
      `Nếu đang mở file trực tiếp trên máy, hãy chạy: <code>python3 -m http.server</code> rồi vào http://localhost:8000</p>`);
    return;
  }

  const { brand, contact, theme = {}, sections = [] } = settings;
  const { hero, about } = home;
  const zaloUrl = `https://zalo.me/${String(contact.zalo).replace(/\D/g, "")}`;

  /* ---------- Màu sắc ---------- */
  const root = document.documentElement.style;
  if (theme.primary) root.setProperty("--rose", theme.primary);
  if (theme.background) root.setProperty("--bg", theme.background);

  /* ---------- Bố cục: thứ tự, ẩn/hiện, tiêu đề các mục ---------- */
  const main = $("main");
  const navLinks = [];
  let tint = false;
  sections.forEach((s) => {
    const el = $(`[data-section="${s.id}"]`);
    if (!el) return;
    main.appendChild(el); // xếp lại theo thứ tự trong cài đặt
    el.hidden = !s.visible;
    el.querySelector("[data-eyebrow]").textContent = s.eyebrow || "";
    el.querySelector("[data-title]").textContent = s.title || "";
    if (!s.visible) return;
    if (s.id !== "about") el.classList.toggle("section--tint", (tint = !tint));
    navLinks.push(`<a href="#${el.id}">${esc(s.title)}</a>`);
  });
  $("#nav").innerHTML = navLinks.join("");

  /* ---------- Chung ---------- */
  document.title = `${brand.name} — ${brand.tagline}`;
  $("#logo").innerHTML = brand.logo ? `<img src="${src(brand.logo)}" alt="${esc(brand.name)}">` : esc(brand.name);
  $("#footerBrand").textContent = brand.name;
  $("#year").textContent = new Date().getFullYear();
  document.querySelectorAll("[data-zalo]").forEach((a) => (a.href = zaloUrl));
  document.querySelectorAll("[data-phone]").forEach((a) => (a.href = `tel:${contact.phone}`));

  /* ---------- Hero & About ---------- */
  $("#heroTagline").textContent = brand.tagline;
  $("#heroTitle").textContent = hero.title;
  $("#heroSubtitle").textContent = hero.subtitle;
  $("#heroImage").innerHTML = img(hero.image, "Ảnh nổi bật");
  $("#heroStats").innerHTML = (hero.stats || [])
    .map((s) => `<li><strong>${esc(s.number)}</strong><span>${esc(s.label)}</span></li>`).join("");

  $("#aboutText").textContent = about.text;
  $("#aboutImage").innerHTML = img(about.image, "Ảnh giới thiệu");
  $("#aboutHighlights").innerHTML = (about.highlights || []).map((h) => `<li>${esc(h)}</li>`).join("");

  /* ---------- Bảng giá ---------- */
  const groups = services.groups || [];
  const renderServices = (i) => {
    $("#serviceTabs").querySelectorAll(".tab").forEach((t, j) => t.classList.toggle("is-active", i === j));
    $("#serviceList").innerHTML = (groups[i]?.items || []).map((s) => `
      <div class="price-row">
        <span class="price-row__name">${esc(s.name)}${s.note ? `<span class="price-row__note">${esc(s.note)}</span>` : ""}</span>
        <span class="price-row__dots"></span>
        <span class="price-row__price">${money(s.price)}</span>
      </div>`).join("");
  };
  $("#serviceTabs").innerHTML = groups
    .map((g, i) => `<button class="tab" data-i="${i}">${esc(g.category)}</button>`).join("");
  $("#serviceTabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (t) renderServices(+t.dataset.i);
  });
  renderServices(0);

  /* ---------- Khoá học ---------- */
  const courseItems = courses.items || [];
  $("#courseList").innerHTML = courseItems.map((c, i) => `
    <article class="card">
      <div class="card__media">${c.level ? `<span class="badge">${esc(c.level)}</span>` : ""}${img(c.image, c.title)}</div>
      <div class="card__body">
        <p class="card__meta">${esc(c.duration)}</p>
        <h3>${esc(c.title)}</h3>
        <p class="card__desc">${esc(c.description)}</p>
        <ul class="checklist">${(c.highlights || []).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        <div class="card__foot">
          <div class="price">${money(c.price)}${c.oldPrice ? `<del>${money(c.oldPrice)}</del>` : ""}</div>
          <button class="btn btn--block" data-order="course" data-i="${i}">Đăng ký học</button>
        </div>
      </div>
    </article>`).join("");

  /* ---------- Bộ lọc dùng chung ---------- */
  const setupFilter = (filterEl, items, render) => {
    const cats = ["Tất cả", ...new Set(items.map((x) => x.category).filter(Boolean))];
    filterEl.innerHTML = cats.map((c, i) =>
      `<button class="chip${i === 0 ? " is-active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    filterEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      filterEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      render(chip.dataset.cat === "Tất cả" ? null : chip.dataset.cat);
    });
    render(null);
  };

  /* ---------- Nailbox ---------- */
  const products = nailbox.items || [];
  $("#nailboxNote").textContent = nailbox.note || "";
  setupFilter($("#nailboxFilter"), products, (cat) => {
    $("#nailboxList").innerHTML = products
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !cat || p.category === cat)
      .map(({ p, i }) => `
        <article class="card product">
          <div class="card__media">${p.tag ? `<span class="badge">${esc(p.tag)}</span>` : ""}${img(p.image, p.name)}</div>
          <div class="card__body">
            <p class="card__meta">${esc(p.code)}</p>
            <h3>${esc(p.name)}</h3>
            <div class="price">${money(p.price)}${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
            <div class="card__foot"><button class="btn btn--sm btn--block" data-order="nailbox" data-i="${i}">Đặt mua</button></div>
          </div>
        </article>`).join("");
  });

  /* ---------- Album + lightbox ---------- */
  const photos = gallery.items || [];
  let shown = [];
  let current = 0;
  setupFilter($("#galleryFilter"), photos, (cat) => {
    shown = photos.filter((g) => !cat || g.category === cat);
    $("#galleryList").innerHTML = shown.map((g, i) => `
      <button class="gallery__item" data-i="${i}">
        ${img(g.image, g.caption || g.category)}
        ${g.caption ? `<span class="gallery__cap">${esc(g.caption)}</span>` : ""}
      </button>`).join("");
  });

  const lb = $("#lightbox");
  const showLb = (i) => {
    current = (i + shown.length) % shown.length;
    const g = shown[current];
    $("#lbImg").innerHTML = g.image ? `<img src="${src(g.image)}" alt="${esc(g.caption)}">` : ph(g.caption || g.category);
    $("#lbCaption").textContent = g.caption || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; };
  $("#galleryList").addEventListener("click", (e) => {
    const item = e.target.closest(".gallery__item");
    if (item) showLb(+item.dataset.i);
  });
  lb.addEventListener("click", (e) => {
    const act = e.target.dataset.lb;
    if (act === "prev") showLb(current - 1);
    else if (act === "next") showLb(current + 1);
    else if (act === "close" || e.target === lb) closeLb();
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(current - 1);
    if (e.key === "ArrowRight") showLb(current + 1);
  });

  /* ---------- Feedback ---------- */
  $("#feedbackList").innerHTML = (feedback.items || []).map((f) => `
    <article class="card review">
      <div class="stars">${"★".repeat(f.rating || 5)}</div>
      ${f.image ? `<div class="review__shot">${img(f.image, "Feedback của " + f.name)}</div>` : ""}
      ${f.content ? `<p class="review__text">“${esc(f.content)}”</p>` : ""}
      <div class="review__author">
        <span class="avatar">${esc((f.name || "?").trim().split(/\s+/).pop()[0])}</span>
        <div><strong>${esc(f.name)}</strong><small>${esc(f.service)}</small></div>
      </div>
    </article>`).join("");

  /* ---------- Liên hệ ---------- */
  const rows = [
    ["Điện thoại", `<a href="tel:${esc(contact.phone)}">${esc(contact.phone)}</a>`],
    ["Zalo", `<a href="${zaloUrl}" target="_blank" rel="noopener">${esc(contact.zalo)}</a>`],
    ["Địa chỉ", esc(contact.address)],
    ["Giờ mở cửa", esc(contact.hours)],
  ];
  $("#contactList").innerHTML = rows.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join("");
  $("#socials").innerHTML = [
    ["Facebook", contact.facebook], ["Messenger", contact.messenger],
    ["Instagram", contact.instagram], ["TikTok", contact.tiktok],
  ].filter(([, url]) => url)
    .map(([name, url]) => `<a class="btn btn--ghost btn--sm" href="${esc(url)}" target="_blank" rel="noopener">${name}</a>`).join("");
  $("#contactMap").innerHTML = contact.mapEmbed
    ? `<iframe src="${esc(contact.mapEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bản đồ"></iframe>`
    : ph("Bản đồ Google Maps");

  /* ---------- Đặt hàng / đăng ký: copy nội dung + mở Zalo ---------- */
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("is-show"), 3500);
  };
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-order]");
    if (!btn) return;
    const i = +btn.dataset.i;
    const msg = btn.dataset.order === "course"
      ? `Chào ${brand.name}, mình muốn đăng ký khoá học "${courseItems[i].title}". Tư vấn giúp mình nhé!`
      : `Chào ${brand.name}, mình muốn đặt nailbox ${products[i].code} - ${products[i].name}.`;
    try {
      await navigator.clipboard.writeText(msg);
      toast("Đã copy nội dung — dán vào Zalo để gửi nhé!");
    } catch {
      toast("Đang mở Zalo...");
    }
    window.open(zaloUrl, "_blank", "noopener");
  });

  /* ---------- Menu mobile ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open");
  });
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { nav.classList.remove("is-open"); toggle.classList.remove("is-open"); }
  });
})();
