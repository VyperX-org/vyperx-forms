const pricingCategories = [
  {
    label: "UGC",
    plans: [
      { name: "Starter Creator", tagline: "Start creating content that builds trust." },
      { name: "Growth Creator", tagline: "Content designed to convert, not just look good." },
      { name: "Scale Creator Engine", tagline: "A complete content engine built to scale your revenue." },
    ],
  },
  {
    label: "Website Development",
    plans: [
      { name: "Launch Store", tagline: "Launch your brand with a strong digital foundation." },
      { name: "Growth Store", tagline: "Built to convert visitors into paying customers." },
      { name: "Scale Store Engine", tagline: "A complete eCommerce system designed for revenue growth." },
    ],
  },
  {
    label: "Marketing & Advertising",
    plans: [
      { name: "Launch Ads", tagline: "Start attracting your first customers with paid ads." },
      { name: "Growth Ads System", tagline: "Turn traffic into leads and leads into sales." },
      { name: "Scale Revenue Engine", tagline: "Scale aggressively with a performance-driven ad system." },
    ],
  },
  {
    label: "Social Media Management",
    plans: [
      { name: "Starter", tagline: "For brands that need consistent posting and page handling." },
      { name: "Growth", tagline: "For brands wanting stronger presentation and management." },
      { name: "Elite", tagline: "For premium account management and growth support." },
    ],
  },
];

const form = document.getElementById("bookCallForm");
const plansContainer = document.getElementById("plansContainer");
const selectionChip = document.getElementById("selectionChip");

