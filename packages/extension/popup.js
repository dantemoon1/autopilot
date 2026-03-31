const currentProfileSelect = document.getElementById("current-profile");
const rulesList = document.getElementById("rules-list");
const addRuleBtn = document.getElementById("add-rule-btn");
const statusMessage = document.getElementById("status-message");
const nativeHostWarning = document.getElementById("native-host-warning");

const newTypeSelect = document.getElementById("new-type");
const newProfileSelect = document.getElementById("new-profile");
const domainFields = document.getElementById("domain-fields");
const keywordFields = document.getElementById("keyword-fields");
const newDomainInput = document.getElementById("new-domain");
const newSubdomainsCheckbox = document.getElementById("new-subdomains");
const newKeywordInput = document.getElementById("new-keyword");

const showFormBtn = document.getElementById("show-form-btn");
const addRuleForm = document.getElementById("add-rule-form");

let profiles = [];

// Copy install command
document.getElementById("copy-cmd-btn").addEventListener("click", async () => {
  const cmd = document.getElementById("install-command").textContent;
  await navigator.clipboard.writeText(cmd);
  const btn = document.getElementById("copy-cmd-btn");
  const original = btn.innerHTML;
  btn.textContent = "\u2713";
  setTimeout(() => { btn.innerHTML = original; }, 1500);
});

// Toggle form visibility
showFormBtn.addEventListener("click", () => {
  showFormBtn.hidden = true;
  addRuleForm.hidden = false;
});

// Toggle form fields based on rule type
newTypeSelect.addEventListener("change", () => {
  const isKeyword = newTypeSelect.value === "keyword";
  domainFields.hidden = isKeyword;
  keywordFields.hidden = !isKeyword;
});

function showStatus(msg) {
  statusMessage.textContent = msg;
  setTimeout(() => {
    statusMessage.textContent = "";
  }, 2000);
}

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
  const value = rule.includeSubdomains ? "*." + rule.domain : rule.domain;
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
    const profileName =
      profiles.find((p) => p.directory === rule.profileDirectory)?.name ||
      rule.profileDirectory;

    const matchDiv = document.createElement("div");
    matchDiv.className = "rule-match";

    const badge = document.createElement("span");
    badge.className = "rule-type-badge";
    badge.textContent = type;

    const valueSpan = document.createElement("span");
    valueSpan.className = "rule-value";
    valueSpan.textContent = value;

    matchDiv.appendChild(badge);
    matchDiv.appendChild(valueSpan);

    const profileSpan = document.createElement("span");
    profileSpan.className = "rule-profile";
    profileSpan.textContent = profileName;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "rule-delete";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.addEventListener("click", async () => {
      const currentRules = await loadRules();
      currentRules.splice(index, 1);
      await saveRules(currentRules);
      renderRules(currentRules);
      showStatus("Rule removed");
    });

    card.appendChild(matchDiv);
    card.appendChild(profileSpan);
    card.appendChild(deleteBtn);
    rulesList.appendChild(card);
  });
}

function populateProfileDropdowns(profilesList, currentProfile) {
  currentProfileSelect.replaceChildren();
  profilesList.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.directory;
    opt.textContent = p.name;
    if (p.directory === currentProfile) opt.selected = true;
    currentProfileSelect.appendChild(opt);
  });

  newProfileSelect.replaceChildren();
  profilesList.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.directory;
    opt.textContent = p.name;
    newProfileSelect.appendChild(opt);
  });
}

async function init() {
  const hostCheck = await chrome.runtime.sendMessage({
    action: "check_native_host",
  });

  if (!hostCheck.installed) {
    nativeHostWarning.hidden = false;
    return;
  }

  const response = await chrome.runtime.sendMessage({
    action: "list_profiles",
  });

  if (response.error) {
    nativeHostWarning.hidden = false;
    return;
  }

  profiles = response.profiles;

  const config = await chrome.storage.local.get("currentProfile");
  const currentProfile = config.currentProfile || "";
  const rules = await loadRules();

  populateProfileDropdowns(profiles, currentProfile);
  renderRules(rules);
}

currentProfileSelect.addEventListener("change", async () => {
  await chrome.storage.local.set({
    currentProfile: currentProfileSelect.value,
  });
  showStatus("Profile saved");
});

addRuleBtn.addEventListener("click", async () => {
  const type = newTypeSelect.value;
  const profileDirectory = newProfileSelect.value;

  if (!profileDirectory) {
    showStatus("Select a profile");
    return;
  }

  let rule;

  if (type === "domain") {
    let domain = newDomainInput.value.trim();
    if (!domain) {
      showStatus("Enter a domain");
      return;
    }
    // Clean up domain input - strip protocol and trailing slashes
    domain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .toLowerCase();

    const includeSubdomains = newSubdomainsCheckbox.checked;

    rule = { type: "domain", domain, includeSubdomains, profileDirectory };
  } else {
    const keyword = newKeywordInput.value.trim();
    if (!keyword) {
      showStatus("Enter a keyword");
      return;
    }
    rule = { type: "keyword", keyword: keyword.toLowerCase(), profileDirectory };
  }

  const rules = await loadRules();
  rules.push(rule);
  await saveRules(rules);

  renderRules(rules);
  newDomainInput.value = "";
  newKeywordInput.value = "";
  addRuleForm.hidden = true;
  showFormBtn.hidden = false;
  showStatus("Rule added");
});

init();
