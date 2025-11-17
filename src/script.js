const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const chatWindow = $("#chat-window");
const suggestionBox = $("#chat-suggestions");
const checklistEl = $("#question-checklist");
const diagnosisEl = $("#diagnosis-text");
const contractStatusEl = $("#contract-status");
const recommendedActionEl = $("#recommended-action");

const wizardStepsEl = $("#wizard-steps");
const wizardBodyEl = $("#wizard-body");
const wizardProgress = $("#wizard-progress");
const wizardProgressLabel = $("#wizard-progress-label");
const docPreviewEl = $("#doc-preview");
const docTypeLabel = $("#doc-type-label");
const docUpdatedLabel = $("#doc-updated-label");
const docReviewLabel = $("#doc-review-label");
const timelineEl = $("#timeline");

const chatFlow = [
  {
    id: "contractPhase",
    prompt: "현재 계약은 어떤 상태인가요?",
    options: [
      { label: "계약 만료 전", value: "pre_expiry" },
      { label: "계약 만료 후", value: "post_expiry" },
      { label: "기타", value: "other" }
    ]
  },
  {
    id: "contactStatus",
    prompt: "임대인과 연락은 잘 되고 있나요?",
    options: [
      { label: "네, 문제없어요", value: "contact_ok" },
      { label: "아니요, 연락이 안돼요", value: "contact_fail" }
    ]
  },
  {
    id: "notice",
    prompt: "계약 만료 의사 또는 반환 요구를 이미 전달하셨나요?",
    options: [
      { label: "네, 문자/카톡으로 전달", value: "notice_sent" },
      { label: "아직 전달하지 못했어요", value: "notice_pending" }
    ]
  }
];

const chatState = {
  index: 0,
  answers: {}
};

const wizardSteps = [
  {
    id: "basic",
    title: "계약 기본 정보",
    fields: [
      { name: "contractName", label: "계약명 / 별칭", placeholder: "예) 신촌 빌라 302호" },
      { name: "propertyAddress", label: "부동산 주소", placeholder: "도로명 주소 전체" },
      { name: "depositAmount", label: "보증금 (원)", type: "number", placeholder: "150000000" },
      { name: "leaseEnd", label: "계약 만료일", type: "date" }
    ]
  },
  {
    id: "parties",
    title: "임대인 / 임차인 정보",
    fields: [
      { name: "lesseeName", label: "임차인 이름", placeholder: "홍길동" },
      { name: "lesseeContact", label: "임차인 연락처", placeholder: "010-0000-0000" },
      { name: "lessorName", label: "임대인 이름", placeholder: "김집주" },
      { name: "lessorContact", label: "임대인 연락처", placeholder: "010-0000-0000" }
    ]
  },
  {
    id: "facts",
    title: "피해 사실 및 요청",
    fields: [
      { name: "issueSummary", label: "피해 상황 요약", type: "textarea", placeholder: "계약 만료 안내에도 보증금 반환이 지연..." },
      { name: "requestDetail", label: "요구 사항", type: "textarea", placeholder: "보증금을 00일까지 반환해 주세요." },
      { name: "evidence", label: "제출 예정 증빙", placeholder: "계약서, 문자 캡처 등" }
    ]
  }
];

const wizardData = {};
let currentWizardIndex = 0;

const processSteps = [
  {
    id: "diagnosis",
    title: "상황 진단",
    desc: "AI 챗봇으로 현재 상황을 정리합니다.",
    status: "done",
    due: "오늘 완료",
    tags: ["상담", "기록"]
  },
  {
    id: "certified",
    title: "내용증명",
    desc: "계약 사실과 반환 요구를 공식 통지합니다.",
    status: "active",
    due: "D-3",
    tags: ["문서작성", "우체국"]
  },
  {
    id: "leaseRegister",
    title: "임차권등기명령",
    desc: "보증금 보호를 위한 등기 절차를 신청합니다.",
    status: "pending",
    due: "예상 2주 후",
    tags: ["법원", "등기소"]
  },
  {
    id: "paymentOrder",
    title: "지급명령 / 소송",
    desc: "필요 시 민사 절차로 확장합니다.",
    status: "pending",
    due: "필요 시",
    tags: ["법원", "소송"]
  }
];

const renderMessage = (sender, text) => {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.innerHTML = `${text}<time>${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</time>`;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

const renderSuggestions = () => {
  suggestionBox.innerHTML = "";
  const flow = chatFlow[chatState.index];
  if (!flow) return;
  flow.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion-btn";
    btn.textContent = option.label;
    btn.addEventListener("click", () => handleChatSelection(flow.id, option));
    suggestionBox.appendChild(btn);
  });
};

