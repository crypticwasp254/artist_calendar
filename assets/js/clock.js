// @ts-check
export default class Clock {
    constructor(date) {
        this.date = new Date(date)
        this.hrs = this.date.getHours()
        this.mins = this.date.getMinutes()
        this.secs = this.date.getSeconds()
    }

    format(t) {
        if (t < 10) {
            return `0${t}`
        }
        return t
    }

    show() {
        return {
            hours: this.hrs,
            minutes: this.mins,
            seconds: this.secs,
        }
    }

    compare(date1, date2) {
        return (date1 > date2)
    }
}
