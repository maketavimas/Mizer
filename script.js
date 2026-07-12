const modal = document.getElementById("modal");
const downloadBtn = document.getElementById("downloadBtn");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const cancelBtnTop = document.getElementById("cancelBtnTop");
const emailInput = document.getElementById("email");
const termsCheckbox = document.getElementById("termsCheckbox");
const marketingCheckbox = document.getElementById("marketingCheckbox");

let turnstileToken = "";

// ─── OPEN MODAL ───────────────────────────────────────────────────────────────
downloadBtn.addEventListener("click", () => {
  modal.classList.add("is-open");
  updateConfirmState();
});

// ─── CLOSE MODAL ─────────────────────────────────────────────────────────────
cancelBtn.addEventListener("click", closeModal);
cancelBtnTop.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

function closeModal() {
  modal.classList.remove("is-open");
  emailInput.value = "";
  termsCheckbox.checked = false;
  marketingCheckbox.checked = false;
  clearError();
  resetTurnstile();
  updateConfirmState();
}

// ─── TERMS CHECKBOX GATING ─────────────────────────────────────────────────
// Confirm stays disabled until Terms and Conditions are accepted.
function updateConfirmState() {
  confirmBtn.disabled = !termsCheckbox.checked;
}

termsCheckbox.addEventListener("change", () => {
  updateConfirmState();
  clearError();
});

// ─── TURNSTILE (implicit render via data-sitekey HTML attribute) ──────────────
// Widget is rendered by Turnstile script using data-sitekey on the div element.
// JS only receives the callback token and handles reset when needed.
window.onTurnstileSuccess = function (token) {
  console.log("TURNSTILE OK:", token);
  turnstileToken = token;
};

// ─── Turnstile reset ──────────────────────────────────────────────────────────
function resetTurnstile() {
  turnstileToken = "";
  try {
    if (typeof turnstile !== "undefined") {
      turnstile.reset();
    }
  } catch (e) {
    console.warn("Turnstile reset failed:", e);
  }
}

// ─── Frontend email validation (UX only) ─────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Error helpers ────────────────────────────────────────────────────────────
function showError(message) {
  clearError();
  const err = document.createElement("p");
  err.id = "error-msg";
  err.style.cssText = "color:#c0392b; margin: -6px 0 14px; font-size: 13.5px;";
  err.textContent = message;
  confirmBtn.closest(".buttons").insertAdjacentElement("beforebegin", err);
  setTimeout(() => err.remove(), 5000);
}

function clearError() {
  const existing = document.getElementById("error-msg");
  if (existing) existing.remove();
}

// ─── Double-submit protection ─────────────────────────────────────────────────
function setLoading(isLoading) {
  confirmBtn.disabled = isLoading || !termsCheckbox.checked;
  confirmBtn.textContent = isLoading ? "Checking..." : "Confirm";
}

// ─── CONFIRM FLOW ─────────────────────────────────────────────────────────────
confirmBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  // Terms gate (defense in depth — button is disabled, but double-check)
  if (!termsCheckbox.checked) {
    showError("Please accept the Terms and Conditions.");
    return;
  }

  // Frontend validation
  if (!email) {
    showError("Please enter your email address.");
    return;
  }
  if (!isValidEmail(email)) {
    showError("Invalid email format.");
    return;
  }
  if (!turnstileToken) {
    showError("Please complete the verification.");
    return;
  }

  // Disable button while request is in flight
  setLoading(true);
  clearError();

  try {
    const res = await fetch("https://download-gate.maketavimas.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken, marketingConsent: marketingCheckbox.checked }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Reset Turnstile after failed request
      resetTurnstile();
      showError(data.error || "Request blocked.");
      return;
    }

    closeModal();
    window.location.href = data.downloadUrl;

  } catch (err) {
    console.error(err);
    resetTurnstile();
    showError("Server error. Please try again later.");
  } finally {
    setLoading(false);
  }
});

// ─── MOBILE NAV TOGGLE ────────────────────────────────────────────────────────
const navToggle = document.getElementById("navToggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────────
document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const item = trigger.closest(".accordion-item");
    const panel = item.querySelector(".accordion-panel");
    const isOpen = trigger.getAttribute("aria-expanded") === "true";

    trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
  });
});

// ─── CONTACT MODAL ────────────────────────────────────────────────────────────
const contactModal     = document.getElementById("contactModal");
const contactNavBtn    = document.getElementById("contactNavBtn");
const contactModalClose = document.getElementById("contactModalClose");

function openContactModal() {
  contactModal.classList.add("is-open");
}

function closeContactModal() {
  contactModal.classList.remove("is-open");
  document.getElementById("cf-status").textContent = "";
  document.getElementById("cf-status").className = "form-status";
  document.getElementById("contactForm").reset();
}

if (contactNavBtn) {
  contactNavBtn.addEventListener("click", (e) => {
    e.preventDefault();
    mainNav.classList.remove("is-open");
    navToggle && navToggle.setAttribute("aria-expanded", "false");
    openContactModal();
  });
}

if (contactModalClose) {
  contactModalClose.addEventListener("click", closeContactModal);
}

contactModal.addEventListener("click", (e) => {
  if (e.target === contactModal) closeContactModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && contactModal.classList.contains("is-open")) closeContactModal();
});

// ─── CONTACT FORM (Web3Forms) ─────────────────────────────────────────────────
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const submitBtn = document.getElementById("cf-submit");
  const statusEl  = document.getElementById("cf-status");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    statusEl.textContent = "";
    statusEl.className = "form-status";

    try {
      const formData = new FormData(contactForm);

      // Append the subject field manually (named "subject_field" in HTML
      // to avoid collision with the hidden "subject" field for Web3Forms).
      // Web3Forms uses the hidden "subject" field as the email subject line.
      const subjectValue = formData.get("subject_field");
      formData.set("subject", `New message from Textymizer.com: ${subjectValue}`);
      formData.delete("subject_field");

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        statusEl.textContent = "Message sent. We'll get back to you soon.";
        statusEl.className = "form-status success";
        contactForm.reset();
        setTimeout(closeContactModal, 2500);
      } else {
        statusEl.textContent = data.message || "Something went wrong. Please try again.";
        statusEl.className = "form-status error";
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Server error. Please try again later.";
      statusEl.className = "form-status error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send message";
    }
  });
}
