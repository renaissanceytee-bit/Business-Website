const PHONE_NUMBER = "407-906-9903";
const BUSINESS_EMAIL = "cvexteriorsolutions@yahoo.com";
const SMS_LINK = "sms:+14079069903";
const SQUARE_BOOKING_URL = "https://app.squareup.com/appointments/book/brh6uerfn3mnqo/LN2R6XZTSK06G/start";
const GOOGLE_REVIEWS_URL = "https://g.page/r/CfCPTIdYN4OvEAE/review";

const SERVICE_META = {
  roof: { name: "Roof Cleaning" },
  window: { name: "Window Cleaning" },
  solar: { name: "Solar Panel Cleaning" },
  fence: { name: "Fence Cleaning" },
  gutter: { name: "Gutter Cleaning" }
};

const ADDON_PRIORITY = ["solar", "gutter", "window", "fence", "roof"];

function getTransportationDiscount(total) {
  if (total <= 0) return 0;
  return total > 300 ? 100 : 50;
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function setupMobileMenu() {
  const button = document.querySelector(".mobile-menu-btn");
  const nav = document.querySelector(".nav-links");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

function setupPopups() {
  const popup = document.getElementById("offerPopup");
  if (!popup) return;

  const closeBtn = popup.querySelector(".popup-close");
  const offerShown = localStorage.getItem("offerShown") === "true";

  const showPopup = () => {
    if (popup.classList.contains("show")) return;
    popup.classList.add("show");
    localStorage.setItem("offerShown", "true");
  };

  if (!offerShown) {
    setTimeout(showPopup, 8000);
  }

  document.addEventListener("mouseleave", (event) => {
    if (event.clientY <= 0 && localStorage.getItem("exitIntentShown") !== "true") {
      showPopup();
      localStorage.setItem("exitIntentShown", "true");
    }
  });

  closeBtn?.addEventListener("click", () => {
    popup.classList.remove("show");
  });

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      popup.classList.remove("show");
    }
  });
}

function setupContactHelpers() {
  document.querySelectorAll("[data-phone]").forEach((node) => {
    node.textContent = PHONE_NUMBER;
  });

  document.querySelectorAll("[data-email-link]").forEach((node) => {
    node.setAttribute("href", `mailto:${BUSINESS_EMAIL}`);
    node.textContent = BUSINESS_EMAIL;
  });

  document.querySelectorAll("[data-sms-link]").forEach((node) => {
    node.setAttribute("href", `${SMS_LINK}?body=Hi%2C%20I%20want%20a%20fast%20quote.`);
  });
}

function setupGoogleReviewLinks() {
  document.querySelectorAll("[data-google-reviews]").forEach((node) => {
    node.setAttribute("href", GOOGLE_REVIEWS_URL);
  });

  document.querySelectorAll("[data-google-write-review]").forEach((node) => {
    node.setAttribute("href", GOOGLE_REVIEWS_URL);
  });
}

function getSelectedServices() {
  const checks = document.querySelectorAll("input[name='service']:checked");
  return [...checks].map((item) => item.value).filter((key) => SERVICE_META[key]);
}

function getInputs() {
  return {
    homeSqft: Number(document.getElementById("homeSquareFeet")?.value || 0),
    windows: Number(document.getElementById("windowCount")?.value || 0),
    solarPanels: Number(document.getElementById("solarPanelCount")?.value || 0),
    fenceFeet: Number(document.getElementById("fenceFeet")?.value || 0)
  };
}

