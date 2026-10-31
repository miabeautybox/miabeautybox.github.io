/* Tải nội dung từ content/*.json rồi vẽ trang bằng js/render.js — thường không cần sửa file này. */
(async () => {
  const app = document.getElementById("app");
  const data = {};
  try {
    await Promise.all(SiteRender.CONTENT_FILES.map(async (n) => {
      const r = await fetch(`content/${n}.json`, { cache: "no-cache" });
      if (!r.ok) throw new Error(`content/${n}.json`);
      data[n] = await r.json();
    }));
  } catch (err) {
    app.innerHTML = `<p style="padding:16px;background:#fee;color:#900;text-align:center">Không tải được nội dung (${err.message}). ` +
      "Nếu đang mở file trực tiếp trên máy, hãy chạy: <code>python3 -m http.server</code> rồi vào http://localhost:8000</p>";
    return;
  }

  const brand = data.home.brand || {};
  document.title = `${brand.name} — ${brand.tagline}`;
  app.innerHTML = SiteRender.renderPage(data);
  SiteRender.bind(app, data);

  // Màu nền cho phần ngoài trang (khi kéo quá đầu/cuối trang)
  const bg = data.layout.theme && data.layout.theme.background;
  if (bg) document.body.style.background = bg;

  // Mở link có #anchor (vd .../#nailbox) sau khi trang đã vẽ xong
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
