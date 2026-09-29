const App = (() => {

  let openingStarted = false;


  /*
   * ============================================
   * ELEMENT
   * ============================================
   */

  const $ = (id) =>
    document.getElementById(id);


  /*
   * ============================================
   * MASUK KE APLIKASI
   * ============================================
   */

  function enterApplication() {

    if (openingStarted === "finished") {
      return;
    }

    openingStarted = "finished";


    const opening =
      $("opening");

    const app =
      $("app");


    /*
     * Hilangkan landing
     */
    if (opening) {

      opening.classList.add(
        "hidden"
      );
    }


    /*
     * Tampilkan aplikasi
     */
    if (app) {

      app.classList.remove(
        "hidden"
      );
    }


    /*
     * Jalankan jam
     */
    updateClock();

    setInterval(
      updateClock,
      1000
    );


    /*
     * Cek Google Sheets
     */
    checkConnection();
  }


  /*
   * ============================================
   * OPENING
   * ============================================
   */

  async function startOpening() {

    if (
      openingStarted === "playing" ||
      openingStarted === "finished"
    ) {
      return;
    }

    openingStarted = "playing";


    const hint =
      $("audioHint");

    const button =
      $("startOpening");


    if (hint) {
      hint.textContent =
        "Selamat datang di HADIRIN";
    }


    if (button) {
      button.classList.add(
        "hidden"
      );
    }


    /*
     * Coba autoplay audio
     */
    let played =
      await Voice.playWelcome();


    /*
     * Kalau browser memblokir autoplay,
     * tampilkan tombol.
     */
    if (!played) {

      openingStarted = false;

      if (hint) {
        hint.textContent =
          "Tekan tombol untuk masuk";
      }

      if (button) {
        button.classList.remove(
          "hidden"
        );
      }

      return;
    }


    /*
     * Audio selesai.
     * BARU pindah halaman.
     */
    enterApplication();
  }


  /*
   * ============================================
   * JIKA AUTOPLAY DIBLOKIR
   * ============================================
   */

  async function startOpeningByUser() {

    if (
      openingStarted === "playing" ||
      openingStarted === "finished"
    ) {
      return;
    }

    openingStarted = "playing";


    const hint =
      $("audioHint");

    const button =
      $("startOpening");


    if (button) {
      button.classList.add(
        "hidden"
      );
    }


    if (hint) {
      hint.textContent =
        "Selamat datang di HADIRIN";
    }


    /*
     * Karena user melakukan tap,
     * browser mengizinkan audio.
     */
    await Voice.playWelcomeAfterTap();


    /*
     * Audio selesai → masuk aplikasi.
     */
    enterApplication();
  }


  /*
   * ============================================
   * JAM WIB
   * ============================================
   */

  function getJakartaTime() {

    const timezone =
      (
        typeof CONFIG !== "undefined" &&
        CONFIG.TIMEZONE
      )
        ? CONFIG.TIMEZONE
        : "Asia/Jakarta";


    const parts =
      new Intl.DateTimeFormat(
        "id-ID",
        {
          timeZone: timezone,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }
      )
        .formatToParts(
          new Date()
        );


    return Object.fromEntries(
      parts.map((item) => [
        item.type,
        item.value
      ])
    );
  }


  function updateClock() {

    const dateElement =
      $("dateText");

    const timeElement =
      $("timeText");


    if (!dateElement ||
      !timeElement) {
      return;
    }


    const p =
      getJakartaTime();


    const months = [
      "JANUARI",
      "FEBRUARI",
      "MARET",
      "APRIL",
      "MEI",
      "JUNI",
      "JULI",
      "AGUSTUS",
      "SEPTEMBER",
      "OKTOBER",
      "NOVEMBER",
      "DESEMBER"
    ];


    dateElement.textContent =
      `${p.day} ${months[
      Number(p.month) - 1
      ]
      } ${p.year}`;


    timeElement.textContent =
      `${p.hour}:${p.minute}:${p.second} WIB`;


    updateAttendanceStatus(
      `${p.hour}:${p.minute}`
    );
  }


  /*
   * ============================================
   * STATUS WAKTU PRESENSI
   * ============================================
   */

  function updateAttendanceStatus(hm) {

    const status =
      $("sessionStatus");

    if (!status) return;

    const testingMode = true;

    if (testingMode) {
      status.textContent =
        "Mode testing kamera • Presensi sementara tidak dibatasi waktu";
      return;
    }


    const start =
      (
        typeof CONFIG !== "undefined" &&
        CONFIG.ATTENDANCE_START_TIME
      )
        ? CONFIG.ATTENDANCE_START_TIME
        : "11:00";


    const end =
      (
        typeof CONFIG !== "undefined" &&
        CONFIG.ATTENDANCE_END_TIME
      )
        ? CONFIG.ATTENDANCE_END_TIME
        : "13:30";


    if (hm < start) {

      status.textContent =
        "Presensi belum dibuka";

    } else if (hm >= end) {

      status.textContent =
        "Presensi sudah ditutup";

    } else {

      status.textContent =
        "Presensi aktif • 11:00–13:30 WIB";
    }
  }


  function isAttendanceOpen() {

    // Mode testing aktif sementara agar kamera/scan bisa dites di luar jam presensi.
    const testingMode = true;
    if (testingMode) return true;

    const p =
      getJakartaTime();


    const hm =
      `${p.hour}:${p.minute}`;


    const start =
      (
        typeof CONFIG !== "undefined" &&
        CONFIG.ATTENDANCE_START_TIME
      )
        ? CONFIG.ATTENDANCE_START_TIME
        : "11:00";


    const end =
      (
        typeof CONFIG !== "undefined" &&
        CONFIG.ATTENDANCE_END_TIME
      )
        ? CONFIG.ATTENDANCE_END_TIME
        : "13:30";


    return (
      hm >= start &&
      hm < end
    );
  }


  /*
   * ============================================
   * GOOGLE SHEETS CONNECTION
   * ============================================
   */

  async function checkConnection() {

    const connection =
      $("connection");

    if (!connection) return;


    try {

      const result =
        await Sheets.ping();


      connection.textContent =
        result
          ? "● Terhubung ke Google Sheets"
          : "● Koneksi Google Sheets bermasalah";

    } catch (error) {

      console.warn(
        "Google Sheets:",
        error
      );


      connection.textContent =
        "● Koneksi Google Sheets bermasalah";
    }
  }


  /*
   * ============================================
   * PESAN
   * ============================================
   */

  function showMessage(message) {

    const element =
      $("message");

    if (!element) return;


    element.textContent =
      message;


    element.classList.remove(
      "hidden"
    );
  }


  /*
   * ============================================
   * MULAI SCAN
   * ============================================
   */

  async function startScan() {

    if (!isAttendanceOpen()) {

      showMessage(
        "Presensi hanya dapat dilakukan pada pukul 11:00–13:30 WIB."
      );

      return;
    }


    const state =
      $("cameraState");


    if (state) {

      state.textContent =
        "Menyalakan kamera...";
    }


    try {

      Scanner.init(
        document.getElementById("camVideo"),
        document.getElementById("scanCanvas")
      );

      Scanner.setDetectedCallback(handleScan);

      await Scanner.start(
        handleScan
      );


      if (state) {

        state.textContent =
          "Kamera aktif • Arahkan QR";
      }


    } catch (error) {

      console.error(
        "Kamera:",
        error
      );


      if (state) {

        state.textContent =
          "Kamera tidak tersedia";
      }


      showMessage(
        "Kamera tidak dapat digunakan. Izinkan akses kamera dan buka website melalui HTTPS."
      );
    }
  }


  /*
   * ============================================
   * QR TERBACA
   * ============================================
   */

  async function handleScan(nim) {

    try {

      const state =
        $("cameraState");


      if (state) {

        state.textContent =
          "QR terbaca • Memeriksa data...";
      }


      /*
       * Cari mahasiswa
       */
      const student =
        await Sheets.findStudent(
          nim
        );


      const mataKuliah =
        student.mataKuliah ||
        (
          typeof CONFIG !== "undefined"
            ? CONFIG.DEFAULT_MATA_KULIAH
            : ""
        );


      if (state) {

        state.textContent =
          "Data ditemukan • Menyimpan...";
      }


      /*
       * Format POST TETAP:
       *
       * {
       *   nim,
       *   mataKuliah
       * }
       */
      const response =
        await Sheets.recordAttendance(
          nim,
          mataKuliah
        );


      /*
       * HANYA kalau backend sukses:
       * beep sudah terjadi di scanner,
       * lalu suara berhasil.
       */
      await Voice.success();


      await Scanner.stop();


      /*
       * Tampilkan hasil
       */
      showResult(
        student,
        response.data || {},
        mataKuliah
      );


    } catch (error) {

      console.error(
        "Presensi gagal:",
        error
      );


      showMessage(
        error.message ||
        "Presensi gagal."
      );


      try {
        Scanner.unlock();
      } catch (e) { }
    }
  }


  /*
   * ============================================
   * HASIL PRESENSI
   * ============================================
   */

  function showResult(
    student,
    data,
    course
  ) {

    const camera =
      $("cameraArea");

    const controls =
      $("controls");

    const result =
      $("resultCard");


    if (camera) {

      camera.classList.add(
        "hidden"
      );
    }


    if (controls) {

      controls.classList.add(
        "hidden"
      );
    }


    if (result) {

      result.classList.remove(
        "hidden"
      );
    }


    $("resultName").textContent =
      student.nama || "-";


    $("resultNim").textContent =
      `NIM ${student.nim || "-"}`;


    $("resultClass").textContent =
      student.kelas || "-";


    $("resultMajor").textContent =
      student.jurusan || "-";


    $("resultCourse").textContent =
      course || "-";


    const waktu =
      String(
        data.waktu || ""
      );


    const match =
      waktu.match(
        /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/
      );


    if (match) {

      $("resultDate").textContent =
        match[1];


      $("resultTime").textContent =
        `${match[2]} WIB`;

    } else {

      $("resultDate").textContent =
        "-";

      $("resultTime").textContent =
        "-";
    }
  }


  /*
   * ============================================
   * SCAN BERIKUTNYA
   * ============================================
   */

  async function nextScan() {

    $("resultCard")
      ?.classList
      .add("hidden");


    $("cameraArea")
      ?.classList
      .remove("hidden");


    $("controls")
      ?.classList
      .remove("hidden");


    await startScan();
  }


  /*
   * ============================================
   * GANTI KAMERA
   * ============================================
   */

  async function switchCamera() {

    try {

      Scanner.init(
        document.getElementById("camVideo"),
        document.getElementById("scanCanvas")
      );

      Scanner.setDetectedCallback(handleScan);

      await Scanner.switchCamera(
        handleScan
      );

    } catch (error) {

      console.error(
        "Ganti kamera:",
        error
      );


      showMessage(
        "Tidak dapat mengganti kamera."
      );
    }
  }


  /*
   * ============================================
   * TAB
   * ============================================
   */

  function openTab(tabName) {

    document
      .querySelectorAll(".tab")
      .forEach((button) => {

        button.classList.toggle(
          "active",
          button.dataset.tab ===
          tabName
        );
      });


    $("scanTab")
      ?.classList.toggle(
        "hidden",
        tabName !== "scan"
      );


    $("qrTab")
      ?.classList.toggle(
        "hidden",
        tabName !== "qr"
      );
  }


  /*
   * ============================================
   * INIT
   * ============================================
   */

  function init() {

    /*
     * Landing:
     * coba audio otomatis
     */
    setTimeout(
      startOpening,
      300
    );


    /*
     * Tombol fallback HP
     */
    $("startOpening")
      ?.addEventListener(
        "click",
        startOpeningByUser
      );


    /*
     * Scan
     */
    $("startScan")
      ?.addEventListener(
        "click",
        startScan
      );


    /*
     * Ganti kamera
     */
    $("switchCamera")
      ?.addEventListener(
        "click",
        switchCamera
      );


    /*
     * Scan berikutnya
     */
    $("nextScan")
      ?.addEventListener(
        "click",
        nextScan
      );


    /*
     * Tabs
     */
    document
      .querySelectorAll(".tab")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            openTab(
              button.dataset.tab
            );
          }
        );
      });


    /*
     * QR generator
     */
    $("generateQr")
      ?.addEventListener(
        "click",
        () => {

          try {

            QRGenerator.generate(
              $("nimInput").value
            );

          } catch (error) {

            showMessage(
              error.message
            );
          }
        }
      );


    $("downloadQr")
      ?.addEventListener(
        "click",
        () => {

          QRGenerator.download();
        }
      );
  }


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  return {};

})();