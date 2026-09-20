// ===================== ELEMENTS =====================
const acidSlider = document.getElementById('acidSlider');
const baseSlider = document.getElementById('baseSlider');
const acidValue = document.getElementById('acidValue');
const baseValue = document.getElementById('baseValue');

const acidLiquid = document.getElementById('acidLiquid');
const baseLiquid = document.getElementById('baseLiquid');
const resultLiquid = document.getElementById('resultLiquid');
const bubbles = document.getElementById('bubbles');

const mixBtn = document.getElementById('mixBtn');
const mixStatus = document.getElementById('mixStatus');

const phValue = document.getElementById('phValue');
const stateValue = document.getElementById('stateValue');
const observationText = document.getElementById('observationText');

const stepsList = document.getElementById('stepsList');
const statusBadge = document.getElementById('statusBadge');

const resetBtn = document.getElementById('resetBtn');
const completeBtn = document.getElementById('completeBtn');
const resultsPanel = document.getElementById('resultsPanel');
const quizPanel = document.getElementById('quizPanel');

const finalAcid = document.getElementById('finalAcid');
const finalBase = document.getElementById('finalBase');
const finalPh = document.getElementById('finalPh');
const finalState = document.getElementById('finalState');

const quizList = document.getElementById('quizList');
const quizScore = document.getElementById('quizScore');

// ===================== GEOMETRY =====================
const MINI_BASE_Y = 74;
const MINI_MAX_H = 60;
const RESULT_BASE_Y = 185;
const RESULT_MAX_H = 160;
const RESULT_FILL_PCT = 62;

const ACID_RGB = [200, 107, 61];
const NEUTRAL_RGB = [217, 184, 95];
const BASE_RGB = [73, 99, 79];

const DEFAULT_OBSERVATION = 'Kislota va ishqor miqdorini tanlab, «ARALASHTIRISH» tugmasini bosing.';

// ===================== STATE =====================
let sliderTouched = false;
let mixed = false;
let completed = false;

// ===================== HELPERS =====================
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mixColor(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function colorForPH(ph) {
  if (ph <= 7) {
    return mixColor(NEUTRAL_RGB, ACID_RGB, (7 - ph) / 7);
  }
  return mixColor(NEUTRAL_RGB, BASE_RGB, (ph - 7) / 7);
}

function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', pct + '%');
}

function updateVesselFill(rect, pct, maxHeight, baseY) {
  const h = (clamp(pct, 0, 100) / 100) * maxHeight;
  const y = baseY - h;
  rect.setAttribute('height', h.toFixed(1));
  rect.setAttribute('y', y.toFixed(1));
}

function computeResult(acid, base) {
  const diff = acid - base;
  let ph = 7 - diff * (7 / 50);
  ph = clamp(ph, 0, 14);
  ph = Number(ph.toFixed(1));

  let state;
  if (ph < 6.5) state = 'Kislotali';
  else if (ph > 7.5) state = 'Ishqoriy';
  else state = 'Neytral';

  return { ph, state };
}

function setObservation(state) {
  const messages = {
    Kislotali: 'Kislota miqdori ko‘proq bo‘lgani uchun aralashma kislotali bo‘ldi.',
    Ishqoriy: 'Ishqor miqdori ko‘proq bo‘lgani uchun aralashma ishqoriy bo‘ldi.',
    Neytral: 'Kislota va ishqor miqdori teng bo‘lgani uchun aralashma neytral holatga yaqinlashdi.'
  };
  observationText.textContent = messages[state];
}

// ===================== STEPS =====================
function renderStepNumber(li) {
  const num = li.querySelector('.step-num');
  num.textContent = li.classList.contains('done') ? '✓' : li.dataset.step;
}

function renderSteps() {
  const steps = [...stepsList.children];
  steps.forEach((li) => li.classList.remove('active', 'done'));

  if (completed) {
    steps.forEach((li) => li.classList.add('done'));
  } else if (!sliderTouched) {
    steps[0].classList.add('active');
  } else if (!mixed) {
    steps[0].classList.add('done');
    steps[1].classList.add('active');
  } else {
    steps[0].classList.add('done');
    steps[1].classList.add('done');
    steps[2].classList.add('active');
  }

  steps.forEach(renderStepNumber);
}

// ===================== QUIZ =====================
const quizData = [
  {
    q: 'pH 7 nimani bildiradi?',
    options: ['Kislotali', 'Neytral', 'Ishqoriy'],
    correct: 'Neytral'
  },
  {
    q: 'Agar kislota miqdori ko‘proq bo‘lsa, aralashma qanday bo‘ladi?',
    options: ['Kislotali', 'Neytral', 'Ishqoriy'],
    correct: 'Kislotali'
  },
  {
    q: 'Agar ishqor miqdori ko‘proq bo‘lsa, aralashma qanday bo‘ladi?',
    options: ['Kislotali', 'Neytral', 'Ishqoriy'],
    correct: 'Ishqoriy'
  }
];

