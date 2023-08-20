import { _get } from './dash-utils';
import { getPlatform, DeviceObj } from './platform';

type IncognitOptions = {
    ua?:string,
    device?:DeviceObj
};

export { getPlatform, DeviceObj };

export const detectIncognito = (options?:IncognitOptions):{ isPrivate: boolean, browserName: string } => {
    let { ua, device } = options || {};
    if(!device) {
        if (!ua) ua = window.navigator.userAgent;
        device = getPlatform(ua);
    }
    let payload = { isPrivate: false, browserName: '' };

    const oldChromePrivateTest = () => {
        let fs = window['webkitRequestFileSystem' as keyof typeof window];
        let success = function () {
            payload.isPrivate = false;
        };
        let error = function () {
            payload.isPrivate = true;
        };
        fs(0, 1, success, error);
    }

    const getQuotaLimit = () => {
        const performance = window.performance;
        const memory = performance ? performance['memory' as keyof typeof performance] : null;
        const jsHeapSizeLimit = memory ? memory['jsHeapSizeLimit' as keyof typeof memory] : null;
        if (jsHeapSizeLimit) {
            return jsHeapSizeLimit;
        } else return 1073741824;
    }

    const storageQuotaChromePrivateTest = () => {
        const webkitTemporaryStorage = window.navigator['webkitTemporaryStorage' as keyof typeof window.navigator];
        const queryUsageAndQuota = webkitTemporaryStorage ? webkitTemporaryStorage['queryUsageAndQuota' as keyof typeof webkitTemporaryStorage] : (fn1:(usage:number, quota:number) => void, fn2:(e:string) => void) => console.error('detectIncognito error traversing webkit temporary storage usage and quota', fn1, fn2);
        queryUsageAndQuota(
            function (usage, quota) {
                payload.isPrivate = (quota < getQuotaLimit());
            },
            function (e) {
                throw new Error('detectIncognito somehow failed to query storage quota: ' + e['message' as keyof typeof e]);
            }
        );
    };

    const chromePrivateTest = () => {
        if (Promise !== undefined && Promise.allSettled !== undefined) {
            storageQuotaChromePrivateTest();
        } else {
            oldChromePrivateTest();
        }
    }

    const oldSafariTest = () => {
        let openDB = window['openDatabase' as keyof typeof window];
        let storage = window.localStorage;
        try {
            openDB(null, null, null, null);
        } catch (e) {
            payload.isPrivate = true;
        }
        try {
            storage.setItem('test', '1');
            storage.removeItem('test');
        } catch (e) {
            payload.isPrivate = true;
        }
        payload.isPrivate = false;
    }

    function macOS_safari14() {
        try {
            window['safari' as keyof typeof window]?.pushNotification.requestPermission('https://example.com', 'private', {}, (function () {
                console.log(''); }));
        } catch (e) {
            payload.isPrivate = (!new RegExp('gesture').test(String(e)));
        }
        payload.isPrivate = false;
    }

    function iOS_safari14() {
        let tripped = false;
        let iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const appCache = iframe.contentWindow ? iframe.contentWindow['applicationCache' as keyof typeof iframe.contentWindow] : null;
        if(appCache) {
            appCache.addEventListener('error', function () {
                tripped = true;
                payload.isPrivate = true;
            });

            setTimeout(function () {
                if (!tripped) {
                    payload.isPrivate = false;
                }
            }, 100);
        }
    }

    const safariPrivateTest = () => {
        let w = window;
        if (w.navigator.maxTouchPoints !== undefined) {
            if (w['safari' as keyof typeof w] !== undefined && w.DeviceMotionEvent === undefined) {
                payload.browserName = 'Safari for macOS';
                macOS_safari14();
            } else if (w.DeviceMotionEvent !== undefined) {
                payload.browserName = 'Safari for iOS';
                iOS_safari14();
            }
        } else {
            oldSafariTest();
        }
    }
    const assertEvalToString = (value:number):boolean => {
        return value === eval.toString().length;
    };

    const isSafari = () => {
        return lowerVendor !== '' && lowerVendor.indexOf('Apple') === 0 && assertEvalToString(37);
    }

    const isChrome = () => {
        return lowerVendor !== '' && lowerVendor.indexOf('Google') === 0 && assertEvalToString(33);
    }

    const isFirefox = () => {
        return lowerName.includes('firefox')
    }

    const isMSIE = () => {
        return !!_get(window.document, 'documentMod');
    }

    const lowerName = device?.name?.toLowerCase() || '';
    const lowerVendor = device?.vendor?.toLowerCase() || '';

    if(isChrome()){
        payload.browserName = 'Chrome';
        chromePrivateTest()
    } else if(isSafari()){
        safariPrivateTest()
    } else if(isFirefox()){
        payload.browserName = 'Firefox';
        payload.isPrivate = window.navigator.serviceWorker === undefined;
    } else if(isMSIE()){
        payload.browserName = 'Internet Explorer';
        payload.isPrivate = window.indexedDB === undefined;
    }
    return payload;
};
