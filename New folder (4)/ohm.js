// ===================== ELEMENTS =====================
const voltageSlider = document.getElementById('voltageSlider');
const resistanceSlider = document.getElementById('resistanceSlider');
const voltageValue = document.getElementById('voltageValue');
const resistanceValue = document.getElementById('resistanceValue');
const currentValue = document.getElementById('currentValue');
const powerValue = document.getElementById('powerValue');

const observationText = document.getElementById('observationText');
const stepsList = document.getElementById('stepsList');
const statusBadge = document.getElementById('statusBadge');

const resetBtn = document.getElementById('resetBtn');
const completeBtn = document.getElementById('completeBtn');
const resultsPanel = document.getElementById('resultsPanel');
const quizPanel = document.getElementById('quizPanel');

const finalVoltage = document.getElementById('finalVoltage');
const finalResistance = document.getElementById('finalResistance');
const finalCurrent = document.getElementById('finalCurrent');
const finalPower = document.getElementById('finalPower');

const graphCurve = document.getElementById('graphCurve');
const graphMarker = document.getElementById('graphMarker');
const graphGuideX = document.getElementById('graphGuideX');
const graphGuideY = document.getElementById('graphGuideY');
const graphYMax = document.getElementById('graphYMax');

const quizList = document.getElementById('quizList');
const quizScore = document.getElementById('quizScore');

// ===================== STATE =====================
let prevVoltage = parseFloat(voltageSlider.value);
let prevResistance = parseFloat(resistanceSlider.value);
let voltageTouched = false;
let resistanceTouched = false;
let completed = false;

const GREEN_RGB = [73, 99, 79];
const ORANGE_RGB = [200, 107, 61];

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

function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', pct + '%');
}

// ===================== CIRCUIT REACTION =====================
function updateCircuitReaction(resistance, current) {
  const rFrac = clamp((resistance - 1) / (50 - 1), 0, 1);
  const resistorColor = mixColor(GREEN_RGB, ORANGE_RGB, rFrac);
  document.querySelectorAll('.resistor-zigzag').forEach((el) => {
    el.style.stroke = resistorColor;
  });

  const iFrac = clamp(current / 6, 0, 1);
  const duration = (2.6 - iFrac * 2.0).toFixed(2);
  const opacity = (0.5 + iFrac * 0.4).toFixed(2);
  document.querySelectorAll('.current-dot').forEach((dot) => {
    dot.style.animationDuration = duration + 's';
    dot.style.opacity = opacity;
  });
}

// ===================== GRAPH =====================
function updateGraph(voltage, resistance, current) {
  const x0 = 46, x1 = 360, y0 = 180, y1 = 10;
  const rMin = 1, rMax = 50;
  const yMax = Math.max(voltage * 1.1, 0.5);

  const points = [];
  const steps = 49;
  for (let i = 0; i <= steps; i++) {
    const r = rMin + (rMax - rMin) * (i / steps);
    const iVal = voltage / r;
    const x = x0 + ((r - rMin) / (rMax - rMin)) * (x1 - x0);
    const yClamped = Math.min(iVal, yMax);
    const y = y0 - (yClamped / yMax) * (y0 - y1);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  graphCurve.setAttribute('points', points.join(' '));

  const mx = x0 + ((resistance - rMin) / (rMax - rMin)) * (x1 - x0);
  const myVal = Math.min(current, yMax);
  const my = y0 - (myVal / yMax) * (y0 - y1);

  graphMarker.setAttribute('cx', mx.toFixed(1));
  graphMarker.setAttribute('cy', my.toFixed(1));

  graphGuideX.setAttribute('x1', x0);
  graphGuideX.setAttribute('y1', my.toFixed(1));
  graphGuideX.setAttribute('x2', mx.toFixed(1));
  graphGuideX.setAttribute('y2', my.toFixed(1));

  graphGuideY.setAttribute('x1', mx.toFixed(1));
  graphGuideY.setAttribute('y1', y0);
  graphGuideY.setAttribute('x2', mx.toFixed(1));
  graphGuideY.setAttribute('y2', my.toFixed(1));

  graphYMax.textContent = yMax.toFixed(1);
}

// ===================== OBSERVATION =====================
function setObservation(control, direction) {
  const messages = {
    resistance: {
      up: 'Qarshilik oshirilganda, kuchlanish o‘zgarmagan holatda tok kuchi kamayadi.',
      down: 'Qarshilik kamaytirilganda, kuchlanish o‘zgarmagan holatda tok kuchi ortadi.'
    },
    voltage: {
      up: 'Kuchlanish oshirilganda, qarshilik o‘zgarmasa, tok kuchi ortadi.',
      down: 'Kuchlanish kamaytirilganda, qarshilik o‘zgarmasa, tok kuchi kamayadi.'
    }
  };
  observationText.textContent = messages[control][direction];
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
  } else if (!voltageTouched) {
    steps[0].classList.add('active');
  } else if (!resistanceTouched) {
    steps[0].classList.add('done');
    steps[1].classList.add('active');
  } else {
    steps[0].classList.add('done');
    steps[1].classList.add('done');
    steps[2].classList.add('active');
  }

  steps.forEach(renderStepNumber);
}

