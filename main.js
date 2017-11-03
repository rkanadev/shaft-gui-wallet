const electron = require('electron');
// Module to control application life.
const electronApp = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const logger = require('./app/util/logger').getLogger('Main');

const app = require('./app/app');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    app.init().then(() => {
        logger.info("Shaft GUI Wallet initialized");
        // Create the browser window.
        mainWindow = new BrowserWindow({width: 800, height: 600, frame: false});

        // and load the index.html of the app.
        mainWindow.loadURL("http://127.0.0.1:4200");


        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
            logger.info('Closing wallet');
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null
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

