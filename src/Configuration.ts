import {
    Store,
    Cached,
    CachedCategory,
    CachedFlag
} from './UserscriptTools/Store';
import { Flags, flagCategories } from './FlagTypes';

import { FlagNames, displayStacksToast, getFlagTypeFromFlagId } from './shared';

import { buildConfigurationOverlay } from './modals/config';
import { setupCommentsAndFlagsModal } from './modals/comments/main';

export function isSpecialFlag(flagName: Flags, checkNoFlag = true): boolean {
    const arrayOfFlags: Flags[] = [
        FlagNames.ModFlag,
        FlagNames.Plagiarism
    ];

    if (checkNoFlag) {
        arrayOfFlags.push(FlagNames.NoFlag);
    }

    return arrayOfFlags.includes(flagName);
}

export function wrapInFlexItem(element: HTMLElement): HTMLElement {
    const flexItem = document.createElement('div');
    flexItem.classList.add('flex--item');
    flexItem.append(element);

    return flexItem;
}

export function cacheFlags(): void {
    const flagTypesToCache = flagCategories.flatMap(category => {
        return category.FlagTypes.map(flagType => {
            return Object.assign(flagType, {
                belongsTo: category.name,
                downvote: !isSpecialFlag(flagType.reportType),
                enabled: true // all flags should be enabled by default
            });
        });
    }) as CachedFlag[];

    // save new object in cache
    Store.set<CachedFlag[]>(Cached.FlagTypes, flagTypesToCache);

    // also update the variable to prevent breaking the config modal
    Store.flagTypes.push(...flagTypesToCache);
}

function cacheCategories(): void {
    // cache default categories
    const categories = flagCategories
        .map(category => (
            {
                isDangerous: category.isDangerous,
                name: category.name,
                appliesTo: category.appliesTo,
                id: category.id
            } as CachedCategory
        ));

    Store.set<CachedCategory[]>(Cached.FlagCategories, categories);

    Store.categories.push(...categories);
}

function setupDefaults(): void {
    // if there's no downvote property, then the user
    // is probably using an older version of AF
    // clear and re-save
    if (!Store.flagTypes.length || !('downvote' in Store.flagTypes[0])) {
        cacheFlags();
    }

    if (!Store.categories.length || !('id' in Store.categories[0])) {
        cacheCategories();

        // update default link-only comment!
        const linkOnly = getFlagTypeFromFlagId(6);
        const defaultComment = flagCategories[2].FlagTypes[0].comments?.low;
        if (linkOnly // link only flag type has not been removed
            && defaultComment
            && linkOnly.comments?.low.includes('target page is unavailable') // using old comment
        ) {
            linkOnly.comments.low = defaultComment;
            Store.updateFlagTypes();
        }
    }

    // PostOther can be replaced with PlagiarizedContent
    // for "Plagiarism" flag type.
    Store.flagTypes.forEach(cachedFlag => {
        // Plagiarism and Bad Attribution flag types,
        // filter by id because names can be edited by the user
        if (cachedFlag.id !== 3 && cachedFlag.id !== 5) return;

        cachedFlag.reportType = FlagNames.Plagiarism;
    });
    Store.updateFlagTypes();

    // new option
    if (!(Cached.Configuration.allowComments in Store.config)) {
        Store.config.allowComments = false;

        Store.updateConfiguration();
    }

    // "defaultNo" format is deprecated
    if ('defaultNoSmokey' in Store.config) {
        // @ts-expect-error errors due to change in the config type for older versions
        Store.config.default = {};
        // [old, new]
        ([
            [ 'defaultNoComment', 'comment' ],
            [ 'defaultNoFlag', 'flag' ],
            [ 'defaultNoDownvote', 'downvote' ],
            [ 'defaultNoSmokey', 'smokey' ],
            [ 'defaultNoNatty', 'natty' ],
            [ 'defaultNoGuttenberg', 'guttenberg' ],
            [ 'defaultNoGenericBot', 'genericbot' ],
            [ 'defaultNoDelete', 'delete' ],
        ] as const).forEach(([ oldName, newName ]) => {
            // @ts-expect-error for the same reason as above
            Store.config.default[newName] = !Store.config[oldName];
            // @ts-expect-error for the same reason as above
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete Store.config[oldName];
        });

        Store.updateConfiguration();
    }

    // https://meta.stackoverflow.com/a/434697
    Store.flagTypes
        // @ts-expect-error VLQ flag is removed, see the link above
        .filter(({ reportType }) => reportType === 'PostLowQuality')
        .forEach(flagType => {
            flagType.reportType = FlagNames.NAA;
        });

    Store.updateFlagTypes();
}

export function setupConfiguration(): void {
    setupDefaults(); // stores default values if they aren't there
    buildConfigurationOverlay(); // the configuration modal
    setupCommentsAndFlagsModal(); // the comments & flags modal

    const configModal = document.querySelector('#advanced-flagging-configuration-modal') as HTMLElement;
    const commentsModal = document.querySelector('#advanced-flagging-comments-modal') as HTMLElement;

    // append the buttons that toggle the modals to the site footer
    const bottomBox = document.querySelector('.site-footer--copyright > ul.-list');

    const configDiv = document.createElement('div');
    configDiv.classList.add('ta-left', 'pt6');

    const configLink = document.createElement('a');
    configLink.innerText = 'Advanced Flagging configuration';
    configLink.addEventListener('click', () => Stacks.showModal(configModal));

    configDiv.append(configLink);

    const commentsDiv = configDiv.cloneNode() as HTMLElement;

    const commentsLink = document.createElement('a');
    commentsLink.innerText = 'Advanced Flagging: edit comments and flags';
    commentsLink.addEventListener('click', () => Stacks.showModal(commentsModal));

    commentsDiv.append(commentsLink);

    bottomBox?.after(configDiv, commentsDiv);

    // TODO switch to Object.hasOwn() when available

    // if the user hasn't set up the config
    // or is using an older version of AF,
    // prompt to submit
    const propertyDoesNotExist = !Object.prototype.hasOwnProperty.call(
        Store.config,
        Cached.Configuration.addAuthorName
    );

    if (!propertyDoesNotExist) return;

    displayStacksToast(
        'Please set up Advanced Flagging before continuing.',
        'info',
        true
    );

    setTimeout(() => Stacks.showModal(configModal));
}
