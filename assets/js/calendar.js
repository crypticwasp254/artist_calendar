// @ts-check
import { range } from './utils.js';

export default class Calendar {
    constructor(date = new Date()) {
        this.month = date.getMonth();
        this.year = date.getFullYear();
        this.start_day = new Date(this.year, this.month, 1).getDay();
        this.end_day = new Date(this.year, this.month, 31);
        this.weekdays = [
            'sunday', 'monday', 'tuesday',
            'wednesday', 'thursday', 'friday',
            'saturday',
        ];
        this.monthNames = [
            'january', 'february', 'march', 'april',
            'may', 'june', 'july', 'august', 'september',
            'october', 'november', 'december',
        ]
        this.today = date.getDate()
        this.alldays = (this.end_day.getDate() === 1) ? range(1, 30) : range(1, 31)
    }

    isLeap() {
        // feb
        if (this.month === 1) {
            const _leap = new Date(this.year, this.month, 29).getDate();
            if (_leap === 1) {
                this.alldays = range(1, 28)
            } else {
                this.alldays = range(1, 29)
            }
        }
    }

    monthName(month = this.month) {
        return this.monthNames[month]
    }

    datend() {
        const dateEnds = [{ 1: 'st' }, { 2: 'nd' }, { 3: 'rd' }]
        let _day = this.today.toString()
        if (_day.length === 2) {
            _day = _day[1]
        }

        let _end = dateEnds[Number(_day) - 1]
        if (_end !== undefined) {
            _end = _end[_day]
        } else {
            // @ts-ignore
            _end = 'th'
        }

        return _end
    }

    calendar_dom() {
        this.isLeap();
        const month = document.querySelector('.calendar-head .month');
        const days = document.querySelector('.dates');
        const year = document.querySelector('.show-year');
        // show year
        // @ts-ignore
        year.innerHTML = this.year
        // show month
        month.innerHTML = this.monthName()
        // show days
        this.alldays.forEach((day) => {
            const date = document.createElement('div');
            // @ts-ignore
            date.classList += 'date';
            date.dataset.date = day;
            date.dataset.full_date = `${new Date(this.year, this.month, day)}`
            if (day === 1) {
                // @ts-ignore
                date.style.gridColumn = this.start_day + 1;
            }
            if (day === this.today) {
                // @ts-ignore
                date.classList += ' active';
                const main = document.querySelector('.main')
                main.dataset.today = `${new Date(this.year, this.month, day)}`
            }
            // @ts-ignore
            date.textContent = day
            days.appendChild(date);
        })
        // large display
        const large_day = document.querySelector('.date-info .day')
        const large_date = document.querySelector('.date-info .date')
        large_day.textContent = this.weekdays[new Date().getDay()]
        large_date.innerHTML = `${this.today}<sup>${this.datend()}</sup>`
        this.calendar_event_listeners()
    }

    calendar_event_listeners() {
        const dates = document.querySelectorAll('.dates .date')
        dates.forEach((date) => {
            date.addEventListener('click', () => {
                const _date_clicked = date.dataset.date
                const cal_action = document.querySelector('.calendar-actions')
                // @ts-ignore
                if (cal_action.style.right === '-3.2em' || cal_action.style.right === '') {
                    cal_action.style = 'right:0em'
                }
                cal_action.querySelector('.date_selected').innerHTML = _date_clicked
                cal_action.querySelector('.date_selected').dataset.fulldate = date.dataset.full_date
                // compare with today
                const main_today = document.querySelector('.main').dataset.today
                const date_today = date.dataset.full_date
                document.querySelector('#add-action').style = ''
                document.querySelector('#logbook-action').style = ''
                if (new Date(date_today) < new Date(main_today)) {
                    document.querySelector('#add-action').style = `
                    opacity:0.2;
                    pointer-events:none;
                    `
                }

                if (new Date(date_today) > new Date(main_today)) {
                    // @ts-ignore
                    document.querySelector('#logbook-action').style = `
                    opacity:0.2;
                    pointer-events:none;
                    `
                }
            })
        })
    }
}
