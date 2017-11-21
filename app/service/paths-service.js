const buildsConfig = require('../config/builds.json');
const homeDir = process.env.HOME;
const os = require('os');
const platform = os.platform();

let paths;

function init() {
    let homeDir = null;
    let shaftGUIDir = null;
    let binariesDir = null;
    let executablePath = null;
    let buildUrl = null;
    let platform = null;
    let fileName = null;
    let shaftDir = null;
    let sha256 = null;
    let logfile = null;
    let nodeLogFile = null;
    let configFile = null;
    if (process.arch !== 'x64') {
        reject('Sorry, unsupported architecture');
    }
    if (isPlatformLinux()) {
        platform = 'linux';
        buildUrl = buildsConfig.geth[platform].x64.latest.url;
        sha256 = buildsConfig.geth[platform].x64.latest.sha256;
        fileName = buildUrl.substring(buildUrl.lastIndexOf("/")).substr(1);
        homeDir = process.env.HOME;
        shaftDir = '/.shaft';
        shaftGUIDir = '/.shaft-gui';
        binariesDir = '/binaries';
        executablePath = '/' + fileName;
        logfile = '/shaft-gui.log';
        nodeLogFile = '/node.log';
        configFile = '/config.json';
    }
    if (isPlatformWindows()) {
        platform = 'win';
        buildUrl = buildsConfig.geth[platform].x64.latest.url;
        sha256 = buildsConfig.geth[platform].x64.latest.sha256;
        fileName = buildUrl.substring(buildUrl.lastIndexOf("/"));
        homeDir = process.env.APPDATA;
        shaftDir = '\\SHAFT';
        shaftGUIDir = '\\Shaft-GUI';
        binariesDir = '\\binaries';
        executablePath = '\\' + fileName;
        logfile = '\\shaft-gui.log';
        nodeLogFile = '\\node.log';
        configFile = '\\config.json';
    }

    paths = {
        platform: platform,
        buildUrl: buildUrl,
        sha256: sha256,
        fileName: fileName,
        homeDir: homeDir,
        shaftDir: shaftDir,
        shaftGUIDir: shaftGUIDir,
        binariesDir: binariesDir,
        executablePath: executablePath,
        logfile: logfile,
        nodeLogFile: nodeLogFile,
        configFile: configFile
    }
}

init();


function isPlatformLinux() {
    return platform.indexOf("linux") !== -1
}

function isPlatformWindows() {
    return platform.indexOf("win") !== -1
}


function getGethNodeDir() {
    return paths.homeDir + paths.shaftDir
}

function getShaftGuiDir() {
    return paths.homeDir + paths.shaftGUIDir;
}

function getBinariesDir() {
    return paths.homeDir + paths.shaftGUIDir + paths.binariesDir;
}

function getHomeDir() {
    return paths.homeDir;
}

function getShaftDir() {
    return paths.homeDir + paths.shaftDir;
}

function getExecutablePath() {
    return paths.homeDir + paths.shaftGUIDir + paths.binariesDir + paths.executablePath;
}

function getNodeLogPath() {
    return paths.homeDir + paths.shaftGUIDir + paths.nodeLogFile;
}

function getCurrentBuildUrl() {
    return paths.buildUrl;
}

function getCurrentBuildSHA256() {
    return paths.sha256;
}

function getLogPath() {
    return paths.homeDir + paths.shaftGUIDir + paths.logfile;
}

function getConfigPath() {
    return paths.homeDir + paths.shaftGUIDir + paths.configFile;
}

module.exports = {
    getShaftDir: getShaftDir,
    getShaftGuiDir: getShaftGuiDir,
    getBinariesDir: getBinariesDir,
    getGethNodeDir: getGethNodeDir,
    getHomeDir: getHomeDir,
    getExecutablePath: getExecutablePath,
    getNodeLogPath: getNodeLogPath,
    getLogPath: getLogPath,
    getCurrentBuildUrl: getCurrentBuildUrl,
    getCurrentBuildSHA256: getCurrentBuildSHA256,
    getConfigPath: getConfigPath
};