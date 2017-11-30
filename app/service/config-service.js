const buildsConfig = require('../config/builds.json');
const homeDir = process.env.HOME;
const os = require('os');
const platform = os.platform();
const pathsService = require('./paths-service');
const fs = require('fs');
const jsonfile = require('jsonfile');
const loggerFactory = require('../util/logger');
const logger = require('../util/logger').getLogger("ConfigService");
const mkdirp = require('mkdirp');
const defaultAppConfig = require('../config/defaultAppConfig.json');
const configPath = pathsService.getConfigPath();
let _config;

function init() {
    let exists = fs.existsSync(configPath);
    if (!exists) {
        logger.info("Config file does not exists, creating default");
        logger.silly(`Writing default config file to ${configPath}`);
        createConfig();
        readConfig();
    } else {
        logger.info("Reading config file");
        logger.silly(`Reading config file from ${configPath}`);
        readConfig();
    }
}


function readConfig() {
    _config = jsonfile.readFileSync(configPath);
    loggerFactory.changeLogLevel(_config.log.level);
    logger.silly("App config: " + JSON.stringify(_config));
}


function isConfigExists() {
    return fs.existsSync(configPath);
}

function createConfig() {
    logger.silly(`Creating config in path ${configPath}`);
    jsonfile.writeFileSync(configPath, defaultAppConfig)
}

function getConfig() {
    if(!_config){
        logger.error("Config is not initialized yet! Returning default: " + defaultAppConfig);
        return defaultAppConfig;
    }
    return _config;
}

function writeConfig(config) {
    mkdirp.sync(pathsService.getShaftGuiDir());
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(configPath, config, function (err) {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        });
    })
}

function saveAddressLabel(address, label) {
    return new Promise((resolve, reject) => {
        if(!_config){
            reject("Config is not initialized yet!");
        }
        let config = getConfig();
        config.labels = config.labels || {};
        config.labels[address] = label;
        logger.silly('Saving this config: ' + JSON.stringify(config));
        writeConfig(config).then(() => {
            logger.info(`Successfully saved config. Added label ${label} for address ${address}`);
            readConfig();
            resolve();
        }, err => {
            logger.error(err);
            reject(err);
        })
    })
}


function getAddressLabel(address) {
    return new Promise((resolve, reject) => {
        let config = getConfig();
        if (config) {
            if (!config.labels) {
                reject('No labels configured')
            } else {
                if (!config.labels[address]) {
                    reject('No label for address ' + address);

                } else {
                    resolve(config.labels[address]);
                }
            }
        } else {
            reject('No config')
        }
    })
}

module.exports = {
    getConfig: getConfig,
    saveAddressLabel: saveAddressLabel,
    getAddressLabel: getAddressLabel,
    init: init
};