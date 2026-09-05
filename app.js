const toast = document.querySelector('.toast');
let toastTimer;
let installPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  document.querySelector('#install-app').hidden = false;
});

document.querySelector('#install-app').addEventListener('click', async () => {
  if (!installPrompt) {
    showToast('Ouvre le menu Edge ⋯ puis « Installer Drop Zone Coach ».');
    return;
  }
  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') showToast('Drop Zone Coach est installé sur ton ordinateur.');
  installPrompt = null;
  document.querySelector('#install-app').hidden = true;
});

window.addEventListener('appinstalled', () => {
  document.querySelector('#install-app').hidden = true;
  showToast('Drop Zone Coach est installé sur ton ordinateur.');
});

const onboarding = document.querySelector('#onboarding');
const onboardingSteps = [...document.querySelectorAll('.onboarding-step')];
const onboardingAnswers = {};
let onboardingStep = 1;

function renderOnboarding() {
  onboardingSteps.forEach((step) => step.classList.toggle('active', Number(step.dataset.step) === onboardingStep));
  onboarding.querySelector('.onboarding-progress span').style.width = `${onboardingStep * 20}%`;
  document.querySelector('#onboarding-back').hidden = onboardingStep === 1;
  document.querySelector('#onboarding-note').textContent = onboardingStep === 5 ? 'Dernière question' : 'Sélectionne une réponse pour continuer';
}

function closeOnboarding() {
  onboarding.classList.add('is-hidden');
  onboarding.setAttribute('aria-hidden', 'true');
  const mode = onboardingAnswers.mode || 'Build';
  const goal = onboardingAnswers.goal || 'progresser';
  const pseudo = onboardingAnswers.pseudo || 'joueur';
  document.querySelectorAll('.chat-pseudo').forEach((element) => { element.textContent = pseudo; });
  document.querySelectorAll('.user-chip span:not(.avatar)').forEach((element) => { element.textContent = pseudo; });
  document.querySelector('.profile-pseudo').textContent = pseudo;
  document.querySelectorAll('.user-initials').forEach((element) => { element.textContent = pseudo.slice(0, 2).toUpperCase(); });
  document.querySelector('.welcome-pseudo').textContent = `BIENVENUE, ${pseudo.toUpperCase()}`;
  document.querySelector('.subcopy').textContent = `Programme ${mode} activé pour ${goal.toLowerCase()}. Ta séance est prête : 42 minutes ciblées.`;
  localStorage.setItem('drop-zone-profile', JSON.stringify(onboardingAnswers));
}

document.querySelectorAll('.choice').forEach((choice) => {
  choice.addEventListener('click', () => {
    onboardingAnswers[choice.dataset.question] = choice.dataset.value;
    if (onboardingStep < 5) {
      onboardingStep += 1;
      renderOnboarding();
    } else {
      closeOnboarding();
      showToast(`Profil enregistré pour ${onboardingAnswers.pseudo || 'joueur'} : ${onboardingAnswers.input}, ${onboardingAnswers.mode}.`);
    }
  });
});

document.querySelector('#pseudo-next').addEventListener('click', () => {
  const pseudo = document.querySelector('#pseudo-input').value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!pseudo) {
    showToast('Choisis un pseudo avant de continuer.');
    return;
  }
  onboardingAnswers.pseudo = pseudo;
  onboardingStep = 2;
  renderOnboarding();
});

document.querySelector('#onboarding-back').addEventListener('click', () => {
  onboardingStep = Math.max(1, onboardingStep - 1);
  renderOnboarding();
});

document.querySelector('#onboarding-skip').addEventListener('click', closeOnboarding);
const savedProfile = JSON.parse(localStorage.getItem('drop-zone-profile') || 'null');
if (savedProfile?.pseudo) {
  Object.assign(onboardingAnswers, savedProfile);
  closeOnboarding();
}
renderOnboarding();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' }));
});

