import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export function WatchFlags(): Observable<XMLHttpRequest> {
    return WatchRequests().pipe(filter(request => !!(/flags\/posts\/\d+\/add\/[a-zA-Z]+/.exec(request.responseURL))));
}

export function WatchRequests(): Observable<XMLHttpRequest> {
    const obs = new Subject<XMLHttpRequest>();
    addXHRListener((xhr) => {
        obs.next(xhr);
    });
    return obs;
}

// Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
let initialized = false;
const callbacks: ((request: XMLHttpRequest) => void)[] = [];
function addXHRListener(callback: (request: XMLHttpRequest) => void) {
    callbacks.push(callback);
    if (initialized) {
        return;
    }
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);
        open.apply(this, arguments);
    };
    initialized = true;
}