function estimateService(key, inputs, selectedServices = []) {
  if (key === "roof") {
    if (!inputs.homeSqft) return { amount: 0, detail: "Add home square footage" };
    const roundedSqft = Math.round(inputs.homeSqft / 500) * 500;
    const billableSqft = Math.max(2000, roundedSqft);
    const increments = Math.max(0, (billableSqft - 2000) / 500);
    const amount = 350 + increments * 100;
    return { amount, detail: `${billableSqft.toLocaleString()} sq ft tier` };
  }

  if (key === "window") {
    if (!inputs.windows) return { amount: 0, detail: "Add number of windows" };
    if (inputs.windows <= 15) return { amount: 200, detail: "1-15 windows" };
    if (inputs.windows <= 25) return { amount: 240, detail: "16-25 windows" };
    if (inputs.windows <= 40) return { amount: 295, detail: "26-40 windows" };
    return { amount: 360, detail: "41+ windows (starting tier)" };
  }

  if (key === "solar") {
    if (!inputs.solarPanels) return { amount: 0, detail: "Add number of solar panels" };
    const hasWindowCleaning = selectedServices.includes("window");
    const firstTen = Math.min(inputs.solarPanels, 10) * 15;
    const afterTen = Math.max(inputs.solarPanels - 10, 0) * 5;
    const baseAmount = firstTen + afterTen;

    if (hasWindowCleaning) {
      const discount = inputs.solarPanels * 5;
      const discountedAmount = Math.max(0, baseAmount - discount);
      return {
        amount: discountedAmount,
        detail: `${inputs.solarPanels} panels ($5 off per panel with Window Cleaning)`
      };
    }

    return { amount: baseAmount, detail: `${inputs.solarPanels} panels` };
  }

  if (key === "fence") {
    if (!inputs.fenceFeet) return { amount: 0, detail: "Add fence length in feet" };
    return { amount: inputs.fenceFeet * 2, detail: `${inputs.fenceFeet} linear ft` };
  }

  if (key === "gutter") {
    if (!inputs.homeSqft) return { amount: 0, detail: "Add home square footage" };
    const hasRoofCleaning = selectedServices.includes("roof");
    let amount = 200;
    let detail = "3,000+ sq ft (starting tier)";

    if (inputs.homeSqft < 2000) {
      amount = 100;
      detail = "Under 2,000 sq ft";
    } else if (inputs.homeSqft <= 3000) {
      amount = 150;
      detail = "2,000-3,000 sq ft";
    }

    if (inputs.homeSqft >= 3500 && hasRoofCleaning) {
      return { amount: amount / 2, detail: `${detail} (50% off with roof cleaning)` };
    }

    return { amount, detail };
  }

  return { amount: 0, detail: "Custom quote at booking" };
}

function calculateQuote(serviceKeys, inputs) {
  const rows = serviceKeys.map((key) => {
    const estimate = estimateService(key, inputs, serviceKeys);
    return {
      key,
      name: SERVICE_META[key].name,
      amount: estimate.amount,
      detail: estimate.detail
    };
  });

  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const bundleDiscount = serviceKeys.length >= 3 ? subtotal * 0.15 : 0;
  const total = Math.max(0, subtotal - bundleDiscount);
  return { rows, subtotal, bundleDiscount, total };
}

function isQuoteReady(result, selectedServices) {
  if (!selectedServices.length) return false;
  return result.rows.every((row) => row.amount > 0);
}

function toggleRelevantInputGroups(selectedServices) {
  const homeSqftGroup = document.getElementById("homeSquareFeetGroup");
  const windowCountGroup = document.getElementById("windowCountGroup");
  const solarPanelCountGroup = document.getElementById("solarPanelCountGroup");
  const fenceFeetGroup = document.getElementById("fenceFeetGroup");

  const showHomeSqft = selectedServices.includes("roof") || selectedServices.includes("gutter");
  const showWindowCount = selectedServices.includes("window");
  const showSolarPanelCount = selectedServices.includes("solar");
  const showFenceFeet = selectedServices.includes("fence");

  if (homeSqftGroup) homeSqftGroup.style.display = showHomeSqft ? "block" : "none";
  if (windowCountGroup) windowCountGroup.style.display = showWindowCount ? "block" : "none";
  if (solarPanelCountGroup) solarPanelCountGroup.style.display = showSolarPanelCount ? "block" : "none";
  if (fenceFeetGroup) fenceFeetGroup.style.display = showFenceFeet ? "block" : "none";
}

