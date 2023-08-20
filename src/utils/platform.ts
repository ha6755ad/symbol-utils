import {UAParser} from "ua-parser-js";
export type DeviceObj = {
    name: string,
    manufacturer?: string,
    product: string,
    osName: string,
    screenWidth?: number,
    touch?: boolean,
    incognito?: boolean,
    vendor?:string,
    type?:string
};

type PlatformOptions = {
    log?: boolean
}

export const isTouch = (): boolean => {
    return window.matchMedia('(any-pointer: coarse)').matches
};

export const getPlatform = (userAgentString?:string|undefined|null, options?:PlatformOptions):DeviceObj => {
    const { log } = options || {};
    if(log) console.log('getting platform');
    const parser = new UAParser();
    if(userAgentString) parser.setUA(userAgentString);
    const p = parser.getResult();
    const {browser, device: { model, vendor, type }, os: {name}} = p;
    const screenWidth = screen.width;
    const touch = isTouch();
    return {
        name:browser.name || '',
        manufacturer:vendor,
        vendor,
        type,
        product:model || '',
        osName: name || '',
        screenWidth,
        touch
    };
};
