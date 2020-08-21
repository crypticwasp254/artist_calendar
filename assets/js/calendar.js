const electron = require('electron');
const path = require('path')
const {
    ipcRenderer
} = electron

function getConfig() {
    ipcSend('get_config', {})
}

// startup data from localstorage
function init() {
    getConfig()
    ipcRenderer.on('config', (err, item) => {
        console.log('data loaded from disk')
        localStorage.setItem('lastdata', JSON.stringify(item))
        var data = JSON.parse(localStorage.getItem('lastdata'))
        // calendar entries
        data.entries.forEach((entry) => {
            newSchedule(entry.title, entry.note, entry.start.split(':')[0])
        })
    })
}

function newSchedule(title, note, start) {
    var entrylog = document.querySelector('.goals');
    var goal = document.createElement('div')
    var goal = document.createElement('div')
    goal.classList = 'goal';
    var goal_template = `
    <div class="timeofday">${start}</div>
    <h3 class="title">${title}</h3>
    <p class="description">${note}</p>
    `
    goal.innerHTML = goal_template;
    entrylog.appendChild(goal)
}

init()

// calender
const month = new Date().getMonth();
const year = new Date().getFullYear();
const start_day = new Date(year, month, 1).getDay();
// check end day of this month
const end_day = new Date(year, month, 31);
const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const today = new Date().getDate()
const calDays = document.querySelector('.dates');


// change final day according to month
var alldays = range(1, 30)
if (end_day.getDate() === 1) {
    alldays = range(1, 30)
} else {
    alldays = range(1, 31)
}

// february detect leap year
if (month === 1) {
    var check_leap = new Date(year, month, 29).getDate();
    if (check_leap === 1) {
        alldays = range(1, 28)
    } else {
        alldays = range(1, 29)
    }
}

// add to calendar
for (day in alldays) {
    date = document.createElement("div");
    date.classList += "date";
    date.dataset.date = day;
    if (day == 1) {
        date.style.gridColumn = start_day + 1;
    }
    if (day == today) {
        date.classList += " active";
    }
    date.textContent = day
    calDays.appendChild(date);
}

// add month
var monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
var monthDom = document.querySelector('.calendar-head .month');
monthDom.innerHTML = monthNames[month]

// large date display
const dateEnds = [{
    1: 'st'
}, {
    2: 'nd'
}, {
    3: 'rd'
}]
var largeDate = document.querySelector('.date-info .date')

var xday = today.toString()
if (xday.length === 2) {
    xday = Number(xday[1])
} else {
    xday = Number(today)
}

var end = dateEnds[xday - 1]
if (end !== undefined) {
    end = end[xday]
} else {
    end = 'th'
}

// large day display
var largeDay = document.querySelector('.date-info .day')
var todate = weekdays[new Date().getDay()]
largeDay.textContent = todate

largeDate.innerHTML = `${today}<sup>${end}</sup>`

// :todo
// calendar navigation on date click
var dates = document.querySelectorAll('.dates .date')
dates.forEach((date) => {
    date.addEventListener('click', () => {
        var _date_clicked = date.dataset.date
        console.log(_date_clicked)
    })
})

// dots generate
const dots_gen = document.querySelector("#grid-dots");
// TO DO : give goal limit default montly
var _dots = alldays
_dots.forEach((_dot, index) => {
    _dot_dom = document.createElement('div')
    _dot_dom.classList = 'd';
    _dot_dom.id = `dot_${index}`;
    _dot_dom.dataset.date = `${index}-${monthNames[month]}-${year}`;
    _dot_dom.dataset.checked = `false`
    if (index === today) {
        _dot_dom.classList += ' active-d'
    }
    _dot_dom.innerHTML = `<span class="index" > ${index} </span>`
    dots_gen.appendChild(_dot_dom)
});

function validateDot(dot) {
    // validation date not after today
    // view last date
    // change active box
    var dot_day = Number(dot.id.split('_')[1])
    if (dot_day === today && dot.dataset.checked === 'false') {
        var _cross = document.createElement('div')
        _cross.innerHTML = `x`
        dot.appendChild(_cross)
        // save to db
        var db_data = {
            'precise_date': new Date(year, month, today + 1),
            'date': `${today}-${monthNames[month]}-${year}`,
            'task': 'blender',
            'exact': 'exact'
        }
        ipcSend('dot_entry', db_data)
        // console.log(db_data)
    } else if (dot_day < today) {
        console.log("flashback x")
    } else if (dot_day > today) {
        console.log("foresee x")
    } else {
        console.log("unexpected x")
    }
}

// switch tabs
const fabs = document.querySelectorAll('.fab-icon');
fabs.forEach(fab => {
    fab.addEventListener('click', () => {
        switchTab(fab.id)
    })
})

