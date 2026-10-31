// Tạo/đổi tài khoản admin: mã hoá GitHub token bằng tên đăng nhập + mật khẩu -> admin/auth.json
// Dùng: node tools/set-admin.mjs <file-chứa-token> <tên-đăng-nhập> <mật-khẩu>
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [tokenFile, username, password] = process.argv.slice(2);
if (!tokenFile || !username || !password) {
  console.error("Dùng: node tools/set-admin.mjs <file-chứa-token> <tên-đăng-nhập> <mật-khẩu>");
  process.exit(1);
}
const token = readFileSync(tokenFile, "utf8").trim();
if (!/^(github_pat_|ghp_)\w+$/.test(token)) {
  console.error("File không chứa GitHub token hợp lệ.");
  process.exit(1);
}

const ITERATIONS = 1_000_000;
const enc = new TextEncoder();
const b64 = (buf) => Buffer.from(buf).toString("base64");
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const material = await crypto.subtle.importKey("raw", enc.encode(`${username}\n${password}`), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
  material, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(token));

const out = new URL("../admin/auth.json", import.meta.url);
writeFileSync(out, JSON.stringify({ iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(ct) }, null, 2) + "\n");
console.log("Đã ghi admin/auth.json");
