import { Spinner } from '@userscripters/stacks-helpers';
import Post from './Post';

export interface ProgressItemActions {
    completed: () => void;
    failed: (reason?: string) => void;
    addSubItem: (text: string) => ProgressItemActions;
}

export class Progress {
    private readonly element: HTMLElement;

    constructor(private readonly controller?: HTMLElement | null) {
        this.element = this.getPopover();
    }

    public attach(): void {
        if (!this.controller) return;

        Stacks.attachPopover(this.controller, this.element, {
            autoShow: true,
            placement: 'bottom-start',
            toggleOnClick: true
        });

        // hide popover, so that it is not shown when it is empty
        this.element.style.display = 'none';
    }

    public updateLocation(): void {
        const controller = document.querySelector<HTMLElement>(
            '.s-spinner[aria-controls="advanced-flagging-progress-popover"]'
        );
        if (!controller) return;

        Stacks.hidePopover(controller);
        Stacks.showPopover(controller);
    }

    public delete(): void {
        if (this.controller) {
            Stacks.detachPopover(this.controller);
        }

        this.element.remove();
    }

    public addItem(text: string): ProgressItemActions {
        // if there is at least one item, show the popover
        this.element.style.display = '';

        const flexItem = this.createItem(text);
        const wrapper = flexItem.firstElementChild as HTMLElement;

        this.element.lastElementChild?.append(flexItem);

        return {
            completed: () => this.completed(wrapper),
            failed: (reason?: string) => this.failed(wrapper, reason),
            addSubItem: (text: string) => this.addSubItem(flexItem, text),
        };
    }

    private createItem(text: string): HTMLElement {
        const flexItem = document.createElement('div');
        flexItem.classList.add('flex--item');

        const wrapper = document.createElement('div');
        wrapper.classList.add('d-flex', 'g8', 'fd-row');

        const action = document.createElement('div');
        action.classList.add('flex--item');
        action.textContent = text;

        const spinner = Spinner.makeSpinner({
            size: 'sm',
            classes: [ 'flex--item' ]
        });

        wrapper.append(spinner, action);
        flexItem.append(wrapper);

        return flexItem;
    }

    private completed(wrapper: HTMLElement): void {
        const done = document.createElement('div');
        done.classList.add('flex--item', 'fc-green-500', 'fw-bold');
        done.textContent = 'done!';

        const tick = Post.getActionIcons()[0];
        tick.style.display = 'block';

        wrapper.querySelector('.s-spinner')?.remove();
        wrapper.prepend(tick);
        wrapper.append(done);
    }

    private failed(wrapper: HTMLElement, reason?: string): void {
        const failed = document.createElement('div');
        failed.classList.add('flex--item', 'fc-red-500', 'fw-bold');
        failed.textContent = `failed${reason ? `: ${reason}` : '!'}`;

        const cross = Post.getActionIcons()[1];
        cross.style.display = 'block';

        wrapper.querySelector('.s-spinner')?.remove();
        wrapper.prepend(cross);
        wrapper.append(failed);
    }

    private addSubItem(div: HTMLElement, text: string): ProgressItemActions {
        const parent = this.createItem(text);
        parent.classList.add('ml24', 'mt4');
        parent.classList.remove('flex--item');

        div.append(parent);

        const wrapper = parent.firstElementChild as HTMLElement;

        return {
            completed: () => this.completed(wrapper),
            failed: (reason?: string) => this.failed(wrapper, reason),
            addSubItem: (text: string) => this.addSubItem(parent, text),
        };
    }

    private getPopover(): HTMLDivElement {
        const popover = document.createElement('div');
        popover.classList.add('s-popover', 'wmn4');
        popover.id = 'advanced-flagging-progress-popover';

        const arrow = document.createElement('div');
        arrow.classList.add('s-popover--arrow');

        const wrapper = document.createElement('div');
        wrapper.classList.add('d-flex', 'g8', 'fd-column');

        popover.append(arrow, wrapper);

        return popover;
    }
}
