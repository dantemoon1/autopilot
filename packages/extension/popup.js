// Browser metadata
const BROWSER_NAMES = {
  chrome: "Chrome",
  brave: "Brave",
  edge: "Edge",
  arc: "Arc",
  helium: "Helium",
};

// Real browser icons extracted as 16x16 PNGs (Chrome, Arc, Helium from local app bundles)
// Brave and Edge use simplified SVGs since they're not installed locally
const BROWSER_ICONS = {
  chrome: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAACaklEQVQ4Ea1STUhUURT+7n1v1EmHxonRlKmQhggRKWqhCwOJfsBoGbkwCXKjrSIKs00bsVXQohYaRBJBSWFR0K4f+pGYoEwhnIgUxp9MHU2nnPfu7bvPedMiqE0HvnfOO+983zn3nQv8L9NanyNGiO//wKip9fsKE+QSa0knK1Zu9NnLb4aszLu3lpQCRdu2q0jzsazc1+T4RPpuIUS3LzDCxGbMfZPjrUeC7vSUECRKKQkBFnpxYWVMRa5e/4FwRLF+gvkaX2DJKH9paix2pieFIfKxRva8iZljdRFFwv13M5CWpkCpbYg0/ezTk4C1/FVsNFUQCJ9ox0RDM0TQRbW8DTV2hlWm8QeJVI+NWNeqKZR8eHZlbDDQfziuoYHIqbO4FG3Bwd5VHLjs4kKiBbLqPCBtThEAZp/mG/sC+uPsZ+t1VIuRWBDjOw+h7/mKr+3Fo7KN/Wxowpl/ZfEjW1EzV6Vdx4VyFW7tLs2l/nSCZCPiTbEm8PsIO8qrHaU13lcUIjH3EG0N6/IKJt4kBnNkG1ZJres3zp+lrqzGSaSGbaU0eoZvorO+BAO1jV6f1OIdpMe6UVxgysmt6vjJwDuCv8Z5JsSea0dDM868NCK8XHl0xRbQWpYmRXGdUSXqhxbNBFxj1P8HKb6r+8d7lyJuSKmsA6WUh8qAi9byDD/bXH0FyY/NnTHdJ433BR7xBWEZUi/bB9IX955e3lpQ4WQXMjgZWeCZd2WtLR0ZUfeCncPmMhi7RyjvCAxKOHIP/X5iA/E3M/t9wPE76dO+gCGEiPUEbwqChIjH40gmkwzzZshm/BnCuyi/AB3cEqXUkECLAAAAAElFTkSuQmCC">',
  brave: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAAC+UlEQVQ4EW1TaUhUURT+3pvVcZssnEhKaDFUMEusGFoMCyGigrAi+1NUBkVE0EJBQRS00EZBCzQUBRbZjyglaftRCS1aKUhWtNrMOOM0zozj+OYtp3NfG0IHvnfvO/d83z333Hsk/DIrD1mMHIadITP+Z8TONCPxG6oIstbW1hYQ0SlGDyOdvH6Y+taUUqS+iiKr51BobhElTuznJdIZvQxfe3t7IXNtQsDNjtNGeoiSjcep/+Aq8k8D+csYJaDvBaAemQFQtH4ZDZw7REZqkCl0mbl5En/G8U9r/MiagvixS8hYWo7MFdthREOweCYBGkF73w15pAfJc0eRvNeB3E0r4T7TEJIkabrIYCILqJGNFRRakk9GIkpa4BNp/i9iF9O0b19J+/yR12IULMmn8Lxi4deYyzsARXo0RL0LXaS8um8Shp7eoujuFaS+f0Vq1xv6saGWUk03zTXl+SMKjJNJD/pFQYtE9SHZHZBcOVBam2Avr4bDu5hPLJtpQ5XhWl4HR/USEQrl7m1IWdmA02n+/xJgsrNqORInT0DOdiOzbg/U7jYYfQFmyNB6PsFRtQgDZw6if+9x5OxcDzl3hCnw975tpV5IuUCq5RJI15G1dh/Ut52mUPa2A5wRIXXtImQLP5TK2SZZfP4JFM+AJd8FKdMNyWaHEYuAkjEYA3EYP8L8Wqy8QR4sY6ywVcz8KyCusYir0y08/btqoLQ9gGN6DZzz6jhND6AS9HAvUo1XoDxs4frMQt6Nx6YAX+NkkYGopi481glTQYM6lCfN0D52cqrVsHvnQ3vXBaW5BRTnmNIKESpM8EhkUMgZPOPRo33pQnSLF6QkGRIyatZxEYHBy2fNEU47Rt15AWtxGYejjzOoFJMRLHCBYZr64TVFNs+g4CxQsNJCgRKZ/KNB4QVTKN3x8k+YGBuYO1II2Hw+31h2nGd8Z2gMSpzdQYFy7ofxoNj+rdxGoo/IYIQYVxnjBVccQZjoKtHO/ELgYPzx83SYiXMPa+effEenVQF1DCYAAAAASUVORK5CYII=">',
  edge: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAACXElEQVQ4EZWTT0gUURzHP29md93cNU1FQ7GF7N8p6iJ06BRlHkyWIrpFl+jQoaC7UqcOkV06VQTRrdNGh6AO4iWIwBS00FQSXdZWd4eZ3ZkdZ+b1ZtVVswh/8Jvfe/N+3+/vz/s9gRIp5aAydyzLagr3/5NkMllUPi+FEHdD8GPP85TZm2xghoSCFRTbjsiZXJlMrsiCW1ZHNp1xj3RbM/1tqT+TKwrTNKVKqXqQdQLuTZp8t1wClIrQOkhhkYj/5EhDiUeHL9EeXY+nSkbbTnlr3OJbwcUrV5BegKge62hCJ6oHFGSe+7nnlKRdg0U2V29zNuNf5zCWDISmQPjE4j6Np5qJJhzlVkHX1jBY4UNphIHkxSq0RvBiZJ5fiz564iBaREdIl4GUh71q8SVWRMYdvMDD8wWzlSVYr5oawVQW/EhCfQTSMbnSmOPp5V5c1+XG5/fM+AbumkNZZbEaMTcT3+qBH0TxfYmvag9mJ2lpWA8Ri8VINuXV/5wiWMV2DE4Hx3cTdCRU5JBAqbRtXo/OY5RcihWLiLFMl+pBqwtX684x0HG+RlC7xsxYlvSbApomqJv+hBYIUq31vBvso7OlnnK5jK7rrJguXe1b11gj8H2fvmfTfFwIiC7/IFZcVjMOQjXuZOoATfURDNPmzNH9PLzdX81gxxyE7K+upUh363jNhwg0NSIynAXBxFye0YlFerobeXCzt5Z+uNg1ymHXM2NLZKZMZmazNDh5Ui37SJ89wYWeY9UytjGo+5Vy6F+PyXEcGerfZAMzLEI25TCszPU9Pucn6jkP/QZs2oj/II7HYwAAAABJRU5ErkJggg==">',
  arc: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAACVElEQVQ4EX2TTWgTQRTH3+wm2SbNUmsDxdb6XUQxFqLxo9qLiicRPSkUb0qPHsSjIl7Fnj1UDwoeFYJelBbBgx8VlWKxBptWJWhtwdbUmOwmO/7/624IIn3w472dmfef92Zmlfw1Ay4awHgl8zDpBngRBEprnYQ/ATYCCiigAS2M6Wl1MAvuK6VKHLQgcBp+K/if/SsQrslD4G5YOpPDFkLfLuXKRYz3gxhgtcQM/Bb4KAVInB9NxKVQPCvnr5oyfGsA4zuDuW74riBOwBtMpjGZ6nYQr9O5R6ZorfRkXkl+llVk5PHoKXnxchDx+mCdn4TY99bY+K/B4lw5emaXlNQ7JMLQp8iDsYQcG9gnH/KG2LaWvXvWYuo757krjRUcuXBtJvJtoSqpbME+Wtdidqa0nl9QtbeTyk2oCGuWzZt4jV+An9vcwseTh9u152k5/rBTLi32Sa73kCraHbpSWpbi6DMldlLLgf45JJcBN/UPkJ5q85eHuie2p6pCkeFCj5y748mVTxuU6zjS5ZlSz+x28SrGsTa8iUYLFFCeI6mZ3BOd6V2jVvelRceTeql1B3KmJb74QxlvpiKS3taKtQ7Xg4YAW4mUy15LzDKlp0PJvdvZaYwtA1fex9L6+oglVjR8VCyfZ+GrJPESbyBeBeJOxcvGLOM3ZibwzWfLJ53QS6WDqs2eQvwZ1MBP3NAQd+aP8RqwjVqsxXiF5EnE/g7w3LWK5KfwXwFzWAFzXCaxn5uAC/eDNuC3BN9sFGQ1bOs5GAGOfxAIQlUqM17JKNT4nf8AUEO1P6yKUXEAAAAASUVORK5CYII=">',
  helium: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAACZklEQVQ4Ea1TS2gTURQ983vzZpImbdWAi1Ja/KRaKGZRkK5E8ANiK1RcaRB3JUJRcNeNOzeKKLpwIyiF7iIISq2IQivdNKmIQa1aW2naNOqiqclkZt54Z9KWSOtKHzze3Ms555177xvgH5dUz/c8T6G4mTavz9d9VyRJWq6LsSFA5N09/SO3vn7OJBy7qlMM23YhhAdZluAKAQHZ0szWqd6xyxfvx6SPvlAgQGC1p3/46fTUxGEh7CDpE9tad8AXmp0vQpHl4GJJ1sAb2p4Xs5eOQpJcdc3OtqX8bIIxTrdqAYlpMu5dvwCr6qIveSdwQvahMxWS+JnwgO10+9K6AGeqoWpaGL3H4lBVBSOPMlgpOShXHHgwcPZ0AqVfVTx7+QEaN3xe0Kd1AWgsQtvFiSMHcOr4XnTGW1D4XgkcXBvqw0CyG8Ppd3gxsQCTh9aMAxsCnIcRDnu4emMcj8e+4MzJ/Yjvag7Kyc38QHLwCTJv84RpBDeMzQIaC0MnUyZXoOs6qrbAatmFJwDLEmBMh2lGaA4uTGMLByrVz5iE1Pl96O6KIT06h8Vlh0oQsB0PVwYO4tVkHncf5MhBw2YHOm+AoHf0OrOCyWyJ9jJSyT00aBcP058wt2AH/TDIhbGFgKXzJkeiluRmbOo60BhtojEzKIpAJNKIN+8tiqlEMwozFHUIYvk21ptYbGlvyy7OFw459qqfD5o3Ol4JTs6jRK49Wo2F0NEZyxKk6ONq2RqhY/Ambhe+rXY5dlkP8GTFPxWlBmPMtNrjxvTQOaRIMPeHgB/Qkunp7qTzrz8TSeZJlGbzn9Zv2UjoE//Rtr4AAAAASUVORK5CYII=">',
};

