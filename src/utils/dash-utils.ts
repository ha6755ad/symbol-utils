import { get, set, omit, flat, isEmpty, isEqual, pick } from 'radash';

type PathTypes = string|(string|number)[];
const stringifyPath = (path:PathTypes):string => {
    let p = path;
    if(Array.isArray(path)) p = path.map(a => typeof a === 'number' ? `[${a}]` : a).join('.');
    return p as string;
};

export const _get = <T, K>(value: T, path:PathTypes, defaultValue?: K|null):K|null => {
    return get(value, stringifyPath(path), defaultValue);
};

export const _set = <T extends object, K>(initial:T, path:PathTypes, insert:K):T => {
    return set(initial, stringifyPath(path), insert);
};

export const _unset = <T>(obj: T, path: string|string[]):T => {
    if(!obj) return obj;
    const p = Array.isArray(path) ? path : [path];
    return omit(obj, p as never[]);
};

export const _pick = pick;

export const _isnil = (check:any):boolean => {
    return check === null || typeof check === 'undefined';
};
export const _isPlainObject = (check:any) => {
    const isObjectLike = check != null && typeof check == 'object';

};

type One<T> = readonly T[];
type Two<T> = readonly T[][];
type Three<T> = readonly T[][][];
type Four<T> = readonly T[][][][];
type Five<T> = readonly T[][][][][];
export type FlatItem<T> =  One<T>|Two<T>|(One<T>|Two<T>)[]|Three<T>|(One<T>|Two<T>|Three<T>)[]|Four<T>|Five<T>;
export const _flattendeep = <T>(lists:FlatItem<T>):T[] => {
    return lists.flat(5) as T[];
};
export const _flatten = flat;
export const _isequal = isEqual;
export const _isempty = isEmpty;

