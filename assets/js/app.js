import Calendar from './calendar.js'
import { mins_to_hrs, range } from './utils.js'

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { ipcRenderer } = electron;
let active_activity;
const event_queue = [];
const ipcSend = (command, payload) => ipcRenderer.send(command, payload)
const calendar = new Calendar()

// modify to show starttime
let RESET_DAY;

const get_last_event = () => {
    const last_event = event_queue[event_queue.length - 1]
    let next_event;

    if (last_event === undefined) {
        next_event = 'first'
    } else {
        next_event = { duration: last_event.duration, timeline: last_event.timeline }
    }

    return next_event
}

const createSchedule = (title, note, date, duration, start = '') => {
    const goals = document.querySelector('.goals');
    const goal = document.createElement('div')
    goal.classList = 'goal';
    goal.dataset.duration = duration;
    /* html */
    const _template = (template_time, template_date, template_title, template_note) => `
        <div class="progress"></div>
        <div class="timeofday">${template_time}</div>
        <div class="real-time">${template_date}</div>
        <h3 class="title">${template_title}</h3>
        <p class="description">${template_note}</p>
    `

    // time format helper
    // const f_time = (xtime) => `${new Date(xtime).getHours()}:${new Date(xtime).getMinutes()}`

    const add_time = (last, add_duration) => {
        // hr:min:sec
        const last_hr = last.split(':')[0]
        const last_min = last.split(':')[1]
        const last_sec = last.split(':')[2]
        let hr = Number(last_hr) + add_duration.hours
        let min = Number(last_min) + Number(add_duration.minutes)
        if (min > 59) {
            const _new = mins_to_hrs(min)
            hr += _new.hours
            min = _new.minutes
        }
        if (hr > 24) console.log('date gone to next day')

        return `${hr}:${min}:${last_sec}`
    }

    const string_time = (t) => `${new Date(t).getHours()}:${new Date(t).getMinutes()}:${new Date(t).getSeconds()}`
    const no_schedule = document.querySelector('.no-schedule')
    no_schedule.style.display = 'none';

    // goal.innerHTML = _template(new Date(date).getHours(), date, title, note);
    const margin_bottom = duration * 4
    goal.style.marginBottom = `${margin_bottom}px`

    // add to event queue
    const event_queue_data = {
        date,
        duration,
    }

    // create the timeline
    const last_event_time = get_last_event()
    if (last_event_time === 'first') {
        event_queue_data.timeline = string_time(date)
    } else {
        const _add_duration = mins_to_hrs(last_event_time.duration)
        event_queue_data.timeline = add_time(last_event_time.timeline, _add_duration)
    }

    const timefrac = (xtime) => {
        const _hours_ = Number(xtime.timeline.split(':')[0])
        const _mins_ = Number(xtime.timeline.split(':')[1] / 60)
        return _hours_ + _mins_
    }

    const e_time = (xtime) => `${xtime.split(':')[0]}:${xtime.split(':')[1]}`

    goal.classList += ' changes';
    const start_timeline_fmt = `${start.substring(0, 2)}:${start.substring(2, 4)}:00`
    event_queue_data.timeline = start_timeline_fmt
    goal.innerHTML = _template(event_queue_data.timeline.split(':')[0], e_time(event_queue_data.timeline), title, note);
    event_queue_data.elem = goal
    event_queue.push(event_queue_data)
    // sort function here at append
    const timelines_array = event_queue.map((ev) => {
        const _time_frac = timefrac(ev)
        return {
            value: _time_frac,
            element: ev.elem,
        }
    })
    const timelines_array_times = timelines_array.map((_ta) => Object.values(_ta)[0])
    insertionSort(timelines_array_times)
    // find the closest from the array
    const now_frac = Number(start_timeline_fmt.split(':')[0]) + Number(start_timeline_fmt.split(':')[1] / 60)
    const insert_after = timelines_array_times[timelines_array_times.indexOf(now_frac) + 1]
    if (insert_after === undefined) {
        goals.appendChild(goal)
    } else {
        // insert before
        // console.log(`inserting ${now_frac} before ${insert_after}`)
        const elem_after = timelines_array.filter((_ta) => {
            if (_ta.value === insert_after) {
                return _ta
            }
            return false
        })[0]
        // console.log(elem_after.element)
        goals.insertBefore(goal, elem_after.element)
    }
}

