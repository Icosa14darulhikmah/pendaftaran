const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1Y3JLki3lHkcsz7_sZVr_KLZ-31ivMxPmeqD_-alrd8P8YaRcpXUWRys99_d98ySC/exec";

const ALL_LOMBA = [
  { val: 'MHQ', label: "MHQ (Musabaqah Hifzil Qur'an)", gender: 'ALL' },
  { val: 'BADMINTON', label: 'Badminton', gender: 'ALL' },
  { val: 'LCCU', label: 'LCCU (Lomba Cerdas Cermat Umum)', gender: 'ALL' },
  { val: 'KALIGRAFI', label: 'Kaligrafi', gender: 'ALL' },
  { val: 'PIDATO', label: 'Pidato', gender: 'ALL' },
  { val: 'FUTSAL', label: 'Futsal', gender: 'Ikhwan' },
  { val: 'HASTA KARYA', label: 'Hasta Karya (Lomba Berkelompok)', gender: 'Akhwat' },
  { val: 'POSTER DIGITAL', label: 'Poster Digital', gender: 'ALL' }
];

const TEAM_LOMBA = ["LCCU", "FUTSAL", "HASTA KARYA"];

const form = document.getElementById('regForm');
const submitBtn = document.getElementById('submitBtn');
const statusText = document.getElementById('statusText');
const receipt = document.getElementById('receipt');
const golonganSelect = document.getElementById('golongan');
const lombaSelect = document.getElementById('lomba');
const teamSection = document.getElementById('teamSection');
const teamMembersList = document.getElementById('teamMembersList');
const addMemberBtn = document.getElementById('addMemberBtn');
const teamMemberTemplate = document.getElementById('teamMemberTemplate');

let memberCounter = 0;

function setFieldError(field, hasError){
  const wrap = field.closest('.field');
  if(wrap) wrap.classList.toggle('error', hasError);
}

golonganSelect.addEventListener('change', () => {
  const selectedGender = golonganSelect.value;
  lombaSelect.innerHTML = '<option value="" disabled selected>— Pilih salah satu —</option>';
  
  ALL_LOMBA.forEach(item => {
    if (item.gender === 'ALL' || item.gender === selectedGender) {
      const opt = document.createElement('option');
      opt.value = item.val;
      opt.textContent = item.label;
      lombaSelect.appendChild(opt);
    }
  });

  lombaSelect.disabled = false;
  setFieldError(golonganSelect, false);
  updateTeamSectionVisibility();
});

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

lombaSelect.addEventListener('change', () => {
  setFieldError(lombaSelect, false);
  updateTeamSectionVisibility();
});
addMemberBtn.addEventListener('click', addTeamMember);

form.querySelectorAll('[required]').forEach(el => {
  el.addEventListener('input', () => setFieldError(el, false));
  el.addEventListener('change', () => setFieldError(el, false));
});

function validate(){
  let valid = true;

  document.querySelectorAll('form [required]').forEach(el => {
    if(el.closest('.team-member')) return;
    const ok = el.value.trim().length > 0 && el.checkValidity();
    setFieldError(el, !ok);
    if(!ok) valid = false;
  });

  if(isTeamLomba()){
    const members = teamMembersList.querySelectorAll('.team-member');
    if(members.length === 0) valid = false;
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

  if(!validate()){
    statusText.textContent = "Beberapa data belum lengkap atau belum sesuai format.";
    statusText.className = "status err";
    return;
  }

  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  const payload = {
    action: 'register',
    golongan: data.golongan,
    lomba: data.lomba,
    nama_lengkap: data.nama_lengkap,
    nama_panggilan: data.nama_panggilan,
    nisn: data.nisn,
    kelas: data.kelas,
    asal_sekolah: data.asal_sekolah,
    tanggal_lahir: data.tanggal_lahir,
    nama_pembimbing: data.nama_pembimbing || '',
    wa_pembimbing: data.wa_pembimbing || '',
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
      lombaSelect.disabled = true;
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