let selected;

class shuffler {
    static shuffle(arr) {
        for(let i in arr) {
            let j = Math.floor(Math.random()*i);
            let tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }
}

class Starter {
    static startPanelElement = document.getElementById('start_panel');
    static shuffleQuestionsCheckBox = document.getElementById('mix_questions');
    static shuffleAnswersCheckBox = document.getElementById('mix_answers');
    static timeField = document.getElementById('time');
    static answersPanel = document.getElementById('question_selectors');
    static questionsZone = document.getElementById('questions_zone');
    
    static hide(){
        this.startPanelElement.hidden = true;
    }
    
    static start(questions) {
        this.hide();
        if(document.cookie!=='') {
            alert('Вы что, думали, что можете просто ввести ответы,\
которые вам показали после первого прохождения?');
            return;
        }
        this.questionsZone.hidden = false;
        if(this.shuffleQuestionsCheckBox.checked) {
            questions.shuffle();
        }
        if(this.shuffleAnswersCheckBox.checked) {
            questions.shuffleAnswers();
        }
        for(let i in questions.list) {
            let button = document.createElement('div');
            button.className = 'question_selector_not_opened question_selector';
            button.innerHTML = (i-(-1));
            button.onclick = function() {
                questions.list[i].show(this);
            };
            this.answersPanel.appendChild(button);
            if(i==='0') {
                questions.list[0].show(button);
            }
        }
        new Timer(this.timeField.value);
    }
}

class Questions {
    list = [];
    constructor(questionsURL) {
        let request = new XMLHttpRequest();
        request.open('GET', questionsURL);
        request.responseType = 'json';
        let thisQuestions = this;
        request.onload = function() {
            thisQuestions.list = request.response;
            let questionClasses = {
                'Checkbox':CheckboxQuestion,
                'Select':SelectQuestion,
                'Radio':RadioQuestion,
                'Text':TextQuestion
            };
            for(let i in thisQuestions.list) {
                thisQuestions.list[i] = 
                        new questionClasses[thisQuestions.list[i].answerType](
                        thisQuestions.list[i]);
            }
        };
        request.send();
    }
    shuffle() {
        this.list = shuffler.shuffle(this.list);
    }
    shuffleAnswers() {
        for(let q of this.list) {
            q.shuffle();
        }
    }
};

class Question {
    data;
    userAnswer = '';
    button;
    constructor(data) {
        this.data = data;
        this.questionElement = document.getElementById('question');
        this.answerElement = document.getElementById('answers_field');
    }
    show(buttonElement) {
        this.button = buttonElement;
        if(selected) {
            selected.save();
        }
        this.questionElement.childNodes[0].remove();
        this.questionElement.appendChild(document.createTextNode(
                this.data.question));
        this.answerElement.innerHTML = '';
        if(buttonElement.classList[0]=='question_selector_not_opened') {
            buttonElement.className='question_selector_opened question_selector';
        }
        selected = this;
    }
    shuffle() {
        this.data.variants = shuffler.shuffle(this.data.variants);
    }
    check() {
        return this.userAnswer==this.data.answer;
    }
    getMaxPoints() {
        return this.data.points;
    }
    getPoints() {
        if(this.check()) {
            return this.data.points;
        }else{
            return 0;
        }
    }
}

class CheckboxQuestion extends Question {
    userAnswer = [];
    show(buttonElement) {
        super.show(buttonElement);
        for(let variant of this.data.variants) {
            let checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.value = variant;
            checkBox.name = 'answers';
            if(this.userAnswer.includes(variant))
            {
                checkBox.checked = true;
            }
            let label = document.createElement('label');
            label.for = variant;
            label.textContent = variant;
            this.answerElement.appendChild(checkBox);
            this.answerElement.appendChild(label);
            this.answerElement.appendChild(document.createElement('br'));
        }
    }
    save() {
        let answer = [];
        for(let variant of this.answerElement.childNodes) {
            if(variant.checked) {
                answer.push(variant.value);
            }
        }
        this.userAnswer = answer.sort();
        if(this.userAnswer.length!=0) {
            this.button.className = 
                    'question_selector_answered question_selector';
        }else{
            this.button.className = 
                    'question_selector_opened question_selector';
        }
    }
    check() {
        return this.userAnswer.sort()+''==this.data.answer.sort()+'';
    }
};

class RadioQuestion extends Question {
    show(buttonElement) {
        super.show(buttonElement);
        for(let variant of this.data.variants) {
            let checkBox = document.createElement('input');
            checkBox.type = 'radio';
            checkBox.value = variant;
            checkBox.name = 'answers';
            if(this.userAnswer.includes(variant))
            {
                checkBox.checked = true;
            }
            let label = document.createElement('label');
            label.for = variant;
            label.textContent = variant;
            this.answerElement.appendChild(checkBox);
            this.answerElement.appendChild(label);
            this.answerElement.appendChild(document.createElement('br'));
        }
    }
    save() {
        for(let variant of this.answerElement.childNodes) {
            if(variant.checked) {
                this.userAnswer = variant.value;
                this.button.className = 
                        'question_selector_answered question_selector';
                return;
            }
        }
        this.userAnswer = '';
        this.button.className = 'question_selector_opened question_selector';
    }
};

class TextQuestion extends Question {
    show(buttonElement) {
        super.show(buttonElement);
        let field = document.createElement('input');
        field.id = 'answer';
        field.value = this.userAnswer;
        this.answerElement.appendChild(field);
    }
    shuffle() {}
    save() {
        let input = document.getElementById('answer').value;
        this.userAnswer = input;
        if(this.userAnswer!='') {
            this.button.className = 
                    'question_selector_answered question_selector';
        }else{
            this.button.className = 
                    'question_selector_opened question_selector';
        }
    }
}

class SelectQuestion extends Question {
    show(buttonElement) {
        super.show(buttonElement);
        let select = document.createElement('select');
        select.id = 'answer';
        for(let variant of this.data.variants) {
            let option = document.createElement('option');
            option.textContent = variant;
            select.appendChild(option);
        }
        select.value = this.userAnswer;
        this.answerElement.appendChild(select);
    }
    save() {
        let input = document.getElementById('answer').value;
        this.userAnswer = input;
        if(this.userAnswer!='') {
            this.button.className = 'question_selector_answered question_selector';
        }else{
            this.button.className = 'question_selector_opened question_selector';
        }

    }
}

class Finisher {
    static table = document.getElementById('results_table');
    static resultText = document.getElementById('results');
    static questionsZone = document.getElementById('questions_zone');
    static finish(questions) {
        document.cookie = 'complete=true';
        selected.save();
        this.table.hidden = false;
        this.questionsZone.hidden = true;
        let result = 0;
        let maxPoints = 0;
        for(let i in questions.list) {
            result += questions.list[i].getPoints();
            maxPoints += questions.list[i].getMaxPoints();
            let row = document.createElement('tr');
            let number = document.createElement('td');
            number.appendChild(document.createTextNode(i-0+1));
            row.appendChild(number);
            let questionText = document.createElement('td');
            questionText.appendChild(document.createTextNode(
                    questions.list[i].data.question));
            row.appendChild(questionText);
            let userAnswer = document.createElement('td');
            userAnswer.appendChild(document.createTextNode(
                    questions.list[i].userAnswer));
            row.appendChild(userAnswer);
            let rightAnswer = document.createElement('td');
            rightAnswer.appendChild(document.createTextNode(
                    questions.list[i].data.answer));
            row.appendChild(rightAnswer);
            let maxPointsElement = document.createElement('td');
            maxPointsElement.appendChild(document.createTextNode(
                    questions.list[i].getMaxPoints()));
            row.appendChild(maxPointsElement);
            row.className = questions.list[i].check()?'right_answer':'wrong_answer';
            this.table.childNodes[1].appendChild(row);
        }
        this.resultText.appendChild(document.createTextNode(
                `Итого: ${result}/${maxPoints}`));
    }
}

class Timer {
    #time;
    #startTime;
    #timerId;
    #timerElement = document.getElementById('timer');
    constructor(time) {
        let minutes = +time.split(':')[0];
        let seconds = +time.split(':')[1];
        this.#time = (minutes*60+seconds)*1000;
        this.#startTime = new Date();
        this.#timerId = setInterval(
                function(timer) {
                    timer.update();
                },
                1000, this);
        this.update();
    }
    update() {
        if((new Date())-this.#startTime>this.#time) {
            Finisher.finish(questions);
            clearInterval(this.#timerId);
            return;
        }
        let timeToEnd = this.#time-((new Date())-this.#startTime);
        let seconds = Math.floor(timeToEnd/1000);
        let minutes = Math.floor(seconds/60);
        seconds %= 60;
        if(seconds<10) {
            seconds = '0'+seconds;
        }
        this.#timerElement.innerHTML = minutes+':'+seconds;
    }
}

let questions = 
        new Questions("questions/theRelationshipBetweenHealthAndLifestyle.json");