const showTodaySchedule = (date) => {
    const date_js = new Date(date)
    const date_str = `${date_js.getDate()}:${date_js.getMonth()}:${date_js.getFullYear()}`
    const data = JSON.parse(localStorage.getItem('entries'))

    const today_schedule = data.entries.filter((_data) => {
        const today = new Date(_data.date)
        const today_str = `${today.getDate()}:${today.getMonth()}:${today.getFullYear()}`
        let today_data;
        if (date_str === today_str) {
            today_data = data
        }

        return today_data
    })

    const no_schedule = document.querySelector('.no-schedule')
    if (today_schedule.length === 0) {
        no_schedule.style.display = 'block';
    } else {
        no_schedule.style.display = 'none';
        today_schedule.forEach((entry) => {
            // console.log(entry)
            if (entry.entry_start) {
                createSchedule(entry.title,
                    entry.note, entry.date, entry.duration, entry.entry_start)
            } else {
                createSchedule(entry.title, entry.note, entry.date, entry.duration)
            }
        })
    }
}

const showDots = () => {
    const actions = document.querySelector('#dot-actions .right-menu')
    const conf = JSON.parse(localStorage.getItem('config')).config
    if (conf.length === 0) {
        document.querySelector('.dots .tab-content').classList += ' show_banner'
    } else {
        document.querySelector('.dots .tab-content').classList.remove('show_banner')
    }
    conf.forEach((_dot) => {
        const _duration = _dot.duration.split(' ')[0]
        const _activity = document.createElement('div')
        _activity.classList = 'activity action'
        _activity.dataset.activity = _dot.task
        _activity.dataset.duration = _duration
        _activity.dataset.start = _dot.start
        _activity.textContent = _dot.task
        actions.prepend(_activity)
    })

    create_pins(conf)
    if (conf.length > 0) {
        setTimeout(() => {
            // initial dots
            const _a = document.querySelectorAll('.activity')[0]
            _a.classList += ' active-tab'
            document.querySelector('#grid-dots').replaceWith(generate_dots(_a.dataset.start, _a.dataset.duration))

            new PerfectScrollbar('#grid-dots')
            Dot()
        }, 100)
    }
}

// startup data from localstorage
const init = () => {
    // read the files to local storage
    const read_init_files = (done_reading) => {
        const home_dir = os.homedir()
        const read_files = {
            dots: path.join(home_dir, '.art_calendar', 'calendar_dots.json'),
            entries: path.join(home_dir, '.art_calendar', 'calendar_entries.json'),
            config: path.join(home_dir, '.art_calendar', 'user_config.json'),
        }

        Object.keys(read_files).forEach((key) => {
            fs.readFile(read_files[key], 'utf8', (err, res) => {
                if (err) console.log(err)
                if (res === '') {
                    // for first time users
                    console.log(`${key} is empty`)
                    if (key === 'entries') {
                        document.querySelector('.no-schedule').style.display = 'block'
                    } else if (key === 'dots') {
                        document.querySelector('.dots .tab-content').classList += ' show_banner'
                    }
                } else if (res !== '') {
                    // console.log(JSON.parse(res))
                    localStorage.setItem(key, res)
                    done_reading(key)
                }
            })
        })
    }

    read_init_files((key) => {
        switch (key) {
            case 'dots':
                // pass
                break;
            case 'entries':
                showTodaySchedule(new Date())
                break;
            case 'config':
                showDots()
                break;
            default:
                // pass
                break
        }
    })

    calendar.calendar_dom()
}

init()

const { monthNames } = calendar
const { year } = calendar
const { today } = calendar
const { month } = calendar

// scroll to element
const scroll_to_element = (element, container) => {
    const el = document.querySelector(element)
    const con = document.querySelector(container)
    if (el) {
        const el_offset_top = el.offsetTop
        const offset = con.getBoundingClientRect().height / 2 - 28
        anime({
            targets: con,
            scrollTop: el_offset_top - offset,
            duration: 500,
            easing: 'easeInOutQuart',
        })
    }
}

