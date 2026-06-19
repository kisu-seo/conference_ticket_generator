// --- 아바타 업로드 및 폼 제어 로직 (Avatar Upload & Form Control Logic) ---

document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 참조 (DOM Element References)
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

  let uploadedFile = null;

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

  // 아바타 파일 처리 및 유효성 검사 (Handle avatar file and validation)
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

  // 아바타 상태 에러 노출 (Show avatar validation error)
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

  // 아바타 상태 에러 클리어 (Clear avatar validation error)
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

  // 아바타 리셋 (Reset avatar to initial state)
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

    // 2. 이름 검증 (Validate name)
    const nameValue = fullNameInput.value.trim();
    if (!nameValue) {
      showInputError(fullNameInput, nameErrorContainer, nameErrorText, 'Please enter your full name.');
      isFormValid = false;
    } else {
      clearInputError(fullNameInput, nameErrorContainer);
    }

    // 3. 이메일 검증 (Validate email)
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      showInputError(emailInput, emailErrorContainer, emailErrorText, 'Please enter your email address.');
      isFormValid = false;
    } else if (!emailRegex.test(emailValue)) {
      showInputError(emailInput, emailErrorContainer, emailErrorText, 'Please enter a valid email address.');
      isFormValid = false;
    } else {
      clearInputError(emailInput, emailErrorContainer);
    }

    // 4. 깃허브 아이디 검증 (Validate GitHub Username)
    const githubValue = githubInput.value.trim();
    if (!githubValue) {
      showInputError(githubInput, githubErrorContainer, githubErrorText, 'Please enter your GitHub username.');
      isFormValid = false;
    } else {
      clearInputError(githubInput, githubErrorContainer);
    }

    // 모든 검증 통과 시 티켓 생성 화면으로 전환 (Switch to ticket screen if all valid)
    if (isFormValid) {
      generateTicket(nameValue, emailValue, githubValue);
    }
  });

  // 입력 에러 표시 함수 (Show input field validation error)
  function showInputError(inputEl, errorContainer, errorTextEl, message) {
    inputEl.classList.add('border-orange-500', 'focus:ring-orange-500/20');
    inputEl.classList.remove('border-white/20', 'border-neutral-500', 'hover:border-white/40');
    inputEl.setAttribute('aria-invalid', 'true');
    
    errorTextEl.textContent = message;
    errorContainer.classList.remove('hidden');
  }

  // 입력 에러 클리어 함수 (Clear input field validation error)
  function clearInputError(inputEl, errorContainer) {
    inputEl.classList.remove('border-orange-500', 'focus:ring-orange-500/20');
    inputEl.classList.add('border-neutral-500');
    inputEl.classList.add('hover:border-white/40');
    inputEl.removeAttribute('aria-invalid');
    
    errorContainer.classList.add('hidden');
  }

  // 실시간 에러 정리 피드백 (Real-time error clearance on input)
  fullNameInput.addEventListener('input', () => {
    if (fullNameInput.value.trim()) {
      clearInputError(fullNameInput, nameErrorContainer);
    }
  });

  emailInput.addEventListener('input', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailInput.value.trim() && emailRegex.test(emailInput.value.trim())) {
      clearInputError(emailInput, emailErrorContainer);
    }
  });

  githubInput.addEventListener('input', () => {
    if (githubInput.value.trim()) {
      clearInputError(githubInput, githubErrorContainer);
    }
  });

  // --- [티켓 생성 및 렌더링 (Ticket Generation and Rendering)] ---

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

  // 티켓 스케일 조절 함수 (Scale ticket wrapper to fit viewport)
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

  // 화면 전환 처리 (Switch screen section visibility)
  function switchToTicketScreen() {
    formSection.classList.add('hidden');
    ticketSection.classList.remove('hidden');
    
    // 티켓 크기 조절 (Adjust ticket scale)
    adjustTicketScale();
    
    // 화면 최상단으로 자동 스크롤 (Scroll to top of screen)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