function renderQuote(result) {
  const totalNode = document.getElementById("quoteTotal");
  const listNode = document.getElementById("quoteBreakdown");
  if (!totalNode || !listNode) return;
  listNode.innerHTML = "";

  if (!result.rows.length) {
    totalNode.textContent = "--";
    const li = document.createElement("li");
    li.textContent = "Select service(s) and enter details to get your price.";
    listNode.appendChild(li);
    return;
  }

  const ready = result.rows.every((row) => row.amount > 0);
  totalNode.textContent = ready ? currency(result.total) : "--";

  result.rows.forEach((row) => {
    const li = document.createElement("li");
    li.textContent = row.amount > 0
      ? `${row.name}: ${currency(row.amount)}`
      : `${row.name}: enter required details`;
    listNode.appendChild(li);
  });

  if (ready && result.bundleDiscount > 0) {
    const li = document.createElement("li");
    li.textContent = `3+ services bundle discount (15%): -${currency(result.bundleDiscount)}`;
    listNode.appendChild(li);
  }
}

function getContextualAddons(selected) {
  const addonKeys = [];

  if (selected.includes("window") && !selected.includes("solar")) addonKeys.push("solar");
  if (selected.includes("roof") && !selected.includes("gutter")) addonKeys.push("gutter");
  if (selected.includes("gutter") && !selected.includes("roof")) addonKeys.push("roof");
  if (selected.includes("solar") && !selected.includes("window")) addonKeys.push("window");
  if (selected.includes("fence") && !selected.includes("gutter")) addonKeys.push("gutter");

  ADDON_PRIORITY.forEach((key) => {
    if (!selected.includes(key) && !addonKeys.includes(key)) {
      addonKeys.push(key);
    }
  });

  return addonKeys;
}

function renderAddonOffers(inputs, selected) {
  const mount = document.getElementById("addonOffers");
  if (!mount) return;

  const availableAddons = getContextualAddons(selected);
  mount.innerHTML = "";

  if (!availableAddons.length) {
    mount.innerHTML = "<p class='small-note'>All available services are currently selected.</p>";
    return;
  }

  const heading = document.createElement("p");
  heading.className = "kicker";
  heading.textContent = "Special Add-On Offers";
  mount.appendChild(heading);

  availableAddons.slice(0, 3).forEach((key) => {
    const estimate = estimateService(key, inputs, selected);
    let recommendation = "Great add-on to complete the job in one visit.";

    if (key === "gutter") recommendation = "Protect fascia and avoid overflow after roof cleaning.";
    if (key === "solar") recommendation = "Bundle with Window Cleaning for $5 OFF per solar panel.";
    if (key === "window") recommendation = "Pair with roof cleaning for full front-elevation curb appeal.";
    if (key === "fence") recommendation = "Finish the exterior look by restoring weathered fence surfaces.";

    const card = document.createElement("div");
    card.className = "addon-card";
    card.setAttribute("data-add-service", key);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <p><strong>${SERVICE_META[key].name}</strong></p>
      <p class='small-note'>Estimated add-on: ${currency(estimate.amount)}</p>
      <p class='small-note'>${recommendation}</p>
      <button type='button' class='btn btn-ghost addon-btn' data-add-service='${key}'>Add to Quote</button>
    `;
    mount.appendChild(card);
  });
}

function renderTransportationOffer(total) {
  const node = document.getElementById("transportDiscountNote");
  if (!node) return;

  const discount = getTransportationDiscount(total);
  if (!discount) {
    node.innerHTML = "";
    return;
  }

  node.innerHTML = `<p><strong>Booking Incentive:</strong> Get <span class='transport-highlight'>${currency(discount)} OFF</span> transportation fee when you book now.</p>`;
}

function saveQuote(payload) {
  const saved = JSON.parse(localStorage.getItem("savedQuotes") || "[]");
  saved.unshift(payload);
  localStorage.setItem("savedQuotes", JSON.stringify(saved.slice(0, 8)));
}

function getServiceKeysFromSavedQuote(entry) {
  if (Array.isArray(entry.serviceKeys) && entry.serviceKeys.length) {
    return entry.serviceKeys.filter((key) => SERVICE_META[key]);
  }

  if (!Array.isArray(entry.services)) return [];

  const nameToKey = Object.entries(SERVICE_META).reduce((acc, [key, value]) => {
    acc[value.name] = key;
    return acc;
  }, {});

  return entry.services.map((name) => nameToKey[name]).filter(Boolean);
}

function getSavedQuoteBookingUrl(entry) {
  const serviceKeys = getServiceKeysFromSavedQuote(entry);
  const estimate = Number(entry.total) || 0;
  const transportDiscount = getTransportationDiscount(estimate);

  const query = new URLSearchParams({
    sqft: String(entry.homeSqft || 0),
    windows: String(entry.windows || 0),
    solarPanels: String(entry.solarPanels || 0),
    fenceFeet: String(entry.fenceFeet || 0),
    services: serviceKeys.join(","),
    estimate: String(Math.round(estimate)),
    transportDiscount: String(transportDiscount)
  });

  return `booking.html?${query.toString()}`;
}

function renderSavedQuotes() {
  const mount = document.getElementById("savedQuotes");
  if (!mount) return;

  const saved = JSON.parse(localStorage.getItem("savedQuotes") || "[]");
  mount.innerHTML = "";

  if (!saved.length) {
    mount.innerHTML = "<p class='small-note'>No saved quotes yet. Create one above and lock it in.</p>";
    return;
  }

  saved.forEach((entry, index) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <h3>${entry.date}</h3>
      <p>${entry.details}</p>
      <p>${entry.services.join(", ")}</p>
      <p><strong>${currency(entry.total)}</strong></p>
      <div class="hero-actions" style="margin: 0.7rem 0 0;">
        <a class="btn btn-secondary" href="${getSavedQuoteBookingUrl(entry)}">Book Now</a>
        <button class="btn btn-ghost" type="button" data-delete-saved-quote="${index}">Delete</button>
      </div>
    `;
    mount.appendChild(card);
  });
}

