const electron = require('electron')
const { ipcRenderer } = electron

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
const dateEnds = [{ 1: 'st' }, { 2: 'nd' }, { 3: 'rd' }]
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
    console.log(end)
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
                translateY: { value: '0px', duration: 1000 },
                // easing: 'easeInOutCirc'
                easing: 'easeOutExpo'
            })
            if (tab === 'dots') {
                animateGrid.play()
            }
        }
        else {
            tabcontent.classList.remove('show')
            tabcontent.style.transform = 'translateY(250px)'
        }
    })
}

// animate
// grid test
const animateGrid = anime({
    targets: '.tab-content.grid .d',
    scale: [
        { value: .7, easing: 'easeOutSine', duration: 500 },
        { value: 1, easing: 'easeInOutQuad', duration: 1200 }
    ],
    delay: anime.stagger(200, { grid: [7, 7], from: 'center' }),
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
const addtimeline = document.querySelector('#addschedule')
addtimeline.addEventListener('click', () => {
    var entry_title = document.querySelector('.entry .title')
    var entry_note = document.querySelector('.entry .note')
    var entry_duration = document.querySelector('#timer')
    console.log(entry_duration.textContent.trim())
    ipcSend('calendar_entry', {
        title: entry_title.innerHTML,
        note: entry_note.innerHTML,
        duration: entry_duration.textContent.trim()
    })

    // console.log(entry_title.innerHTML, entry_note.innerHTML, entry_duration.innerHTML)
})
// rotate timer
anime({
    targets: '#rotateanim',
    rotate: { value: '1turn', duration: 1000 },
    easing: 'linear',
    loop: true
})

// ipc interface

function ipcSend(command, payload) {
    ipcRenderer.send(command, payload)
}

ipcRenderer.on('calendar_entry', (e, item) => {

})