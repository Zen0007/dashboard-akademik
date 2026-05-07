import {
  getFiles,
  deleteStudent,
  putFile,
  PostMahasiswa,
  deleteCourse,
} from "./firebase";

/* ========================================
           FUNGSI UTILITAS
           ======================================== */

// Konversi nilai angka ke huruf mutu dan bobot
function nilaiToMutu(nilai) {
  if (nilai >= 85) return { huruf: "A", bobot: 4.0 };
  if (nilai >= 80) return { huruf: "A-", bobot: 3.7 };
  if (nilai >= 75) return { huruf: "B+", bobot: 3.3 };
  if (nilai >= 70) return { huruf: "B", bobot: 3.0 };
  if (nilai >= 65) return { huruf: "B-", bobot: 2.7 };
  if (nilai >= 60) return { huruf: "C+", bobot: 2.3 };
  if (nilai >= 55) return { huruf: "C", bobot: 2.0 };
  if (nilai >= 50) return { huruf: "C-", bobot: 1.7 };
  if (nilai >= 40) return { huruf: "D", bobot: 1.0 };
  return { huruf: "E", bobot: 0.0 };
}

// Hitung IPK berdasarkan rumus: Total Nilai Mutu / Total SKS
function hitungIPK(matakuliahs) {
  let totalMutu = 0,
    totalSKS = 0;
  matakuliahs.forEach((mk) => {
    totalMutu += nilaiToMutu(mk.nilai).bobot * mk.sks;
    totalSKS += mk.sks;
  });
  return totalSKS === 0 ? 0 : totalMutu / totalSKS;
}

// Rata-rata nilai angka
function rataRata(matakuliahs) {
  if (matakuliahs.length === 0) return 0;
  const total = matakuliahs.reduce((s, m) => s + m.nilai, 0);
  return total / matakuliahs.length;
}

// Total SKS
function totalSKS(matakuliahs) {
  return matakuliahs.reduce((s, m) => s + m.sks, 0);
}

// Warna berdasarkan IPK
function ipkColor(ipk) {
  if (ipk >= 3.5) return "var(--success)";
  if (ipk >= 3.0) return "var(--info)";
  if (ipk >= 2.5) return "var(--warning)";
  if (ipk >= 2.0) return "var(--orange)";
  return "var(--danger)";
}

// Background hint berdasarkan IPK
function ipkBg(ipk) {
  if (ipk >= 3.5) return "rgba(0,229,160,0.12)";
  if (ipk >= 3.0) return "rgba(56,189,248,0.12)";
  if (ipk >= 2.5) return "rgba(251,191,36,0.12)";
  if (ipk >= 2.0) return "rgba(255,112,67,0.12)";
  return "rgba(244,63,94,0.12)";
}

// Warna badge huruf mutu
function hurufColor(huruf) {
  if (huruf === "A" || huruf === "A-")
    return "rgba(0,229,160,0.15);color:var(--success)";
  if (huruf === "B+" || huruf === "B" || huruf === "B-")
    return "rgba(56,189,248,0.15);color:var(--info)";
  if (huruf === "C+" || huruf === "C" || huruf === "C-")
    return "rgba(251,191,36,0.15);color:var(--warning)";
  return "rgba(244,63,94,0.15);color:var(--danger)";
}

