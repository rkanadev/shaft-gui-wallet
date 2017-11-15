// Just the wrapper (holder) of BrowserWindow
let window = null;

function injectWindow(windowRef) {
    window = windowRef;
}

function getWindow() {
    return window;
}


function minimize() {
    if (window !== null) {
        window.minimize();
    }
}

function maximize() {
    if (window !== null) {
        window.maximize();
    }
}

module.exports = {
    getWindow: getWindow,
    minimize: minimize,
    maximize: maximize,
    injectWindow: injectWindow
};
