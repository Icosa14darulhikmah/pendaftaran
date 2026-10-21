// ====== PENGATURAN ======
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_nYiGvg7_dVOKRv1BKHihg4zkDIBATzfLoXe9oEOt9iGzdGoa6ondZu8f2g7lhjPMkg/exec";

// Contact person (format WA: 62xxxx tanpa + dan 0 di depan)
const CP = {
  rizky:   { nama: "Rizky",   wa: "6287822343078" },
  atikah:  { nama: "Atikah",  wa: "6285697269073" },
  nasyifa: { nama: "Nasyifa", wa: "6285804617166" },
  kaysan:  { nama: "Kaysan",  wa: "6285893108887" },
  yuna:    { nama: "Yuna",    wa: "6285814527807" },
  gaza:    { nama: "Gaza",    wa: "6285691842915" },
  rabiah:  { nama: "Rabiah",  wa: "6287844087444" },
  gibran:  { nama: "Gibran",  wa: "6282311770040" },
  alfian:  { nama: "Alfian",  wa: "6285947715066" },
  salma:   { nama: "Salma",   wa: "628131215082"  },
  kirana:  { nama: "Kirana",  wa: "628979749454"  },
  ihsan:   { nama: "Ihsan",   wa: "6281313916145" },
  raihan:  { nama: "Raihan",  wa: "6285285978670" },
  zahran:  { nama: "Zahran",  wa: "6285776212557" },
};

// gol = golongan yang boleh ikut. pay = info transfer (lomba berbayar).
// cp = contact person per golongan; untuk Futsal contact person per kategori (cpKategori).
const LOMBA = [
  { nama: "Futsal", gol: ["Ikhwan"], group: true, paid: true, kategori: ["SD", "SMP"],
    pay: { nomor: "85776212557 (GoPay)" }, cpKategori: { SD: CP.raihan, SMP: CP.zahran } },
  { nama: "Hasta Karya", gol: ["Akhwat"], group: true, paid: false, cp: { Akhwat: CP.atikah } },
  { nama: "Badminton", gol: ["Ikhwan", "Akhwat"], group: false, paid: true,
    pay: { nomor: "7146533811" }, cp: { Ikhwan: CP.rizky, Akhwat: CP.atikah } },
  { nama: "MHQ", gol: ["Ikhwan", "Akhwat"], group: false, paid: false, cp: { Ikhwan: CP.gaza, Akhwat: CP.yuna } },
  { nama: "LCCU", gol: ["Ikhwan", "Akhwat"], group: true, paid: false, cp: { Ikhwan: CP.kaysan, Akhwat: CP.nasyifa } },
  { nama: "Kaligrafi", gol: ["Ikhwan", "Akhwat"], group: false, paid: false, cp: { Ikhwan: CP.gibran, Akhwat: CP.rabiah } },
  { nama: "Pidato", gol: ["Ikhwan", "Akhwat"], group: false, paid: false, cp: { Ikhwan: CP.ihsan, Akhwat: CP.kirana } },
  { nama: "Poster Digital", gol: ["Ikhwan", "Akhwat"], group: false, paid: false, cp: { Ikhwan: CP.alfian, Akhwat: CP.salma } },
];
// ========================

const $ = (s) => document.querySelector(s);
const form = $("#form"), lombaSel = $("#lomba"), info = $("#lombaInfo");
const anggotaCard = $("#anggotaCard"), anggotaList = $("#anggotaList");
const kategoriWrap = $("#kategoriWrap"), kategoriSel = $("#kategori");
const tfCard = $("#tfCard"), buktiTf = $("#buktiTf");
let memberCount = 0;
let last = null; // data pendaftaran terakhir (untuk bukti & contact person)

const currentLomba = () => LOMBA.find((l) => l.nama === lombaSel.value);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
lombaSel.addEventListener("change", () => {
  updateLomba();
  const l = currentLomba();
  if (l && l.paid) showPay(l);
});

