const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow, Menu, ipcMain } = electron;

let MainWindow;

app.on('ready', () => {
    MainWindow = new BrowserWindow({
        frame: false,
        autoHideMenuBar: true,
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

ipcMain.on('calendar_entry', (e, item) => {
    console.log(item)
})