// dots generate
const generate_dots = (date, duration) => {
    const dot_gen = document.createElement('div')
    dot_gen.id = 'grid-dots'
    dot_gen.classList = 'tab-content grid dots-area'
    const start_date = new Date(date)
    let event_year = start_date.getFullYear()
    let event_month = start_date.getMonth()
    const _dots = range(1, Number(duration))
    let dot_start = start_date.getDate()
    _dots.forEach(() => {
        // create the dom for replacement
        const _dot_dom = document.createElement('div')
        _dot_dom.classList = 'd';
        _dot_dom.id = `dot_${dot_start}`;
        // datasets
        const _date = new Date(event_year, event_month, 31)
        let last_day = (_date.getDate() === 1) ? 30 : 31;
        if (event_month === 1) last_day = (_date.getDate() === 3) ? 28 : 29;
        // go to next moth
        if (dot_start > last_day) {
            dot_start = 1
            event_month += 1
            const show_next_month = document.createElement('div')
            show_next_month.classList = 'show_next_month'
            if (event_month === 12) {
                event_month = 0
            }
            show_next_month.innerHTML = monthNames[event_month]
            _dot_dom.appendChild(show_next_month)
        }
        // go to next year
        if (event_month > 11) {
            event_year = Number(event_year) + 1
            // console.log(event_month)
            // event_month = 0
        }
        _dot_dom.dataset.date = `${dot_start}-${monthNames[event_month]}-${event_year}`;
        const date_index = document.createElement('span')
        date_index.innerHTML = dot_start
        date_index.classList = 'index'

        // show today
        const _today = `${new Date().getDate()}-${monthNames[new Date().getMonth()]}-${new Date().getFullYear()}`
        if (_dot_dom.dataset.date === _today) {
            _dot_dom.classList += ' active-d'
        }
        _dot_dom.appendChild(date_index)
        // console.log(_dot_dom)
        dot_gen.appendChild(_dot_dom)
        dot_gen.style = 'padding-left:3em'
        dot_start += 1
    })

    return dot_gen
}

const Dot = () => {
    const activities = document.querySelectorAll('.activity')
    active_activity = activities[0].dataset.activity
    create_existing_dots()
    // activity tab
    activities.forEach((activity) => {
        activity.addEventListener('click', () => {
            switch_activity_tab(activity)
            scroll_to_element('.active-d', '#grid-dots')
        })
    })

    const dots = document.querySelectorAll('.d')
    dots.forEach((dot) => dot.addEventListener('click', () => {
        if (!dot.dataset.checked) {
            validateDot(dot)
        }
    }))
}

const validateDot = (dot) => {
    // mod
    const _today = `${new Date().getDate()}-${monthNames[new Date().getMonth()]}-${new Date().getFullYear()}`
    if (_today === dot.dataset.date && !dot.dataset.checked) {
        const _cross = document.createElement('div')
        _cross.innerHTML = 'x'
        dot.appendChild(_cross)
        // save to db
        const db_data = {
            precise_date: new Date(year, month, today + 1),
            date: `${today}-${monthNames[month]}-${year}`,
            task: active_activity,
            exact: 'exact',
        }
        dot.dataset.checked = true
        const dots_in_local = JSON.parse(localStorage.getItem('dots')).dots
        dots_in_local.push(db_data)
        localStorage.setItem('dots', JSON.stringify({ dots: dots_in_local }))
        ipcSend('dot_entry', db_data)
    } else {
        console.log('bad move')
    }
}

