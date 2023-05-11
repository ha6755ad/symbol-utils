/**
 *
 * detectIncognito v22.01.x - (c) 2022 Joe Rutkowski <Joe@dreggle.com> (https://github.com/Joe12387/detectIncognito)
 *
 * Incognito & Private Browsing detection
 *
 * Support: Safari for iOS   -- 8 to 15
 *          Safari for macOS <= 15
 *          Chrome/Chromium  -- 50 to 96
 *          Edge             -- 15 - 18; 79 to 96
 *          Firefox          -- 44 to 95
 *          MSIE             >= 10
 *
 **/
import {_get} from "./dash-utils";

export const detectIncognito = (): { isPrivate:boolean, browserName:string } => {
  let payload = {
    isPrivate: false,
    browserName: 'Unknown'
  };

  function identifyChromium() {
    let ua = navigator.userAgent;
    //TODO: test opera and brave;
    if (ua.match(/Chrome/)) {
      if (ua.match(/Edg/)) {
        return 'Edge';
      } else if (_get(navigator, 'brave') !== undefined) {
        return 'Brave';
      } else if (_get(navigator, 'opr') !== undefined) {
        return 'Opera';
      }
      return 'Chrome';
    } else {
      return 'Chromium';
    }
  }

  function assertEvalToString(value:number):boolean {
    return value === eval.toString().length;
  }

  function isSafari() {
    let v = navigator.vendor;
    return v !== undefined && v.indexOf('Apple') === 0 && assertEvalToString(37);
  }

  function isChrome() {
    let v = navigator.vendor;
    return v !== undefined && v.indexOf('Google') === 0 && assertEvalToString(33);
  }

  function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  }

  function isMSIE() {
    return !!_get(window.document, 'documentMod');
  }

  /**
   * Safari (Safari for iOS & macOS)
   **/

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

  function oldSafariTest() {
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

  function safariPrivateTest() {
    let w = window;
    if (navigator.maxTouchPoints !== undefined) {
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

  /**
   * Chrome
   **/

  function getQuotaLimit() {
    const performance = window.performance;
    const memory = performance ? performance['memory' as keyof typeof performance] : null;
    const jsHeapSizeLimit = memory ? memory['jsHeapSizeLimit' as keyof typeof memory] : null;
    if (jsHeapSizeLimit) {
      return jsHeapSizeLimit;
    } else return 1073741824;
  }

  // >= 76
  function storageQuotaChromePrivateTest() {
    const webkitTemporaryStorage = navigator['webkitTemporaryStorage' as keyof typeof navigator];
    const queryUsageAndQuota = webkitTemporaryStorage ? webkitTemporaryStorage['queryUsageAndQuota' as keyof typeof webkitTemporaryStorage] : (fn1:(usage:number, quota:number) => void, fn2:(e:string) => void) => console.error('detectIncognito error traversing webkit temporary storage usage and quota', fn1, fn2);
    queryUsageAndQuota(
      function (usage, quota) {
        payload.isPrivate = (quota < getQuotaLimit());
      },
      function (e) {
        throw new Error('detectIncognito somehow failed to query storage quota: ' + e['message' as keyof typeof e]);
      }
    );
  }

  // 50 to 75
  function oldChromePrivateTest() {
    let fs = window['webkitRequestFileSystem' as keyof typeof window];
    let success = function () {
      payload.isPrivate = false;
    };
    let error = function () {
      payload.isPrivate = true;
    };
    fs(0, 1, success, error);
  }

  function chromePrivateTest() {
    if (Promise !== undefined && Promise.allSettled !== undefined) {
      storageQuotaChromePrivateTest();
    } else {
      oldChromePrivateTest();
    }
  }

  /**
   * Firefox
   **/

  function firefoxPrivateTest() {
    payload.isPrivate = navigator.serviceWorker === undefined;
  }

  /**
   * MSIE
   **/

  function msiePrivateTest() {
    payload.isPrivate = window.indexedDB === undefined;
  }

  if (isSafari()) {
    safariPrivateTest();
  } else if (isChrome()) {
    payload.browserName = identifyChromium();
    chromePrivateTest();
  } else if (isFirefox()) {
    payload.browserName = 'Firefox';
    firefoxPrivateTest();
  } else if (isMSIE()) {
    payload.browserName = 'Internet Explorer';
    msiePrivateTest();
  }

  return payload;

};
