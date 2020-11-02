// eslint-disable-next-line import/no-extraneous-dependencies
const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

const {
    app, BrowserWindow, ipcMain, dialog,
} = electron;

const StorageDir = require('./assets/js/storages')

let calendar_storage;
let photos_save_dir;
let html_save_dir;

const outfile = path.join(__dirname, 'save', 'calendar.json');
let MainWindow;

app.on('ready', () => {
    const home_dir = app.getPath('home')
    calendar_storage = path.join(home_dir, '.art_calendar')
    StorageDir(calendar_storage)

    // set save paths
    photos_save_dir = path.join(calendar_storage, 'logs', 'image')
    html_save_dir = path.join(calendar_storage, 'logs', 'html')

    MainWindow = new BrowserWindow({
        frame: false,
        width: 1150,
        height: 745,
        autoHideMenuBar: true,
        backgroundColor: '#2b2b2b',
        icon: path.join(__dirname, 'assets', 'icons', 'png', 'cal_x.png'),
        minWidth: 1000,
        webPreferences: {
            devTools: false,
            nodeIntegration: true,
            worldSafeExecuteJavaScript: true,
            contextIsolation: false,
        },
    })
    MainWindow.maximize()
    MainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file',
        slashes: true,
    }))

    MainWindow.setMinimumSize(1150, 745)
    MainWindow.on('closed', () => {
        app.quit()
        MainWindow = null
    })
})

// ipc mains
ipcMain.on('frame_control', (e, item) => {
    switch (item.action) {
        case 'close':
            console.log('quiting the app');
            MainWindow.close()
            app.quit()
            break;
        case 'minmize':
            MainWindow.minimize()
            break;
        case 'maxmize':
            if (MainWindow.isMaximized()) {
                MainWindow.unmaximize()
            } else {
                MainWindow.maximize()
            }
            break;
        default:
            // pass
            break;
    }
})

ipcMain.on('get_config', () => {
    // new config files
    fs.readFile(outfile, 'utf8', (err, res) => {
        if (err) {
            console.error(err)
        }
        const config = JSON.parse(res)
        MainWindow.webContents.send('config', config)
    })
})

ipcMain.on('calendar_entry', (e, item) => {
    e.reply('calendar-entry', item)
    // save to db
    // dbSave('entries', item)
    Save('entry', item)
})

ipcMain.on('dot_entry', (e, item) => {
    // dbSave('dots', item)
    // e.reply('dot-entry', item)
    Save('dots', item)
})

ipcMain.on('open-file-dialog', (e, item) => {
    dialog.showOpenDialog({
        title: 'add a photo',
        properties: ['openFile'],
        filters: [{
            name: 'Images',
            extensions: ['jpg', 'png', 'gif', 'svg'],
        }],
    }).then((result) => {
        // copy file path
        const _copy_dir = path.join(photos_save_dir, `${item.date}__${path.basename(result.filePaths[0])}`)
        fs.copyFile(result.filePaths[0], _copy_dir, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log('copied')
            }
        })
        e.reply('selected-file', {
            copy_from: result.filePaths,
            calendar_copy: _copy_dir,
        })
    }).catch((err) => {
        console.log(err)
    })
})

// editor stuff
ipcMain.on('save-html', (e, item) => {
    const _save_file = path.join(html_save_dir, `${item.date}.html`)
    // it overwrites by default how can we merge
    fs.writeFile(_save_file, item.html, (err) => {
        if (err) {
            console.log(err)
        }
        // else {
        //     console.log('saved')
        // }
    })
})

ipcMain.on('dot_config', (e, item) => {
    // save config and data at save
    // saveConfig('dots', item)
    Save('config', item)
})

const Cwrite = (file, data) => {
    fs.writeFile(file, data, (e) => {
        if (e) console.log(e)
        console.log(`Cwrite ${file}`)
    })
}

// new save dir
const Save = (key, data) => {
    const home_dir = app.getPath('home')
    const dots_file = path.join(home_dir, '.art_calendar', 'calendar_dots.json');
    const entries_file = path.join(home_dir, '.art_calendar', 'calendar_entries.json');
    const config_file = path.join(home_dir, '.art_calendar', 'user_config.json');

    const presave = (check_key, file, save) => {
        fs.readFile(file, 'utf8', (err, res) => {
            // empty json file
            if (res === '') {
                Cwrite(file, JSON.stringify({}))
                res = JSON.stringify({})
            }

            // key not exist
            const db = JSON.parse(res)
            if (!Object.keys(db).includes(check_key)) {
                db[check_key] = []
                Cwrite(file, JSON.stringify(db))
            }

            save()
        })
    }

    const postsave = (save_key, save_data, file) => {
        presave(save_key, file, () => {
            fs.readFile(file, 'utf8', (err, res) => {
                if (err) console.log(err)
                const db = JSON.parse(res)
                db[save_key].push(save_data)
                Cwrite(file, JSON.stringify(db))
            })
        })
    }

    switch (key) {
        case 'dots':
            postsave('dots', data, dots_file)
            break;
        case 'entry':
            postsave('entries', data, entries_file)
            break;
        case 'config':
            postsave('config', data, config_file)
            break;
        default:
            console.log('invalid key')
            break;
    }
}
