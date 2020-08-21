const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const outfile = path.join(__dirname, 'save', 'calendar.json');

const {
    app,
    BrowserWindow,
    ipcMain
} = electron;

let MainWindow;

app.on('ready', () => {
    // preload settings and db
    MainWindow = new BrowserWindow({
        frame: false,
        width: 900,
        minWidth: 1000,
        height: 768,
        // fullscreen: true,
        autoHideMenuBar: true,
        backgroundColor: '#2b2b2b',
        icon: path.join(__dirname, 'assets', 'icons', 'png', '512.png'),
        webPreferences: {
            nodeIntegration: true
        }
    })
    MainWindow.maximize()
    MainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main.html'),
        protocol: 'file',
        slashes: true
    }))

    MainWindow.on('closed', () => {
        app.quit()
    })
})

ipcMain.on('frame_control', (e, item) => {
    switch (item.action) {
        case 'close':
            console.log("quiting the app");
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
    }
})

ipcMain.on('get_config', (e, item) => {
    fs.readFile(outfile, 'utf8', (err, res) => {
        if (err) {
            console.error(err)
        }
        var config = JSON.parse(res)
        MainWindow.webContents.send('config', config)
    })
})

ipcMain.on('calendar_entry', (e, item) => {
    e.reply('calendar-entry', item)
    // save to db
    dbSave('entries', item)
})

ipcMain.on('dot_entry', (e, item) => {
    console.log('dot entry in')
    console.log(item)
    dbSave('dots', item)
})

function dbSave(key, data) {
    let db;
    fs.readFile(outfile, 'utf8', (err, res) => {
        if (err) {
            console.error(err)
        }
        db = JSON.parse(res)
        db[key].push(data)
        console.log(db)
        fs.writeFile(outfile, JSON.stringify(db), (err, res) => {
            if (err) {
                console.log(err)
            }
            console.log('saved!')
        })
    })
}