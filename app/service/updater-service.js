const autoUpdater = require("electron-updater").autoUpdater;
const logger = require('../util/logger').getLogger("UpdaterService");

function init() {
    logger.debug("Starting updater service");

    autoUpdater.on('checking-for-update', () => {
        logger.info("Checking for update");
    });
    autoUpdater.on('download-progress', (progress) => {
        let total = progress.total;
        let transferred = progress.total;
        let percent = progress.percent;
        let speed = progress.bytesPerSecond;
        logger.debug(`[${transferred}/${total}] ${percent}% , speed: ${speed}`)
    });

    autoUpdater.on('update-not-available', () => {
        logger.info("Shaft GUI wallet is up to date, no updates available.")
    });

    autoUpdater.on('update-available', (info) => {
        let version = info.version;
        logger.info(`Update found, fresh version ${version}, do you want to update?`)
    });


    autoUpdater.on('update-downloaded', (info) => {
        logger.info(`Downloaded new version ${info.version}`)
        //todo moveout
        install();
        console.log(info);
    });

}
init();

function checkForUpdates() {
    return new Promise((resolve, reject) => {
        autoUpdater.checkForUpdates().then((updateCheckResult) => {
            logger.info("Check for updates resolved");
            resolve(updateCheckResult)
        }, err => {
            logger.error("Error checking for updates: " + err);
            reject(err);
        });
    })
}

function install() {
    logger.info("Installing new version");
    autoUpdater.quitAndInstall();
}


module.exports = {
    checkForUpdates: checkForUpdates,
    install: install,
};