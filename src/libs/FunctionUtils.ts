export function Delay(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}

export function GroupBy<T>(collection: T[], propertyGetter: (item: T) => any) {
    return collection.reduce((previousValue: any, currentItem: T) => {
        (previousValue[propertyGetter(currentItem)] = previousValue[propertyGetter(currentItem)] || []).push(currentItem);
        return previousValue;
    }, {});
}

export function GetMembers(item: any): string[] {
    const members = [];
    for (const key in item) {
        if (item.hasOwnProperty(key)) {
            members.push(key);
        }
    }
    return members;
}

export function IsStackOverflow() {
    return window.location.href.match(/^https:\/\/stackoverflow.com/);
}