const Logbook = (date = '') => {
    const notebook = document.querySelector('.notebook');
    let _log_date = `${today}-${monthNames[month]}-${year}`
    if (date !== '') {
        _log_date = `${date.getDate()}-${new Calendar().monthName(date.getMonth())}-${date.getFullYear()}`
    }
    const today_log = path.join(os.homedir(), '.art_calendar', 'logs', 'html', `${_log_date}.html`)
    fs.readFile(today_log, 'utf8', (err, log) => {
        if (err) {
            if (err.code === 'ENOENT') {
                notebook.innerHTML = '';
                notebook.classList += ' show_banner'
            }
        } else {
            notebook.classList.remove('show_banner')
            notebook.innerHTML = log;
        }
    })
    const edit_options = document.querySelector('#edit-options')
    notebook.focus()
    notebook.addEventListener('mouseup', () => {
        const selected = window.getSelection().toString().trim()
        if (selected !== '') {
            edit_options.style.opacity = '1'
            edit_options.style.pointerEvents = 'auto'
        }
    })

    const photo_upload = document.querySelector('#photo-upload');
    const log_save = document.querySelector('#save-log')
    photo_upload.addEventListener('click', () => {
        ipcSend('open-file-dialog', {
            date: `${today}-${monthNames[month]}-${year}`,
        })
    })

    // add the selected image no drag n drop:::
    ipcRenderer.on('selected-file', (e, item) => {
        console.log('files selected')
        console.log(item.calendar_copy)
        const img = document.createElement('img')
        const continues = document.createElement('div')
        continues.innerHTML = '.'
        img.src = item.calendar_copy
        notebook.appendChild(img)
        notebook.append(continues)
    })

    log_save.addEventListener('click', () => {
        // filename: date
        const _save_data = {
            date: `${today}-${monthNames[month]}-${year}`,
            html: notebook.innerHTML,
        }
        // prevent saving for the future
        if (RESET_DAY) {
            Appnotification('can not save in past or future events')
        } else {
            // console.log(`saving ${today}-${monthNames[month]}-${year}.html`)
            ipcSend('save-html', _save_data)
        }
    })

    // create autosave
    notebook.addEventListener('keyup', () => {
        if ('show_banner' in notebook.classList) {
            console.log('show banner is there')
            notebook.classList.remove('show_banner')
        }
        log_save.click()
    })

    // notebook.addEventListener('mousedown', () => {
    //     edit_options.style.opacity = '0'
    //     edit_options.style.pointerEvents = 'none'
    // })
}

// initiate switch tab
document.querySelectorAll('.fab-icon').forEach((fab) => {
    fab.addEventListener('click', () => switchTab(fab.id))
})

// switch tabs
const switchTab = (tab) => {
    const tabcontents = document.querySelectorAll('.content')
    tabcontents.forEach((tabcontent) => {
        if (tabcontent.id === `${tab}-content`) {
            animateSwitchTab(tabcontent)
            switch (tab) {
                case 'logbook':
                    if (RESET_DAY) {
                        Logbook(new Date(RESET_DAY))
                    } else {
                        Logbook()
                    }
                    break;
                case 'dots':
                    scroll_to_element('.active-d', '#grid-dots');
                    break;
                default:
                    break;
            }
        } else {
            tabcontent.classList.remove('show')
            tabcontent.style.transform = 'translateY(250px)'
        }
    })
}

// add a calendar entry logbook and schedule
const actionbtns = document.querySelectorAll('.actions .action-btn')
actionbtns.forEach((actionbtn) => {
    actionbtn.addEventListener('click', () => console.log(actionbtn.textContent.trim()))
})

const addNewEntry = () => {
    const entry_title = document.querySelector('.entry.addentry .title')
    const entry_note = document.querySelector('.entry.addentry .note')
    const entry_duration = document.querySelector('#output')
    const entry_start = document.querySelector('#start-time-input').value

    console.log(entry_duration)

    // alter date for future events
    let entry_date = new Date()
    if (RESET_DAY) entry_date = new Date(RESET_DAY)
    const entry_data = {
        title: entry_title.innerHTML,
        note: entry_note.innerHTML,
        date: entry_date,
        duration: entry_duration.dataset.duration,
        entry_start,
    }

    // invalid start time
    const time_validation = (starttime) => {
        // formart the time
        const str_time_ = (_time) => {
            if (_time.toString().length === 1) {
                return `0${_time.toString()}`
            }
            return _time.toString()
        }

        const now = `${str_time_(new Date().getHours())}${str_time_(new Date().getMinutes())}`
        if (Number(starttime) > 2400 || Number(starttime) < 0) {
            Appnotification('invalid time')
        } else if (starttime.toString().length < 4) {
            Appnotification('invalid start time need 24hr fmt')
        } else if (Number(starttime) < Number(now) && RESET_DAY === undefined) {
            console.log(RESET_DAY)
            Appnotification('cannot add event in the past')
        } else {
            Appnotification('new entry added')
            // reset the values
            entry_title.innerHTML = ''
            entry_note.innerHTML = ''
            entry_duration.value = 30
            ipcSend('calendar_entry', entry_data)
        }
    }

    // check valid schedule entries
    if (!entry_data.entry_start) {
        Appnotification('please add the start time')
        document.querySelector('#start-time-input').focus()
    } else {
        time_validation(entry_data.entry_start)
    }
}