function updateLomba() {
  const l = currentLomba();
  const notes = [];
  if (l && l.paid) notes.push("Lomba ini berbayar. Transfer biaya pendaftaran lalu unggah bukti transfer.");
  if (l && l.group) notes.push("Lomba ini berkelompok. Isi data ketua di bawah, lalu tambahkan anggota.");
  info.hidden = !notes.length;
  info.textContent = notes.join(" ");

  // Kategori (Futsal: SD / SMP)
  const hasKat = !!(l && l.kategori);
  kategoriWrap.hidden = !hasKat;
  kategoriSel.required = hasKat;
  if (!hasKat) kategoriSel.value = "";

  // Bukti transfer (lomba berbayar)
  const paid = !!(l && l.paid);
  tfCard.hidden = !paid;
  buktiTf.required = paid;
  if (!paid) buktiTf.value = "";
  $("#tfInfo").textContent = paid ? `Transfer ke nomor ${l.pay.nomor} untuk lomba ${l.nama}, lalu unggah buktinya di bawah.` : "";

  anggotaCard.hidden = !(l && l.group);
  if (!(l && l.group)) { anggotaList.innerHTML = ""; memberCount = 0; }
  else if (!anggotaList.children.length) addAnggota();
}

// Popup peringatan transfer
function showPay(l) {
  $("#payLomba").textContent = l.nama;
  $("#payNomor").textContent = l.pay.nomor;
  $("#copyNomor").textContent = "Salin nomor";
  $("#payModal").hidden = false;
}
$("#closePay").onclick = () => ($("#payModal").hidden = true);
$("#copyNomor").onclick = async () => {
  try { await navigator.clipboard.writeText($("#payNomor").textContent); $("#copyNomor").textContent = "Tersalin \u2713"; }
  catch { $("#copyNomor").textContent = "Salin manual ya"; }
};

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
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); // PNG transparan -> latar putih
      ctx.drawImage(img, 0, 0, c.width, c.height);
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

  const btn = $("#submitBtn");
  btn.disabled = true; btn.textContent = "Mengirim...";
  $("#loadingModal").hidden = false;
  try {
    const fd = new FormData(form);
    const l = currentLomba();
    const data = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
    data.anggota = l.group
      ? [...anggotaList.children].map((c) => Object.fromEntries([...c.querySelectorAll("[data-f]")].map((i) => [i.dataset.f, i.value])))
      : [];
    data.foto_kartu = await fileToData(form.foto_kartu.files[0]);
    data.bukti_ig = await fileToData(form.bukti_ig.files[0]);
    data.bukti_tf = l.paid ? await fileToData(buktiTf.files[0]) : "";

    const res = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
    let out;
    try { out = await res.json(); }
    catch { throw new Error("Server tidak merespons dengan benar."); }
    if (!out.ok) throw new Error(out.error || "Server menolak data.");
    $("#loadingModal").hidden = true;
    done(l, data, out.id);
  } catch (err) {
    $("#loadingModal").hidden = true;
    showError("Pendaftaran gagal dikirim: " + err.message + " Periksa koneksi lalu coba lagi.");
  } finally {
    btn.disabled = false; btn.textContent = "Kirim pendaftaran";
  }
});

// Contact person untuk lomba (+ kategori futsal)
function contactsFor(l, kategori) {
  if (l.cpKategori) return { Ikhwan: l.cpKategori[kategori] || null, Akhwat: null };
  return { Ikhwan: (l.cp || {}).Ikhwan || null, Akhwat: (l.cp || {}).Akhwat || null };
}

