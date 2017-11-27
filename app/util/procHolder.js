'use strict';
let _proc = null;

function putProc(proc) {
    _proc = proc;
}

function getProc() {
    return _proc;
}

module.exports = {
    putProc: putProc,
    getProc: getProc
};