function setupQuoteCalculator() {
  const form = document.getElementById("quoteForm");
  if (!form) return;

  const lockButton = document.getElementById("lockPriceBtn");
  const bookButton = document.getElementById("bookNowBtn");
  const bookNowFlowNote = document.getElementById("bookNowFlowNote");

  const pageParams = new URLSearchParams(window.location.search);
  if (pageParams.get("book") === "1" && bookNowFlowNote) {
    bookNowFlowNote.style.display = "block";
  }

  const buildSavedQuotePayload = (inputs, selected, total) => ({
    date: new Date().toLocaleDateString(),
    details: `${inputs.homeSqft || 0} sq ft | ${inputs.windows || 0} windows | ${inputs.solarPanels || 0} solar panels | ${inputs.fenceFeet || 0} ft fence`,
    homeSqft: inputs.homeSqft || 0,
    windows: inputs.windows || 0,
    solarPanels: inputs.solarPanels || 0,
    fenceFeet: inputs.fenceFeet || 0,
    serviceKeys: selected,
    services: selected.map((key) => SERVICE_META[key].name),
    total: Math.round(total)
  });

  const update = () => {
    const inputs = getInputs();
    const selected = getSelectedServices();
    toggleRelevantInputGroups(selected);
    const result = calculateQuote(selected, inputs);
    const quoteReady = isQuoteReady(result, selected);

    renderQuote(result);
    renderAddonOffers(inputs, selected);
    renderTransportationOffer(quoteReady ? result.total : 0);

    const transportDiscount = getTransportationDiscount(quoteReady ? result.total : 0);
    const query = new URLSearchParams({
      sqft: String(inputs.homeSqft),
      windows: String(inputs.windows),
      solarPanels: String(inputs.solarPanels),
      fenceFeet: String(inputs.fenceFeet),
      services: selected.join(","),
      estimate: String(Math.round(quoteReady ? result.total : 0)),
      transportDiscount: String(transportDiscount)
    });

    if (bookButton) {
      bookButton.setAttribute("href", `booking.html?${query.toString()}`);
    }

    return { inputs, selected, result };
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  const handleAddService = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const serviceNode = target.closest("[data-add-service]");
    const serviceKey = serviceNode?.getAttribute("data-add-service");
    if (!serviceKey) return;

    const checkbox = form.querySelector(`input[name='service'][value='${serviceKey}']`);
    if (checkbox instanceof HTMLInputElement) {
      checkbox.checked = true;
      update();
    }
  };

  const addonOffersMount = document.getElementById("addonOffers");
  addonOffersMount?.addEventListener("click", handleAddService);
  addonOffersMount?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleAddService(event);
  });

  lockButton?.addEventListener("click", (event) => {
    event.preventDefault();
    const { inputs, selected, result } = update();

    if (!isQuoteReady(result, selected)) {
      alert("Select service(s) and complete required fields to lock in your quote.");
      return;
    }

    saveQuote(buildSavedQuotePayload(inputs, selected, result.total));

    renderSavedQuotes();

    const wantsToBookNow = window.confirm(
      "Price locked in successfully. Would you like to book now?"
    );

    if (wantsToBookNow && bookButton?.getAttribute("href")) {
      window.location.href = bookButton.getAttribute("href");
      return;
    }

    alert("Your quote is saved on this device. You can book anytime using the Book Now button.");
  });

  bookButton?.addEventListener("click", (event) => {
    event.preventDefault();
    const { inputs, selected, result } = update();
    const currentBookingUrl = bookButton.getAttribute("href") || "booking.html";
    const saved = JSON.parse(localStorage.getItem("savedQuotes") || "[]");

    if (!saved.length) {
      const shouldSaveAndBook = window.confirm(
        "No saved quotes found. Save this current quote and continue to booking?"
      );

      if (!shouldSaveAndBook) return;

      if (!isQuoteReady(result, selected)) {
        alert("Select service(s) and complete required fields first.");
        return;
      }

      saveQuote(buildSavedQuotePayload(inputs, selected, result.total));
      renderSavedQuotes();
      window.location.href = currentBookingUrl;
      return;
    }

    const useCurrentQuote = window.confirm(
      "Use the current quote for booking? Click Cancel to choose a saved quote."
    );

    if (useCurrentQuote) {
      if (isQuoteReady(result, selected)) {
        const saveCurrentFirst = window.confirm("Save the current quote before booking?");
        if (saveCurrentFirst) {
          saveQuote(buildSavedQuotePayload(inputs, selected, result.total));
          renderSavedQuotes();
        }
      } else {
        alert("Current quote is incomplete. Choose a saved quote or finish required fields first.");
        return;
      }
      window.location.href = currentBookingUrl;
      return;
    }

    const quoteOptions = saved
      .map((entry, index) => `${index + 1}. ${entry.date} - ${entry.services.join(", ")} - ${currency(entry.total)}`)
      .join("\n");

    const selectedNumber = window.prompt(
      `Enter the saved quote number to book:\n\n${quoteOptions}`
    );

    if (selectedNumber === null) return;

    const selectedIndex = Number(selectedNumber) - 1;
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= saved.length) {
      alert("Invalid quote number. Please try again.");
      return;
    }

    window.location.href = getSavedQuoteBookingUrl(saved[selectedIndex]);
  });

  const savedQuotesMount = document.getElementById("savedQuotes");
  savedQuotesMount?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteIndex = target.getAttribute("data-delete-saved-quote");
    if (deleteIndex === null) return;

    const saved = JSON.parse(localStorage.getItem("savedQuotes") || "[]");
    const index = Number(deleteIndex);
    if (Number.isNaN(index)) return;

    saved.splice(index, 1);
    localStorage.setItem("savedQuotes", JSON.stringify(saved));
    renderSavedQuotes();
  });

  update();
  renderSavedQuotes();
}