function done(l, data, id) {
  last = { l, data, id, waktu: new Date() };
  $("#modalText").textContent = `Terima kasih, data Anda sudah tercatat. Kode pendaftaran: ${id}. Unduh bukti pendaftaran dan simpan baik-baik.`
    + (l.paid ? " Bukti transfer Anda akan diverifikasi panitia." : "");

  const cps = contactsFor(l, data.kategori);
  const msg = (p) => `https://wa.me/${p.wa}?text=` + encodeURIComponent(`Assalamu'alaikum, saya ${data.nama} ingin konfirmasi pendaftaran lomba ${l.nama}${data.kategori ? " (" + data.kategori + ")" : ""} ICOSA 14. Kode pendaftaran: ${id}`);
  const setCp = (el, p, gol) => {
    el.hidden = !p;
    if (p) {
      el.href = msg(p);
      el.textContent = l.cpKategori
        ? `Hubungi Contact Person Futsal ${data.kategori} (${p.nama})`
        : `Hubungi Contact Person ${gol} (${p.nama})`;
    }
  };
  setCp($("#cpIkhwan"), cps.Ikhwan, "Ikhwan");
  setCp($("#cpAkhwat"), cps.Akhwat, "Akhwat");

  $("#modal").hidden = false;
  form.reset(); lombaSel.disabled = true;
  lombaSel.innerHTML = '<option value="">Pilih golongan terlebih dahulu</option>';
  updateLomba();
}
$("#closeModal").onclick = () => ($("#modal").hidden = true);

// ===== Download bukti pendaftaran (gambar) =====
function buildReceipt({ l, data, id, waktu }) {
  const row = (k, v) => (v ? `<tr><td>${k}</td><td>${esc(v)}</td></tr>` : "");
  const img = (cap, b64) => (b64 ? `<figure><img src="data:image/jpeg;base64,${b64}"><figcaption>${cap}</figcaption></figure>` : "");
  const tgl = (s) => (s ? new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "");
  const anggota = (data.anggota || []).map((a, i) =>
    `<tr><td>Anggota ${i + 1}</td><td>${esc(a.nama)} &middot; NIS ${esc(a.nis)} &middot; ${esc(a.kelas)} &middot; ${esc(tgl(a.tgl_lahir))}</td></tr>`).join("");
  const el = document.createElement("div");
  el.className = "receipt";
  el.innerHTML = `
    <div class="rc-head"><h1>Bukti Pendaftaran Lomba ICOSA 14</h1><p>Darul Hikmah</p></div>
    <div class="rc-code">Kode pendaftaran: ${esc(id)}<br><span style="font-weight:500">Dikirim: ${esc(waktu.toLocaleString("id-ID"))}</span></div>
    <h2>Lomba</h2>
    <table>${row("Golongan", data.golongan)}${row("Lomba", l.nama)}${row("Kategori", data.kategori)}</table>
    <h2>Identitas ${l.group ? "Ketua / Perwakilan" : "Peserta"}</h2>
    <table>${row("Nama lengkap", data.nama)}${row("NIS/NISN", data.nis)}${row("Kelas", data.kelas)}${row("Asal sekolah", data.sekolah)}${row("Tanggal lahir", tgl(data.tgl_lahir))}</table>
    ${anggota ? `<h2>Anggota Kelompok</h2><table>${anggota}</table>` : ""}
    <h2>Kontak</h2>
    <table>${row("WhatsApp peserta", data.wa)}${row("Email", data.email)}${row("Pendamping", data.pendamping)}${row("WhatsApp pendamping", data.wa_pendamping)}${row("Alamat", data.alamat)}${row("Pesan", data.pesan)}</table>
    <h2>Lampiran</h2>
    <div class="imgs">${img("Kartu pelajar", data.foto_kartu)}${img("Bukti follow Instagram", data.bukti_ig)}${img("Bukti transfer", data.bukti_tf)}</div>
    <div class="rc-foot">Simpan bukti ini. Tunjukkan kepada panitia bila diperlukan.</div>`;
  return el;
}

$("#dlBtn").onclick = async () => {
  if (!last) return;
  const b = $("#dlBtn"), old = b.textContent;
  b.disabled = true; b.textContent = "Menyiapkan gambar...";
  const el = buildReceipt(last);
  document.body.appendChild(el);
  try {
    await Promise.all([...el.querySelectorAll("img")].map((i) => i.decode().catch(() => {})));
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.download = `Bukti-Pendaftaran-${last.id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  } catch (e) {
    alert("Gagal membuat gambar bukti. Coba screenshot layar ini sebagai cadangan.");
  } finally {
    el.remove(); b.disabled = false; b.textContent = old;
  }
};
