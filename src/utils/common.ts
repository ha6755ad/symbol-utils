import {_isempty, _flattendeep, _get, FlatItem} from './dash-utils';

export const flatObjKeyList = (obj: object, path?: string): string[] => {
    const list:(string|string[])[] = []
    if (!_isempty(obj)) {
        Object.keys(obj).forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            const getVal = _get(obj, key, '') as any;
            typeof getVal === 'object' && !(getVal instanceof Array) ? flatObjKeyList(getVal, newPath) : newPath;

            list.push(newPath as never);
            if((getVal instanceof Object) && !(getVal instanceof Array)){
                list.push(flatObjKeyList(getVal, newPath) as never);
            }
        });
    }
    return _flattendeep(list as FlatItem<any>);
};

export const dollarString = (val: string | number, symbol: string, dec: number): string => {
    const v = typeof val !== 'number' ? parseFloat(val) : val;
    const decimal = dec || dec === 0 ? dec : 2;
    const valDec = v.toFixed(decimal);
    return (symbol || '') + valDec.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `${symbol}1,`);
};

export const limitStr = (string:string, limit:number, append?:string, prepend?:string) => {
    const apnd = typeof append === 'string' ? append : prepend ? '' : '...';
    const ppnd = prepend ? prepend : ''
    const appendLength = apnd ? JSON.stringify(apnd).length : 0;
    const stringLength = string ? string.length : 0;
    if (limit && stringLength && stringLength > limit) {
        const raw = prepend ? string.split('').slice(Math.max(0, stringLength - (limit - JSON.stringify(ppnd).length))).join('') : string.substring(0, limit - appendLength);
        return ppnd + raw + apnd;
    } else return string;
};