const BROWSER_ORDER = ["chrome", "brave", "edge", "arc", "helium"];

const CHEVRON_SVG = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

// Safe SVG parser — all SVG strings above are hardcoded constants, never user input.
function parseSvg(svgString) {
  const wrapper = document.createElement("div");
  wrapper.insertAdjacentHTML("afterbegin", svgString);
  return wrapper.firstElementChild;
}

// Helpers
function profileKey(browser, directory) {
  return `${browser}:${directory}`;
}

function parseProfileKey(key) {
  const idx = key.indexOf(":");
  if (idx === -1) return { browser: "", directory: key };
  return { browser: key.slice(0, idx), directory: key.slice(idx + 1) };
}

function browserIcon(browserId) {
  const span = document.createElement("span");
  span.className = "browser-icon";
  const markup = BROWSER_ICONS[browserId];
  if (markup) {
    const wrapper = document.createElement("div");
    wrapper.insertAdjacentHTML("afterbegin", markup);
    span.appendChild(wrapper.firstElementChild);
  }
  return span;
}

function profileLabel(browserId, profileName) {
  return `${BROWSER_NAMES[browserId] || browserId} \u2013 ${profileName}`;
}

async function detectBrowser() {
  // Try userAgentData brands first (works for Brave, Edge)
  const brands = navigator.userAgentData?.brands || [];
  for (const { brand } of brands) {
    if (brand === "Brave") return "brave";
    if (brand === "Microsoft Edge") return "edge";
  }

  // For browsers that don't identify in UA (Helium, Arc),
  // ask the native host which browser we're in
  try {
    const response = await chrome.runtime.sendMessage({ action: "detect_browser" });
    if (response?.browser) return response.browser;
  } catch {
    // Native host not available (paid-only user) — fall through
  }

  const ua = navigator.userAgent;
  if (ua.includes("Arc")) return "arc";
  if (ua.includes("Helium")) return "helium";
  return "chrome";
}

