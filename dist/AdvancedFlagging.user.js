// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      2.1.3
// @author       Robert Rudman
// @contributor  double-beep
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @exclude      *://chat.stackexchange.com/*
// @exclude      *://chat.meta.stackexchange.com/*
// @exclude      *://chat.stackoverflow.com/*
// @exclude      *://area51.stackexchange.com/*
// @exclude      *://data.stackexchange.com/*
// @exclude      *://stackoverflow.com/c/*
// @exclude      *://winterbash*.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @resource     iconCheckmark https://cdn.sstatic.net/Img/stacks-icons/Checkmark.svg
// @resource     iconClear https://cdn.sstatic.net/Img/stacks-icons/Clear.svg
// @resource     iconEyeOff https://cdn.sstatic.net/Img/stacks-icons/EyeOff.svg
// @resource     iconFlag https://cdn.sstatic.net/Img/stacks-icons/Flag.svg
// @resource     iconPencil https://cdn.sstatic.net/Img/stacks-icons/Pencil.svg
// @resource     iconTrash https://cdn.sstatic.net/Img/stacks-icons/Trash.svg
// @resource     iconPlus https://cdn.sstatic.net/Img/stacks-icons/Plus.svg
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @downloadURL  https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
// @updateURL    https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
// ==/UserScript==
/* globals StackExchange, Stacks, $ */

