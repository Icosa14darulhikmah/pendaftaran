/* ======================================================================
   KONFIGURASI BACKEND (Google Apps Script Web App)
   ----------------------------------------------------------------------
   1. Buat Google Sheet baru (ini akan jadi database pendaftar).
   2. Buka menu Extensions > Apps Script.
   3. Ikuti panduan lengkap di file SETUP.md yang ada satu paket dengan
      file ini untuk mengisi kode backend dan men-deploy-nya sebagai
      Web App.
   4. Setelah deploy, kamu akan dapat URL seperti:
      https://script.google.com/macros/s/XXXXXXXX/exec
      Tempel URL itu ke APPS_SCRIPT_URL di bawah ini.

   PENTING: URL ini boleh terlihat publik (tidak masalah), karena semua
   validasi login admin dan penyimpanan data diproses di server Google
   Apps Script, bukan di file ini. Yang tidak boleh bocor adalah
   username/password admin dan SECRET_KEY, dan itu semua disimpan di
   Script Properties Apps Script, BUKAN di file ini.
   ====================================================================== */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeJJmDdrXFZnuN-FOaYnh_bREJjvcH-Zg5pb9vW5BrtyWob2wGpT7zzuyrMASEBoYC/exec";

const TEAM_LOMBA = ["LCCU", "FUTSAL"];

const form = document.getElementById('regForm');
const submitBtn = document.getElementById('submitBtn');
const statusText = document.getElementById('statusText');
const receipt = document.getElementById('receipt');
const lombaSelect = document.getElementById('lomba');
const teamSection = document.getElementById('teamSection');
const teamMembersList = document.getElementById('teamMembersList');
const addMemberBtn = document.getElementById('addMemberBtn');
const teamMemberTemplate = document.getElementById('teamMemberTemplate');

let memberCounter = 0;

function setFieldError(field, hasError){
  field.closest('.field').classList.toggle('error', hasError);
}

function isTeamLomba(){
  return TEAM_LOMBA.includes(lombaSelect.value);
}

function updateTeamSectionVisibility(){
  const show = isTeamLomba();
  teamSection.classList.toggle('hidden', !show);
  if(!show){
    teamMembersList.innerHTML = '';
    memberCounter = 0;
  } else if(teamMembersList.children.length === 0){
    addTeamMember();
  }
}

function addTeamMember(){
  memberCounter++;
  const node = teamMemberTemplate.content.cloneNode(true);
  const wrapper = node.querySelector('.team-member');
  wrapper.querySelector('.team-member-title').textContent = 'Anggota ' + memberCounter;
  wrapper.querySelectorAll('input[required]').forEach(el => {
    el.addEventListener('input', () => setFieldError(el, false));
  });
  wrapper.querySelector('.remove-member').addEventListener('click', () => {
    wrapper.remove();
    renumberTeamMembers();
  });
  teamMembersList.appendChild(node);
}

function renumberTeamMembers(){
  const blocks = teamMembersList.querySelectorAll('.team-member');
  blocks.forEach((block, idx) => {
    block.querySelector('.team-member-title').textContent = 'Anggota ' + (idx + 1);
  });
  memberCounter = blocks.length;
}

lombaSelect.addEventListener('change', updateTeamSectionVisibility);
addMemberBtn.addEventListener('click', addTeamMember);

form.querySelectorAll('[required]').forEach(el => {
  el.addEventListener('input', () => setFieldError(el, false));
  el.addEventListener('change', () => setFieldError(el, false));
});

function validate(){
  let valid = true;

  // Semua field required di luar blok anggota tim (lomba, identitas, kontak)
  document.querySelectorAll('form [required]').forEach(el => {
    if(el.closest('.team-member')) return; // handled separately below
    const ok = el.value.trim().length > 0 && el.checkValidity();
    setFieldError(el, !ok);
    if(!ok) valid = false;
  });

  if(isTeamLomba()){
    const members = teamMembersList.querySelectorAll('.team-member');
    if(members.length === 0){
      valid = false;
    }
    members.forEach(member => {
      member.querySelectorAll('input[required]').forEach(el => {
        const ok = el.value.trim().length > 0 && el.checkValidity();
        setFieldError(el, !ok);
        if(!ok) valid = false;
      });
    });
  }

  return valid;
}

function collectTeamMembers(){
  if(!isTeamLomba()) return [];
  const members = [];
  teamMembersList.querySelectorAll('.team-member').forEach(block => {
    members.push({
      nama_lengkap: block.querySelector('.tm-nama_lengkap').value.trim(),
      nisn: block.querySelector('.tm-nisn').value.trim(),
      kelas: block.querySelector('.tm-kelas').value.trim(),
      asal_sekolah: block.querySelector('.tm-asal_sekolah').value.trim(),
      tanggal_lahir: block.querySelector('.tm-tanggal_lahir').value.trim()
    });
  });
  return members;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  receipt.classList.remove('show');

  if(APPS_SCRIPT_URL.includes('PASTE_URL')){
    statusText.textContent = "Backend belum dikonfigurasi. Hubungi admin website.";
    statusText.className = "status err";
    return;
  }

  if(!validate()){
    statusText.textContent = "Beberapa data belum lengkap atau belum sesuai format.";
    statusText.className = "status err";
    return;
  }

  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  const payload = {
    action: 'register',
    lomba: data.lomba,
    nama_lengkap: data.nama_lengkap,
    nama_panggilan: data.nama_panggilan,
    nisn: data.nisn,
    kelas: data.kelas,
    asal_sekolah: data.asal_sekolah,
    tanggal_lahir: data.tanggal_lahir,
    wa: data.wa,
    email: data.email,
    alamat: data.alamat,
    pesan: data.pesan,
    anggota_tim: collectTeamMembers()
  };

  submitBtn.disabled = true;
  statusText.textContent = "Mengirim data ke panitia...";
  statusText.className = "status";

  try{
    // Content-Type text/plain menghindari CORS preflight pada Google Apps Script.
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if(result.ok){
      statusText.textContent = "Terkirim.";
      statusText.className = "status ok";
      receipt.classList.add('show');
      form.reset();
      teamMembersList.innerHTML = '';
      memberCounter = 0;
      teamSection.classList.add('hidden');
    } else {
      throw new Error(result.error || 'Gagal menyimpan data');
    }
  } catch(err){
    statusText.textContent = "Gagal mengirim (" + err.message + "). Coba lagi sebentar lagi.";
    statusText.className = "status err";
  } finally {
    submitBtn.disabled = false;
  }
});