// Custom profile select component
class ProfileSelect {
  constructor(container, variant = "form") {
    this.container = container;
    this.variant = variant;
    this.value = null;
    this.onChange = null;
    this._profiles = [];
    this._build();
  }

  _build() {
    this.container.classList.add("profile-select", `profile-select--${this.variant}`);

    this.trigger = document.createElement("button");
    this.trigger.type = "button";
    this.trigger.className = "profile-select-trigger";

    this._triggerIcon = document.createElement("span");
    this._triggerIcon.className = "browser-icon";

    this._triggerText = document.createElement("span");
    this._triggerText.className = "profile-select-text";
    this._triggerText.textContent = "Select profile";

    this._chevron = document.createElement("span");
    this._chevron.className = "profile-select-chevron";
    this._chevron.appendChild(parseSvg(CHEVRON_SVG));

    this.trigger.append(this._triggerIcon, this._triggerText, this._chevron);

    this.dropdown = document.createElement("div");
    this.dropdown.className = "profile-select-dropdown";

    this.container.append(this.trigger, this.dropdown);

    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.container.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      this.container.classList.remove("open");
    });

    this.dropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  populateFree(profiles, selectedValue) {
    this._prependBrowser = true;
    this._profiles = profiles;
    this.dropdown.replaceChildren();

    const grouped = new Map();
    for (const id of BROWSER_ORDER) {
      const items = profiles.filter((p) => p.browser === id);
      if (items.length > 0) grouped.set(id, items);
    }

    for (const [browserId, items] of grouped) {
      const label = document.createElement("div");
      label.className = "profile-select-group-label";
      label.textContent = BROWSER_NAMES[browserId] || browserId;
      this.dropdown.appendChild(label);

      for (const p of items) {
        const val = profileKey(p.browser, p.directory);
        const opt = document.createElement("button");
        opt.type = "button";
        opt.className = "profile-select-option";
        if (val === selectedValue) opt.classList.add("selected");
        opt.dataset.value = val;
        opt.append(browserIcon(p.browser), document.createTextNode(p.name));
        opt.addEventListener("click", () => {
          this._select(val, { browser: p.browser, name: p.name });
          this.container.classList.remove("open");
        });
        this.dropdown.appendChild(opt);
      }
    }

    if (selectedValue) {
      const match = profiles.find((p) => profileKey(p.browser, p.directory) === selectedValue);
      if (match) this._select(selectedValue, { browser: match.browser, name: match.name }, true);
    }
  }

  populatePaid(profiles, selectedValue) {
    this._prependBrowser = false;
    this._profiles = profiles;
    this.dropdown.replaceChildren();

    for (const p of profiles) {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "profile-select-option";
      if (p.id === selectedValue) opt.classList.add("selected");
      opt.dataset.value = p.id;
      if (p.browser) opt.append(browserIcon(p.browser));
      opt.appendChild(document.createTextNode(p.name));
      opt.addEventListener("click", () => {
        this._select(p.id, { browser: p.browser, name: p.name });
        this.container.classList.remove("open");
      });
      this.dropdown.appendChild(opt);
    }

    if (selectedValue) {
      const match = profiles.find((p) => p.id === selectedValue);
      if (match) this._select(selectedValue, { browser: match.browser, name: match.name }, true);
    }
  }

  _select(value, profile, silent) {
    this.value = value;

    const newIcon = profile.browser ? browserIcon(profile.browser) : document.createElement("span");
    newIcon.classList.add("browser-icon");
    this._triggerIcon.replaceWith(newIcon);
    this._triggerIcon = newIcon;

    this._triggerText.textContent = this._prependBrowser && profile.browser
      ? profileLabel(profile.browser, profile.name)
      : profile.name;

    for (const opt of this.dropdown.querySelectorAll(".profile-select-option")) {
      opt.classList.toggle("selected", opt.dataset.value === value);
    }

    if (!silent && this.onChange) this.onChange(value);
  }
}

