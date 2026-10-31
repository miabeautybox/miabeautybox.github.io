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

Vào `https://miabeautybox.github.io/admin/` → nhập **tên đăng nhập + mật khẩu admin** (trình duyệt sẽ nhớ, lần sau vào thẳng).

Sửa được:
- **Cài đặt chung & bố cục:** tên thương hiệu, logo, số điện thoại/Zalo, mạng xã hội, bản đồ, **màu chủ đạo, màu nền**, **kéo thả thứ tự các mục, ẩn/hiện từng mục**, đổi tiêu đề từng mục.
- **Ảnh bìa & Giới thiệu, Bảng giá, Khoá học, Nailbox, Album ảnh, Feedback:** thêm / sửa / xoá / kéo thả sắp xếp, upload ảnh.

Bấm **Save** → khoảng 1 phút sau web tự cập nhật. Ảnh upload được tự thu nhỏ và nén (WebP).

### Tài khoản admin hoạt động thế nào

Web tĩnh không có server để kiểm tra mật khẩu, nên một GitHub token (chỉ có quyền sửa repo này) được **mã hoá bằng tên đăng nhập + mật khẩu** và lưu ở `admin/auth.json`. Đăng nhập đúng thì trang giải mã được token và mở trình quản trị (Sveltia CMS).

File `auth.json` ai cũng tải được, nên mật khẩu yếu có thể bị dò ra. Nếu nghi bị lộ: xoá token tại https://github.com/settings/personal-access-tokens rồi tạo lại tài khoản như dưới.

### Tạo / đổi tài khoản admin, hoặc khi token hết hạn

1. Đăng nhập GitHub bằng tài khoản `miabeautybox` → https://github.com/settings/personal-access-tokens/new
   - *Expiration*: dài nhất có thể
   - *Repository access*: **Only select repositories** → `miabeautybox.github.io`
   - *Permissions → Repository permissions → Contents*: **Read and write**
2. Copy token, lưu vào một file (vd `~/.miabeautybox-token`), rồi chạy:
   ```bash
   node tools/set-admin.mjs ~/.miabeautybox-token <tên-đăng-nhập> '<mật-khẩu>'
   rm ~/.miabeautybox-token
   git add admin/auth.json && git commit -m "Cập nhật tài khoản admin" && git push
   ```

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
