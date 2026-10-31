/* Vẽ toàn bộ trang từ dữ liệu content/*.json.
   Dùng chung cho trang thật (js/main.js) và bản xem trước trong trang quản trị (admin/preview.js). */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // "250000" -> "250.000đ"; chữ ("Liên hệ", "Từ 1.500.000đ") giữ nguyên
  const money = (v) => {
    const s = String(v ?? "").trim();
    return /^\d+$/.test(s) ? Number(s).toLocaleString("vi-VN") + "đ" : esc(s);
  };
  const ph = (label) => `<div class="ph"><span>${esc(label)}</span></div>`;
  const list = (v) => (Array.isArray(v) ? v : []);
  const zaloUrl = (c) => `https://zalo.me/${String(c.zalo || "").replace(/\D/g, "")}`;

  const SECTIONS = ["about", "services", "courses", "nailbox", "gallery", "feedback", "contact"];
  const ANCHOR = { about: "gioi-thieu", services: "dich-vu", courses: "khoa-hoc", nailbox: "nailbox", gallery: "album", feedback: "feedback", contact: "lien-he" };

  // Thứ tự + ẩn/hiện các phần theo layout.json (phần nào thiếu thì thêm vào cuối)
  const sectionOrder = (layout) => {
    const ids = list(layout && layout.order).map((o) => (o && typeof o === "object" ? o.id : o));
    const order = [...new Set(ids.filter((id) => SECTIONS.includes(id)))];
    SECTIONS.forEach((id) => order.includes(id) || order.push(id));
    const visible = (layout && layout.visible) || {};
    return order.map((id) => ({ id, visible: visible[id] !== false }));
  };

  const filterCats = (items) => ["Tất cả", ...new Set(items.map((x) => x.category).filter(Boolean))];

  /* ---------- Các phần có thể vẽ lại riêng khi bấm tab / bộ lọc ---------- */
  // Tab đang chọn; quay về tab đầu nếu nhóm đó vừa bị xoá
  const activeTab = (d, st) => (st.tab < list(d.services.groups).length ? st.tab : 0);

  const parts = {
    serviceTabs(d, st) {
      return list(d.services.groups).map((g, i) =>
        `<button class="tab${i === activeTab(d, st) ? " is-active" : ""}" data-tab="${i}" data-path="groups.${i}">${esc(g.category)}</button>`).join("");
    },
    serviceList(d, st) {
      const t = activeTab(d, st);
      const g = list(d.services.groups)[t];
      return list(g && g.items).map((s, i) => `
        <div class="price-row" data-path="groups.${t}.items.${i}">
          <span class="price-row__name">${esc(s.name)}${s.note ? `<span class="price-row__note">${esc(s.note)}</span>` : ""}</span>
          <span class="price-row__dots"></span>
          <span class="price-row__price">${money(s.price)}</span>
        </div>`).join("");
    },
    chips(items, active, kind) {
      return filterCats(items).map((c) =>
        `<button class="chip${(active || "Tất cả") === c ? " is-active" : ""}" data-${kind}="${esc(c)}">${esc(c)}</button>`).join("");
    },
    nailboxGrid(d, st, img) {
      return list(d.nailbox.items)
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => !st.nailCat || p.category === st.nailCat)
        .map(({ p, i }) => `
          <article class="card product" data-path="items.${i}">
            <div class="card__media">${p.tag ? `<span class="badge">${esc(p.tag)}</span>` : ""}${img(p.image, p.name)}</div>
            <div class="card__body">
              <p class="card__meta">${esc(p.code)}</p>
              <h3>${esc(p.name)}</h3>
              <div class="price">${money(p.price)}${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
              <div class="card__foot"><button class="btn btn--sm btn--block" data-order="nailbox" data-i="${i}">Đặt mua</button></div>
            </div>
          </article>`).join("");
    },
    shownPhotos(d, st) {
      return list(d.gallery.items).filter((g) => !st.galCat || g.category === st.galCat);
    },
    galleryGrid(d, st, img) {
      const all = list(d.gallery.items);
      return parts.shownPhotos(d, st).map((g, i) => `
        <button class="gallery__item" data-photo="${i}" data-path="items.${all.indexOf(g)}">
          ${img(g.image, g.caption || g.category)}
          ${g.caption ? `<span class="gallery__cap">${esc(g.caption)}</span>` : ""}
        </button>`).join("");
    },
  };

  /* ---------- Vẽ cả trang ---------- */
  // opts: { asset(path) -> url, state, preview: bool, focus: [id phần đang sửa] }
  function renderPage(d, opts = {}) {
    const st = Object.assign({ tab: 0, nailCat: null, galCat: null }, opts.state);
    const asset = opts.asset || ((p) => String(p).replace(/^\//, ""));
    const img = (p, alt) => (p ? `<img src="${esc(asset(p))}" alt="${esc(alt)}" loading="lazy">` : ph(alt));
    const focus = new Set(opts.focus || []);
    const { home, contact, layout } = d;
    const brand = home.brand || {};
    const hero = home.hero || {};
    const about = home.about || {};
    const theme = (layout && layout.theme) || {};
    const heads = { about, services: d.services, courses: d.courses, nailbox: d.nailbox, gallery: d.gallery, feedback: d.feedback, contact };
    const mark = (id) => (focus.has(id) ? " is-editing" : "");

    const head = (id, extra = "") => `
      <div class="section__head">
        <p class="eyebrow" data-path="eyebrow">${esc(heads[id].eyebrow)}</p>
        <h2 data-path="title">${esc(heads[id].title)}</h2>${extra}
      </div>`;

    const body = {
      about: () => `
        <div class="container about__inner">
          <div class="about__media" data-path="about.image">${img(about.image, "Ảnh giới thiệu")}</div>
          <div>
            <p class="eyebrow" data-path="about.eyebrow">${esc(about.eyebrow)}</p>
            <h2 data-path="about.title">${esc(about.title)}</h2>
            <p data-path="about.text">${esc(about.text)}</p>
            <ul class="checklist" data-path="about.highlights">${list(about.highlights).map((h, i) => `<li data-path="about.highlights.${i}">${esc(h)}</li>`).join("")}</ul>
          </div>
        </div>`,
      services: () => `
        <div class="container">
          ${head("services")}
          <div class="tabs" data-part="serviceTabs" data-path="groups">${parts.serviceTabs(d, st)}</div>
          <div class="price-list" data-part="serviceList">${parts.serviceList(d, st)}</div>
        </div>`,
      courses: () => `
        <div class="container">
          ${head("courses")}
          <div class="grid grid--3">${list(d.courses.items).map((c, i) => `
            <article class="card" data-path="items.${i}">
              <div class="card__media">${c.level ? `<span class="badge">${esc(c.level)}</span>` : ""}${img(c.image, c.title)}</div>
              <div class="card__body">
                <p class="card__meta">${esc(c.duration)}</p>
                <h3>${esc(c.title)}</h3>
                <p class="card__desc">${esc(c.description)}</p>
                <ul class="checklist">${list(c.highlights).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
                <div class="card__foot">
                  <div class="price">${money(c.price)}${c.oldPrice ? `<del>${money(c.oldPrice)}</del>` : ""}</div>
                  <button class="btn btn--block" data-order="course" data-i="${i}">Đăng ký học</button>
                </div>
              </div>
            </article>`).join("")}
          </div>
        </div>`,
      nailbox: () => `
        <div class="container">
          ${head("nailbox", d.nailbox.note ? `<p class="section__note" data-path="note">${esc(d.nailbox.note)}</p>` : "")}
          <div class="chips" data-part="nailChips">${parts.chips(list(d.nailbox.items), st.nailCat, "nail")}</div>
          <div class="grid grid--4" data-part="nailboxGrid">${parts.nailboxGrid(d, st, img)}</div>
        </div>`,
      gallery: () => `
        <div class="container">
          ${head("gallery")}
          <div class="chips" data-part="galChips">${parts.chips(list(d.gallery.items), st.galCat, "gal")}</div>
          <div class="gallery" data-part="galleryGrid">${parts.galleryGrid(d, st, img)}</div>
        </div>`,
      feedback: () => `
        <div class="container">
          ${head("feedback")}
          <div class="grid grid--3">${list(d.feedback.items).map((f, i) => `
            <article class="card review" data-path="items.${i}">
              <div class="stars">${"★".repeat(Math.min(5, Math.max(1, Number(f.rating) || 5)))}</div>
              ${f.image ? `<div class="review__shot">${img(f.image, "Feedback của " + f.name)}</div>` : ""}
              ${f.content ? `<p class="review__text">“${esc(f.content)}”</p>` : ""}
              <div class="review__author">
                <span class="avatar">${esc((String(f.name || "?").trim().split(/\s+/).pop() || "?")[0])}</span>
                <div><strong>${esc(f.name)}</strong><small>${esc(f.service)}</small></div>
              </div>
            </article>`).join("")}
          </div>
        </div>`,
      contact: () => {
        const rows = [
          ["phone", "Điện thoại", `<a href="tel:${esc(contact.phone)}">${esc(contact.phone)}</a>`],
          ["zalo", "Zalo", `<a href="${zaloUrl(contact)}" target="_blank" rel="noopener">${esc(contact.zalo)}</a>`],
          ["address", "Địa chỉ", esc(contact.address)],
          ["hours", "Giờ mở cửa", esc(contact.hours)],
        ];
        const socials = [["facebook", "Facebook"], ["messenger", "Messenger"], ["instagram", "Instagram"], ["tiktok", "TikTok"]]
          .filter(([key]) => contact[key]);
        return `
        <div class="container contact">
          <div>
            <p class="eyebrow" data-path="eyebrow">${esc(contact.eyebrow)}</p>
            <h2 data-path="title">${esc(contact.title)}</h2>
            <ul class="contact__list">${rows.map(([key, k, v]) => `<li data-path="${key}"><b>${k}</b><span>${v}</span></li>`).join("")}</ul>
            <div class="socials">${socials.map(([key, n]) =>
              `<a class="btn btn--ghost btn--sm" data-path="${key}" href="${esc(contact[key])}" target="_blank" rel="noopener">${n}</a>`).join("")}</div>
          </div>
          <div class="contact__map" data-path="mapEmbed">${contact.mapEmbed
            ? `<iframe src="${esc(contact.mapEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bản đồ"></iframe>`
            : ph("Bản đồ Google Maps")}</div>
        </div>`;
      },
    };

    // Phần ẩn: trang thật bỏ qua; bản xem trước vẫn vẽ nhưng làm mờ để biết nó đang ẩn
    let tint = false;
    const nav = [];
    const sections = sectionOrder(layout).map(({ id, visible }) => {
      if (!visible && !opts.preview) return "";
      const cls = ["section", id === "about" ? "about" : ""];
      if (visible) {
        nav.push(`<a href="#${ANCHOR[id]}">${esc(heads[id].title)}</a>`);
        if (id !== "about" && (tint = !tint)) cls.push("section--tint");
      } else {
        cls.push("is-hidden-preview");
      }
      return `<section class="${cls.join(" ").trim()}${mark(id)}" id="${ANCHOR[id]}" data-section="${id}"${id === "about" ? ' data-path="about"' : ""}>${body[id]()}</section>`;
    }).join("");

    const zalo = zaloUrl(contact);
    const style = [theme.primary && `--rose:${theme.primary}`, theme.background && `--bg:${theme.background}`].filter(Boolean).join(";");

    return `
    <div class="site" style="${esc(style)}">
      <header class="header${mark("header")}" data-section="header">
        <div class="container header__inner">
          <a href="#top" class="logo" data-path="brand">${brand.logo ? `<img src="${esc(asset(brand.logo))}" alt="${esc(brand.name)}">` : esc(brand.name)}</a>
          <nav class="nav">${nav.join("")}</nav>
          <a class="btn btn--sm header__cta" href="${zalo}" target="_blank" rel="noopener">Đặt lịch</a>
          <button class="nav-toggle" aria-label="Mở menu"><span></span><span></span><span></span></button>
        </div>
      </header>

      <main id="top">
        <section class="hero${mark("hero")}" data-section="hero" data-path="hero">
          <div class="container hero__inner">
            <div class="hero__text">
              <p class="eyebrow" data-path="brand.tagline">${esc(brand.tagline)}</p>
              <h1 data-path="hero.title">${esc(hero.title)}</h1>
              <p class="lead" data-path="hero.subtitle">${esc(hero.subtitle)}</p>
              <div class="hero__actions">
                <a class="btn" href="${zalo}" target="_blank" rel="noopener">Đặt lịch qua Zalo</a>
                <a class="btn btn--ghost" href="#${ANCHOR.courses}">Xem khoá học</a>
              </div>
              <ul class="stats" data-path="hero.stats">${list(hero.stats).map((s, i) =>
                `<li data-path="hero.stats.${i}"><strong>${esc(s.number)}</strong><span>${esc(s.label)}</span></li>`).join("")}</ul>
            </div>
            <div class="hero__media" data-path="hero.image">${img(hero.image, "Ảnh nổi bật")}</div>
          </div>
        </section>
        ${sections}
      </main>

      <footer class="footer">
        <div class="container"><p>© ${new Date().getFullYear()} ${esc(brand.name)}. All rights reserved.</p></div>
      </footer>
      ${opts.preview ? "" : `
      <div class="float-contact">
        <a class="float-btn float-btn--zalo" href="${zalo}" target="_blank" rel="noopener" aria-label="Chat Zalo">Zalo</a>
        <a class="float-btn float-btn--phone" href="tel:${esc(contact.phone)}" aria-label="Gọi điện">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>
        </a>
      </div>
      <div class="lightbox" hidden>
        <button class="lightbox__close" data-lb="close" aria-label="Đóng">×</button>
        <button class="lightbox__nav lightbox__nav--prev" data-lb="prev" aria-label="Ảnh trước">‹</button>
        <figure class="lightbox__figure"><div class="lightbox__img"></div><figcaption></figcaption></figure>
        <button class="lightbox__nav lightbox__nav--next" data-lb="next" aria-label="Ảnh sau">›</button>
      </div>
      <div class="toast" role="status" aria-live="polite"></div>`}
    </div>`;
  }

  /* ---------- Gắn tương tác (tab, bộ lọc, album, đặt hàng, menu) ---------- */
  // Trả về state hiện tại; opts giống renderPage
  function bind(root, d, opts = {}) {
    const state = opts.state || {};
    state.tab ??= 0;
    state.nailCat ??= null;
    state.galCat ??= null;
    const asset = opts.asset || ((p) => String(p).replace(/^\//, ""));
    const img = (p, alt) => (p ? `<img src="${esc(asset(p))}" alt="${esc(alt)}" loading="lazy">` : ph(alt));
    const $ = (sel) => root.querySelector(sel);
    const set = (part, html) => { const el = $(`[data-part="${part}"]`); if (el) el.innerHTML = html; };
    const doc = root.ownerDocument;

    // Ảnh lỗi đường dẫn -> thay bằng ô màu tạm
    root.addEventListener("error", (e) => {
      if (e.target.tagName === "IMG") e.target.outerHTML = ph(e.target.alt);
    }, true);

    // Album: lightbox (chỉ trang thật)
    const lb = $(".lightbox");
    let current = 0;
    const showLb = (i) => {
      const shown = parts.shownPhotos(d, state);
      if (!lb || !shown.length) return;
      current = (i + shown.length) % shown.length;
      const g = shown[current];
      lb.querySelector(".lightbox__img").innerHTML = g.image
        ? `<img src="${esc(asset(g.image))}" alt="${esc(g.caption)}">` : ph(g.caption || g.category);
      lb.querySelector("figcaption").textContent = g.caption || "";
      lb.hidden = false;
      doc.body.style.overflow = "hidden";
    };
    const closeLb = () => { lb.hidden = true; doc.body.style.overflow = ""; };
    if (lb) {
      doc.addEventListener("keydown", (e) => {
        if (lb.hidden) return;
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowLeft") showLb(current - 1);
        if (e.key === "ArrowRight") showLb(current + 1);
      });
    }

    const toast = (msg) => {
      const t = $(".toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("is-show");
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => t.classList.remove("is-show"), 3500);
    };

    const nav = $(".nav");
    const toggle = $(".nav-toggle");

    root.addEventListener("click", async (e) => {
      const t = e.target;
      const tab = t.closest("[data-tab]");
      const nailChip = t.closest("[data-nail]");
      const galChip = t.closest("[data-gal]");
      const photo = t.closest("[data-photo]");
      const order = t.closest("[data-order]");
      const link = t.closest("a");

      if (tab) {
        state.tab = +tab.dataset.tab;
        set("serviceTabs", parts.serviceTabs(d, state));
        set("serviceList", parts.serviceList(d, state));
      } else if (nailChip) {
        state.nailCat = nailChip.dataset.nail === "Tất cả" ? null : nailChip.dataset.nail;
        set("nailChips", parts.chips(list(d.nailbox.items), state.nailCat, "nail"));
        set("nailboxGrid", parts.nailboxGrid(d, state, img));
      } else if (galChip) {
        state.galCat = galChip.dataset.gal === "Tất cả" ? null : galChip.dataset.gal;
        set("galChips", parts.chips(list(d.gallery.items), state.galCat, "gal"));
        set("galleryGrid", parts.galleryGrid(d, state, img));
      } else if (photo) {
        showLb(+photo.dataset.photo);
      } else if (lb && t.closest(".lightbox")) {
        const act = t.dataset.lb;
        if (act === "prev") showLb(current - 1);
        else if (act === "next") showLb(current + 1);
        else if (act === "close" || t === lb) closeLb();
      } else if (toggle && t.closest(".nav-toggle")) {
        nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open");
      } else if (opts.preview && (order || link)) {
        e.preventDefault(); // bản xem trước: không mở Zalo / không chuyển trang
      } else if (order) {
        const i = +order.dataset.i;
        const brand = d.home.brand || {};
        const msg = order.dataset.order === "course"
          ? `Chào ${brand.name}, mình muốn đăng ký khoá học "${list(d.courses.items)[i].title}". Tư vấn giúp mình nhé!`
          : `Chào ${brand.name}, mình muốn đặt nailbox ${list(d.nailbox.items)[i].code} - ${list(d.nailbox.items)[i].name}.`;
        try {
          await navigator.clipboard.writeText(msg);
          toast("Đã copy nội dung — dán vào Zalo để gửi nhé!");
        } catch {
          toast("Đang mở Zalo...");
        }
        window.open(zaloUrl(d.contact), "_blank", "noopener");
      } else if (link && nav && nav.contains(link)) {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
      }
    });
    return state;
  }

  window.SiteRender = { renderPage, bind, CONTENT_FILES: ["home", "services", "courses", "nailbox", "gallery", "feedback", "contact", "layout"] };
})();