// ── DOM refs ──

const setupScreen = document.getElementById("setup-screen");
const registerScreen = document.getElementById("register-screen");
const mainUI = document.getElementById("main-ui");
const profileBar = document.getElementById("profile-bar");
const rulesList = document.getElementById("rules-list");
const addRuleBtn = document.getElementById("add-rule-btn");
const statusMessage = document.getElementById("status-message");
const newTypeSelect = document.getElementById("new-type");
const domainFields = document.getElementById("domain-fields");
const keywordFields = document.getElementById("keyword-fields");
const newDomainInput = document.getElementById("new-domain");
const newSubdomainsCheckbox = document.getElementById("new-subdomains");
const newKeywordInput = document.getElementById("new-keyword");
const showFormBtn = document.getElementById("show-form-btn");
const addRuleForm = document.getElementById("add-rule-form");

let profiles = [];
let currentMode = "free";

// Custom dropdowns
const currentProfileSelect = new ProfileSelect(
  document.getElementById("current-profile-select"),
  "inline"
);
const newProfileSelect = new ProfileSelect(
  document.getElementById("new-profile-select"),
  "form"
);

// ── Events ──

document.getElementById("copy-cmd-btn").addEventListener("click", async () => {
  const cmd = document.getElementById("install-command").textContent;
  await navigator.clipboard.writeText(cmd);
  const btn = document.getElementById("copy-cmd-btn");
  const originalNodes = Array.from(btn.childNodes).map((n) => n.cloneNode(true));
  btn.textContent = "\u2713";
  setTimeout(() => { btn.replaceChildren(...originalNodes); }, 1500);
});

