export const range = (start = 0, stop_ = start) => {
    const results = [];
    let i;
    for (i = start; i <= stop_; i++) {
        results[i] = i;
    }
    return results;
}

export const ctxmenu = (e) => {
    const menu = document.querySelector('.context-menu')
    const x = e.pageX;
    const y = e.pageY;
    const menuheight = Number(getComputedStyle(menu).height.slice(0, -2))
    const menuwidth = Number(getComputedStyle(menu).width.slice(0, -2))
    const winheight = Number(getComputedStyle(document.documentElement).height.slice(0, -2))
    const winwidth = Number(getComputedStyle(document.documentElement).width.slice(0, -2))
    menu.style = `
    display:block;
    top:calc(${y}px);
    left:calc(${x}px);
    `

    if ((x + menuwidth) > winwidth) {
        console.log('width greater reposition')
        menu.style.left = `${x - menuwidth}px`
    }
    if ((y + menuheight) > winheight) {
        console.log('height greater reposition')
        menu.style.top = `${y - menuheight}px`
    }

    console.log(menuheight, menuwidth)
    console.log(x, y)
    console.log(winheight, winwidth)
}

export const entry_note_dom = `
    <h1 class="title" id="entry" contenteditable="" placeholder="clif" spellcheck="false">new entry
    </h1>
    <div class="note" id="entry" contenteditable="" spellcheck="false">entry note
    </div>
    <div class="range-duration">
        <div class="options">
            <p id="output" class="duration_output"> <span class="duration">30</span>min</p>
            <div class="more-settings">
                <svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <g id="configure" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="10" transform="translate(5.000000, 5.000000)" fill="aqua" fill-rule="nonzero" style="opacity: .3;">
                            <path d="M6.16980915,1 L6.03920265,2.56066469 L5.44305167,2.78148609 C4.96472098,2.95866545 4.51999623,3.21588171 4.1278883,3.5421395 L3.63839257,3.94942989 L2.21865841,3.28093034 L1.38844898,4.71897166 L2.68019788,5.61606553 L2.56869942,6.2464389 C2.52437053,6.49705894 2.50138327,6.75098794 2.4999998,6.99936649 C2.50016165,7.25484949 2.52208033,7.50985464 2.56551824,7.76161789 L2.67391881,8.38990028 L1.38869397,9.28145269 L2.21868421,10.7191144 L3.63214076,10.0536673 L4.1211017,10.4574264 C4.51452658,10.7822968 4.96033526,11.0378937 5.43946105,11.2132857 L6.04053987,11.4333206 L6.16808451,13.001953 L7.8262846,13.001953 L7.95689101,11.4412883 L8.55304206,11.2204669 C9.03137258,11.0432876 9.47609719,10.7860715 9.86820503,10.4598139 L10.3577005,10.0525238 L11.7774354,10.721023 L12.6076449,9.28298158 L11.3158951,8.38588744 L11.4273941,7.75551356 C11.4717231,7.50489354 11.4947106,7.25096454 11.4960942,7.0025865 C11.4959324,6.74710351 11.4740137,6.49209835 11.4305758,6.2403351 L11.3221754,5.6120528 L12.6074,4.72050044 L11.7774099,3.28283889 L10.3639534,3.94828632 L9.87499231,3.54452706 C9.48156736,3.21965667 9.03575859,2.9640597 8.55663271,2.78866771 L7.95555379,2.56863279 L7.82800922,1 L6.16980915,1 Z M5.25,0 L8.75,0 L8.9003906,1.8496094 C9.4859889,2.06397739 10.0308663,2.37637369 10.511719,2.7734375 L12.183594,1.9863281 L13.933594,5.0175781 L12.416016,6.0703125 C12.4691068,6.37802314 12.4958962,6.68969611 12.496094,7.0019531 C12.4943847,7.31301647 12.466289,7.62337413 12.412109,7.9296875 L13.933594,8.9863281 L12.183594,12.017578 L10.507812,11.228516 C10.0285691,11.6272753 9.48501679,11.9416505 8.9003906,12.158203 L8.7460938,14.001953 L5.2460938,14.001953 L5.0957031,12.152344 C4.51010491,11.937976 3.96522763,11.6255797 3.484375,11.228516 L1.8125,12.015625 L0.0625,8.984375 L1.5800781,7.9316406 C1.52698731,7.62392996 1.50019782,7.31225699 1.5,7 C1.50170911,6.68893664 1.52980465,6.37857898 1.5839844,6.0722656 L0.0625,5.015625 L1.8125,1.984375 L3.4882812,2.7734375 C3.96752423,2.37467798 4.5110767,2.06030255 5.0957031,1.84375 L5.25,0 Z" id="Path"></path>
                            <path d="M7,5 C8.1045695,5 9,5.8954305 9,7 C9,8.1045695 8.1045695,9 7,9 C5.8954305,9 5,8.1045695 5,7 C5,5.8954305 5.8954305,5 7,5 Z M7,8 C7.55228475,8 8,7.55228475 8,7 C8,6.44771525 7.55228475,6 7,6 C6.44771525,6 6,6.44771525 6,7 C6,7.55228475 6.44771525,8 7,8 Z" id="Combined-Shape"></path>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
        <input type="range" name="" id="slider" min="1" max="100" value="30">
    </div>
    <div class="add" id="addschedule">
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
            <title>add to timeline</title>
            <path d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z" style="fill:none;stroke:#ffffff;stroke-miterlimit:10;stroke-width:32px"></path>
            <line x1="256" y1="176" x2="256" y2="336" style="fill:none;stroke:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"></line>
            <line x1="336" y1="256" x2="176" y2="256" style="fill:none;stroke:#ffffff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"></line>
        </svg>
    </div>
`

// dropdown
export class Dropdown {
    constructor(el) {
        this.dd = el;
        this.placeholder = this.dd.querySelector('span');
        this.opts = this.dd.querySelectorAll('ul > li')
        this.val = '';
        this.index = -1;
        this.init()
    }

    init() {
        this.dd.addEventListener('click', () => {
            this.dd.classList.toggle('active')
        })
        this.opts.forEach((opt) => {
            opt.addEventListener('click', () => {
                this.placeholder.innerText = opt.textContent
            })
        })
    }
}

export const mins_to_hrs = (mins) => {
    let hours = 0; let
        minutes = mins
    if (mins > 59) {
        const frac = mins / 60
        hours = Number(frac.toFixed())
        minutes = Math.round((frac - hours) * 60)
    }

    return {
        hours,
        minutes,
    }
}
