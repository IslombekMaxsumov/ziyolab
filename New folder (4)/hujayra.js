// ===================== DATA =====================
const organelleData = {
  yadro: {
    title: 'Yadro',
    text: 'Yadro — hujayraning boshqaruv markazi. U genetik ma’lumotni (DNK) saqlaydi va hujayra faoliyatini boshqaradi.'
  },
  membrana: {
    title: 'Membrana',
    text: 'Membrana — hujayrani tashqi muhitdan ajratib turuvchi himoya qatlami. U moddalarning hujayraga kirib-chiqishini nazorat qiladi.'
  },
  sitoplazma: {
    title: 'Sitoplazma',
    text: 'Sitoplazma — hujayra ichini to‘ldirib turuvchi suyuqlik. Unda organellalar joylashgan va kimyoviy reaksiyalar sodir bo‘ladi.'
  },
  mitoxondriya: {
    title: 'Mitoxondriya',
    text: 'Mitoxondriya — hujayraning "energiya stantsiyasi". U oziq moddalarni hujayra uchun kerakli energiyaga aylantiradi.'
  }
};

const quizData = [
  {
    q: 'Hujayraning genetik ma’lumotini qaysi qism saqlaydi?',
    options: ['Yadro', 'Membrana', 'Sitoplazma', 'Mitoxondriya'],
    correct: 'Yadro'
  },
  {
    q: 'Hujayraning "energiya stantsiyasi" deb qaysi tuzilma ataladi?',
    options: ['Yadro', 'Sitoplazma', 'Mitoxondriya', 'Membrana'],
    correct: 'Mitoxondriya'
  },
  {
    q: 'Hujayrani tashqi muhitdan ajratib turuvchi qism qaysi?',
    options: ['Sitoplazma', 'Membrana', 'Yadro', 'Mitoxondriya'],
    correct: 'Membrana'
  }
];

// ===================== ELEMENTS =====================
const infoWindow = document.getElementById('infoWindow');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');
const stepsList = document.getElementById('stepsList');
const statusBadge = document.getElementById('statusBadge');
const resetBtn = document.getElementById('resetBtn');
const completeBtn = document.getElementById('completeBtn');
const resultsPanel = document.getElementById('resultsPanel');
const quizPanel = document.getElementById('quizPanel');
const quizList = document.getElementById('quizList');
const quizScore = document.getElementById('quizScore');

const organelles = document.querySelectorAll('.organelle');
const legendItems = document.querySelectorAll('.legend-item');

const checkEls = {
  yadro: document.getElementById('checkYadro'),
  membrana: document.getElementById('checkMembrana'),
  sitoplazma: document.getElementById('checkSitoplazma'),
  mitoxondriya: document.getElementById('checkMitoxondriya')
};

const ORGANELLE_KEYS = ['yadro', 'membrana', 'sitoplazma', 'mitoxondriya'];

// ===================== STATE =====================
let clicked = new Set();
let completed = false;

// ===================== SELECTION =====================
function selectOrganelle(key) {
  if (!organelleData[key]) return;

  document.querySelectorAll('.organelle.active').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll(`.organelle[data-organelle="${key}"]`).forEach((el) => el.classList.add('active'));

  clicked.add(key);

  const data = organelleData[key];
  infoTitle.textContent = data.title;
  infoText.textContent = data.text;

  infoWindow.classList.remove('anim');
  void infoWindow.offsetWidth;
  infoWindow.classList.add('anim');

  renderSteps();
}

organelles.forEach((el) => {
  el.addEventListener('click', () => selectOrganelle(el.dataset.organelle));
});

legendItems.forEach((btn) => {
  btn.addEventListener('click', () => selectOrganelle(btn.dataset.organelle));
});

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
  } else if (clicked.size === 0) {
    steps[0].classList.add('active');
  } else if (clicked.size < ORGANELLE_KEYS.length) {
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

// ===================== ACTIONS =====================
resetBtn.addEventListener('click', () => {
  clicked = new Set();
  completed = false;

  document.querySelectorAll('.organelle.active').forEach((el) => el.classList.remove('active'));
  infoWindow.classList.remove('anim');
  infoTitle.textContent = 'Tuzilmani tanlang';
  infoText.textContent = 'Chapdagi hujayra modelida biror tuzilmani (Yadro, Membrana, Sitoplazma yoki Mitoxondriya) bosing.';

  renderSteps();

  resultsPanel.classList.add('hidden');
  quizPanel.classList.add('hidden');
  buildQuiz();

  statusBadge.classList.remove('done');
  statusBadge.innerHTML = '<i class="status-dot"></i>Tajriba tayyor';
});

completeBtn.addEventListener('click', () => {
  completed = true;

  ORGANELLE_KEYS.forEach((key) => {
    checkEls[key].textContent = clicked.has(key) ? '✓' : '—';
  });

  resultsPanel.classList.remove('hidden');
  quizPanel.classList.remove('hidden');
  renderSteps();

  statusBadge.classList.add('done');
  statusBadge.innerHTML = '<i class="status-dot"></i>Tajriba yakunlandi ✓';

  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ===================== INIT =====================
renderSteps();
buildQuiz();