document.getElementById("sign-in-btn").addEventListener("click", async () => {
  const btn = document.getElementById("sign-in-btn");
  btn.disabled = true;
  btn.textContent = "Signing in...";
  try {
    await chrome.runtime.sendMessage({ action: "sign_in" });
    init();
  } catch (err) {
    showStatus("Sign in failed");
    btn.disabled = false;
    btn.textContent = "Sign in with Google";
  }
});

document.getElementById("local-mode-link").addEventListener("click", async (e) => {
  e.preventDefault();
  await chrome.storage.local.set({ mode: "local" });
  // If helper is already installed, go straight to rules UI
  const hostCheck = await chrome.runtime.sendMessage({ action: "check_native_host" });
  if (hostCheck.installed) {
    init();
  } else {
    document.getElementById("setup-screen").hidden = true;
    document.getElementById("local-setup-screen").hidden = false;
  }
});

document.getElementById("back-to-signin").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("local-setup-screen").hidden = true;
  document.getElementById("setup-screen").hidden = false;
});

document.getElementById("installed-btn").addEventListener("click", () => {
  init();
});

document.getElementById("subscribe-monthly-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkout", plan: "monthly" });
});

document.getElementById("subscribe-annual-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkout", plan: "annual" });
});

document.getElementById("subscribe-lifetime-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkout", plan: "lifetime" });
});

document.getElementById("billing-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.sendMessage({ action: "billing" });
});

document.getElementById("sign-out-link").addEventListener("click", async (e) => {
  e.preventDefault();
  await chrome.runtime.sendMessage({ action: "sign_out" });
  init();
});

document.getElementById("switch-mode-link").addEventListener("click", async (e) => {
  e.preventDefault();
  await chrome.storage.local.remove(["mode", "currentProfile", "authToken", "user", "paidProfileId"]);
  init();
});


document.getElementById("register-btn").addEventListener("click", async () => {
  const name = document.getElementById("profile-name-input").value.trim();
  if (!name) { showStatus("Enter a name"); return; }

  // Check if this name is already used by another profile
  const existing = await chrome.runtime.sendMessage({ action: "list_profiles" });
  const browser = await detectBrowser();
  if (existing.profiles?.some((p) => p.name === name && p.browser === browser)) {
    showStatus("That name is already used. Try a unique name like 'Work Chrome' or 'Home Helium'.");
    return;
  }

  const response = await chrome.runtime.sendMessage({
    action: "register_profile",
    name,
    browser,
  });

  if (response.error) {
    showStatus(response.error);
    return;
  }

  init();
});

showFormBtn.addEventListener("click", () => {
  showFormBtn.hidden = true;
  addRuleForm.hidden = false;
});

newTypeSelect.addEventListener("change", () => {
  const isKeyword = newTypeSelect.value === "keyword";
  domainFields.hidden = isKeyword;
  keywordFields.hidden = !isKeyword;
});

