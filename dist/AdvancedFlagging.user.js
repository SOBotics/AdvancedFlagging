// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      1.3.11
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
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@userscripters/stacks-helpers/dist/avatar.js
  var require_avatar = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/avatar.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeAvatar = void 0;
      var makeAvatar = (options = {}, elementType = "a") => {
        const { size = "", href = "", src, classes = [] } = options;
        const avatar = document.createElement(elementType);
        avatar.classList.add("s-avatar", ...classes);
        if (size) {
          avatar.classList.add(`s-avatar__${size}`);
        }
        if (href && avatar instanceof HTMLAnchorElement) {
          avatar.href = href;
        }
        const img = document.createElement("img");
        img.classList.add("s-avatar--image");
        img.src = src;
        avatar.append(img);
        return avatar;
      };
      exports.makeAvatar = makeAvatar;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/badges.js
  var require_badges = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/badges.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeBling = exports.makeStacksBadge = void 0;
      var makeStacksBadge = (options) => {
        const { classes = [], blingColor = "", type = "", size = "", text, icon } = options;
        const badge = document.createElement("span");
        badge.classList.add("s-badge", ...classes);
        if (type) {
          const typeClasses = type.map((name) => `s-badge__${name}`);
          badge.classList.add(...typeClasses);
        }
        if (size) {
          badge.classList.add(`s-badge__${size}`);
        }
        if (icon) {
          badge.classList.add("s-badge__icon");
          badge.append(icon, " ");
        }
        if (blingColor) {
          const bling = (0, exports.makeBling)("span", blingColor, text);
          badge.append(bling);
        } else {
          badge.append(text);
        }
        return badge;
      };
      exports.makeStacksBadge = makeStacksBadge;
      var makeBling = (elementType, color, count) => {
        const element = document.createElement(elementType);
        element.classList.add("s-award-bling", `s-award-bling__${color}`);
        element.innerText = count;
        return element;
      };
      exports.makeBling = makeBling;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/banners.js
  var require_banners = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/banners.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksBanner = void 0;
      var index_1 = require_dist();
      var makeStacksBanner = (options) => {
        const { style, text, important = false, pinned = false, icon, classes = [] } = options;
        const banner = document.createElement("aside");
        banner.classList.add("s-banner", `s-banner__${style}`, "js-notice-banner", ...classes);
        banner.setAttribute("role", "alert");
        if (important) {
          banner.classList.add("s-banner__important");
        }
        if (pinned) {
          banner.classList.add("is-pinned");
        }
        const container = document.createElement("div");
        container.classList.add("d-flex", "flex__center", "jc-space-between", "s-banner--container");
        container.setAttribute("role", "alertdialog");
        const mainContainer = document.createElement("div");
        mainContainer.classList.add("d-flex", "g8");
        if (icon) {
          const iconContainer = document.createElement("div");
          iconContainer.classList.add("flex--item");
          const [name, path] = icon;
          const [svgIcon] = index_1.Icons.makeStacksIcon(name, path, { width: 18 });
          iconContainer.append(svgIcon);
          mainContainer.append(iconContainer);
        }
        const textContainer = document.createElement("div");
        textContainer.classList.add("d-flex", "ai-center");
        const textElement = document.createElement("p");
        textElement.classList.add("m0");
        textElement.append(text);
        textContainer.append(textElement);
        mainContainer.append(textContainer);
        const closeContainer = document.createElement("div");
        closeContainer.classList.add("flex--item", "ml-auto", "myn8");
        const closeButton = document.createElement("a");
        closeButton.classList.add("p8", "s-btn", "d-flex", "flex__center", "fc-dark", "js-notice-close");
        closeButton.setAttribute("role", "status");
        const [svgClose] = index_1.Icons.makeStacksIcon("iconClearSm", "M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z", { classes: ["m0"] });
        closeButton.append(svgClose);
        closeContainer.append(closeButton);
        container.append(mainContainer, closeContainer);
        banner.append(container);
        return banner;
      };
      exports.makeStacksBanner = makeStacksBanner;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/breadcrumb.js
  var require_breadcrumb = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/breadcrumb.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksBreadcrumb = void 0;
      var index_1 = require_dist();
      var makeStacksBreadcrumb = (items, options) => {
        const { classes = [] } = options;
        const nav = document.createElement("nav");
        nav.classList.add("s-breadcrumbs", "mb6", "sm:mb2", ...classes);
        items.forEach((item, index) => {
          const { label, href = "#" } = item;
          const breadcrumbItem = document.createElement("div");
          breadcrumbItem.classList.add("s-breadcrumbs--item");
          const breadcrumbLink = document.createElement("a");
          breadcrumbLink.classList.add("s-breadcrumbs--link");
          breadcrumbLink.href = href;
          if (Array.isArray(label)) {
            const [name, path] = label;
            const [icon] = index_1.Icons.makeStacksIcon(name, path, {
              classes: ["mtn2"],
              width: 18
            });
            breadcrumbLink.append(icon);
          } else {
            breadcrumbLink.append(label);
          }
          breadcrumbItem.append(breadcrumbLink);
          if (index !== items.length - 1) {
            const [dividerIcon] = index_1.Icons.makeStacksIcon("iconArrowRightAltSm", "m4.38 4.62 1.24-1.24L9.24 7l-3.62 3.62-1.24-1.24L6.76 7 4.38 4.62Z", {
              classes: ["s-breadcrumbs--divider"],
              width: 13,
              height: 14
            });
            breadcrumbItem.append(dividerIcon);
          }
          nav.append(breadcrumbItem);
        });
        return nav;
      };
      exports.makeStacksBreadcrumb = makeStacksBreadcrumb;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/button-groups.js
  var require_button_groups = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/button-groups.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksButtonGroup = void 0;
      var makeStacksButtonGroup = (buttons, options = {}) => {
        const { classes = [] } = options;
        const container = document.createElement("div");
        container.classList.add("s-btn-group", ...classes);
        buttons.forEach((buttonConfig) => {
          const { text, selected = false, count, form = false } = buttonConfig;
          const button = document.createElement("button");
          button.classList.add("s-btn", "s-btn__muted", "s-btn__outlined");
          button.setAttribute("role", "button");
          button.append(text);
          if (selected) {
            button.classList.add("is-selected");
          }
          if (count) {
            const badge = document.createElement("span");
            badge.classList.add("s-btn--badge");
            const btnNumber = document.createElement("span");
            btnNumber.classList.add("s-btn--number");
            btnNumber.textContent = count.toString();
            badge.append(btnNumber);
            button.append(" ", badge);
          }
          if (form) {
            const formContainer = document.createElement("form");
            formContainer.classList.add("s-btn-group--container");
            formContainer.append(button);
            container.append(formContainer);
          } else {
            container.append(button);
          }
        });
        return container;
      };
      exports.makeStacksButtonGroup = makeStacksButtonGroup;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/checkbox.js
  var require_checkbox = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/checkbox.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksCheckboxes = void 0;
      var index_1 = require_dist();
      var makeStacksCheckboxes = (checkboxes, options) => {
        return index_1.Input.makeStacksRadiosOrCheckboxes(checkboxes, "checkbox", options);
      };
      exports.makeStacksCheckboxes = makeStacksCheckboxes;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/indicator.js
  var require_indicator = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/indicator.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeIndicator = void 0;
      var makeIndicator = (options = {}) => {
        const { type = "", text = "", hiddenText = "", classes = [] } = options;
        const indicator = document.createElement("div");
        indicator.classList.add("s-activity-indicator", ...classes);
        if (type) {
          indicator.classList.add(`s-activity-indicator__${type}`);
        }
        if (text) {
          indicator.append(text);
        }
        if (hiddenText) {
          const hiddenElement = document.createElement("div");
          hiddenElement.classList.add("v-visible-sr");
          hiddenElement.innerText = hiddenText;
          indicator.append(hiddenElement);
        }
        return indicator;
      };
      exports.makeIndicator = makeIndicator;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/input.js
  var require_input = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/input.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksRadiosOrCheckboxes = exports.makeStacksInput = void 0;
      var index_1 = require_dist();
      var makeStacksInput = (id, inputOptions = {}, labelOptions) => {
        var _a;
        const { value = "", classes = [], placeholder = "", title, isSearch: isSearch2 } = inputOptions;
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
        if (isSearch2) {
          input.classList.add("s-input__search");
          const [searchIcon] = index_1.Icons.makeStacksIcon("iconSearch", "m18 16.5-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z", {
            classes: ["s-input-icon", "s-input-icon__search"],
            width: 18
          });
          inputParent.append(searchIcon);
        }
        inputParent.prepend(input);
        if (labelOptions) {
          (_a = labelOptions.parentClasses || (labelOptions.parentClasses = [])) === null || _a === void 0 ? void 0 : _a.push("flex--item");
          const label = index_1.Label.makeStacksLabel(id, labelOptions);
          const container = document.createElement("div");
          container.classList.add("d-flex", "gy4", "fd-column");
          container.append(label, inputParent);
          return container;
        }
        return inputParent;
      };
      exports.makeStacksInput = makeStacksInput;
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
      exports.makeStacksRadiosOrCheckboxes = makeStacksRadiosOrCheckboxes;
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
        const label = index_1.Label.makeStacksLabel(id, labelConfig);
        container.append(input, label);
        return container;
      };
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/label.js
  var require_label = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/label.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksLabel = void 0;
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
      exports.makeStacksLabel = makeStacksLabel;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/links.js
  var require_links = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/links.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeLink = void 0;
      var makeLink = (options = {}) => {
        const { href = "", isButton = false, type = "", blockLink = null, text, click, classes = [] } = options;
        const anchor = document.createElement(isButton ? "button" : "a");
        anchor.classList.add("s-link", ...classes);
        anchor.innerText = text;
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
      exports.makeLink = makeLink;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/menus.js
  var require_menus = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/menus.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeMenu = void 0;
      var index_1 = require_dist();
      var makeMenu2 = (options = {}) => {
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
              li.innerText = separatorText;
            menu.append(li);
            return;
          } else if ("checkbox" in navItem) {
            const { checkbox, checkboxOptions } = navItem;
            const [, input] = index_1.Checkbox.makeStacksCheckboxes([checkbox], checkboxOptions);
            li.append(input);
            menu.append(li);
            return;
          }
          (_a = navItem.classes) === null || _a === void 0 ? void 0 : _a.push(...childrenClasses);
          li.setAttribute("role", "menuitem");
          const item = index_1.Links.makeLink(Object.assign({
            isButton: itemsType === "button",
            blockLink: {}
          }, navItem));
          li.append(item);
          menu.append(li);
        });
        return menu;
      };
      exports.makeMenu = makeMenu2;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/navigation.js
  var require_navigation = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/navigation.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeNavigation = void 0;
      var makeNavigation = (navItems, type, selectIndex = 0) => {
        const navigation = document.createElement("nav");
        const ul = document.createElement("ul");
        ul.classList.add("s-navigation");
        if (type === "button") {
          ul.setAttribute("role", "tablist");
          ul.setAttribute("data-controller", "s-navigation-tablist");
        }
        const children = navItems.map((item, i) => createNavItem(item, type, i === selectIndex));
        ul.append(...children);
        navigation.append(ul);
        return navigation;
      };
      exports.makeNavigation = makeNavigation;
      var createNavItem = ({ id, text, ariaControls }, type, select) => {
        const li = document.createElement("li");
        const wrapper = document.createElement(type);
        wrapper.id = id;
        wrapper.innerText = text;
        wrapper.classList.add("s-navigation--item");
        if (select)
          wrapper.classList.add("is-selected");
        if (type === "button") {
          wrapper.setAttribute("role", "tab");
          wrapper.type = "button";
          if (ariaControls)
            wrapper.setAttribute("aria-controls", ariaControls);
        }
        li.append(wrapper);
        return li;
      };
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/notices.js
  var require_notices = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/notices.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksNotice = void 0;
      var index_1 = require_dist();
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
          const [svgIcon] = index_1.Icons.makeStacksIcon(name, path, { width: 18 });
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
      exports.makeStacksNotice = makeStacksNotice;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/pagination.js
  var require_pagination = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/pagination.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makePagination = void 0;
      var makePagination = (options) => {
        const { first, middle, last, selectedPage = 1, generator, nextButtonHref = "#", classes = [] } = options;
        const container = document.createElement("div");
        container.classList.add("s-pagination", ...classes);
        const clear = document.createElement("span");
        clear.classList.add("s-pagination--item", "s-pagination--item__clear");
        clear.textContent = "...";
        const nextButton = document.createElement("a");
        nextButton.classList.add("s-pagination--item");
        nextButton.textContent = "Next";
        nextButton.href = nextButtonHref;
        container.append(...first.map((page) => createPage(page, generator(page), page === selectedPage)), clear.cloneNode(true));
        if (middle) {
          container.append(...middle.map((page) => createPage(page, generator(page), page === selectedPage)), clear.cloneNode(true));
        }
        container.append(...last.map((page) => createPage(page, generator(page), page === selectedPage)), nextButton);
        return container;
      };
      exports.makePagination = makePagination;
      var createPage = (page, url, isSelected) => {
        const element = document.createElement(isSelected ? "span" : "a");
        element.classList.add("s-pagination--item");
        element.textContent = page.toString();
        if (element instanceof HTMLAnchorElement) {
          element.href = url;
        } else {
          element.classList.add("is-selected");
        }
        return element;
      };
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/progress.js
  var require_progress = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/progress.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeSteppedBar = exports.makeSegmentedBar = exports.makeCircularBar = exports.makeBaseBar = void 0;
      var index_1 = require_dist();
      var makeBaseBar = (id, options) => {
        const { width, coloring, classes = [] } = options;
        const bar = document.createElement("div");
        bar.classList.add("s-progress--bar");
        bar.style.setProperty("width", `${width.toString()}%`);
        bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", width.toString());
        const progress = document.createElement("div");
        progress.classList.add("s-progress", ...classes);
        progress.id = id;
        if (coloring) {
          progress.classList.add(`s-progress__${coloring}`);
        }
        progress.append(bar);
        return progress;
      };
      exports.makeBaseBar = makeBaseBar;
      var makeCircularBar = (id, options) => {
        const { width, classes = [], size } = options;
        const progress = document.createElement("div");
        progress.id = id;
        progress.classList.add("s-progress", "s-progress__circular", ...classes);
        progress.style.setProperty("--s-progress-value", `${(width / 100).toString()}`);
        if (size) {
          progress.classList.add(`s-progress__${size}`);
        }
        const bar = document.createElement("svg");
        bar.classList.add("s-progress-bar");
        bar.setAttribute("viewBox", "0 0 32 32");
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", width.toString());
        const circle = document.createElement("circle");
        circle.setAttribute("cx", "16");
        circle.setAttribute("cy", "16");
        circle.setAttribute("r", "14");
        bar.append(circle, circle.cloneNode(true));
        progress.innerHTML = bar.outerHTML;
        return progress;
      };
      exports.makeCircularBar = makeCircularBar;
      var makeSegmentedBar = (id, options) => {
        const { width, segments, coloring, classes = [] } = options;
        const progress = document.createElement("div");
        progress.id = id;
        progress.classList.add("s-progress", "s-progress__segmented", ...classes);
        if (coloring) {
          progress.classList.add(`s-progress__${coloring}`);
        }
        const bar = document.createElement("div");
        bar.classList.add("s-progress--bar");
        bar.style.setProperty("width", `${width.toString()}%"`);
        bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", width.toString());
        const ol = document.createElement("ol");
        ol.classList.add("s-progress--segments");
        for (let i = 0; i < segments + 1; i++) {
          const li = document.createElement("li");
          ol.append(li);
        }
        progress.append(bar, ol);
        return progress;
      };
      exports.makeSegmentedBar = makeSegmentedBar;
      var makeSteppedBar = (id, items, options = {}) => {
        const { classes = [] } = options;
        const progress = document.createElement("div");
        progress.id = id;
        progress.classList.add("s-progress", "s-progress__stepped", ...classes);
        items.forEach((item, index) => {
          const { status, label, classes: classes2 = [], href = "#" } = item;
          const step = document.createElement("div");
          step.classList.add("s-progress--step", ...classes2);
          if (status) {
            step.classList.add(`is-${status}`);
          }
          const stop = document.createElement("a");
          stop.classList.add("s-progress--stop");
          stop.href = href;
          if (status === "complete") {
            const [checkmark] = index_1.Icons.makeStacksIcon("iconCheckmarkSm", "M13 3.41 11.59 2 5 8.59 2.41 6 1 7.41l4 4 8-8Z");
            stop.append(checkmark);
          }
          step.append(stop);
          const rightBar = document.createElement("div");
          rightBar.classList.add("s-progress--bar", "s-progress--bar__right");
          const leftBar = document.createElement("div");
          leftBar.classList.add("s-progress--bar", "s-progress--bar__left");
          if (index === 0) {
            step.append(rightBar);
          } else if (index === items.length - 1) {
            step.append(leftBar);
          } else {
            step.append(rightBar, leftBar);
          }
          const labelEl = document.createElement("a");
          labelEl.classList.add("s-progress--label");
          labelEl.href = href;
          labelEl.textContent = label;
          step.append(labelEl);
          progress.append(step);
        });
        return progress;
      };
      exports.makeSteppedBar = makeSteppedBar;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/popover.js
  var require_popover = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/popover.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksPopover = void 0;
      var makeStacksPopover = (id, controller, options) => {
        const { referenceSelector, toggleClass, placement, toggle, autoShow, hideOnOutsideClick, manualArrowPositioning, callbacks: callbacks2, contentHtml, classes = [] } = options;
        controller.setAttribute("data-controller", "popover");
        controller.setAttribute("aria-controls", id);
        if (referenceSelector) {
          controller.setAttribute("data-s-popover-reference-selector", referenceSelector);
        }
        if (placement) {
          controller.setAttribute("data-s-popover-placement", placement);
        }
        if (toggleClass) {
          controller.setAttribute("data-s-popover-toggle-class", toggleClass);
        }
        if (toggle) {
          controller.setAttribute("data-action", "s-popover#toggle");
        }
        if (autoShow) {
          controller.setAttribute("data-s-popover-auto-show", "true");
        }
        if (hideOnOutsideClick) {
          controller.setAttribute("data-s-popover-hide-on-outside-click", hideOnOutsideClick);
        }
        if (callbacks2) {
          Object.entries(callbacks2).map(([name, callback]) => [`s-popover:${name}`, callback]).forEach(([name, callback]) => {
            const eventName = name;
            const handler = callback;
            controller.addEventListener(eventName, handler);
          });
        }
        controller.addEventListener("s-popover:show", callbacks2.show);
        const popover = document.createElement("div");
        popover.id = id;
        popover.setAttribute("role", "menu");
        popover.classList.add("s-popover", ...classes);
        const arrow = document.createElement("div");
        arrow.classList.add("s-popover--arrow");
        if (manualArrowPositioning) {
          arrow.classList.add(`s-popover--arrow__${manualArrowPositioning}`);
        }
        popover.append(arrow, contentHtml);
        return popover;
      };
      exports.makeStacksPopover = makeStacksPopover;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/radio.js
  var require_radio = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/radio.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksRadios = void 0;
      var index_1 = require_dist();
      var makeStacksRadios = (radios, groupName, options) => {
        radios.forEach((radio) => {
          radio.name = groupName;
        });
        return index_1.Input.makeStacksRadiosOrCheckboxes(radios, "radio", options);
      };
      exports.makeStacksRadios = makeStacksRadios;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/select.js
  var require_select = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/select.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toggleValidation = exports.makeStacksSelect = void 0;
      var index_1 = require_dist();
      var makeStacksSelect = (id, items, options = {}, labelOptions) => {
        const { disabled = false, size, validation, classes = [] } = options;
        const container = document.createElement("div");
        container.classList.add("d-flex", "gy4", "fd-column");
        if (labelOptions) {
          (labelOptions.parentClasses || (labelOptions.parentClasses = [])).push("flex--item");
          const label = index_1.Label.makeStacksLabel(id, labelOptions);
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
          (0, exports.toggleValidation)(container, validation);
        }
        return container;
      };
      exports.makeStacksSelect = makeStacksSelect;
      var toggleValidation = (container, state) => {
        var _a, _b;
        container.classList.remove("has-success", "has-warning", "has-error");
        (_a = container.querySelector(".s-input-icon")) === null || _a === void 0 ? void 0 : _a.remove();
        if (!state)
          return;
        container.classList.add(`has-${state}`);
        const [name, path] = index_1.Icons.validationIcons[state];
        const [icon] = index_1.Icons.makeStacksIcon(name, path, {
          classes: ["s-input-icon"],
          width: 18
        });
        (_b = container.querySelector(".s-select")) === null || _b === void 0 ? void 0 : _b.append(icon);
      };
      exports.toggleValidation = toggleValidation;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/spinner.js
  var require_spinner = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/spinner.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeSpinner = void 0;
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
      exports.makeSpinner = makeSpinner;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/tags.js
  var require_tags = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/tags.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksTag = void 0;
      var index_1 = require_dist();
      var makeStacksTag = (options) => {
        const { classes = [], name, href = "#", moderator = false, selected = false, size = "", muted = false, required = false, sponsor = null, dismissable = false, onDismiss = null, watched = false, ignored = false } = options;
        const tag = document.createElement("a");
        tag.classList.add("s-tag", ...classes);
        tag.href = href;
        tag.textContent = name;
        if (moderator) {
          tag.classList.add("s-tag__moderator");
        }
        if (selected) {
          tag.classList.add("is-selected");
        }
        if (size) {
          tag.classList.add(`s-tag__${size}`);
        }
        if (muted) {
          tag.classList.add("s-tag__muted");
        }
        if (required) {
          tag.classList.add("s-tag__required");
        }
        if (watched) {
          tag.classList.add("s-tag__watched");
        } else if (ignored) {
          tag.classList.add("s-tag__ignored");
        }
        if (sponsor) {
          const { imgUrl, width = 18, height = 16, alt = "" } = sponsor;
          const sponsorImg = document.createElement("img");
          sponsorImg.classList.add("s-tag--sponsor");
          sponsorImg.src = imgUrl;
          sponsorImg.width = width;
          sponsorImg.height = height;
          sponsorImg.alt = alt;
          tag.prepend(" ", sponsorImg);
        }
        if (dismissable) {
          const [iconClearSm] = index_1.Icons.makeStacksIcon("iconClearSm", "M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z");
          const dismiss = document.createElement("span");
          dismiss.classList.add("s-tag--dismiss");
          dismiss.append(iconClearSm);
          if (onDismiss) {
            dismiss.addEventListener("click", (event) => {
              const span = event.target;
              onDismiss(span === null || span === void 0 ? void 0 : span.closest(".s-tag"), event);
            });
          }
          tag.append(" ", dismiss);
        }
        return tag;
      };
      exports.makeStacksTag = makeStacksTag;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/textarea.js
  var require_textarea = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/textarea.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toggleValidation = exports.makeStacksTextarea = void 0;
      var index_1 = require_dist();
      var makeStacksTextarea = (id, textareaOptions = {}, labelOptions) => {
        const { value = "", classes = [], placeholder = "", title = "", size, validation } = textareaOptions;
        const textareaParent = document.createElement("div");
        textareaParent.classList.add("d-flex", "fd-column", "gy4", ...classes);
        if (labelOptions) {
          const label = index_1.Label.makeStacksLabel(id, labelOptions);
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
          (0, exports.toggleValidation)(textareaParent, validation);
        }
        return textareaParent;
      };
      exports.makeStacksTextarea = makeStacksTextarea;
      var toggleValidation = (textareaParent, validation) => {
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
        const [iconName, iconPath] = index_1.Icons.validationIcons[state];
        const [icon] = index_1.Icons.makeStacksIcon(iconName, iconPath, {
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
      exports.toggleValidation = toggleValidation;
      var createAndAppendDescription = (description, appendTo) => {
        const message = document.createElement("p");
        message.classList.add("flex--item", "s-input-message");
        message.innerHTML = description;
        appendTo.append(message);
      };
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/toggle.js
  var require_toggle = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/toggle.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksToggle = void 0;
      var index_1 = require_dist();
      var makeStacksToggle = (id, labelOptions, on = false, ...classes) => {
        const container = document.createElement("div");
        container.classList.add("d-flex", "g8", "ai-center", ...classes);
        const label = index_1.Label.makeStacksLabel(id, labelOptions);
        const toggle = document.createElement("input");
        toggle.id = id;
        toggle.classList.add("s-toggle-switch");
        toggle.type = "checkbox";
        toggle.checked = on;
        container.append(label, toggle);
        return container;
      };
      exports.makeStacksToggle = makeStacksToggle;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/usercards.js
  var require_usercards = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/usercards.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeMinimalUserCard = exports.makeSmallUserCard = exports.makeBaseUserCard = exports.makeFullUserCard = void 0;
      var _1 = require_dist();
      var makeFullUserCard = (options) => {
        const { avatar, user: { name = "", href = "#", reputation = "1", badges, labels, role, location: location2, tags }, userType, classes = [] } = options;
        const userCard = document.createElement("div");
        userCard.classList.add("s-user-card", "s-user-card__full", ...classes);
        const avatarContainer = getDefaultUserCardAvatar(avatar, href, 48);
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("s-user-card--info");
        const link = document.createElement("a");
        link.classList.add("s-user-card--link", "d-flex", "g4");
        link.href = href;
        const username2 = document.createElement("div");
        username2.classList.add("flex--item");
        username2.innerHTML = name;
        link.append(username2);
        if (labels) {
          const elements = getLabelElements(labels);
          link.append(...elements);
        }
        const awards = getUserAwards(reputation, badges);
        infoContainer.append(link, awards);
        if (role) {
          const roleEl = document.createElement("div");
          roleEl.classList.add("s-user-card--role");
          roleEl.innerHTML = role;
          infoContainer.append(roleEl);
        }
        if (location2) {
          const locationEl = document.createElement("div");
          locationEl.classList.add("s-user-card--location");
          locationEl.innerHTML = location2;
          infoContainer.append(locationEl);
        }
        if (tags) {
          const userTags = document.createElement("div");
          userTags.classList.add("s-user-card--tags", "d-flex", "g4");
          const tagsEls = tags.map((config) => {
            var _a;
            (_a = config.classes) === null || _a === void 0 ? void 0 : _a.push("flex--item");
            if (!(config === null || config === void 0 ? void 0 : config.size)) {
              config.size = "xs";
            }
            return _1.Tag.makeStacksTag(config);
          });
          userTags.append(...tagsEls);
          infoContainer.append(userTags);
        }
        userCard.append(avatarContainer, infoContainer);
        if (userType) {
          const userTypeEl = document.createElement("div");
          userTypeEl.classList.add("s-user-card--type");
          userTypeEl.innerHTML = userType;
          userCard.append(userTypeEl);
        }
        return userCard;
      };
      exports.makeFullUserCard = makeFullUserCard;
      var makeBaseUserCard = (options) => {
        const { avatar, time = "", user: { name = "", href = "#", reputation = "1", badges, labels }, deleted, highlight, userType, classes = [] } = options;
        const userCard = document.createElement("div");
        userCard.classList.add("s-user-card", ...classes);
        if (highlight) {
          userCard.classList.add("s-user-card__highlighted");
        }
        const timeEl = document.createElement("time");
        timeEl.classList.add("s-user-card--time");
        timeEl.innerHTML = time;
        const avatarContainer = getDefaultUserCardAvatar(avatar, href, 32, deleted);
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("s-user-card--info");
        const link = document.createElement(deleted ? "div" : "a");
        link.classList.add("s-user-card--link", "d-flex", "g4");
        if (labels) {
          const nameDiv = document.createElement("div");
          nameDiv.classList.add("flex--item");
          nameDiv.innerHTML = name;
          link.append(nameDiv, ...getLabelElements(labels));
        } else {
          link.innerHTML = name;
        }
        infoContainer.append(link);
        userCard.append(timeEl, avatarContainer, infoContainer);
        if (deleted || link instanceof HTMLDivElement) {
          userCard.classList.add("s-user-card__deleted");
          return userCard;
        }
        link.href = href;
        const awards = getUserAwards(reputation, badges);
        infoContainer.append(awards);
        if (userType) {
          const userTypeEl = document.createElement("div");
          userTypeEl.classList.add("s-user-card--type");
          userTypeEl.innerText = userType;
          userCard.append(userTypeEl);
        }
        return userCard;
      };
      exports.makeBaseUserCard = makeBaseUserCard;
      var makeSmallUserCard = (options) => {
        const { avatar, user: { badges, href = "#", reputation = "1" }, classes = [] } = options;
        const userCard = document.createElement("div");
        userCard.classList.add("s-user-card", "s-user-card__small", ...classes);
        const avatarContainer = getDefaultUserCardAvatar(avatar, href, 24);
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("s-user-card--info");
        const awards = getUserAwards(reputation, badges);
        infoContainer.append(awards);
        userCard.append(avatarContainer, infoContainer);
        return userCard;
      };
      exports.makeSmallUserCard = makeSmallUserCard;
      var makeMinimalUserCard = (options) => {
        const { avatar, time = "", user: { name = "", href = "#", reputation = "1" }, deleted, classes = [] } = options;
        const userCard = document.createElement("div");
        userCard.classList.add("s-user-card", "s-user-card__minimal", ...classes);
        if (deleted) {
          userCard.classList.add("s-user-card__deleted");
        }
        if (avatar) {
          const avatarContainer = getDefaultUserCardAvatar(avatar, href, "", deleted);
          userCard.prepend(avatarContainer);
        }
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("s-user-card--info");
        const link = document.createElement(deleted ? "div" : "a");
        link.classList.add("s-user-card--link");
        link.innerHTML = name;
        if (link instanceof HTMLAnchorElement) {
          link.href = href;
        }
        const awards = getUserAwards(reputation);
        infoContainer.append(link, !deleted ? awards : "");
        const timeEl = document.createElement("time");
        timeEl.classList.add("s-user-card--time");
        timeEl.innerText = time;
        userCard.append(infoContainer, timeEl);
        return userCard;
      };
      exports.makeMinimalUserCard = makeMinimalUserCard;
      var getUserAwards = (reputation, badges) => {
        const awards = document.createElement("ul");
        awards.classList.add("s-user-card--awards");
        const repContainer = document.createElement("li");
        repContainer.classList.add("s-user-card--rep");
        repContainer.innerHTML = reputation;
        awards.append(repContainer);
        if (badges) {
          const badgesEls = Object.entries(badges).map(([color, count]) => {
            const badgeColor = color;
            return _1.Badges.makeBling("li", badgeColor, count.toString());
          });
          awards.append(...badgesEls);
        }
        return awards;
      };
      var getLabelElements = (labels) => {
        return labels.map((config) => {
          var _a;
          (_a = config.classes) === null || _a === void 0 ? void 0 : _a.push("flex--item");
          if (!config.size) {
            config.size = "xs";
          }
          return _1.Badges.makeStacksBadge(config);
        });
      };
      var getDefaultUserCardAvatar = (config, defaultHref, defaultSize, deleted) => {
        var _a;
        (_a = config === null || config === void 0 ? void 0 : config.classes) === null || _a === void 0 ? void 0 : _a.push("s-user-card--avatar");
        if (config && !config.size && defaultSize) {
          config.size = defaultSize;
        }
        if (config && !config.href) {
          config.href = defaultHref;
        }
        return _1.Avatar.makeAvatar(config, deleted ? "div" : "a");
      };
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/buttons/index.js
  var require_buttons = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/buttons/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksButton = void 0;
      var index_1 = require_dist();
      var makeStacksButton = (id, text, options = {}) => {
        const { title, type = [], primary = false, loading = false, selected = false, disabled = false, badge, size, iconConfig, click, classes = [] } = options;
        const btn = document.createElement("button");
        btn.id = id;
        btn.textContent = text;
        btn.classList.add("s-btn", ...type.map((name) => `s-btn__${name}`), ...classes);
        btn.type = "button";
        btn.setAttribute("role", "button");
        btn.setAttribute("aria-label", title || text);
        if (primary) {
          btn.classList.add("s-btn__primary");
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
          const [icon] = index_1.Icons.makeStacksIcon(name, path, { width, height });
          btn.prepend(icon, " ");
        }
        if (click) {
          const { handler, options: options2 } = click;
          btn.addEventListener("click", handler, options2);
        }
        return btn;
      };
      exports.makeStacksButton = makeStacksButton;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/icons/index.js
  var require_icons = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/icons/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksIcon = exports.validationIcons = void 0;
      exports.validationIcons = {
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
      exports.makeStacksIcon = makeStacksIcon;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/modals/index.js
  var require_modals = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/modals/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeStacksModal = void 0;
      var index_1 = require_dist();
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
        const [iconClear] = index_1.Icons.makeStacksIcon("iconClear", "M15 4.41 13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9 15 4.41Z", { width: 18 });
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
      exports.makeStacksModal = makeStacksModal;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/notifications/index.js
  var require_notifications = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/notifications/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.showToast = exports.hideToast = exports.toggleToast = exports.makeStacksToast = void 0;
      var index_1 = require_icons();
      var makeStacksToast = (id, text, { buttons = [], classes = [], msgClasses = [], type = "none", important = false } = {}) => {
        const wrap = document.createElement("div");
        wrap.classList.add("s-toast", ...classes);
        wrap.setAttribute("aria-hidden", "true");
        wrap.setAttribute("role", "alertdialog");
        wrap.setAttribute("aria-labelledby", "notice-message");
        wrap.id = id;
        const aside = document.createElement("aside");
        aside.classList.add("s-notice", "p8", "pl16");
        if (type !== "none")
          aside.classList.add(`s-notice__${type}`);
        if (important)
          aside.classList.add("s-notice__important");
        const msgWrap = document.createElement("div");
        msgWrap.classList.add("d-flex", "gx16", "ai-center", "jc-space-between", ...msgClasses);
        const message = document.createElement("div");
        message.classList.add("flex--item");
        message.textContent = text;
        const btnWrap = document.createElement("div");
        btnWrap.classList.add("d-flex");
        const dismissBtn = document.createElement("button");
        dismissBtn.type = "button";
        dismissBtn.classList.add("s-btn", "s-notice--btn");
        dismissBtn.setAttribute("aria-label", "Dismiss");
        buttons.push(dismissBtn);
        const [dismissIcon] = (0, index_1.makeStacksIcon)("iconClearSm", "M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41z");
        dismissBtn.append(dismissIcon);
        btnWrap.append(...buttons);
        msgWrap.append(message, btnWrap);
        aside.append(msgWrap);
        wrap.append(aside);
        return wrap;
      };
      exports.makeStacksToast = makeStacksToast;
      var toggleToast = (target, show) => {
        const toast = typeof target === "string" ? document.querySelector(target) : target;
        if (!toast)
          throw new ReferenceError(`missing toast: ${target}`);
        const isShown = (toast === null || toast === void 0 ? void 0 : toast.getAttribute("aria-hidden")) !== "true";
        toast.setAttribute("aria-hidden", (show !== void 0 ? !show : isShown).toString());
        return toast;
      };
      exports.toggleToast = toggleToast;
      var hideToast = (target, hideFor) => {
        const toast = (0, exports.toggleToast)(target, false);
        if (hideFor)
          setTimeout(() => (0, exports.showToast)(toast), hideFor * 1e3);
      };
      exports.hideToast = hideToast;
      var showToast = (target, showFor) => {
        const toast = (0, exports.toggleToast)(target, true);
        if (showFor)
          setTimeout(() => (0, exports.hideToast)(toast), showFor * 1e3);
      };
      exports.showToast = showToast;
    }
  });

  // node_modules/@userscripters/stacks-helpers/dist/index.js
  var require_dist = __commonJS({
    "node_modules/@userscripters/stacks-helpers/dist/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Notifications = exports.Modals = exports.Icons = exports.Buttons = exports.UserCard = exports.Toggle = exports.Textarea = exports.Tag = exports.Spinner = exports.Select = exports.Radio = exports.Popover = exports.Progress = exports.Pagination = exports.Notice = exports.Navigation = exports.Menu = exports.Links = exports.Label = exports.Input = exports.Indicator = exports.Checkbox = exports.ButtonGroup = exports.Breadcrumb = exports.Banners = exports.Badges = exports.Avatar = void 0;
      var Avatar = require_avatar();
      exports.Avatar = Avatar;
      var Badges = require_badges();
      exports.Badges = Badges;
      var Banners = require_banners();
      exports.Banners = Banners;
      var Breadcrumb = require_breadcrumb();
      exports.Breadcrumb = Breadcrumb;
      var ButtonGroup = require_button_groups();
      exports.ButtonGroup = ButtonGroup;
      var Checkbox3 = require_checkbox();
      exports.Checkbox = Checkbox3;
      var Indicator = require_indicator();
      exports.Indicator = Indicator;
      var Input3 = require_input();
      exports.Input = Input3;
      var Label = require_label();
      exports.Label = Label;
      var Links = require_links();
      exports.Links = Links;
      var Menu2 = require_menus();
      exports.Menu = Menu2;
      var Navigation = require_navigation();
      exports.Navigation = Navigation;
      var Notice = require_notices();
      exports.Notice = Notice;
      var Pagination = require_pagination();
      exports.Pagination = Pagination;
      var Progress = require_progress();
      exports.Progress = Progress;
      var Popover = require_popover();
      exports.Popover = Popover;
      var Radio2 = require_radio();
      exports.Radio = Radio2;
      var Select2 = require_select();
      exports.Select = Select2;
      var Spinner = require_spinner();
      exports.Spinner = Spinner;
      var Tag = require_tags();
      exports.Tag = Tag;
      var Textarea2 = require_textarea();
      exports.Textarea = Textarea2;
      var Toggle3 = require_toggle();
      exports.Toggle = Toggle3;
      var UserCard = require_usercards();
      exports.UserCard = UserCard;
      var Buttons5 = require_buttons();
      exports.Buttons = Buttons5;
      var Icons = require_icons();
      exports.Icons = Icons;
      var Modals4 = require_modals();
      exports.Modals = Modals4;
      var Notifications = require_notifications();
      exports.Notifications = Notifications;
    }
  });

  // src/UserscriptTools/Store.ts
  var Store = class _Store {
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

  // src/shared.ts
  var possibleFeedbacks = {
    Smokey: ["tpu-", "tp-", "fp-", "naa-", ""],
    Natty: ["tp", "fp", "ne", ""],
    Guttenberg: ["tp", "fp", ""],
    "Generic Bot": ["track", ""]
  };
  var FlagNames = /* @__PURE__ */ ((FlagNames2) => {
    FlagNames2["Spam"] = "PostSpam";
    FlagNames2["Rude"] = "PostOffensive";
    FlagNames2["NAA"] = "AnswerNotAnAnswer";
    FlagNames2["VLQ"] = "PostLowQuality";
    FlagNames2["NoFlag"] = "NoFlag";
    FlagNames2["Plagiarism"] = "PlagiarizedContent";
    FlagNames2["ModFlag"] = "PostOther";
    return FlagNames2;
  })(FlagNames || {});
  var username = document.querySelector(
    'a[href^="/users/"] div[title]'
  )?.title || "";
  var popupDelay = 4 * 1e3;
  var isStackOverflow = /^https:\/\/stackoverflow.com/.test(location.href);
  var isQuestionPage = /\/questions\/\d+.*/.test(location.href);
  var isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(location.href);
  var Cached = {
    Configuration: {
      key: "Configuration",
      openOnHover: "openOnHover",
      defaultNoFlag: "defaultNoFlag",
      defaultNoComment: "defaultNoComment",
      defaultNoDownvote: "defaultNoDownvote",
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
  var getIconPath = (name) => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, "text/html");
    const path = parsed.body.querySelector("path");
    return path.getAttribute("d") || "";
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
      //$parent: addParent ? $(parent) : $()
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
  var getCachedConfigBotKey = (botName) => {
    const sanitised = botName.replace(/\s/g, "");
    return `defaultNo${sanitised}`;
  };
  function getSentMessage(success, feedback, bot) {
    return success ? `Feedback ${feedback} sent to ${bot}` : `Failed to send feedback ${feedback} to ${bot}`;
  }
  async function delay(milliseconds) {
    return await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
  var callbacks = [];
  function addXHRListener(callback) {
    callbacks.push(callback);
  }
  function interceptXhr() {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener("load", () => {
        callbacks.forEach((cb) => cb(this));
      }, false);
      open.apply(this, arguments);
    };
  }
  var cachedConfiguration = Store.get(Cached.Configuration.key) || {};
  var updateConfiguration = () => Store.set(Cached.Configuration.key, cachedConfiguration);
  var debugMode = cachedConfiguration[Cached.Configuration.debug];
  var cachedFlagTypes = Store.get(Cached.FlagTypes) || [];
  var updateFlagTypes = () => Store.set(Cached.FlagTypes, cachedFlagTypes);
  var cachedCategories = Store.get(Cached.FlagCategories) || [];
  function getFullFlag(flagType, target, postId) {
    const placeholderTarget = /\$TARGET\$/g;
    const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
    const content = flagType.flagText;
    if (!content) return null;
    const copypastorLink = `https://copypastor.sobotics.org/posts/${postId}`;
    return content.replace(placeholderTarget, `https:${target}`).replace(placeholderCopypastorLink, copypastorLink);
  }
  function getFlagTypeFromFlagId(flagId) {
    return cachedFlagTypes.find(({ id }) => id === flagId) || null;
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

  // src/UserscriptTools/ChatApi.ts
  var ChatApi = class _ChatApi {
    static getExpiryDate() {
      const expiryDate = /* @__PURE__ */ new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      return expiryDate;
    }
    chatRoomUrl;
    soboticsRoomId;
    constructor(chatUrl = "https://chat.stackoverflow.com") {
      this.chatRoomUrl = chatUrl;
      this.soboticsRoomId = 111347;
    }
    getChannelFKey(roomId) {
      const expiryDate = _ChatApi.getExpiryDate();
      return Store.getAndCache(Cached.Fkey, async () => {
        try {
          const channelPage = await this.getChannelPage(roomId);
          const parsed = new DOMParser().parseFromString(channelPage, "text/html");
          const fkeyInput = parsed.querySelector('input[name="fkey"]');
          const fkey = fkeyInput?.value || "";
          return fkey;
        } catch (error) {
          console.error(error);
          throw new Error("Failed to get chat fkey");
        }
      }, expiryDate);
    }
    getChatUserId() {
      return StackExchange.options.user.userId;
    }
    async sendMessage(message, bot, roomId = this.soboticsRoomId) {
      let numTries = 0;
      const feedback = message.split(" ").pop() || "";
      const makeRequest = async () => {
        return await this.sendRequestToChat(message, roomId);
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
        return getSentMessage(true, feedback, bot);
      };
      if (!await makeRequest()) {
        return onFailure();
      }
      return getSentMessage(true, feedback, bot);
    }
    async sendRequestToChat(message, roomId) {
      const url = `${this.chatRoomUrl}/chats/${roomId}/messages/new`;
      if (debugMode) {
        console.log("Send", message, `to ${roomId} via`, url);
        return Promise.resolve(true);
      }
      const fkey = await this.getChannelFKey(roomId);
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
    getChannelPage(roomId) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: `${this.chatRoomUrl}/rooms/${roomId}`,
          onload: ({ status, responseText }) => {
            status === 200 ? resolve(responseText) : reject();
          },
          onerror: () => reject()
        });
      });
    }
  };

  // src/UserscriptTools/CopyPastorAPI.ts
  var copypastorServer = "https://copypastor.sobotics.org";
  var copypastorKey = "wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj";
  var CopyPastorAPI = class _CopyPastorAPI {
    constructor(answerId) {
      this.answerId = answerId;
      const {
        copypastorId = 0,
        repost = false,
        target_url: targetUrl = ""
      } = _CopyPastorAPI.copypastorIds[this.answerId] || {};
      this.copypastorId = copypastorId;
      this.repost = repost;
      this.targetUrl = targetUrl;
      this.icon = this.getIcon();
    }
    static copypastorIds = {};
    name = "Guttenberg";
    copypastorId;
    repost;
    targetUrl;
    icon;
    static async getAllCopyPastorIds() {
      if (!isStackOverflow) return;
      const postUrls = getAllPostIds(false, true);
      if (!postUrls.length) return;
      try {
        await this.storeReportedPosts(postUrls);
      } catch (error) {
        displayToaster("Could not connect to CopyPastor.", "danger");
        console.error(error);
      }
    }
    static storeReportedPosts(postUrls) {
      const url = `${copypastorServer}/posts/findTarget?url=${postUrls.join(",")}`;
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: 2e3,
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
      if (!this.copypastorId) {
        return Promise.resolve("");
      }
      const successMessage = getSentMessage(true, feedback, this.name);
      const failureMessage = getSentMessage(false, feedback, this.name);
      const payload = {
        post_id: this.copypastorId,
        feedback_type: feedback,
        username,
        link: `//chat.stackoverflow.com/users/${chatId}`,
        key: copypastorKey
      };
      const data = Object.entries(payload).map((item) => item.join("=")).join("&");
      return new Promise((resolve, reject) => {
        const url = `${copypastorServer}/feedback/create`;
        if (debugMode) {
          console.log("Feedback to Guttenberg via", url, data);
          reject("Didn't send feedback: debug mode");
        }
        GM_xmlhttpRequest({
          method: "POST",
          url,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data,
          onload: ({ status }) => {
            status === 200 ? resolve(successMessage) : reject(failureMessage);
          },
          onerror: () => reject(failureMessage)
        });
      });
    }
    getIcon() {
      if (!this.copypastorId) return;
      const icon = createBotIcon(
        "Guttenberg",
        `${copypastorServer}/posts/${this.copypastorId}`
      );
      return icon;
    }
  };

  // src/UserscriptTools/GenericBotAPI.ts
  var genericBotKey = "Cm45BSrt51FR3ju";
  var genericBotSuccess = "Post tracked with Generic Bot";
  var genericBotFailure = "Server refused to track the post";
  var GenericBotAPI = class {
    answerId;
    name = "Generic Bot";
    constructor(answerId) {
      this.answerId = answerId;
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
    sendFeedback(trackPost) {
      const flaggerName = encodeURIComponent(username || "");
      if (!trackPost || !isStackOverflow || !flaggerName) {
        return Promise.resolve("");
      }
      const answer = document.querySelector(`#answer-${this.answerId} .js-post-body`);
      const answerBody = answer?.innerHTML.trim() || "";
      const contentHash = this.computeContentHash(answerBody);
      const url = "https://so.floern.com/api/trackpost.php";
      const payload = {
        key: genericBotKey,
        postId: this.answerId,
        contentHash,
        flagger: flaggerName
      };
      const data = Object.entries(payload).map((item) => item.join("=")).join("&");
      if (debugMode) {
        console.log("Track post via", url, payload);
        return Promise.resolve("");
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
              reject(genericBotFailure);
            }
            resolve(genericBotSuccess);
          },
          onerror: () => reject(genericBotFailure)
        });
      });
    }
  };

  // src/UserscriptTools/MetaSmokeAPI.ts
  var import_stacks_helpers = __toESM(require_dist(), 1);
  var metasmokeKey = "0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0";
  var metasmokeApiFilter = "GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ";
  var metasmokeReportedMessage = "Post reported to Smokey";
  var metasmokeFailureMessage = "Failed to report post to Smokey";
  var MetaSmokeAPI = class _MetaSmokeAPI {
    constructor(postId, postType, deleted) {
      this.postId = postId;
      this.postType = postType;
      this.deleted = deleted;
      this.icon = this.getIcon();
    }
    static accessToken;
    static isDisabled = Store.get(Cached.Metasmoke.disabled) || false;
    static appKey = metasmokeKey;
    static metasmokeIds = {};
    name = "Smokey";
    icon;
    static reset() {
      Store.unset(Cached.Metasmoke.disabled);
      Store.unset(Cached.Metasmoke.userKey);
    }
    static async setup() {
      _MetaSmokeAPI.accessToken = await _MetaSmokeAPI.getUserKey();
    }
    static getMetasmokeTokenPopup() {
      const codeInput = import_stacks_helpers.Input.makeStacksInput(
        "advanced-flagging-metasmoke-token-input",
        { placeholder: "Enter the code here" },
        {
          text: "Metasmoke access token",
          description: "Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:"
        }
      );
      const authModal = import_stacks_helpers.Modals.makeStacksModal(
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
                element: import_stacks_helpers.Buttons.makeStacksButton(
                  "advanced-flagging-submit-code",
                  "Submit",
                  { primary: true }
                )
              },
              {
                element: import_stacks_helpers.Buttons.makeStacksButton(
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
        popup.querySelector(".s-btn__primary")?.addEventListener("click", () => {
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
    static async queryMetaSmokeInternal(urls) {
      if (_MetaSmokeAPI.isDisabled) return;
      const urlString = urls || getAllPostIds(true, true).join(",");
      if (!urlString) return;
      const parameters = Object.entries({
        urls: urlString,
        key: _MetaSmokeAPI.appKey,
        per_page: 1e3,
        filter: metasmokeApiFilter
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
      }
    }
    static getQueryUrl(postId, postType) {
      const path = postType === "Answer" ? "a" : "questions";
      return `//${window.location.hostname}/${path}/${postId}`;
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
    getSmokeyId() {
      return _MetaSmokeAPI.metasmokeIds[this.postId] || 0;
    }
    async reportRedFlag() {
      const smokeyId = this.getSmokeyId();
      const urlString = _MetaSmokeAPI.getQueryUrl(this.postId, this.postType);
      const { appKey, accessToken } = _MetaSmokeAPI;
      const url = "https://metasmoke.erwaysoftware.com/api/w/post/report";
      const data = {
        post_link: urlString,
        key: appKey,
        token: accessToken
      };
      if (debugMode) {
        console.log("Report post via", url, data);
        throw new Error("Didn't report post: in debug mode");
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
        console.error(`Failed to report post ${smokeyId} to Smokey`, requestResponse);
        throw new Error(metasmokeFailureMessage);
      }
      return metasmokeReportedMessage;
    }
    async sendFeedback(feedback) {
      if (_MetaSmokeAPI.isDisabled) return "";
      const { appKey, accessToken } = _MetaSmokeAPI;
      const smokeyId = this.getSmokeyId();
      if (!smokeyId && feedback === "tpu-" && !this.deleted) {
        return await this.reportRedFlag();
      } else if (!accessToken || !smokeyId) {
        return "";
      }
      const data = {
        type: feedback,
        key: appKey,
        token: accessToken
      };
      const url = `//metasmoke.erwaysoftware.com/api/w/post/${smokeyId}/feedback`;
      if (debugMode) {
        console.log("Feedback to Smokey via", url, data);
        throw new Error("Didn't send feedback: debug mode");
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
        console.error(`Failed to send feedback for ${smokeyId} to Smokey`, feedbackResponse);
        throw new Error(getSentMessage(false, feedback, this.name));
      }
      return getSentMessage(true, feedback, this.name);
    }
    getIcon() {
      const smokeyId = this.getSmokeyId();
      if (!smokeyId) return;
      const icon = createBotIcon(
        "Smokey",
        `//metasmoke.erwaysoftware.com/post/${smokeyId}`
      );
      return icon;
    }
  };

  // src/UserscriptTools/NattyApi.ts
  var dayMillis = 1e3 * 60 * 60 * 24;
  var nattyFeedbackUrl = "https://logs.sobotics.org/napi-1.1/api/stored/";
  var nattyReportedMessage = "Post reported to Natty";
  var NattyAPI = class _NattyAPI {
    constructor(answerId, questionDate, answerDate, deleted) {
      this.answerId = answerId;
      this.questionDate = questionDate;
      this.answerDate = answerDate;
      this.deleted = deleted;
      this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
      this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
      this.icon = this.getIcon();
    }
    static nattyIds = [];
    chat = new ChatApi();
    feedbackMessage;
    reportMessage;
    name = "Natty";
    icon;
    static getAllNattyIds(ids) {
      const postIds = (ids || getAllPostIds(false, false)).join(",");
      if (!isStackOverflow || !postIds) return Promise.resolve();
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: `${nattyFeedbackUrl}${postIds}`,
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
      return _NattyAPI.nattyIds.includes(this.answerId);
    }
    canBeReported() {
      const answerAge = this.getDaysBetween(this.answerDate, /* @__PURE__ */ new Date());
      const daysPostedAfterQuestion = this.getDaysBetween(this.questionDate, this.answerDate);
      return this.answerDate > this.questionDate && answerAge < 30 && daysPostedAfterQuestion > 30 && !this.deleted;
    }
    async reportNaa(feedback) {
      if (!this.canBeReported() || feedback !== "tp") return "";
      await this.chat.sendMessage(this.reportMessage, this.name);
      return nattyReportedMessage;
    }
    getDaysBetween(questionDate, answerDate) {
      return (answerDate.valueOf() - questionDate.valueOf()) / dayMillis;
    }
    async sendFeedback(feedback) {
      return this.wasReported() ? await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`, this.name) : await this.reportNaa(feedback);
    }
    getIcon() {
      if (!this.wasReported()) return;
      const icon = createBotIcon(
        "Natty",
        `//sentinel.erwaysoftware.com/posts/aid/${this.answerId}`
      );
      return icon;
    }
  };

  // src/UserscriptTools/sotools.ts
  var currentUrl = new URL(location.href);
  var isNatoPage = currentUrl.pathname.startsWith("/tools/new-answers-old-questions");
  var isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);
  var isSearch = currentUrl.pathname.startsWith("/search");
  function getExistingElements() {
    if (!isQuestionPage && !isNatoPage && !isFlagsPage && !isSearch) return;
    let elements;
    if (isNatoPage) {
      elements = document.querySelectorAll(".default-view-post-table > tbody > tr");
    } else if (isFlagsPage) {
      elements = document.querySelectorAll(".flagged-post");
    } else if (isQuestionPage) {
      elements = document.querySelectorAll(".question, .answer");
    } else if (isSearch) {
      elements = document.querySelectorAll(".js-search-results .s-post-summary");
    } else {
      elements = [];
    }
    return [...elements].filter((element) => !element.querySelector(".advanced-flagging-link, .advanced-flagging-icon"));
  }
  function getPage() {
    if (isFlagsPage) return "Flags";
    else if (isNatoPage) return "NATO";
    else if (isQuestionPage) return "Question";
    else if (isSearch) return "Search";
    else return "";
  }
  function getPostType(element) {
    return element.classList.contains("question") || element.querySelector(".question-hyperlink, .s-link") ? "Question" : "Answer";
  }
  function getPostId(postNode, postType) {
    const href = postNode.querySelector(
      ".answer-hyperlink, .question-hyperlink, .s-link"
    )?.href;
    const postId = (
      // questions page: get value of data-questionid/data-answerid
      postNode.dataset.questionid || postNode.dataset.answerid || (postType === "Answer" ? new URL(href || "").pathname.split("/").pop() : href?.split("/")[4])
    );
    return Number(postId);
  }
  function addIconToPost(element, locationSelector, postType, postId, qDate, aDate) {
    const iconLocation = element.querySelector(locationSelector);
    const reporters = {
      Smokey: new MetaSmokeAPI(postId, postType, false)
    };
    const date = /* @__PURE__ */ new Date();
    if (postType === "Answer" && isStackOverflow) {
      reporters.Natty = new NattyAPI(postId, qDate || date, aDate || date, false);
      reporters.Guttenberg = new CopyPastorAPI(postId);
      reporters["Generic Bot"] = new GenericBotAPI(postId);
    }
    const icons = getIconsFromReporters(reporters);
    iconLocation?.append(...icons);
    return reporters;
  }
  function addIcons() {
    getExistingElements()?.forEach((element) => {
      const postType = getPostType(element);
      addIconToPost(
        element,
        "a.question-hyperlink, a.answer-hyperlink, .s-link",
        postType,
        getPostId(element, postType)
      );
    });
  }
  function parseAuthorReputation(reputationDiv) {
    if (!reputationDiv) return 0;
    let reputationText = reputationDiv.innerText.replace(/,/g, "");
    if (!reputationText) return 0;
    if (reputationText.includes("k")) {
      reputationText = reputationText.replace(/\.\d/g, "").replace(/k/, "");
      return Number(reputationText) * 1e3;
    } else {
      return Number(reputationText);
    }
  }
  function getPostCreationDate(postNode, postType) {
    const post = postType === "Question" ? document.querySelector(".question") : postNode;
    const dateElements = post?.querySelectorAll(".user-info .relativetime");
    const authorDateElement = Array.from(dateElements || []).pop();
    return new Date(authorDateElement?.title || "");
  }
  function qualifiesForVlq(score, created) {
    const dayMillis2 = 1e3 * 60 * 60 * 24;
    return (/* @__PURE__ */ new Date()).valueOf() - created.valueOf() < dayMillis2 && score <= 0;
  }
  function getIcon(svg, classname) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("flex--item");
    wrapper.style.display = "none";
    svg.classList.add(classname);
    wrapper.append(svg);
    return wrapper;
  }
  function getActionIcons() {
    return [
      ["Checkmark", "fc-green-500"],
      ["Clear", "fc-red-500"],
      ["Flag", "fc-red-500"]
    ].map(([svg, classname]) => getIcon(getSvg(`icon${svg}`), classname));
  }
  function parseQuestionsAndAnswers(callback) {
    getExistingElements()?.forEach((element) => {
      const postType = getPostType(element);
      const page = getPage();
      if (!page) return;
      const iconLocation = element.querySelector(".js-post-menu")?.firstElementChild;
      const postId = getPostId(element, postType);
      const questionTime = getPostCreationDate(element, "Question");
      const answerTime = getPostCreationDate(element, "Answer");
      const score = Number(element.dataset.score) || 0;
      const reputationEl = [...element.querySelectorAll(
        ".user-info .reputation-score"
      )].pop();
      const opReputation = parseAuthorReputation(reputationEl);
      const lastNameEl = [...element.querySelectorAll(".user-info .user-details a")].pop();
      const opName = lastNameEl?.textContent?.trim() || "";
      const deleted = element.classList.contains("deleted-answer");
      const raiseVlq = qualifiesForVlq(score, answerTime);
      const [done, failed, flagged] = getActionIcons();
      callback({
        postType,
        element,
        iconLocation,
        postId,
        questionTime,
        answerTime,
        opReputation,
        opName,
        deleted,
        raiseVlq,
        // icons
        done,
        failed,
        flagged
      });
    });
  }
  function getAllPostIds(includeQuestion, urlForm) {
    const elementToUse = getExistingElements();
    if (!elementToUse) return [];
    return elementToUse.map((item) => {
      const postType = getPostType(item);
      if (!includeQuestion && postType === "Question") return "";
      const postId = getPostId(item, postType);
      const type = postType === "Answer" ? "a" : "questions";
      return urlForm ? `//${window.location.hostname}/${type}/${postId}` : postId;
    }).filter(String);
  }

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
      FlagTypes: [
        {
          id: 6,
          displayName: "Link Only",
          reportType: "PostLowQuality" /* VLQ */,
          comments: {
            low: `A link to a solution is welcome, but please ensure your answer is useful without it: [add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will have some idea what it is and why it is there, then quote the most relevant part of the page you are linking to in case the target page is unavailable. [Answers that are little more than a link may be deleted.](${deletedAnswers})`
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

  // src/modals/config.ts
  var import_stacks_helpers2 = __toESM(require_dist(), 1);
  function saveChanges() {
    document.querySelectorAll("#advanced-flagging-configuration-section-general > div > input").forEach((element) => {
      const id = element.id.split("-").pop();
      const checked = element.checked;
      cachedConfiguration[id] = checked;
    });
    updateConfiguration();
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
    const modal = import_stacks_helpers2.Modals.makeStacksModal(
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
              element: import_stacks_helpers2.Buttons.makeStacksButton(
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
              element: import_stacks_helpers2.Buttons.makeStacksButton(
                "advanced-flagging-configuration-modal-cancel",
                "Cancel"
              ),
              hideOnClick: true
            },
            {
              element: import_stacks_helpers2.Buttons.makeStacksButton(
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
        text: "Add author's name before comments",
        configValue: Cached.Configuration.addAuthorName,
        tooltipText: "Add the author's name before every comment to make them friendlier"
      },
      {
        text: "Don't send feedback to Smokey by default",
        configValue: getCachedConfigBotKey("Smokey")
      },
      {
        text: "Don't send feedback to Natty by default",
        configValue: getCachedConfigBotKey("Natty")
      },
      {
        text: "Don't send feedback to Guttenberg by default",
        configValue: getCachedConfigBotKey("Guttenberg")
      },
      {
        text: "Don't send feedback to Generic Bot by default",
        configValue: getCachedConfigBotKey("Generic Bot")
      },
      {
        text: "Enable dry-run mode",
        configValue: Cached.Configuration.debug
      }
    ].map(({ text, configValue, tooltipText }) => {
      const selected = cachedConfiguration[configValue];
      return {
        id: `advanced-flagging-${configValue}`,
        labelConfig: {
          text,
          description: tooltipText
        },
        selected
      };
    });
    const [fieldset] = import_stacks_helpers2.Checkbox.makeStacksCheckboxes(checkboxes);
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
    const similar = cachedFlagTypes.find((item) => item.sendWhenFlagRaised && item.reportType === flagType.reportType && item.id !== flagId);
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
      const feedback = radio?.dataset.feedback || "";
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
    updateFlagTypes();
    const hideButton = element.nextElementSibling;
    hideButton.click();
    displayStacksToast("Content saved successfully", "success", true);
  }

  // src/modals/comments/rows.ts
  var import_stacks_helpers3 = __toESM(require_dist(), 1);
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
    const toggle = import_stacks_helpers3.Toggle.makeStacksToggle(
      `advanced-flagging-comments-toggle-${id}`,
      { text: "Leave comment" },
      Boolean(comments?.low)
    );
    toggleContainer.append(toggle);
    const [, checkbox] = import_stacks_helpers3.Checkbox.makeStacksCheckboxes([
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
    const flag = import_stacks_helpers3.Textarea.makeStacksTextarea(
      `advanced-flagging-text-modflag-${id}`,
      { value: flagText },
      { text: "Flag text" }
    );
    const lowRep = import_stacks_helpers3.Textarea.makeStacksTextarea(
      `advanced-flagging-comment-lowrep-${id}`,
      { value: comments?.low },
      // if there is a high rep comment, change the wording of the label
      { text: "Comment text" + (comments?.high ? " for low reputation users" : "") }
    );
    const highRep = import_stacks_helpers3.Textarea.makeStacksTextarea(
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
    container.classList.add("d-flex", "fd-column", "gsy", "gs16");
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
    const select = import_stacks_helpers3.Select.makeStacksSelect(
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
    const [, feedback] = import_stacks_helpers3.Checkbox.makeStacksCheckboxes([
      {
        id: `advanced-flagging-send-when-flag-raised-${id}`,
        labelConfig: {
          text: "Send feedback from this flag type when this flag is raised"
        },
        selected: sendWhenFlagRaised
      }
    ]);
    const [, downvoteBox] = import_stacks_helpers3.Checkbox.makeStacksCheckboxes([
      {
        id: `advanced-flagging-downvote-post-${id}`,
        labelConfig: {
          text: "Downvote post"
        },
        selected: downvote
      }
    ]);
    const container = document.createElement("div");
    container.classList.add("d-flex", "ai-center", "gsx", "gs6");
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
    const [fieldset] = import_stacks_helpers3.Radio.makeStacksRadios(config, name, {
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
    container.classList.add("d-flex", "fd-column", "gsy", "gs4");
    const feedbackRadios = Object.keys(possibleFeedbacks).map((item) => {
      const botName = item;
      return getRadiosForBot(botName, feedbacks[botName], id);
    }).map((checkbox) => wrapInFlexItem(checkbox));
    container.append(...feedbackRadios);
    return container;
  }

  // src/modals/comments/main.ts
  var import_stacks_helpers4 = __toESM(require_dist(), 1);
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
      const input = import_stacks_helpers4.Input.makeStacksInput(
        `advanced-flagging-flag-name-${flagId}`,
        {
          classes: ["s-input__md"],
          value: name?.innerText || ""
        }
      );
      name?.replaceWith(input);
    } else {
      const input = card.querySelector(
        `#advanced-flagging-flag-name-${flagId}`
      );
      const h3 = getH3(input?.value || "");
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
    const save = import_stacks_helpers4.Buttons.makeStacksButton(
      `advanced-flagging-save-flagtype-${flagId}`,
      "Save",
      {
        primary: true,
        classes: ["flex--item"]
      }
    );
    save.style.display = "none";
    save.addEventListener("click", () => submitChanges(save));
    const edit = import_stacks_helpers4.Buttons.makeStacksButton(
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
    const remove = import_stacks_helpers4.Buttons.makeStacksButton(
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
      const index = cachedFlagTypes.findIndex(({ id }) => id === flagId2);
      cachedFlagTypes.splice(index, 1);
      updateFlagTypes();
      $(wrapper).fadeOut("fast", () => {
        const category = wrapper.parentElement;
        wrapper.remove();
        if (category?.childElementCount === 1) {
          $(category).fadeOut("fast", () => category.remove());
        }
      });
      displayStacksToast("Successfully removed flag type", "success", true);
    });
    const toggle = import_stacks_helpers4.Toggle.makeStacksToggle(
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
      updateFlagTypes();
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
  function createCategoryDiv(displayName) {
    const container = document.createElement("div");
    container.classList.add("flex--item");
    const header = document.createElement("h2");
    header.classList.add("ta-center", "mb8", "fs-title");
    header.innerHTML = displayName;
    container.append(header);
    return container;
  }
  function getCommentsModalBody() {
    const container = document.createElement("div");
    container.classList.add("d-flex", "fd-column", "g16");
    const categories = cachedCategories.filter(({ name }) => name).map(({ name }) => {
      const div = createCategoryDiv(name || "");
      const flagTypes2 = cachedFlagTypes.filter(({ belongsTo: BelongsTo }) => BelongsTo === name).map((flagType) => createFlagTypeDiv(flagType));
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
    const modal = import_stacks_helpers4.Modals.makeStacksModal(
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
              element: import_stacks_helpers4.Buttons.makeStacksButton(
                "advanced-flagging-comments-modal-done",
                "I'm done!",
                { primary: true }
              ),
              hideOnClick: true
            },
            {
              element: import_stacks_helpers4.Buttons.makeStacksButton(
                "advanced-flagging-comments-modal-cancel",
                "Cancel"
              ),
              hideOnClick: true
            },
            {
              element: import_stacks_helpers4.Buttons.makeStacksButton(
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
    cachedFlagTypes.push(...flagTypesToCache);
  }
  function cacheCategories() {
    const categories = flagCategories.map((category) => ({
      isDangerous: category.isDangerous,
      name: category.name,
      appliesTo: category.appliesTo
    }));
    Store.set(Cached.FlagCategories, categories);
    cachedCategories.push(...categories);
  }
  function setupDefaults() {
    if (!cachedFlagTypes.length || !("downvote" in cachedFlagTypes[0])) {
      cacheFlags();
    }
    if (!cachedCategories.length || !("appliesTo" in cachedCategories[0])) {
      cacheCategories();
    }
    cachedFlagTypes.forEach((cachedFlag) => {
      if (cachedFlag.id !== 3 && cachedFlag.id !== 5) return;
      cachedFlag.reportType = "PlagiarizedContent" /* Plagiarism */;
    });
    updateFlagTypes();
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
    configLink.innerText = "AdvancedFlagging configuration";
    configLink.addEventListener("click", () => Stacks.showModal(configModal));
    configDiv.append(configLink);
    const commentsDiv = configDiv.cloneNode();
    const commentsLink = document.createElement("a");
    commentsLink.innerText = "AdvancedFlagging: edit comments and flags";
    commentsLink.addEventListener("click", () => Stacks.showModal(commentsModal));
    commentsDiv.append(commentsLink);
    bottomBox?.after(configDiv, commentsDiv);
    const propertyDoesNotExist = !Object.prototype.hasOwnProperty.call(
      cachedConfiguration,
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
  var import_stacks_helpers5 = __toESM(require_dist(), 1);
  var noneSpan = document.createElement("span");
  noneSpan.classList.add("o50");
  noneSpan.innerText = "(none)";
  function increaseTooltipWidth(menu) {
    [...menu.querySelectorAll("li")].filter((li) => li.firstElementChild?.classList.contains("s-block-link")).map((reportLink) => reportLink.nextElementSibling).forEach((tooltip) => {
      const textLength = tooltip?.textContent?.length;
      if (!textLength) return;
      tooltip.classList.add(
        textLength > 100 ? "wmn5" : "wmn2"
      );
    });
  }
  function canSendFeedback(botName, feedback, reporters, postDeleted) {
    const {
      Guttenberg: copypastor,
      Natty: natty,
      Smokey: metasmoke
    } = reporters;
    const smokeyId = metasmoke?.getSmokeyId();
    const smokeyDisabled = MetaSmokeAPI.isDisabled;
    const { copypastorId } = copypastor || {};
    const nattyReported = natty?.wasReported() || false;
    const nattyCanReport = natty?.canBeReported() || false;
    switch (botName) {
      case "Natty":
        return nattyReported && !postDeleted || // OR
        nattyCanReport && feedback === "tp";
      case "Smokey":
        return Boolean(smokeyId) || // the post has been reported OR:
        feedback === "tpu-" && !postDeleted && !smokeyDisabled;
      case "Guttenberg":
        return Boolean(copypastorId);
      case "Generic Bot":
        return feedback === "track" && !postDeleted && isStackOverflow;
    }
  }
  function getFeedbackSpans(flagType, reporters, postDeleted) {
    const {
      Natty: natty,
      Smokey: metasmoke
    } = reporters;
    const smokeyId = metasmoke?.getSmokeyId();
    const nattyReported = natty?.wasReported() || false;
    const spans = Object.entries(flagType.feedbacks).filter(([, feedback]) => feedback).filter(([botName, feedback]) => {
      return canSendFeedback(
        botName,
        feedback,
        reporters,
        postDeleted
      );
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
      const shouldReport = botName === "Smokey" && !smokeyId || botName === "Natty" && !nattyReported;
      strong.classList.add(`fc-${className}`);
      strong.innerHTML = shouldReport ? "report" : feedback;
      feedbackSpan.append(` to ${botName}`);
      return feedbackSpan;
    }).filter(String);
    return spans.length ? spans : [noneSpan];
  }
  async function handleReportLinkClick(post, reporters, flagType, flagText) {
    const { deleted, element } = post;
    const dropdown = element.querySelector(".advanced-flagging-popover");
    if (!dropdown) return;
    $(dropdown).fadeOut("fast");
    if (!deleted) {
      let comment = getCommentText(post, flagType);
      const leaveComment = dropdown.querySelector(
        '[id*="-leave-comment-checkbox-"]'
      )?.checked;
      if (!leaveComment && comment) {
        upvoteSameComments(element, comment);
        comment = null;
      }
      const [flag, downvote] = [
        "flag",
        "downvote"
      ].map((type) => {
        return dropdown.querySelector(
          `[id*="-${type}-checkbox-"]`
        )?.checked ?? false;
      });
      await handleActions(
        post,
        flagType,
        flag,
        downvote,
        flagText,
        comment,
        reporters.Guttenberg?.targetUrl
      );
    }
    const success = await handleFlag(flagType, reporters, post);
    const { done, failed } = post;
    const { reportType, displayName } = flagType;
    if (reportType !== "NoFlag") return;
    if (success) {
      attachPopover(done, `Performed action ${displayName}`);
      $(done).fadeIn();
    } else {
      attachPopover(failed, `Failed to perform action ${displayName}`);
      $(failed).fadeIn();
    }
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
  function getTooltipHtml(reporters, flagType, post, flagText) {
    const { deleted, raiseVlq } = post;
    const { reportType, downvote } = flagType;
    const feedbackText = getFeedbackSpans(
      flagType,
      reporters,
      deleted
    ).map((span) => span.outerHTML).join(", ");
    const feedbacks = document.createElement("span");
    feedbacks.innerHTML = feedbackText;
    const tooltipFlagText = deleted ? "" : flagText;
    const commentText = getCommentText(post, flagType);
    const tooltipCommentText = (deleted ? "" : commentText) || "";
    const flagName = getFlagToRaise(reportType, raiseVlq);
    let reportTypeHuman = reportType === "NoFlag" || !deleted ? getHumanFromDisplayName(flagName) : "";
    if (reportType !== flagName) {
      reportTypeHuman += " (VLQ criteria weren't met)";
    }
    const popoverParent = document.createElement("div");
    Object.entries({
      "Flag": reportTypeHuman,
      "Comment": tooltipCommentText,
      "Flag text": tooltipFlagText,
      "Feedbacks": feedbacks
    }).filter(([, value]) => value).map(([boldText, value]) => createPopoverToOption(boldText, value)).filter(Boolean).forEach((element) => popoverParent.append(element));
    const downvoteWrapper = document.createElement("li");
    const downvoteOrNot = downvote ? "<b>Downvotes</b>" : "Does <b>not</b> downvote";
    downvoteWrapper.innerHTML = `${downvoteOrNot} the post`;
    popoverParent.append(downvoteWrapper);
    return popoverParent.innerHTML;
  }
  function getCommentText({ opReputation, opName }, { comments }) {
    const { addAuthorName: AddAuthorName } = cachedConfiguration;
    const commentType = (opReputation || 0) > 50 ? "high" : "low";
    const comment = comments?.[commentType] || comments?.low;
    return (comment && AddAuthorName ? `${opName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || null;
  }
  function getReportLinks(reporters, post) {
    const { postType } = post;
    const {
      Guttenberg: copypastor
    } = reporters;
    const { copypastorId, repost, targetUrl } = copypastor || {};
    const categories = cachedCategories.filter((item) => item.appliesTo?.includes(postType)).map((item) => ({ ...item, FlagTypes: [] }));
    cachedFlagTypes.filter(({ reportType, id, belongsTo, enabled }) => {
      const isGuttenbergItem = isSpecialFlag(reportType, false);
      const showGutReport = Boolean(copypastorId) && (id === 4 ? repost : !repost);
      const showOnSo = ["Red flags", "General"].includes(belongsTo) || isStackOverflow;
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
        const tooltipHtml = getTooltipHtml(
          reporters,
          flagType,
          post,
          flagText
        );
        const classes = isDangerous ? ["fc-red-500"] : "";
        return {
          text: displayName,
          // unfortunately, danger: IsDangerous won't work
          // since SE uses s-anchors__muted
          blockLink: { selected: false },
          // use this trick instead
          ...classes ? { classes } : {},
          click: {
            handler: function() {
              void handleReportLinkClick(
                post,
                reporters,
                flagType,
                flagText
              );
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
  function getOptionsRow({ element, postId }) {
    const comments = element.querySelector(".comment-body");
    const config = [
      ["Leave comment", Cached.Configuration.defaultNoComment],
      ["Flag", Cached.Configuration.defaultNoFlag],
      ["Downvote", Cached.Configuration.defaultNoDownvote]
    ];
    return config.filter(([text]) => text === "Leave comment" ? isStackOverflow : true).map(([text, cacheKey]) => {
      const uncheck = cachedConfiguration[cacheKey] || text === "Leave comment" && comments;
      const idified = text.toLowerCase().replace(" ", "-");
      const id = `advanced-flagging-${idified}-checkbox-${postId}`;
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
  function getSendFeedbackToRow(reporters, { postId }) {
    return Object.entries(reporters).filter(([bot, instance]) => {
      switch (bot) {
        case "Natty":
          return instance.wasReported() || instance.canBeReported();
        case "Guttenberg":
          return instance.copypastorId;
        case "Generic Bot":
          return isStackOverflow;
        case "Smokey":
          return !MetaSmokeAPI.isDisabled;
      }
    }).map(([botName]) => {
      const cacheKey = getCachedConfigBotKey(botName);
      const sanitised = botName.replace(/\s/g, "").toLowerCase();
      const botImage = createBotIcon(botName);
      const botNameId = `advanced-flagging-send-feedback-to-${sanitised}-${postId}`;
      const defaultNoCheck = cachedConfiguration[cacheKey];
      const imageClone = botImage.cloneNode(true);
      return {
        checkbox: {
          id: botNameId,
          labelConfig: {
            text: `Feedback to ${imageClone.outerHTML}`,
            classes: ["fs-body1"]
          },
          selected: !defaultNoCheck
        },
        checkboxOptions: {
          classes: ["px6"]
        },
        popover: {
          html: `Send feedback to ${botName}`,
          position: "right-start"
        }
      };
    });
  }
  function makeMenu(reporters, post) {
    const actionBoxes = getOptionsRow(post);
    const menu = import_stacks_helpers5.Menu.makeMenu(
      {
        itemsType: "a",
        navItems: [
          ...getReportLinks(reporters, post),
          ...actionBoxes,
          { separatorType: "divider" },
          ...getSendFeedbackToRow(reporters, post)
        ]
      }
    );
    const arrow = document.createElement("div");
    arrow.classList.add("s-popover--arrow", "s-popover--arrow__tc");
    menu.prepend(arrow);
    setTimeout(() => increaseTooltipWidth(menu));
    return menu;
  }

  // src/review.ts
  var reviewPostsInformation = [];
  function getPostIdFromReview() {
    const answer = document.querySelector('[id^="answer-"]');
    const id = answer?.id.split("-")[1];
    return Number(id);
  }
  async function runOnNewTask(xhr) {
    const regex = /\/review\/(next-task|task-reviewed\/)/;
    if (xhr.status !== 200 || !regex.test(xhr.responseURL) || !document.querySelector("#answer")) return;
    const reviewResponse = JSON.parse(xhr.responseText);
    if (reviewResponse.isAudit) return;
    const cachedPost = reviewPostsInformation.find((item) => item.postId === reviewResponse.postId);
    await new Promise((resolve) => {
      if (isDone) resolve();
    });
    const question = document.querySelector(".question");
    const answer = document.querySelector("#answer");
    const postMenu = ".js-post-menu > div.d-flex";
    const qDate = getPostCreationDate(question, "Question");
    const aDate = getPostCreationDate(answer, "Answer");
    const postId = cachedPost?.postId || reviewResponse.postId;
    const url = `//stackoverflow.com/a/${postId}`;
    await MetaSmokeAPI.queryMetaSmokeInternal([url]);
    await NattyAPI.getAllNattyIds([postId]);
    await CopyPastorAPI.storeReportedPosts([url]);
    const reporters = addIconToPost(answer, postMenu, "Answer", postId, qDate, aDate);
    reviewPostsInformation.push({ postId, reporters });
    document.querySelector(".js-review-submit")?.addEventListener("click", () => {
      const looksGood = document.querySelector(
        "#review-action-LooksGood"
      );
      if (!looksGood?.checked) return;
      const cached = reviewPostsInformation.find((item) => item.postId === postId);
      const flagType = cachedFlagTypes.find(({ id }) => id === 15);
      if (!cached || !flagType) return;
      void handleFlag(flagType, cached.reporters);
    });
  }
  function setupReview() {
    const watchReview = cachedConfiguration[Cached.Configuration.watchQueues];
    if (!watchReview || !isLqpReviewPage) return;
    addXHRListener(runOnNewTask);
    addXHRListener((xhr) => {
      const regex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
      if (xhr.status !== 200 || !regex.test(xhr.responseURL) || !document.querySelector("#answer")) return;
      const postId = getPostIdFromReview();
      const cached = reviewPostsInformation.find((item) => item.postId === postId);
      if (!cached) return;
      const flagType = cachedFlagTypes.find(({ id }) => id === 7);
      if (!flagType) return;
      void handleFlag(flagType, cached.reporters);
    });
  }

  // src/AdvancedFlagging.ts
  var import_stacks_helpers6 = __toESM(require_dist(), 1);
  function setupStyles() {
    GM_addStyle(`
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
  function getFlagToRaise(flagName, qualifiesForVlq2) {
    const vlqFlag = "PostLowQuality" /* VLQ */;
    const naaFlag = "AnswerNotAnAnswer" /* NAA */;
    return flagName === vlqFlag ? qualifiesForVlq2 ? vlqFlag : naaFlag : flagName;
  }
  async function postComment(postId, fkey, comment) {
    const data = { fkey, comment };
    const url = `/posts/${postId}/comments`;
    if (debugMode) {
      console.log("Post comment via", url, data);
      return;
    }
    const request = await fetch(url, {
      method: "POST",
      body: getFormDataFromObject(data)
    });
    const result = await request.text();
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(result, null, false, true);
    $(document).trigger("comment", postId);
  }
  function getErrorMessage({ Message }) {
    if (Message.includes("already flagged")) {
      return "post already flagged";
    } else if (Message.includes("limit reached")) {
      return "post flag limit reached";
    } else {
      return Message;
    }
  }
  async function flagPost(postId, fkey, flagName, flagged, flagText, targetUrl) {
    const failedToFlag = "Failed to flag: ";
    const url = `/flags/posts/${postId}/add/${flagName}`;
    const data = {
      fkey,
      otherText: flagText || "",
      // plagiarism flag: fill "Link(s) to original content"
      // note wrt link: site will always be Stack Overflow,
      //                post will always be an answer.
      customData: flagName === "PlagiarizedContent" /* Plagiarism */ ? JSON.stringify({ plagiarizedSource: `https:${targetUrl}` }) : ""
    };
    if (debugMode) {
      console.log(`Flag post as ${flagName} via`, url, data);
      return;
    }
    const flagRequest = await fetch(url, {
      method: "POST",
      body: getFormDataFromObject(data)
    });
    const tooFast = /You may only flag a post every \d+ seconds?/;
    const responseText = await flagRequest.text();
    if (tooFast.test(responseText)) {
      const rlCount = /\d+/.exec(responseText)?.[0] || 0;
      const pluralS = Number(rlCount) > 1 ? "s" : "";
      const message = `${failedToFlag}rate-limited for ${rlCount} second${pluralS}`;
      displayErrorFlagged(message, responseText);
      return;
    }
    const response = JSON.parse(responseText);
    if (response.Success) {
      displaySuccessFlagged(flagged, flagName);
    } else {
      const fullMessage = `Failed to flag the post with outcome ${response.Outcome}: ${response.Message}.`;
      const message = getErrorMessage(response);
      displayErrorFlagged(failedToFlag + message, fullMessage);
    }
  }
  async function handleActions({ postId, element, flagged, raiseVlq }, { reportType, downvote }, flagRequired, downvoteRequired, flagText, commentText, targetUrl) {
    const fkey = StackExchange.options.user.fkey;
    if (commentText) {
      try {
        await postComment(postId, fkey, commentText);
      } catch (error) {
        displayToaster("Failed to comment on post", "danger");
        console.error(error);
      }
    }
    if (flagRequired && reportType !== "NoFlag" /* NoFlag */) {
      autoFlagging = true;
      const flagName = getFlagToRaise(reportType, raiseVlq);
      try {
        await flagPost(postId, fkey, flagName, flagged, flagText, targetUrl);
      } catch (error) {
        displayErrorFlagged("Failed to flag post", error);
      }
    }
    const button = element.querySelector(".js-vote-down-btn");
    const hasDownvoted = button?.classList.contains("fc-theme-primary");
    if (!downvoteRequired || !downvote || hasDownvoted) return;
    if (debugMode) {
      console.log("Downvote post by clicking", button);
      return;
    }
    button?.click();
  }
  async function handleFlag(flagType, reporters, post) {
    const { element } = post || {};
    let hasFailed = false;
    const allPromises = Object.values(reporters).filter(({ name }) => {
      const sanitised = name.replace(/\s/g, "").toLowerCase();
      const input = element?.querySelector(
        `[id*="-send-feedback-to-${sanitised}-"]
            `
      );
      const sendFeedback = input?.checked ?? true;
      return sendFeedback && flagType.feedbacks[name];
    }).map((reporter) => {
      return reporter.sendFeedback(flagType.feedbacks[reporter.name]).then((message) => {
        if (message) {
          displayToaster(message, "success");
        }
      }).catch((promiseError) => {
        displayToaster(promiseError.message, "danger");
        hasFailed = true;
      });
    });
    await Promise.allSettled(allPromises);
    return !hasFailed;
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
  function displaySuccessFlagged(icon, reportType) {
    if (!reportType) return;
    const flaggedMessage = `Flagged ${getHumanFromDisplayName(reportType)}`;
    attachPopover(icon, flaggedMessage);
    $(icon).fadeIn();
    displayToaster(flaggedMessage, "success");
  }
  function displayErrorFlagged(message, error) {
    displayToaster(message, "danger");
    console.error(error);
  }
  function getStrippedComment(commentText) {
    return commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").replace(/\[([^\]]+)\][^(]*?/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(" - From Review", "");
  }
  function upvoteSameComments(postNode, comment) {
    const strippedComment = getStrippedComment(comment);
    postNode.querySelectorAll(".comment-body .comment-copy").forEach((element) => {
      if (element.innerText !== strippedComment) return;
      const parent = element.closest("li");
      parent?.querySelector(
        "a.js-comment-up.comment-up-off"
        // voting button
      )?.click();
    });
  }
  var botImages = {
    Natty: "https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1",
    Smokey: "https://i.stack.imgur.com/7cmCt.png?s=32&g=1",
    "Generic Bot": "https://i.stack.imgur.com/6DsXG.png?s=32&g=1",
    Guttenberg: "https://i.stack.imgur.com/tzKAI.png?s=32&g=1"
  };
  function createBotIcon(botName, href) {
    const iconWrapper = document.createElement("div");
    iconWrapper.classList.add("flex--item", "d-inline-block");
    if (!isQuestionPage && !isLqpReviewPage) {
      iconWrapper.classList.add("ml8");
    }
    const iconLink = document.createElement("a");
    iconLink.classList.add("s-avatar", "s-avatar__16", "s-user-card--avatar");
    if (href) {
      iconLink.href = href;
      iconLink.target = "_blank";
    }
    attachPopover(iconLink, `Reported by ${botName}`);
    iconWrapper.append(iconLink);
    const iconImage = document.createElement("img");
    iconImage.classList.add("s-avatar--image");
    iconImage.src = botImages[botName];
    iconLink.append(iconImage);
    return iconWrapper;
  }
  function buildFlaggingDialog(post, reporters) {
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
    const actionsMenu = makeMenu(reporters, post);
    dropdown.append(actionsMenu);
    return dropdown;
  }
  function setPopoverOpening(advancedFlaggingLink, dropdown) {
    const openOnHover = cachedConfiguration[Cached.Configuration.openOnHover];
    if (openOnHover) {
      advancedFlaggingLink.addEventListener("mouseover", (event) => {
        event.stopPropagation();
        if (advancedFlaggingLink.isSameNode(event.target)) {
          $(dropdown).fadeIn("fast");
        }
      });
      advancedFlaggingLink.addEventListener("mouseleave", (event) => {
        event.stopPropagation();
        setTimeout(() => $(dropdown).fadeOut("fast"), 200);
      });
    } else {
      advancedFlaggingLink.addEventListener("click", (event) => {
        event.stopPropagation();
        if (advancedFlaggingLink.isSameNode(event.target)) {
          $(dropdown).fadeIn("fast");
        }
      });
      window.addEventListener("click", () => $(dropdown).fadeOut("fast"));
    }
  }
  function setFlagWatch({ postId, flagged }, reporters) {
    const watchFlags = cachedConfiguration[Cached.Configuration.watchFlags];
    addXHRListener((xhr) => {
      const { status, responseURL } = xhr;
      const flagNames2 = Object.values(FlagNames).join("|");
      const regex = new RegExp(
        `/flags/posts/${postId}/add/(${flagNames2})`
      );
      if (!watchFlags || autoFlagging || status !== 200 || !regex.test(responseURL)) return;
      const matches = regex.exec(responseURL);
      const flag = matches?.[1];
      const flagType = cachedFlagTypes.find((item) => item.sendWhenFlagRaised && item.reportType === flag);
      if (!flagType) return;
      if (debugMode) {
        console.log("Post", postId, "manually flagged as", flag, flagType);
      }
      displaySuccessFlagged(flagged, flagType.reportType);
      void handleFlag(flagType, reporters);
    });
  }
  function getIconsFromReporters(reporters) {
    const icons = Object.values(reporters).map((reporter) => reporter.icon).filter(Boolean);
    icons.forEach((icon) => icon.classList.add("advanced-flagging-icon"));
    return icons;
  }
  var autoFlagging = false;
  function setupPostPage() {
    const linkDisabled = cachedConfiguration[Cached.Configuration.linkDisabled];
    if (linkDisabled || isLqpReviewPage) return;
    const page = getPage();
    if (page && page !== "Question") {
      addIcons();
      return;
    }
    parseQuestionsAndAnswers((post) => {
      const {
        postId,
        postType,
        questionTime,
        answerTime,
        iconLocation,
        deleted,
        done,
        failed,
        flagged
      } = post;
      const reporters = {
        Smokey: new MetaSmokeAPI(postId, postType, deleted)
      };
      if (postType === "Answer" && isStackOverflow) {
        reporters.Natty = new NattyAPI(postId, questionTime, answerTime, deleted);
        reporters.Guttenberg = new CopyPastorAPI(postId);
      }
      const icons = getIconsFromReporters(reporters);
      if (isStackOverflow) {
        reporters["Generic Bot"] = new GenericBotAPI(postId);
      }
      setFlagWatch(post, reporters);
      const advancedFlaggingLink = import_stacks_helpers6.Buttons.makeStacksButton(
        `advanced-flagging-link-${postId}`,
        "Advanced Flagging",
        {
          type: ["link"],
          classes: ["advanced-flagging-link"]
        }
      );
      const flexItem = document.createElement("div");
      flexItem.classList.add("flex--item");
      flexItem.append(advancedFlaggingLink);
      iconLocation.append(flexItem);
      const dropDown = buildFlaggingDialog(post, reporters);
      advancedFlaggingLink.append(dropDown);
      iconLocation.append(done, failed, flagged, ...icons);
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
      $(document).ajaxComplete(() => setupPostPage());
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
