
import { ref, Ref  } from 'vue';
import { _get, _set, _unset } from './dash-utils.js';

type AnyObj = {
    [key: string]: unknown
};

export type UndoRedoOptions = {
    defs?:AnyObj,
    max?:number,
    conditions?:boolean
};

export const undoRedo = (config:UndoRedoOptions = {}) => {
    const conditions = config?.conditions || true;
    const form:Ref<AnyObj> = ref({})
    const history:Ref<Array<AnyObj>> = ref([]);
    let index = 0;
    let max = 50;
    let changed = false;

    if(config?.defs) form.value = config.defs;

    if(config?.max) max = config.max;

    const nestSet = (path: string, args: any, unset?: boolean) => {
        if (path) {
            const arr: string[] = path.split('.');
            if (arr.length === 1) {
                if (!unset) form.value[path] = args;
                else {
                    delete form.value[path];
                }
            } else {
                let ov: any = _get(form.value, [arr[0]]);
                ov = !unset ? _set(ov, arr.slice(1), args) : _unset(ov, arr.slice(1));
                form.value[arr[0]] = ov;
            }
        }
    }
    const change = (val:any, key?:string, unset?:boolean) => {
        if(changed) history.value.unshift(Object.assign({}, form.value));
        else history.value = [Object.assign({}, form.value)];
        changed = true;
        if(key) nestSet(key, val, unset);
        else form.value = Object.assign({}, val);
        history.value = [Object.assign({}, form.value), ...history.value].slice(0, max - 1);
    };

    const remove = (key:string):void => {
        if(changed) history.value.unshift(Object.assign({}, form.value));
        else history.value = [Object.assign({}, form.value)];
        changed = true;
        delete form.value[key];
    };

    const undo = () => {
        if(conditions && index < Math.min(max - 1, history.value.length -1)){
            index++;
            form.value = Object.assign({}, history.value[index]);
        }
    }

    const redo = () => {
        if(conditions && index > 0){
            index--;
            form.value = Object.assign({}, history.value[index]);
        }
    }

    const keyDown = (e:KeyboardEvent) => {
        if(conditions && e.key === 'z'){
            if(e.metaKey || e.ctrlKey){
                if(e.shiftKey) redo();
                else undo();
            }
        }
    }
    window.addEventListener('keydown', keyDown);
    return {
        undo,
        redo,
        change,
        nestSet,
        form,
        index,
        history,
        remove
    }
}
