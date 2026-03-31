// Browser metadata
const BROWSER_NAMES = {
  chrome: "Chrome",
  brave: "Brave",
  edge: "Edge",
  arc: "Arc",
  helium: "Helium",
};

const BROWSER_ICONS = {
  chrome: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#EA4335"/><path d="M12 1a11 11 0 0 1 9.5 5.5H12z" fill="#FBBC04"/><path d="M21.5 6.5A11 11 0 0 1 12 23V12z" fill="#34A853"/><circle cx="12" cy="12" r="4.5" fill="#fff"/><circle cx="12" cy="12" r="3.2" fill="#4285F4"/></svg>',
  brave: '<svg viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" fill="#FB542B"/><path d="M12 7L8 9.5v4c0 2.5 1.7 5 4 6 2.3-1 4-3.5 4-6v-4L12 7z" fill="#fff" opacity=".3"/></svg>',
  edge: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0078D4"/><path d="M7 15c0-5 4-8.5 8.5-8-3 0-5 2.5-5 5.5s2 4.5 5 4.5c-1.5 2-4.5 4-8 3s-0.5-5-0.5-5z" fill="rgba(255,255,255,.6)"/></svg>',
  arc: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#6E56CF"/><path d="M7 17A7 7 0 0 1 17 7" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2.5" stroke-linecap="round"/></svg>',
  helium: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#5AC8FA"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/><circle cx="12" cy="7" r="1.5" fill="rgba(255,255,255,.6)"/></svg>',
};

const BROWSER_ORDER = ["chrome", "brave", "edge", "arc", "helium"];

const CHEVRON_SVG = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

// Safe SVG parser — all SVG strings above are hardcoded constants, never user input.
function parseSvg(svgString) {
  const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
  return document.adoptNode(doc.documentElement);
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
  const svg = BROWSER_ICONS[browserId];
  if (svg) span.appendChild(parseSvg(svg));
  return span;
}

function profileLabel(browserId, profileName) {
  return `${BROWSER_NAMES[browserId] || browserId} \u2013 ${profileName}`;
}

function detectBrowser() {
  const brands = navigator.userAgentData?.brands || [];
  for (const { brand } of brands) {
    if (brand === "Brave") return "brave";
    if (brand === "Microsoft Edge") return "edge";
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

    this._triggerText.textContent = profile.browser
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
const subscribeScreen = document.getElementById("subscribe-screen");
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

document.getElementById("subscribe-monthly-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkout", plan: "monthly" });
});

document.getElementById("subscribe-annual-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkout", plan: "annual" });
});

document.getElementById("register-btn").addEventListener("click", async () => {
  const name = document.getElementById("profile-name-input").value.trim();
  if (!name) { showStatus("Enter a name"); return; }

  const response = await chrome.runtime.sendMessage({
    action: "register_profile",
    name,
    browser: detectBrowser(),
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
    if (currentMode === "paid") {
      const profile = profiles.find((p) => p.id === rule.target_profile_id);
      displayName = profile ? profile.name : "Unknown";
    } else {
      const profile = profiles.find(
        (p) => p.browser === rule.browser && p.directory === rule.profileDirectory
      );
      displayName = profile
        ? profileLabel(rule.browser, profile.name)
        : rule.profileDirectory;
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
    if (currentMode === "free" && rule.browser) {
      profileSpan.appendChild(browserIcon(rule.browser));
    }
    profileSpan.appendChild(document.createTextNode(displayName));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rule-delete";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.addEventListener("click", async () => {
      if (currentMode === "paid") {
        await chrome.runtime.sendMessage({ action: "delete_rule_paid", ruleId: rule.id });
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
    await chrome.runtime.sendMessage({ action: "add_rule_paid", rule });
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
  // Hide all screens
  setupScreen.hidden = true;
  subscribeScreen.hidden = true;
  registerScreen.hidden = true;
  mainUI.hidden = true;

  const modeInfo = await chrome.runtime.sendMessage({ action: "get_mode" });
  currentMode = modeInfo.mode;

  if (currentMode === "paid") {
    // Check subscription status
    const subRes = await chrome.runtime.sendMessage({ action: "check_subscription" });
    if (!subRes.active) {
      subscribeScreen.hidden = false;
      return;
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

    // In paid mode, show profile name as static text instead of dropdown
    const myProfile = profiles.find((p) => p.id === modeInfo.paidProfileId);
    if (myProfile) {
      currentProfileSelect._triggerText.textContent = myProfile.name;
      currentProfileSelect.trigger.disabled = true;
    }

    newProfileSelect.populatePaid(profiles);
    renderRules(rulesRes);
  } else {
    // Free mode: check native host
    const hostCheck = await chrome.runtime.sendMessage({ action: "check_native_host" });

    if (!hostCheck.installed) {
      setupScreen.hidden = false;
      return;
    }

    const response = await chrome.runtime.sendMessage({ action: "list_profiles" });
    if (response.error) {
      setupScreen.hidden = false;
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
    currentProfileSelect.populateFree(profiles, currentProfile);
    newProfileSelect.populateFree(profiles);
    renderRules(rules);
  }
}

init();
