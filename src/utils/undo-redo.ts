
import { ref, Ref  } from 'vue';

type AnyObj = {
    [key: string]: unknown
};

export type UndoRedoOptions = {
    defs?:AnyObj,
    max?:number,
    conditions?:boolean
};

export const undoRedo = (config:UndoRedoOptions = {}) => {
    const conditions = config && Object.keys(config).length ? config.conditions : true;
    const form:Ref<AnyObj> = ref({})
    const history:Ref<Array<AnyObj>> = ref([]);
    let index = 0;
    let max = 50;
    let changed = false;

    if(config?.defs) form.value = config.defs;

    if(config?.max) max = config.max;

    const change = (val:any, key?:string) => {
        console.log('changing', val, key);
        if(changed) history.value.unshift(Object.assign({}, form.value));
        else history.value = [Object.assign({}, form.value)];
        changed = true;
        if(key) form.value[key] = val;
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
            console.log('undoing', index, history.value);
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
        form,
        index,
        history,
        remove
    }
}
