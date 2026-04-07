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

const formSteps = Array.from(document.querySelectorAll(".form-step"));
const stepDots = Array.from(document.querySelectorAll("[data-step-dot]"));
const nextButtons = Array.from(document.querySelectorAll(".step-next"));
const backButtons = Array.from(document.querySelectorAll(".step-back"));

const previewName = document.getElementById("previewName");
const previewEmail = document.getElementById("previewEmail");
const previewBusiness = document.getElementById("previewBusiness");
const previewService = document.getElementById("previewService");
const previewPlans = document.getElementById("previewPlans");
const previewGrid = document.getElementById("previewGrid");
const previewPlansWrap = document.getElementById("previewPlansWrap");
const modalActions = document.getElementById("modalActions");
const modalCopy = document.getElementById("modalCopy");
const submitSuccess = document.getElementById("submitSuccess");

let currentStep = 1;
let isSubmitting = false;

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

function getStepElement(stepNumber) {
  return formSteps.find((step) => Number(step.dataset.step) === stepNumber);
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
            <span>⌄</span>
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

  selectedPlansInput.value = names.join(" | ");
  selectedCategoriesInput.value = categories.join(" | ");
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
  const service = document.getElementById("service").value || "-";

  previewName.textContent = name;
  previewEmail.textContent = email;
  previewBusiness.textContent = business;
  previewService.textContent = service;

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
updateSelections();
updateStepUI();
resetModalState();

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
