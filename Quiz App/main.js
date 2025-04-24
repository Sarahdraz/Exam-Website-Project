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
let totalExamTime = 300;
let userAnswers = {};

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
    updateNavButtons();
});

function getQuestions() {
    let myRequest = new XMLHttpRequest();
    myRequest.onreadystatechange = function() {
        if (this.status === 200 && this.readyState === 4) {
            questionsObj = shuffleArray(JSON.parse(this.responseText));
           
            userAnswers = Array(questionsObj.length).fill(null);

            const storedAnswers = localStorage.getItem("userAnswers");
            if (storedAnswers) {
                const parsedAnswers = JSON.parse(storedAnswers);
                if (parsedAnswers.length === questionsObj.length) {
                    
                    parsedAnswers.forEach(answerObj => {
                        if (answerObj && answerObj.id) {  
                            const questionIndex = questionsObj.findIndex(q => q.id === answerObj.id);
                            if (questionIndex !== -1) {
                                userAnswers[questionIndex] = answerObj.answer;
                            }
                        }
                    });
                    
                }
            }
            let qCount = questionsObj.length;
            createBullets(qCount);
            addQuestionData(questionsObj[currentIndex], qCount);
            let startTime = localStorage.getItem('examStartTime');
            if (!startTime) {
                startTime = Date.now();
                localStorage.setItem('examStartTime', startTime);
            }
            else{
                startTime = parseInt(startTime);
            }
            let elapsed = Math.floor((Date.now() - startTime) / 1000);
            let remainingTime = totalExamTime - elapsed;
           

            if (remainingTime <= 0) {
                isTimeout = true;
                showResults(questionsObj.length);
                return;
            }
            
            countdown(remainingTime);
        }
    };
    myRequest.open('GET', 'html_questions.json', true);
    myRequest.send();
}

function createBullets(num) {
    countSpan.innerHTML = num;
    bullets.innerHTML = ''; 
    for (let i = 0; i < num; i++) {
        let theBullet = document.createElement('span');
        theBullet.textContent = i + 1; 

        theBullet.addEventListener('click', () => {
            saveAnswer(); 
            currentIndex = i;
            addQuestionData(questionsObj[currentIndex], questionsObj.length);
            updateNavButtons();
        });

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
        answerArea.addEventListener('change', () => {
            saveAnswer();
        });
        loadSavedAnswers(); 
    }
    handleBullets();
    updateFlagButton(); // I added this line//

}
function handleBullets() {
    let bulletsSpan = document.querySelectorAll('.bullets .spans span');
    bulletsSpan.forEach((span, index) => {
        span.classList.remove('on', 'answered', 'flagged');

        if (currentIndex === index) {
            span.classList.add('on');
        }

        const questionId = questionsObj[index].id;
        if (userAnswers[questionId]) {
            span.classList.add('answered'); 
        }

        if (flaggedQuestions.includes(index)) {
            span.classList.add('flagged');
        }
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
        const answer = selected.dataset.answer; 
        const currentQuestion = questionsObj[currentIndex];
       // userAnswers[currentIndex] = selected.dataset.answer;
      // userAnswers[currentIndex] = { id: currentQuestion.id, answer: answer };
      userAnswers[currentQuestion.id] = answer;
       localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
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
        localStorage.setItem('currentIndex', currentIndex);
        addQuestionData(questionsObj[currentIndex], questionsObj.length);
        updateNavButtons();
    }
});

prevBtn.addEventListener('click', () => {
    saveAnswer();
    if (currentIndex > 0) {
        currentIndex--;
        localStorage.setItem('currentIndex', currentIndex);
        addQuestionData(questionsObj[currentIndex], questionsObj.length);
        updateNavButtons();
    }
});


function updateNavButtons() {
    if (currentIndex === 0) {
        prevBtn.style.display = 'none'; 
    } else {
        prevBtn.style.display = 'inline-block'; 
    }

    if (currentIndex === questionsObj.length - 1) {
        nextBtn.style.display = 'none'; 
    } else {
        nextBtn.style.display = 'inline-block'; 
    }
}





