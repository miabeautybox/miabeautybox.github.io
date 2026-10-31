# Website Makeup & Nail

Web tĩnh (HTML/CSS/JS) chạy trên GitHub Pages, có trang quản trị **/admin** (Sveltia CMS) để sửa nội dung mà không cần biết code.

```
index.html          Khung trang
css/style.css       Giao diện
js/main.js          Code hiển thị
content/*.json      ★ Nội dung (sửa qua /admin)
images/uploads/     Ảnh upload từ /admin
admin/              Trang quản trị (config.yml = cấu hình các ô nhập)
```

## Trang quản trị /admin

Vào `https://<tài-khoản>.github.io/admin/` → **Sign In Using Access Token** → dán token (chỉ cần làm 1 lần, trình duyệt sẽ nhớ).

Sửa được:
- **Cài đặt chung & bố cục:** tên thương hiệu, logo, số điện thoại/Zalo, mạng xã hội, bản đồ, **màu chủ đạo, màu nền**, **kéo thả thứ tự các mục, ẩn/hiện từng mục**, đổi tiêu đề từng mục.
- **Ảnh bìa & Giới thiệu, Bảng giá, Khoá học, Nailbox, Album ảnh, Feedback:** thêm / sửa / xoá / kéo thả sắp xếp, upload ảnh.

Bấm **Save** → khoảng 1 phút sau web tự cập nhật. Ảnh upload được tự thu nhỏ và nén (WebP), nên chụp thẳng từ điện thoại up lên được.
Giao diện admin theo ngôn ngữ trình duyệt; đổi sang tiếng Việt trong phần Settings (biểu tượng tài khoản góc phải) nếu cần.

### Tạo token đăng nhập (làm 1 lần)

1. Đăng nhập GitHub → https://github.com/settings/personal-access-tokens/new
2. *Token name*: `admin web` • *Expiration*: chọn dài nhất (hoặc No expiration nếu có)
3. *Repository access*: **Only select repositories** → chọn repo của web
4. *Permissions → Repository permissions → Contents*: **Read and write**
5. *Generate token* → copy, dán vào trang /admin. **Không gửi token cho ai** — ai có token là sửa được web.

Token hết hạn thì tạo cái mới theo các bước trên.

## Đưa web lên GitHub Pages (lần đầu)

1. Tạo repo **Public** tên `<tài-khoản>.github.io` (web sẽ ở `https://<tài-khoản>.github.io`).
2. Sửa dòng `repo:` trong `admin/config.yml` thành `<tài-khoản>/<tên-repo>`.
3. Đẩy code lên nhánh `main`.
4. Repo → **Settings → Pages** → *Source: Deploy from a branch* → `main` / `/ (root)` → Save.

## Xem thử trên máy

Trang đọc nội dung từ file JSON nên cần chạy qua server (mở trực tiếp file sẽ báo lỗi):

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

Sửa nội dung ngay trên máy bằng admin: mở http://localhost:8000/admin/ bằng Chrome/Edge → **Work with Local Repository** → chọn thư mục này.

## Gắn tên miền riêng (khi có)

Repo → **Settings → Pages → Custom domain**, rồi trỏ DNS theo hướng dẫn:
https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site