const addtimeline = document.querySelector('#addschedule')
addtimeline.addEventListener('click', () => addNewEntry())
// new calendar entry added
ipcRenderer.on('calendar-entry', (err, item) => {
    console.log(item)
    createSchedule(item.title, item.note, item.date, item.duration, item.entry_start)
})
// new dot entry added
ipcRenderer.on('dot-entry', (err, item) => console.log(item))

// animes
const animateSwitchTab = (tabcontent) => {
    tabcontent.classList += ' show'
    tabcontent.style.transform = 'translateY(250px)'
    anime({
        targets: tabcontent,
        translateY: {
            value: '0px',
            duration: 1000,
        },
        easing: 'easeOutExpo',
    })

    anime({
        targets: ['.sched-area .timeline', '.add-area .timeline', '.view-schedule .timeline'],
        translateY: {
            value: '-180px',
            duration: 1500,
        },
    })
}

anime({
    targets: ['.sched-area .timeline', '.add-area .timeline', '.view-schedule .timeline'],
    translateY: {
        value: '0px',
        duration: 1000,
    },
    easing: 'easeOutExpo',
})

// maxmize,minimiz,close
class FrameControl {
    constructor() {
        this.maxmize = document.querySelector('#maxmize')
        this.minmize = document.querySelector('#minmize')
        this.close = document.querySelector('#close')

        this.maxmize.addEventListener('click', () => this.send('maxmize'))
        this.minmize.addEventListener('click', () => this.send('minmize'))
        this.close.addEventListener('click', () => this.send('close'))
    }

    send(e) {
        ipcSend('frame_control', {
            action: e,
        })
    }
}

// edit funcs
class Editor {
    constructor() {
        this.bold = document.querySelector('#bold')
        this.italic = document.querySelector('#italic')
        this.highlighted = document.querySelector('#highlighted')
        this.heading = document.querySelector('#heading')
        this.bold.addEventListener('click', () => this.editor('bold'))
        this.italic.addEventListener('click', () => this.editor('italic'))
        this.heading.addEventListener('click', () => this.editor('heading'))
        this.highlighted.addEventListener('click', () => this.editor('highlight'))
    }

    editor(action) {
        if (action === 'bold' || action === 'italic') {
            document.execCommand(action)
        } else if (action === 'heading') {
            document.execCommand('formatBlock', true, 'h2')
        } else if (action === 'highlight') {
            document.execCommand('highlight', true)
        }
    }
}

new FrameControl()
new Editor()

// slider
const slider = document.querySelector('#slider')
const output = document.querySelector('#output')
slider.addEventListener('input', () => {
    let out_value = slider.value
    let units = 'min'
    let output_template = `<span class="duration">${out_value}</span>${units}`
    if (out_value > 60) {
        out_value /= 60
        units = 'hrs'
        const _hrs_ = `${out_value.toString().split('.')[0]}`
        const _mins_ = slider.value - (Number(_hrs_) * 60)
        out_value = `${_hrs_} ${_mins_}'`
        output_template = `<span class="duration">${_hrs_} hrs</span>${_mins_} mins`
    }

    output.dataset.duration = slider.value
    output.innerHTML = output_template
})

// menu click
const menuOpt = document.querySelector('#menu')
menuOpt.addEventListener('click', () => {
    const main = document.querySelector('main')
    const overlay = document.querySelector('.settings-overlay')
    main.classList += ' blured'
    overlay.style = `
        pointer-events: auto;
        opacity:1;
    `

    main.addEventListener('mousedown', () => {
        console.log('remove menu')
        main.classList.remove('blured')
        overlay.style = 'pointer-events: none;opacity:0'
    })
})

// app notification
const Appnotification = (msg) => {
    const notif = document.querySelector('.app-notification .notif .notif-content')
    const close = document.querySelector('.close-btn')

    const hide_notification = () => {
        /* css */
        document.querySelector('.app-notification').style = `
            display:none;
        `
    }

    const show_notification = () => {
        /* css */
        document.querySelector('.app-notification').style = `
            display:grid;
        `
    }

    notif.textContent = msg
    show_notification()

    setTimeout(() => {
        hide_notification()
    }, 3000)

    close.addEventListener('click', () => {
        hide_notification()
    })
}

