'use strict';
const logger = require('../util/logger').getLogger('Database');
const Datastore = require('nedb');
let db;

function init(path) {
    db = new Datastore({filename: path, autoload: true});
    logger.info('Database connection started up in ' + path);
    /*
    var doc = { hello: 'world'
        , n: 5
        , today: new Date()
        , nedbIsAwesome: true
        , notthere: null
        , notToBeSaved: undefined  // Will not be saved
        , fruits: [ 'apple', 'orange', 'pear' ]
        , infos: { name: 'nedb' }
    };

    db.insert(doc, function (err, newDoc) {
        console.log('11')
        // Callback is optional
        // newDoc is the newly inserted document, including its _id
        // newDoc has no key called notToBeSaved since its value was undefined
    });
*/

}

module.exports = {
    init: init,
    getAccount: getAccount
};


function getAccount(address) {
    //todo validation

    return new Promise((resolve, reject) => {
        let doc = db.find({address: address}, (err, addressDoc) => {
            if (err) {
                logger.error(err);
                reject(err);
            } else {
                resolve(addressDoc);
            }
        })
    })
}