// Inisial nama untuk avatar
function getInitials(nama) {
  return nama
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Avatar warna berdasarkan IPK
function avatarStyle(ipk) {
  const c = ipkColor(ipk);
  return `background:${ipkBg(ipk)};color:${c};border:1px solid ${c}33;`;
}

/* ========================================
           RENDER: STATISTIK
           ======================================== */
async function renderStats() {
  const data = await getFiles();

  const total = data.length;
  const avgIPK =
    total === 0
      ? 0
      : data.reduce((s, m) => s + hitungIPK(m.matakuliahs), 0) / total;
  const maxIPK =
    total === 0 ? 0 : Math.max(...data.map((m) => hitungIPK(m.matakuliahs)));
  const cumLaude = data.filter((m) => hitungIPK(m.matakuliahs) >= 3.5).length;

  document.getElementById("statsGrid").innerHTML = `
                <div class="stat-card s1">
                    <div class="stat-label">Total Mahasiswa</div>
                    <div class="stat-value">${total}</div>
                </div>
                <div class="stat-card s2">
                    <div class="stat-label">Rata-rata IPK</div>
                    <div class="stat-value">${avgIPK.toFixed(2)}</div>
                </div>
                <div class="stat-card s3">
                    <div class="stat-label">IPK Tertinggi</div>
                    <div class="stat-value">${maxIPK.toFixed(2)}</div>
                </div>
                <div class="stat-card s4">
                    <div class="stat-label">Cum Laude (>=3.50)</div>
                    <div class="stat-value">${cumLaude}</div>
                </div>
            `;
}

/* ========================================
           RENDER: DAFTAR MAHASISWA (LIST VIEW)
           ======================================== */
async function renderList() {
  const query = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const sort = document.getElementById("sortSelect").value;

  const students = await getFiles();

  // Filter berdasarkan pencarian
  let filtered = students.filter(
    (s) => s.nama.toLowerCase().includes(query) || s.nim.includes(query),
  );

  // Urutkan
  filtered.sort((a, b) => {
    const ipkA = hitungIPK(a.matakuliahs);
    const ipkB = hitungIPK(b.matakuliahs);
    switch (sort) {
      case "nama-asc":
        return a.nama.localeCompare(b.nama);
      case "nama-desc":
        return b.nama.localeCompare(a.nama);
      case "ipk-desc":
        return ipkB - ipkA;
      case "ipk-asc":
        return ipkA - ipkB;
      default:
        return 0;
    }
  });

  const container = document.getElementById("listView");

  if (filtered.length === 0) {
    container.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                        <p>Tidak ada mahasiswa ditemukan</p>
                    </div>
                `;
    return;
  }

  container.innerHTML = filtered
    .map((s, i) => {
      const ipk = hitungIPK(s.matakuliahs);
      const rata = rataRata(s.matakuliahs);

      console.log(s.firebaseId, i);
      return `
                    <article class="student-card" style="animation-delay:${i * 0.06}s"
                             onclick="showDetail('${s.firebaseId}')" tabindex="0"
                             onkeydown="if(event.key==='Enter')showDetail('${
                               s.firebaseId
                             }')"
                             aria-label="Detail ${s.nama}">
                        <div class="card-top">
                            <div style="display:flex;align-items:center;gap:12px">
                                <div class="student-avatar" style="${avatarStyle(ipk)}">${getInitials(s.nama)}</div>
                                <div>
                                    <div class="student-name">${s.nama}</div>
                                    <div class="student-nim">${s.nim}</div>
                                </div>
                            </div>
                            <div class="ipk-badge" style="background:${ipkBg(ipk)};color:${ipkColor(ipk)}">${ipk.toFixed(2)}</div>
                        </div>
                        <div class="card-meta">
                            <div class="meta-row">
                                <span class="meta-label">Dosen</span>
                                <span class="meta-value">${s.dosen}</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-label">Matakuliah</span>
                                <span class="meta-value">${s.matakuliahs.length} mata kuliah</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-label">Rata-rata Nilai</span>
                                <span class="meta-value">${rata.toFixed(1)}</span>
                            </div>
                        </div>
                        <div class="card-arrow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </div>
                    </article>
                `;
    })
    .join("");
}

/* ========================================
           RENDER: DETAIL MAHASISWA
======================================= */
export async function renderDetail(studentId) {
  console.log(studentId);
  const students = await getFiles();
  const s = students.find((m) => m.firebaseId === studentId);
  if (!s) return;

  const ipk = hitungIPK(s.matakuliahs);
  const tSKS = totalSKS(s.matakuliahs);

  // Hitung total nilai mutu untuk rumus
  let totalNilaiMutu = 0;
  s.matakuliahs.forEach((mk) => {
    totalNilaiMutu += nilaiToMutu(mk.nilai).bobot * mk.sks;
  });

  const container = document.getElementById("detailView");
  console.log(ipk);
  container.innerHTML = `
                <div class="detail-view">
                    <div class="detail-header">
                        <button class="back-btn" onclick="showList()" aria-label="Kembali ke daftar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <div class="detail-title">Detail Mahasiswa</div>
                        <div class="detail-actions">
                            <button class="btn btn-accent btn-sm" onclick="openModal('addCourse', '${
                              s.firebaseId
                            }')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Tambah Matakuliah
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDeleteStudent('${
                              s.firebaseId
                            }')" id="deleteStudentBtn${s.firebaseId}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                                Hapus
                            </button>
                        </div>
                    </div>
                    <div id="confirmBarStudent${s.firebaseId}"></div>

                    <!-- Info Card -->
                    <div class="info-card">
                        <div class="info-item">
                            <label>Nama Mahasiswa</label>
                            <span>${s.nama}</span>
                        </div>
                        <div class="info-item">
                            <label>NIM</label>
                            <span style="font-family:'Consolas','Courier New',monospace;letter-spacing:0.5px">${s.nim}</span>
                        </div>
                        <div class="info-item">
                            <label>Dosen Pembimbing</label>
                            <span>${s.dosen}</span>
                        </div>
                        <div class="info-item">
                            <label>IPK</label>
                            <span class="ipk-big" style="color:${ipkColor(ipk)}">${ipk.toFixed(2)}</span>
                        </div>
                        <div class="info-item">
                            <label>Total SKS</label>
                            <span>${tSKS} / 22 SKS</span>
                        </div>
                        
                        <div class="info-item">
                            <label>Jumlah Matakuliah</label>
                            <span>${s.matakuliahs.length}</span>
                        </div>
                    </div>

                    <!-- Tabel Matakuliah -->
                    <div class="table-wrapper">
                        <div class="table-header-bar">
                            <h3>Daftar Matakuliah & Nilai</h3>
                        </div>
                        ${
                          s.matakuliahs.length === 0
                            ? `
                            <div class="empty-state" style="padding:40px 20px">
                                <p>Belum ada matakuliah terdaftar</p>
                            </div>
                        `
                            : `
                            <table>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Matakuliah</th>
                                        <th>SKS</th>
                                        <th>Nilai</th>
                                        <th>Huruf</th>
                                        <th>Bobot</th>
                                        <th>Nilai Mutu</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${s.matakuliahs
                                      .map((mk, idx) => {
                                        const m = nilaiToMutu(mk.nilai);
                                        const nm = m.bobot * mk.sks;
                                        return `
                                            <tr id="courseRow${
                                              s.firebaseId
                                            }_${idx}">
                                                <td style="color:var(--text-3)">${idx + 1}</td>
                                                <td style="font-weight:500">${mk.nama}</td>
                                                <td>${mk.sks}</td>
                                                <td>${mk.nilai}</td>
                                                <td><span class="nilai-huruf" style="background:${hurufColor(m.huruf)}">${m.huruf}</span></td>
                                                <td>${m.bobot.toFixed(2)}</td>
                                                <td style="font-weight:600">${nm.toFixed(2)}</td>
                                                <td>
                                                    <div class="table-actions">
                                                        <button class="icon-btn" onclick="openModal('editCourse','${
                                                          s.firebaseId
                                                        }',${idx})" title="Edit" aria-label="Edit ${mk.nama}">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                            </svg>
                                                        </button>
                                                        <button class="icon-btn danger" onclick="confirmDeleteCourse('${
                                                          s.firebaseId
                                                        }',${idx})" title="Hapus" aria-label="Hapus ${mk.nama}" id="delCourseBtn${
                                                          s.firebaseId
                                                        }_${idx}">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr id="confirmRow${
                                              s.firebaseId
                                            }_${idx}" style="display:none">
                                                <td colspan="8" style="padding:0">
                                                    <div class="confirm-bar" style="border-radius:0;margin:0">
                                                        <span>Hapus matakuliah "${mk.nama}"?</span>
                                                        <div style="margin-left:auto;display:flex;gap:6px">
                                                            <button class="btn btn-danger btn-sm" onclick="deleteCourse('${
                                                              s.firebaseId
                                                            }',${idx})">Ya, Hapus</button>
                                                            <button class="btn btn-ghost btn-sm" onclick="cancelDeleteCourse('${
                                                              s.firebaseId
                                                            }',${idx})">Batal</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                      })
                                      .join("")}
                                </tbody>
                            </table>
                            <div class="ipk-formula">
                                <div>IPK = Total Nilai Mutu / Total SKS = <strong>${totalNilaiMutu.toFixed(2)}</strong> / <strong>${tSKS}</strong></div>
                                <div class="result" style="color:${ipkColor(ipk)}">= ${ipk.toFixed(2)}</div>
                            </div>
                        `
                        }
                    </div>
                </div>
            `;
}