const modal = document.getElementById("confirmModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const editBtn = document.getElementById("editBtn");
const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
const submitBtnLabel = confirmSubmitBtn.querySelector(".btn-label");

const selectedPlansInput = document.getElementById("selectedPlansInput");
const selectedCategoriesInput = document.getElementById("selectedCategoriesInput");
const vxSourceInput = document.getElementById("vxSourceInput");
const vxSelectedCountInput = document.getElementById("vxSelectedCountInput");
const vxPlanNamesInput = document.getElementById("vxPlanNamesInput");
const vxPlanTiersInput = document.getElementById("vxPlanTiersInput");
const vxTotalOriginalInput = document.getElementById("vxTotalOriginalInput");
const vxTotalDiscountedInput = document.getElementById("vxTotalDiscountedInput");
const vxTotalSavingsInput = document.getElementById("vxTotalSavingsInput");
const vxCurrencyInput = document.getElementById("vxCurrencyInput");
const vxPayloadInput = document.getElementById("vxPayloadInput");

const formSteps = Array.from(document.querySelectorAll(".form-step"));
const stepDots = Array.from(document.querySelectorAll("[data-step-dot]"));
const nextButtons = Array.from(document.querySelectorAll(".step-next"));
const backButtons = Array.from(document.querySelectorAll(".step-back"));

const previewName = document.getElementById("previewName");
const previewEmail = document.getElementById("previewEmail");
const previewBusiness = document.getElementById("previewBusiness");
const previewPlans = document.getElementById("previewPlans");
const previewGrid = document.getElementById("previewGrid");
const previewPlansWrap = document.getElementById("previewPlansWrap");
const modalActions = document.getElementById("modalActions");
const modalCopy = document.getElementById("modalCopy");
const submitSuccess = document.getElementById("submitSuccess");
const preferredCallDateInput = document.getElementById("preferredCallDate");
const preferredCallTimeInput = document.getElementById("preferredCallTime");
const preferredCallDay = document.getElementById("preferredCallDay");
const preferredCallError = document.getElementById("preferredCallError");
const openDatePickerButton = document.querySelector('[data-open-picker="date"]');
const openTimePickerButton = document.querySelector('[data-open-picker="time"]');

let currentStep = 1;
let isSubmitting = false;
const MIN_BOOKING_LEAD_HOURS = 5;
const TIME_STEP_MINUTES = 15;

const allowedMessageOrigins = new Set([
  "https://vyperx.in",
  "https://www.vyperx.in",
  "http://localhost:5173",
]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toStringSafe(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function parseNamesList(value) {
  return toStringSafe(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePlanName(value) {
  return toStringSafe(value).trim().toLowerCase();
}

function preselectPlansByName(planNames) {
  const normalized = new Set(planNames.map(normalizePlanName));
  const planInputs = Array.from(document.querySelectorAll('input[name="planChoice"]'));

  planInputs.forEach((input) => {
    input.checked = normalized.has(normalizePlanName(input.value));
  });

  updateSelections();
}

function applyExternalPackageData(data) {
  const source = toStringSafe(data.vx_source || data.source || "pricing");

  let planNames = [];
  if (Array.isArray(data.selectedPlanNames)) {
    planNames = data.selectedPlanNames.map(toStringSafe).filter(Boolean);
  } else if (Array.isArray(data.selectedPlans)) {
    planNames = data.selectedPlans
      .map((plan) => (typeof plan === "string" ? plan : plan?.name))
      .map(toStringSafe)
      .filter(Boolean);
  } else {
    planNames = parseNamesList(data.vx_plan_names);
  }

  const planTiers = Array.isArray(data.selectedPlanTiers)
    ? data.selectedPlanTiers.map(toStringSafe).filter(Boolean)
    : parseNamesList(data.vx_plan_tiers);

  const totalOriginal = toStringSafe(data.vx_total_original ?? data.totalOriginal);
  const totalDiscounted = toStringSafe(data.vx_total_discounted ?? data.totalDiscounted);
  const totalSavings = toStringSafe(data.vx_total_savings ?? data.totalSavings);
  const currency = toStringSafe(data.vx_currency || data.currency || "INR");

  vxSourceInput.value = source;
  vxSelectedCountInput.value = toStringSafe(data.vx_selected_count || data.selectedPlanNames?.length || planNames.length);
  vxPlanNamesInput.value = planNames.join(" | ");
  vxPlanTiersInput.value = planTiers.join(" | ");
  vxTotalOriginalInput.value = totalOriginal;
  vxTotalDiscountedInput.value = totalDiscounted;
  vxTotalSavingsInput.value = totalSavings;
  vxCurrencyInput.value = currency;

  const payloadValue = toStringSafe(data.vx_payload || JSON.stringify(data));
  vxPayloadInput.value = payloadValue;

  if (planNames.length) {
    preselectPlansByName(planNames);
  }
}

function prefillFromQueryParams() {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].some((key) => key.startsWith("vx_"))) {
    return;
  }

  const payloadRaw = params.get("vx_payload");
  const data = {
    vx_source: params.get("vx_source") || "pricing",
    vx_selected_count: params.get("vx_selected_count") || "",
    vx_plan_names: params.get("vx_plan_names") || "",
    vx_plan_tiers: params.get("vx_plan_tiers") || "",
    vx_total_original: params.get("vx_total_original") || "",
    vx_total_discounted: params.get("vx_total_discounted") || "",
    vx_total_savings: params.get("vx_total_savings") || "",
    vx_currency: params.get("vx_currency") || "INR",
    vx_payload: payloadRaw || "",
  };

  if (payloadRaw) {
    try {
      const parsedPayload = JSON.parse(payloadRaw);
      applyExternalPackageData({ ...data, ...parsedPayload });
      return;
    } catch {
      // Keep fallback behavior if payload is not valid JSON.
    }
  }

  applyExternalPackageData(data);
}

function handlePrefillMessage(event) {
  if (!allowedMessageOrigins.has(event.origin)) {
    return;
  }

  const message = event.data;
  if (!message || message.type !== "VYPERX_PACKAGE_PREFILL" || !message.payload) {
    return;
  }

  applyExternalPackageData(message.payload);
}

function getStepElement(stepNumber) {
  return formSteps.find((step) => Number(step.dataset.step) === stepNumber);
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function ceilToMinuteStep(date, stepMinutes) {
  const rounded = new Date(date.getTime());
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const remainder = minutes % stepMinutes;

  if (remainder !== 0) {
    rounded.setMinutes(minutes + (stepMinutes - remainder));
  }

  return rounded;
}

function getMinBookingDateTime() {
  const leadMs = MIN_BOOKING_LEAD_HOURS * 60 * 60 * 1000;
  return ceilToMinuteStep(new Date(Date.now() + leadMs), TIME_STEP_MINUTES);
}

function toLocalDateString(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function toLocalTimeString(date) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function parseSelectedDateTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function updatePreferredDayLabel(dateValue) {
  if (!preferredCallDay) return;

  if (!dateValue) {
    preferredCallDay.textContent = "";
    return;
  }

  const selectedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    preferredCallDay.textContent = "";
    return;
  }

  preferredCallDay.textContent = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function setPreferredScheduleError(message) {
  if (preferredCallError) {
    preferredCallError.textContent = message || "";
  }
}

function validatePreferredSchedule() {
  if (!preferredCallDateInput || !preferredCallTimeInput) return true;

  preferredCallDateInput.setCustomValidity("");
  preferredCallTimeInput.setCustomValidity("");
  setPreferredScheduleError("");

  const minDateTime = getMinBookingDateTime();
  const minDate = toLocalDateString(minDateTime);
  preferredCallDateInput.min = minDate;

  const selectedDate = preferredCallDateInput.value;
  const selectedTime = preferredCallTimeInput.value;

  updatePreferredDayLabel(selectedDate);

  if (selectedDate && !selectedTime) {
    const message = "Choose a preferred call time or clear the date.";
    preferredCallTimeInput.setCustomValidity(message);
    setPreferredScheduleError(message);
    return false;
  }

  if (selectedTime && !selectedDate) {
    const message = "Choose a preferred call date or clear the time.";
    preferredCallDateInput.setCustomValidity(message);
    setPreferredScheduleError(message);
    return false;
  }

  if (!selectedDate || !selectedTime) {
    return true;
  }

  const selectedDateTime = parseSelectedDateTime(selectedDate, selectedTime);
  if (Number.isNaN(selectedDateTime.getTime())) {
    const message = "Enter a valid call date and time.";
    preferredCallTimeInput.setCustomValidity(message);
    setPreferredScheduleError(message);
    return false;
  }

  const minTimeForSelectedDate =
    selectedDate === minDate ? toLocalTimeString(minDateTime) : "00:00";
  preferredCallTimeInput.min = minTimeForSelectedDate;

  if (selectedDateTime < minDateTime) {
    const message = `Select a call slot at least ${MIN_BOOKING_LEAD_HOURS} hours from now.`;
    preferredCallTimeInput.setCustomValidity(message);
    setPreferredScheduleError(message);
    return false;
  }

  return true;
}

function openNativePicker(input) {
  if (!input) return;

  input.focus();

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      // Fallback for browsers that block programmatic picker opening.
    }
  }

  try {
    input.click();
  } catch {
    // Keep focus fallback for browsers that disallow synthetic click opening.
  }
}

function updateStepUI() {
  formSteps.forEach((step) => {
    const stepNumber = Number(step.dataset.step);
    const isActive = stepNumber === currentStep;
    step.hidden = !isActive;
    step.classList.toggle("active", isActive);
  });

  stepDots.forEach((dot) => {
    const stepNumber = Number(dot.dataset.stepDot);
    dot.classList.toggle("active", stepNumber === currentStep);
    dot.classList.toggle("done", stepNumber < currentStep);
  });
}

function goToStep(stepNumber) {
  currentStep = stepNumber;
  updateStepUI();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateCurrentStep() {
  const currentStepEl = getStepElement(currentStep);
  if (!currentStepEl) return true;

  const requiredFields = Array.from(
    currentStepEl.querySelectorAll("input[required], select[required], textarea[required]")
  );

  for (const field of requiredFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      field.focus();
      return false;
    }
  }

  if (!validatePreferredSchedule()) {
    if (!preferredCallDateInput.checkValidity()) {
      preferredCallDateInput.reportValidity();
      preferredCallDateInput.focus();
      return false;
    }

    if (!preferredCallTimeInput.checkValidity()) {
      preferredCallTimeInput.reportValidity();
      preferredCallTimeInput.focus();
      return false;
    }
  }

  return true;
}

function renderPlans() {
  plansContainer.innerHTML = pricingCategories
    .map((category, index) => {
      const plansHtml = category.plans
        .map((plan, planIndex) => {
          const planId = `plan-${index}-${planIndex}`;
          return `
            <label class="plan-card" for="${planId}">
              <input
                type="checkbox"
                id="${planId}"
                name="planChoice"
                value="${escapeHtml(plan.name)}"
                data-category="${escapeHtml(category.label)}"
                data-tagline="${escapeHtml(plan.tagline)}"
              />
              <div>
                <h4>${escapeHtml(plan.name)}</h4>
                <p>${escapeHtml(plan.tagline)}</p>
              </div>
            </label>
          `;
        })
        .join("");

      return `
        <div class="plan-category ${index === 0 ? "open" : ""}">
          <button class="category-head" type="button">
            <span>${escapeHtml(category.label)}</span>
            <span>▼</span>
          </button>
          <div class="plan-list" ${index === 0 ? "" : "hidden"}>
            ${plansHtml}
          </div>
        </div>
      `;
    })
    .join("");
}

function updateSelections() {
  const checked = Array.from(document.querySelectorAll('input[name="planChoice"]:checked'));

  document.querySelectorAll(".plan-card").forEach((card) => card.classList.remove("selected"));
  checked.forEach((input) => input.closest(".plan-card").classList.add("selected"));

  const names = checked.map((input) => input.value);
  const categories = [...new Set(checked.map((input) => input.dataset.category))];

  selectedPlansInput.value = names.join(", ");
  selectedCategoriesInput.value = categories.join(", ");
  selectionChip.textContent = `${names.length} plan${names.length === 1 ? "" : "s"} selected`;

}

function resetModalState() {
  previewGrid.hidden = false;
  previewPlansWrap.hidden = false;
  modalActions.hidden = false;
  submitSuccess.hidden = true;
  modalCopy.textContent = "Review your details and selected plans. Once confirmed, your request will be submitted.";
  submitBtnLabel.textContent = "Confirm & Book Call";
  confirmSubmitBtn.classList.remove("is-loading");
  confirmSubmitBtn.disabled = false;
}

function openModal() {
  resetModalState();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function fillPreview() {
  const name = document.getElementById("name").value.trim() || "-";
  const email = document.getElementById("email").value.trim() || "-";
  const business = document.getElementById("business").value.trim() || "-";

  previewName.textContent = name;
  previewEmail.textContent = email;
  previewBusiness.textContent = business;

  const checked = Array.from(document.querySelectorAll('input[name="planChoice"]:checked'));
  if (!checked.length) {
    previewPlans.innerHTML = '<span class="preview-plan-chip">No plan selected yet</span>';
    return;
  }

  previewPlans.innerHTML = checked
    .map((input) => `<span class="preview-plan-chip">${escapeHtml(input.value)}</span>`)
    .join("");
}

async function submitToNetlify() {
  const formData = new FormData(form);
  formData.set("form-name", "Book a Call");

  const encodedBody = new URLSearchParams(formData).toString();
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedBody,
  });

  if (!response.ok) {
    throw new Error("Submission failed");
  }
}

function showSubmitSuccess() {
  confirmSubmitBtn.classList.remove("is-loading");
  confirmSubmitBtn.disabled = false;
  previewGrid.hidden = true;
  previewPlansWrap.hidden = true;
  modalActions.hidden = true;
  modalCopy.textContent = "Your call booking has been confirmed.";
  submitSuccess.hidden = false;
}

renderPlans();
prefillFromQueryParams();
updateSelections();
validatePreferredSchedule();
updateStepUI();
resetModalState();

window.addEventListener("message", handlePrefillMessage);

plansContainer.addEventListener("click", (event) => {
  const button = event.target.closest(".category-head");
  if (!button) return;

  const category = button.closest(".plan-category");
  const list = category.querySelector(".plan-list");
  const isOpen = category.classList.toggle("open");
  list.hidden = !isOpen;
});

plansContainer.addEventListener("change", (event) => {
  if (!event.target.matches('input[name="planChoice"]')) return;
  updateSelections();
});

if (preferredCallDateInput && preferredCallTimeInput) {
  preferredCallDateInput.addEventListener("change", () => {
    validatePreferredSchedule();
  });

  preferredCallTimeInput.addEventListener("change", () => {
    validatePreferredSchedule();
  });
}

if (openDatePickerButton && preferredCallDateInput) {
  openDatePickerButton.addEventListener("click", () => {
    openNativePicker(preferredCallDateInput);
  });
}

if (openTimePickerButton && preferredCallTimeInput) {
  openTimePickerButton.addEventListener("click", () => {
    openNativePicker(preferredCallTimeInput);
  });
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!validateCurrentStep()) return;
    goToStep(Number(button.dataset.nextStep));
  });
});

backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    goToStep(Number(button.dataset.prevStep));
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateCurrentStep()) return;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  updateSelections();
  fillPreview();
  openModal();
});

confirmSubmitBtn.addEventListener("click", async () => {
  if (isSubmitting) return;

  try {
    isSubmitting = true;
    confirmSubmitBtn.disabled = true;
    confirmSubmitBtn.classList.add("is-loading");
    submitBtnLabel.textContent = "Submitting...";

    // Keep spinner visible briefly so users can clearly see submit progress.
    await Promise.all([submitToNetlify(), wait(900)]);
    showSubmitSuccess();

    form.reset();
    document.querySelectorAll('input[name="planChoice"]').forEach((input) => {
      input.checked = false;
    });
    updateSelections();
    goToStep(1);
  } catch (error) {
    confirmSubmitBtn.disabled = false;
    confirmSubmitBtn.classList.remove("is-loading");
    submitBtnLabel.textContent = "Confirm & Book Call";
    alert("Submission failed. Please try again in a moment.");
  } finally {
    isSubmitting = false;
  }
});

closeModalBtn.addEventListener("click", closeModal);
editBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target.matches('[data-close-modal="true"]')) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});