const jumpToDate = (date) => {
    const show_today = document.querySelector('.show-today')
    show_today.querySelector('.info').innerHTML = `${new Date(RESET_DAY).getDate()} ${new Calendar().monthName(date.getMonth())} ${new Date(RESET_DAY).getFullYear()}`
    show_today.style.display = 'flex'
    const shown_goals = document.querySelectorAll('.goal')
    shown_goals.forEach((_goal) => {
        _goal.style.display = 'none';
    })
    // clear schedule add date's schedule show go to
    showTodaySchedule(date)
}

// date click menu actions
const calendar_actions = document.querySelectorAll('.calendar-actions .action')
calendar_actions.forEach((_action) => {
    _action.addEventListener('click', () => {
        const date_clicked = document.querySelector('.calendar-actions .date_selected').dataset.fulldate
        RESET_DAY = date_clicked
        jumpToDate(new Date(date_clicked))
        switch (_action.dataset.action) {
            case 'logbook':
                switchTab('logbook')
                break;
            case 'reminder':
                switchTab('sched')
                break;
            case 'dots':
                switchTab('dots')
                break;
            case 'add':
                // future event
                switchTab('add')
                break;
            default:
                console.log('unexpected action')
                break;
        }
    })
})

// claendar takes in month
const AlterCalendar = (to) => {
    const _month = document.querySelector('.calendar-head .month');
    const _year = document.querySelector('.show-year')
    const _date_today = document.querySelector('.date.active')
    let _month_index = calendar.monthNames.indexOf(_month.innerHTML)
    if (to === 'next') {
        _month_index += 1
    } else {
        _month_index -= 1
    }

    // date overflow modification
    if (_month_index === -1) {
        _month_index = 11
        _year.innerHTML = Number(_year.textContent) - 1
    } else if (_month_index === 12) {
        _month_index = 0
        _year.innerHTML = Number(_year.textContent) + 1
    }

    // a new calendar
    const _date_today_index = new Date(_date_today.dataset.full_date).getDate()
    const _new_month_date = new Date(_year.innerHTML, _month_index, _date_today_index)
    const _calendar = new Calendar(_new_month_date)
    const _dates_dom = document.createElement('div')
    _dates_dom.className = 'dates'
    _calendar.isLeap()
    _calendar.alldays.forEach((day) => {
        const date = document.createElement('div');
        date.classList += 'date';
        date.dataset.date = day;
        date.dataset.full_date = `${new Date(_calendar.year, _calendar.month, day)}`
        if (day === 1) {
            date.style.gridColumn = _calendar.start_day + 1;
        }
        if (day === _calendar.today) {
            date.classList += ' active';
            const main = document.querySelector('.main')
            main.dataset.today = `${new Date(_calendar.year, _calendar.month, day)}`
            // main.dataset.today = new Date(_date_today.dataset.full_date)
        }
        date.textContent = day
        _dates_dom.appendChild(date)
    })
    document.querySelector('.dates').replaceWith(_dates_dom)
    _month.innerHTML = _calendar.monthNames[_month_index]

    _calendar.calendar_event_listeners()
}

// switch month
const next_month = document.querySelector('.next-month')
const prev_month = document.querySelector('.prev-month')
next_month.addEventListener('click', () => AlterCalendar('next'))
prev_month.addEventListener('click', () => AlterCalendar('prev'))

// pinned events task only v1.0
const create_pins = (pins) => {
    const pin_board = document.querySelector('.swiper-wrapper')
    pins.forEach((pin) => {
        const pin_dom = document.createElement('div')
        pin_dom.classList = 'pin-main swiper-slide'
        /* html */
        pin_dom.innerHTML = `
            <h2>${pin.task}</h2>
            <p>${pin.duration} days</p>
        `
        pin_board.appendChild(pin_dom)
    })

    // appending slide
    // mySwiper.appendSlide([array]);

    new Swiper('.swiper-container', {
        loop: true,
        autoplay: {
            delay: 5000,
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true,
        },
        disableOnInteraction: true,
    })
}