function showStatus(msg) {
  statusMessage.textContent = msg;
  setTimeout(() => { statusMessage.textContent = ""; }, 2000);
}

// ── Rules ──

async function loadRules() {
  const response = await chrome.runtime.sendMessage({ action: "get_rules" });
  return response.rules || [];
}

async function saveRules(rules) {
  await chrome.runtime.sendMessage({ action: "save_rules", rules });
}

function describeRule(rule) {
  if (rule.type === "keyword") {
    return { type: "contains", value: rule.keyword };
  }
  const d = rule.domain || "";
  const sub = rule.includeSubdomains ?? rule.include_subdomains;
  const value = sub ? "*." + d : d;
  return { type: "domain", value };
}

function renderRules(rules) {
  rulesList.replaceChildren();

  if (rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No rules configured";
    rulesList.appendChild(empty);
    return;
  }

  rules.forEach((rule, index) => {
    const card = document.createElement("div");
    card.className = "rule-card";

    const { type, value } = describeRule(rule);

    let displayName;
    let displayBrowser = null;
    if (currentMode === "paid") {
      const profile = profiles.find((p) => p.id === rule.target_profile_id);
      displayName = profile ? profile.name : "Unknown";
      displayBrowser = profile?.browser;
    } else {
      const profile = profiles.find(
        (p) => p.browser === rule.browser && p.directory === rule.profileDirectory
      );
      displayName = profile
        ? profileLabel(rule.browser, profile.name)
        : rule.profileDirectory;
      displayBrowser = rule.browser;
    }

    const matchDiv = document.createElement("div");
    matchDiv.className = "rule-match";

    const badge = document.createElement("span");
    badge.className = "rule-type-badge";
    badge.textContent = type;

    const valueSpan = document.createElement("span");
    valueSpan.className = "rule-value";
    valueSpan.textContent = value;

    matchDiv.append(badge, valueSpan);

    const profileSpan = document.createElement("span");
    profileSpan.className = "rule-profile";
    if (displayBrowser) profileSpan.appendChild(browserIcon(displayBrowser));
    profileSpan.appendChild(document.createTextNode(displayName));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rule-delete";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.addEventListener("click", async () => {
      if (currentMode === "paid") {
        const result = await chrome.runtime.sendMessage({ action: "delete_rule_paid", ruleId: rule.id });
        if (result?.error) { showStatus(result.error); return; }
      } else {
        const currentRules = await loadRules();
        currentRules.splice(index, 1);
        await saveRules(currentRules);
      }
      renderRules(await loadRules());
      showStatus("Rule removed");
    });

    card.append(matchDiv, profileSpan, deleteBtn);
    rulesList.appendChild(card);
  });
}

// ── Add rule ──

addRuleBtn.addEventListener("click", async () => {
  const type = newTypeSelect.value;
  const profileValue = newProfileSelect.value;

  if (!profileValue) { showStatus("Select a profile"); return; }

  if (currentMode === "paid") {
    let rule;
    if (type === "domain") {
      let domain = newDomainInput.value.trim();
      if (!domain) { showStatus("Enter a domain"); return; }
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      rule = { type: "domain", domain, includeSubdomains: newSubdomainsCheckbox.checked, targetProfileId: profileValue };
    } else {
      const keyword = newKeywordInput.value.trim();
      if (!keyword) { showStatus("Enter a keyword"); return; }
      rule = { type: "keyword", keyword: keyword.toLowerCase(), targetProfileId: profileValue };
    }
    const result = await chrome.runtime.sendMessage({ action: "add_rule_paid", rule });
    if (result?.error === "upgrade_required") {
      mainUI.hidden = true;
      document.getElementById("upgrade-screen").hidden = false;
      return;
    }
    if (result?.error) {
      showStatus(result.error);
      return;
    }
  } else {
    const { browser, directory: profileDirectory } = parseProfileKey(profileValue);
    let rule;
    if (type === "domain") {
      let domain = newDomainInput.value.trim();
      if (!domain) { showStatus("Enter a domain"); return; }
      domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      rule = { type: "domain", domain, includeSubdomains: newSubdomainsCheckbox.checked, browser, profileDirectory };
    } else {
      const keyword = newKeywordInput.value.trim();
      if (!keyword) { showStatus("Enter a keyword"); return; }
      rule = { type: "keyword", keyword: keyword.toLowerCase(), browser, profileDirectory };
    }
    const rules = await loadRules();
    rules.push(rule);
    await saveRules(rules);
  }

  renderRules(await loadRules());
  newDomainInput.value = "";
  newKeywordInput.value = "";
  addRuleForm.hidden = true;
  showFormBtn.hidden = false;
  showStatus("Rule added");
});

