import axios from 'axios';
import {_get} from './dash-utils';
import {detectIncognito} from './detect-incognito';
export * from './domain-handler';
import { DeviceObj, getPlatform } from './platform';

type DeviceOptions = {
    log?: boolean,
    ua?: string
}

export const returnIp = async () => {
    return await axios.get('https://api.ipify.org/?format=json')
        .catch((err:object|string) => {
            console.error(`Error with IP fetch: ${_get(err, 'message', err)}`)
        })
    // Convert key-value pairs to JSON
    // https://stackoverflow.com/a/39284735/452587
}


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


export const getDeviceDetails = (deviceString?: string | null, options?:DeviceOptions):DeviceObj => {
    const { log } = options || {};
    if(log) console.log('get device details', deviceString);
    if (deviceString) return readDeviceString(deviceString);
    else {
        const platform =  getPlatform(options?.ua, {log});
        const {isPrivate} = detectIncognito({ device: platform });
        if(log) console.log('got platform ?', platform);
        return { ...platform, incognito: isPrivate };
    }
};

export const deviceString = (device?: DeviceObj | null) => {
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