/* ========================================
           NAVIGASI VIEW
           ======================================== */
function showDetail(id) {
  document.getElementById("listView").style.display = "none";
  document.getElementById("controlsSection").style.display = "none";
  document.getElementById("detailView").style.display = "block";
  renderDetail(id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showList() {
  document.getElementById("detailView").style.display = "none";
  document.getElementById("listView").style.display = "grid";
  document.getElementById("controlsSection").style.display = "flex";
  renderStats();
  renderList();
}

/* ========================================
           MODAL: BUKA & TUTUP
           ======================================== */
async function openModal(mode, studentId, courseIndex) {
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");

  let title = "";
  let bodyHTML = "";
  let submitText = "";
  let submitAction = "";

  const students = await getFiles();

  if (mode === "addStudent") {
    title = "Tambah Mahasiswa Baru";
    submitText = "Simpan";
    submitAction = `submitAddStudent()`;
    bodyHTML = `
                    <div class="form-group">
                        <label for="fNama">Nama Mahasiswa</label>
                        <input type="text" id="fNama" placeholder="Masukkan nama lengkap">
                        <div class="form-error" id="errNama">Nama mahasiswa wajib diisi</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fNim">NIM</label>
                            <input type="text" id="fNim" placeholder="Contoh: 202101009">
                            <div class="form-error" id="errNim">NIM wajib diisi</div>
                        </div>
                        <div class="form-group">
                            <label for="fDosen">Nama Dosen</label>
                            <input type="text" id="fDosen" placeholder="Nama dosen pembimbing">
                            <div class="form-error" id="errDosen">Nama dosen wajib diisi</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="fMk">Matakuliah</label>
                        <input type="text" id="fMk" placeholder="Nama matakuliah">
                        <div class="form-error" id="errMk">Nama matakuliah wajib diisi</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fNilai">Nilai (0-100)</label>
                            <input type="number" id="fNilai" placeholder="0 - 100" min="0" max="100">
                            <div class="form-error" id="errNilai">Nilai harus antara 0-100</div>
                        </div>
                        <div class="form-group">
                            <label for="fSks">SKS</label>
                            <input type="number" id="fSks" placeholder="1 - 6" min="1" max="6" value="3">
                            <div class="form-error" id="errSks">SKS harus antara 1-6</div>
                        </div>
                    </div>
                `;
  } else if (mode === "addCourse") {
    const s = students.find((m) => m.firebaseId === studentId);
    title = "Tambah Matakuliah";
    submitText = "Simpan";
    submitAction = `submitAddCourse('${studentId}')`;
    bodyHTML = `
                    <div class="form-group readonly">
                        <label>Nama Mahasiswa</label>
                        <input type="text" value="${s.nama}" readonly>
                    </div>
                    <div class="form-row">
                        <div class="form-group readonly">
                            <label>NIM</label>
                            <input type="text" value="${s.nim}" readonly>
                        </div>
                        <div class="form-group readonly">
                            <label>Dosen</label>
                            <input type="text" value="${s.dosen}" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="fMk">Matakuliah</label>
                        <input type="text" id="fMk" placeholder="Nama matakuliah">
                        <div class="form-error" id="errMk">Nama matakuliah wajib diisi</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fNilai">Nilai (0-100)</label>
                            <input type="number" id="fNilai" placeholder="0 - 100" min="0" max="100">
                            <div class="form-error" id="errNilai">Nilai harus antara 0-100</div>
                        </div>
                        <div class="form-group">
                            <label for="fSks">SKS</label>
                            <input type="number" id="fSks" placeholder="1 - 6" min="1" max="6" value="3">
                            <div class="form-error" id="errSks">SKS harus antara 1-6</div>
                        </div>
                    </div>
                `;
  } else if (mode === "editCourse") {
    const s = students.find((m) => m.firebaseId === studentId);
    const mk = s.matakuliahs[courseIndex];
    title = "Edit Matakuliah";
    submitText = "Perbarui";
    submitAction = `submitEditCourse('${studentId}',${courseIndex})`;
    bodyHTML = `
                    <div class="form-group readonly">
                        <label>Nama Mahasiswa</label>
                        <input type="text" value="${s.nama}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="fMk">Matakuliah</label>
                        <input type="text" id="fMk" value="${mk.nama}">
                        <div class="form-error" id="errMk">Nama matakuliah wajib diisi</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fNilai">Nilai (0-100)</label>
                            <input type="number" id="fNilai" value="${mk.nilai}" min="0" max="100">
                            <div class="form-error" id="errNilai">Nilai harus antara 0-100</div>
                        </div>
                        <div class="form-group">
                            <label for="fSks">SKS</label>
                            <input type="number" id="fSks" value="${mk.sks}" min="1" max="6">
                            <div class="form-error" id="errSks">SKS harus antara 1-6</div>
                        </div>
                    </div>
                `;
  }

  content.innerHTML = `
                <div class="modal-head">
                    <h2>${title}</h2>
                    <button class="close-btn" onclick="closeModal()" aria-label="Tutup modal">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="modalForm" onsubmit="event.preventDefault();${submitAction}">
                        ${bodyHTML}
                        <div class="form-actions">
                            <button type="button" class="btn btn-ghost" onclick="closeModal()">Batal</button>
                            <button type="submit" class="btn btn-accent">${submitText}</button>
                        </div>
                    </form>
                </div>
            `;

  overlay.style.display = "flex";
  // Fokus ke input pertama yang bisa diedit
  setTimeout(() => {
    const firstInput = content.querySelector("input:not([readonly])");
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeModal() {
  document.getElementById("modalOverlay").style.display = "none";
}

/* ========================================
           VALIDASI FORM
           ======================================== */
function clearErrors() {
  document
    .querySelectorAll(".form-error")
    .forEach((e) => e.classList.remove("show"));
}

function showError(id) {
  document.getElementById(id).classList.add("show");
}

function validateField(id, errId, condition) {
  if (!condition) {
    showError(errId);
    return false;
  }
  return true;
}

/* ========================================
           SUBMIT: TAMBAH MAHASISWA
           ======================================== */
async function submitAddStudent() {
  clearErrors();
  const nama = document.getElementById("fNama").value.trim();
  const nim = document.getElementById("fNim").value.trim();
  const dosen = document.getElementById("fDosen").value.trim();
  const mk = document.getElementById("fMk").value.trim();
  const nilai = parseInt(document.getElementById("fNilai").value);
  const sks = parseInt(document.getElementById("fSks").value);

  let valid = true;
  valid = validateField("fNama", "errNama", nama.length > 0) && valid;
  valid = validateField("fNim", "errNim", nim.length > 0) && valid;
  valid = validateField("fDosen", "errDosen", dosen.length > 0) && valid;
  valid = validateField("fMk", "errMk", mk.length > 0) && valid;
  valid =
    validateField(
      "fNilai",
      "errNilai",
      !isNaN(nilai) && nilai >= 0 && nilai <= 100,
    ) && valid;
  valid =
    validateField("fSks", "errSks", !isNaN(sks) && sks >= 1 && sks <= 6) &&
    valid;

  if (!valid) return;

  const newStudent = {
    nama,
    nim,
    dosen,
    matakuliahs: [{ nama: mk, nilai, sks }],
  };

  try {
    await PostMahasiswa(newStudent);

    closeModal();
    await renderStats();
    await renderList();

    showToast("Mahasiswa berhasil ditambahkan", "success");
  } catch (error) {
    console.error(error);
    showToast("Gagal menambahkan mahasiswa", "error");
  }

  // students.push({
  //   id: nextId++,
  //   nama,
  //   nim,
  //   dosen,
  //   matakuliahs: [{ nama: mk, nilai, sks }],
  // });

  // closeModal();
  // renderStats();
  // renderList();
  // showToast("Mahasiswa berhasil ditambahkan", "success");
}

/* ========================================
           SUBMIT: TAMBAH MATAKULIAH
           ======================================== */
async function submitAddCourse(studentId) {
  clearErrors();
  const mk = document.getElementById("fMk").value.trim();
  const nilai = parseInt(document.getElementById("fNilai").value);
  const sks = parseInt(document.getElementById("fSks").value);

  let valid = true;
  valid = validateField("fMk", "errMk", mk.length > 0) && valid;
  valid =
    validateField(
      "fNilai",
      "errNilai",
      !isNaN(nilai) && nilai >= 0 && nilai <= 100,
    ) && valid;
  valid =
    validateField("fSks", "errSks", !isNaN(sks) && sks >= 1 && sks <= 6) &&
    valid;

  if (!valid) return;
  const students = await getFiles();
  const s = students.find((m) => m.firebaseId === studentId);

  const newCourse = { nama: mk, nilai, sks };

  const updatedCourses = [...s.matakuliahs, newCourse];

  await putFile(studentId, {
    matakuliahs: updatedCourses,
  });

  s.matakuliahs = updatedCourses;

  // const s = students.find((m) => m.id === studentId);
  // s.matakuliahs.push({ nama: mk, nilai, sks });

  closeModal();
  renderDetail(studentId);
  showToast("Matakuliah berhasil ditambahkan", "success");
}

/* ========================================
           SUBMIT: EDIT MATAKULIAH
           ======================================== */
async function submitEditCourse(studentId, courseIndex) {
  clearErrors();
  const mk = document.getElementById("fMk").value.trim();
  const nilai = parseInt(document.getElementById("fNilai").value);
  const sks = parseInt(document.getElementById("fSks").value);

  let valid = true;
  valid = validateField("fMk", "errMk", mk.length > 0) && valid;
  valid =
    validateField(
      "fNilai",
      "errNilai",
      !isNaN(nilai) && nilai >= 0 && nilai <= 100,
    ) && valid;
  valid =
    validateField("fSks", "errSks", !isNaN(sks) && sks >= 1 && sks <= 6) &&
    valid;

  if (!valid) return;

  const students = await getFiles();

  const s = students.find((m) => m.firebaseId === studentId);

  const updatedCourses = [...s.matakuliahs];

  updatedCourses[courseIndex] = {
    nama: mk,
    nilai,
    sks,
  };

  await putFile(studentId, {
    matakuliahs: updatedCourses,
  });

  s.matakuliahs = updatedCourses;
  // const s = students.find((m) => m.id === studentId);
  // s.matakuliahs[courseIndex] = { nama: mk, nilai, sks };

  closeModal();
  renderDetail(studentId);
  showToast("Matakuliah berhasil diperbarui", "success");
}

/* ========================================
           HAPUS: KONFIRMASI & Aksi
           ======================================== */
function confirmDeleteStudent(id) {
  const bar = document.getElementById(`confirmBarStudent${id}`);
  if (!bar) return;
  bar.innerHTML = `
                <div class="confirm-bar">
                    <span>Hapus seluruh students mahasiswa ini?</span>
                    <div style="margin-left:auto;display:flex;gap:6px">
                        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${id}')">Ya, Hapus</button>
                        <button class="btn btn-ghost btn-sm" onclick="cancelDeleteStudent('${id}')">Batal</button>
                    </div>
                </div>
            `;
  document.getElementById(`deleteStudentBtn${id}`).style.display = "none";
}

function cancelDeleteStudent(id) {
  const bar = document.getElementById(`confirmBarStudent${id}`);
  if (bar) bar.innerHTML = "";
  const btn = document.getElementById(`deleteStudentBtn${id}`);
  if (btn) btn.style.display = "inline-flex";
}

// function deleteStudent(id) {
//   students = students.filter((s) => s.id !== id);
//   showToast("students mahasiswa berhasil dihapus", "error");
//   showList();
// }

function confirmDeleteCourse(studentId, courseIndex) {
  const row = document.getElementById(`confirmRow${studentId}_${courseIndex}`);
  const btn = document.getElementById(
    `delCourseBtn${studentId}_${courseIndex}`,
  );
  if (row) row.style.display = "table-row";
  if (btn) btn.style.display = "none";
}

function cancelDeleteCourse(studentId, courseIndex) {
  const row = document.getElementById(`confirmRow${studentId}_${courseIndex}`);
  const btn = document.getElementById(
    `delCourseBtn${studentId}_${courseIndex}`,
  );
  if (row) row.style.display = "none";
  if (btn) btn.style.display = "flex";
}

/* ========================================
           TOAST NOTIFIKASI
           ======================================== */
export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let iconSVG = "";
  if (type === "success") {
    iconSVG =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === "error") {
    iconSVG =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';
  } else {
    iconSVG =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = `
                <div class="toast-icon">${iconSVG}</div>
                <span>${message}</span>
            `;

  container.appendChild(toast);

  // Hapus otomatis setelah 3 detik
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ========================================
           EVENT LISTENER
           ======================================== */
document.getElementById("searchInput").addEventListener("input", renderList);
document.getElementById("sortSelect").addEventListener("change", renderList);
document.getElementById("addStudentBtn").addEventListener("click", async () => {
  console.log("clik add student ");
  await openModal("addStudent");
});

// Tutup modal dengan klik overlay atau tekan Escape
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.getElementById("modalOverlay").style.display === "flex") {
      closeModal();
    } else if (
      document.getElementById("detailView").style.display === "block"
    ) {
      showList();
    }
  }
});

/* ========================================
           TANGGAL HEADER
           ======================================== */
function setHeaderDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.getElementById("headerDate").textContent = now.toLocaleDateString(
    "id-ID",
    options,
  );
}

// ==================== THEME TOGGLE ====================
function initTheme() {
  const savedTheme = localStorage.getItem("dashboard-theme");
  const root = document.documentElement;
  const toggleBtn = document.getElementById("themeToggle");
  if (savedTheme === "light") {
    root.classList.add("light-mode");
    toggleBtn.textContent = "☀️";
  } else {
    root.classList.remove("light-mode");
    toggleBtn.textContent = "🌙";
  }
}

function toggleTheme() {
  const root = document.documentElement;
  const toggleBtn = document.getElementById("themeToggle");
  const isLight = root.classList.toggle("light-mode");
  toggleBtn.textContent = isLight ? "☀️" : "🌙";
  localStorage.setItem("dashboard-theme", isLight ? "light" : "dark");
}

/* ========================================
           INISIALISASI APLIKASI
           ======================================== */
async function init() {
  initTheme();
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  setHeaderDate();
  await renderStats();
  await renderList();
}

await init();

window.submitAddStudent = submitAddStudent;
window.submitAddCourse = submitAddCourse;
window.submitEditCourse = submitEditCourse;

window.closeModal = closeModal;

window.showDetail = showDetail;
window.showList = showList;

window.openModal = openModal;

window.confirmDeleteStudent = confirmDeleteStudent;
window.cancelDeleteStudent = cancelDeleteStudent;

window.confirmDeleteCourse = confirmDeleteCourse;
window.cancelDeleteCourse = cancelDeleteCourse;

window.deleteCourse = deleteCourse;
window.deleteStudent = deleteStudent;
