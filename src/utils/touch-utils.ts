
export type TouchOptions = {
    elList?:HTMLElement[],
    interval?:number,
    hold?:number
}

export class TouchHold {
    interval = 100;
    hold = 200;
    touching:string | null = null;
    held = 0;
    callback:(id?:string) => void = () => console.log('No callback function passed to TouchHold constructor');

    constructor(callback:(id?:string) => void, options?:TouchOptions){
        const { interval = 100, hold = 200 } = options || {};
        this.interval = interval;
        this.hold = hold;
        this.callback = callback;
    }

    stop(){
        this.held = 0;
        this.touching = null;
    }

    count(){
        if(this.held >= this.hold){
            this.callback(this.touching || '');
            this.stop();
        } else setTimeout(() => {
            if(this.touching){
                this.held += this.interval;
                this.count();
            }
        }, this.interval)
    }

    start(id?:string){
        if(id){
            this.touching = id;
            this.count();
        }
    }

}