function buildQuiz() {
  quizList.innerHTML = '';
  quizScore.classList.add('hidden');
  quizScore.textContent = '';

  let score = 0;
  let answeredCount = 0;

  quizData.forEach((item, idx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-question';

    const qText = document.createElement('p');
    qText.className = 'quiz-question-text';
    qText.textContent = `${idx + 1}. ${item.q}`;
    qDiv.appendChild(qText);

    const optsDiv = document.createElement('div');
    optsDiv.className = 'quiz-options';

    const feedback = document.createElement('p');
    feedback.className = 'quiz-feedback hidden';

    item.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.textContent = opt;

      btn.addEventListener('click', () => {
        const buttons = optsDiv.querySelectorAll('.quiz-option');
        buttons.forEach((b) => { b.disabled = true; });

        if (opt === item.correct) {
          btn.classList.add('correct');
          feedback.textContent = 'To‘g‘ri javob!';
          feedback.classList.remove('wrong', 'hidden');
          score++;
        } else {
          btn.classList.add('incorrect');
          buttons.forEach((b) => {
            if (b.textContent === item.correct) b.classList.add('correct');
          });
          feedback.textContent = `Noto‘g‘ri. To‘g‘ri javob: ${item.correct}`;
          feedback.classList.remove('hidden');
          feedback.classList.add('wrong');
        }

        answeredCount++;
        if (answeredCount === quizData.length) {
          quizScore.textContent = `Natija: ${score} / ${quizData.length}`;
          quizScore.classList.remove('hidden');
        }
      });

      optsDiv.appendChild(btn);
    });

    qDiv.appendChild(optsDiv);
    qDiv.appendChild(feedback);
    quizList.appendChild(qDiv);
  });
}

// ===================== EVENTS =====================
acidSlider.addEventListener('input', () => {
  sliderTouched = true;
  acidValue.textContent = acidSlider.value;
  updateSliderFill(acidSlider);
  updateVesselFill(acidLiquid, (acidSlider.value / 50) * 100, MINI_MAX_H, MINI_BASE_Y);
  renderSteps();
});

baseSlider.addEventListener('input', () => {
  sliderTouched = true;
  baseValue.textContent = baseSlider.value;
  updateSliderFill(baseSlider);
  updateVesselFill(baseLiquid, (baseSlider.value / 50) * 100, MINI_MAX_H, MINI_BASE_Y);
  renderSteps();
});

mixBtn.addEventListener('click', () => {
  sliderTouched = true;
  mixed = true;
  mixBtn.disabled = true;
  mixStatus.textContent = 'Aralashtirilmoqda...';

  updateVesselFill(acidLiquid, 0, MINI_MAX_H, MINI_BASE_Y);
  updateVesselFill(baseLiquid, 0, MINI_MAX_H, MINI_BASE_Y);

  const acid = parseFloat(acidSlider.value);
  const base = parseFloat(baseSlider.value);
  const { ph, state } = computeResult(acid, base);
  const color = colorForPH(ph);

  updateVesselFill(resultLiquid, RESULT_FILL_PCT, RESULT_MAX_H, RESULT_BASE_Y);
  resultLiquid.setAttribute('fill', color);
  bubbles.classList.add('bubbling');
  renderSteps();

  setTimeout(() => {
    bubbles.classList.remove('bubbling');
    updateVesselFill(acidLiquid, (acidSlider.value / 50) * 100, MINI_MAX_H, MINI_BASE_Y);
    updateVesselFill(baseLiquid, (baseSlider.value / 50) * 100, MINI_MAX_H, MINI_BASE_Y);

    phValue.textContent = ph.toFixed(1);
    stateValue.textContent = state;
    setObservation(state);

    mixStatus.textContent = 'Aralashtirildi ✓';
    mixBtn.disabled = false;
  }, 750);
});

resetBtn.addEventListener('click', () => {
  acidSlider.value = 25;
  baseSlider.value = 25;
  acidValue.textContent = '25';
  baseValue.textContent = '25';
  updateSliderFill(acidSlider);
  updateSliderFill(baseSlider);

  updateVesselFill(acidLiquid, 50, MINI_MAX_H, MINI_BASE_Y);
  updateVesselFill(baseLiquid, 50, MINI_MAX_H, MINI_BASE_Y);
  updateVesselFill(resultLiquid, 0, RESULT_MAX_H, RESULT_BASE_Y);
  resultLiquid.setAttribute('fill', '#D9B85F');
  bubbles.classList.remove('bubbling');

  phValue.textContent = '—';
  stateValue.textContent = '—';
  observationText.textContent = DEFAULT_OBSERVATION;
  mixStatus.textContent = 'Aralashtirishga tayyor';
  mixBtn.disabled = false;

  sliderTouched = false;
  mixed = false;
  completed = false;
  renderSteps();

  resultsPanel.classList.add('hidden');
  quizPanel.classList.add('hidden');
  buildQuiz();

  statusBadge.classList.remove('done');
  statusBadge.innerHTML = '<i class="status-dot"></i>Tajriba tayyor';
});

completeBtn.addEventListener('click', () => {
  completed = true;
  const acid = parseFloat(acidSlider.value);
  const base = parseFloat(baseSlider.value);
  const { ph, state } = computeResult(acid, base);

  finalAcid.textContent = acid;
  finalBase.textContent = base;
  finalPh.textContent = ph.toFixed(1);
  finalState.textContent = state;

  resultsPanel.classList.remove('hidden');
  quizPanel.classList.remove('hidden');
  renderSteps();

  statusBadge.classList.add('done');
  statusBadge.innerHTML = '<i class="status-dot"></i>Tajriba yakunlandi ✓';

  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ===================== INIT =====================
updateSliderFill(acidSlider);
updateSliderFill(baseSlider);
updateVesselFill(acidLiquid, 50, MINI_MAX_H, MINI_BASE_Y);
updateVesselFill(baseLiquid, 50, MINI_MAX_H, MINI_BASE_Y);
updateVesselFill(resultLiquid, 0, RESULT_MAX_H, RESULT_BASE_Y);
renderSteps();
buildQuiz();