document.querySelector('#start-session').addEventListener('click', () => {
  const button = document.querySelector('#start-session');
  button.innerHTML = '<span>✓</span> Séance en cours <b>→</b>';
  showToast('Séance lancée. Reste concentré sur tes edits.');
});

document.querySelector('#reset-session').addEventListener('click', () => {
  resetDailyTraining();
  showToast('Séance réinitialisée pour un nouveau départ.');
});

function resetDailyTraining() {
  document.querySelectorAll('.session-row').forEach((row, index) => {
    row.classList.toggle('current', index === 0);
    row.classList.remove('done');
    row.querySelector('.session-check').textContent = String(index + 1);
    row.querySelector('.session-state').textContent = index === 0 ? '00:00' : 'À VENIR';
    row.querySelector('.session-progress span')?.style.setProperty('width', '0%');
  });
  document.querySelector('#start-session').innerHTML = '<span>▶</span> Commencer la séance <b>→</b>';
}

document.querySelector('#ask-coach').addEventListener('click', () => {
  chatDrawer.classList.add('open');
  chatInput.focus();
  showToast('Coach vocal prêt. Appuie sur le micro pour parler.');
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.resource-card').forEach((card) => {
      card.classList.toggle('is-hidden', tab.dataset.filter !== 'all' && card.dataset.type !== tab.dataset.filter);
    });
  });
});

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((navItem) => navItem.classList.remove('active'));
    item.classList.add('active');
  });
});

const chatDrawer = document.querySelector('#chat-drawer');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const pseudo = () => onboardingAnswers.pseudo || JSON.parse(localStorage.getItem('drop-zone-profile') || '{}').pseudo || 'joueur';
const voiceSelect = document.querySelector('#voice-select');
const voiceMode = document.querySelector('#voice-mode');
const voiceVolume = document.querySelector('#voice-volume');
const stopVoice = document.querySelector('#stop-voice');
let availableVoices = [];
const fortniteGlossary = [
  'drop spot', 'bus path', 'loot', 'chest', 'rotation', 'zone', 'storm surge', 'deadside',
  'high ground', 'low ground', 'piece control', 'box fight', 'right-hand peek', 'prefire',
  'edit', 'reset', 'tunnel', 'tarp', 'tunneling', 'mats', 'refresh', 'cracked', 'one shot',
  'beam', 'tag', 'third-party', 'clutch', 'IGL', 'frag', 'entry', 'endgame', 'moving zone',
  'surge tags', 'key', 'take height', 'rebox', 'layer', 'spray', 'shotgun', 'tracking', 'flick'
];

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  availableVoices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('fr'));
  voiceSelect.innerHTML = availableVoices.length
    ? availableVoices.map((voice, index) => `<option value="${index}">${voice.name}</option>`).join('')
    : '<option value="">Voix par défaut du navigateur</option>';
  const savedVoice = localStorage.getItem('drop-zone-voice');
  if (savedVoice && availableVoices.some((voice) => voice.name === savedVoice)) voiceSelect.value = String(availableVoices.findIndex((voice) => voice.name === savedVoice));
  if (!savedVoice && availableVoices.length) {
    const naturalVoice = availableVoices.findIndex((voice) => /google|microsoft|denise|amelie|thomas|hortense/i.test(voice.name));
    if (naturalVoice >= 0) voiceSelect.value = String(naturalVoice);
  }
}

window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
loadVoices();
voiceSelect.addEventListener('change', () => {
  const selectedVoice = availableVoices[Number(voiceSelect.value)];
  if (selectedVoice) localStorage.setItem('drop-zone-voice', selectedVoice.name);
});
voiceMode.addEventListener('click', () => {
  const enabled = voiceMode.getAttribute('aria-pressed') !== 'true';
  voiceMode.setAttribute('aria-pressed', String(enabled));
  voiceMode.classList.toggle('active', enabled);
  showToast(enabled ? 'Mode vocal activé.' : 'Mode vocal désactivé.');
});