// ===================== CALCULATE =====================
function calculate() {
  const V = parseFloat(voltageSlider.value);
  const R = parseFloat(resistanceSlider.value);
  const I = V / R;
  const P = V * I;

  voltageValue.textContent = V.toFixed(1);
  resistanceValue.textContent = R.toFixed(0);
  currentValue.textContent = I.toFixed(2);
  powerValue.textContent = P.toFixed(2);

  updateCircuitReaction(R, I);
  updateGraph(V, R, I);

  return { V, R, I: Number(I.toFixed(2)), P: Number(P.toFixed(2)) };
}

// ===================== QUIZ =====================
const quizData = [
  {
    q: 'Qarshilik oshirilsa, kuchlanish o‘zgarmagan holatda tok kuchi qanday o‘zgaradi?',
    options: ['Ortadi', 'Kamayadi', 'O‘zgarmaydi'],
    correct: 'Kamayadi'
  },
  {
    q: 'Om qonunining formulasi qaysi?',
    options: ['I = V / R', 'V = I + R', 'R = I / V', 'P = V / I'],
    correct: 'I = V / R'
  },
  {
    q: 'Kuchlanish 2 baravar oshib, qarshilik o‘zgarmasa, tok kuchi qanday o‘zgaradi?',
    options: ['2 baravar oshadi', '2 baravar kamayadi', 'O‘zgarmaydi'],
    correct: '2 baravar oshadi'
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
voltageSlider.addEventListener('input', () => {
  const newV = parseFloat(voltageSlider.value);
  const direction = newV > prevVoltage ? 'up' : (newV < prevVoltage ? 'down' : null);
  prevVoltage = newV;
  voltageTouched = true;
  updateSliderFill(voltageSlider);
  calculate();
  if (direction) setObservation('voltage', direction);
  renderSteps();
});

resistanceSlider.addEventListener('input', () => {
  const newR = parseFloat(resistanceSlider.value);
  const direction = newR > prevResistance ? 'up' : (newR < prevResistance ? 'down' : null);
  prevResistance = newR;
  resistanceTouched = true;
  updateSliderFill(resistanceSlider);
  calculate();
  if (direction) setObservation('resistance', direction);
  renderSteps();
});

resetBtn.addEventListener('click', () => {
  voltageSlider.value = 6;
  resistanceSlider.value = 10;
  prevVoltage = 6;
  prevResistance = 10;
  voltageTouched = false;
  resistanceTouched = false;
  completed = false;

  updateSliderFill(voltageSlider);
  updateSliderFill(resistanceSlider);
  calculate();

  observationText.textContent = 'Kuchlanish yoki qarshilikni o‘zgartiring va tok kuchidagi o‘zgarishni kuzating.';
  renderSteps();

  resultsPanel.classList.add('hidden');
  quizPanel.classList.add('hidden');
  buildQuiz();

  statusBadge.classList.remove('done');
  statusBadge.innerHTML = '<i class="status-dot"></i>Tajriba tayyor';
});

completeBtn.addEventListener('click', () => {
  completed = true;
  const { V, R, I, P } = calculate();

  finalVoltage.textContent = V.toFixed(1);
  finalResistance.textContent = R.toFixed(0);
  finalCurrent.textContent = I.toFixed(2);
  finalPower.textContent = P.toFixed(2);

  resultsPanel.classList.remove('hidden');
  quizPanel.classList.remove('hidden');
  renderSteps();

  statusBadge.classList.add('done');
  statusBadge.innerHTML = '<i class="status-dot"></i>Tajriba yakunlandi ✓';

  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ===================== INIT =====================
updateSliderFill(voltageSlider);
updateSliderFill(resistanceSlider);
calculate();
renderSteps();
buildQuiz();
