import axios from 'axios';
import {_get} from './dash-utils';
import {detectIncognito} from './incognito';
export * from './domain-handler';
import {UAParser} from 'ua-parser-js';

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

export const isTouch = (): boolean => {
    return window.matchMedia('(any-pointer: coarse)').matches
};

export const returnIp = async () => {
    return await axios.get('https://api.ipify.org/?format=json')
        .catch((err:object|string) => {
            console.error(`Error with IP fetch: ${_get(err, 'message', err)}`)
        })
    // Convert key-value pairs to JSON
    // https://stackoverflow.com/a/39284735/452587
}

type PlatformOptions = {
    log?: boolean
}

export const getPlatform = (userAgentString?:string, options?:PlatformOptions):DeviceObj => {
    const { log } = options || {};
    if(log) console.log('getting platform');
    const parser = new UAParser();
    if(log) console.log('ua parser', parser, userAgentString);
    if(userAgentString) parser.setUA(userAgentString);
    const p = parser.getResult();
    if(log) console.log('got parser result', p);
    const {browser, device: { model, vendor, type }, os: {name}} = p;
    if(log) console.log('device', model, vendor, type);
    const screenWidth = screen.width;
    const touch = isTouch();
    if(log) console.log('is touch? ', touch);
    const {isPrivate} = detectIncognito();
    if(log) console.log('is incognito?', isPrivate);
    return {
        name:browser.name || '',
        manufacturer:vendor,
        vendor,
        type,
        product:model || '',
        osName: name || '',
        screenWidth,
        touch,
        incognito:isPrivate
    };
};

export const readDeviceString = (deviceString:string):DeviceObj => {
    const arr = deviceString.split('/');
    const name = arr[0];
    const osName = arr[1];
    const manufacturer = arr[2] ? arr[2] : '';
    const product = arr[3];
    const type = arr[4];
    const incognito = !!arr[5];
    return {name, osName, manufacturer, product, incognito, type, touch: product.indexOf('computer') === -1};
};


export const getDeviceDetails = (deviceString?: string | null, options?:PlatformOptions):DeviceObj => {
    const { log } = options || {};
    if(log) console.log('get device details', deviceString);
    if (deviceString) return readDeviceString(deviceString);
    else return getPlatform(undefined, options);
};

export const deviceString = async (device?: DeviceObj | null) => {
    const d = device ? device : getDeviceDetails();
    const mfr = d.manufacturer ? d.manufacturer : ''
    const product = d.product ? d.product : d.touch ? 'touch-screen' : 'computer';
    const type = d.type ? d.type : '';
    // return `${d.name}/${d.osName}/${mfr}/${product}${d.incognito ? '/incognito' : ''}`
    return `${d.name}/${d.osName}/${mfr}/${product}/${type}${d.incognito ? '/incognito' : ''}`
};


export const returnIpString = async ():Promise<string> => {
    return _get(await returnIp(), ['data', 'ip'], '') as string;
};