"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/UserscriptTools/Store.ts
  var Cached = {
    Configuration: {
      key: "Configuration",
      openOnHover: "openOnHover",
      defaultNoFlag: "defaultNoFlag",
      defaultNoComment: "defaultNoComment",
      defaultNoDownvote: "defaultNoDownvote",
      defaultNoDelete: "defaultNoDelete",
      watchFlags: "watchFlags",
      watchQueues: "watchQueues",
      linkDisabled: "linkDisabled",
      addAuthorName: "addAuthorName",
      debug: "debug"
    },
    Fkey: "fkey",
    Metasmoke: {
      userKey: "MetaSmoke.userKey",
      disabled: "MetaSmoke.disabled"
    },
    FlagTypes: "FlagTypes",
    FlagCategories: "FlagCategories"
  };
  var Store = class _Store {
    // cache-related helpers/values
    // Some information from cache is stored on the variables as objects to make editing easier and simpler
    // Each time something is changed in the variables, update* must also be called to save the changes to the cache
    static config = _Store.get(Cached.Configuration.key) ?? {};
    static categories = _Store.get(Cached.FlagCategories) ?? [];
    static flagTypes = _Store.get(Cached.FlagTypes) ?? [];
    static updateConfiguration = () => _Store.set(Cached.Configuration.key, this.config);
    static updateFlagTypes = () => _Store.set(Cached.FlagTypes, this.flagTypes);
    static dryRun = this.config[Cached.Configuration.debug];
    // export const updateCategories = (): void => GreaseMonkeyCache.storeInCache(FlagCategoriesKey, cachedCategories);
    static async getAndCache(cacheKey, getterPromise, expiresAt) {
      const cachedItem = _Store.get(cacheKey);
      if (cachedItem) return cachedItem;
      const result = await getterPromise();
      _Store.set(cacheKey, result, expiresAt);
      return result;
    }
    // There are two kinds of objects that are stored in the cache:
    // - those that expire (only fkey currently)
    // - those that are not
    //
    // The type of those that are expirable is ExpiryingCacheItem.
    // The others are strings or objects.
    // To make TS happy and avoid runtime errors, we need to take into account both cases.
    static get(cacheKey) {
      const cachedItem = GM_getValue(cacheKey);
      if (!cachedItem) return null;
      const isItemExpired = typeof cachedItem === "object" && "Data" in cachedItem && new Date(cachedItem.Expires) < /* @__PURE__ */ new Date();
      if (isItemExpired) return null;
      return typeof cachedItem === "object" && "Data" in cachedItem ? cachedItem.Data : cachedItem;
    }
    static set(cacheKey, item, expiresAt) {
      const jsonObject = expiresAt ? { Expires: expiresAt.getTime(), Data: item } : item;
      GM_setValue(cacheKey, jsonObject);
    }
    static unset(cacheKey) {
      GM_deleteValue(cacheKey);
    }
  };

  // node_modules/@userscripters/stacks-helpers/dist/checkbox.js
  var checkbox_exports = {};
  __export(checkbox_exports, {
    makeStacksCheckboxes: () => makeStacksCheckboxes
  });
  var makeStacksCheckboxes = (checkboxes, options) => {
    return input_exports.makeStacksRadiosOrCheckboxes(checkboxes, "checkbox", options);
  };

  // node_modules/@userscripters/stacks-helpers/dist/input.js
  var input_exports = {};
  __export(input_exports, {
    makeStacksInput: () => makeStacksInput,
    makeStacksRadiosOrCheckboxes: () => makeStacksRadiosOrCheckboxes
  });
  var makeStacksInput = (id, inputOptions = {}, labelOptions) => {
    var _a;
    const { value = "", classes = [], placeholder = "", title, isSearch } = inputOptions;
    const inputParent = document.createElement("div");
    inputParent.classList.add("d-flex", "ps-relative");
    const input = document.createElement("input");
    input.classList.add("s-input", ...classes);
    input.type = "text";
    input.id = input.name = id;
    input.placeholder = placeholder;
    input.value = value;
    if (title)
      input.title = title;
    if (isSearch) {
      input.classList.add("s-input__search");
      const [searchIcon] = icons_exports.makeStacksIcon("iconSearch", "m18 16.5-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z", {
        classes: ["s-input-icon", "s-input-icon__search"],
        width: 18
      });
      inputParent.append(searchIcon);
    }
    inputParent.prepend(input);
    if (labelOptions) {
      (_a = labelOptions.parentClasses || (labelOptions.parentClasses = [])) === null || _a === void 0 ? void 0 : _a.push("flex--item");
      const label = label_exports.makeStacksLabel(id, labelOptions);
      const container = document.createElement("div");
      container.classList.add("d-flex", "gy4", "fd-column");
      container.append(label, inputParent);
      return container;
    }
    return inputParent;
  };
  var makeStacksRadiosOrCheckboxes = (inputs, type, options, withoutFieldset) => {
    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("s-check-group");
    if (options) {
      const { legendText = "", legendDescription = "", horizontal, classes = [] } = options;
      if (horizontal) {
        fieldset.classList.add("s-check-group__horizontal");
      }
      fieldset.classList.add(...classes);
      const legend = document.createElement("legend");
      legend.classList.add("flex--item", "s-label");
      legend.innerText = legendText;
      if (legendDescription) {
        const span = document.createElement("span");
        span.classList.add("ml4", "fw-normal", "fc-light");
        span.innerText = legendDescription;
        legend.append(" ", span);
      }
      fieldset.append(legend);
    }
    const items = inputs.map((inputType) => makeFormContainer(inputType, type));
    if (withoutFieldset) {
      return items;
    } else {
      fieldset.append(...items);
      return [fieldset, ...items];
    }
  };
  var makeFormContainer = (radioCheckbox, type) => {
    const { id, labelConfig, selected = false, disabled = false, name } = radioCheckbox;
    const container = document.createElement("div");
    container.classList.add("s-check-control");
    const input = document.createElement("input");
    input.classList.add(`s-${type}`);
    input.type = type;
    input.id = id;
    input.checked = selected;
    input.disabled = disabled;
    if (name) {
      input.name = name;
    }
    const label = label_exports.makeStacksLabel(id, labelConfig);
    container.append(input, label);
    return container;
  };

  // node_modules/@userscripters/stacks-helpers/dist/label.js
  var label_exports = {};
  __export(label_exports, {
    makeStacksLabel: () => makeStacksLabel
  });
  var makeStacksLabel = (forId, labelOptions) => {
    const { classes = [], parentClasses = [], text, description, statusText, statusType } = labelOptions;
    const labelParent = document.createElement("div");
    labelParent.classList.add(...parentClasses);
    const label = document.createElement("label");
    label.classList.add("s-label", ...classes);
    label.htmlFor = forId;
    label.innerHTML = text;
    if (statusText && statusType) {
      const status = document.createElement("span");
      status.innerHTML = statusText;
      status.classList.add("s-label--status");
      if (statusType !== "optional") {
        status.classList.add(`s-label--status__${statusType}`);
      }
      label.append(" ", status);
    }
    if (description) {
      const p = document.createElement("p");
      p.classList.add("s-description", "mt2");
      p.innerHTML = description;
      label.classList.add("d-block");
      label.append(p);
      labelParent.append(label);
      return labelParent;
    } else {
      label.classList.add("flex--item");
      return label;
    }
  };

  // node_modules/@userscripters/stacks-helpers/dist/links.js
  var links_exports = {};
  __export(links_exports, {
    makeLink: () => makeLink
  });
  var makeLink = (options = {}) => {
    const { href = "", isButton = false, type = "", blockLink = null, text, click, classes = [] } = options;
    const anchor = document.createElement(isButton ? "button" : "a");
    anchor.classList.add("s-link", ...classes);
    anchor.textContent = text;
    if (type) {
      anchor.classList.add(`s-link__${type}`);
    }
    if (blockLink) {
      anchor.classList.add("s-block-link");
      anchor.classList.remove("s-link");
      if (blockLink.border) {
        anchor.classList.add(`s-block-link__${blockLink.border}`);
      }
      if (blockLink.selected) {
        anchor.classList.add("is-selected");
      }
      if (blockLink.danger) {
        anchor.classList.add("s-block-link__danger");
      }
    }
    if (href && anchor instanceof HTMLAnchorElement) {
      anchor.href = href;
    }
    if (click) {
      const { handler, options: options2 } = click;
      anchor.addEventListener("click", handler, options2);
    }
    return anchor;
  };

  // node_modules/@userscripters/stacks-helpers/dist/menus.js
  var menus_exports = {};
  __export(menus_exports, {
    makeMenu: () => makeMenu
  });
  var makeMenu = (options = {}) => {
    const { itemsType = "a", childrenClasses = [], navItems, classes = [] } = options;
    const menu = document.createElement("ul");
    menu.classList.add("s-menu", ...classes);
    menu.setAttribute("role", "menu");
    navItems.forEach((navItem) => {
      var _a;
      const li = document.createElement("li");
      if ("popover" in navItem && navItem.popover) {
        const { position = "auto", html } = navItem.popover;
        Stacks.setTooltipHtml(li, html, {
          placement: position
        });
      }
      if ("separatorType" in navItem) {
        const { separatorType, separatorText } = navItem;
        li.setAttribute("role", "separator");
        li.classList.add(`s-menu--${separatorType}`);
        if (separatorText)
          li.textContent = separatorText;
        menu.append(li);
        return;
      } else if ("checkbox" in navItem) {
        const { checkbox, checkboxOptions } = navItem;
        const [, input] = checkbox_exports.makeStacksCheckboxes([checkbox], checkboxOptions);
        li.append(input);
        menu.append(li);
        return;
      }
      (_a = navItem.classes) === null || _a === void 0 ? void 0 : _a.push(...childrenClasses);
      li.setAttribute("role", "menuitem");
      const item = links_exports.makeLink(Object.assign({
        isButton: itemsType === "button" || navItem.isButton,
        blockLink: {}
      }, navItem));
      li.append(item);
      menu.append(li);
    });
    return menu;
  };

  // node_modules/@userscripters/stacks-helpers/dist/notices.js
  var notices_exports = {};
  __export(notices_exports, {
    makeStacksNotice: () => makeStacksNotice
  });
  var makeStacksNotice = (options) => {
    const { type, important = false, icon, text, classes = [] } = options;
    const notice = document.createElement("aside");
    notice.classList.add("s-notice", ...classes);
    notice.setAttribute("role", important ? "alert" : "status");
    if (type) {
      notice.classList.add(`s-notice__${type}`);
    }
    if (important) {
      notice.classList.add("s-notice__important");
    }
    if (icon) {
      notice.classList.add("d-flex");
      const iconContainer = document.createElement("div");
      iconContainer.classList.add("flex--item", "mr8");
      const [name, path] = icon;
      const [svgIcon] = icons_exports.makeStacksIcon(name, path, { width: 18 });
      iconContainer.append(svgIcon);
      const textContainer = document.createElement("div");
      textContainer.classList.add("flex--item", "lh-lg");
      textContainer.append(text);
      notice.append(iconContainer, textContainer);
    } else {
      const p = document.createElement("p");
      p.classList.add("m0");
      p.append(text);
      notice.append(p);
    }
    return notice;
  };

  // node_modules/@userscripters/stacks-helpers/dist/radio.js
  var radio_exports = {};
  __export(radio_exports, {
    makeStacksRadios: () => makeStacksRadios
  });
  var makeStacksRadios = (radios, groupName, options) => {
    radios.forEach((radio) => {
      radio.name = groupName;
    });
    return input_exports.makeStacksRadiosOrCheckboxes(radios, "radio", options);
  };

  // node_modules/@userscripters/stacks-helpers/dist/select.js
  var select_exports = {};
  __export(select_exports, {
    makeStacksSelect: () => makeStacksSelect,
    toggleValidation: () => toggleValidation
  });
  var makeStacksSelect = (id, items, options = {}, labelOptions) => {
    const { disabled = false, size, validation, classes = [] } = options;
    const container = document.createElement("div");
    container.classList.add("d-flex", "gy4", "fd-column");
    if (labelOptions) {
      (labelOptions.parentClasses || (labelOptions.parentClasses = [])).push("flex--item");
      const label = label_exports.makeStacksLabel(id, labelOptions);
      container.append(label);
    }
    const selectContainer = document.createElement("div");
    selectContainer.classList.add("flex--item", "s-select");
    if (size) {
      selectContainer.classList.add(`s-select__${size}`);
    }
    const select = document.createElement("select");
    select.id = id;
    select.classList.add(...classes);
    if (disabled) {
      container.classList.add("is-disabled");
      select.disabled = true;
    }
    items.forEach((item) => {
      const { value, text, selected = false } = item;
      const option = document.createElement("option");
      option.value = value;
      option.text = text;
      option.selected = selected;
      select.append(option);
    });
    selectContainer.append(select);
    container.append(selectContainer);
    if (validation) {
      toggleValidation(container, validation);
    }
    return container;
  };
  var toggleValidation = (container, state) => {
    var _a, _b;
    container.classList.remove("has-success", "has-warning", "has-error");
    (_a = container.querySelector(".s-input-icon")) === null || _a === void 0 ? void 0 : _a.remove();
    if (!state)
      return;
    container.classList.add(`has-${state}`);
    const [name, path] = icons_exports.validationIcons[state];
    const [icon] = icons_exports.makeStacksIcon(name, path, {
      classes: ["s-input-icon"],
      width: 18
    });
    (_b = container.querySelector(".s-select")) === null || _b === void 0 ? void 0 : _b.append(icon);
  };

  // node_modules/@userscripters/stacks-helpers/dist/spinner.js
  var spinner_exports = {};
  __export(spinner_exports, {
    makeSpinner: () => makeSpinner
  });
  var makeSpinner = (options = {}) => {
    const { size = "", hiddenText = "", classes = [] } = options;
    const spinner = document.createElement("div");
    spinner.classList.add("s-spinner", ...classes);
    if (size) {
      spinner.classList.add(`s-spinner__${size}`);
    }
    if (hiddenText) {
      const hiddenElement = document.createElement("div");
      hiddenElement.classList.add("v-visible-sr");
      hiddenElement.innerText = hiddenText;
      spinner.append(hiddenElement);
    }
    return spinner;
  };

  // node_modules/@userscripters/stacks-helpers/dist/textarea.js
  var textarea_exports = {};
  __export(textarea_exports, {
    makeStacksTextarea: () => makeStacksTextarea,
    toggleValidation: () => toggleValidation2
  });
  var makeStacksTextarea = (id, textareaOptions = {}, labelOptions) => {
    const { value = "", classes = [], placeholder = "", title = "", size, validation } = textareaOptions;
    const textareaParent = document.createElement("div");
    textareaParent.classList.add("d-flex", "fd-column", "gy4", ...classes);
    if (labelOptions) {
      const label = label_exports.makeStacksLabel(id, labelOptions);
      textareaParent.append(label);
    }
    const textarea = document.createElement("textarea");
    textarea.classList.add("flex--item", "s-textarea");
    textarea.id = id;
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.title = title;
    if (size) {
      textarea.classList.add(`s-textarea__${size}`);
    }
    textareaParent.append(textarea);
    if (validation) {
      toggleValidation2(textareaParent, validation);
    }
    return textareaParent;
  };
  var toggleValidation2 = (textareaParent, validation) => {
    var _a, _b;
    textareaParent.classList.remove("has-success", "has-warning", "has-error");
    const oldTextarea = textareaParent.querySelector(".s-textarea");
    if (!validation) {
      (_a = textareaParent.querySelector(".s-input-icon")) === null || _a === void 0 ? void 0 : _a.remove();
      (_b = textareaParent.querySelector(".s-input-message")) === null || _b === void 0 ? void 0 : _b.remove();
      const validationContainer = oldTextarea.parentElement;
      validationContainer === null || validationContainer === void 0 ? void 0 : validationContainer.replaceWith(oldTextarea);
      return;
    }
    const { state, description } = validation;
    textareaParent.classList.add(`has-${state}`);
    const [iconName, iconPath] = icons_exports.validationIcons[state];
    const [icon] = icons_exports.makeStacksIcon(iconName, iconPath, {
      classes: ["s-input-icon"],
      width: 18
    });
    if (oldTextarea.nextElementSibling) {
      oldTextarea.nextElementSibling.replaceWith(icon);
      const inputMessage = textareaParent.querySelector(".s-input-message");
      if (description) {
        if (inputMessage) {
          inputMessage.innerHTML = description;
        } else {
          createAndAppendDescription(description, textareaParent);
        }
      } else if (!description && inputMessage) {
        inputMessage.remove();
      }
    } else {
      const validationContainer = document.createElement("div");
      validationContainer.classList.add("d-flex", "ps-relative");
      validationContainer.append(oldTextarea, icon);
      textareaParent.append(validationContainer);
      if (description) {
        createAndAppendDescription(description, textareaParent);
      }
    }
  };
  var createAndAppendDescription = (description, appendTo) => {
    const message = document.createElement("p");
    message.classList.add("flex--item", "s-input-message");
    message.innerHTML = description;
    appendTo.append(message);
  };

  // node_modules/@userscripters/stacks-helpers/dist/toggle.js
  var toggle_exports = {};
  __export(toggle_exports, {
    makeStacksToggle: () => makeStacksToggle
  });
  var makeStacksToggle = (id, labelOptions, on = false, ...classes) => {
    const container = document.createElement("div");
    container.classList.add("d-flex", "g8", "ai-center", ...classes);
    const label = label_exports.makeStacksLabel(id, labelOptions);
    const toggle = document.createElement("input");
    toggle.id = id;
    toggle.classList.add("s-toggle-switch");
    toggle.type = "checkbox";
    toggle.checked = on;
    container.append(label, toggle);
    return container;
  };

  // node_modules/@userscripters/stacks-helpers/dist/buttons/index.js
  var buttons_exports = {};
  __export(buttons_exports, {
    makeStacksButton: () => makeStacksButton
  });
  var makeStacksButton = (id, text, options = {}) => {
    const { title, type = [], primary = false, loading = false, selected = false, disabled = false, badge, size, iconConfig, click, classes = [] } = options;
    const btn = document.createElement("button");
    if (id !== "") {
      btn.id = id;
    }
    btn.classList.add("s-btn", ...type.map((name) => `s-btn__${name}`), ...classes);
    btn.append(text);
    btn.type = "button";
    btn.setAttribute("role", "button");
    const ariaLabel = title || (text instanceof HTMLElement ? text.textContent || "" : text);
    btn.setAttribute("aria-label", ariaLabel);
    if (primary) {
      btn.classList.add("s-btn__filled");
    }
    if (loading) {
      btn.classList.add("is-loading");
    }
    if (title) {
      btn.title = title;
    }
    if (selected) {
      btn.classList.add("is-selected");
    }
    if (disabled) {
      btn.disabled = true;
    }
    if (badge) {
      const badgeEl = document.createElement("span");
      badgeEl.classList.add("s-btn--badge");
      const badgeNumber = document.createElement("span");
      badgeNumber.classList.add("s-btn--number");
      badgeNumber.textContent = badge.toString();
      badgeEl.append(badgeNumber);
      btn.append(" ", badgeEl);
    }
    if (size) {
      btn.classList.add(`s-btn__${size}`);
    }
    if (iconConfig) {
      btn.classList.add("s-btn__icon");
      const { name, path, width, height } = iconConfig;
      const [icon] = icons_exports.makeStacksIcon(name, path, { width, height });
      btn.prepend(icon, " ");
    }
    if (click) {
      const { handler, options: options2 } = click;
      btn.addEventListener("click", handler, options2);
    }
    return btn;
  };

  // node_modules/@userscripters/stacks-helpers/dist/icons/index.js
  var icons_exports = {};
  __export(icons_exports, {
    makeStacksIcon: () => makeStacksIcon,
    validationIcons: () => validationIcons
  });
  var validationIcons = {
    warning: [
      "iconAlert",
      "M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"
    ],
    error: [
      "iconAlertCircle",
      "M9 17c-4.36 0-8-3.64-8-8 0-4.36 3.64-8 8-8 4.36 0 8 3.64 8 8 0 4.36-3.64 8-8 8ZM8 4v6h2V4H8Zm0 8v2h2v-2H8Z"
    ],
    success: [
      "iconCheckmark",
      "M16 4.41 14.59 3 6 11.59 2.41 8 1 9.41l5 5 10-10Z"
    ]
  };
  var makeStacksIcon = (name, pathConfig, { classes = [], width = 14, height = width } = {}) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.classList.add("svg-icon", name, ...classes);
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", pathConfig);
    svg.append(path);
    return [svg, path];
  };

  // node_modules/@userscripters/stacks-helpers/dist/modals/index.js
  var modals_exports = {};
  __export(modals_exports, {
    makeStacksModal: () => makeStacksModal
  });
  var makeStacksModal = (id, options) => {
    const { classes = [], danger = false, fullscreen = false, celebratory = false, title: { text, id: titleId, classes: titleClasses = [] }, body: { bodyHtml, id: bodyId, classes: bodyClasses = [] }, footer: { buttons, classes: footerClasses = [] } } = options;
    const modal = document.createElement("aside");
    modal.id = id;
    modal.classList.add("s-modal", ...classes);
    modal.setAttribute("role", "dialog");
    modal.setAttribute("data-controller", "s-modal");
    modal.setAttribute("data-s-modal-target", "modal");
    if (danger) {
      modal.classList.add("s-modal__danger");
    }
    if (celebratory) {
      modal.classList.add("s-modal__celebration");
    }
    const dialog = document.createElement("div");
    dialog.classList.add("s-modal--dialog");
    dialog.setAttribute("role", "document");
    if (fullscreen) {
      dialog.classList.add("s-modal__full");
    }
    const header = document.createElement("h1");
    header.classList.add("s-modal--header", ...titleClasses);
    header.append(text);
    if (titleId) {
      header.id = titleId;
      modal.setAttribute("aria-labelledby", titleId);
    }
    const body = document.createElement("p");
    body.classList.add("s-modal--body", ...bodyClasses);
    body.append(bodyHtml);
    if (bodyId) {
      body.id = bodyId;
      modal.setAttribute("aria-describedby", bodyId);
    }
    const footer = document.createElement("div");
    footer.classList.add("d-flex", "gx8", "s-modal--footer", ...footerClasses);
    buttons.forEach((button) => {
      const { element, hideOnClick } = button;
      element.classList.add("flex--item");
      if (hideOnClick) {
        element.setAttribute("data-action", "s-modal#hide");
      }
      footer.append(element);
    });
    const [iconClear] = icons_exports.makeStacksIcon("iconClear", "M15 4.41 13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9 15 4.41Z", { width: 18 });
    const close = document.createElement("button");
    close.classList.add("s-modal--close", "s-btn", "s-btn__muted");
    close.setAttribute("type", "button");
    close.setAttribute("aria-label", "Close");
    close.setAttribute("data-action", "s-modal#hide");
    close.append(iconClear);
    dialog.append(header, body, footer, close);
    modal.append(dialog);
    return modal;
  };

  // src/UserscriptTools/Progress.ts
  var Progress = class {
    constructor(controller) {
      this.controller = controller;
      this.element = this.getPopover();
    }
    element;
    attach() {
      if (!this.controller) return;
      Stacks.attachPopover(this.controller, this.element, {
        autoShow: true,
        placement: "bottom-start",
        toggleOnClick: true
      });
      this.element.style.display = "none";
    }
    updateLocation() {
      const controller = document.querySelector(
        '.s-spinner[aria-controls="advanced-flagging-progress-popover"]'
      );
      if (!controller) return;
      Stacks.hidePopover(controller);
      Stacks.showPopover(controller);
    }
    delete() {
      if (this.controller) {
        Stacks.detachPopover(this.controller);
      }
      this.element.remove();
    }
    addItem(text) {
      this.element.style.display = "";
      const flexItem = this.createItem(text);
      const wrapper = flexItem.firstElementChild;
      this.element.lastElementChild?.append(flexItem);
      return {
        completed: () => this.completed(wrapper),
        failed: (reason) => this.failed(wrapper, reason),
        addSubItem: (text2) => this.addSubItem(flexItem, text2)
      };
    }
    createItem(text) {
      const flexItem = document.createElement("div");
      flexItem.classList.add("flex--item");
      const wrapper = document.createElement("div");
      wrapper.classList.add("d-flex", "g8", "fd-row");
      const action = document.createElement("div");
      action.classList.add("flex--item");
      action.textContent = text;
      const spinner = spinner_exports.makeSpinner({
        size: "sm",
        classes: ["flex--item"]
      });
      wrapper.append(spinner, action);
      flexItem.append(wrapper);
      return flexItem;
    }
    completed(wrapper) {
      const done = document.createElement("div");
      done.classList.add("flex--item", "fc-green-500", "fw-bold");
      done.textContent = "done!";
      const tick = Post.getActionIcons()[0];
      tick.style.display = "block";
      wrapper.querySelector(".s-spinner")?.remove();
      wrapper.prepend(tick);
      wrapper.append(done);
    }
    failed(wrapper, reason) {
      const failed = document.createElement("div");
      failed.classList.add("flex--item", "fc-red-500", "fw-bold");
      failed.textContent = `failed${reason ? `: ${reason}` : "!"}`;
      const cross = Post.getActionIcons()[1];
      cross.style.display = "block";
      wrapper.querySelector(".s-spinner")?.remove();
      wrapper.prepend(cross);
      wrapper.append(failed);
    }
    addSubItem(div, text) {
      const parent = this.createItem(text);
      parent.classList.add("ml24", "mt4");
      parent.classList.remove("flex--item");
      div.append(parent);
      const wrapper = parent.firstElementChild;
      return {
        completed: () => this.completed(wrapper),
        failed: (reason) => this.failed(wrapper, reason),
        addSubItem: (text2) => this.addSubItem(parent, text2)
      };
    }
    getPopover() {
      const popover = document.createElement("div");
      popover.classList.add("s-popover", "wmn4");
      popover.id = "advanced-flagging-progress-popover";
      const arrow = document.createElement("div");
      arrow.classList.add("s-popover--arrow");
      const wrapper = document.createElement("div");
      wrapper.classList.add("d-flex", "g8", "fd-column");
      popover.append(arrow, wrapper);
      return popover;
    }
  };

  // src/shared.ts
  var possibleFeedbacks = {
    Smokey: ["tpu-", "tp-", "fp-", "naa-", ""],
    Natty: ["tp", "fp", "ne", ""],
    Guttenberg: ["tp", "fp", ""],
    "Generic Bot": ["track", ""]
  };
  var username = document.querySelector(
    'a[href^="/users/"] div[title]'
  )?.title ?? "";
  var popupDelay = 4 * 1e3;
  var getIconPath = (name) => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, "text/html");
    const path = parsed.body.querySelector("path");
    return path.getAttribute("d") ?? "";
  };
  var getSvg = (name) => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, "text/html");
    return parsed.body.firstElementChild;
  };
  function displayStacksToast(message, type, dismissable) {
    StackExchange.helpers.showToast(message, {
      type,
      transientTimeout: popupDelay,
      // disallow dismissing the popup if inside modal
      dismissable
      // so that dismissing the toast won't close the modal
      // $parent: addParent ? $(parent) : $()
    });
  }
  function attachPopover(element, text, position = "bottom-start") {
    Stacks.setTooltipText(
      element,
      text,
      { placement: position }
    );
  }
  function getFormDataFromObject(object) {
    return Object.keys(object).reduce((formData, key) => {
      formData.append(key, object[key]);
      return formData;
    }, new FormData());
  }
  async function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
  var callbacks = [];
  var postIds = [];
  function addXHRListener(callback, postId) {
    if (postId && postIds.includes(postId)) return;
    else if (postId) postIds.push(postId);
    callbacks.push(callback);
  }
  function interceptXhr() {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener("load", () => {
        callbacks.forEach((cb) => setTimeout(() => cb(this)));
      }, false);
      open.apply(this, arguments);
    };
  }
  function getFullFlag(flagType, target, postId) {
    const placeholderTarget = /\$TARGET\$/g;
    const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
    const content = flagType.flagText;
    if (!content) return null;
    const copypastorLink = `https://copypastor.sobotics.org/posts/${postId}`;
    return content.replace(placeholderTarget, `https:${target}`).replace(placeholderCopypastorLink, copypastorLink);
  }
  function getFlagTypeFromFlagId(flagId) {
    return Store.flagTypes.find(({ id }) => id === flagId) ?? null;
  }
  function getHumanFromDisplayName(displayName) {
    const flags = {
      ["PostSpam" /* Spam */]: "as spam",
      ["PostOffensive" /* Rude */]: "as R/A",
      ["AnswerNotAnAnswer" /* NAA */]: "as NAA",
      ["PostLowQuality" /* VLQ */]: "as VLQ",
      ["NoFlag" /* NoFlag */]: "",
      ["PlagiarizedContent" /* Plagiarism */]: "for plagiarism",
      ["PostOther" /* ModFlag */]: "for moderator attention"
    };
    return flags[displayName] || "";
  }
  function toggleLoading(button) {
    button.classList.toggle("is-loading");
    button.ariaDisabled = button.ariaDisabled === "true" ? "false" : "true";
    button.disabled = !button.disabled;
  }
  async function addProgress(event, flagType, post = new Page(true).posts[0]) {
    const input = document.querySelector("#advanced-flagging-flag-post");
    if (!post.filterReporters(flagType.feedbacks).length && !input?.checked) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.target;
    toggleLoading(target);
    post.progress = new Progress(target);
    post.progress.attach();
    if (input?.checked && !StackExchange.options.user.isModerator) {
      const flagProgress = post.progress.addItem("Flagging as NAA...");
      try {
        await post.flag("AnswerNotAnAnswer" /* NAA */, null);
        flagProgress.completed();
      } catch (error) {
        console.error(error);
        flagProgress.failed(
          error instanceof Error ? error.message : "see console for more details"
        );
      }
    }
    try {
      await post.sendFeedbacks(flagType);
    } finally {
      await delay(1e3);
      toggleLoading(target);
      target.click();
    }
  }
  function appendLabelAndBoxes(element, post) {
    const label = label_exports.makeStacksLabel(
      "noid",
      {
        text: "Send feedback to:",
        classes: ["mt2", "fw-normal"]
      }
    );
    const boxes = Object.entries(post.getFeedbackBoxes(true)).map(([, box]) => box);
    const [, ...checkboxes] = checkbox_exports.makeStacksCheckboxes(
      boxes,
      { horizontal: true }
    );
    checkboxes.forEach((box) => box.classList.add("flex--item"));
    element.parentElement?.append(label, ...checkboxes);
  }

  // src/UserscriptTools/ChatApi.ts
  var ChatApi = class _ChatApi {
    constructor(chatUrl = "https://chat.stackoverflow.com", roomId = 111347) {
      this.chatUrl = chatUrl;
      this.roomId = roomId;
    }
    nattyId = 6817005;
    getChatUserId() {
      return StackExchange.options.user.userId;
    }
    async sendMessage(message) {
      let numTries = 0;
      const makeRequest = async () => {
        return await this.sendRequestToChat(message);
      };
      const onFailure = async () => {
        numTries++;
        if (numTries < 3) {
          Store.unset(Cached.Fkey);
          if (!await makeRequest()) {
            return onFailure();
          }
        } else {
          throw new Error("Failed to send message to chat");
        }
        return true;
      };
      if (!await makeRequest()) {
        return onFailure();
      }
      return true;
    }
    async getFinalUrl() {
      const url = await this.getWsUrl();
      const l = await this.getLParam();
      return `${url}?l=${l}`;
    }
    reportReceived(event) {
      const data = JSON.parse(event.data);
      return data[`r${this.roomId}`].e?.filter(({ event_type, user_id }) => {
        return event_type === 1 && user_id === this.nattyId;
      }).map((item) => {
        const { content } = item;
        if (Store.dryRun) {
          console.log("New message posted by Natty on room", this.roomId, item);
        }
        const matchRegex = /stackoverflow\.com\/a\/(\d+)/;
        const id = matchRegex.exec(content)?.[1];
        return Number(id);
      }) ?? [];
    }
    static getExpiryDate() {
      const expiryDate = /* @__PURE__ */ new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      return expiryDate;
    }
    async sendRequestToChat(message) {
      const url = `${this.chatUrl}/chats/${this.roomId}/messages/new`;
      if (Store.dryRun) {
        console.log("Send", message, `to ${this.roomId} via`, url);
        return Promise.resolve(true);
      }
      const fkey = await this.getChannelFKey();
      return new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: "POST",
          url,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: `text=${encodeURIComponent(message)}&fkey=${fkey}`,
          onload: ({ status }) => resolve(status === 200),
          onerror: () => resolve(false)
        });
      });
    }
    getChannelPage() {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: `${this.chatUrl}/rooms/${this.roomId}`,
          onload: ({ status, responseText }) => {
            status === 200 ? resolve(responseText) : reject();
          },
          onerror: () => reject()
        });
      });
    }
    // see https://meta.stackexchange.com/a/218355
    async getWsUrl() {
      const fkey = await this.getChannelFKey();
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: `${this.chatUrl}/ws-auth`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: `roomid=${this.roomId}&fkey=${fkey}`,
          onload: ({ status, responseText }) => {
            if (status !== 200) reject();
            const json = JSON.parse(responseText);
            resolve(json.url);
          },
          onerror: () => reject()
        });
      });
    }
    async getLParam() {
      const fkey = await this.getChannelFKey();
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: `${this.chatUrl}/chats/${this.roomId}/events`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: `fkey=${fkey}`,
          onload: ({ status, responseText }) => {
            if (status !== 200) reject();
            const json = JSON.parse(responseText);
            resolve(json.time);
          },
          onerror: () => reject()
        });
      });
    }
    getChannelFKey() {
      const expiryDate = _ChatApi.getExpiryDate();
      return Store.getAndCache(Cached.Fkey, async () => {
        try {
          const channelPage = await this.getChannelPage();
          const parsed = new DOMParser().parseFromString(channelPage, "text/html");
          const fkeyInput = parsed.querySelector('input[name="fkey"]');
          const fkey = fkeyInput?.value ?? "";
          return fkey;
        } catch (error) {
          console.error(error);
          throw new Error("Failed to get chat fkey");
        }
      }, expiryDate);
    }
  };

  // src/UserscriptTools/Reporter.ts
  var Reporter = class {
    name;
    id;
    sanitisedName;
    cacheKey;
    progress = null;
    constructor(name, id) {
      this.name = name;
      this.sanitisedName = this.name.replace(/\s/g, "");
      this.cacheKey = `defaultNo${this.sanitisedName}`;
      this.id = id;
    }
    wasReported() {
      return false;
    }
    canBeReported() {
      return false;
    }
    async sendFeedback(feedback) {
      if (!feedback) return;
      return new Promise((resolve) => resolve());
    }
    showOnPopover() {
      return this.wasReported() || this.canBeReported();
    }
    canSendFeedback(feedback) {
      return Boolean(feedback);
    }
    getIcon() {
      return this.createBotIcon("");
    }
    getProgressMessage(feedback) {
      return `Sending ${feedback} feedback to ${this.name}`;
    }
    createBotIcon(href) {
      const botImages = {
        Natty: "https://i.sstatic.net/aMUMt.jpg?s=32&g=1",
        Smokey: "https://i.sstatic.net/7cmCt.png?s=32&g=1",
        "Generic Bot": "https://i.sstatic.net/6DsXG.png?s=32&g=1",
        Guttenberg: "https://i.sstatic.net/kEQs2BQb.png?s=32&g=1"
      };
      const iconWrapper = document.createElement("div");
      iconWrapper.classList.add("flex--item", "d-inline-block", "advanced-flagging-icon");
      if (!Page.isQuestionPage && !Page.isLqpReviewPage && !Page.isStagingGroundPage) {
        iconWrapper.classList.add("ml8");
      }
      const iconLink = document.createElement("a");
      iconLink.classList.add("s-avatar", "s-avatar__16", "s-user-card--avatar");
      if (href) {
        iconLink.href = href;
        iconLink.target = "_blank";
        attachPopover(iconLink, `Reported by ${this.name}`);
      }
      iconWrapper.append(iconLink);
      const iconImage = document.createElement("img");
      iconImage.classList.add("s-avatar--image");
      iconImage.src = botImages[this.name];
      iconLink.append(iconImage);
      return iconWrapper;
    }
  };

  // src/UserscriptTools/CopyPastorAPI.ts
  var CopyPastorAPI = class _CopyPastorAPI extends Reporter {
    copypastorId;
    repost;
    targetUrl;
    static copypastorIds = {};
    static key = "wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj";
    static server = "https://copypastor.sobotics.org";
    constructor(id) {
      super("Guttenberg", id);
      const {
        copypastorId = 0,
        repost = false,
        target_url: targetUrl = ""
      } = _CopyPastorAPI.copypastorIds[this.id] ?? {};
      this.copypastorId = copypastorId;
      this.repost = repost;
      this.targetUrl = targetUrl;
    }
    static async getAllCopyPastorIds() {
      if (!Page.isStackOverflow) return;
      const postUrls = page.getAllPostIds(false, true);
      if (!postUrls.length) return;
      try {
        await this.storeReportedPosts(postUrls);
      } catch (error) {
        displayToaster("Could not connect to CopyPastor.", "danger");
        console.error(error);
      }
    }
    static storeReportedPosts(postUrls) {
      const url = `${this.server}/posts/findTarget?url=${postUrls.join(",")}`;
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: 1500,
          onload: ({ responseText }) => {
            const response = JSON.parse(responseText);
            if (response.status === "failure") return;
            response.posts.forEach((item) => {
              const {
                post_id: postId,
                target_url: targetUrl,
                original_url: originalUrl,
                repost
              } = item;
              const id = /\d+/.exec(originalUrl)?.[0];
              const sitePostId = Number(id);
              this.copypastorIds[sitePostId] = {
                copypastorId: Number(postId),
                repost,
                target_url: targetUrl
              };
            });
            resolve();
          },
          onerror: (error) => reject(error),
          ontimeout: () => reject("Request timed out")
        });
      });
    }
    sendFeedback(feedback) {
      const chatId = new ChatApi().getChatUserId();
      const payload = {
        post_id: this.copypastorId,
        feedback_type: feedback,
        username,
        link: `//chat.stackoverflow.com/users/${chatId}`,
        key: _CopyPastorAPI.key
      };
      const data = Object.entries(payload).map((item) => item.join("=")).join("&");
      return new Promise((resolve, reject) => {
        const url = `${_CopyPastorAPI.server}/feedback/create`;
        if (Store.dryRun) {
          console.log("Feedback to Guttenberg via", url, data);
          resolve();
        }
        GM_xmlhttpRequest({
          method: "POST",
          url,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data,
          onload: ({ status }) => {
            status === 200 ? resolve() : reject();
          },
          onerror: () => reject()
        });
      });
    }
    canBeReported() {
      return false;
    }
    wasReported() {
      return Boolean(this.copypastorId);
    }
    canSendFeedback(feedback) {
      return this.wasReported() && Boolean(feedback);
    }
    getIcon() {
      return this.createBotIcon(
        this.copypastorId ? `${_CopyPastorAPI.server}/posts/${this.copypastorId}` : ""
      );
    }
  };

  // src/UserscriptTools/GenericBotAPI.ts
  var GenericBotAPI = class extends Reporter {
    constructor(id, deleted) {
      super("Generic Bot", id);
      this.deleted = deleted;
    }
    key = "Cm45BSrt51FR3ju";
    sendFeedback(trackPost) {
      const flaggerName = encodeURIComponent(username || "");
      if (!trackPost) return Promise.resolve();
      const answer = document.querySelector(`#answer-${this.id} .js-post-body`);
      const answerBody = answer?.innerHTML.trim() ?? "";
      const contentHash = this.computeContentHash(answerBody);
      const url = "https://so.floern.com/api/trackpost.php";
      const payload = {
        key: this.key,
        postId: this.id,
        contentHash,
        flagger: flaggerName
      };
      const data = Object.entries(payload).map((item) => item.join("=")).join("&");
      if (Store.dryRun) {
        console.log("Track post via", url, payload);
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data,
          onload: ({ status, response }) => {
            if (status !== 200) {
              console.error("Failed to send track request.", response);
              reject();
            }
            resolve();
          },
          onerror: () => reject()
        });
      });
    }
    showOnPopover() {
      return Page.isStackOverflow;
    }
    canSendFeedback(feedback) {
      return feedback === "track" && !this.deleted && Page.isStackOverflow && Boolean(username);
    }
    getProgressMessage(feedback) {
      return feedback ? "Tracking post with Generic Bot" : "";
    }
    // Ask Floern what this does
    // https://github.com/SOBotics/Userscripts/blob/master/GenericBot/flagtracker.user.js#L32-L40
    computeContentHash(postContent) {
      if (!postContent) return 0;
      let hash = 0;
      for (let i = 0; i < postContent.length; ++i) {
        hash = (hash << 5) - hash + postContent.charCodeAt(i);
        hash = hash & hash;
      }
      return hash;
    }
  };

  // src/UserscriptTools/WebsocketUtils.ts
  var WebsocketUtils = class {
    constructor(url, id, progress, auth = "", timeout = 1e4) {
      this.url = url;
      this.id = id;
      this.progress = progress;
      this.auth = auth;
      this.timeout = timeout;
      this.initWebsocket();
    }
    websocket = null;
    async waitForReport(callback) {
      const connectProgress = this.progress?.addSubItem("Connecting to websocket...");
      if (!this.websocket || this.websocket.readyState > 1) {
        this.websocket = null;
        if (Store.dryRun) {
          console.log("Failed to connect to", this.url, "WebSocket");
        }
        connectProgress?.failed();
        return;
      }
      connectProgress?.completed();
      const reportProgress = this.progress?.addSubItem("Waiting for the report to be received...");
      await this.withTimeout(
        this.timeout,
        reportProgress,
        new Promise((resolve) => {
          this.websocket?.addEventListener(
            "message",
            (event) => {
              const ids = callback(event);
              if (Store.dryRun) {
                console.log("New message from", this.url, event.data);
                console.log("Comparing", ids, "to", this.id);
              }
              if (ids.includes(this.id)) {
                reportProgress?.completed();
                resolve();
              }
            }
          );
        })
      );
    }
    closeWebsocket() {
      if (!this.websocket) return;
      this.websocket.close();
      this.websocket = null;
      if (Store.dryRun) {
        console.log("Closed connection to", this.url);
      }
    }
    initWebsocket() {
      this.websocket = new WebSocket(this.url);
      if (this.auth) {
        this.websocket.addEventListener("open", () => {
          this.websocket?.send(this.auth);
        });
      }
      if (Store.dryRun) {
        console.log("WebSocket", this.url, "initialised.");
      }
    }
    async withTimeout(millis, subItem, promise) {
      let time;
      const timeout = new Promise((resolve) => {
        time = setTimeout(() => {
          if (Store.dryRun) {
            console.log("WebSocket connection timeouted after", millis, "ms");
          }
          subItem?.failed("timeouted");
          resolve();
        }, millis);
      });
      await Promise.race([promise, timeout]).finally(() => {
        clearTimeout(time);
        this.closeWebsocket();
      });
    }
  };

  // src/UserscriptTools/MetaSmokeAPI.ts
  var MetaSmokeAPI = class _MetaSmokeAPI extends Reporter {
    constructor(id, postType, deleted) {
      super("Smokey", id);
      this.postType = postType;
      this.deleted = deleted;
      this.smokeyId = _MetaSmokeAPI.metasmokeIds[this.id] ?? 0;
    }
    static accessToken;
    static isDisabled = Store.get(Cached.Metasmoke.disabled) || false;
    smokeyId;
    static appKey = "0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0";
    static filter = "GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ";
    static metasmokeIds = {};
    failureMessage = "Failed to report post to Smokey";
    wsUrl = "wss://metasmoke.erwaysoftware.com/cable";
    wsAuth = JSON.stringify({
      identifier: JSON.stringify({
        channel: "ApiChannel",
        key: _MetaSmokeAPI.appKey,
        events: "posts#create"
      }),
      command: "subscribe"
    });
    static reset() {
      Store.unset(Cached.Metasmoke.disabled);
      Store.unset(Cached.Metasmoke.userKey);
    }
    static async setup() {
      _MetaSmokeAPI.accessToken = await _MetaSmokeAPI.getUserKey();
    }
    static async queryMetaSmokeInternal(urls) {
      if (_MetaSmokeAPI.isDisabled) return;
      const urlString = urls ?? page.getAllPostIds(true, true).join(",");
      if (!urlString) return;
      const parameters = Object.entries({
        urls: urlString,
        key: _MetaSmokeAPI.appKey,
        per_page: 1e3,
        filter: this.filter
        // only include id and link fields
      }).map((item) => item.join("=")).join("&");
      try {
        const url = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls?${parameters}`;
        const call = await fetch(url);
        const result = await call.json();
        result.items.forEach(({ link, id }) => {
          const postId = Number(/\d+$/.exec(link)?.[0]);
          if (!postId) return;
          _MetaSmokeAPI.metasmokeIds[postId] = id;
        });
      } catch (error) {
        displayToaster("Failed to get Metasmoke URLs.", "danger");
        console.error(error);
        _MetaSmokeAPI.isDisabled = true;
      }
    }
    getQueryUrl() {
      const path = this.postType === "Answer" ? "a" : "questions";
      return `//${window.location.hostname}/${path}/${this.id}`;
    }
    reportReceived(event) {
      const data = JSON.parse(event.data);
      if (data.type) return [];
      if (Store.dryRun) {
        console.log("New post reported to Smokey", data);
      }
      const {
        object,
        event_class: evClass,
        event_type: type
      } = data.message;
      if (type !== "create" || evClass !== "Post") return [];
      const link = object.link;
      const url = new URL(link, location.href);
      const postId = Number(/\d+/.exec(url.pathname)?.[0]);
      if (url.host !== location.host) return [];
      return [postId];
    }
    async reportRedFlag() {
      const urlString = this.getQueryUrl();
      const { appKey, accessToken } = _MetaSmokeAPI;
      const url = "https://metasmoke.erwaysoftware.com/api/w/post/report";
      const data = {
        post_link: urlString,
        key: appKey,
        token: accessToken
      };
      if (Store.dryRun) {
        console.log("Report post via", url, data);
        return;
      }
      const reportRequest = await fetch(
        url,
        {
          method: "POST",
          body: getFormDataFromObject(data)
        }
      );
      const requestResponse = await reportRequest.text();
      if (!reportRequest.ok || requestResponse !== "OK") {
        console.error(`Failed to report post ${this.smokeyId} to Smokey`, requestResponse);
        throw new Error(this.failureMessage);
      }
    }
    canBeReported() {
      return !_MetaSmokeAPI.isDisabled;
    }
    wasReported() {
      return Boolean(this.smokeyId);
    }
    showOnPopover() {
      return !_MetaSmokeAPI.isDisabled;
    }
    canSendFeedback(feedback) {
      const { isDisabled, accessToken } = _MetaSmokeAPI;
      return !isDisabled && Boolean(accessToken) && (Boolean(this.smokeyId) || // the post has been reported OR:
      feedback === "tpu-" && !this.deleted);
    }
    async sendFeedback(feedback) {
      const { appKey, accessToken } = _MetaSmokeAPI;
      if (!this.smokeyId && feedback === "tpu-" && !this.deleted) {
        const wsUtils = new WebsocketUtils(this.wsUrl, this.id, this.progress, this.wsAuth);
        const reportProgress = this.progress?.addSubItem("Sending report...");
        try {
          await this.reportRedFlag();
          reportProgress?.completed();
        } catch (error) {
          wsUtils.closeWebsocket();
          reportProgress?.failed();
          throw error;
        }
        await wsUtils.waitForReport((event) => this.reportReceived(event));
        await new Promise((resolve) => setTimeout(resolve, 3 * 1e3));
        return;
      }
      const data = {
        type: feedback,
        key: appKey,
        token: accessToken
      };
      const url = `//metasmoke.erwaysoftware.com/api/w/post/${this.smokeyId}/feedback`;
      if (Store.dryRun) {
        console.log("Feedback to Smokey via", url, data);
        return;
      }
      const feedbackRequest = await fetch(
        url,
        {
          method: "POST",
          body: getFormDataFromObject(data)
        }
      );
      const feedbackResponse = await feedbackRequest.json();
      if (!feedbackRequest.ok) {
        console.error(`Failed to send feedback for ${this.smokeyId} to Smokey`, feedbackResponse);
        throw new Error();
      }
    }
    getIcon() {
      return this.createBotIcon(
        this.smokeyId ? `//metasmoke.erwaysoftware.com/post/${this.smokeyId}` : ""
      );
    }
    getProgressMessage(feedback) {
      return this.wasReported() || feedback !== "tpu-" ? super.getProgressMessage(feedback) : "Reporting post to Smokey";
    }
    static getMetasmokeTokenPopup() {
      const codeInput = input_exports.makeStacksInput(
        "advanced-flagging-metasmoke-token-input",
        { placeholder: "Enter the code here" },
        {
          text: "Metasmoke access token",
          description: "Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:"
        }
      );
      const authModal = modals_exports.makeStacksModal(
        "advanced-flagging-metasmoke-token-modal",
        {
          title: {
            text: "Authenticate MS with AF"
          },
          body: {
            bodyHtml: codeInput
          },
          footer: {
            buttons: [
              {
                element: buttons_exports.makeStacksButton(
                  "advanced-flagging-submit-code",
                  "Submit",
                  { primary: true }
                )
              },
              {
                element: buttons_exports.makeStacksButton(
                  "advanced-flagging-dismiss-code-modal",
                  "Cancel"
                ),
                hideOnClick: true
              }
            ]
          }
        }
      );
      return authModal;
    }
    static showMSTokenPopupAndGet() {
      return new Promise((resolve) => {
        const popup = this.getMetasmokeTokenPopup();
        StackExchange.helpers.showModal(popup);
        popup.querySelector(".s-btn__filled")?.addEventListener("click", () => {
          const input = popup.querySelector("input");
          const token = input?.value;
          popup.remove();
          if (!token) return;
          resolve(token.toString());
        });
      });
    }
    static async codeGetter(metaSmokeOAuthUrl) {
      if (_MetaSmokeAPI.isDisabled) return;
      const authenticate = await StackExchange.helpers.showConfirmModal({
        title: "Setting up metasmoke",
        bodyHtml: "If you do not wish to connect, press cancel and this popup won't show up again. To reset configuration, see the footer of Stack Overflow.",
        buttonLabel: "Authenticate!"
      });
      if (!authenticate) {
        Store.set(Cached.Metasmoke.disabled, true);
        return;
      }
      window.open(metaSmokeOAuthUrl, "_blank");
      await delay(100);
      return await this.showMSTokenPopupAndGet();
    }
    static async getUserKey() {
      while (typeof StackExchange.helpers.showConfirmModal === "undefined") {
        await delay(100);
      }
      const { appKey } = _MetaSmokeAPI;
      const url = `https://metasmoke.erwaysoftware.com/oauth/request?key=${appKey}`;
      return await Store.getAndCache(
        Cached.Metasmoke.userKey,
        async () => {
          const code = await _MetaSmokeAPI.codeGetter(url);
          if (!code) return "";
          const tokenUrl = `//metasmoke.erwaysoftware.com/oauth/token?key=${appKey}&code=${code}`;
          const tokenCall = await fetch(tokenUrl);
          const { token } = await tokenCall.json();
          return token;
        }
      );
    }
  };

  // src/UserscriptTools/NattyApi.ts
  var dayMillis = 1e3 * 60 * 60 * 24;
  var nattyFeedbackUrl = "https://logs.sobotics.org/napi-1.1/api/stored/";
  var nattyReportedMessage = "Post reported to Natty";
  var NattyAPI = class _NattyAPI extends Reporter {
    constructor(id, questionDate, answerDate, deleted) {
      super("Natty", id);
      this.questionDate = questionDate;
      this.answerDate = answerDate;
      this.deleted = deleted;
      this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.id}`;
      this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.id}`;
    }
    raisedRedFlag = false;
    static nattyIds = [];
    chat = new ChatApi();
    feedbackMessage;
    reportMessage;
    static getAllNattyIds(ids) {
      const postIds2 = (ids ?? page.getAllPostIds(false, false)).join(",");
      if (!Page.isStackOverflow || !postIds2) return Promise.resolve();
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: `${nattyFeedbackUrl}${postIds2}`,
          onload: ({ status, responseText }) => {
            if (status !== 200) reject();
            const result = JSON.parse(responseText);
            this.nattyIds = result.items.map(({ name }) => Number(name));
            resolve();
          },
          onerror: () => reject()
        });
      });
    }
    wasReported() {
      return _NattyAPI.nattyIds.includes(this.id);
    }
    canBeReported() {
      const answerAge = this.getDaysBetween(this.answerDate, /* @__PURE__ */ new Date());
      const daysPostedAfterQuestion = this.getDaysBetween(this.questionDate, this.answerDate);
      return this.answerDate > this.questionDate && answerAge < 30 && daysPostedAfterQuestion > 30 && !this.deleted;
    }
    canSendFeedback(feedback) {
      return Page.isStackOverflow && (this.wasReported() || this.canBeReported() && feedback === "tp" && !this.deleted);
    }
    async sendFeedback(feedback) {
      if (this.wasReported()) {
        await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`);
      } else if (feedback === "tp") {
        await this.report();
      }
    }
    getIcon() {
      return this.createBotIcon(
        this.wasReported() ? `//logs.sobotics.org/Natty/${this.id}.html` : ""
      );
    }
    getProgressMessage(feedback) {
      return this.wasReported() || feedback !== "tp" ? super.getProgressMessage(feedback) : "Reporting post to Natty";
    }
    async report() {
      if (!this.canBeReported()) return "";
      if (StackExchange.options.user.isModerator || Page.isLqpReviewPage || this.raisedRedFlag) {
        const url = await this.chat.getFinalUrl();
        const wsUtils = new WebsocketUtils(url, this.id, this.progress);
        const reportProgress = this.progress?.addSubItem("Sending report...");
        try {
          await this.chat.sendMessage(this.reportMessage);
          reportProgress?.completed();
        } catch (error) {
          wsUtils.closeWebsocket();
          reportProgress?.failed();
          throw error;
        }
        await wsUtils.waitForReport((event) => this.chat.reportReceived(event));
      } else {
        await this.chat.sendMessage(this.reportMessage);
      }
      return nattyReportedMessage;
    }
    getDaysBetween(questionDate, answerDate) {
      return (answerDate.valueOf() - questionDate.valueOf()) / dayMillis;
    }
  };

  // src/UserscriptTools/Post.ts
  var Post = class _Post {
    constructor(element) {
      this.element = element;
      this.type = this.getType();
      this.id = this.getId();
      this.deleted = this.element.classList.contains("deleted-answer");
      this.date = this.getCreationDate();
      if (this.type === "Question") {
        _Post.qDate = this.date;
      }
      this.score = this.getScore();
      this.opReputation = this.getOpReputation();
      this.opName = this.getOpName();
      [this.done, this.failed, this.flagged] = _Post.getActionIcons();
      this.initReporters();
    }
    static qDate = /* @__PURE__ */ new Date();
    type;
    id;
    deleted;
    date;
    opReputation;
    opName;
    // not really related to the post,
    // but are unique and easy to access this way :)
    done;
    failed;
    flagged;
    progress = new Progress();
    reporters = {};
    autoflagging = false;
    score;
    static getActionIcons() {
      return [
        ["Checkmark", "fc-green-500"],
        ["Clear", "fc-red-500"],
        ["Flag", "fc-red-500"]
      ].map(([svg, classname]) => _Post.getIcon(getSvg(`icon${svg}`), classname));
    }
    async flag(reportType, text) {
      const flagName = getFlagToRaise(reportType, this.qualifiesForVlq());
      const targetUrl = this.reporters.Guttenberg?.targetUrl;
      const url = `/flags/posts/${this.id}/add/${flagName}`;
      const data = {
        fkey: StackExchange.options.user.fkey,
        otherText: text || "",
        // plagiarism flag: fill "Link(s) to original content"
        // note wrt link: site will always be Stack Overflow,
        //                post will always be an answer.
        customData: flagName === "PlagiarizedContent" /* Plagiarism */ ? JSON.stringify({ plagiarizedSource: `https:${targetUrl}` }) : ""
      };
      if (Store.dryRun) {
        console.log(`Flag post as ${flagName} via`, url, data);
        return;
      }
      const flagRequest = await fetch(url, {
        method: "POST",
        body: getFormDataFromObject(data)
      });
      this.autoflagging = true;
      const tooFast = /You may only flag a post every \d+ seconds?/;
      const responseText = await flagRequest.text();
      if (tooFast.test(responseText)) {
        const rlCount = /\d+/.exec(responseText)?.[0] ?? 0;
        const pluralS = Number(rlCount) > 1 ? "s" : "";
        console.error(responseText);
        throw new Error(`rate-limited for ${rlCount} second${pluralS}`);
      }
      const response = JSON.parse(responseText);
      if (!response.Success) {
        const { Message: message } = response;
        const fullMessage = `Failed to flag the post with outcome ${response.Outcome}: ${message}.`;
        console.error(fullMessage);
        if (message.includes("already flagged")) {
          throw new Error("post already flagged");
        } else if (message.includes("limit reached")) {
          throw new Error("post flag limit reached");
        } else {
          throw new Error(message);
        }
      }
      if (response.ResultChangedState) this.reload();
    }
    downvote() {
      const button = this.element.querySelector(".js-vote-down-btn");
      const hasDownvoted = button?.classList.contains("fc-theme-primary");
      if (hasDownvoted) return;
      if (Store.dryRun) {
        console.log("Downvote post by clicking", button);
        return;
      }
      button?.click();
      this.score = this.getScore();
    }
    async deleteVote() {
      const fkey = StackExchange.options.user.fkey;
      const url = `/posts/${this.id}/vote/10`;
      if (Store.dryRun) {
        console.log("Delete vote via", url, "with", fkey);
        return;
      }
      const request = await fetch(url, {
        method: "POST",
        body: getFormDataFromObject({ fkey })
      });
      const response = await request.text();
      let json;
      try {
        json = JSON.parse(response);
      } catch (error) {
        console.error(error, response);
        throw new Error("could not parse JSON");
      }
      if (!json.Success) {
        console.error(json);
        throw new Error(json.Message.toLowerCase());
      }
      if (json.Refresh) this.reload();
    }
    async comment(text) {
      const data = {
        fkey: StackExchange.options.user.fkey,
        comment: text
      };
      const url = `/posts/${this.id}/comments`;
      if (Store.dryRun) {
        console.log("Post comment via", url, data);
        return;
      }
      const request = await fetch(url, {
        method: "POST",
        body: getFormDataFromObject(data)
      });
      const result = await request.text();
      const commentUI = StackExchange.comments.uiForPost($(`#comments-${this.id}`));
      commentUI.addShow(true, false);
      commentUI.showComments(result, null, false, true);
      $(document).trigger("comment", this.id);
    }
    upvoteSameComments(comment) {
      const alternative = Store.config.addAuthorName ? comment.split(", ").slice(1).join(", ") : `${this.opName}, ${comment}`;
      const stripped = _Post.getStrippedComment(comment).toLowerCase();
      const strippedAlt = _Post.getStrippedComment(alternative).toLowerCase();
      this.element.querySelectorAll(".comment-body .comment-copy").forEach((element) => {
        const text = element.innerText.toLowerCase();
        if (text !== stripped && text !== strippedAlt) return;
        const parent = element.closest("li");
        const button = parent?.querySelector(
          "a.js-comment-up.comment-up-off"
          // voting button
        );
        if (Store.dryRun) {
          console.log("Upvote", element, "by clicking", button);
          return;
        }
        button?.click();
      });
    }
    watchForFlags() {
      const watchFlags = Store.config[Cached.Configuration.watchFlags];
      if (!watchFlags || this.deleted) return;
      addXHRListener((xhr) => {
        const { status, responseURL } = xhr;
        const regex = new RegExp(
          `/flags/posts/${this.id}/popup`
        );
        if (this.autoflagging || status !== 200 || !regex.test(responseURL)) return;
        const flagPopup = document.querySelector("#popup-flag-post");
        const submit = flagPopup?.querySelector(".js-popup-submit");
        if (!submit || !flagPopup || submit.textContent?.trim().startsWith("Retract")) return;
        appendLabelAndBoxes(submit, this);
        submit.addEventListener("click", async (event) => {
          const checked = flagPopup.querySelector("input.s-radio:checked");
          if (!checked) return;
          const flag = checked.value;
          const flagType = Store.flagTypes.find((item) => item.sendWhenFlagRaised && item.reportType === flag);
          if (!flagType) return;
          if (Store.dryRun) {
            console.log("Post", this.id, "manually flagged as", flag, flagType);
          }
          const natty = this.reporters.Natty;
          if (natty) {
            natty.raisedRedFlag = ["PostSpam", "PostOffensive"].includes(flag);
          }
          await addProgress(event, flagType, this);
          $(this.flagged).fadeIn();
        }, { once: true });
      }, this.id);
    }
    filterReporters(feedbacks) {
      return Object.values(this.reporters).filter((reporter) => {
        const { name, sanitisedName } = reporter;
        const selector = `#advanced-flagging-send-feedback-to-${sanitisedName.toLowerCase()}-${this.id}`;
        const input = document.querySelector(`${selector}-flag-review`) ?? document.querySelector(selector);
        const sendFeedback = input?.checked ?? true;
        const feedback = feedbacks[name];
        return sendFeedback && feedback && reporter.canSendFeedback(feedback);
      });
    }
    async sendFeedbacks({ feedbacks }) {
      let hasFailed = false;
      const allPromises = this.filterReporters(feedbacks).map((reporter) => {
        const feedback = feedbacks[reporter.name];
        const text = reporter.getProgressMessage(feedback);
        const sendingFeedback = this.progress.addItem(`${text}...`);
        reporter.progress = sendingFeedback;
        return reporter.sendFeedback(feedback).then(() => sendingFeedback.completed()).catch((error) => {
          console.error(error);
          if (error instanceof Error) {
            sendingFeedback.failed(error.message);
          }
          hasFailed = true;
        });
      });
      await Promise.allSettled(allPromises);
      return !hasFailed;
    }
    addIcons() {
      const iconLocation = this.element.querySelector(".js-post-menu > div.d-flex") ?? this.element.querySelector("a.question-hyperlink, a.answer-hyperlink, .s-link");
      const icons = Object.values(this.reporters).filter((reporter) => reporter.wasReported()).map((reporter) => reporter.getIcon());
      iconLocation?.append(...icons);
    }
    canDelete(popover = false) {
      const selector = '.js-delete-post[title^="Vote to delete"]';
      const deleteButton = this.element.querySelector(selector);
      const userRep = StackExchange.options.user.rep;
      return !this.deleted && // mods can delete no matter what
      (StackExchange.options.user.isModerator || // if the delete button is visible, then the user can vote to delete
      (Boolean(deleteButton) || userRep >= 2e4 && (popover ? this.score <= 0 : this.score < 0)));
    }
    qualifiesForVlq() {
      const dayMillis2 = 1e3 * 60 * 60 * 24;
      return (/* @__PURE__ */ new Date()).valueOf() - this.date.valueOf() < dayMillis2 && this.score <= 0;
    }
    // returns [bot name, checkbox config]
    getFeedbackBoxes(isFlagOrReview = false) {
      const newEntries = Object.entries(this.reporters).filter(([name, instance]) => {
        return instance.showOnPopover() && (!Page.isLqpReviewPage || (name !== "Smokey" || instance.wasReported()));
      }).map(([, instance]) => {
        const botName = instance.sanitisedName.toLowerCase();
        const botNameId = `advanced-flagging-send-feedback-to-${botName}-${this.id}`;
        const defaultNoCheck = Store.config[instance.cacheKey];
        const iconHtml = instance.getIcon().outerHTML;
        const checkbox = {
          // on post page, the id is not unique!
          id: `${botNameId}${isFlagOrReview ? "-flag-review" : ""}`,
          labelConfig: {
            text: `${isFlagOrReview ? "" : "Feedback to"} ${iconHtml}`,
            classes: [isFlagOrReview ? "mb4" : "fs-body1"]
          },
          selected: !defaultNoCheck
        };
        return [instance.name, checkbox];
      });
      return Object.fromEntries(newEntries);
    }
    static getIcon(svg, classname) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("flex--item");
      wrapper.style.display = "none";
      svg.classList.add(classname);
      wrapper.append(svg);
      return wrapper;
    }
    static getStrippedComment(text) {
      return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").replace(/\[([^\]]+)\][^(]*?/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(" - From Review", "");
    }
    static markDeleted(post) {
      post.element.classList.add("deleted-answer", "py16");
      const disabledLink = document.createElement("span");
      disabledLink.classList.add("disabled-link");
      disabledLink.textContent = "Comments disabled on deleted / locked posts / reviews";
      post.element.querySelector(".js-add-link")?.replaceWith(disabledLink);
      const text = document.createElement("div");
      const b = document.createElement("b");
      b.textContent = "This post is hidden";
      text.append(b, ". It was deleted.");
      const notice = notices_exports.makeStacksNotice({
        type: "info",
        text,
        icon: [
          "iconEyeOff",
          getIconPath("iconEyeOff")
        ],
        classes: ["mb16"]
      });
      post.element.querySelector(".js-post-body")?.prepend(notice);
    }
    getType() {
      return this.element.classList.contains("question") || this.element.id.startsWith("question") || this.element.querySelector(".question-hyperlink") ? "Question" : "Answer";
    }
    getId() {
      const href = this.element.querySelector(
        ".answer-hyperlink, .question-hyperlink, .s-link"
      )?.href;
      const postId = (
        // questions page: get value of data-questionid/data-answerid
        this.element.dataset.questionid ?? this.element.dataset.answerid ?? (this.type === "Answer" ? new URL(href || "").pathname.split("/").pop() : href?.split("/")[4])
      );
      return Number(postId);
    }
    getScore() {
      const voteElement = this.element.querySelector(".js-vote-count");
      return Number(voteElement?.textContent?.trim()) || 0;
    }
    getOpReputation() {
      const repDiv = [...this.element.querySelectorAll(
        ".user-info .reputation-score"
      )].pop();
      if (!repDiv) return 0;
      let reputationText = repDiv.innerText.replace(/,/g, "");
      if (!reputationText) return 0;
      if (reputationText.includes("k")) {
        reputationText = reputationText.replace(/\.\d/g, "").replace(/k/, "");
        return Number(reputationText) * 1e3;
      } else {
        return Number(reputationText);
      }
    }
    getOpName() {
      const lastNameEl = [...this.element.querySelectorAll(".user-info .user-details a")].pop();
      return lastNameEl?.textContent?.trim() ?? "";
    }
    getCreationDate() {
      const dateElements = this.element.querySelectorAll(".user-info .relativetime");
      const authorDateElement = Array.from(dateElements).pop();
      return new Date(authorDateElement?.title ?? "");
    }
    reload() {
      this.deleted = true;
      const newPage = new Page(true);
      newPage.posts.forEach((post) => {
        post.element.style.opacity = "1";
        const previous = post.element.previousElementSibling;
        if (previous?.matches(".realtime-post-deleted-notification")) previous.remove();
      });
      if (StackExchange.options.user.canSeeDeletedPosts) {
        if (this.type === "Question") {
          const postIds2 = page.getAllPostIds(true, false);
          void StackExchange.realtime.reloadPosts(postIds2);
        } else {
          void StackExchange.realtime.reloadPosts([this.id]);
        }
      } else {
        this.type === "Question" ? newPage.posts.forEach((post) => _Post.markDeleted(post)) : _Post.markDeleted(this);
        this.progress.updateLocation();
      }
    }
    initReporters() {
      this.reporters.Smokey = new MetaSmokeAPI(this.id, this.type, this.deleted);
      if (this.type === "Answer" && Page.isStackOverflow) {
        this.reporters.Natty = new NattyAPI(this.id, _Post.qDate, this.date, this.deleted);
        this.reporters.Guttenberg = new CopyPastorAPI(this.id);
      }
      if (Page.isStackOverflow) {
        this.reporters["Generic Bot"] = new GenericBotAPI(this.id, this.deleted);
      }
    }
  };

  // src/UserscriptTools/Page.ts
  var Page = class _Page {
    constructor(includeModified = false) {
      this.includeModified = includeModified;
      this.href = new URL(location.href);
      this.name = this.getName();
      this.selector = this.getPostSelector();
      this.posts = this.getPosts();
      const question = document.querySelector(".question");
      if (_Page.isLqpReviewPage && question) {
        const post = new Post(question);
        Post.qDate = post.date;
      }
    }
    static isStackOverflow = /^https:\/\/stackoverflow.com/.test(location.href);
    static isQuestionPage = /\/questions\/\d+.*/.test(location.href);
    static isLqpReviewPage = /\/review\/low-quality-posts(?:\/\d+)?(?:\/)?$/.test(location.href);
    static isStagingGroundPage = /\/staging-ground\/\d+/.test(location.href);
    name;
    posts = [];
    href;
    selector;
    getAllPostIds(includeQuestion, urlForm) {
      return this.posts.filter((post) => {
        if (!includeQuestion) return post.type !== "Question";
        else return true;
      }).map(({ id, type }) => {
        const urlType = type === "Answer" ? "a" : "questions";
        return urlForm ? `//${window.location.hostname}/${urlType}/${id}` : id;
      });
    }
    getName() {
      const isNatoPage = this.href.pathname.startsWith("/tools/new-answers-old-questions");
      const isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);
      const isSearch = this.href.pathname.startsWith("/search");
      if (isFlagsPage) return "Flags";
      else if (isNatoPage) return "NATO";
      else if (_Page.isQuestionPage) return "Question";
      else if (isSearch) return "Search";
      else if (_Page.isLqpReviewPage) return "Review";
      else if (_Page.isStagingGroundPage) return "Staging Ground";
      else return "";
    }
    getPostSelector() {
      switch (this.name) {
        case "NATO":
          return ".default-view-post-table > tbody > tr";
        case "Flags":
          return ".flagged-post";
        case "Question":
        case "Staging Ground":
          return ".question, .answer";
        case "Search":
          return ".js-search-results .s-post-summary";
        case "Review":
          return "#answer .answer";
        default:
          return "";
      }
    }
    getPosts() {
      if (this.name === "") return [];
      return [...document.querySelectorAll(this.selector)].filter((el) => {
        return !el.querySelector(".advanced-flagging-link, .advanced-flagging-icon") || this.includeModified;
      }).map((el) => new Post(el));
    }
  };

  // src/FlagTypes.ts
  var deletedAnswers = "/help/deleted-answers";
  var commentHelp = "/help/privileges/comment";
  var reputationHelp = "/help/whats-reputation";
  var voteUpHelp = "/help/privileges/vote-up";
  var whyVote = "/help/why-vote";
  var setBounties = "/help/privileges/set-bounties";
  var flagPosts = "/help/privileges/flag-posts";
  var flagCategories = [
    {
      isDangerous: true,
      name: "Red flags",
      appliesTo: ["Answer", "Question"],
      id: 1,
      FlagTypes: [
        {
          id: 1,
          displayName: "Spam",
          reportType: "PostSpam" /* Spam */,
          feedbacks: { Smokey: "tpu-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: true
        },
        {
          id: 2,
          displayName: "Rude or Abusive",
          reportType: "PostOffensive" /* Rude */,
          feedbacks: { Smokey: "tpu-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: true
        }
      ]
    },
    {
      isDangerous: true,
      name: "Guttenberg mod flags",
      appliesTo: ["Answer"],
      id: 2,
      FlagTypes: [
        {
          id: 3,
          displayName: "Plagiarism",
          reportType: "PlagiarizedContent" /* Plagiarism */,
          flagText: "Possible plagiarism of the linked answer, as can be seen here $COPYPASTOR$",
          // don't send feedback to Smokey despite https://charcoal-se.org/smokey/Feedback-Guidance.html#plagiarism
          feedbacks: { Smokey: "", Natty: "", Guttenberg: "tp", "Generic Bot": "" },
          sendWhenFlagRaised: false
        },
        {
          id: 4,
          displayName: "Duplicate answer",
          reportType: "PostOther" /* ModFlag */,
          flagText: "The post is a repost of their other answer: $TARGET$, but as there are slight differences (see $COPYPASTOR$), an auto flag would not be raised.",
          comments: {
            low: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question."
          },
          feedbacks: { Smokey: "", Natty: "", Guttenberg: "tp", "Generic Bot": "" },
          sendWhenFlagRaised: false
        },
        {
          id: 5,
          displayName: "Bad attribution",
          reportType: "PlagiarizedContent" /* Plagiarism */,
          flagText: "This post is copied from $TARGET$, as can be seen here $COPYPASTOR$. The author only added a link to the other answer, which is [not the proper way of attribution](//stackoverflow.blog/2009/06/25/attribution-required).",
          feedbacks: { Smokey: "", Natty: "", Guttenberg: "tp", "Generic Bot": "" },
          sendWhenFlagRaised: false
        }
      ]
    },
    {
      isDangerous: false,
      name: "Answer-related",
      appliesTo: ["Answer"],
      id: 3,
      FlagTypes: [
        {
          id: 6,
          displayName: "Link Only",
          reportType: "PostLowQuality" /* VLQ */,
          comments: {
            // comment by Yunnosch: https://chat.stackoverflow.com/transcript/message/57442309
            low: `A link to a solution is welcome, but please ensure your answer is useful without it: You need to provide at least a technical summary of *how* the problem is solved, so that it can be reproduced even without the link. It is not enough to advertise *what* it achieves. Also please [add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will have some idea what it is and why it is there. [Answers that are little more than a link may be deleted.](${deletedAnswers})`
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: true
        },
        {
          id: 7,
          displayName: "Not an answer",
          reportType: "AnswerNotAnAnswer" /* NAA */,
          comments: {
            low: "This does not provide an answer to the question. You can [search for similar questions](/search), or refer to the related and linked questions on the right-hand side of the page to find an answer. If you have a related but different question, [ask a new question](/questions/ask), and include a link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)",
            high: `This post doesn't look like an attempt to answer this question. Every post here is expected to be an explicit attempt to *answer* this question; if you have a critique or need a clarification of the question or another answer, you can [post a comment](${commentHelp}) (like this one) directly below it. Please remove this answer and create either a comment or a new question. See: [Ask questions, get answers, no distractions](/tour).`
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: true
        },
        {
          id: 8,
          displayName: "Thanks",
          reportType: "AnswerNotAnAnswer" /* NAA */,
          comments: {
            low: `Please don't add _thanks_ as answers. They don't actually provide an answer to the question, and can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) enough [reputation](${reputationHelp}), you will gain privileges to [upvote answers](${voteUpHelp}) you like. This way future visitors of the question will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. See [Why is voting important](${whyVote}).`,
            high: `Please don't add _thanks_ as answers. They don't actually provide an answer to the question, and can be perceived as noise by its future visitors. Instead, [upvote answers](${voteUpHelp}) you like. This way future visitors of the question will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. See [Why is voting important](${whyVote}).`
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        },
        {
          id: 9,
          displayName: "Me too",
          reportType: "AnswerNotAnAnswer" /* NAA */,
          comments: {
            low: `Please don't add *Me too* as answers. It doesn't actually provide an answer to the question. If you have a different but related question, then [ask](/questions/ask) it (reference this one if it will help provide context). If you are interested in this specific question, you can [upvote](${voteUpHelp}) it, leave a [comment](${commentHelp}), or start a [bounty](${setBounties}) once you have enough [reputation](${reputationHelp}).`
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        },
        {
          id: 10,
          displayName: "Library",
          reportType: "PostLowQuality" /* VLQ */,
          comments: {
            low: "Please don't just post some tool or library as an answer. At least demonstrate [how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself."
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        },
        {
          id: 11,
          displayName: "Comment",
          reportType: "AnswerNotAnAnswer" /* NAA */,
          comments: {
            low: `This does not provide an answer to the question. Once you have sufficient [reputation](${reputationHelp}) you will be able to [comment on any post](${commentHelp}); instead, [provide answers that don't require clarification from the asker](//meta.stackexchange.com/q/214173).`,
            high: "This does not provide an answer to the question. Please write a comment instead."
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        },
        {
          id: 12,
          displayName: "Duplicate",
          reportType: "AnswerNotAnAnswer" /* NAA */,
          comments: {
            low: `Instead of posting an answer which merely links to another answer, please instead [flag the question](${flagPosts}) as a duplicate.`
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        },
        {
          id: 13,
          displayName: "Non English",
          reportType: "PostLowQuality" /* VLQ */,
          comments: {
            low: "Please write your answer in English, as Stack Overflow is an [English-only site](//meta.stackoverflow.com/a/297680)."
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        },
        {
          id: 14,
          displayName: "Should be an edit",
          reportType: "AnswerNotAnAnswer" /* NAA */,
          comments: {
            low: 'Please use the edit link on your question to add additional information. The "Post Answer" button should be used only for complete answers to the question.'
          },
          feedbacks: { Smokey: "naa-", Natty: "tp", Guttenberg: "", "Generic Bot": "track" },
          sendWhenFlagRaised: false
        }
      ]
    },
    {
      isDangerous: false,
      name: "General",
      appliesTo: ["Answer", "Question"],
      id: 4,
      FlagTypes: [
        {
          id: 15,
          displayName: "Looks Fine",
          reportType: "NoFlag" /* NoFlag */,
          feedbacks: { Smokey: "fp-", Natty: "fp", Guttenberg: "fp", "Generic Bot": "" },
          sendWhenFlagRaised: false
        },
        {
          id: 16,
          displayName: "Needs Editing",
          reportType: "NoFlag" /* NoFlag */,
          feedbacks: { Smokey: "fp-", Natty: "ne", Guttenberg: "fp", "Generic Bot": "" },
          sendWhenFlagRaised: false
        },
        {
          id: 17,
          displayName: "Vandalism",
          reportType: "NoFlag" /* NoFlag */,
          feedbacks: { Smokey: "tp-", Natty: "", Guttenberg: "fp", "Generic Bot": "" },
          sendWhenFlagRaised: false
        }
      ]
    }
  ];
  function getEmptyFlagType(id, belongsTo) {
    return {
      id,
      displayName: "Name",
      reportType: "NoFlag" /* NoFlag */,
      feedbacks: { Smokey: "", Natty: "", Guttenberg: "", "Generic Bot": "" },
      sendWhenFlagRaised: false,
      downvote: false,
      enabled: true,
      belongsTo
    };
  }

  // src/modals/config.ts
  function saveChanges() {
    document.querySelectorAll("#advanced-flagging-configuration-section-general > div > input").forEach((element) => {
      const id = element.id.split("-").pop();
      const checked = element.checked;
      Store.config[id] = checked;
    });
    Store.updateConfiguration();
    displayStacksToast("Configuration saved", "success");
    setTimeout(() => window.location.reload(), 500);
  }
  function resetConfig() {
    Store.unset(Cached.Configuration.key);
    displayStacksToast(
      "Configuration settings have been reset to defaults",
      "success"
    );
    setTimeout(() => window.location.reload(), 500);
  }
  function buildConfigurationOverlay() {
    const modal = modals_exports.makeStacksModal(
      "advanced-flagging-configuration-modal",
      {
        title: {
          text: "AdvancedFlagging configuration"
        },
        body: {
          bodyHtml: getConfigModalBody()
        },
        footer: {
          buttons: [
            {
              element: buttons_exports.makeStacksButton(
                "advanced-flagging-configuration-modal-save",
                "Save changes",
                {
                  primary: true,
                  click: {
                    handler: (event) => {
                      event.preventDefault();
                      saveChanges();
                    }
                  }
                }
              )
            },
            {
              element: buttons_exports.makeStacksButton(
                "advanced-flagging-configuration-modal-cancel",
                "Cancel"
              ),
              hideOnClick: true
            },
            {
              element: buttons_exports.makeStacksButton(
                "advanced-flagging-configuration-modal-reset",
                "Reset",
                {
                  type: ["danger"],
                  click: {
                    handler: resetConfig
                  }
                }
              )
            }
          ]
        },
        fullscreen: true
      }
    );
    modal.firstElementChild?.classList.add("w60");
    document.body.append(modal);
    const resetButton = modal.querySelector(".s-btn__danger");
    attachPopover(
      resetButton,
      "Resets config values to defaults. You will be prompted to reconfigure the script.",
      "right"
    );
  }
  function getGeneralConfigItems() {
    const checkboxes = [
      {
        text: "Open dropdown on hover",
        configValue: Cached.Configuration.openOnHover,
        tooltipText: "Open the dropdown on hover and not on click"
      },
      {
        text: "Watch for manual flags",
        configValue: Cached.Configuration.watchFlags,
        tooltipText: "Send feedback when a flag is raised manually"
      },
      {
        text: "Watch for queue responses",
        configValue: Cached.Configuration.watchQueues,
        tooltipText: "Send feedback after a Looks OK or Recommend Deletion review in the Low Quality Answers queue"
      },
      {
        text: "Disable AdvancedFlagging link",
        configValue: Cached.Configuration.linkDisabled
      },
      {
        text: "Uncheck 'Leave comment' by default",
        configValue: Cached.Configuration.defaultNoComment
      },
      {
        text: "Uncheck 'Flag' by default",
        configValue: Cached.Configuration.defaultNoFlag
      },
      {
        text: "Uncheck 'Downvote' by default",
        configValue: Cached.Configuration.defaultNoDownvote
      },
      {
        text: "Uncheck 'Delete' by default",
        configValue: Cached.Configuration.defaultNoDelete
      },
      {
        text: "Add author's name before comments",
        configValue: Cached.Configuration.addAuthorName,
        tooltipText: "Add the author's name before every comment to make them friendlier"
      },
      {
        text: "Don't send feedback to Smokey by default",
        configValue: new Reporter("Smokey", 0).cacheKey
      },
      {
        text: "Don't send feedback to Natty by default",
        configValue: new Reporter("Natty", 0).cacheKey
      },
      {
        text: "Don't send feedback to Guttenberg by default",
        configValue: new Reporter("Guttenberg", 0).cacheKey
      },
      {
        text: "Don't send feedback to Generic Bot by default",
        configValue: new Reporter("Generic Bot", 0).cacheKey
      },
      {
        text: "Enable dry-run mode",
        configValue: Cached.Configuration.debug
      }
    ].map(({ text, configValue, tooltipText }) => {
      const selected = Store.config[configValue];
      return {
        id: `advanced-flagging-${configValue}`,
        labelConfig: {
          text,
          description: tooltipText
        },
        selected
      };
    });
    const [fieldset] = checkbox_exports.makeStacksCheckboxes(checkboxes);
    fieldset.id = "advanced-flagging-configuration-section-general";
    return fieldset;
  }
  function getAdminConfigItems() {
    const section = document.createElement("fieldset");
    section.id = "advanced-flagging-configuration-section-admin";
    section.classList.add("d-flex", "g8", "fd-column", "fs-body2");
    const header = document.createElement("h2");
    header.innerText = "Admin";
    header.classList.add("flex--item");
    const msInfoDiv = document.createElement("div");
    msInfoDiv.classList.add("flex--item");
    const clearMsInfo = document.createElement("a");
    clearMsInfo.innerText = "Clear metasmoke configuration";
    clearMsInfo.addEventListener("click", () => {
      MetaSmokeAPI.reset();
      displayStacksToast(
        "Successfully cleared MS configuration.",
        "success",
        true
      );
    });
    const clearFkeyDiv = document.createElement("div");
    clearFkeyDiv.classList.add("flex--item");
    const clearChatFkey = document.createElement("a");
    clearChatFkey.innerText = "Clear chat fkey";
    clearChatFkey.addEventListener("click", () => {
      Store.unset(Cached.Fkey);
      displayStacksToast(
        "Successfully cleared chat fkey.",
        "success",
        true
      );
    });
    msInfoDiv.append(clearMsInfo);
    clearFkeyDiv.append(clearChatFkey);
    section.append(msInfoDiv, clearFkeyDiv);
    const chatFkey = Store.get(Cached.Fkey);
    const msAccessTokenText = MetaSmokeAPI.accessToken ? `token: ${MetaSmokeAPI.accessToken.substring(0, 32)}...` : "no access token found in storage";
    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = `This will clear the chat fkey. It will be regenerated the next time feedback is sent to Natty (${chatFkey ? `fkey: ${chatFkey}` : "fkey is not stored in cache"})`;
    attachPopover(clearMsInfo, metasmokeTooltip, "right");
    attachPopover(clearChatFkey, fkeyClearTooltip, "right");
    return section;
  }
  function getConfigModalBody() {
    const div = document.createElement("div");
    const divider = document.createElement("hr");
    divider.classList.add("my16");
    const general = document.createElement("h2");
    general.innerText = "General";
    const admin = document.createElement("h2");
    admin.innerText = "Admin";
    div.append(
      general,
      getGeneralConfigItems(),
      divider,
      admin,
      getAdminConfigItems()
    );
    return div;
  }

  // src/modals/comments/submit.ts
  function saveName(card, flagType) {
    const input = card.querySelector(".s-input__md");
    flagType.displayName = input?.value || "";
  }
  function saveTextareaContent(expandable, flagType) {
    const [flag, low, high] = [
      "text-modflag",
      "comment-lowrep",
      "comment-highrep"
    ].map((id) => expandable.querySelector(`[id*="${id}"]`)).map((textarea) => textarea?.offsetParent ? textarea.value : "");
    flagType.flagText = flag;
    if (low) {
      flagType.comments = { low, high };
    }
  }
  function saveSwfr(expandable, flagType, flagId) {
    const swfrBox = expandable.querySelector('[id*="-send-when-flag-raised-"');
    const sendFeedback = swfrBox?.checked || false;
    flagType.sendWhenFlagRaised = sendFeedback;
    const similar = Store.flagTypes.find((item) => item.sendWhenFlagRaised && item.reportType === flagType.reportType && item.id !== flagId);
    if (!similar || !sendFeedback) return;
    similar.sendWhenFlagRaised = false;
    const similarEl = document.querySelector(
      `[id*="-send-when-flag-raised-${similar.id}"]`
    );
    if (similarEl) {
      similarEl.checked = false;
    }
  }
  function saveDownvote(expandable, flagType) {
    const downvote = expandable.querySelector('[id*="-downvote-post-"');
    flagType.downvote = downvote?.checked || false;
  }
  function saveFeedbacks(expandable, flagType) {
    const feedbacks = [
      "Smokey",
      "Natty",
      "Guttenberg",
      "Generic Bot"
    ].map((name) => {
      const selector = `[name*="-feedback-to-${name.replace(/\s/g, "-")}"]:checked`;
      const radio = expandable.querySelector(`.s-radio${selector}`);
      const feedback = radio?.dataset.feedback ?? "";
      return [name, feedback];
    });
    flagType.feedbacks = Object.fromEntries(feedbacks);
  }
  function submitChanges(element) {
    const wrapper = element.closest(".s-card");
    const expandable = wrapper?.querySelector(".s-expandable");
    const flagId = Number(wrapper?.dataset.flagId);
    if (!flagId || !wrapper || !expandable) {
      displayStacksToast("Failed to save options", "danger", true);
      return;
    }
    const invalids = [...wrapper.querySelectorAll("textarea.is-invalid")].filter((textarea) => textarea.offsetParent !== null);
    if (invalids.length) {
      $(invalids).fadeOut(100).fadeIn(100);
      displayStacksToast("One or more of the textareas are invalid", "danger", true);
      return;
    }
    const flagType = getFlagTypeFromFlagId(flagId);
    if (!flagType) {
      displayStacksToast("Failed to save options", "danger", true);
      return;
    }
    const select = expandable.querySelector("select");
    const newReportType = select?.value;
    if (isSpecialFlag(newReportType, false) && !select?.disabled) {
      displayStacksToast(
        "You cannot use this type of flag!",
        "danger",
        true
      );
      return;
    }
    saveName(wrapper, flagType);
    saveTextareaContent(expandable, flagType);
    flagType.reportType = newReportType;
    saveSwfr(expandable, flagType, flagId);
    saveDownvote(expandable, flagType);
    saveFeedbacks(expandable, flagType);
    Store.updateFlagTypes();
    const hideButton = element.nextElementSibling;
    hideButton.click();
    displayStacksToast("Content saved successfully", "success", true);
  }

  // src/modals/comments/rows.ts
  var flagTypes = flagCategories.flatMap(({ FlagTypes }) => FlagTypes);
  var flagNames = [...new Set(flagTypes.map(({ reportType }) => reportType))];
  function getCharSpan(textarea, contentType) {
    const content = textarea.value;
    const minCharacters = contentType === "flag" ? 10 : 15;
    const maxCharacters = contentType === "flag" ? 500 : 600;
    const charCount = content.length;
    const diff = Math.abs(charCount - maxCharacters);
    const pluralS = diff !== 1 ? "s" : "";
    let spanText;
    if (charCount === 0) spanText = `Enter at least ${minCharacters} characters`;
    else if (charCount < minCharacters) spanText = `${minCharacters - charCount} more to go...`;
    else if (charCount > maxCharacters) spanText = `Too long by ${diff} character${pluralS}`;
    else spanText = `${diff} character${pluralS} left`;
    let classname;
    if (charCount > maxCharacters) classname = "fc-red-400";
    else if (diff >= maxCharacters * 3 / 5) classname = "cool";
    else if (diff >= maxCharacters * 2 / 5) classname = "warm";
    else if (diff >= maxCharacters / 5) classname = "hot";
    else classname = "supernova";
    const isInvalid = classname === "fc-red-400" || /more|at least/.test(spanText);
    textarea.classList[isInvalid ? "add" : "remove"]("is-invalid");
    const span = document.createElement("span");
    span.classList.add("ml-auto", classname);
    span.innerText = spanText;
    return span;
  }
  function toggleTextarea(element, comment, type) {
    const wrapper = element.closest(".s-card")?.querySelector(`[id*="-comment-${comment}rep"]`)?.closest("div.flex--item");
    if (!wrapper) return;
    const row = wrapper.parentElement?.parentElement;
    if (type === "In") {
      row.style.display = "block";
    }
    $(wrapper)[`fade${type}`](400, () => {
      toggleHideIfNeeded(row);
    });
  }
  function getCommentInputs({ id, comments }) {
    const container = document.createElement("div");
    container.classList.add("d-flex", "ai-center", "g16");
    const toggleContainer = document.createElement("div");
    toggleContainer.classList.add("flex--item");
    const toggle = toggle_exports.makeStacksToggle(
      `advanced-flagging-comments-toggle-${id}`,
      { text: "Leave comment" },
      Boolean(comments?.low)
    );
    toggleContainer.append(toggle);
    const [, checkbox] = checkbox_exports.makeStacksCheckboxes([
      {
        id: `advanced-flagging-toggle-highrep-${id}`,
        labelConfig: {
          text: "Add a different comment for high reputation users"
        },
        selected: Boolean(comments?.high),
        disabled: !comments?.low
      }
    ]);
    checkbox.classList.add("fs-body2", "pt1");
    const toggleInput = toggle.querySelector("input");
    const cbInput = checkbox.querySelector("input");
    toggleInput.addEventListener("change", () => {
      const cbInput2 = checkbox.querySelector("input");
      cbInput2.disabled = !toggleInput.checked;
      if (toggleInput.checked) {
        toggleTextarea(toggleInput, "low", "In");
        if (cbInput2.checked) {
          toggleTextarea(toggleInput, "high", "In");
        }
        checkbox.classList.remove("is-disabled");
      } else {
        toggleTextarea(toggleInput, "low", "Out");
        toggleTextarea(toggleInput, "high", "Out");
        checkbox.classList.add("is-disabled");
      }
    });
    cbInput.addEventListener("change", () => {
      toggleTextarea(
        cbInput,
        "high",
        cbInput.checked ? "In" : "Out"
      );
      const lowLabel = cbInput.closest(".s-card")?.querySelector('label[for*="-comment-lowrep-"]');
      lowLabel.innerText = cbInput.checked ? "Comment text for low reputation users" : "Comment text";
    });
    container.append(toggleContainer, wrapInFlexItem(checkbox));
    return container;
  }
  function getTextareas({
    id,
    flagText,
    comments
  }) {
    const flag = textarea_exports.makeStacksTextarea(
      `advanced-flagging-text-modflag-${id}`,
      { value: flagText },
      { text: "Flag text" }
    );
    const lowRep = textarea_exports.makeStacksTextarea(
      `advanced-flagging-comment-lowrep-${id}`,
      { value: comments?.low },
      // if there is a high rep comment, change the wording of the label
      { text: "Comment text" + (comments?.high ? " for low reputation users" : "") }
    );
    const highRep = textarea_exports.makeStacksTextarea(
      `advanced-flagging-comment-highrep-${id}`,
      { value: comments?.high },
      { text: "Comment text for high reputation users" }
    );
    const wrappers = [flag, lowRep, highRep].map((element) => {
      const textarea = element.querySelector("textarea");
      textarea.classList.add("fs-body2");
      textarea.rows = 4;
      const contentType = textarea.id.includes("comment") ? "comment" : "flag";
      const charsLeft = getCharSpan(textarea, contentType);
      textarea.insertAdjacentElement("afterend", charsLeft);
      textarea.addEventListener("keyup", function() {
        const newCharsLeft = getCharSpan(this, contentType);
        this.nextElementSibling?.replaceWith(newCharsLeft);
      });
      const wrapper = wrapInFlexItem(element);
      wrapper.style.display = textarea.value ? "block" : "none";
      return wrapper;
    });
    const container = document.createElement("div");
    container.classList.add("d-flex", "fd-column", "gy16");
    container.append(...wrappers);
    return container;
  }
  function getFlagSelect(id, reportType) {
    const shouldDisable = isSpecialFlag(reportType, false);
    const options = flagNames.map((flagName) => {
      return {
        value: flagName,
        text: getHumanFromDisplayName(flagName) || "(none)",
        selected: flagName === reportType
      };
    });
    const select = select_exports.makeStacksSelect(
      `advanced-flagging-select-flag-${id}`,
      options,
      { disabled: shouldDisable }
    );
    select.className = "d-flex ai-center";
    const sSelect = select.querySelector(".s-select");
    sSelect.style.right = "35px";
    select.querySelector("select")?.classList.add("pl48");
    const flagLabel = document.createElement("label");
    flagLabel.classList.add("fw-bold", "ps-relative", "z-selected", "l12", "fs-body1", "flex--item");
    flagLabel.innerText = "Flag:";
    if (shouldDisable) {
      flagLabel.classList.add("o50");
    }
    return [flagLabel, select];
  }
  function getSelectRow({
    id,
    sendWhenFlagRaised,
    downvote,
    reportType
  }) {
    const [label, select] = getFlagSelect(id, reportType);
    const [, feedback] = checkbox_exports.makeStacksCheckboxes([
      {
        id: `advanced-flagging-send-when-flag-raised-${id}`,
        labelConfig: {
          text: "Send feedback from this flag type when this flag is raised"
        },
        selected: sendWhenFlagRaised
      }
    ]);
    const [, downvoteBox] = checkbox_exports.makeStacksCheckboxes([
      {
        id: `advanced-flagging-downvote-post-${id}`,
        labelConfig: {
          text: "Downvote post"
        },
        selected: downvote
      }
    ]);
    const container = document.createElement("div");
    container.classList.add("d-flex", "ai-center", "gx6");
    container.append(
      label,
      select,
      wrapInFlexItem(downvoteBox)
    );
    if (!isSpecialFlag(reportType)) {
      container.append(wrapInFlexItem(feedback));
    }
    return container;
  }
  function getRadiosForBot(botName, currentFeedback, flagId) {
    const feedbacks = possibleFeedbacks[botName];
    const idedName = botName.replace(/\s/g, "-");
    const name = `advanced-flagging-${flagId}-feedback-to-${idedName}`;
    const config = feedbacks.map((feedback) => {
      return {
        id: `advanced-flagging-${idedName}-feedback-${feedback}-${flagId}`,
        labelConfig: {
          text: feedback || "(none)"
        },
        selected: feedback === currentFeedback
      };
    });
    const [fieldset] = radio_exports.makeStacksRadios(config, name, {
      horizontal: true,
      classes: ["fs-body2"]
    });
    fieldset.querySelectorAll("input").forEach((radio) => {
      const label = radio.nextElementSibling;
      const feedback = label.innerText || "";
      radio.dataset.feedback = feedback === "(none)" ? "" : feedback;
    });
    const description = document.createElement("div");
    description.classList.add("flex--item");
    description.innerText = `Feedback to ${botName}:`;
    fieldset.prepend(description);
    return fieldset;
  }
  function getRadioRow({ id, feedbacks }) {
    const container = document.createElement("div");
    container.classList.add("d-flex", "fd-column", "gy4");
    const feedbackRadios = Object.keys(possibleFeedbacks).map((item) => {
      const botName = item;
      return getRadiosForBot(botName, feedbacks[botName], id);
    }).map((checkbox) => wrapInFlexItem(checkbox));
    container.append(...feedbackRadios);
    return container;
  }

  // src/modals/comments/main.ts
  function toggleHideIfNeeded(parent) {
    const children = parent.firstElementChild?.children;
    const shouldHide = [...children].every((element) => element.style.display === "none");
    parent.style.display = shouldHide ? "none" : "block";
  }
  function getExpandableContent(flagType) {
    const content = [
      getCommentInputs(flagType),
      getTextareas(flagType),
      getSelectRow(flagType),
      getRadioRow(flagType)
    ].map((row) => {
      const flexItem = wrapInFlexItem(row);
      toggleHideIfNeeded(flexItem);
      return flexItem;
    });
    return content;
  }
  function expandableToggled(edit) {
    const save = edit.previousElementSibling;
    const card = edit.closest(".s-card");
    const expandable = card?.querySelector(".s-expandable");
    if (!card || !save || !expandable) return;
    const isExpanded = expandable.classList.contains("is-expanded");
    const flagId = Number(card.dataset.flagId);
    card.firstElementChild?.classList.toggle("jc-space-between");
    if (isExpanded) {
      const name = card.querySelector("h3");
      const input = input_exports.makeStacksInput(
        `advanced-flagging-flag-name-${flagId}`,
        {
          classes: ["s-input__md"],
          value: name?.innerText ?? ""
        }
      );
      name?.replaceWith(input);
    } else {
      const input = card.querySelector(
        `#advanced-flagging-flag-name-${flagId}`
      );
      const h3 = getH3(input?.value ?? "");
      input?.parentElement?.replaceWith(h3);
    }
    const pencil = getIconPath("iconPencil");
    const eyeOff = getIconPath("iconEyeOff");
    const [svg, , text] = [...edit.childNodes];
    svg.classList.toggle("iconPencil");
    svg.classList.toggle("iconEyeOff");
    svg.firstElementChild?.setAttribute("d", isExpanded ? eyeOff : pencil);
    text.textContent = isExpanded ? " Hide" : "Edit";
    isExpanded ? $(save).fadeIn("fast") : $(save).fadeOut("fast");
  }
  function getActionItems(flagId, enabled, expandableId) {
    const save = buttons_exports.makeStacksButton(
      `advanced-flagging-save-flagtype-${flagId}`,
      "Save",
      {
        primary: true,
        classes: ["flex--item"]
      }
    );
    save.style.display = "none";
    save.addEventListener("click", () => submitChanges(save));
    const edit = buttons_exports.makeStacksButton(
      `advanced-flagging-edit-flagtype-${flagId}`,
      "Edit",
      {
        iconConfig: {
          name: "iconPencil",
          path: getIconPath("iconPencil"),
          height: 18,
          width: 18
        },
        classes: ["flex--item"]
      }
    );
    edit.dataset.controller = "s-expandable-control";
    edit.setAttribute("aria-controls", expandableId);
    edit.addEventListener("s-expandable-control:hide", () => expandableToggled(edit));
    edit.addEventListener("s-expandable-control:show", () => expandableToggled(edit));
    const remove = buttons_exports.makeStacksButton(
      `advanced-flagging-remove-flagtype-${flagId}`,
      "Remove",
      {
        type: ["danger"],
        iconConfig: {
          name: "iconTrash",
          path: getIconPath("iconTrash"),
          width: 18,
          height: 18
        },
        classes: ["flex--item"]
      }
    );
    remove.addEventListener("click", () => {
      const wrapper = remove.closest(".s-card");
      const flagId2 = Number(wrapper.dataset.flagId);
      const index = Store.flagTypes.findIndex(({ id }) => id === flagId2);
      Store.flagTypes.splice(index, 1);
      Store.updateFlagTypes();
      $(wrapper).fadeOut("fast", () => {
        const category = wrapper.parentElement;
        wrapper.remove();
        if (category?.childElementCount === 1) {
          $(category).fadeOut("fast", () => category.remove());
        }
      });
      displayStacksToast("Successfully removed flag type", "success", true);
    });
    const toggle = toggle_exports.makeStacksToggle(
      `advanced-flagging-toggle-flagtype-${flagId}`,
      { text: "" },
      enabled
    ).querySelector(".s-toggle-switch");
    toggle.addEventListener("change", () => {
      const wrapper = toggle.closest(".s-card");
      const flagId2 = Number(wrapper?.dataset.flagId);
      const current = getFlagTypeFromFlagId(flagId2);
      if (!current) {
        displayStacksToast("Failed to toggle flag type", "danger", true);
        return;
      }
      current.enabled = toggle.checked;
      Store.updateFlagTypes();
      wrapper?.classList.toggle("s-card__muted");
      displayStacksToast(
        `Successfully ${toggle.checked ? "en" : "dis"}abled flag type`,
        "success",
        true
      );
    });
    return [save, edit, remove, toggle];
  }
  function getH3(displayName) {
    const h3 = document.createElement("h3");
    h3.classList.add("mb0", "mr-auto", "fs-body3");
    h3.innerText = displayName;
    return h3;
  }
  function createFlagTypeDiv(flagType) {
    const {
      id,
      displayName,
      enabled
    } = flagType;
    const card = document.createElement("div");
    card.dataset.flagId = id.toString();
    card.classList.add("s-card", "bs-sm", "py4");
    if (!enabled) {
      card.classList.add("s-card__muted");
    }
    const idedName = displayName.toLowerCase().replace(/\s/g, "");
    const expandableId = `advanced-flagging-${id}-${idedName}`;
    const content = document.createElement("div");
    content.classList.add("d-flex", "ai-center", "sm:fd-column", "sm:ai-start");
    const h3 = getH3(displayName);
    const actions = document.createElement("div");
    actions.classList.add("d-flex", "g8", "ai-center");
    actions.append(...getActionItems(id, enabled, expandableId));
    content.append(h3, actions);
    const expandableContent = getExpandableContent(flagType);
    const expandable = document.createElement("div");
    expandable.classList.add("s-expandable");
    expandable.id = expandableId;
    const expandableDiv = document.createElement("div");
    expandableDiv.classList.add(
      "s-expandable--content",
      "d-flex",
      "fd-column",
      "g16",
      "py12"
    );
    expandableDiv.append(...expandableContent);
    expandable.append(expandableDiv);
    card.append(content, expandable);
    return card;
  }
  function createCategoryDiv(category) {
    const container = document.createElement("div");
    container.classList.add("flex--item");
    const wrapper = document.createElement("div");
    wrapper.classList.add("d-flex", "ai-center", "mb8");
    const header = document.createElement("h2");
    header.classList.add("flex--item", "fs-title", "mb0", "mr-auto", "fw-normal");
    header.textContent = category.name ?? "";
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("d-flex", "g8", "ai-center");
    const addNew = buttons_exports.makeStacksButton(
      `advanced-flagging-add-new-${category.id}`,
      "New",
      {
        type: ["outlined"],
        iconConfig: {
          name: "iconPlus",
          path: getIconPath("iconPlus"),
          height: 18,
          width: 18
        }
      }
    );
    addNew.addEventListener("click", () => {
      const id = Math.max(...Store.flagTypes.map(({ id: id2 }) => id2));
      const flagType = getEmptyFlagType(id + 1, category.name ?? "");
      Store.flagTypes.push(flagType);
      Store.updateFlagTypes();
      const div = createFlagTypeDiv(flagType);
      div.style.display = "none";
      container.append(div);
      $(div).fadeIn({
        complete: () => {
          div.querySelector('[id^="advanced-flagging-edit-flagtype-"]')?.click();
          div.querySelector('[id^="advanced-flagging-flag-name-"]')?.focus();
        }
      });
    });
    const flagTypes2 = Store.flagTypes.filter(({ belongsTo }) => belongsTo === category.name);
    const enabled = flagTypes2.some(({ enabled: enabled2 }) => enabled2);
    const toggle = toggle_exports.makeStacksToggle(
      `advanced-flagging-toggle-category-${category.id}`,
      { text: "" },
      enabled
    ).querySelector(".s-toggle-switch");
    toggle.addEventListener("change", () => {
      container.querySelectorAll('input[id^="advanced-flagging-toggle-flagtype-"]').forEach((box) => {
        box.checked = toggle.checked;
      });
      Store.flagTypes.filter(({ belongsTo }) => belongsTo === category.name).forEach((flag) => {
        flag.enabled = toggle.checked;
        const card = document.querySelector(`[data-flag-id="${flag.id}"]`);
        if (!card) return;
        card.classList[toggle.checked ? "remove" : "add"]("s-card__muted");
      });
      Store.updateFlagTypes();
      displayStacksToast(
        `Successfully ${toggle.checked ? "en" : "dis"}abled all flag types from this category`,
        "success",
        true
      );
    });
    buttonContainer.append(addNew, toggle);
    wrapper.append(header, buttonContainer);
    container.append(wrapper);
    return container;
  }
  function getCommentsModalBody() {
    const container = document.createElement("div");
    container.classList.add("d-flex", "fd-column", "g16");
    const categories = Store.categories.filter(({ name }) => name).map((category) => {
      const { name } = category;
      const div = createCategoryDiv(category);
      const flagTypes2 = Store.flagTypes.filter(({ belongsTo: BelongsTo }) => BelongsTo === name).map((flagType) => createFlagTypeDiv(flagType));
      div.append(...flagTypes2);
      return div;
    }).filter((element) => element.childElementCount > 1);
    container.append(...categories);
    return container;
  }
  function resetFlagTypes() {
    Store.unset(Cached.FlagTypes);
    cacheFlags();
    displayStacksToast(
      "Comments and flags have been reset to defaults",
      "success"
    );
    setTimeout(() => window.location.reload(), 500);
  }
  function setupCommentsAndFlagsModal() {
    const modal = modals_exports.makeStacksModal(
      "advanced-flagging-comments-modal",
      {
        title: {
          text: "AdvancedFlagging: edit comments and flags"
        },
        body: {
          bodyHtml: getCommentsModalBody()
        },
        footer: {
          buttons: [
            {
              element: buttons_exports.makeStacksButton(
                "advanced-flagging-comments-modal-done",
                "I'm done!",
                { primary: true }
              ),
              hideOnClick: true
            },
            {
              element: buttons_exports.makeStacksButton(
                "advanced-flagging-comments-modal-cancel",
                "Cancel"
              ),
              hideOnClick: true
            },
            {
              element: buttons_exports.makeStacksButton(
                "advanced-flagging-configuration-modal-reset",
                "Reset",
                {
                  type: ["danger"],
                  click: {
                    handler: resetFlagTypes
                  }
                }
              )
            }
          ]
        },
        fullscreen: true
      }
    );
    modal.firstElementChild?.classList.add("w80", "sm:w100", "md:w100");
    document.body.append(modal);
  }

  // src/Configuration.ts
  function isSpecialFlag(flagName, checkNoFlag = true) {
    const arrayOfFlags = [
      "PostOther" /* ModFlag */,
      "PlagiarizedContent" /* Plagiarism */
    ];
    if (checkNoFlag) {
      arrayOfFlags.push("NoFlag" /* NoFlag */);
    }
    return arrayOfFlags.includes(flagName);
  }
  function wrapInFlexItem(element) {
    const flexItem = document.createElement("div");
    flexItem.classList.add("flex--item");
    flexItem.append(element);
    return flexItem;
  }
  function cacheFlags() {
    const flagTypesToCache = flagCategories.flatMap((category) => {
      return category.FlagTypes.map((flagType) => {
        return Object.assign(flagType, {
          belongsTo: category.name,
          downvote: !isSpecialFlag(flagType.reportType),
          enabled: true
          // all flags should be enabled by default
        });
      });
    });
    Store.set(Cached.FlagTypes, flagTypesToCache);
    Store.flagTypes.push(...flagTypesToCache);
  }
  function cacheCategories() {
    const categories = flagCategories.map((category) => ({
      isDangerous: category.isDangerous,
      name: category.name,
      appliesTo: category.appliesTo,
      id: category.id
    }));
    Store.set(Cached.FlagCategories, categories);
    Store.categories.push(...categories);
  }
  function setupDefaults() {
    if (!Store.flagTypes.length || !("downvote" in Store.flagTypes[0])) {
      cacheFlags();
    }
    if (!Store.categories.length || !("id" in Store.categories[0])) {
      cacheCategories();
      const linkOnly = getFlagTypeFromFlagId(6);
      const defaultComment = flagCategories[2].FlagTypes[0].comments?.low;
      if (linkOnly && defaultComment && linkOnly.comments?.low.includes("target page is unavailable")) {
        linkOnly.comments.low = defaultComment;
        Store.updateFlagTypes();
      }
    }
    Store.flagTypes.forEach((cachedFlag) => {
      if (cachedFlag.id !== 3 && cachedFlag.id !== 5) return;
      cachedFlag.reportType = "PlagiarizedContent" /* Plagiarism */;
    });
    Store.updateFlagTypes();
    if (!("defaultNoDelete" in Store.config)) {
      Store.config.defaultNoDelete = true;
      Store.updateConfiguration();
    }
  }
  function setupConfiguration() {
    setupDefaults();
    buildConfigurationOverlay();
    setupCommentsAndFlagsModal();
    const configModal = document.querySelector("#advanced-flagging-configuration-modal");
    const commentsModal = document.querySelector("#advanced-flagging-comments-modal");
    const bottomBox = document.querySelector(".site-footer--copyright > ul.-list");
    const configDiv = document.createElement("div");
    configDiv.classList.add("ta-left", "pt6");
    const configLink = document.createElement("a");
    configLink.innerText = "Advanced Flagging configuration";
    configLink.addEventListener("click", () => Stacks.showModal(configModal));
    configDiv.append(configLink);
    const commentsDiv = configDiv.cloneNode();
    const commentsLink = document.createElement("a");
    commentsLink.innerText = "Advanced Flagging: edit comments and flags";
    commentsLink.addEventListener("click", () => Stacks.showModal(commentsModal));
    commentsDiv.append(commentsLink);
    bottomBox?.after(configDiv, commentsDiv);
    const propertyDoesNotExist = !Object.prototype.hasOwnProperty.call(
      Store.config,
      Cached.Configuration.addAuthorName
    );
    if (!propertyDoesNotExist) return;
    displayStacksToast(
      "Please set up AdvancedFlagging before continuing.",
      "info",
      true
    );
    setTimeout(() => {
      Stacks.showModal(configModal);
      const checkbox = document.querySelector(
        "#advanced-flagging-defaultNoDownvote"
      );
      checkbox.checked = true;
    });
  }

  // src/popover.ts
  var noneSpan = document.createElement("span");
  noneSpan.classList.add("o50");
  noneSpan.innerText = "(none)";
  var Popover = class {
    constructor(post) {
      this.post = post;
      this.popover = this.makeMenu();
    }
    popover;
    // do not vote to delete if reportType is one of these:
    excludedTypes = [
      "PlagiarizedContent" /* Plagiarism */,
      "PostOther" /* ModFlag */,
      "NoFlag" /* NoFlag */,
      "PostSpam" /* Spam */,
      "PostOffensive" /* Rude */
    ];
    makeMenu() {
      const menu = menus_exports.makeMenu(
        {
          itemsType: "a",
          navItems: [
            ...this.getReportLinks(),
            ...this.getOptionsRow(),
            { separatorType: "divider" },
            ...this.getSendFeedbackToRow()
          ]
        }
      );
      const arrow = document.createElement("div");
      arrow.classList.add("s-popover--arrow", "s-popover--arrow__tc");
      menu.prepend(arrow);
      setTimeout(() => increaseTooltipWidth(menu));
      return menu;
    }
    // Section #1: Report links
    getReportLinks() {
      const {
        Guttenberg: copypastor
      } = this.post.reporters;
      const { copypastorId, repost, targetUrl } = copypastor ?? {};
      const categories = Store.categories.filter((item) => item.appliesTo?.includes(this.post.type)).map((item) => ({ ...item, FlagTypes: [] }));
      Store.flagTypes.filter(({ reportType, id, belongsTo, enabled }) => {
        const isGuttenbergItem = isSpecialFlag(reportType, false);
        const showGutReport = Boolean(copypastorId) && (id === 4 ? repost : !repost);
        const showOnSo = ["Red flags", "General"].includes(belongsTo) || Page.isStackOverflow;
        return enabled && (isGuttenbergItem ? showGutReport : showOnSo);
      }).forEach((flagType) => {
        const { belongsTo } = flagType;
        const category = categories.find(({ name: Name }) => belongsTo === Name);
        category?.FlagTypes.push(flagType);
      });
      return categories.filter((category) => category.FlagTypes.length).flatMap((category) => {
        const { isDangerous } = category;
        const mapped = category.FlagTypes.flatMap((flagType) => {
          const { displayName } = flagType;
          const flagText = copypastorId && targetUrl ? getFullFlag(flagType, targetUrl, copypastorId) : "";
          const tooltipHtml = this.getTooltipHtml(flagType, flagText);
          const classes = isDangerous ? ["fc-red-500"] : "";
          return {
            text: displayName,
            // unfortunately, danger: IsDangerous won't work
            // since SE uses s-anchors__muted
            blockLink: { selected: false },
            // use this trick instead
            ...classes ? { classes } : {},
            click: {
              handler: () => {
                void this.handleReportLinkClick(flagType, flagText);
              }
            },
            popover: {
              html: tooltipHtml,
              position: "right-start"
            }
          };
        });
        return [...mapped, { separatorType: "divider" }];
      });
    }
    // Section #2: Leave comment, Flag, Downvote
    getOptionsRow() {
      const comments = this.post.element.querySelector(".comment-body");
      const config = [
        ["Leave comment", Cached.Configuration.defaultNoComment],
        ["Flag", Cached.Configuration.defaultNoFlag],
        ["Downvote", Cached.Configuration.defaultNoDownvote],
        ["Delete", Cached.Configuration.defaultNoDelete]
      ];
      return config.filter(([text]) => {
        if (text === "Leave comment") return Page.isStackOverflow;
        else if (text === "Delete") return this.post.canDelete(true);
        return true;
      }).map(([text, cacheKey]) => {
        const uncheck = Store.config[cacheKey] || text === "Leave comment" && comments;
        const idified = text.toLowerCase().replace(" ", "-");
        const id = `advanced-flagging-${idified}-checkbox-${this.post.id}`;
        return {
          checkbox: {
            id,
            labelConfig: {
              text,
              classes: ["pt1", "fs-body1"]
            },
            // !uncheck => whether the checkbox should be checked :)
            selected: !uncheck
          }
        };
      });
    }
    // Section #3: Send feedback to X
    getSendFeedbackToRow() {
      return Object.entries(this.post.getFeedbackBoxes()).map(([name, checkbox]) => {
        return {
          checkbox,
          checkboxOptions: {
            classes: ["px6"]
          },
          popover: {
            html: `Send feedback to ${name}`,
            position: "right-start"
          }
        };
      });
    }
    getTooltipHtml(flagType, flagText) {
      const { reportType, downvote } = flagType;
      const feedbackText = this.getFeedbackSpans(flagType).map((span) => span.outerHTML).join(", ");
      const feedbacks = document.createElement("span");
      feedbacks.innerHTML = feedbackText;
      const tooltipFlagText = this.post.deleted ? "" : flagText;
      const commentText = this.getCommentText(flagType);
      const tooltipCommentText = (this.post.deleted ? "" : commentText) || "";
      const flagName = getFlagToRaise(reportType, this.post.qualifiesForVlq());
      let reportTypeHuman = reportType === "NoFlag" || !this.post.deleted ? getHumanFromDisplayName(flagName) : "";
      if (reportType !== flagName) {
        reportTypeHuman += " (VLQ criteria weren't met)";
      }
      const popoverParent = document.createElement("div");
      Object.entries({
        Flag: reportTypeHuman,
        Comment: tooltipCommentText,
        "Flag text": tooltipFlagText,
        Feedbacks: feedbacks
      }).filter(([, value]) => value).map(([boldText, value]) => createPopoverToOption(boldText, value)).filter(Boolean).forEach((element) => popoverParent.append(element));
      const downvoteWrapper = document.createElement("li");
      const downvoteOrNot = downvote ? "<b>Downvotes</b>" : "Does <b>not</b> downvote";
      downvoteWrapper.innerHTML = `${downvoteOrNot} the post`;
      popoverParent.append(downvoteWrapper);
      if (this.post.canDelete() && !this.post.deleted && !this.excludedTypes.includes(reportType)) {
        const wrapper = document.createElement("li");
        wrapper.innerHTML = "<b>Votes to delete</b> the post";
        popoverParent.append(wrapper);
      }
      return popoverParent.innerHTML;
    }
    getFeedbackSpans(flagType) {
      const spans = Object.entries(flagType.feedbacks).filter(([, feedback]) => feedback).filter(([botName, feedback]) => {
        return Object.values(this.post.reporters).find(({ name }) => name === botName)?.canSendFeedback(feedback);
      }).map(([botName, feedback]) => {
        const feedbackSpan = document.createElement("span");
        const strong = document.createElement("b");
        feedbackSpan.append(strong);
        if (feedback === "track") {
          strong.innerText = "track";
          feedbackSpan.append(" with Generic Bot");
          return feedbackSpan;
        }
        const [
          isGreen,
          isRed,
          isYellow
        ] = [/tp/, /fp/, /naa|ne/].map((regex) => regex.test(feedback));
        let className = "";
        if (isGreen) className = "success";
        else if (isRed) className = "danger";
        else if (isYellow) className = "warning";
        const shouldReport = !Object.values(this.post.reporters).find(({ name }) => name === botName)?.wasReported();
        strong.classList.add(`fc-${className}`);
        strong.innerHTML = shouldReport ? "report" : feedback;
        feedbackSpan.append(` to ${botName}`);
        return feedbackSpan;
      }).filter(String);
      return spans.length ? spans : [noneSpan];
    }
    getCommentText({ comments }) {
      const { addAuthorName } = Store.config;
      const type = (this.post.opReputation || 0) > 50 ? "high" : "low";
      let comment = comments?.[type] || comments?.low;
      if (comment) {
        const sitename = StackExchange.options.site.name || "";
        const siteurl = window.location.hostname;
        const questionId = StackExchange.question.getQuestionId().toString();
        comment = comment.replace(/%SITENAME%/g, sitename).replace(/%SITEURL%/g, siteurl).replace(/%OP%/g, this.post.opName).replace(/%QID%/g, questionId);
      }
      return (comment && addAuthorName ? `${this.post.opName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || null;
    }
    async handleReportLinkClick(flagType, flagText) {
      const { reportType, displayName } = flagType;
      const dropdown = this.post.element.querySelector(".advanced-flagging-popover");
      if (!dropdown) return;
      $(dropdown).fadeOut("fast");
      const spinner = spinner_exports.makeSpinner({
        size: "sm",
        classes: ["advanced-flagging-spinner"]
      });
      const flex = document.createElement("div");
      flex.classList.add("flex--item");
      flex.append(spinner);
      dropdown.closest(".flex--item")?.after(flex);
      this.post.progress = new Progress(spinner);
      this.post.progress.attach();
      const natty = this.post.reporters.Natty;
      if (natty) {
        natty.raisedRedFlag = reportType === "PostSpam" /* Spam */ || reportType === "PostOffensive" /* Rude */;
      }
      const success = await this.post.sendFeedbacks(flagType);
      const old = StackExchange.helpers.removeSpinner;
      StackExchange.helpers.removeSpinner = () => void 0;
      if (!this.post.deleted) {
        let comment = this.getCommentText(flagType);
        const leaveComment = dropdown.querySelector(
          '[id*="-leave-comment-checkbox-"]'
        )?.checked;
        if (!leaveComment && comment) {
          this.post.upvoteSameComments(comment);
          comment = null;
        }
        const [flag, downvote, del] = ["flag", "downvote", "delete"].map((type) => {
          return dropdown.querySelector(
            `[id*="-${type}-checkbox-"]`
          )?.checked || false;
        });
        if (comment) {
          const cProgress = this.post.progress.addItem("Adding comment...");
          try {
            await this.post.comment(comment);
            cProgress.completed();
          } catch (error) {
            console.error(error);
            cProgress.failed();
          }
        }
        if (downvote && flagType.downvote) {
          this.post.downvote();
        }
        if (flag && reportType !== "NoFlag" /* NoFlag */ && (!StackExchange.options.user.isModerator || reportType === "PostSpam" /* Spam */ || reportType === "PostOffensive" /* Rude */)) {
          const humanFlag = getHumanFromDisplayName(reportType);
          const fProgress = this.post.progress.addItem(`Flagging ${humanFlag}...`);
          try {
            await this.post.flag(reportType, flagText);
            fProgress.completed();
            $(this.post.flagged).fadeIn();
          } catch (error) {
            console.error(error);
            fProgress.failed(
              error instanceof Error ? error.message : "see console for more details"
            );
          }
        }
        this.post.progress.updateLocation();
        if (del && this.post.canDelete() && !this.excludedTypes.includes(reportType)) {
          const dProgress = this.post.progress.addItem("Voting to delete...");
          try {
            await this.post.deleteVote();
            dProgress.completed();
          } catch (error) {
            console.error(error);
            dProgress.failed(
              error instanceof Error ? error.message : ""
            );
          }
        }
        this.post.progress.updateLocation();
      }
      await delay(2e3);
      flex.remove();
      this.post.progress.delete();
      StackExchange.helpers.removeSpinner = old;
      if (reportType !== "NoFlag") return;
      if (success) {
        attachPopover(this.post.done, `Performed action ${displayName}`);
        $(this.post.done).fadeIn();
      } else {
        attachPopover(this.post.failed, `Failed to perform action ${displayName}`);
        $(this.post.failed).fadeIn();
      }
    }
  };
  function increaseTooltipWidth(menu) {
    [...menu.querySelectorAll("li")].filter((li) => li.firstElementChild?.classList.contains("s-block-link")).map((reportLink) => reportLink.nextElementSibling).forEach((tooltip) => {
      const textLength = tooltip?.textContent?.length;
      if (!textLength) return;
      tooltip.classList.add(
        textLength > 100 ? "wmn5" : "wmn2"
      );
    });
  }
  function createPopoverToOption(boldText, value) {
    if (!value) return;
    const wrapper = document.createElement("li");
    const bold = document.createElement("strong");
    bold.innerHTML = `${boldText}: `;
    wrapper.append(bold);
    if (Array.isArray(value)) {
      wrapper.append(...value);
    } else {
      wrapper.append(value || noneSpan);
    }
    return wrapper;
  }

  // src/review.ts
  var audit = false;
  async function runOnNewTask(xhr) {
    const regex = /\/review\/(next-task|task-reviewed\/)/;
    if (xhr.status !== 200 || !regex.test(xhr.responseURL) || !document.querySelector("#answer")) return;
    const response = JSON.parse(xhr.responseText);
    audit = response.isAudit;
    if (response.isAudit) return;
    const url = `//stackoverflow.com/a/${response.postId}`;
    await Promise.all([
      MetaSmokeAPI.queryMetaSmokeInternal([url]),
      NattyAPI.getAllNattyIds([response.postId]),
      CopyPastorAPI.storeReportedPosts([url])
    ]);
    const page2 = new Page();
    const post = page2.posts[0];
    while (!isDone) await delay(200);
    post.addIcons();
    document.querySelector(".js-review-submit")?.addEventListener("click", async (event) => {
      const looksGood = document.querySelector(
        "#review-action-LooksGood"
      );
      if (!looksGood?.checked) return;
      const flagType = Store.flagTypes.find(({ id }) => id === 15);
      if (!flagType) return;
      await addProgress(event, flagType);
    }, { once: true });
  }
  function setupReview() {
    const watchReview = Store.config[Cached.Configuration.watchQueues];
    if (!watchReview || !Page.isLqpReviewPage || !Page.isStackOverflow) return;
    addXHRListener(runOnNewTask);
    addXHRListener((xhr) => {
      const regex = /\/posts\/modal\/delete\/\d+/;
      if (xhr.status !== 200 || !regex.test(xhr.responseURL) || !document.querySelector("#answer") || audit) return;
      const submit = document.querySelector("form .js-modal-submit");
      if (!submit) return;
      const [, checkbox] = checkbox_exports.makeStacksCheckboxes(
        [
          {
            id: "advanced-flagging-flag-post",
            labelConfig: {
              text: "Flag post",
              classes: ["mt2"]
            },
            selected: true
          }
        ]
      );
      checkbox.classList.add("flex--item");
      const post = new Page(true).posts[0];
      submit.parentElement?.append(checkbox);
      appendLabelAndBoxes(submit, post);
      submit.addEventListener("click", async (event) => {
        const flagType = getFlagTypeFromFlagId(7);
        if (!flagType) return;
        await addProgress(event, flagType);
      }, { once: true });
    });
  }

  // src/AdvancedFlagging.ts
  function setupStyles() {
    GM_addStyle(`
#popup-flag-post {
    max-width: 700px !important;
}

.advanced-flagging-popover {
    min-width: 10rem !important;
}

#advanced-flagging-comments-modal textarea {
    resize: vertical;
}

#advanced-flagging-snackbar {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}

.advanced-flagging-link:focus {
    outline: none;
}

.advanced-flagging-link {
    outline-style: none !important;
    outline: none !important;
}

.advanced-flagging-link li > a {
    padding-block: 4px;
}

.advanced-flagging-link li > .s-check-control {
    padding-inline: 6px;
    gap: 4px;
}

#advanced-flagging-comments-modal > .s-modal--dialog,
#advanced-flagging-configuration-modal > .s-modal--dialog {
    max-width: 90% !important;
    max-height: 95% !important;
}`);
  }
  var popupWrapper = document.createElement("div");
  popupWrapper.classList.add(
    "fc-white",
    "fs-body3",
    "ta-center",
    "z-modal",
    "ps-fixed",
    "l50"
  );
  popupWrapper.id = "advanced-flagging-snackbar";
  document.body.append(popupWrapper);
  function getFlagToRaise(flagName, qualifiesForVlq) {
    const vlqFlag = "PostLowQuality" /* VLQ */;
    const naaFlag = "AnswerNotAnAnswer" /* NAA */;
    return flagName === vlqFlag ? qualifiesForVlq ? vlqFlag : naaFlag : flagName;
  }
  function displayToaster(text, state) {
    const element = document.createElement("div");
    element.classList.add("p12", `bg-${state}`);
    element.innerText = text;
    element.style.display = "none";
    popupWrapper.append(element);
    $(element).fadeIn();
    window.setTimeout(() => {
      $(element).fadeOut("slow", () => element.remove());
    }, popupDelay);
  }
  function buildFlaggingDialog(post) {
    const dropdown = document.createElement("div");
    dropdown.classList.add(
      "s-popover",
      "s-anchors",
      "s-anchors__default",
      "mt2",
      "c-default",
      "px0",
      "py4",
      "advanced-flagging-popover"
    );
    const actionsMenu = new Popover(post).popover;
    dropdown.append(actionsMenu);
    return dropdown;
  }
  function setPopoverOpening(advancedFlaggingLink, dropdown) {
    const openOnHover = Store.config[Cached.Configuration.openOnHover];
    advancedFlaggingLink.addEventListener(openOnHover ? "mouseover" : "click", (event) => {
      event.stopPropagation();
      if (advancedFlaggingLink.isSameNode(event.target)) {
        $(dropdown).fadeIn("fast");
      }
    });
    if (openOnHover) {
      advancedFlaggingLink.addEventListener("mouseleave", (event) => {
        event.stopPropagation();
        setTimeout(() => $(dropdown).fadeOut("fast"), 200);
      });
    } else {
      window.addEventListener("click", () => $(dropdown).fadeOut("fast"));
    }
  }
  var page = new Page();
  function setupPostPage() {
    if (Page.isLqpReviewPage) return;
    page = new Page();
    if (page.name && page.name !== "Question" && page.name !== "Staging Ground") {
      page.posts.forEach((post) => post.addIcons());
      return;
    }
    const linkDisabled = Store.config[Cached.Configuration.linkDisabled];
    page.posts.forEach((post) => {
      const { id, done, failed, flagged, element } = post;
      post.watchForFlags();
      if (linkDisabled) {
        post.addIcons();
        return;
      }
      const advancedFlaggingLink = buttons_exports.makeStacksButton(
        `advanced-flagging-link-${id}`,
        "Advanced Flagging",
        {
          type: ["link"],
          classes: ["advanced-flagging-link"]
        }
      );
      const iconLocation = element.querySelector(".js-post-menu")?.firstElementChild;
      const flexItem = document.createElement("div");
      flexItem.classList.add("flex--item");
      flexItem.append(advancedFlaggingLink);
      iconLocation?.append(flexItem);
      const dropDown = buildFlaggingDialog(post);
      advancedFlaggingLink.append(dropDown);
      iconLocation?.append(done, failed, flagged);
      post.addIcons();
      setPopoverOpening(advancedFlaggingLink, dropDown);
    });
  }
  var isDone = false;
  function Setup() {
    void Promise.all([
      MetaSmokeAPI.setup(),
      MetaSmokeAPI.queryMetaSmokeInternal(),
      CopyPastorAPI.getAllCopyPastorIds(),
      NattyAPI.getAllNattyIds()
    ]).then(() => {
      setupPostPage();
      setupStyles();
      setupConfiguration();
      addXHRListener(() => {
        setupPostPage();
        setTimeout(setupPostPage, 55);
        setTimeout(setupPostPage, 200);
      });
      isDone = true;
    });
  }
  setupReview();
  interceptXhr();
  if (document.hasFocus()) {
    Setup();
  } else {
    window.addEventListener("focus", () => Setup(), { once: true });
  }
})();