const updateChecklist = () => {
  checklistEl.innerHTML = "";
  chatFlow.forEach((step) => {
    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.disabled = true;
    input.checked = Boolean(chatState.answers[step.id]);
    li.appendChild(input);
    const label = document.createElement("span");
    label.textContent = step.prompt;
    li.appendChild(label);
    checklistEl.appendChild(li);
  });
};

const determineDiagnosis = () => {
  const phase = chatState.answers.contractPhase;
  const contact = chatState.answers.contactStatus;
  const notice = chatState.answers.notice;

  if (!phase || !contact || !notice) {
    diagnosisEl.textContent = "필수 질문에 모두 답하면 AI가 맞춤 진단을 제공합니다.";
    contractStatusEl.textContent = "-";
    recommendedActionEl.textContent = "-";
    return;
  }

  if (phase.value === "pre_expiry" && contact.value === "contact_fail") {
    diagnosisEl.textContent = "계약 만료 전이며 임대인과 연락이 원활하지 않습니다. 증거 확보와 내용증명 발송 준비가 필요합니다.";
    contractStatusEl.textContent = "계약 만료 1개월 전";
    recommendedActionEl.textContent = "내용증명 작성 및 발송";
  } else if (phase.value === "post_expiry" && notice.value === "notice_sent") {
    diagnosisEl.textContent = "계약이 이미 종료되었고 반환 요청을 입증할 증빙이 있습니다. 임차권등기명령을 병행 준비하세요.";
    contractStatusEl.textContent = "계약 종료";
    recommendedActionEl.textContent = "임차권등기명령 + 지급명령 사전 준비";
  } else {
    diagnosisEl.textContent = "현재 상황을 기준으로 맞춤 가이드를 생성했습니다. 다음 단계 서류 작성을 이어가세요.";
    contractStatusEl.textContent = "기타";
    recommendedActionEl.textContent = "AI 서류 작성으로 이동";
  }
};

const handleChatSelection = (questionId, option) => {
  renderMessage("user", option.label);
  chatState.answers[questionId] = option;
  updateChecklist();

  setTimeout(() => {
    renderMessage("bot", optionResponses(option));
    chatState.index += 1;
    if (chatState.index < chatFlow.length) {
      setTimeout(() => {
        renderMessage("bot", chatFlow[chatState.index].prompt);
        renderSuggestions();
      }, 400);
    } else {
      suggestionBox.innerHTML = "";
    }
    determineDiagnosis();
    updateWizardFromChat();
  }, 300);
};

const optionResponses = (option) => {
  const tokens = {
    pre_expiry: "계약 만료 전이라면 사전 통지와 증거 확보가 중요합니다.",
    post_expiry: "계약이 이미 종료되었군요. 반환 요청 절차를 바로 진행하겠습니다.",
    contact_fail: "연락이 되지 않는다면 문자/내용증명 등 남는 방식으로 요구해야 합니다.",
    contact_ok: "연락이 되고 있다면 합의 가능성을 열어두고 대응하세요.",
    notice_sent: "이미 통지하셨다면 훌륭합니다. 이를 근거로 공식 서류를 만들게요.",
    notice_pending: "지금 바로 의사를 남길 수 있도록 템플릿을 제공해드릴게요."
  };
  return tokens[option.value] || "확인했습니다. 다음 질문으로 넘어갈게요.";
};

const initChat = () => {
  renderMessage("bot", "안녕하세요. 저는 전세 사기 대응을 돕는 SJ 법률 비서입니다.");
  setTimeout(() => {
    renderMessage("bot", chatFlow[0].prompt);
    renderSuggestions();
    updateChecklist();
  }, 600);
};

$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chat-message");
  const value = input.value.trim();
  if (!value) return;
  renderMessage("user", value);
  input.value = "";
  setTimeout(() => renderMessage("bot", "입력해주신 내용을 기록했습니다. 선택지를 이용하면 더 빠르게 진단돼요."), 300);
});