flagBtn.addEventListener('click', () => {
    if (!flaggedQuestions.includes(currentIndex)) {
        flaggedQuestions.push(currentIndex);
    } else {
        flaggedQuestions = flaggedQuestions.filter((i) => i !== currentIndex);
    }
    // I added this line//
    updateFlagButton();
    //
    handleBullets();
});
// I added this function//
function updateFlagButton() {
    if (flaggedQuestions.includes(currentIndex)) {
        flagBtn.textContent = 'Unflag';
    } else {
        flagBtn.textContent = 'Flag';
    }
}
//


function countdown(duration) {
    let total = duration;
    //Added line
    let savedTime = localStorage.getItem('remainingTime');
    let savedProgress = localStorage.getItem('progressPercentage');
    //
    if (savedTime) {
        duration = parseInt(savedTime);
    }
    if (savedProgress) {
        let progress = Math.min(100, Math.max(0, savedProgress)); 
        progressBar.style.width = `${progress}%`;
        duration = (progress / 100) * total; 
    }

    
    countdownInterval = setInterval(() => {
        localStorage.setItem('remainingTime', duration);
        let minute = String(Math.floor(duration / 60)).padStart(2, '0');
        let seconds = String(Math.floor(duration % 60)).padStart(2, '0');
        countdownContainer.innerHTML = `${minute}:${seconds}`;


let percentage = (duration / total) * 100;
        progressBar.style.width = `${percentage}%`;
        localStorage.setItem('progressPercentage', percentage);


        if (--duration < 0) {
            isTimeout = true;
            clearInterval(countdownInterval);
            localStorage.removeItem('remainingTime');
           
            showResults(questionsObj.length);
        }
    }, 1000);
}

function showResults(count) {
    localStorage.removeItem('remainingTime');
    flaggedQuestions = [];
    updateFlagList();
    let rightAnswer = 0;
    for (let i = 0; i < questionsObj.length; i++) {
        const questionId = questionsObj[i].id;
        if (userAnswers[questionId] === questionsObj[i].right_answer) {
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

    if (rightAnswer >= count / 2) {
       
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        
        failAnimation();
      }




    let retryBtn = document.createElement('button');
    retryBtn.textContent = '🔁 Retry Exam';
    retryBtn.className = 'retry-button';
    retryBtn.onclick = () => {
    localStorage.removeItem('examStartTime');
    localStorage.removeItem('remainingTime');
    localStorage.removeItem('userAnswers');
    localStorage.removeItem('currentIndex');
    localStorage.removeItem('progressPercentage')
    window.location.reload();
};
resultsContainer.appendChild(retryBtn);

}

function failAnimation() {
    document.body.classList.add('shake');
    setTimeout(() => {
      document.body.classList.remove('shake');
    }, 500);
  
    let sadFace = document.createElement('div');
    sadFace.innerHTML = '😢';
    sadFace.classList.add('sad-face');
    sadFace.style.fontSize = '100px';
    sadFace.style.textAlign = 'center';
    resultsContainer.appendChild(sadFace);
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

function loadSavedAnswers() {
    const savedAnswers = JSON.parse(localStorage.getItem('userAnswers'));
    if (savedAnswers) {
        userAnswers = savedAnswers;
        let currentQuestion = questionsObj[currentIndex];
        let radioButtons = document.querySelectorAll('input[name="question"]');
        radioButtons.forEach((radio) => {
           
            if (userAnswers[currentQuestion.id] && radio.dataset.answer === userAnswers[currentQuestion.id]) {
                radio.checked = true;  
            }
        });
    }
}



const toggleBtn = document.getElementById('themeToggle');
const isDark = localStorage.getItem('theme') === 'dark';

if (isDark) {
  document.body.classList.add('dark');
  toggleBtn.textContent = '☀️ Light Mode';
}

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const darkMode = document.body.classList.contains('dark');
  toggleBtn.textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
});

document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("progressPercentage");
    localStorage.removeItem("examStartTime");
    localStorage.setItem("isRegistered", "false");
    localStorage.removeItem("remainingTime");
    localStorage.removeItem("progressPercentage");
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("currentIndex");
  
    
    window.location.href = "../Pages/login.html"; 
  });
  localStorage.setItem("isRegistered", "true");