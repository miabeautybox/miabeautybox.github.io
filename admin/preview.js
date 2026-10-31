/* Bản xem trước trong trang quản trị: vẽ cả trang web y như thật (dùng js/render.js).
   - Cuộn tới và viền nét đứt phần đang sửa, cập nhật ngay khi gõ.
   - Bấm vào ô nào bên trái thì bản xem trước cuộn tới và viền đậm đúng chỗ đó. */
(() => {
  const { createElement: h, useEffect, useRef, useState } = CMS.React;
  const SITE = new URL("../", location.href); // gốc của trang web

  CMS.registerPreviewStyle("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap&subset=vietnamese");
  CMS.registerPreviewStyle(new URL("css/style.css?v=3", SITE).href);
  CMS.registerPreviewStyle(`
    html { scroll-behavior: auto; }
    body { margin: 0; }
    section.is-editing { position: relative; }
    .is-editing { outline: 3px dashed var(--rose); outline-offset: -4px; }
    .is-editing::before {
      content: "✎ Phần bạn đang sửa"; position: absolute; top: 10px; left: 10px; z-index: 40;
      background: var(--rose); color: #fff; font: 600 12px/1 var(--sans);
      padding: 7px 12px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,.15);
    }
    .header.is-editing::before { top: auto; bottom: -30px; }
    .is-focus {
      outline: 3px solid var(--rose) !important; outline-offset: 4px; border-radius: 6px;
      box-shadow: 0 0 0 9px color-mix(in srgb, var(--rose) 22%, transparent);
      transition: box-shadow .2s;
    }
    section.is-focus { outline-offset: -6px; }
    .is-hidden-preview { position: relative; opacity: .4; }
    .is-hidden-preview::after {
      content: "Phần này đang ẨN trên web"; position: absolute; top: 10px; right: 10px;
      background: #3a2a27; color: #fff; font: 600 12px/1.3 var(--sans); padding: 7px 12px; border-radius: 999px;
    }
  `, { raw: true });

  // Phần trên trang ứng với từng mục trong trang quản trị
  const FOCUS = {
    home: ["header", "hero", "about"],
    services: ["services"],
    courses: ["courses"],
    nailbox: ["nailbox"],
    gallery: ["gallery"],
    feedback: ["feedback"],
    contact: ["contact"],
    layout: [],
  };

  const toJS = (v) => (v && typeof v.toJS === "function" ? v.toJS() : v);

  // Ô đang được bấm/gõ bên trái (Sveltia gắn data-key-path cho mỗi ô, vd "items.3.price")
  let focusPath = null;
  const listeners = new Set();
  const onFocus = (e) => {
    const field = e.target.closest && e.target.closest("[data-key-path]");
    if (!field || field.dataset.keyPath === focusPath) return;
    focusPath = field.dataset.keyPath;
    listeners.forEach((fn) => fn(focusPath));
  };
  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("click", onFocus, true);

  // Tìm chỗ trên trang ứng với ô đang sửa: phần tử có data-path dài nhất khớp với đường dẫn của ô
  const findTarget = (root, name, path, data) => {
    if (!path) return null;
    if (name === "layout") {
      const order = path.match(/^order\.(\d+)/);
      const vis = path.match(/^visible\.(\w+)/);
      const item = order && (data.layout.order || [])[+order[1]];
      const id = vis ? vis[1] : item && (item.id || item);
      return id ? root.querySelector(`[data-section="${id}"]`) : null;
    }
    let best = null;
    let bestLen = -1;
    root.querySelectorAll(".is-editing[data-path], .is-editing [data-path]").forEach((el) => {
      const p = el.dataset.path;
      if ((path === p || path.startsWith(p + ".")) && p.length > bestLen) {
        best = el;
        bestLen = p.length;
      }
    });
    return best;
  };

  // Nội dung các mục khác (để vẽ được cả trang): lấy từ CMS, lỗi thì lấy file đã đăng
  const loadAll = (getCollection) => Promise.all(SiteRender.CONTENT_FILES.map(async (name) => {
    let data;
    try {
      const entry = await getCollection("pages", name);
      data = toJS(entry.get ? entry.get("data") : entry.data);
    } catch {}
    if (!data || !Object.keys(data).length) {
      data = await fetch(new URL(`content/${name}.json`, SITE), { cache: "no-cache" }).then((r) => r.json()).catch(() => ({}));
    }
    return [name, data];
  })).then(Object.fromEntries);

  const makePreview = (name) => function SitePreview({ entry, getAsset, getCollection }) {
    const box = useRef(null);
    const state = useRef({});
    const draw = useRef(null);
    const focus = useRef(null);
    const scrolled = useRef(false);
    const [others, setOthers] = useState(null);

    useEffect(() => {
      focusPath = null; // mục mới mở: chưa bấm ô nào
      loadAll(getCollection).then(setOthers);
      const onChange = (path) => {
        focus.current = path;
        // Bảng giá: chuyển sang đúng tab của nhóm đang sửa
        const group = name === "services" && path.match(/^groups\.(\d+)/);
        if (group) state.current.tab = +group[1];
        if (draw.current) draw.current(true);
      };
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    }, []);

    const current = toJS(entry.get("data")) || {};

    // Vẽ lại mỗi lần nội dung thay đổi (gõ chữ, thêm ảnh...)
    draw.current = (scrollToFocus) => {
      if (!others || !box.current) return;
      const data = { ...others, [name]: current };
      // Ảnh vừa upload (chưa lưu) có link blob; ảnh cũ lấy theo đường dẫn trên web
      const asset = (p) => {
        let url = "";
        try { url = (getAsset(p) || {}).url || ""; } catch {}
        return /^(blob:|data:|https?:)/.test(url) ? url : new URL(String(p).replace(/^\//, ""), SITE).href;
      };
      const opts = { preview: true, focus: FOCUS[name], state: state.current, asset };
      const root = box.current.ownerDocument.createElement("div");
      root.innerHTML = SiteRender.renderPage(data, opts);
      box.current.replaceChildren(root);
      SiteRender.bind(root, data, opts);

      const target = findTarget(root, name, focus.current, data);
      if (target) target.classList.add("is-focus");
      if (scrollToFocus && target) {
        // Cả một phần lớn: cuộn tới đầu phần; thẻ/dòng nhỏ: đưa vào giữa màn hình
        target.scrollIntoView({ block: target.tagName === "SECTION" ? "start" : "center", behavior: "smooth" });
      } else if (!scrolled.current) {
        scrolled.current = true;
        const section = root.querySelector(".is-editing:not(.header)");
        if (section) setTimeout(() => section.scrollIntoView({ block: "start" }), 50);
      }
    };

    useEffect(() => draw.current(false));

    return h("div", null,
      others ? null : h("p", { style: { padding: "24px", fontFamily: "sans-serif" } }, "Đang tải bản xem trước..."),
      h("div", { ref: box }));
  };

  Object.keys(FOCUS).forEach((name) => CMS.registerPreviewTemplate(name, makePreview(name)));
})();
