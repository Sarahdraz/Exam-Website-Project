let countSpan = document.querySelector('.quiz-app .count span');
let bulletsContainer = document.querySelector('.quiz-app .bullets');
let bullets = document.querySelector('.quiz-app .bullets .spans');
let quizArea = document.querySelector('.quiz-app .quiz-area');
let answerArea = document.querySelector('.quiz-app .answer-area');
let submit = document.getElementById('submitAnswer');
let nextBtn = document.querySelector('.quiz-app .next-button');
let prevBtn = document.querySelector('.quiz-app .prev-button');
let flagBtn = document.querySelector('.quiz-app .flag-button');
let resultsContainer = document.querySelector('.quiz-app .results');
let countdownContainer = document.querySelector('.quiz-app .countdown');
let progressBar = document.getElementById('progressBar');
let flagList = document.getElementById('flagList');

let currentIndex = 0;
let countdownInterval;
let firstName = '';
let lastName = '';
let isTimeout = false;
let questionsObj = [];
let flaggedQuestions = [];
let totalExamTime = 100;
let userAnswers = [];

window.addEventListener('DOMContentLoaded', () => {
    firstName = localStorage.getItem("firstName");
    lastName = localStorage.getItem("lastName");

    if (!firstName || !lastName) {
        alert("You must register or log in first.");
        window.location.href = "../Pages/signup.html"; // Or login.html
        return;
    }

    document.querySelector('.quiz-content').style.display = 'block';
    getQuestions();
});


function getQuestions() {
    let myRequest = new XMLHttpRequest();
    myRequest.onreadystatechange = function() {
        if (this.status === 200 && this.readyState === 4) {
            questionsObj = shuffleArray(JSON.parse(this.responseText));
            userAnswers = Array(questionsObj.length).fill(null);
            let qCount = questionsObj.length;
            createBullets(qCount);
            addQuestionData(questionsObj[currentIndex], qCount);
            countdown(totalExamTime);
        }
    };
    myRequest.open('GET', 'html_questions.json', true);
    myRequest.send();
}

function createBullets(num) {
    countSpan.innerHTML = num;
    for (let i = 0; i < num; i++) {
        let theBullet = document.createElement('span');
        bullets.appendChild(theBullet);
    }
}

function addQuestionData(obj, count) {
    if (currentIndex < count) {
        quizArea.innerHTML = '';
        answerArea.innerHTML = '';
        document.querySelector('.quiz-info .category').innerHTML = `Category: ${obj.category}`;
        let questionTitle = document.createElement('h2');
        questionTitle.innerHTML = obj.title;
        quizArea.appendChild(questionTitle);
        for (let i = 1; i <= 4; i++) {
            let divAnswer = document.createElement('div');
            divAnswer.classList.add('answer');
            let radioInput = document.createElement('input');
            radioInput.setAttribute('type', 'radio');
            radioInput.setAttribute('name', 'question');
            radioInput.setAttribute('id', `answer_${i}`);
            radioInput.setAttribute('data-answer', obj[`answer_${i}`]);
            if (userAnswers[currentIndex] === obj[`answer_${i}`])
                radioInput.checked = true;
            divAnswer.appendChild(radioInput);
            let label = document.createElement('label');
            label.setAttribute('for', `answer_${i}`);
            label.textContent = obj[`answer_${i}`];
            divAnswer.appendChild(label);
            answerArea.appendChild(divAnswer);
        }
    }
    handleBullets();
}

function handleBullets() {
    let bulletsSpan = document.querySelectorAll('.bullets .spans span');
    bulletsSpan.forEach((span, index) => {
        span.classList.toggle('on', currentIndex === index);
        span.classList.toggle('flagged', flaggedQuestions.includes(index));
    });
    updateFlagList();
}

function updateFlagList() {
    flagList.innerHTML = '';
    flaggedQuestions.forEach((index) => {
        let li = document.createElement('li');
        li.textContent = `Question ${index + 1}`;
        li.onclick = () => {
            currentIndex = index;
            addQuestionData(questionsObj[currentIndex], questionsObj.length);
        };
        flagList.appendChild(li);
    });
}

function saveAnswer() {
    const selected = document.querySelector(
        'input[name="question"]:checked'
    );
    if (selected) {
        userAnswers[currentIndex] = selected.dataset.answer;
    }
}

submit.addEventListener('click', () => {
    saveAnswer();
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to finish the quiz.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            clearInterval(countdownInterval);
            isTimeout = false; // important to show correct message
            showResults(questionsObj.length);
        }
    });
});

nextBtn.addEventListener('click', () => {
    saveAnswer();
    if (currentIndex < questionsObj.length - 1) {
        currentIndex++;
        addQuestionData(questionsObj[currentIndex], questionsObj.length);
    }
});

prevBtn.addEventListener('click', () => {
    saveAnswer();
    if (currentIndex > 0) {
        currentIndex--;
        addQuestionData(questionsObj[currentIndex], questionsObj.length);
    }
});

flagBtn.addEventListener('click', () => {
    if (!flaggedQuestions.includes(currentIndex)) {
        flaggedQuestions.push(currentIndex);
    } else {
        flaggedQuestions = flaggedQuestions.filter((i) => i !== currentIndex);
    }
    handleBullets();
});

function countdown(duration) {
    let total = duration;
    countdownInterval = setInterval(() => {
        let minute = String(Math.floor(duration / 60)).padStart(2, '0');
        let seconds = String(duration % 60).padStart(2, '0');
        countdownContainer.innerHTML = `${minute}:${seconds}`;
        progressBar.style.width = `${(duration / total) * 100}%`;
        if (--duration < 0) {
            isTimeout = true;
            clearInterval(countdownInterval);
            showResults(questionsObj.length);
        }
    }, 1000);
}

function showResults(count) {
    flaggedQuestions = [];
    updateFlagList();
    let rightAnswer = 0;
    for (let i = 0; i < questionsObj.length; i++) {
        if (userAnswers[i] === questionsObj[i].right_answer) {
            rightAnswer++;
        }
    }
    quizArea.remove();
    answerArea.remove();
    submit.remove();
    nextBtn.remove();
    prevBtn.remove();
    flagBtn.remove();
    bulletsContainer.remove();
    let results = '';
    if (isTimeout) {
        results = `<h2>⏰ Time's up, ${firstName} ${lastName}!</h2><p>You didn’t finish the exam in time.</p><p>Your score: ${rightAnswer} / ${count}</p>`;
    } else {
        results = `<h2>✅ ${firstName} ${lastName}, you completed the quiz.</h2><p>Your score: ${rightAnswer} / ${count}</p>`;
    }
    resultsContainer.innerHTML = results;
}

function shuffleArray(array) {
    let current = array.length,
        temp,
        random;
    while (current !== 0) {
        random = Math.floor(Math.random() * current);
        current--;
        temp = array[current];
        array[current] = array[random];
        array[random] = temp;
    }
    return array;
}