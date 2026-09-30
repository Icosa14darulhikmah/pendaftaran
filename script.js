const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYfgoP_4FjLy3ZP7ICspOt7iNBZrSApfReJTzI2-tZgm8y94Hd3CIRPyGnAP_jogl6/exec";

// Daftar lomba. gol = golongan yang boleh ikut. wa = nomor panitia (format 62xxxx tanpa + dan 0 depan).
const LOMBA = [
  { nama: "Futsal",       gol: ["Ikhwan"],           group: true,  paid: true,  wa: "6281313916145" },
  { nama: "Hasta Karya",  gol: ["Akhwat"],           group: true,  paid: false },
  { nama: "Badminton",    gol: ["Ikhwan", "Akhwat"], group: false,  paid: true,  wa: "62888976283" },
  { nama: "MHQ",          gol: ["Ikhwan", "Akhwat"], group: false,  paid: false },
  { nama: "LCCU",         gol: ["Ikhwan", "Akhwat"], group: true,  paid: false },
  { nama: "Kaligrafi",    gol: ["Ikhwan", "Akhwat"], group: false, paid: false },
  { nama: "Pidato",       gol: ["Ikhwan", "Akhwat"], group: false, paid: false },
  { nama: "Poster Digital", gol: ["Ikhwan", "Akhwat"], group: false, paid: false },
];
// ========================

const $ = (s) => document.querySelector(s);
const form = $("#form"), lombaSel = $("#lomba"), info = $("#lombaInfo");
const anggotaCard = $("#anggotaCard"), anggotaList = $("#anggotaList");
let memberCount = 0;

const currentLomba = () => LOMBA.find((l) => l.nama === lombaSel.value);

// Pilihan lomba mengikuti golongan
document.querySelectorAll('input[name="golongan"]').forEach((r) =>
  r.addEventListener("change", () => {
    const g = r.value;
    lombaSel.disabled = false;
    lombaSel.innerHTML = '<option value="">Pilih lomba</option>' +
      LOMBA.filter((l) => l.gol.includes(g)).map((l) => {
        const tag = [l.paid ? "berbayar" : "", l.group ? "berkelompok" : ""].filter(Boolean).join(", ");
        return `<option value="${l.nama}">${l.nama}${tag ? " (" + tag + ")" : ""}</option>`;
      }).join("");
    updateLomba();
  })
);
lombaSel.addEventListener("change", updateLomba);

function updateLomba() {
  const l = currentLomba();
  const notes = [];
  if (l && l.paid) notes.push("Lomba ini berbayar. Setelah mengirim, konfirmasi biaya pendaftaran ke panitia melalui WhatsApp.");
  if (l && l.group) notes.push("Lomba ini berkelompok. Isi data ketua di bawah, lalu tambahkan anggota.");
  info.hidden = !notes.length;
  info.textContent = notes.join(" ");
  anggotaCard.hidden = !(l && l.group);
  if (!(l && l.group)) { anggotaList.innerHTML = ""; memberCount = 0; }
  else if (!anggotaList.children.length) addAnggota();
}

// Anggota kelompok
function addAnggota() {
  memberCount++;
  const d = document.createElement("div");
  d.className = "anggota";
  d.innerHTML = `
    <div class="anggota-head"><span class="ang-title"></span>
      <button type="button" class="remove">Hapus</button></div>
    <label>Nama lengkap <input data-f="nama" required></label>
    <div class="row">
      <label>NIS/NISN <input data-f="nis" inputmode="numeric" required></label>
      <label>Kelas <input data-f="kelas" required></label>
    </div>
    <label>Tanggal lahir <input type="date" data-f="tgl_lahir" required></label>`;
  d.querySelector(".remove").onclick = () => { d.remove(); renumber(); };
  anggotaList.appendChild(d);
  renumber();
}
function renumber() {
  [...anggotaList.children].forEach((c, i) => (c.querySelector(".ang-title").textContent = "Anggota " + (i + 1)));
}
$("#addAnggota").onclick = addAnggota;

// Gambar: kecilkan lalu ubah ke base64
function fileToData(file, max = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = () => reject(new Error("File harus berupa gambar (JPG/PNG)."));
    img.src = url;
  });
}

function showError(msg) {
  const e = $("#error");
  e.textContent = msg; e.hidden = !msg;
  if (msg) e.scrollIntoView({ behavior: "smooth", block: "center" });
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  showError("");
  if (!form.querySelector('input[name="golongan"]:checked')) return showError("Pilih golongan terlebih dahulu.");
  if (!form.reportValidity()) return;
  if (SCRIPT_URL.startsWith("GANTI")) return showError("URL Google Apps Script belum diisi di script.js.");

  const btn = $("#submitBtn");
  btn.disabled = true; btn.textContent = "Mengirim...";
  try {
    const fd = new FormData(form);
    const l = currentLomba();
    const data = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
    data.anggota = l.group
      ? [...anggotaList.children].map((c) => Object.fromEntries([...c.querySelectorAll("[data-f]")].map((i) => [i.dataset.f, i.value])))
      : [];
    data.foto_kartu = await fileToData(form.foto_kartu.files[0]);
    data.bukti_ig = await fileToData(form.bukti_ig.files[0]);

    const res = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || "Server menolak data.");
    done(l, data, out.id);
  } catch (err) {
    showError("Pendaftaran gagal dikirim: " + err.message + " Periksa koneksi lalu coba lagi.");
  } finally {
    btn.disabled = false; btn.textContent = "Kirim pendaftaran";
  }
});

function done(l, data, id) {
  $("#modalText").textContent = l.paid
    ? `Lomba ${l.nama} dikenakan biaya pendaftaran. Segera konfirmasi pembayaran ke panitia melalui WhatsApp dan sertakan kode pendaftaran ${id}.`
    : `Terima kasih, data Anda sudah tercatat. Kode pendaftaran: ${id}.`;
  const a = $("#waLink");
  a.hidden = !l.paid;
  if (l.paid) a.href = `https://wa.me/${l.wa}?text=` + encodeURIComponent(`Assalamu'alaikum, saya ${data.nama} ingin konfirmasi pendaftaran lomba ${l.nama} ICOSA 14. Kode pendaftaran: ${id}`);
  $("#modal").hidden = false;
  form.reset(); lombaSel.disabled = true;
  lombaSel.innerHTML = '<option value="">Pilih golongan terlebih dahulu</option>';
  updateLomba();
}
$("#closeModal").onclick = () => ($("#modal").hidden = true);
