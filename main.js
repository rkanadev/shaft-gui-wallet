const electron = require('electron');
// Module to control application life.
const electronApp = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const logger = require('./app/util/logger').getLogger('Main');
const url = require('url');
const path = require('path');

const app = require('./app/app');
const isDev = require('electron-is-dev');
const window = require('./app/util/window');
const updaterService = require('./app/service/updater-service');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {

    app.init().then(() => {
        logger.info("Shaft GUI Wallet initialized");
        // Create the browser window.
        mainWindow = new BrowserWindow({width: 1000, height: 800, frame: false, center: true});
        // and load the index.html of the app.
        if (isDev) {
            mainWindow.loadURL("http://127.0.0.1:4200");
        } else {
            // and load the index.html of the app.
            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname + '/renderer/dist', 'index.html'),
                protocol: 'file:',
                slashes: true
            }));
        }

        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
            logger.info('Closing wallet');
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null
        });
        window.injectWindow(mainWindow);

        updaterService.checkForUpdates().then(updateCheckResult => {
            updaterService.install();
        },err=> {
            logger.error("Could not check for updates: " + err);
        })
    }, err => {
        logger.error(err);
        process.exit(0)
    });


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electronApp.on('ready', createWindow);

// Quit when all windows are closed.
electronApp.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electronApp.quit()
    }

    console.log('Shaft GUI closed');
});

electronApp.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

