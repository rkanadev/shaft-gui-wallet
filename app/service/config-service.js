const buildsConfig = require('../config/builds.json');
const homeDir = process.env.HOME;
const os = require('os');
const platform = os.platform();
const pathsService = require('./paths-service');
const fs = require('fs');
const jsonfile = require('jsonfile');
const logger = require('../util/logger').getLogger("ConfigService");

const configPath = pathsService.getConfigPath();
let config;

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

init();

function readConfig() {
    config = jsonfile.readFileSync(configPath)
}


function isConfigExists() {
    return fs.existsSync(configPath);
}

function createConfig() {
    logger.silly(`Creating config in path ${configPath}`);
    jsonfile.writeFileSync(configPath, {})
}

function getConfig() {
    return config;
}

function writeConfig(config) {
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
        let config = getConfig();
        config.labels = config.labels || {};
        config.labels[address] = label;
        logger.silly('Saving this config: ' + JSON.stringify(config));
        writeConfig(config).then(() => {
            logger.info(`Successfully saved config. Added label ${label} for address ${address}`);
            readConfig();
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
    getAddressLabel: getAddressLabel
};