function addChatMessage(message, type) {
  const element = document.createElement('div');
  element.className = `chat-message ${type}`;
  element.textContent = message;
  if (type === 'coach' && 'speechSynthesis' in window) {
    const replayButton = document.createElement('button');
    replayButton.className = 'replay-voice';
    replayButton.type = 'button';
    replayButton.title = 'Écouter la réponse';
    replayButton.textContent = '🔊';
    replayButton.addEventListener('click', () => speakCoach(message));
    element.appendChild(replayButton);
  }
  chatMessages.appendChild(element);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function speakCoach(message) {
  if (!('speechSynthesis' in window)) {
    showToast('La lecture vocale n’est pas disponible dans ce navigateur.');
    return;
  }
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(message);
  speech.lang = 'fr-FR';
  speech.rate = 0.98;
  speech.pitch = 0.98;
  speech.volume = Number(voiceVolume.value) / 100;
  const selectedVoice = availableVoices[Number(voiceSelect.value)];
  if (selectedVoice) speech.voice = selectedVoice;
  window.speechSynthesis.speak(speech);
}

stopVoice.addEventListener('click', () => {
  window.speechSynthesis?.cancel();
  showToast('Voix arrêtée.');
});
voiceVolume.addEventListener('input', () => localStorage.setItem('drop-zone-volume', voiceVolume.value));
voiceVolume.value = localStorage.getItem('drop-zone-volume') || '55';

function coachReply(question) {
  const text = question.toLowerCase();
  if (text.includes('sensib') || text.includes('sensitivity')) return `${pseudo()}, ne change pas ta sensibilité aujourd’hui. Joue trois games, regarde si tu rates plutôt les micro-ajustements ou les grands flicks, puis on ajuste un seul réglage.`;
  if (text.includes('manette') || text.includes('controller')) return `${pseudo()}, sur manette, commence par vérifier tes zones mortes et garde une accélération stable. Travaille ensuite le tracking avant de chercher des flicks rapides.`;
  if (text.includes('clavier') || text.includes('souris') || text.includes('keyboard')) return `${pseudo()}, garde des touches simples et accessibles pour build, edit et reset. Le plus important est de pouvoir enchaîner sans retirer ton index du mouvement.`;
  if (text.includes('build') || text.includes('construction')) return `${pseudo()}, entraîne une seule séquence : mur, cône, sol, edit, reset. Répète-la lentement, puis ajoute la pression d’un bot ou d’un ami.`;
  if (text.includes('zero build') || text.includes('sans construction')) return `${pseudo()}, en Zero Build, joue d’abord le couvert et la hauteur. Ne prends pas un duel à découvert : crée une ligne de fuite avant de tirer.`;
  if (text.includes('edit')) return `${pseudo()}, commence par dix edits propres, puis travaille les resets. En fight, ne panique pas : prends ton right-hand peek, confirme ton angle, et seulement après tu accélères.`;
  if (text.includes('aim') || text.includes('vis')) return `${pseudo()}, fais cinq minutes de tracking puis cinq minutes de flicks. Garde ta sensibilité stable et cherche un bon prefire plutôt que de spray au hasard.`;
  if (text.includes('fight')) return `Avant le fight, prends un angle et crée ton piece control. Si ton adversaire est cracked, ne donne pas un peek gratuit : mets-le sous pression, puis finis proprement.`;
  if (text.includes('rotate') || text.includes('zone') || text.includes('rotation')) return `${pseudo()}, regarde la zone avant de looter. Pars du côté deadside, garde assez de mats pour un tarp et évite de traverser une moving zone sans information.`;
  if (text.includes('loot') || text.includes('drop')) return `Choisis un drop spot que tu connais. Loot vite, prends un shotgun fiable, des heals et assez de mats, puis quitte la zone avant que les autres joueurs arrivent.`;
  if (text.includes('mental') || text.includes('stress')) return `Respire quatre secondes avant de relancer. Après chaque game, analyse une seule décision : ton peek, ta rotation ou ton usage des mats. Le reste peut attendre.`;
  if (text.includes('compét') || text.includes('tournoi') || text.includes('endgame')) return `En endgame, joue ton layer et écoute les surge tags. Garde tes mats pour le tunnel, prends la hauteur seulement si elle est gratuite, et pense placement avant élimination.`;
  return `J’ai compris ta question, ${pseudo()}. Donne-moi un peu plus de contexte sur ce qui s’est passé dans ta game et je te répondrai étape par étape.`;
}

document.querySelector('#chat-launcher').addEventListener('click', () => { chatDrawer.classList.add('open'); chatInput.focus(); });
document.querySelector('#close-chat').addEventListener('click', () => chatDrawer.classList.remove('open'));
document.querySelector('#chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  addChatMessage(question, 'user');
  chatInput.value = '';
  const answer = coachReply(question);
  addChatMessage(answer, 'coach');
  speakCoach(answer);
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
document.querySelector('#voice-button').addEventListener('click', () => {
  const voiceButton = document.querySelector('#voice-button');
  if (!SpeechRecognition) {
    showToast('La dictée vocale n’est pas disponible dans ce navigateur.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = () => { voiceButton.classList.add('listening'); showToast('Je t’écoute...'); };
  recognition.onresult = (event) => {
    chatInput.value = event.results[0][0].transcript;
    document.querySelector('#chat-form').requestSubmit();
  };
  recognition.onerror = () => { voiceButton.classList.remove('listening'); showToast('Je n’ai pas compris. Réessaie.'); };
  recognition.onend = () => voiceButton.classList.remove('listening');
  recognition.start();
});

const customizationPage = document.querySelector('#customization-page');
const themeLabel = document.querySelector('#theme-label');
const colorInputs = [...document.querySelectorAll('[data-color]')];
const themeNames = { orange: 'Orange', blue: 'Bleu', yellow: 'Jaune', purple: 'Violet', red: 'Rouge', green: 'Vert', black: 'Noir', rgb: 'RGB', custom: 'Personnalisé' };
const themes = {
  orange: { primary: '#ff7954', secondary: '#83e1cb', background: '#080c0d', button: '#ff7954', text: '#fffdf7', border: '#43514e', icon: '#83e1cb', chat: '#1d2526', mic: '#ff7954' },
  blue: { primary: '#4d9dff', secondary: '#73e1ff', background: '#08111f', button: '#4d9dff', text: '#f5f9ff', border: '#315174', icon: '#73e1ff', chat: '#12263b', mic: '#4d9dff' },
  yellow: { primary: '#ffc857', secondary: '#79e6bd', background: '#161208', button: '#ffc857', text: '#fffbea', border: '#6f5c2d', icon: '#79e6bd', chat: '#282116', mic: '#ffc857' },
  purple: { primary: '#ad7aff', secondary: '#6de3ff', background: '#100b1d', button: '#ad7aff', text: '#fbf8ff', border: '#59447b', icon: '#6de3ff', chat: '#211936', mic: '#ad7aff' },
  red: { primary: '#ff5264', secondary: '#ffb35c', background: '#18090d', button: '#ff5264', text: '#fff5f5', border: '#71323b', icon: '#ffb35c', chat: '#2b1419', mic: '#ff5264' },
  green: { primary: '#55d68b', secondary: '#72d9f0', background: '#081610', button: '#55d68b', text: '#f3fff8', border: '#376951', icon: '#72d9f0', chat: '#12291f', mic: '#55d68b' },
  black: { primary: '#e2e5ed', secondary: '#9ca8ba', background: '#070707', button: '#e2e5ed', text: '#fafafa', border: '#3b3e45', icon: '#c6cfdd', chat: '#18191d', mic: '#e2e5ed' },
  rgb: { primary: '#ff3d9a', secondary: '#46eaff', background: '#08080f', button: '#46eaff', text: '#ffffff', border: '#684cff', icon: '#ffdf4d', chat: '#17152d', mic: '#ff3d9a' }
};

function applyCustomization(profile) {
  const root = document.documentElement;
  Object.entries(profile.colors).forEach(([name, value]) => {
    root.style.setProperty(`--${name}`, value);
    if (name === 'primary' || name === 'button') root.style.setProperty('--orange', value);
    if (name === 'secondary' || name === 'icon') root.style.setProperty('--teal', value);
    if (name === 'background') root.style.setProperty('--ink', value);
    if (name === 'text') root.style.setProperty('--paper', value);
    if (name === 'border') root.style.setProperty('--line', value);
  });
  document.body.classList.remove('mode-minimaliste', 'mode-gaming', 'mode-futuriste', 'mode-neon', 'mode-esport', 'mode-clair', 'mode-sombre', 'theme-rgb', 'layout-dashboard', 'layout-focus', 'layout-compact');
  document.body.classList.add(`mode-${profile.style}`);
  document.body.classList.add(`layout-${profile.layout || 'dashboard'}`);
  if (profile.theme === 'rgb') document.body.classList.add('theme-rgb');
  themeLabel.textContent = themeNames[profile.theme] || 'Personnalisé';
  document.querySelectorAll('.theme-choice').forEach((choice) => choice.classList.toggle('active', choice.dataset.theme === profile.theme));
  document.querySelectorAll('.style-choice').forEach((choice) => choice.classList.toggle('active', choice.dataset.style === profile.style));
  document.querySelectorAll('.layout-choice').forEach((choice) => choice.classList.toggle('active', choice.dataset.layout === (profile.layout || 'dashboard')));
  colorInputs.forEach((input) => { if (profile.colors[input.dataset.color]) input.value = profile.colors[input.dataset.color]; });
  document.documentElement.style.setProperty('--preview-primary', profile.colors.primary);
  document.documentElement.style.setProperty('--preview-secondary', profile.colors.secondary);
  localStorage.setItem('drop-zone-customization', JSON.stringify(profile));
}

function currentColors() {
  return Object.fromEntries(colorInputs.map((input) => [input.dataset.color, input.value]));
}

function openCustomization() {
  customizationPage.classList.add('open');
  customizationPage.setAttribute('aria-hidden', 'false');
}

document.querySelector('.icon-button').addEventListener('click', openCustomization);
document.querySelector('#close-customization').addEventListener('click', () => {
  customizationPage.classList.remove('open');
  customizationPage.setAttribute('aria-hidden', 'true');
});

document.querySelectorAll('.theme-choice').forEach((choice) => {
  choice.addEventListener('click', () => {
    const colors = choice.dataset.theme === 'custom' ? currentColors() : themes[choice.dataset.theme];
    const saved = JSON.parse(localStorage.getItem('drop-zone-customization') || 'null');
    applyCustomization({ theme: choice.dataset.theme, style: saved?.style || 'minimaliste', layout: saved?.layout || 'dashboard', colors });
  });
});

document.querySelectorAll('.style-choice').forEach((choice) => {
  choice.addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem('drop-zone-customization') || 'null');
    applyCustomization({ theme: saved?.theme || 'orange', style: choice.dataset.style, layout: saved?.layout || 'dashboard', colors: currentColors() });
  });
});

document.querySelectorAll('.layout-choice').forEach((choice) => {
  choice.addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem('drop-zone-customization') || 'null');
    applyCustomization({ theme: saved?.theme || 'orange', style: saved?.style || 'minimaliste', layout: choice.dataset.layout, colors: currentColors() });
  });
});

colorInputs.forEach((input) => input.addEventListener('input', () => {
  const saved = JSON.parse(localStorage.getItem('drop-zone-customization') || 'null');
  applyCustomization({ theme: 'custom', style: saved?.style || 'minimaliste', layout: saved?.layout || 'dashboard', colors: currentColors() });
}));

const savedCustomization = JSON.parse(localStorage.getItem('drop-zone-customization') || 'null');
applyCustomization(savedCustomization || { theme: 'orange', style: 'minimaliste', layout: 'dashboard', colors: themes.orange });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));