// ── Profile change (free mode) ──

currentProfileSelect.onChange = async (value) => {
  await chrome.storage.local.set({ currentProfile: value });
  showStatus("Profile saved");
};

// ── Init ──

async function init() {
  // Hide all screens and footer links
  setupScreen.hidden = true;
  document.getElementById("local-setup-screen").hidden = true;
  document.getElementById("upgrade-screen").hidden = true;
  document.getElementById("update-banner").hidden = true;
  document.getElementById("billing-link").hidden = true;
  document.getElementById("sign-out-link").hidden = true;
  document.getElementById("switch-mode-link").hidden = true;
  document.getElementById("donate-link").hidden = false;
  document.getElementById("donate-link").style.marginLeft = "auto";
  registerScreen.hidden = true;
  mainUI.hidden = true;

  const modeInfo = await chrome.runtime.sendMessage({ action: "get_mode" });
  currentMode = modeInfo.mode;

  if (currentMode === "paid") {

    // Show billing link for subscribers, hide donate
    const subRes = await chrome.runtime.sendMessage({ action: "check_subscription" });
    const isLifetime = subRes.subscription?.plan === "lifetime";
    if (subRes.active) {
      document.getElementById("donate-link").hidden = true;
      if (!isLifetime) document.getElementById("billing-link").hidden = false;
    }

    // Check if profile is registered
    if (!modeInfo.paidProfileId) {
      registerScreen.hidden = false;
      return;
    }

    // Load profiles and rules from server
    const [profilesRes, rulesRes] = await Promise.all([
      chrome.runtime.sendMessage({ action: "list_profiles" }),
      loadRules(),
    ]);

    if (profilesRes.error) {
      setupScreen.hidden = false;
      return;
    }

    profiles = profilesRes.profiles || [];
    mainUI.hidden = false;

    // Show profile name with icon
    const myProfile = profiles.find((p) => p.id === modeInfo.paidProfileId);
    if (myProfile) {
      if (myProfile.browser) {
        const icon = browserIcon(myProfile.browser);
        currentProfileSelect._triggerIcon.replaceWith(icon);
        currentProfileSelect._triggerIcon = icon;
      }
      currentProfileSelect._triggerText.textContent = myProfile.name;
      currentProfileSelect.trigger.disabled = true;
    }

    document.getElementById("sign-out-link").hidden = false;
    newProfileSelect.populatePaid(profiles);
    renderRules(rulesRes);
  } else if (currentMode === "local") {
    // Local mode: check native host
    const hostCheck = await chrome.runtime.sendMessage({ action: "check_native_host" });

    if (!hostCheck.installed) {
      document.getElementById("local-setup-screen").hidden = false;
      return;
    }

    const response = await chrome.runtime.sendMessage({ action: "list_profiles" });
    if (response.error) {
      document.getElementById("local-setup-screen").hidden = false;
      return;
    }

    profiles = (response.profiles || []).filter((p) => p.hasExtension);
    const callingBrowser = response.callingBrowser;

    const config = await chrome.storage.local.get("currentProfile");
    let currentProfile = config.currentProfile || "";

    if (!currentProfile && callingBrowser) {
      const candidates = profiles.filter((p) => p.browser === callingBrowser);
      if (candidates.length === 1) {
        currentProfile = profileKey(candidates[0].browser, candidates[0].directory);
        await chrome.storage.local.set({ currentProfile });
      }
    }

    const rules = await loadRules();

    mainUI.hidden = false;
    document.getElementById("switch-mode-link").hidden = false;
    currentProfileSelect.populateFree(profiles, currentProfile);
    newProfileSelect.populateFree(profiles);
    renderRules(rules);

    // Check for helper updates
    const versionCheck = await chrome.runtime.sendMessage({ action: "check_host_version" });
    if (versionCheck.outdated) {
      document.getElementById("update-banner").hidden = false;
    }
  } else {
    // Not signed in and not in local mode — show setup
    setupScreen.hidden = false;
  }
}

init();
