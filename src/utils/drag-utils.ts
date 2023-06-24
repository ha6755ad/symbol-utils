import { _set } from './dash-utils';

declare type Position = number

export interface MovePositions {
    startX?: Position,
    startY?: Position,
    xDirection?: string,
    yDirection?: string,
    moveX?: Position,
    moveY?: Position,
    lastX?: Position,
    lastY?: Position,
    left?: Position,
    top?: Position,
    rect?: { top: Position, bottom: Position, left: Position, right: Position }
}

export interface MoveControls {
    touchHold?: number | boolean,
    drop?: string | boolean | undefined,
    moving?: boolean,
    isTouch?: boolean,
    touch?: boolean,
    touchAddCount?: number,
    debounceCount?: number,
    reset?: boolean
}

declare interface eventHandlerOptions {
    fn: (evt:string, ...args:Array<any>) => void|Promise<void>,
    events: string[] | string
}

export interface StartOptions {
    ids?: string[],
    prefixes?: string[],
    lag?: number,
    log?: boolean,
    el?: HTMLElement | null,
    eventHandler?: eventHandlerOptions,
}


export type PanOptions = {
    touch: boolean,
    mouse: boolean,
    position: {
        top: number,
        left: number
    },
    direction: string,
    isFirst: boolean,
    isFinal: boolean,
    duration: number,
    distance: {
        x: number,
        y: number
    },
    offset: {
        x: number,
        y: number
    },
    delta: {
        x: number,
        y: number
    }
}

type AnyObj = { [key:string]: any }

export const PanDefault = (adders?: PanOptions): PanOptions => {
    return {
        touch: false,
        mouse: true,
        position: {
            top: 0,
            left: 0
        },
        direction: 'up',
        isFirst: false,
        isFinal: false,
        duration: 0,
        distance: {
            x: 0,
            y: 0
        },
        offset: {
            x: 0,
            y: 0
        },
        delta: {
            x: 0,
            y: 0
        },
        ...adders
    }
};

// type EventNames = {
//     down?: string,
//     up?: string,
//     move?: string
// };

// const DefaultEventNames = (adders?: EventNames) => {
//     return {
//         down: 'pointerdown', up: 'pointerup', move: 'pointermove',
//         ...adders || {}
//     }
// }

export class DragTracker {

    log = false;
    el: HTMLElement | undefined | null = undefined;
    eventHandler: eventHandlerOptions | undefined = undefined;
    panData: PanOptions = PanDefault();
    prefixes: string[] = [''];
    idObj: {[key:string]: any} = {};
    lag = 15;
    overlapIds: string[] = [];
    moveId = '';
    startLeft: Position = 0;
    startTop: Position = 0;
    overlap = false;
    reset = true;
    moveX = 0;
    moveY = 0;
    left = 0;
    top = 0;

    constructor(pan:PanOptions, options?: StartOptions) {
        if (options?.prefixes){
            this.prefixes = options.prefixes;
            this.overlap = true;
        }
        if(options) Object.keys(options).forEach(key => {
            _set(this, key, options[key as keyof StartOptions]);
        });

        if (this.prefixes) {
            this.prefixes.map(a => this.addIdBasedRects(a));
        }
        this.panData = PanDefault(pan);
        this.pan(this.panData);
    }

    addToObj(el:Element) {
        if (el?.id) {
            this.idObj[el.id] = {el, rect: el.getBoundingClientRect()};
        }
    };

    addIdBasedRects(prefix:string) {
        if(prefix) {
            const elementList = document.querySelectorAll(`[id^=${prefix}]`);
            if (elementList) {
                this.idObj = {};
                elementList.forEach(a => this.addToObj(a));
            }
        } else console.log('no prefix provided to drag utils');
    }

    options = {log: this.log, el: this.el, eventHandler: this.eventHandler};

    handleEvents(evt:string, payload:any) {
        if (this.eventHandler) {
            const isListed = this.eventHandler.events instanceof Array ? this.eventHandler.events.includes(evt) : this.eventHandler.events === evt;
            if (isListed) this.eventHandler.fn(evt, payload);
        }
    };

    isInRect(xy:Array<number>, rect:AnyObj) {
        const [x, y] = xy;
        const {left, top, right, bottom} = rect;
        return (x >= left && x <= right && y >= top && y <= bottom);
    }

    setOverlapIds(x:number, y:number) {
        this.overlapIds = Object.keys(this.idObj).filter(key => key !== this.moveId).filter((key) => {
            const value = this.idObj[key];
            return this.isInRect([x, y], value.rect);
        });
        this.handleEvents('overlap', this.overlapIds);
    };

    setMoveId(x:number, y:number) {
        this.prefixes.map(a => this.addIdBasedRects(a));
        const idArr = Object.entries(this.idObj);
        for (let i = 0; i < idArr.length;) {
            const value = idArr[i][1];
            const inRect = this.isInRect([x, y], value.rect);
            if (inRect) {
                this.moveId = idArr[i][0];
                this.el = document.getElementById(this.moveId);
                if(this.log) console.log('set move id: ', this.moveId, this.el);
                this.moveX = this.panData.position.left;
                this.moveY = this.panData.position.top;
                this.startLeft = this.el?.offsetLeft || 0;
                this.startTop = this.el?.offsetTop || 0;
                this.handleEvents('touch', this.moveId);
                i = 10000000;
                return;
            } else i++;
        }
    }

    pan(panData:PanOptions) {
        this.panData = panData;
        if (panData.isFirst) {
            this.setMoveId(panData.position.left, panData.position.top);
        }
        if (this.moveId) {
            // this.ids.map(a => this.addIdBasedRects(a));
            if(this.overlap && (panData.distance.x + panData.distance.y > this.lag)) this.setOverlapIds(panData.position.left, panData.position.top);
            if (this.el) {
                if(this.log) console.log('moving el: ', this.moveId);
                const pX = panData.position.left;
                const pY = panData.position.top;
                if(pX > 0) this.left = this.startLeft + pX - this.moveX;
                if(pY > 0) this.top = this.startTop + pY - this.moveY;
                // this.left = this.startLeft + panData.distance.x;
                // this.top = this.startTop + panData.distance.y;
                Object.assign(this.el.style, {
                    left: this.left + 'px',
                    top: this.top + 'px'
                });
            } else throw new Error(`No element detected for id ${this.moveId}`)
        }
        if (panData.isFinal) {
            if(this.log) console.log('finished moving');
            if(this.overlap){
                this.handleEvents('drop', {to: this.overlapIds, from: this.moveId})
            }
            if(this.reset){
                if(this.el) Object.assign(this.el.style, {
                    left: '0px',
                    top: '0px'
                });
            }
            this.handleEvents('touch', '');
            this.moveId = '';

            this.el = undefined;
        }
    }

}