function switchTab(tab) {
    var tabcontents = document.querySelectorAll('.content')
    tabcontents.forEach((tabcontent) => {
        if (tabcontent.id === `${tab}-content`) {
            tabcontent.classList += ' show'
            tabcontent.style.transform = 'translateY(250px)'
            anime({
                targets: tabcontent,
                translateY: {
                    value: '0px',
                    duration: 1000
                },
                easing: 'easeOutExpo'
            })

            anime({
                targets: ['.sched-area .timeline', '.add-area .timeline', '.view-schedule .timeline'],
                translateY: {
                    value: '-180px',
                    duration: 1500
                },
            })

            if (tab === 'dots') {
                // get tab and append dots loaded from local storage
                var dots = document.querySelectorAll(".d")
                var dots_data = JSON.parse(localStorage.getItem('lastdata')).dots;
                dots_data.forEach((dd) => {
                    console.log(dd)
                    dots.forEach(dot => {
                        if (dd.date === dot.dataset.date) {
                            dot.dataset.checked = `true`;
                            dot.innerHTML = `<span class="index">${dd.date.split("-")[0]} </span><div>x</div>`
                        }
                    })
                })
                dots.forEach(dot => {
                    dot.addEventListener('dblclick', (e) => {
                        e.preventDefault()
                        console.log('right')
                        sendNotification()
                    })
                    dot.addEventListener('click', () => {
                        validateDot(dot);
                    })
                })
                animateGrid.play()

            } else if (tab === 'add') {
                // add new schedule


            } else if (tab === 'logbook') {
                var notebook = document.querySelector(".notebook");
                var typetext = document.createElement('div');
                notebook.innerHTML = ``;
                typetext.classList = ' typewrite';
                typetext.dataset.words = '["Did you watch a movie?","What happened today?","What was the day like?","Log you day. to remember it!"]'
                typetext.dataset.wait = 1000;
                typetext.innerHTML = ``;
                notebook.appendChild(typetext)
                var typewrite = document.querySelector(".typewrite");
                var words = JSON.parse(typewrite.dataset.words);
                var wait = typewrite.dataset.wait;
                var typer = new typeWriter(typewrite, words, wait);
                typer.type()
                notebook.addEventListener("focus", () => {
                    notebook.childNodes.forEach((child) => {
                        if (child.classList[0] === 'typewrite') {
                            notebook.removeChild(typewrite)
                        }
                    })
                })

            } else if (tab === 'sched') {
                // sched here

            }
        } else {
            tabcontent.classList.remove('show')
            tabcontent.style.transform = 'translateY(250px)'
        }
    })
}

// animate
// grid test
const animateGrid = anime({
    targets: '.tab-content.grid .d',
    scale: [{
            value: .7,
            easing: 'easeOutSine',
            duration: 500
        },
        {
            value: 1,
            easing: 'easeInOutQuad',
            duration: 1200
        }
    ],
    delay: anime.stagger(200, {
        grid: [6, 5],
        from: 'center'
    }),
    autoplay: false
});

// custom range function like python
function range(start = 0, stop_, step = 1) {
    var results = [];
    if (typeof stop_ === "undefined") {
        stop_ = start;
    }
    for (i = start; i <= stop_; i++) {
        results[i] = i;
    }
    return results;
}

// add a calendar entry logbook and schedule
const actionbtns = document.querySelectorAll('.actions .action-btn')
actionbtns.forEach((actionbtn) => {
    actionbtn.addEventListener('click', () => {
        console.log(actionbtn.textContent.trim())
    })
})

var addtimeline = document.querySelector('#addschedule')

function addNewEntry() {
    var entry_title = document.querySelector('.entry.addentry .title')
    var entry_note = document.querySelector('.entry.addentry .note')
    var entry_duration = document.querySelector('#timer')
    // create duration
    var duration_split = entry_duration.textContent.trim().split('+');
    console.log(duration_split)
    ipcSend('calendar_entry', {
        title: entry_title.innerHTML,
        note: entry_note.innerHTML,
        date: new Date(),
        start: duration_split[0],
        last: duration_split[1],
        duration: entry_duration.textContent.trim()
    })
    // getConfig()
    newSchedule(entry_title.innerHTML, entry_note.innerHTML, duration_split[0].split(':')[0])
}
addtimeline.addEventListener('click', () => {
    addNewEntry()
})
// rotate timer
anime({
    targets: '#rotateanim',
    rotate: {
        value: '1turn',
        duration: 1000
    },
    easing: 'linear',
    loop: true
})

// ipc interface

function ipcSend(command, payload) {
    ipcRenderer.send(command, payload)
}