// scrap dya
const goto = document.querySelector('.goto')
goto.addEventListener('click', () => {
    console.log('reset day')
    RESET_DAY = undefined
    const main_ = document.querySelector('.main')
    // save today some other place
    if (new Date(main_.dataset.today).getMonth() < new Date().getMonth()) {
        AlterCalendar('next')
    } else {
        AlterCalendar('prev')
    }
    console.log(new Date())
    // jumpToDate(new Date(main_.dataset.today))
    jumpToDate(new Date())
    document.querySelector('.show-today').style.display = 'none'
    document.querySelector('.calendar-actions').style.right = '-3.2em'
})

const create_existing_dots = () => {
    const dots = document.querySelectorAll('.d')
    const dots_data_raw = JSON.parse(localStorage.getItem('dots')).dots === undefined ? [] : JSON.parse(localStorage.getItem('dots')).dots
    // const dots_data = JSON.parse(localStorage.getItem('dots')).dots
    const dots_data = dots_data_raw
    dots_data.forEach((dd) => {
        if (dd.task === active_activity) {
            dots.forEach((dot) => {
                if (dd.date === dot.dataset.date) {
                    dot.dataset.checked = 'true';
                    const ex = document.createElement('div')
                    ex.innerHTML = 'X'
                    dot.appendChild(ex)
                }
            })
        }
    })
}

const switch_activity_tab = (activity) => {
    const _activities = document.querySelectorAll('.activity')
    document.querySelector('#grid-dots').replaceWith(generate_dots(activity.dataset.start, activity.dataset.duration))
    new PerfectScrollbar('#grid-dots')
    const dots = document.querySelectorAll('.d')
    // scroll_to_element('.active-d', '#grid-dots')
    _activities.forEach((_act) => _act.classList.remove('active-tab'))
    activity.classList += ' active-tab'
    active_activity = activity.dataset.activity
    create_existing_dots()
    dots.forEach((dot) => dot.addEventListener('click', () => validateDot(dot)))
}

// add new task
const add_new = document.querySelector('#add-activity')
const add_overlay = document.querySelector('.add-overlay')
add_new.addEventListener('click', () => {
    if (add_overlay.dataset.shown === 'true') {
        add_overlay.dataset.shown = false
        add_overlay.style.display = 'none'
        add_new.style = ''
    } else {
        add_overlay.dataset.shown = true
        add_overlay.style.display = 'block'
        add_new.style.transform = 'rotate(45deg)'
    }
})

const save_to_form = document.querySelector('#save-dot-entry')
const save_dot_entry = () => {
    const _task = document.querySelector('#task_field').value
    const _duration = document.querySelector('#duration_field').value
    let _data = {
        start: new Date(),
        task: _task,
        duration: _duration,
    }

    if (_task !== '') {
        ipcSend('dot_config', _data)
    }

    add_overlay.dataset.shown = false
    add_overlay.style.display = 'none'
    add_new.style = ''

    // the new kid
    const actions = document.querySelector('#dot-actions .right-menu')
    const _durationx = _data.duration.split(' ')[0]
    const _activity = document.createElement('div')
    _activity.classList = 'activity action'
    _activity.dataset.activity = _data.task
    _activity.dataset.duration = _durationx
    _activity.dataset.start = _data.start
    _activity.textContent = _data.task
    actions.prepend(_activity)

    // event listeners for ya
    _activity.addEventListener('click', () => {
        switch_activity_tab(_activity)
    })

    // reset
    _data = null
    document.querySelector('#task_field').value = ''
    document.querySelector('#duration_field').value = ''
    document.querySelector('#auto_add_field').checked = false
    document.querySelector('#remind_time_field').value = ''
    document.querySelector('#remind_field').checked = false
}

save_to_form.addEventListener('click', save_dot_entry)

document.querySelector('#currentHr').innerHTML = new Date().getHours()

const insertionSort = (inputArr) => {
    let n = inputArr.length;
    for (let i = 1; i < n; i++) {
        // Choosing the first element in our unsorted subarray
        let current = inputArr[i];
        // The last element of our sorted subarray
        let j = i - 1;
        while ((j > -1) && (current < inputArr[j])) {
            inputArr[j + 1] = inputArr[j];
            j--;
        }
        inputArr[j + 1] = current;
    }
    return inputArr;
}
