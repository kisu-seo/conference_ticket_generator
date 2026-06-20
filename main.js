// === [파일 개요] 아바타 업로드, 폼 유효성 검사, 티켓 생성/렌더링 통합 로직 ===
// (Overview: Avatar Upload, Form Validation & Ticket Generation/Rendering Logic)

// DOM이 모두 로드된 후 요소를 참조해야 getElementById가 안전하게 동작함 (Wait for DOM so element lookups don't return null)
document.addEventListener('DOMContentLoaded', () => {
  // 폼/티켓 화면 전환 요소 (Form & Ticket Screen Toggle Elements)
  const ticketForm = document.getElementById('ticket-form');
  const formSection = document.getElementById('form-section');
  const ticketSection = document.getElementById('ticket-section');

  // 아바타 관련 요소 (Avatar Related Elements)
  const dropZone = document.getElementById('drop-zone');
  const avatarInput = document.getElementById('avatar-input');
  const uploadEmpty = document.getElementById('upload-empty');
  const uploadFilled = document.getElementById('upload-filled');
  const avatarPreview = document.getElementById('avatar-preview');
  const btnRemoveAvatar = document.getElementById('btn-remove-avatar');
  const btnChangeAvatar = document.getElementById('btn-change-avatar');
  const avatarHint = document.getElementById('avatar-hint');
  const avatarInfoIcon = document.getElementById('avatar-info-icon');
  const avatarMessageContainer = document.getElementById('avatar-message-container');

  // 입력 필드 관련 요소 (Input Field Related Elements)
  const fullNameInput = document.getElementById('full-name');
  const nameErrorContainer = document.getElementById('name-error-container');
  const nameErrorText = document.getElementById('name-error');

  const emailInput = document.getElementById('email');
  const emailErrorContainer = document.getElementById('email-error-container');
  const emailErrorText = document.getElementById('email-error');

  const githubInput = document.getElementById('github-username');
  const githubErrorContainer = document.getElementById('github-error-container');
  const githubErrorText = document.getElementById('github-error');

  // 티켓 관련 요소 (Ticket Related Elements)
  const ticketUserNameTitle = document.getElementById('ticket-user-name-title');
  const ticketUserEmail = document.getElementById('ticket-user-email');
  const ticketAvatar = document.getElementById('ticket-avatar');
  const ticketUserName = document.getElementById('ticket-user-name');
  const ticketUserGithub = document.getElementById('ticket-user-github');
  const ticketNumber = document.getElementById('ticket-number');

  // 현재 첨부된 아바타 파일 (Currently attached avatar file)
  // 검증, 미리보기, 티켓 생성 전반에서 공유하는 단일 상태값 (Single shared state used by validation, preview rendering, and ticket generation)
  let uploadedFile = null;

  // 이메일 형식 검증용 정규식 (Email format validation regex)
  // 제출 시 검증과 실시간 입력 검증에서 공통으로 사용 (Shared by both submit-time and real-time validation)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 텍스트 입력 필드 검증 설정 (Text Input Field Validation Config)
  // 필드별 요소/에러 메시지/검증 규칙을 한 곳에 모아 제출 검증과 실시간 검증에서 재사용 (Centralizes per-field elements & rules, reused by both submit validation and real-time clearance below)
  const validationFields = [
    {
      input: fullNameInput,
      errorContainer: nameErrorContainer,
      errorText: nameErrorText,
      validate: (value) => (value ? null : 'Please enter your full name.')
    },
    {
      input: emailInput,
      errorContainer: emailErrorContainer,
      errorText: emailErrorText,
      validate: (value) => {
        if (!value) return 'Please enter your email address.';
        if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address.';
        return null;
      }
    },
    {
      input: githubInput,
      errorContainer: githubErrorContainer,
      errorText: githubErrorText,
      validate: (value) => (value ? null : 'Please enter your GitHub username.')
    }
  ];

  // --- [아바타 업로드 영역 이벤트 처리 (Avatar Upload Area Event Handling)] ---

  // 클릭 시 파일 선택창 열기 (Open file picker on click)
  dropZone.addEventListener('click', (e) => {
    // 버튼들이 클릭된 경우는 이벤트 전파를 막아 중복 처리 방지 (Prevent propagation if action buttons are clicked)
    if (e.target === btnRemoveAvatar || e.target === btnChangeAvatar) return;
    avatarInput.click();
  });

  // 키보드로 접근 시 Enter/Space 지원 (Support Enter/Space for keyboard accessibility)
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      avatarInput.click();
    }
  });

  // 드래그 앤 드롭 이벤트 처리 (Drag and drop event handling)
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('border-orange-500', 'bg-white/10');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-orange-500', 'bg-white/10');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleAvatarFile(files[0]);
    }
  });

  avatarInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleAvatarFile(e.target.files[0]);
    }
  });

  // 아바타 지우기 버튼 처리 (Remove avatar button handling)
  btnRemoveAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    resetAvatar();
  });

  // 아바타 변경 버튼 처리 (Change avatar button handling)
  btnChangeAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarInput.click();
  });

  /**
   * 업로드된 파일의 형식과 용량을 검증한 뒤, 통과 시 미리보기를 렌더링합니다.
   * (Validates uploaded file type/size, then renders a preview on success)
   * @param {File} file - 사용자가 선택하거나 드롭한 파일 (File selected or dropped by the user)
   */
  function handleAvatarFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 500 * 1024; // 500KB

    if (!validTypes.includes(file.type)) {
      showAvatarError('Only JPG or PNG images are allowed.');
      return;
    }

    if (file.size > maxSize) {
      showAvatarError('File is too large. Maximum size is 500KB.');
      return;
    }

    // 검증 성공 (Validation Success)
    uploadedFile = file;
    clearAvatarError();

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.src = e.target.result;
      uploadEmpty.classList.add('hidden');
      uploadFilled.classList.remove('hidden');
      dropZone.setAttribute('aria-label', '아바타 이미지 등록 완료. 클릭하여 변경할 수 있습니다.');
    };
    reader.readAsDataURL(file);
  }

  /**
   * 아바타 영역에 에러 상태(메시지/색상/aria 속성)를 표시합니다.
   * (Displays avatar error state: message, color, and aria attributes)
   * @param {string} message - 사용자에게 보여줄 에러 메시지 (Error message shown to the user)
   */
  function showAvatarError(message) {
    uploadedFile = null;
    avatarInput.value = '';
    
    // 에러 메시지 갱신 및 스타일 지정 (Update error message and style)
    avatarHint.textContent = message;
    avatarHint.classList.remove('text-neutral-300');
    avatarHint.classList.add('text-orange-500');
    avatarMessageContainer.classList.remove('text-neutral-300');
    avatarMessageContainer.classList.add('text-orange-500');
    avatarInfoIcon.classList.add('text-orange-500');
    dropZone.classList.add('border-orange-500');
    
    // 스크린 리더용 속성 갱신 (Update Screen Reader attributes)
    dropZone.setAttribute('aria-invalid', 'true');
    dropZone.setAttribute('aria-describedby', 'avatar-hint');
  }

  /**
   * 아바타 에러 상태를 초기 힌트 텍스트/스타일로 되돌립니다.
   * (Resets avatar error state back to the default hint text/style)
   */
  function clearAvatarError() {
    avatarHint.textContent = 'Upload your photo (JPG or PNG, max size: 500KB).';
    avatarHint.classList.remove('text-orange-500');
    avatarHint.classList.add('text-neutral-300');
    avatarMessageContainer.classList.remove('text-orange-500');
    avatarMessageContainer.classList.add('text-neutral-300');
    avatarInfoIcon.classList.remove('text-orange-500');
    dropZone.classList.remove('border-orange-500');
    
    dropZone.removeAttribute('aria-invalid');
  }

  /**
   * 아바타 업로드 상태를 완전히 초기화합니다 (파일/미리보기/에러 모두 제거).
   * (Fully resets avatar upload state: file, preview, and error)
   */
  function resetAvatar() {
    uploadedFile = null;
    avatarInput.value = '';
    avatarPreview.src = '';
    uploadEmpty.classList.remove('hidden');
    uploadFilled.classList.add('hidden');
    dropZone.setAttribute('aria-label', '아바타 이미지 업로드 영역. 드래그 앤 드롭 하거나 클릭하여 이미지를 업로드할 수 있습니다.');
    clearAvatarError();
  }

  // --- [폼 전체 유효성 검사 및 제출 (Form Validation and Submission)] ---

  ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let isFormValid = true;

    // 1. 아바타 파일 첨부 확인 (Check avatar upload)
    if (!uploadedFile) {
      showAvatarError('Please upload an avatar image.');
      isFormValid = false;
    }

    // 2. 텍스트 필드 검증 (이름/이메일/깃허브) (Validate text fields: name/email/github)
    validationFields.forEach(({ input, errorContainer, errorText, validate }) => {
      const value = input.value.trim();
      const errorMessage = validate(value);
      if (errorMessage) {
        showInputError(input, errorContainer, errorText, errorMessage);
        isFormValid = false;
      } else {
        clearInputError(input, errorContainer);
      }
    });

    // 모든 검증 통과 시 티켓 생성 화면으로 전환 (Switch to ticket screen if all valid)
    if (isFormValid) {
      const nameValue = fullNameInput.value.trim();
      const emailValue = emailInput.value.trim();
      const githubValue = githubInput.value.trim();
      generateTicket(nameValue, emailValue, githubValue);
    }
  });

  /**
   * 텍스트 입력 필드에 에러 스타일과 메시지를 표시합니다.
   * (Applies error styling and message to a text input field)
   * @param {HTMLElement} inputEl - 에러를 표시할 입력 필드 (Target input element)
   * @param {HTMLElement} errorContainer - 에러 메시지를 담는 컨테이너 (Container wrapping the error message)
   * @param {HTMLElement} errorTextEl - 에러 메시지 텍스트 요소 (Element holding the error text)
   * @param {string} message - 표시할 에러 메시지 (Message to display)
   */
  function showInputError(inputEl, errorContainer, errorTextEl, message) {
    inputEl.classList.add('border-orange-500', 'focus:ring-orange-500/20');
    inputEl.classList.remove('border-white/20', 'border-neutral-500', 'hover:border-white/40');
    inputEl.setAttribute('aria-invalid', 'true');
    
    errorTextEl.textContent = message;
    errorContainer.classList.remove('hidden');
  }

  /**
   * 텍스트 입력 필드의 에러 스타일과 메시지를 제거합니다.
   * (Removes error styling and message from a text input field)
   * @param {HTMLElement} inputEl - 대상 입력 필드 (Target input element)
   * @param {HTMLElement} errorContainer - 숨길 에러 메시지 컨테이너 (Error message container to hide)
   */
  function clearInputError(inputEl, errorContainer) {
    inputEl.classList.remove('border-orange-500', 'focus:ring-orange-500/20');
    inputEl.classList.add('border-neutral-500');
    inputEl.classList.add('hover:border-white/40');
    inputEl.removeAttribute('aria-invalid');
    
    errorContainer.classList.add('hidden');
  }

  // 실시간 에러 정리 피드백 (Real-time error clearance on input)
  // validationFields의 동일한 validate 규칙을 재사용하여 제출 검증과 결과가 항상 일치하도록 보장 (Reuses the same validate rule from validationFields so this always agrees with submit-time validation)
  validationFields.forEach(({ input, errorContainer, validate }) => {
    input.addEventListener('input', () => {
      if (!validate(input.value.trim())) {
        clearInputError(input, errorContainer);
      }
    });
  });

  // --- [티켓 생성 및 렌더링 (Ticket Generation and Rendering)] ---

  /**
   * 입력값으로 티켓 데이터(이름/이메일/깃허브/번호/아바타)를 채우고 티켓 화면으로 전환합니다.
   * (Fills ticket data from form input and switches to the ticket screen)
   * @param {string} name - 검증을 통과한 이름 (Validated full name)
   * @param {string} email - 검증을 통과한 이메일 (Validated email address)
   * @param {string} github - 검증을 통과한 깃허브 아이디 (Validated GitHub username)
   */
  function generateTicket(name, email, github) {
    // 깃허브 아이디 형식 자동 가공 (Auto-format GitHub username)
    let formattedGithub = github;
    if (!github.startsWith('@')) {
      formattedGithub = '@' + github;
    }

    // 무작위 티켓 번호 생성 (Generate random 5-digit ticket number)
    const randomNum = String(Math.floor(1000 + Math.random() * 90000)).padStart(5, '0');
    const ticketId = `#${randomNum}`;

    // 티켓 요소 바인딩 (Bind ticket elements)
    ticketUserNameTitle.textContent = name;
    ticketUserEmail.textContent = email;
    ticketUserName.textContent = name;
    ticketUserGithub.textContent = formattedGithub;
    ticketNumber.textContent = ticketId;

    // 아바타 이미지 읽기 및 설정 (Set avatar preview URL)
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        ticketAvatar.src = e.target.result;
        switchToTicketScreen();
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      switchToTicketScreen();
    }
  }

  /**
   * 뷰포트 너비에 맞춰 600px 고정폭 티켓을 비율대로 축소합니다.
   * (Scales the fixed 600px-wide ticket down proportionally to fit narrower viewports)
   */
  function adjustTicketScale() {
    const wrapper = document.querySelector('.ticket-scaler-wrapper');
    const container = document.querySelector('.ticket-container');
    if (!wrapper || !container) return;

    const containerWidth = container.clientWidth;
    if (containerWidth < 600) {
      const scale = containerWidth / 600;
      wrapper.style.transform = `scale(${scale})`;
      wrapper.style.transformOrigin = 'center top';
      container.style.height = `${280 * scale}px`;
    } else {
      wrapper.style.transform = 'none';
      container.style.height = 'auto';
    }
  }

  // 화면 크기 변경 시 호출 (Call on resize)
  window.addEventListener('resize', adjustTicketScale);

  /**
   * 신청 폼을 숨기고 티켓 화면을 표시한 뒤, 스케일을 조정하고 화면 상단으로 스크롤합니다.
   * (Hides the form, reveals the ticket screen, then adjusts its scale and scrolls to top)
   */
  function switchToTicketScreen() {
    formSection.classList.add('hidden');
    ticketSection.classList.remove('hidden');
    
    // 티켓 크기 조절 (Adjust ticket scale)
    adjustTicketScale();
    
    // 화면 최상단으로 자동 스크롤 (Scroll to top of screen)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