// calendar entry added
ipcRenderer.on('calendar-entry', (err, item) => {
    var log_entry = document.querySelector(".sched-area");
    log_entry.removeChild(document.querySelector('.addentry'))
    var newentry = document.createElement('div')
    var template = `
    <h1 class='title'>${item.title}</h1>
    <p class="note">${item.note}</p>
    <div class="timeofday">${Number(item.duration.split('+')[0].split(':')[0])}</div>
    `
    newentry.classList = ' entry';
    newentry.innerHTML = template;
    newentry.style = `
    margin-bottom:${Number(item.duration.split('+')[1]) * 3}px
    `
    log_entry.appendChild(newentry)
    console.log(item)
    // add new entry in interval
    var newentry_template =
        `
    <h1 class="title" contenteditable>title</h1>
    <p class="note" contenteditable>add a short note...</p>
    <div class="duration">
        <svg xmlns="http://www.w3.org/2000/svg" id="rotateanim" width="512" height="512"
            viewBox="0 0 512 512">
            <title>ionicons-v5-i</title>
            <path
                d="M145.61,464H366.39c19.8,0,35.55-16.29,33.42-35.06C386.06,308,304,310,304,256s83.11-51,95.8-172.94c2-18.78-13.61-35.06-33.41-35.06H145.61c-19.8,0-35.37,16.28-33.41,35.06C124.89,205,208,201,208,256s-82.06,52-95.8,172.94C110.06,447.71,125.81,464,145.61,464Z"
                style="fill:none;stroke:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px" />
        </svg>
        <div class="timer" id='timer' contenteditable="">
            14:23 + 45
        </div>
    </div>
    <div class="add" id='addschedule'>
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
            <title>add to timeline</title>
            <path
                d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z"
                style="fill:none;stroke:#ffffff;stroke-miterlimit:10;stroke-width:32px" />
            <line x1="256" y1="176" x2="256" y2="336"
                style="fill:none;stroke:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px" />
            <line x1="336" y1="256" x2="176" y2="256"
                style="fill:none;stroke:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px" />
        </svg>
    </div>
    `
    var edit_entry = document.createElement('div');
    edit_entry.classList = 'entry addentry';
    edit_entry.innerHTML = newentry_template;
    log_entry.appendChild(edit_entry)
    var xaddtimeline = document.querySelector('#addschedule')
    xaddtimeline.addEventListener('click', () => {
        addNewEntry()
    })
    // crappy smooth scroll
    anime({
        targets: log_entry,
        scrollTop: [{
                value: log_entry.scrollTop,
                duration: 0
            },
            {
                value: 100000,
                duration: 1000
            }
        ]
    })
    // log_entry.scrollTop = 1000000
})

anime({
    targets: ['.sched-area .timeline', '.add-area .timeline', '.view-schedule .timeline'],
    translateY: {
        value: '0px',
        duration: 1000
    },
    // easing: 'easeInOutCirc'
    easing: 'easeOutExpo'
})


// notification interface
function sendNotification() {
    const notification = {
        title: 'Blender Today',
        body: 'nice work 12 days streak',
        icon: path.join(__dirname, 'assets', 'icons', 'png', '512.png')
    }
    const myNotification = new window.Notification(notification.title, notification)
    myNotification.onclick = () => {
        console.log('Notification clicked')
    }
}

// frame controls maximize minimize close
var maxmize = document.querySelector("#maxmize")
var minmize = document.querySelector("#minmize")
var close = document.querySelector("#close")

maxmize.addEventListener("click", () => {
    frameControl('maxmize')
})

minmize.addEventListener("click", () => {
    frameControl('minmize')
})

close.addEventListener("click", () => {
    frameControl('close')
})


function frameControl(action) {
    ipcSend('frame_control', {
        'action': action
    })
}


// typewriter effect
class typeWriter {
    constructor(elem, words, wait = 2000) {
        this.elem = elem;
        this.words = words;
        this.wait = wait;
        this.txt = '';
        this.wordindex = 0;
        this.wait = parseInt(wait, 10);
        // this.type()
        this.isDeleting = false;
        // pass
    }

    type() {
        const current = this.wordindex % this.words.length;
        const fullword = this.words[current]
        if (this.isDeleting) {
            this.txt = fullword.substring(0, this.txt.length - 1)
        } else {
            this.txt = fullword.substring(0, this.txt.length + 1)
        }

        this.elem.innerHTML = `<span class='txt'>${this.txt}</span>`;

        let typeSpeed = 300;

        if (this.isDeleting) {
            typeSpeed /= 2;
        }

        if (!this.isDeleting && this.txt === fullword) {
            typeSpeed = this.wait;
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.wordindex++;
            typeSpeed = 500
        }

        setTimeout(() => this.type(), typeSpeed)
    }
}