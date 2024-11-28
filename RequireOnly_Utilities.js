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

/*
Usage: Expects a valid CSS selector, and "waits" indefinitely until atleast one element
gets returned from the 'document.querySelectorAll(...)' using the provided selector
*/
const WaitForElement = (selector) => {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
            if (el) { resolve(el); }
            new MutationObserver((mutationRecords, observer) => {
            // Query for elements matching the specified selector
            Array.from(document.querySelectorAll(selector)).forEach((element) => {
                //Once we have resolved we don't need the observer anymore.
                observer.disconnect();
                resolve(element);
            });
        })
        .observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
};

/*
Usage: Same functionality as 'WaitForElement' but with the promise gets rejected
if no element is found within the interval provided by the 'timeout' argument
*/
const WaitForElementWithTimeout = (selector, timeout = 3000) => {
	return new Promise((resolve, reject) => {
		if (timeout < 0) timeout = 0;
		if (!selector) reject("No selector specified");
 
		const el = document.querySelector(selector);
		if (el) resolve(el);
 
		const timeoutMessage = `Timeout: Element with selector '${selector}' not found within ${timeout} ms`;
		let timer = setTimeout(() => {
            clearTimeout(timer);
			observer.disconnect();
			reject(new Error(timeoutMessage));
		}, timeout);
 
		const observer = new MutationObserver((mutationRecords, observer) => {
			let elements = Array.from(document.querySelectorAll(selector));
			if (elements.length > 0) {
				clearTimeout(timer);
				observer.disconnect();
				resolve(elements[0]);
			}
		});
 
		observer.observe(document.documentElement, {
			childList: true,
			subtree: true,
		});
	});
};
