type MenuFn = (position: Position, e: MouseEvent) => void;
type Position = {
    id: string,
    el: HTMLElement | null,
    rect: DOMRect | null
};

type Positions = { [key: string]: Position }
type ContextMenuOptions = {
    log?: boolean,
    delay?: number
}

export class ContextMenu {

    id: string | string[] = '';
    log: boolean | undefined = false;
    delay: number = 250;
    prefix = 'Cm_';
    positions: Positions | undefined = {};
    menuFn: MenuFn = (position, e) => console.log('No context menu function detected');
    listener: (e: MouseEvent) => void = e => console.log('No listener fn added');

    constructor(id: string | string[], menuFn: MenuFn, prefix = 'Cm_', options?: ContextMenuOptions) {
        this.log = options?.log;
        if (options?.delay) this.delay = options.delay;
        this.id = id;
        this.prefix = prefix;
        setTimeout(() => {
            if (id instanceof Array) {
                id.map(a => this.makeRect(a));
            } else this.makeRect(id);

            this.cancel();
            this.listener = this.addListener(this.positions as Positions, menuFn);
            document.addEventListener('contextmenu', this.listener, false);
        }, this.delay);
    };

    makeRect(id: string, tries = 0): void {
        const el = document.getElementById(`${this.prefix}${id}`);
        if (this.log) console.log('setup element boundary: ', `found element for id ${this.prefix}${id}? ${!!el}`);
        if (el) {
            if (!this.positions) this.positions = {};
            this.positions[id as keyof Position] = {
                el,
                id,
                rect: el.getBoundingClientRect()
            }
        } else if (tries < 10) {
            setTimeout(() => {
                this.makeRect(id, tries + 1);
            }, 50)
        }
    }


    addListener(positions: Positions, menuFn: MenuFn): (evt: MouseEvent) => void {
        const isInRect = (id: string, xy: number[]) => {
            const [x, y] = xy;
            const {left, top, bottom, right} = (positions[id as keyof Positions]?.rect) as DOMRect;
            const isIn = x >= left && x <= right && y >= top && y <= bottom;
            if (this.log) console.log(`Is ${id} in? ${isIn} - element position: left: ${left}, top: ${top}, bottom: ${bottom}, right: ${right}`);
            return isIn;
        };
        return (e: MouseEvent) => {
            if (this.log) console.log(`heard context menu click - checking positions: matching click x,y ${e.clientX}, ${e.clientY} - all positions listed here`, positions);
            if (positions) {
                const list = Object.keys(positions);
                for (let i = 0; i < list.length;) {
                    const inElement = isInRect(list[i], [e.clientX, e.clientY]);
                    if (inElement) {
                        e.preventDefault();
                        menuFn(positions[list[i]], e);
                        return;
                    } else i++;
                }

            }
        };

    }

    cancel() {
        document.removeEventListener('contextmenu', this.listener, false);
    }
}