const renderWizardSteps = () => {
  wizardStepsEl.innerHTML = "";
  wizardSteps.forEach((step, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${step.title}`;
    if (index === currentWizardIndex) {
      li.classList.add("active");
    }
    wizardStepsEl.appendChild(li);
  });
};

const renderWizardFields = () => {
  wizardBodyEl.innerHTML = "";
  const step = wizardSteps[currentWizardIndex];
  step.fields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field";
    const label = document.createElement("label");
    label.setAttribute("for", field.name);
    label.textContent = field.label;
    const input =
      field.type === "textarea"
        ? document.createElement("textarea")
        : document.createElement("input");
    input.id = field.name;
    input.name = field.name;
    input.placeholder = field.placeholder || "";
    input.value = wizardData[field.name] || "";
    if (field.type && field.type !== "textarea") input.type = field.type;
    input.addEventListener("input", (e) => {
      wizardData[field.name] = e.target.value;
      generateDocumentPreview();
    });
    wrapper.append(label, input);
    wizardBodyEl.appendChild(wrapper);
  });
};

const updateWizardProgress = () => {
  const progress = ((currentWizardIndex + 1) / wizardSteps.length) * 100;
  wizardProgress.value = progress;
  wizardProgressLabel.textContent = `${Math.round(progress)}%`;
};

const moveWizard = (direction) => {
  const next = currentWizardIndex + direction;
  if (next < 0 || next >= wizardSteps.length) return;
  currentWizardIndex = next;
  renderWizardSteps();
  renderWizardFields();
  updateWizardProgress();
};

document.querySelector('[data-role="prev"]').addEventListener("click", () => moveWizard(-1));
document.querySelector('[data-role="next"]').addEventListener("click", () => {
  if (currentWizardIndex === wizardSteps.length - 1) {
    alert("서류 초안이 갱신되었습니다.");
  } else {
    moveWizard(1);
  }
});

const generateDocumentPreview = () => {
  const {
    contractName = "미정",
    propertyAddress = "",
    depositAmount = "",
    leaseEnd = "",
    lesseeName = "임차인",
    lessorName = "임대인",
    issueSummary = "상세 상황을 입력하면 이곳에 자동 기입됩니다.",
    requestDetail = "보증금 전액을 지정일 내 반환해 주시기 바랍니다."
  } = wizardData;

  const notice =
    chatState.answers.notice?.value === "notice_sent"
      ? "계약 만료 의사를 문자로 이미 전달했습니다."
      : "계약 만료 의사를 서면으로 통지할 예정입니다.";

  const markup = `
    <h3>내용증명(초안)</h3>
    <p><strong>발신인</strong> ${lesseeName}</p>
    <p><strong>수신인</strong> ${lessorName}</p>
    <p><strong>주소</strong> ${propertyAddress}</p>
    <p><strong>계약명</strong> ${contractName}</p>
    <hr>
    <p>${issueSummary}</p>
    <p>${notice}</p>
    <p>요구 사항: ${requestDetail}</p>
    <p>보증금: ${depositAmount ? Number(depositAmount).toLocaleString() + "원" : "미입력"}</p>
    <p>계약 만료일: ${leaseEnd || "미입력"}</p>
    <hr>
    <p>귀하께서는 본 통지 수령 후 14일 이내 보증금 전액을 반환해 주시기 바랍니다.</p>
  `;

  docPreviewEl.innerHTML = markup;
  docTypeLabel.textContent = "내용증명";
  docUpdatedLabel.textContent = new Date().toLocaleString("ko-KR");
  docReviewLabel.textContent = "검토 대기";
};

const updateWizardFromChat = () => {
  const phase = chatState.answers.contractPhase;
  if (phase?.value === "pre_expiry") {
    wizardData.issueSummary ||= "계약 만료를 앞두고 보증금 반환이 우려됩니다.";
  } else if (phase?.value === "post_expiry") {
    wizardData.issueSummary ||= "계약 만료 후에도 보증금 반환이 이뤄지지 않았습니다.";
  }
  generateDocumentPreview();
};

const renderTimeline = () => {
  timelineEl.innerHTML = "";
  processSteps.forEach((step, index) => {
    const card = document.createElement("article");
    card.className = "timeline-card";
    if (step.status === "done") card.classList.add("done");
    if (step.status === "active") card.classList.add("active");

    const header = document.createElement("header");
    const title = document.createElement("div");
    title.innerHTML = `<strong>${index + 1}. ${step.title}</strong><br><small>${step.due}</small>`;
    const button = document.createElement("button");
    button.className = "ghost-btn";
    button.textContent = step.status === "done" ? "완료됨" : "완료 처리";
    button.disabled = step.status === "done";
    button.addEventListener("click", () => completeTimelineStep(step.id));
    header.append(title, button);

    const desc = document.createElement("p");
    desc.textContent = step.desc;

    const tags = document.createElement("ul");
    step.tags.forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      tags.appendChild(li);
    });

    card.append(header, desc, tags);
    timelineEl.appendChild(card);
  });
};

const completeTimelineStep = (id) => {
  const index = processSteps.findIndex((step) => step.id === id);
  if (index === -1) return;
  processSteps[index].status = "done";
  if (processSteps[index + 1]) {
    processSteps[index + 1].status = "active";
  }
  renderTimeline();
};

const init = () => {
  initChat();
  renderWizardSteps();
  renderWizardFields();
  updateWizardProgress();
  generateDocumentPreview();
  renderTimeline();
};

document.addEventListener("DOMContentLoaded", init);