function setupBookingPage() {
  const bookingFrame = document.getElementById("bookingFrame");
  const summary = document.getElementById("bookingSummary");
  if (!bookingFrame && !summary) return;

  const params = new URLSearchParams(window.location.search);
  const services = params.get("services") || "";
  const estimate = params.get("estimate") || "0";
  const sqft = params.get("sqft") || "0";
  const windows = params.get("windows") || "0";
  const solarPanels = params.get("solarPanels") || "0";
  const fenceFeet = params.get("fenceFeet") || "0";
  const estimateValue = Number(estimate) || 0;
  const transportDiscount = Number(params.get("transportDiscount")) || getTransportationDiscount(estimateValue);
  if (bookingFrame) {
    const squareUrl = new URL(SQUARE_BOOKING_URL);
    squareUrl.searchParams.set("services", services);
    squareUrl.searchParams.set("estimate", estimate);
    squareUrl.searchParams.set("sqft", sqft);
    squareUrl.searchParams.set("windows", windows);
    squareUrl.searchParams.set("solarPanels", solarPanels);
    squareUrl.searchParams.set("fenceFeet", fenceFeet);
    squareUrl.searchParams.set("transportDiscount", String(transportDiscount));
    bookingFrame.setAttribute("src", squareUrl.toString());
  }

  if (summary) {
    const serviceKeys = services
      .split(",")
      .filter(Boolean);

    const serviceNames = serviceKeys.map((key) => SERVICE_META[key]?.name || key);
    const needsSqft = serviceKeys.some((key) => key === "roof" || key === "gutter");
    const needsWindows = serviceKeys.includes("window");
    const needsSolarPanels = serviceKeys.includes("solar");
    const needsFenceFeet = serviceKeys.includes("fence");

    const detailRows = [];

    if (needsSqft) {
      detailRows.push(`<p><strong>Home size:</strong> ${sqft} sq ft</p>`);
    }

    if (needsWindows) {
      detailRows.push(`<p><strong>Windows:</strong> ${windows}</p>`);
    }

    if (needsSolarPanels) {
      detailRows.push(`<p><strong>Solar panels:</strong> ${solarPanels}</p>`);
    }

    if (needsFenceFeet) {
      detailRows.push(`<p><strong>Fence length:</strong> ${fenceFeet} ft</p>`);
    }

    const transportRow = transportDiscount > 0
      ? `<p><strong>Transportation fee discount:</strong> <span class='transport-highlight'>-${currency(transportDiscount)}</span></p>`
      : "";

    summary.innerHTML = `
      <p class='kicker'>Quote Summary</p>
      <p class='total' style='font-size: 2rem; margin-bottom: 0.5rem;'>${currency(estimateValue)}</p>
      ${transportRow}
      <p><strong>Services:</strong> ${serviceNames.join(", ") || "Not selected"}</p>
      ${detailRows.join("")}
      <p class='small-note important-reminder'><strong>Important:</strong> Copy and paste this quote information into the <strong>Quote Details</strong> answer box in Square Booking, then select all services listed in this quote.</p>
      <p class='small-note'>Only relevant quote details are shown for selected services.</p>
    `;
  }
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name")?.value || "";
    const service = document.getElementById("serviceInterest")?.value || "";
    const details = document.getElementById("details")?.value || "";
    const msg = encodeURIComponent(`Hi, this is ${name}. I need ${service}. Details: ${details}`);

    window.location.href = `${SMS_LINK}?body=${msg}`;
  });
}

function setCurrentNav() {
  const page = document.body.getAttribute("data-page");
  if (!page) return;

  const target = document.querySelector(`.nav-links a[data-link='${page}']`);
  if (target) target.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupPopups();
  setupContactHelpers();
  setupGoogleReviewLinks();
  setupQuoteCalculator();
  setupBookingPage();
  setupContactForm();
  setCurrentNav();
});
