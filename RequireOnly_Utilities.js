/*
This document is only meant to be '@required' by other scripts
*/


/*
Usage: Executes a function only once, no matter how many times its called
*/
const DoOnceMap = new Map();
let DoOncePrototypeCheckDone = typeof String.prototype.hashCode === "function";
const DoOnce = (action) => {
    if (typeof action !== 'function') throw new Error("Function 'DoOnce' expects a function for the 'action' argument");
    if (!DoOncePrototypeCheckDone) {
        String.prototype.hashCode = function() {
            let hash = 0,
                i, chr;
            if (this.length === 0) return hash;
            const len = this.length;
            for (i = 0; i < len; i++) {
                chr = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
        DoOncePrototypeCheckDone = true;
    }
    const fnHash = action.toString().hashCode;
    if (DoOnceMap.has(fnHash)) return;

    let returnValue = action();
    DoOnceMap.set(fnHash, true);
    return returnValue;
};
