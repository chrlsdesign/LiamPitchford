(() => {
  // node_modules/selector-set/selector-set.next.js
  function SelectorSet() {
    if (!(this instanceof SelectorSet)) {
      return new SelectorSet();
    }
    this.size = 0;
    this.uid = 0;
    this.selectors = [];
    this.selectorObjects = {};
    this.indexes = Object.create(this.indexes);
    this.activeIndexes = [];
  }
  var docElem = window.document.documentElement;
  var matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector;
  SelectorSet.prototype.matchesSelector = function(el, selector) {
    return matches.call(el, selector);
  };
  SelectorSet.prototype.querySelectorAll = function(selectors, context) {
    return context.querySelectorAll(selectors);
  };
  SelectorSet.prototype.indexes = [];
  var idRe = /^#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  SelectorSet.prototype.indexes.push({
    name: "ID",
    selector: function matchIdSelector(sel) {
      var m;
      if (m = sel.match(idRe)) {
        return m[0].slice(1);
      }
    },
    element: function getElementId(el) {
      if (el.id) {
        return [el.id];
      }
    }
  });
  var classRe = /^\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  SelectorSet.prototype.indexes.push({
    name: "CLASS",
    selector: function matchClassSelector(sel) {
      var m;
      if (m = sel.match(classRe)) {
        return m[0].slice(1);
      }
    },
    element: function getElementClassNames(el) {
      var className = el.className;
      if (className) {
        if (typeof className === "string") {
          return className.split(/\s/);
        } else if (typeof className === "object" && "baseVal" in className) {
          return className.baseVal.split(/\s/);
        }
      }
    }
  });
  var tagRe = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  SelectorSet.prototype.indexes.push({
    name: "TAG",
    selector: function matchTagSelector(sel) {
      var m;
      if (m = sel.match(tagRe)) {
        return m[0].toUpperCase();
      }
    },
    element: function getElementTagName(el) {
      return [el.nodeName.toUpperCase()];
    }
  });
  SelectorSet.prototype.indexes["default"] = {
    name: "UNIVERSAL",
    selector: function() {
      return true;
    },
    element: function() {
      return [true];
    }
  };
  var Map2;
  if (typeof window.Map === "function") {
    Map2 = window.Map;
  } else {
    Map2 = (function() {
      function Map3() {
        this.map = {};
      }
      Map3.prototype.get = function(key2) {
        return this.map[key2 + " "];
      };
      Map3.prototype.set = function(key2, value) {
        this.map[key2 + " "] = value;
      };
      return Map3;
    })();
  }
  var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g;
  function parseSelectorIndexes(allIndexes, selector) {
    allIndexes = allIndexes.slice(0).concat(allIndexes["default"]);
    var allIndexesLen = allIndexes.length, i, j, m, dup, rest = selector, key2, index, indexes = [];
    do {
      chunker.exec("");
      if (m = chunker.exec(rest)) {
        rest = m[3];
        if (m[2] || !rest) {
          for (i = 0; i < allIndexesLen; i++) {
            index = allIndexes[i];
            if (key2 = index.selector(m[1])) {
              j = indexes.length;
              dup = false;
              while (j--) {
                if (indexes[j].index === index && indexes[j].key === key2) {
                  dup = true;
                  break;
                }
              }
              if (!dup) {
                indexes.push({ index, key: key2 });
              }
              break;
            }
          }
        }
      }
    } while (m);
    return indexes;
  }
  function findByPrototype(ary, proto) {
    var i, len, item;
    for (i = 0, len = ary.length; i < len; i++) {
      item = ary[i];
      if (proto.isPrototypeOf(item)) {
        return item;
      }
    }
  }
  SelectorSet.prototype.logDefaultIndexUsed = function() {
  };
  SelectorSet.prototype.add = function(selector, data) {
    var obj, i, indexProto, key2, index, objs, selectorIndexes, selectorIndex, indexes = this.activeIndexes, selectors = this.selectors, selectorObjects = this.selectorObjects;
    if (typeof selector !== "string") {
      return;
    }
    obj = {
      id: this.uid++,
      selector,
      data
    };
    selectorObjects[obj.id] = obj;
    selectorIndexes = parseSelectorIndexes(this.indexes, selector);
    for (i = 0; i < selectorIndexes.length; i++) {
      selectorIndex = selectorIndexes[i];
      key2 = selectorIndex.key;
      indexProto = selectorIndex.index;
      index = findByPrototype(indexes, indexProto);
      if (!index) {
        index = Object.create(indexProto);
        index.map = new Map2();
        indexes.push(index);
      }
      if (indexProto === this.indexes["default"]) {
        this.logDefaultIndexUsed(obj);
      }
      objs = index.map.get(key2);
      if (!objs) {
        objs = [];
        index.map.set(key2, objs);
      }
      objs.push(obj);
    }
    this.size++;
    selectors.push(selector);
  };
  SelectorSet.prototype.remove = function(selector, data) {
    if (typeof selector !== "string") {
      return;
    }
    var selectorIndexes, selectorIndex, i, j, k, selIndex, objs, obj, indexes = this.activeIndexes, selectors = this.selectors = [], selectorObjects = this.selectorObjects, removedIds = {}, removeAll = arguments.length === 1;
    selectorIndexes = parseSelectorIndexes(this.indexes, selector);
    for (i = 0; i < selectorIndexes.length; i++) {
      selectorIndex = selectorIndexes[i];
      j = indexes.length;
      while (j--) {
        selIndex = indexes[j];
        if (selectorIndex.index.isPrototypeOf(selIndex)) {
          objs = selIndex.map.get(selectorIndex.key);
          if (objs) {
            k = objs.length;
            while (k--) {
              obj = objs[k];
              if (obj.selector === selector && (removeAll || obj.data === data)) {
                objs.splice(k, 1);
                removedIds[obj.id] = true;
              }
            }
          }
          break;
        }
      }
    }
    for (i in removedIds) {
      delete selectorObjects[i];
      this.size--;
    }
    for (i in selectorObjects) {
      selectors.push(selectorObjects[i].selector);
    }
  };
  function sortById(a, b) {
    return a.id - b.id;
  }
  SelectorSet.prototype.queryAll = function(context) {
    if (!this.selectors.length) {
      return [];
    }
    var matches2 = {}, results = [];
    var els = this.querySelectorAll(this.selectors.join(", "), context);
    var i, j, len, len2, el, m, match, obj;
    for (i = 0, len = els.length; i < len; i++) {
      el = els[i];
      m = this.matches(el);
      for (j = 0, len2 = m.length; j < len2; j++) {
        obj = m[j];
        if (!matches2[obj.id]) {
          match = {
            id: obj.id,
            selector: obj.selector,
            data: obj.data,
            elements: []
          };
          matches2[obj.id] = match;
          results.push(match);
        } else {
          match = matches2[obj.id];
        }
        match.elements.push(el);
      }
    }
    return results.sort(sortById);
  };
  SelectorSet.prototype.matches = function(el) {
    if (!el) {
      return [];
    }
    var i, j, k, len, len2, len3, index, keys, objs, obj, id;
    var indexes = this.activeIndexes, matchedIds = {}, matches2 = [];
    for (i = 0, len = indexes.length; i < len; i++) {
      index = indexes[i];
      keys = index.element(el);
      if (keys) {
        for (j = 0, len2 = keys.length; j < len2; j++) {
          if (objs = index.map.get(keys[j])) {
            for (k = 0, len3 = objs.length; k < len3; k++) {
              obj = objs[k];
              id = obj.id;
              if (!matchedIds[id] && this.matchesSelector(el, obj.selector)) {
                matchedIds[id] = true;
                matches2.push(obj);
              }
            }
          }
        }
      }
    }
    return matches2.sort(sortById);
  };

  // node_modules/@unseenco/e/src/utils.js
  var eventTypes = {};
  var listeners = {};
  var nonBubblers = ["mouseenter", "mouseleave", "pointerenter", "pointerleave", "blur", "focus"];
  function makeBusStack(event) {
    if (listeners[event] === void 0) {
      listeners[event] = /* @__PURE__ */ new Set();
    }
  }
  function triggerBus(event, args) {
    if (listeners[event]) {
      listeners[event].forEach((cb) => {
        cb(...args);
      });
    }
  }
  function maybeRunQuerySelector(el) {
    return typeof el === "string" ? document.querySelectorAll(el) : el;
  }
  function handleDelegation(e) {
    let matches2 = traverse(eventTypes[e.type], e.target);
    if (matches2.length) {
      for (let i = 0; i < matches2.length; i++) {
        for (let i2 = 0; i2 < matches2[i].stack.length; i2++) {
          if (nonBubblers.indexOf(e.type) !== -1) {
            addDelegateTarget(e, matches2[i].delegatedTarget);
            if (e.target === matches2[i].delegatedTarget) {
              matches2[i].stack[i2].data(e);
            }
          } else {
            addDelegateTarget(e, matches2[i].delegatedTarget);
            matches2[i].stack[i2].data(e);
          }
        }
      }
    }
  }
  function traverse(listeners2, target) {
    const queue = [];
    let node = target;
    do {
      if (node.nodeType !== 1) {
        break;
      }
      const matches2 = listeners2.matches(node);
      if (matches2.length) {
        queue.push({ delegatedTarget: node, stack: matches2 });
      }
    } while (node = node.parentElement);
    return queue;
  }
  function addDelegateTarget(event, delegatedTarget) {
    Object.defineProperty(event, "currentTarget", {
      configurable: true,
      enumerable: true,
      get: () => delegatedTarget
    });
  }
  function clone(object) {
    const copy = {};
    for (const key2 in object) {
      copy[key2] = [...object[key2]];
    }
    return copy;
  }

  // node_modules/@unseenco/e/src/e.js
  var E = class {
    /**
     * Binds all provided methods to a provided context.
     *
     * @param {object} context
     * @param {string[]} [methods] Optional.
     */
    bindAll(context, methods) {
      if (!methods) {
        methods = Object.getOwnPropertyNames(Object.getPrototypeOf(context));
      }
      for (let i = 0; i < methods.length; i++) {
        context[methods[i]] = context[methods[i]].bind(context);
      }
    }
    /**
     * Bind event to a string, NodeList, or element.
     *
     * @param {string} event
     * @param {string|NodeList|NodeListOf<Element>|HTMLElement|HTMLElement[]|Window|Document|function} el
     * @param {*} [callback]
     * @param {{}|boolean} [options]
     */
    on(event, el, callback, options) {
      const events = event.split(" ");
      for (let i = 0; i < events.length; i++) {
        if (typeof el === "function" && callback === void 0) {
          makeBusStack(events[i]);
          listeners[events[i]].add(el);
          continue;
        }
        if (el.nodeType && el.nodeType === 1 || el === window || el === document) {
          el.addEventListener(events[i], callback, options);
          continue;
        }
        el = maybeRunQuerySelector(el);
        for (let n = 0; n < el.length; n++) {
          el[n].addEventListener(events[i], callback, options);
        }
      }
    }
    /**
     * Add a delegated event.
     *
     * @param {string} event
     * @param {string|NodeList|HTMLElement|Element} delegate
     * @param {*} [callback]
     */
    delegate(event, delegate, callback) {
      const events = event.split(" ");
      for (let i = 0; i < events.length; i++) {
        let map = eventTypes[events[i]];
        if (map === void 0) {
          map = new SelectorSet();
          eventTypes[events[i]] = map;
          if (nonBubblers.indexOf(events[i]) !== -1) {
            document.addEventListener(events[i], handleDelegation, true);
          } else {
            document.addEventListener(events[i], handleDelegation);
          }
        }
        map.add(delegate, callback);
      }
    }
    /**
     * Remove a callback from a DOM element, or one or all Bus events.
     *
     * @param {string} event
     * @param {string|NodeList|HTMLElement|Element|Window|undefined} [el]
     * @param {*} [callback]
     * @param {{}|boolean} [options]
     */
    off(event, el, callback, options) {
      const events = event.split(" ");
      for (let i = 0; i < events.length; i++) {
        if (el === void 0) {
          listeners[events[i]]?.clear();
          continue;
        }
        if (typeof el === "function") {
          makeBusStack(events[i]);
          listeners[events[i]].delete(el);
          continue;
        }
        const map = eventTypes[events[i]];
        if (map !== void 0) {
          map.remove(el, callback);
          if (map.size === 0) {
            delete eventTypes[events[i]];
            if (nonBubblers.indexOf(events[i]) !== -1) {
              document.removeEventListener(events[i], handleDelegation, true);
            } else {
              document.removeEventListener(events[i], handleDelegation);
            }
            continue;
          }
        }
        if (el.removeEventListener !== void 0) {
          el.removeEventListener(events[i], callback, options);
          continue;
        }
        el = maybeRunQuerySelector(el);
        for (let n = 0; n < el.length; n++) {
          el[n].removeEventListener(events[i], callback, options);
        }
      }
    }
    /**
     * Emit a Bus event.
     *
     * @param {string} event
     * @param {...*} args
     */
    emit(event, ...args) {
      triggerBus(event, args);
    }
    /**
     * Return a clone of the delegated event stack for debugging.
     *
     * @returns {Object.<string, array>}
     */
    debugDelegated() {
      return JSON.parse(JSON.stringify(eventTypes));
    }
    /**
     * Return a clone of the bus event stack for debugging.
     *
     * @returns {Object.<string, array>}
     */
    debugBus() {
      return clone(listeners);
    }
    /**
     * Checks if a given bus event has listeners.
     *
     * @param {string} event
     * @returns {boolean}
     */
    hasBus(event) {
      return this.debugBus().hasOwnProperty(event);
    }
  };
  var instance = new E();
  var e_default = instance;

  // node_modules/@unseenco/taxi/src/helpers.js
  var parser = new DOMParser();
  function parseDom(html) {
    return typeof html === "string" ? parser.parseFromString(html, "text/html") : html;
  }
  function processUrl(url) {
    const details = new URL(url, window.location.origin);
    const normalized = details.hash.length ? url.replace(details.hash, "") : null;
    return {
      hasHash: details.hash.length > 0,
      pathname: details.pathname.replace(/\/+$/, ""),
      host: details.host,
      search: details.search,
      raw: url,
      href: normalized || details.href
    };
  }
  function reloadElement(node, elementType) {
    node.parentNode.replaceChild(duplicateElement(node, elementType), node);
  }
  function appendElement(node, elementType) {
    const target = node.parentNode.tagName === "HEAD" ? document.head : document.body;
    target.appendChild(duplicateElement(node, elementType));
  }
  function duplicateElement(node, elementType) {
    const replacement = document.createElement(elementType);
    for (let k = 0; k < node.attributes.length; k++) {
      const attr = node.attributes[k];
      replacement.setAttribute(attr.nodeName, attr.nodeValue);
    }
    if (node.innerHTML) {
      replacement.innerHTML = node.innerHTML;
    }
    return replacement;
  }

  // node_modules/@unseenco/taxi/src/Transition.js
  var Transition = class {
    /**
     * @param {{wrapper: HTMLElement}} props
     */
    constructor({ wrapper }) {
      this.wrapper = wrapper;
    }
    /**
     * @param {{ from: HTMLElement|Element, trigger: string|HTMLElement|false }} props
     * @return {Promise<void>}
     */
    leave(props) {
      return new Promise((resolve) => {
        this.onLeave({ ...props, done: resolve });
      });
    }
    /**
     * @param {{ to: HTMLElement|Element, trigger: string|HTMLElement|false }} props
     * @return {Promise<void>}
     */
    enter(props) {
      return new Promise((resolve) => {
        this.onEnter({ ...props, done: resolve });
      });
    }
    /**
     * Handle the transition leaving the previous page.
     * @param {{from: HTMLElement|Element, trigger: string|HTMLElement|false, done: function}} props
     */
    onLeave({ from, trigger, done }) {
      done();
    }
    /**
     * Handle the transition entering the next page.
     * @param {{to: HTMLElement|Element, trigger: string|HTMLElement|false, done: function}} props
     */
    onEnter({ to, trigger, done }) {
      done();
    }
  };

  // node_modules/@unseenco/taxi/src/Renderer.js
  var Renderer = class {
    /**
     * @param {{content: HTMLElement|Element, page: Document|Node, title: string, wrapper: Element}} props
     */
    constructor({ content, page, title, wrapper }) {
      this._contentString = content.outerHTML;
      this._DOM = null;
      this.page = page;
      this.title = title;
      this.wrapper = wrapper;
      this.content = this.wrapper.lastElementChild;
    }
    onEnter() {
    }
    onEnterCompleted() {
    }
    onLeave() {
    }
    onLeaveCompleted() {
    }
    initialLoad() {
      this.onEnter();
      this.onEnterCompleted();
    }
    update() {
      document.title = this.title;
      this.wrapper.appendChild(this._DOM.firstElementChild);
      this.content = this.wrapper.lastElementChild;
      this._DOM = null;
    }
    createDom() {
      if (!this._DOM) {
        this._DOM = document.createElement("div");
        this._DOM.innerHTML = this._contentString;
      }
    }
    remove() {
      this.wrapper.firstElementChild.remove();
    }
    /**
     * Called when transitioning into the current page.
     * @param {Transition} transition
     * @param {string|HTMLElement|false} trigger
     * @return {Promise<null>}
     */
    enter(transition, trigger) {
      return new Promise((resolve) => {
        this.onEnter();
        transition.enter({ trigger, to: this.content }).then(() => {
          this.onEnterCompleted();
          resolve();
        });
      });
    }
    /**
     * Called when transitioning away from the current page.
     * @param {Transition} transition
     * @param {string|HTMLElement|false} trigger
     * @param {boolean} removeOldContent
     * @return {Promise<null>}
     */
    leave(transition, trigger, removeOldContent) {
      return new Promise((resolve) => {
        this.onLeave();
        transition.leave({ trigger, from: this.content }).then(() => {
          if (removeOldContent) {
            this.remove();
          }
          this.onLeaveCompleted();
          resolve();
        });
      });
    }
  };

  // node_modules/@unseenco/taxi/src/RouteStore.js
  var RouteStore = class {
    /**
     * @type {Map<string, Map<string, string>>}
     */
    data = /* @__PURE__ */ new Map();
    /**
     * @type {Map<string, RegExp>}
     */
    regexCache = /* @__PURE__ */ new Map();
    /**
     *
     * @param {string} fromPattern
     * @param {string} toPattern
     * @param {string} transition
     */
    add(fromPattern, toPattern, transition) {
      if (!this.data.has(fromPattern)) {
        this.data.set(fromPattern, /* @__PURE__ */ new Map());
        this.regexCache.set(fromPattern, new RegExp(`^${fromPattern}$`));
      }
      this.data.get(fromPattern).set(toPattern, transition);
      this.regexCache.set(toPattern, new RegExp(`^${toPattern}$`));
    }
    /**
     *
     * @param {{ raw: string, href: string, hasHash: boolean, pathname: string }} currentUrl
     * @param {{ raw: string, href: string, hasHash: boolean, pathname: string }} nextUrl
     * @return {string|null}
     */
    findMatch(currentUrl, nextUrl) {
      for (const [fromPattern, potentialMatches] of this.data) {
        if (currentUrl.pathname.match(this.regexCache.get(fromPattern))) {
          for (const [toPattern, transition] of potentialMatches) {
            if (nextUrl.pathname.match(this.regexCache.get(toPattern))) {
              return transition;
            }
          }
          break;
        }
      }
      return null;
    }
  };

  // node_modules/@unseenco/taxi/src/Core.js
  var IN_PROGRESS = "A transition is currently in progress";
  var Core = class {
    isTransitioning = false;
    /**
     * @type {CacheEntry|null}
     */
    currentCacheEntry = null;
    /**
     * @type {Map<string, CacheEntry>}
     */
    cache = /* @__PURE__ */ new Map();
    /**
     * @private
     * @type {Map<string, Promise>}
     */
    activePromises = /* @__PURE__ */ new Map();
    /**
     * @param {{
     * 		links?: string,
     * 		removeOldContent?: boolean,
     * 		allowInterruption?: boolean,
     * 		bypassCache?: boolean,
     * 		enablePrefetch?: boolean,
     * 		renderers?: Object.<string, typeof Renderer>,
     * 		transitions?: Object.<string, typeof Transition>,
     * 		reloadJsFilter?: boolean|function(HTMLElement): boolean,
     * 		reloadCssFilter?: boolean|function(HTMLLinkElement): boolean
     * }} parameters
     */
    constructor(parameters = {}) {
      const {
        links = "a[href]:not([target]):not([href^=\\#]):not([data-taxi-ignore])",
        removeOldContent = true,
        allowInterruption = false,
        bypassCache = false,
        enablePrefetch = true,
        renderers = {
          default: Renderer
        },
        transitions = {
          default: Transition
        },
        reloadJsFilter = (element) => element.dataset.taxiReload !== void 0,
        reloadCssFilter = (element) => true
        //element.dataset.taxiReload !== undefined
      } = parameters;
      this.renderers = renderers;
      this.transitions = transitions;
      this.defaultRenderer = this.renderers.default || Renderer;
      this.defaultTransition = this.transitions.default || Transition;
      this.wrapper = document.querySelector("[data-taxi]");
      this.reloadJsFilter = reloadJsFilter;
      this.reloadCssFilter = reloadCssFilter;
      this.removeOldContent = removeOldContent;
      this.allowInterruption = allowInterruption;
      this.bypassCache = bypassCache;
      this.enablePrefetch = enablePrefetch;
      this.cache = /* @__PURE__ */ new Map();
      this.isPopping = false;
      this.attachEvents(links);
      this.currentLocation = processUrl(window.location.href);
      this.cache.set(this.currentLocation.href, this.createCacheEntry(document.cloneNode(true), window.location.href));
      this.currentCacheEntry = this.cache.get(this.currentLocation.href);
      this.currentCacheEntry.renderer.initialLoad();
    }
    /**
     * @param {string} renderer
     */
    setDefaultRenderer(renderer) {
      this.defaultRenderer = this.renderers[renderer];
    }
    /**
     * @param {string} transition
     */
    setDefaultTransition(transition) {
      this.defaultTransition = this.transitions[transition];
    }
    /**
     * Registers a route into the RouteStore
     *
     * @param {string} fromPattern
     * @param {string} toPattern
     * @param {string} transition
     */
    addRoute(fromPattern, toPattern, transition) {
      if (!this.router) {
        this.router = new RouteStore();
      }
      this.router.add(fromPattern, toPattern, transition);
    }
    /**
     * Prime the cache for a given URL
     *
     * @param {string} url
     * @param {boolean} [preloadAssets]
     * @return {Promise}
     */
    preload(url, preloadAssets = false) {
      url = processUrl(url).href;
      if (!this.cache.has(url)) {
        return this.fetch(url, false).then(async (response) => {
          this.cache.set(url, this.createCacheEntry(response.html, response.url));
          if (preloadAssets) {
            this.cache.get(url).renderer.createDom();
          }
        }).catch((err) => console.warn(err));
      }
      return Promise.resolve();
    }
    /**
     * Updates the HTML cache for a given URL.
     * If no URL is passed, then cache for the current page is updated.
     * Useful when adding/removing content via AJAX such as a search page or infinite loader.
     *
     * @param {string} [url]
     */
    updateCache(url) {
      const key2 = processUrl(url || window.location.href).href;
      if (this.cache.has(key2)) {
        this.cache.delete(key2);
      }
      this.cache.set(key2, this.createCacheEntry(document.cloneNode(true), key2));
    }
    /**
     * Clears the cache for a given URL.
     * If no URL is passed, then cache for the current page is cleared.
     *
     * @param {string} [url]
     */
    clearCache(url) {
      const key2 = processUrl(url || window.location.href).href;
      if (this.cache.has(key2)) {
        this.cache.delete(key2);
      }
    }
    /**
     * @param {string} url
     * @param {string|false} [transition]
     * @param {string|false|HTMLElement} [trigger]
     * @return {Promise<void|Error>}
     */
    navigateTo(url, transition = false, trigger = false) {
      return new Promise((resolve, reject) => {
        if (!this.allowInterruption && this.isTransitioning) {
          reject(new Error(IN_PROGRESS));
          return;
        }
        this.isTransitioning = true;
        this.isPopping = true;
        this.targetLocation = processUrl(url);
        this.popTarget = window.location.href;
        const TransitionClass = new (this.chooseTransition(transition))({ wrapper: this.wrapper });
        let navigationPromise;
        if (this.bypassCache || !this.cache.has(this.targetLocation.href) || this.cache.get(this.targetLocation.href).skipCache) {
          const fetched = this.fetch(this.targetLocation.href).then((response) => {
            this.cache.set(this.targetLocation.href, this.createCacheEntry(response.html, response.url));
            this.cache.get(this.targetLocation.href).renderer.createDom();
          }).catch((err) => {
            window.location.href = url;
          });
          navigationPromise = this.beforeFetch(this.targetLocation, TransitionClass, trigger).then(async () => {
            return fetched.then(async () => {
              return await this.afterFetch(this.targetLocation, TransitionClass, this.cache.get(this.targetLocation.href), trigger);
            });
          });
        } else {
          this.cache.get(this.targetLocation.href).renderer.createDom();
          navigationPromise = this.beforeFetch(this.targetLocation, TransitionClass, trigger).then(async () => {
            return await this.afterFetch(this.targetLocation, TransitionClass, this.cache.get(this.targetLocation.href), trigger);
          });
        }
        navigationPromise.then(() => {
          resolve();
        });
      });
    }
    /**
     * Add an event listener.
     * @param {string} event
     * @param {any} callback
     */
    on(event, callback) {
      e_default.on(event, callback);
    }
    /**
     * Remove an event listener.
     * @param {string} event
     * @param {any} [callback]
     */
    off(event, callback) {
      e_default.off(event, callback);
    }
    /**
     * @private
     * @param {{ raw: string, href: string, hasHash: boolean, pathname: string }} url
     * @param {Transition} TransitionClass
     * @param {string|HTMLElement|false} trigger
     * @return {Promise<void>}
     */
    beforeFetch(url, TransitionClass, trigger) {
      e_default.emit("NAVIGATE_OUT", {
        from: this.currentCacheEntry,
        trigger
      });
      return new Promise((resolve) => {
        this.currentCacheEntry.renderer.leave(TransitionClass, trigger, this.removeOldContent).then(() => {
          if (trigger !== "popstate") {
            window.history.pushState({}, "", url.raw);
          }
          resolve();
        });
      });
    }
    /**
     * @private
     * @param {{ raw: string, href: string, host: string, hasHash: boolean, pathname: string }} url
     * @param {Transition} TransitionClass
     * @param {CacheEntry} entry
     * @param {string|HTMLElement|false} trigger
     * @return {Promise<void>}
     */
    afterFetch(url, TransitionClass, entry, trigger) {
      this.currentLocation = url;
      this.popTarget = this.currentLocation.href;
      return new Promise((resolve) => {
        entry.renderer.update();
        e_default.emit("NAVIGATE_IN", {
          from: this.currentCacheEntry,
          to: entry,
          trigger
        });
        if (this.reloadJsFilter) {
          this.loadScripts(entry.scripts);
        }
        if (this.reloadCssFilter) {
          this.loadStyles(entry.styles);
        }
        if (trigger !== "popstate" && url.href !== processUrl(entry.finalUrl).href) {
          window.history.replaceState({}, "", entry.finalUrl);
        }
        entry.renderer.enter(TransitionClass, trigger).then(() => {
          e_default.emit("NAVIGATE_END", {
            from: this.currentCacheEntry,
            to: entry,
            trigger
          });
          this.currentCacheEntry = entry;
          this.isTransitioning = false;
          this.isPopping = false;
          resolve();
        });
      });
    }
    /**
     * Load up scripts from the target page if needed
     *
     * @param {HTMLElement[]} cachedScripts
     */
    loadScripts(cachedScripts) {
      const newScripts = [...cachedScripts];
      const currentScripts = Array.from(document.querySelectorAll("script")).filter(this.reloadJsFilter);
      for (let i = 0; i < currentScripts.length; i++) {
        for (let n = 0; n < newScripts.length; n++) {
          if (currentScripts[i].outerHTML === newScripts[n].outerHTML) {
            reloadElement(currentScripts[i], "SCRIPT");
            newScripts.splice(n, 1);
            break;
          }
        }
      }
      for (const script of newScripts) {
        appendElement(script, "SCRIPT");
      }
    }
    /**
     * Load up styles from the target page if needed
     *
     * @param {Array<HTMLLinkElement|HTMLStyleElement>} cachedStyles
     */
    loadStyles(cachedStyles) {
      const currentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(this.reloadCssFilter);
      const currentInlineStyles = Array.from(document.querySelectorAll("style")).filter(this.reloadCssFilter);
      const newInlineStyles = cachedStyles.filter((el) => {
        if (!el.href) {
          return true;
        } else if (!currentStyles.find((link) => link.href === el.href)) {
          document.body.append(el);
          return false;
        }
      });
      for (let i = 0; i < currentInlineStyles.length; i++) {
        for (let n = 0; n < newInlineStyles.length; n++) {
          if (currentInlineStyles[i].outerHTML === newInlineStyles[n].outerHTML) {
            reloadElement(currentInlineStyles[i], "STYLE");
            newInlineStyles.splice(n, 1);
            break;
          }
        }
      }
      for (const style of newInlineStyles) {
        appendElement(style, "STYLE");
      }
    }
    /**
     * @private
     * @param {string} links
     */
    attachEvents(links) {
      e_default.delegate("click", links, this.onClick);
      e_default.on("popstate", window, this.onPopstate);
      if (this.enablePrefetch) {
        e_default.delegate("mouseenter focus", links, this.onPrefetch);
      }
    }
    /**
     * @private
     * @param {MouseEvent} e
     */
    onClick = (e) => {
      if (!(e.metaKey || e.ctrlKey)) {
        const target = processUrl(e.currentTarget.href);
        this.currentLocation = processUrl(window.location.href);
        if (this.currentLocation.host !== target.host) {
          return;
        }
        if (this.currentLocation.href !== target.href || this.currentLocation.hasHash && !target.hasHash) {
          e.preventDefault();
          this.navigateTo(target.raw, e.currentTarget.dataset.transition || false, e.currentTarget).catch((err) => console.warn(err));
          return;
        }
        if (!this.currentLocation.hasHash && !target.hasHash) {
          e.preventDefault();
        }
      }
    };
    /**
     * @private
     * @return {void|boolean}
     */
    onPopstate = () => {
      const target = processUrl(window.location.href);
      if (target.pathname === this.currentLocation.pathname && target.search === this.currentLocation.search && !this.isPopping) {
        return false;
      }
      if (!this.allowInterruption && (this.isTransitioning || this.isPopping)) {
        window.history.pushState({}, "", this.popTarget);
        console.warn(IN_PROGRESS);
        return false;
      }
      if (!this.isPopping) {
        this.popTarget = window.location.href;
      }
      this.isPopping = true;
      this.navigateTo(window.location.href, false, "popstate");
    };
    /**
     * @private
     * @param {MouseEvent} e
     */
    onPrefetch = (e) => {
      const target = processUrl(e.currentTarget.href);
      if (this.currentLocation.host !== target.host) {
        return;
      }
      this.preload(e.currentTarget.href, false);
    };
    /**
     * @private
     * @param {string} url
     * @param {boolean} [runFallback]
     * @return {Promise<{html: Document, url: string}>}
     */
    fetch(url, runFallback = true) {
      if (this.activePromises.has(url)) {
        return this.activePromises.get(url);
      }
      const request = new Promise((resolve, reject) => {
        let resolvedUrl;
        fetch(url, {
          mode: "same-origin",
          method: "GET",
          headers: { "X-Requested-With": "Taxi" },
          credentials: "same-origin"
        }).then((response) => {
          if (!response.ok) {
            reject("Taxi encountered a non 2xx HTTP status code");
            if (runFallback) {
              window.location.href = url;
            }
          }
          resolvedUrl = response.url;
          return response.text();
        }).then((htmlString) => {
          resolve({ html: parseDom(htmlString), url: resolvedUrl });
        }).catch((err) => {
          reject(err);
          if (runFallback) {
            window.location.href = url;
          }
        }).finally(() => {
          this.activePromises.delete(url);
        });
      });
      this.activePromises.set(url, request);
      return request;
    }
    /**
     * @private
     * @param {string|false} transition
     * @return {Transition|function}
     */
    chooseTransition(transition) {
      if (transition) {
        return this.transitions[transition];
      }
      const routeTransition = this.router?.findMatch(this.currentLocation, this.targetLocation);
      if (routeTransition) {
        return this.transitions[routeTransition];
      }
      return this.defaultTransition;
    }
    /**
     * @private
     * @param {Document|Node} page
     * @param {string} url
     * @return {CacheEntry}
     */
    createCacheEntry(page, url) {
      const content = page.querySelector("[data-taxi-view]");
      const Renderer2 = content.dataset.taxiView.length ? this.renderers[content.dataset.taxiView] : this.defaultRenderer;
      if (!Renderer2) {
        console.warn(`The Renderer "${content.dataset.taxiView}" was set in the data-taxi-view of the requested page, but not registered in Taxi.`);
      }
      return {
        page,
        content,
        finalUrl: url,
        skipCache: content.hasAttribute("data-taxi-nocache"),
        scripts: this.reloadJsFilter ? Array.from(page.querySelectorAll("script")).filter(this.reloadJsFilter) : [],
        styles: this.reloadCssFilter ? Array.from(page.querySelectorAll('link[rel="stylesheet"], style')).filter(this.reloadCssFilter) : [],
        title: page.title,
        renderer: new Renderer2({
          wrapper: this.wrapper,
          title: page.title,
          content,
          page
        })
      };
    }
  };

  // node_modules/animejs/dist/modules/core/consts.js
  var isBrowser = typeof window !== "undefined";
  var win = isBrowser ? (
    /** @type {AnimeJSWindow} */
    /** @type {unknown} */
    window
  ) : null;
  var doc = isBrowser ? document : null;
  var tweenTypes = {
    OBJECT: 0,
    ATTRIBUTE: 1,
    CSS: 2,
    TRANSFORM: 3,
    CSS_VAR: 4
  };
  var valueTypes = {
    NUMBER: 0,
    UNIT: 1,
    COLOR: 2,
    COMPLEX: 3
  };
  var tickModes = {
    NONE: 0,
    AUTO: 1,
    FORCE: 2
  };
  var compositionTypes = {
    replace: 0,
    none: 1,
    blend: 2
  };
  var isRegisteredTargetSymbol = /* @__PURE__ */ Symbol();
  var isDomSymbol = /* @__PURE__ */ Symbol();
  var isSvgSymbol = /* @__PURE__ */ Symbol();
  var transformsSymbol = /* @__PURE__ */ Symbol();
  var proxyTargetSymbol = /* @__PURE__ */ Symbol();
  var minValue = 1e-11;
  var maxValue = 1e12;
  var K = 1e3;
  var maxFps = 240;
  var emptyString = "";
  var cssVarPrefix = "var(";
  var shortTransforms = /* @__PURE__ */ (() => {
    const map = /* @__PURE__ */ new Map();
    map.set("x", "translateX");
    map.set("y", "translateY");
    map.set("z", "translateZ");
    return map;
  })();
  var validTransforms = [
    "translateX",
    "translateY",
    "translateZ",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "scale",
    "scaleX",
    "scaleY",
    "scaleZ",
    "skew",
    "skewX",
    "skewY",
    "matrix",
    "matrix3d",
    "perspective"
  ];
  var transformsFragmentStrings = /* @__PURE__ */ validTransforms.reduce((a, v) => ({ ...a, [v]: v + "(" }), {});
  var noop = () => {
  };
  var validRgbHslRgx = /\)\s*[-.\d]/;
  var hexTestRgx = /(^#([\da-f]{3}){1,2}$)|(^#([\da-f]{4}){1,2}$)/i;
  var rgbExecRgx = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i;
  var rgbaExecRgx = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i;
  var hslExecRgx = /hsl\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/i;
  var hslaExecRgx = /hsla\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)\s*\)/i;
  var digitWithExponentRgx = /[-+]?\d*\.?\d+(?:e[-+]?\d)?/gi;
  var unitsExecRgx = /^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)([a-z]+|%)$/i;
  var lowerCaseRgx = /([a-z])([A-Z])/g;
  var transformsExecRgx = /(\w+)(\([^)]+\)+)/g;
  var relativeValuesExecRgx = /(\*=|\+=|-=)/;
  var cssVariableMatchRgx = /var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/;

  // node_modules/animejs/dist/modules/core/globals.js
  var defaults = {
    id: null,
    keyframes: null,
    playbackEase: null,
    playbackRate: 1,
    frameRate: maxFps,
    loop: 0,
    reversed: false,
    alternate: false,
    autoplay: true,
    persist: false,
    duration: K,
    delay: 0,
    loopDelay: 0,
    ease: "out(2)",
    composition: compositionTypes.replace,
    modifier: (v) => v,
    onBegin: noop,
    onBeforeUpdate: noop,
    onUpdate: noop,
    onLoop: noop,
    onPause: noop,
    onComplete: noop,
    onRender: noop
  };
  var scope = {
    /** @type {Scope} */
    current: null,
    /** @type {Document|DOMTarget} */
    root: doc
  };
  var globals = {
    /** @type {DefaultsParams} */
    defaults,
    /** @type {Number} */
    precision: 4,
    /** @type {Number} equals 1 in ms mode, 0.001 in s mode */
    timeScale: 1,
    /** @type {Number} */
    tickThreshold: 200
  };
  var devTools = isBrowser && win.AnimeJSDevTools;
  var globalVersions = { version: "4.3.6", engine: null };
  if (isBrowser) {
    if (!win.AnimeJS) win.AnimeJS = [];
    win.AnimeJS.push(globalVersions);
  }

  // node_modules/animejs/dist/modules/core/helpers.js
  var toLowerCase = (str) => str.replace(lowerCaseRgx, "$1-$2").toLowerCase();
  var stringStartsWith = (str, sub) => str.indexOf(sub) === 0;
  var now = Date.now;
  var isArr = Array.isArray;
  var isObj = (a) => a && a.constructor === Object;
  var isNum = (a) => typeof a === "number" && !isNaN(a);
  var isStr = (a) => typeof a === "string";
  var isFnc = (a) => typeof a === "function";
  var isUnd = (a) => typeof a === "undefined";
  var isNil = (a) => isUnd(a) || a === null;
  var isSvg = (a) => isBrowser && a instanceof SVGElement;
  var isHex = (a) => hexTestRgx.test(a);
  var isRgb = (a) => stringStartsWith(a, "rgb");
  var isHsl = (a) => stringStartsWith(a, "hsl");
  var isCol = (a) => isHex(a) || (isRgb(a) || isHsl(a)) && (a[a.length - 1] === ")" || !validRgbHslRgx.test(a));
  var isKey = (a) => !globals.defaults.hasOwnProperty(a);
  var svgCssReservedProperties = ["opacity", "rotate", "overflow", "color"];
  var isValidSVGAttribute = (el, propertyName) => {
    if (svgCssReservedProperties.includes(propertyName)) return false;
    if (el.getAttribute(propertyName) || propertyName in el) {
      if (propertyName === "scale") {
        const elParentNode = (
          /** @type {SVGGeometryElement} */
          /** @type {DOMTarget} */
          el.parentNode
        );
        return elParentNode && elParentNode.tagName === "filter";
      }
      return true;
    }
  };
  var pow = Math.pow;
  var sqrt = Math.sqrt;
  var sin = Math.sin;
  var cos = Math.cos;
  var abs = Math.abs;
  var floor = Math.floor;
  var asin = Math.asin;
  var PI = Math.PI;
  var _round = Math.round;
  var clamp = (v, min, max) => v < min ? min : v > max ? max : v;
  var powCache = {};
  var round = (v, decimalLength) => {
    if (decimalLength < 0) return v;
    if (!decimalLength) return _round(v);
    let p = powCache[decimalLength];
    if (!p) p = powCache[decimalLength] = 10 ** decimalLength;
    return _round(v * p) / p;
  };
  var lerp = (start, end, factor) => start + (end - start) * factor;
  var clampInfinity = (v) => v === Infinity ? maxValue : v === -Infinity ? -maxValue : v;
  var normalizeTime = (v) => v <= minValue ? minValue : clampInfinity(round(v, 11));
  var cloneArray = (a) => isArr(a) ? [...a] : a;
  var mergeObjects = (o1, o2) => {
    const merged = (
      /** @type {T & U} */
      { ...o1 }
    );
    for (let p in o2) {
      const o1p = (
        /** @type {T & U} */
        o1[p]
      );
      merged[p] = isUnd(o1p) ? (
        /** @type {T & U} */
        o2[p]
      ) : o1p;
    }
    return merged;
  };
  var forEachChildren = (parent, callback, reverse, prevProp = "_prev", nextProp = "_next") => {
    let next = parent._head;
    let adjustedNextProp = nextProp;
    if (reverse) {
      next = parent._tail;
      adjustedNextProp = prevProp;
    }
    while (next) {
      const currentNext = next[adjustedNextProp];
      callback(next);
      next = currentNext;
    }
  };
  var removeChild = (parent, child, prevProp = "_prev", nextProp = "_next") => {
    const prev = child[prevProp];
    const next = child[nextProp];
    prev ? prev[nextProp] = next : parent._head = next;
    next ? next[prevProp] = prev : parent._tail = prev;
    child[prevProp] = null;
    child[nextProp] = null;
  };
  var addChild = (parent, child, sortMethod, prevProp = "_prev", nextProp = "_next") => {
    let prev = parent._tail;
    while (prev && sortMethod && sortMethod(prev, child)) prev = prev[prevProp];
    const next = prev ? prev[nextProp] : parent._head;
    prev ? prev[nextProp] = child : parent._head = child;
    next ? next[prevProp] = child : parent._tail = child;
    child[prevProp] = prev;
    child[nextProp] = next;
  };

  // node_modules/animejs/dist/modules/core/transforms.js
  var parseInlineTransforms = (target, propName, animationInlineStyles) => {
    const inlineTransforms = target.style.transform;
    let inlinedStylesPropertyValue;
    if (inlineTransforms) {
      const cachedTransforms = target[transformsSymbol];
      let t;
      while (t = transformsExecRgx.exec(inlineTransforms)) {
        const inlinePropertyName = t[1];
        const inlinePropertyValue = t[2].slice(1, -1);
        cachedTransforms[inlinePropertyName] = inlinePropertyValue;
        if (inlinePropertyName === propName) {
          inlinedStylesPropertyValue = inlinePropertyValue;
          if (animationInlineStyles) {
            animationInlineStyles[propName] = inlinePropertyValue;
          }
        }
      }
    }
    return inlineTransforms && !isUnd(inlinedStylesPropertyValue) ? inlinedStylesPropertyValue : stringStartsWith(propName, "scale") ? "1" : stringStartsWith(propName, "rotate") || stringStartsWith(propName, "skew") ? "0deg" : "0px";
  };

  // node_modules/animejs/dist/modules/core/colors.js
  var rgbToRgba = (rgbValue) => {
    const rgba = rgbExecRgx.exec(rgbValue) || rgbaExecRgx.exec(rgbValue);
    const a = !isUnd(rgba[4]) ? +rgba[4] : 1;
    return [
      +rgba[1],
      +rgba[2],
      +rgba[3],
      a
    ];
  };
  var hexToRgba = (hexValue) => {
    const hexLength = hexValue.length;
    const isShort = hexLength === 4 || hexLength === 5;
    return [
      +("0x" + hexValue[1] + hexValue[isShort ? 1 : 2]),
      +("0x" + hexValue[isShort ? 2 : 3] + hexValue[isShort ? 2 : 4]),
      +("0x" + hexValue[isShort ? 3 : 5] + hexValue[isShort ? 3 : 6]),
      hexLength === 5 || hexLength === 9 ? +(+("0x" + hexValue[isShort ? 4 : 7] + hexValue[isShort ? 4 : 8]) / 255).toFixed(3) : 1
    ];
  };
  var hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  var hslToRgba = (hslValue) => {
    const hsla = hslExecRgx.exec(hslValue) || hslaExecRgx.exec(hslValue);
    const h = +hsla[1] / 360;
    const s = +hsla[2] / 100;
    const l = +hsla[3] / 100;
    const a = !isUnd(hsla[4]) ? +hsla[4] : 1;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = round(hue2rgb(p, q, h + 1 / 3) * 255, 0);
      g = round(hue2rgb(p, q, h) * 255, 0);
      b = round(hue2rgb(p, q, h - 1 / 3) * 255, 0);
    }
    return [r, g, b, a];
  };
  var convertColorStringValuesToRgbaArray = (colorString) => {
    return isRgb(colorString) ? rgbToRgba(colorString) : isHex(colorString) ? hexToRgba(colorString) : isHsl(colorString) ? hslToRgba(colorString) : [0, 0, 0, 1];
  };

  // node_modules/animejs/dist/modules/core/values.js
  var setValue = (targetValue, defaultValue) => {
    return isUnd(targetValue) ? defaultValue : targetValue;
  };
  var getFunctionValue = (value, target, index, total, store) => {
    let func;
    if (isFnc(value)) {
      func = () => {
        const computed = (
          /** @type {Function} */
          value(target, index, total)
        );
        return !isNaN(+computed) ? +computed : computed || 0;
      };
    } else if (isStr(value) && stringStartsWith(value, cssVarPrefix)) {
      func = () => {
        const match = value.match(cssVariableMatchRgx);
        const cssVarName = match[1];
        const fallbackValue = match[2];
        let computed = getComputedStyle(
          /** @type {HTMLElement} */
          target
        )?.getPropertyValue(cssVarName);
        if ((!computed || computed.trim() === emptyString) && fallbackValue) {
          computed = fallbackValue.trim();
        }
        return computed || 0;
      };
    } else {
      return value;
    }
    if (store) store.func = func;
    return func();
  };
  var getTweenType = (target, prop) => {
    return !target[isDomSymbol] ? tweenTypes.OBJECT : (
      // Handle SVG attributes
      target[isSvgSymbol] && isValidSVGAttribute(target, prop) ? tweenTypes.ATTRIBUTE : (
        // Handle CSS Transform properties differently than CSS to allow individual animations
        validTransforms.includes(prop) || shortTransforms.get(prop) ? tweenTypes.TRANSFORM : (
          // CSS variables
          stringStartsWith(prop, "--") ? tweenTypes.CSS_VAR : (
            // All other CSS properties
            prop in /** @type {DOMTarget} */
            target.style ? tweenTypes.CSS : (
              // Handle other DOM Attributes
              prop in target ? tweenTypes.OBJECT : tweenTypes.ATTRIBUTE
            )
          )
        )
      )
    );
  };
  var getCSSValue = (target, propName, animationInlineStyles) => {
    const inlineStyles = target.style[propName];
    if (inlineStyles && animationInlineStyles) {
      animationInlineStyles[propName] = inlineStyles;
    }
    const value = inlineStyles || getComputedStyle(target[proxyTargetSymbol] || target).getPropertyValue(propName);
    return value === "auto" ? "0" : value;
  };
  var getOriginalAnimatableValue = (target, propName, tweenType, animationInlineStyles) => {
    const type = !isUnd(tweenType) ? tweenType : getTweenType(target, propName);
    return type === tweenTypes.OBJECT ? target[propName] || 0 : type === tweenTypes.ATTRIBUTE ? (
      /** @type {DOMTarget} */
      target.getAttribute(propName)
    ) : type === tweenTypes.TRANSFORM ? parseInlineTransforms(
      /** @type {DOMTarget} */
      target,
      propName,
      animationInlineStyles
    ) : type === tweenTypes.CSS_VAR ? getCSSValue(
      /** @type {DOMTarget} */
      target,
      propName,
      animationInlineStyles
    ).trimStart() : getCSSValue(
      /** @type {DOMTarget} */
      target,
      propName,
      animationInlineStyles
    );
  };
  var getRelativeValue = (x, y, operator) => {
    return operator === "-" ? x - y : operator === "+" ? x + y : x * y;
  };
  var createDecomposedValueTargetObject = () => {
    return {
      /** @type {valueTypes} */
      t: valueTypes.NUMBER,
      n: 0,
      u: null,
      o: null,
      d: null,
      s: null
    };
  };
  var decomposeRawValue = (rawValue, targetObject) => {
    targetObject.t = valueTypes.NUMBER;
    targetObject.n = 0;
    targetObject.u = null;
    targetObject.o = null;
    targetObject.d = null;
    targetObject.s = null;
    if (!rawValue) return targetObject;
    const num = +rawValue;
    if (!isNaN(num)) {
      targetObject.n = num;
      return targetObject;
    } else {
      let str = (
        /** @type {String} */
        rawValue
      );
      if (str[1] === "=") {
        targetObject.o = str[0];
        str = str.slice(2);
      }
      const unitMatch = str.includes(" ") ? false : unitsExecRgx.exec(str);
      if (unitMatch) {
        targetObject.t = valueTypes.UNIT;
        targetObject.n = +unitMatch[1];
        targetObject.u = unitMatch[2];
        return targetObject;
      } else if (targetObject.o) {
        targetObject.n = +str;
        return targetObject;
      } else if (isCol(str)) {
        targetObject.t = valueTypes.COLOR;
        targetObject.d = convertColorStringValuesToRgbaArray(str);
        return targetObject;
      } else {
        const matchedNumbers = str.match(digitWithExponentRgx);
        targetObject.t = valueTypes.COMPLEX;
        targetObject.d = matchedNumbers ? matchedNumbers.map(Number) : [];
        targetObject.s = str.split(digitWithExponentRgx) || [];
        return targetObject;
      }
    }
  };
  var decomposeTweenValue = (tween, targetObject) => {
    targetObject.t = tween._valueType;
    targetObject.n = tween._toNumber;
    targetObject.u = tween._unit;
    targetObject.o = null;
    targetObject.d = cloneArray(tween._toNumbers);
    targetObject.s = cloneArray(tween._strings);
    return targetObject;
  };
  var decomposedOriginalValue = createDecomposedValueTargetObject();

  // node_modules/animejs/dist/modules/core/render.js
  var render = (tickable, time, muteCallbacks, internalRender, tickMode) => {
    const parent = tickable.parent;
    const duration = tickable.duration;
    const completed = tickable.completed;
    const iterationDuration = tickable.iterationDuration;
    const iterationCount = tickable.iterationCount;
    const _currentIteration = tickable._currentIteration;
    const _loopDelay = tickable._loopDelay;
    const _reversed = tickable._reversed;
    const _alternate = tickable._alternate;
    const _hasChildren = tickable._hasChildren;
    const tickableDelay = tickable._delay;
    const tickablePrevAbsoluteTime = tickable._currentTime;
    const tickableEndTime = tickableDelay + iterationDuration;
    const tickableAbsoluteTime = time - tickableDelay;
    const tickablePrevTime = clamp(tickablePrevAbsoluteTime, -tickableDelay, duration);
    const tickableCurrentTime = clamp(tickableAbsoluteTime, -tickableDelay, duration);
    const deltaTime = tickableAbsoluteTime - tickablePrevAbsoluteTime;
    const isCurrentTimeAboveZero = tickableCurrentTime > 0;
    const isCurrentTimeEqualOrAboveDuration = tickableCurrentTime >= duration;
    const isSetter = duration <= minValue;
    const forcedTick = tickMode === tickModes.FORCE;
    let isOdd = 0;
    let iterationElapsedTime = tickableAbsoluteTime;
    let hasRendered = 0;
    if (iterationCount > 1) {
      const currentIteration = ~~(tickableCurrentTime / (iterationDuration + (isCurrentTimeEqualOrAboveDuration ? 0 : _loopDelay)));
      tickable._currentIteration = clamp(currentIteration, 0, iterationCount);
      if (isCurrentTimeEqualOrAboveDuration) tickable._currentIteration--;
      isOdd = tickable._currentIteration % 2;
      iterationElapsedTime = tickableCurrentTime % (iterationDuration + _loopDelay) || 0;
    }
    const isReversed = _reversed ^ (_alternate && isOdd);
    const _ease = (
      /** @type {Renderable} */
      tickable._ease
    );
    let iterationTime = isCurrentTimeEqualOrAboveDuration ? isReversed ? 0 : duration : isReversed ? iterationDuration - iterationElapsedTime : iterationElapsedTime;
    if (_ease) iterationTime = iterationDuration * _ease(iterationTime / iterationDuration) || 0;
    const isRunningBackwards = (parent ? parent.backwards : tickableAbsoluteTime < tickablePrevAbsoluteTime) ? !isReversed : !!isReversed;
    tickable._currentTime = tickableAbsoluteTime;
    tickable._iterationTime = iterationTime;
    tickable.backwards = isRunningBackwards;
    if (isCurrentTimeAboveZero && !tickable.began) {
      tickable.began = true;
      if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
        tickable.onBegin(
          /** @type {CallbackArgument} */
          tickable
        );
      }
    } else if (tickableAbsoluteTime <= 0) {
      tickable.began = false;
    }
    if (!muteCallbacks && !_hasChildren && isCurrentTimeAboveZero && tickable._currentIteration !== _currentIteration) {
      tickable.onLoop(
        /** @type {CallbackArgument} */
        tickable
      );
    }
    if (forcedTick || tickMode === tickModes.AUTO && (time >= tickableDelay && time <= tickableEndTime || // Normal render
    time <= tickableDelay && tickablePrevTime > tickableDelay || // Playhead is before the animation start time so make sure the animation is at its initial state
    time >= tickableEndTime && tickablePrevTime !== duration) || iterationTime >= tickableEndTime && tickablePrevTime !== duration || iterationTime <= tickableDelay && tickablePrevTime > 0 || time <= tickablePrevTime && tickablePrevTime === duration && completed || // Force a render if a seek occurs on an completed animation
    isCurrentTimeEqualOrAboveDuration && !completed && isSetter) {
      if (isCurrentTimeAboveZero) {
        tickable.computeDeltaTime(tickablePrevTime);
        if (!muteCallbacks) tickable.onBeforeUpdate(
          /** @type {CallbackArgument} */
          tickable
        );
      }
      if (!_hasChildren) {
        const forcedRender = forcedTick || (isRunningBackwards ? deltaTime * -1 : deltaTime) >= globals.tickThreshold;
        const absoluteTime = tickable._offset + (parent ? parent._offset : 0) + tickableDelay + iterationTime;
        let tween = (
          /** @type {Tween} */
          /** @type {JSAnimation} */
          tickable._head
        );
        let tweenTarget;
        let tweenStyle;
        let tweenTargetTransforms;
        let tweenTargetTransformsProperties;
        let tweenTransformsNeedUpdate = 0;
        while (tween) {
          const tweenComposition = tween._composition;
          const tweenCurrentTime = tween._currentTime;
          const tweenChangeDuration = tween._changeDuration;
          const tweenAbsEndTime = tween._absoluteStartTime + tween._changeDuration;
          const tweenNextRep = tween._nextRep;
          const tweenPrevRep = tween._prevRep;
          const tweenHasComposition = tweenComposition !== compositionTypes.none;
          if ((forcedRender || (tweenCurrentTime !== tweenChangeDuration || absoluteTime <= tweenAbsEndTime + (tweenNextRep ? tweenNextRep._delay : 0)) && (tweenCurrentTime !== 0 || absoluteTime >= tween._absoluteStartTime)) && (!tweenHasComposition || !tween._isOverridden && (!tween._isOverlapped || absoluteTime <= tweenAbsEndTime) && (!tweenNextRep || (tweenNextRep._isOverridden || absoluteTime <= tweenNextRep._absoluteStartTime)) && (!tweenPrevRep || (tweenPrevRep._isOverridden || absoluteTime >= tweenPrevRep._absoluteStartTime + tweenPrevRep._changeDuration + tween._delay)))) {
            const tweenNewTime = tween._currentTime = clamp(iterationTime - tween._startTime, 0, tweenChangeDuration);
            const tweenProgress = tween._ease(tweenNewTime / tween._updateDuration);
            const tweenModifier = tween._modifier;
            const tweenValueType = tween._valueType;
            const tweenType = tween._tweenType;
            const tweenIsObject = tweenType === tweenTypes.OBJECT;
            const tweenIsNumber = tweenValueType === valueTypes.NUMBER;
            const tweenPrecision = tweenIsNumber && tweenIsObject || tweenProgress === 0 || tweenProgress === 1 ? -1 : globals.precision;
            let value;
            let number;
            if (tweenIsNumber) {
              value = number = /** @type {Number} */
              tweenModifier(round(lerp(tween._fromNumber, tween._toNumber, tweenProgress), tweenPrecision));
            } else if (tweenValueType === valueTypes.UNIT) {
              number = /** @type {Number} */
              tweenModifier(round(lerp(tween._fromNumber, tween._toNumber, tweenProgress), tweenPrecision));
              value = `${number}${tween._unit}`;
            } else if (tweenValueType === valueTypes.COLOR) {
              const fn = tween._fromNumbers;
              const tn = tween._toNumbers;
              const r = round(clamp(
                /** @type {Number} */
                tweenModifier(lerp(fn[0], tn[0], tweenProgress)),
                0,
                255
              ), 0);
              const g = round(clamp(
                /** @type {Number} */
                tweenModifier(lerp(fn[1], tn[1], tweenProgress)),
                0,
                255
              ), 0);
              const b = round(clamp(
                /** @type {Number} */
                tweenModifier(lerp(fn[2], tn[2], tweenProgress)),
                0,
                255
              ), 0);
              const a = clamp(
                /** @type {Number} */
                tweenModifier(round(lerp(fn[3], tn[3], tweenProgress), tweenPrecision)),
                0,
                1
              );
              value = `rgba(${r},${g},${b},${a})`;
              if (tweenHasComposition) {
                const ns = tween._numbers;
                ns[0] = r;
                ns[1] = g;
                ns[2] = b;
                ns[3] = a;
              }
            } else if (tweenValueType === valueTypes.COMPLEX) {
              value = tween._strings[0];
              for (let j = 0, l = tween._toNumbers.length; j < l; j++) {
                const n = (
                  /** @type {Number} */
                  tweenModifier(round(lerp(tween._fromNumbers[j], tween._toNumbers[j], tweenProgress), tweenPrecision))
                );
                const s = tween._strings[j + 1];
                value += `${s ? n + s : n}`;
                if (tweenHasComposition) {
                  tween._numbers[j] = n;
                }
              }
            }
            if (tweenHasComposition) {
              tween._number = number;
            }
            if (!internalRender && tweenComposition !== compositionTypes.blend) {
              const tweenProperty = tween.property;
              tweenTarget = tween.target;
              if (tweenIsObject) {
                tweenTarget[tweenProperty] = value;
              } else if (tweenType === tweenTypes.ATTRIBUTE) {
                tweenTarget.setAttribute(
                  tweenProperty,
                  /** @type {String} */
                  value
                );
              } else {
                tweenStyle = /** @type {DOMTarget} */
                tweenTarget.style;
                if (tweenType === tweenTypes.TRANSFORM) {
                  if (tweenTarget !== tweenTargetTransforms) {
                    tweenTargetTransforms = tweenTarget;
                    tweenTargetTransformsProperties = tweenTarget[transformsSymbol];
                  }
                  tweenTargetTransformsProperties[tweenProperty] = value;
                  tweenTransformsNeedUpdate = 1;
                } else if (tweenType === tweenTypes.CSS) {
                  tweenStyle[tweenProperty] = value;
                } else if (tweenType === tweenTypes.CSS_VAR) {
                  tweenStyle.setProperty(
                    tweenProperty,
                    /** @type {String} */
                    value
                  );
                }
              }
              if (isCurrentTimeAboveZero) hasRendered = 1;
            } else {
              tween._value = value;
            }
          }
          if (tweenTransformsNeedUpdate && tween._renderTransforms) {
            let str = emptyString;
            for (let key2 in tweenTargetTransformsProperties) {
              str += `${transformsFragmentStrings[key2]}${tweenTargetTransformsProperties[key2]}) `;
            }
            tweenStyle.transform = str;
            tweenTransformsNeedUpdate = 0;
          }
          tween = tween._next;
        }
        if (!muteCallbacks && hasRendered) {
          tickable.onRender(
            /** @type {JSAnimation} */
            tickable
          );
        }
      }
      if (!muteCallbacks && isCurrentTimeAboveZero) {
        tickable.onUpdate(
          /** @type {CallbackArgument} */
          tickable
        );
      }
    }
    if (parent && isSetter) {
      if (!muteCallbacks && // (tickableAbsoluteTime > 0 instead) of (tickableAbsoluteTime >= duration) to prevent floating point precision issues
      // see: https://github.com/juliangarnier/anime/issues/1088
      (parent.began && !isRunningBackwards && tickableAbsoluteTime > 0 && !completed || isRunningBackwards && tickableAbsoluteTime <= minValue && completed)) {
        tickable.onComplete(
          /** @type {CallbackArgument} */
          tickable
        );
        tickable.completed = !isRunningBackwards;
      }
    } else if (isCurrentTimeAboveZero && isCurrentTimeEqualOrAboveDuration) {
      if (iterationCount === Infinity) {
        tickable._startTime += tickable.duration;
      } else if (tickable._currentIteration >= iterationCount - 1) {
        tickable.paused = true;
        if (!completed && !_hasChildren) {
          tickable.completed = true;
          if (!muteCallbacks && !(parent && (isRunningBackwards || !parent.began))) {
            tickable.onComplete(
              /** @type {CallbackArgument} */
              tickable
            );
            tickable._resolve(
              /** @type {CallbackArgument} */
              tickable
            );
          }
        }
      }
    } else {
      tickable.completed = false;
    }
    return hasRendered;
  };
  var tick = (tickable, time, muteCallbacks, internalRender, tickMode) => {
    const _currentIteration = tickable._currentIteration;
    render(tickable, time, muteCallbacks, internalRender, tickMode);
    if (tickable._hasChildren) {
      const tl = (
        /** @type {Timeline} */
        tickable
      );
      const tlIsRunningBackwards = tl.backwards;
      const tlChildrenTime = internalRender ? time : tl._iterationTime;
      const tlCildrenTickTime = now();
      let tlChildrenHasRendered = 0;
      let tlChildrenHaveCompleted = true;
      if (!internalRender && tl._currentIteration !== _currentIteration) {
        const tlIterationDuration = tl.iterationDuration;
        forEachChildren(tl, (child) => {
          if (!tlIsRunningBackwards) {
            if (!child.completed && !child.backwards && child._currentTime < child.iterationDuration) {
              render(child, tlIterationDuration, muteCallbacks, 1, tickModes.FORCE);
            }
            child.began = false;
            child.completed = false;
          } else {
            const childDuration = child.duration;
            const childStartTime = child._offset + child._delay;
            const childEndTime = childStartTime + childDuration;
            if (!muteCallbacks && childDuration <= minValue && (!childStartTime || childEndTime === tlIterationDuration)) {
              child.onComplete(child);
            }
          }
        });
        if (!muteCallbacks) tl.onLoop(
          /** @type {CallbackArgument} */
          tl
        );
      }
      forEachChildren(tl, (child) => {
        const childTime = round((tlChildrenTime - child._offset) * child._speed, 12);
        const childTickMode = child._fps < tl._fps ? child.requestTick(tlCildrenTickTime) : tickMode;
        tlChildrenHasRendered += render(child, childTime, muteCallbacks, internalRender, childTickMode);
        if (!child.completed && tlChildrenHaveCompleted) tlChildrenHaveCompleted = false;
      }, tlIsRunningBackwards);
      if (!muteCallbacks && tlChildrenHasRendered) tl.onRender(
        /** @type {CallbackArgument} */
        tl
      );
      if ((tlChildrenHaveCompleted || tlIsRunningBackwards) && tl._currentTime >= tl.duration) {
        tl.paused = true;
        if (!tl.completed) {
          tl.completed = true;
          if (!muteCallbacks) {
            tl.onComplete(
              /** @type {CallbackArgument} */
              tl
            );
            tl._resolve(
              /** @type {CallbackArgument} */
              tl
            );
          }
        }
      }
    }
  };

  // node_modules/animejs/dist/modules/core/styles.js
  var propertyNamesCache = {};
  var sanitizePropertyName = (propertyName, target, tweenType) => {
    if (tweenType === tweenTypes.TRANSFORM) {
      const t = shortTransforms.get(propertyName);
      return t ? t : propertyName;
    } else if (tweenType === tweenTypes.CSS || // Handle special cases where properties like "strokeDashoffset" needs to be set as "stroke-dashoffset"
    // but properties like "baseFrequency" should stay in lowerCamelCase
    tweenType === tweenTypes.ATTRIBUTE && (isSvg(target) && propertyName in /** @type {DOMTarget} */
    target.style)) {
      const cachedPropertyName = propertyNamesCache[propertyName];
      if (cachedPropertyName) {
        return cachedPropertyName;
      } else {
        const lowerCaseName = propertyName ? toLowerCase(propertyName) : propertyName;
        propertyNamesCache[propertyName] = lowerCaseName;
        return lowerCaseName;
      }
    } else {
      return propertyName;
    }
  };
  var cleanInlineStyles = (renderable) => {
    if (renderable._hasChildren) {
      forEachChildren(renderable, cleanInlineStyles, true);
    } else {
      const animation = (
        /** @type {JSAnimation} */
        renderable
      );
      animation.pause();
      forEachChildren(animation, (tween) => {
        const tweenProperty = tween.property;
        const tweenTarget = tween.target;
        if (tweenTarget[isDomSymbol]) {
          const targetStyle = (
            /** @type {DOMTarget} */
            tweenTarget.style
          );
          const originalInlinedValue = tween._inlineValue;
          const tweenHadNoInlineValue = isNil(originalInlinedValue) || originalInlinedValue === emptyString;
          if (tween._tweenType === tweenTypes.TRANSFORM) {
            const cachedTransforms = tweenTarget[transformsSymbol];
            if (tweenHadNoInlineValue) {
              delete cachedTransforms[tweenProperty];
            } else {
              cachedTransforms[tweenProperty] = originalInlinedValue;
            }
            if (tween._renderTransforms) {
              if (!Object.keys(cachedTransforms).length) {
                targetStyle.removeProperty("transform");
              } else {
                let str = emptyString;
                for (let key2 in cachedTransforms) {
                  str += transformsFragmentStrings[key2] + cachedTransforms[key2] + ") ";
                }
                targetStyle.transform = str;
              }
            }
          } else {
            if (tweenHadNoInlineValue) {
              targetStyle.removeProperty(toLowerCase(tweenProperty));
            } else {
              targetStyle[tweenProperty] = originalInlinedValue;
            }
          }
          if (animation._tail === tween) {
            animation.targets.forEach((t) => {
              if (t.getAttribute && t.getAttribute("style") === emptyString) {
                t.removeAttribute("style");
              }
            });
          }
        }
      });
    }
    return renderable;
  };

  // node_modules/animejs/dist/modules/core/clock.js
  var Clock = class {
    /** @param {Number} [initTime] */
    constructor(initTime = 0) {
      this.deltaTime = 0;
      this._currentTime = initTime;
      this._lastTickTime = initTime;
      this._startTime = initTime;
      this._lastTime = initTime;
      this._scheduledTime = 0;
      this._frameDuration = K / maxFps;
      this._fps = maxFps;
      this._speed = 1;
      this._hasChildren = false;
      this._head = null;
      this._tail = null;
    }
    get fps() {
      return this._fps;
    }
    set fps(frameRate) {
      const previousFrameDuration = this._frameDuration;
      const fr = +frameRate;
      const fps = fr < minValue ? minValue : fr;
      const frameDuration = K / fps;
      if (fps > defaults.frameRate) defaults.frameRate = fps;
      this._fps = fps;
      this._frameDuration = frameDuration;
      this._scheduledTime += frameDuration - previousFrameDuration;
    }
    get speed() {
      return this._speed;
    }
    set speed(playbackRate) {
      const pbr = +playbackRate;
      this._speed = pbr < minValue ? minValue : pbr;
    }
    /**
     * @param  {Number} time
     * @return {tickModes}
     */
    requestTick(time) {
      const scheduledTime = this._scheduledTime;
      this._lastTickTime = time;
      if (time < scheduledTime) return tickModes.NONE;
      const frameDuration = this._frameDuration;
      const frameDelta = time - scheduledTime;
      this._scheduledTime += frameDelta < frameDuration ? frameDuration : frameDelta;
      return tickModes.AUTO;
    }
    /**
     * @param  {Number} time
     * @return {Number}
     */
    computeDeltaTime(time) {
      const delta = time - this._lastTime;
      this.deltaTime = delta;
      this._lastTime = time;
      return delta;
    }
  };

  // node_modules/animejs/dist/modules/animation/additive.js
  var additive = {
    animation: null,
    update: noop
  };
  var addAdditiveAnimation = (lookups2) => {
    let animation = additive.animation;
    if (!animation) {
      animation = {
        duration: minValue,
        computeDeltaTime: noop,
        _offset: 0,
        _delay: 0,
        _head: null,
        _tail: null
      };
      additive.animation = animation;
      additive.update = () => {
        lookups2.forEach((propertyAnimation) => {
          for (let propertyName in propertyAnimation) {
            const tweens = propertyAnimation[propertyName];
            const lookupTween = tweens._head;
            if (lookupTween) {
              const valueType = lookupTween._valueType;
              const additiveValues = valueType === valueTypes.COMPLEX || valueType === valueTypes.COLOR ? cloneArray(lookupTween._fromNumbers) : null;
              let additiveValue = lookupTween._fromNumber;
              let tween = tweens._tail;
              while (tween && tween !== lookupTween) {
                if (additiveValues) {
                  for (let i = 0, l = tween._numbers.length; i < l; i++) additiveValues[i] += tween._numbers[i];
                } else {
                  additiveValue += tween._number;
                }
                tween = tween._prevAdd;
              }
              lookupTween._toNumber = additiveValue;
              lookupTween._toNumbers = additiveValues;
            }
          }
        });
        render(animation, 1, 1, 0, tickModes.FORCE);
      };
    }
    return animation;
  };

  // node_modules/animejs/dist/modules/engine/engine.js
  var engineTickMethod = /* @__PURE__ */ (() => isBrowser ? requestAnimationFrame : setImmediate)();
  var engineCancelMethod = /* @__PURE__ */ (() => isBrowser ? cancelAnimationFrame : clearImmediate)();
  var Engine = class extends Clock {
    /** @param {Number} [initTime] */
    constructor(initTime) {
      super(initTime);
      this.useDefaultMainLoop = true;
      this.pauseOnDocumentHidden = true;
      this.defaults = defaults;
      this.paused = true;
      this.reqId = 0;
    }
    update() {
      const time = this._currentTime = now();
      if (this.requestTick(time)) {
        this.computeDeltaTime(time);
        const engineSpeed = this._speed;
        const engineFps = this._fps;
        let activeTickable = (
          /** @type {Tickable} */
          this._head
        );
        while (activeTickable) {
          const nextTickable = activeTickable._next;
          if (!activeTickable.paused) {
            tick(
              activeTickable,
              (time - activeTickable._startTime) * activeTickable._speed * engineSpeed,
              0,
              // !muteCallbacks
              0,
              // !internalRender
              activeTickable._fps < engineFps ? activeTickable.requestTick(time) : tickModes.AUTO
            );
          } else {
            removeChild(this, activeTickable);
            this._hasChildren = !!this._tail;
            activeTickable._running = false;
            if (activeTickable.completed && !activeTickable._cancelled) {
              activeTickable.cancel();
            }
          }
          activeTickable = nextTickable;
        }
        additive.update();
      }
    }
    wake() {
      if (this.useDefaultMainLoop && !this.reqId) {
        this.requestTick(now());
        this.reqId = engineTickMethod(tickEngine);
      }
      return this;
    }
    pause() {
      if (!this.reqId) return;
      this.paused = true;
      return killEngine();
    }
    resume() {
      if (!this.paused) return;
      this.paused = false;
      forEachChildren(this, (child) => child.resetTime());
      return this.wake();
    }
    // Getter and setter for speed
    get speed() {
      return this._speed * (globals.timeScale === 1 ? 1 : K);
    }
    set speed(playbackRate) {
      this._speed = playbackRate * globals.timeScale;
      forEachChildren(this, (child) => child.speed = child._speed);
    }
    // Getter and setter for timeUnit
    get timeUnit() {
      return globals.timeScale === 1 ? "ms" : "s";
    }
    set timeUnit(unit) {
      const secondsScale = 1e-3;
      const isSecond = unit === "s";
      const newScale = isSecond ? secondsScale : 1;
      if (globals.timeScale !== newScale) {
        globals.timeScale = newScale;
        globals.tickThreshold = 200 * newScale;
        const scaleFactor = isSecond ? secondsScale : K;
        this.defaults.duration *= scaleFactor;
        this._speed *= scaleFactor;
      }
    }
    // Getter and setter for precision
    get precision() {
      return globals.precision;
    }
    set precision(precision) {
      globals.precision = precision;
    }
  };
  var engine = /* @__PURE__ */ (() => {
    const engine2 = new Engine(now());
    if (isBrowser) {
      globalVersions.engine = engine2;
      doc.addEventListener("visibilitychange", () => {
        if (!engine2.pauseOnDocumentHidden) return;
        doc.hidden ? engine2.pause() : engine2.resume();
      });
    }
    return engine2;
  })();
  var tickEngine = () => {
    if (engine._head) {
      engine.reqId = engineTickMethod(tickEngine);
      engine.update();
    } else {
      engine.reqId = 0;
    }
  };
  var killEngine = () => {
    engineCancelMethod(
      /** @type {NodeJS.Immediate & Number} */
      engine.reqId
    );
    engine.reqId = 0;
    return engine;
  };

  // node_modules/animejs/dist/modules/animation/composition.js
  var lookups = {
    /** @type {TweenReplaceLookups} */
    _rep: /* @__PURE__ */ new WeakMap(),
    /** @type {TweenAdditiveLookups} */
    _add: /* @__PURE__ */ new Map()
  };
  var getTweenSiblings = (target, property, lookup = "_rep") => {
    const lookupMap = lookups[lookup];
    let targetLookup = lookupMap.get(target);
    if (!targetLookup) {
      targetLookup = {};
      lookupMap.set(target, targetLookup);
    }
    return targetLookup[property] ? targetLookup[property] : targetLookup[property] = {
      _head: null,
      _tail: null
    };
  };
  var addTweenSortMethod = (p, c) => {
    return p._isOverridden || p._absoluteStartTime > c._absoluteStartTime;
  };
  var overrideTween = (tween) => {
    tween._isOverlapped = 1;
    tween._isOverridden = 1;
    tween._changeDuration = minValue;
    tween._currentTime = minValue;
  };
  var composeTween = (tween, siblings) => {
    const tweenCompositionType = tween._composition;
    if (tweenCompositionType === compositionTypes.replace) {
      const tweenAbsStartTime = tween._absoluteStartTime;
      addChild(siblings, tween, addTweenSortMethod, "_prevRep", "_nextRep");
      const prevSibling = tween._prevRep;
      if (prevSibling) {
        const prevParent = prevSibling.parent;
        const prevAbsEndTime = prevSibling._absoluteStartTime + prevSibling._changeDuration;
        if (
          // Check if the previous tween is from a different animation
          tween.parent.id !== prevParent.id && // Check if the animation has loops
          prevParent.iterationCount > 1 && // Check if _absoluteChangeEndTime of last loop overlaps the current tween
          prevAbsEndTime + (prevParent.duration - prevParent.iterationDuration) > tweenAbsStartTime
        ) {
          overrideTween(prevSibling);
          let prevPrevSibling = prevSibling._prevRep;
          while (prevPrevSibling && prevPrevSibling.parent.id === prevParent.id) {
            overrideTween(prevPrevSibling);
            prevPrevSibling = prevPrevSibling._prevRep;
          }
        }
        const absoluteUpdateStartTime = tweenAbsStartTime - tween._delay;
        if (prevAbsEndTime > absoluteUpdateStartTime) {
          const prevChangeStartTime = prevSibling._startTime;
          const prevTLOffset = prevAbsEndTime - (prevChangeStartTime + prevSibling._updateDuration);
          const updatedPrevChangeDuration = round(absoluteUpdateStartTime - prevTLOffset - prevChangeStartTime, 12);
          prevSibling._changeDuration = updatedPrevChangeDuration;
          prevSibling._currentTime = updatedPrevChangeDuration;
          prevSibling._isOverlapped = 1;
          if (updatedPrevChangeDuration < minValue) {
            overrideTween(prevSibling);
          }
        }
        let pausePrevParentAnimation = true;
        forEachChildren(prevParent, (t) => {
          if (!t._isOverlapped) pausePrevParentAnimation = false;
        });
        if (pausePrevParentAnimation) {
          const prevParentTL = prevParent.parent;
          if (prevParentTL) {
            let pausePrevParentTL = true;
            forEachChildren(prevParentTL, (a) => {
              if (a !== prevParent) {
                forEachChildren(a, (t) => {
                  if (!t._isOverlapped) pausePrevParentTL = false;
                });
              }
            });
            if (pausePrevParentTL) {
              prevParentTL.cancel();
            }
          } else {
            prevParent.cancel();
          }
        }
      }
    } else if (tweenCompositionType === compositionTypes.blend) {
      const additiveTweenSiblings = getTweenSiblings(tween.target, tween.property, "_add");
      const additiveAnimation = addAdditiveAnimation(lookups._add);
      let lookupTween = additiveTweenSiblings._head;
      if (!lookupTween) {
        lookupTween = { ...tween };
        lookupTween._composition = compositionTypes.replace;
        lookupTween._updateDuration = minValue;
        lookupTween._startTime = 0;
        lookupTween._numbers = cloneArray(tween._fromNumbers);
        lookupTween._number = 0;
        lookupTween._next = null;
        lookupTween._prev = null;
        addChild(additiveTweenSiblings, lookupTween);
        addChild(additiveAnimation, lookupTween);
      }
      const toNumber = tween._toNumber;
      tween._fromNumber = lookupTween._fromNumber - toNumber;
      tween._toNumber = 0;
      tween._numbers = cloneArray(tween._fromNumbers);
      tween._number = 0;
      lookupTween._fromNumber = toNumber;
      if (tween._toNumbers) {
        const toNumbers = cloneArray(tween._toNumbers);
        if (toNumbers) {
          toNumbers.forEach((value, i) => {
            tween._fromNumbers[i] = lookupTween._fromNumbers[i] - value;
            tween._toNumbers[i] = 0;
          });
        }
        lookupTween._fromNumbers = toNumbers;
      }
      addChild(additiveTweenSiblings, tween, null, "_prevAdd", "_nextAdd");
    }
    return tween;
  };
  var removeTweenSliblings = (tween) => {
    const tweenComposition = tween._composition;
    if (tweenComposition !== compositionTypes.none) {
      const tweenTarget = tween.target;
      const tweenProperty = tween.property;
      const replaceTweensLookup = lookups._rep;
      const replaceTargetProps = replaceTweensLookup.get(tweenTarget);
      const tweenReplaceSiblings = replaceTargetProps[tweenProperty];
      removeChild(tweenReplaceSiblings, tween, "_prevRep", "_nextRep");
      if (tweenComposition === compositionTypes.blend) {
        const addTweensLookup = lookups._add;
        const addTargetProps = addTweensLookup.get(tweenTarget);
        if (!addTargetProps) return;
        const additiveTweenSiblings = addTargetProps[tweenProperty];
        const additiveAnimation = additive.animation;
        removeChild(additiveTweenSiblings, tween, "_prevAdd", "_nextAdd");
        const lookupTween = additiveTweenSiblings._head;
        if (lookupTween && lookupTween === additiveTweenSiblings._tail) {
          removeChild(additiveTweenSiblings, lookupTween, "_prevAdd", "_nextAdd");
          removeChild(additiveAnimation, lookupTween);
          let shouldClean = true;
          for (let prop in addTargetProps) {
            if (addTargetProps[prop]._head) {
              shouldClean = false;
              break;
            }
          }
          if (shouldClean) {
            addTweensLookup.delete(tweenTarget);
          }
        }
      }
    }
    return tween;
  };
  var removeTargetsFromJSAnimation = (targetsArray, animation, propertyName) => {
    let tweensMatchesTargets = false;
    forEachChildren(animation, (tween) => {
      const tweenTarget = tween.target;
      if (targetsArray.includes(tweenTarget)) {
        const tweenName = tween.property;
        const tweenType = tween._tweenType;
        const normalizePropName = sanitizePropertyName(propertyName, tweenTarget, tweenType);
        if (!normalizePropName || normalizePropName && normalizePropName === tweenName) {
          if (tween.parent._tail === tween && tween._tweenType === tweenTypes.TRANSFORM && tween._prev && tween._prev._tweenType === tweenTypes.TRANSFORM) {
            tween._prev._renderTransforms = 1;
          }
          removeChild(animation, tween);
          removeTweenSliblings(tween);
          tweensMatchesTargets = true;
        }
      }
    }, true);
    return tweensMatchesTargets;
  };
  var removeTargetsFromRenderable = (targetsArray, renderable, propertyName) => {
    const parent = (
      /** @type {Renderable|typeof engine} **/
      renderable ? renderable : engine
    );
    let removeMatches;
    if (parent._hasChildren) {
      let iterationDuration = 0;
      forEachChildren(parent, (child) => {
        if (!child._hasChildren) {
          removeMatches = removeTargetsFromJSAnimation(
            targetsArray,
            /** @type {JSAnimation} */
            child,
            propertyName
          );
          if (removeMatches && !child._head) {
            child.cancel();
            removeChild(parent, child);
          } else {
            const childTLOffset = child._offset + child._delay;
            const childDur = childTLOffset + child.duration;
            if (childDur > iterationDuration) {
              iterationDuration = childDur;
            }
          }
        }
        if (child._head) {
          removeTargetsFromRenderable(targetsArray, child, propertyName);
        } else {
          child._hasChildren = false;
        }
      }, true);
      if (!isUnd(
        /** @type {Renderable} */
        parent.iterationDuration
      )) {
        parent.iterationDuration = iterationDuration;
      }
    } else {
      removeMatches = removeTargetsFromJSAnimation(
        targetsArray,
        /** @type {JSAnimation} */
        parent,
        propertyName
      );
    }
    if (removeMatches && !parent._head) {
      parent._hasChildren = false;
      if (
        /** @type {Renderable} */
        parent.cancel
      ) parent.cancel();
    }
  };

  // node_modules/animejs/dist/modules/timer/timer.js
  var resetTimerProperties = (timer) => {
    timer.paused = true;
    timer.began = false;
    timer.completed = false;
    return timer;
  };
  var reviveTimer = (timer) => {
    if (!timer._cancelled) return timer;
    if (timer._hasChildren) {
      forEachChildren(timer, reviveTimer);
    } else {
      forEachChildren(timer, (tween) => {
        if (tween._composition !== compositionTypes.none) {
          composeTween(tween, getTweenSiblings(tween.target, tween.property));
        }
      });
    }
    timer._cancelled = 0;
    return timer;
  };
  var timerId = 0;
  var Timer = class extends Clock {
    /**
     * @param {TimerParams} [parameters]
     * @param {Timeline} [parent]
     * @param {Number} [parentPosition]
     */
    constructor(parameters = {}, parent = null, parentPosition = 0) {
      super(0);
      ++timerId;
      const {
        id,
        delay,
        duration,
        reversed,
        alternate,
        loop,
        loopDelay,
        autoplay,
        frameRate,
        playbackRate,
        onComplete,
        onLoop,
        onPause,
        onBegin,
        onBeforeUpdate,
        onUpdate
      } = parameters;
      if (scope.current) scope.current.register(this);
      const timerInitTime = parent ? 0 : engine._lastTickTime;
      const timerDefaults = parent ? parent.defaults : globals.defaults;
      const timerDelay = (
        /** @type {Number} */
        isFnc(delay) || isUnd(delay) ? timerDefaults.delay : +delay
      );
      const timerDuration = isFnc(duration) || isUnd(duration) ? Infinity : +duration;
      const timerLoop = setValue(loop, timerDefaults.loop);
      const timerLoopDelay = setValue(loopDelay, timerDefaults.loopDelay);
      let timerIterationCount = timerLoop === true || timerLoop === Infinity || /** @type {Number} */
      timerLoop < 0 ? Infinity : (
        /** @type {Number} */
        timerLoop + 1
      );
      if (devTools) {
        const isInfinite = timerIterationCount === Infinity;
        const registered = devTools.register(this, parameters, isInfinite);
        if (registered && isInfinite) {
          const minIterations = alternate ? 2 : 1;
          const iterations = parent ? devTools.maxNestedInfiniteLoops : devTools.maxInfiniteLoops;
          timerIterationCount = Math.max(iterations, minIterations);
        }
      }
      let offsetPosition = 0;
      if (parent) {
        offsetPosition = parentPosition;
      } else {
        if (!engine.reqId) engine.requestTick(now());
        offsetPosition = (engine._lastTickTime - engine._startTime) * globals.timeScale;
      }
      this.id = !isUnd(id) ? id : timerId;
      this.parent = parent;
      this.duration = clampInfinity((timerDuration + timerLoopDelay) * timerIterationCount - timerLoopDelay) || minValue;
      this.backwards = false;
      this.paused = true;
      this.began = false;
      this.completed = false;
      this.onBegin = onBegin || timerDefaults.onBegin;
      this.onBeforeUpdate = onBeforeUpdate || timerDefaults.onBeforeUpdate;
      this.onUpdate = onUpdate || timerDefaults.onUpdate;
      this.onLoop = onLoop || timerDefaults.onLoop;
      this.onPause = onPause || timerDefaults.onPause;
      this.onComplete = onComplete || timerDefaults.onComplete;
      this.iterationDuration = timerDuration;
      this.iterationCount = timerIterationCount;
      this._autoplay = parent ? false : setValue(autoplay, timerDefaults.autoplay);
      this._offset = offsetPosition;
      this._delay = timerDelay;
      this._loopDelay = timerLoopDelay;
      this._iterationTime = 0;
      this._currentIteration = 0;
      this._resolve = noop;
      this._running = false;
      this._reversed = +setValue(reversed, timerDefaults.reversed);
      this._reverse = this._reversed;
      this._cancelled = 0;
      this._alternate = setValue(alternate, timerDefaults.alternate);
      this._prev = null;
      this._next = null;
      this._lastTickTime = timerInitTime;
      this._startTime = timerInitTime;
      this._lastTime = timerInitTime;
      this._fps = setValue(frameRate, timerDefaults.frameRate);
      this._speed = setValue(playbackRate, timerDefaults.playbackRate);
    }
    get cancelled() {
      return !!this._cancelled;
    }
    set cancelled(cancelled) {
      cancelled ? this.cancel() : this.reset(true).play();
    }
    get currentTime() {
      return clamp(round(this._currentTime, globals.precision), -this._delay, this.duration);
    }
    set currentTime(time) {
      const paused = this.paused;
      this.pause().seek(+time);
      if (!paused) this.resume();
    }
    get iterationCurrentTime() {
      return clamp(round(this._iterationTime, globals.precision), 0, this.iterationDuration);
    }
    set iterationCurrentTime(time) {
      this.currentTime = this.iterationDuration * this._currentIteration + time;
    }
    get progress() {
      return clamp(round(this._currentTime / this.duration, 10), 0, 1);
    }
    set progress(progress) {
      this.currentTime = this.duration * progress;
    }
    get iterationProgress() {
      return clamp(round(this._iterationTime / this.iterationDuration, 10), 0, 1);
    }
    set iterationProgress(progress) {
      const iterationDuration = this.iterationDuration;
      this.currentTime = iterationDuration * this._currentIteration + iterationDuration * progress;
    }
    get currentIteration() {
      return this._currentIteration;
    }
    set currentIteration(iterationCount) {
      this.currentTime = this.iterationDuration * clamp(+iterationCount, 0, this.iterationCount - 1);
    }
    get reversed() {
      return !!this._reversed;
    }
    set reversed(reverse) {
      reverse ? this.reverse() : this.play();
    }
    get speed() {
      return super.speed;
    }
    set speed(playbackRate) {
      super.speed = playbackRate;
      this.resetTime();
    }
    /**
     * @param  {Boolean} [softReset]
     * @return {this}
     */
    reset(softReset = false) {
      reviveTimer(this);
      if (this._reversed && !this._reverse) this.reversed = false;
      this._iterationTime = this.iterationDuration;
      tick(this, 0, 1, ~~softReset, tickModes.FORCE);
      resetTimerProperties(this);
      if (this._hasChildren) {
        forEachChildren(this, resetTimerProperties);
      }
      return this;
    }
    /**
     * @param  {Boolean} internalRender
     * @return {this}
     */
    init(internalRender = false) {
      this.fps = this._fps;
      this.speed = this._speed;
      if (!internalRender && this._hasChildren) {
        tick(this, this.duration, 1, ~~internalRender, tickModes.FORCE);
      }
      this.reset(internalRender);
      const autoplay = this._autoplay;
      if (autoplay === true) {
        this.resume();
      } else if (autoplay && !isUnd(
        /** @type {ScrollObserver} */
        autoplay.linked
      )) {
        autoplay.link(this);
      }
      return this;
    }
    /** @return {this} */
    resetTime() {
      const timeScale = 1 / (this._speed * engine._speed);
      this._startTime = now() - (this._currentTime + this._delay) * timeScale;
      return this;
    }
    /** @return {this} */
    pause() {
      if (this.paused) return this;
      this.paused = true;
      this.onPause(this);
      return this;
    }
    /** @return {this} */
    resume() {
      if (!this.paused) return this;
      this.paused = false;
      if (this.duration <= minValue && !this._hasChildren) {
        tick(this, minValue, 0, 0, tickModes.FORCE);
      } else {
        if (!this._running) {
          addChild(engine, this);
          engine._hasChildren = true;
          this._running = true;
        }
        this.resetTime();
        this._startTime -= 12;
        engine.wake();
      }
      return this;
    }
    /** @return {this} */
    restart() {
      return this.reset().resume();
    }
    /**
     * @param  {Number} time
     * @param  {Boolean|Number} [muteCallbacks]
     * @param  {Boolean|Number} [internalRender]
     * @return {this}
     */
    seek(time, muteCallbacks = 0, internalRender = 0) {
      reviveTimer(this);
      this.completed = false;
      const isPaused = this.paused;
      this.paused = true;
      tick(this, time + this._delay, ~~muteCallbacks, ~~internalRender, tickModes.AUTO);
      return isPaused ? this : this.resume();
    }
    /** @return {this} */
    alternate() {
      const reversed = this._reversed;
      const count = this.iterationCount;
      const duration = this.iterationDuration;
      const iterations = count === Infinity ? floor(maxValue / duration) : count;
      this._reversed = +(this._alternate && !(iterations % 2) ? reversed : !reversed);
      if (count === Infinity) {
        this.iterationProgress = this._reversed ? 1 - this.iterationProgress : this.iterationProgress;
      } else {
        this.seek(duration * iterations - this._currentTime);
      }
      this.resetTime();
      return this;
    }
    /** @return {this} */
    play() {
      if (this._reversed) this.alternate();
      return this.resume();
    }
    /** @return {this} */
    reverse() {
      if (!this._reversed) this.alternate();
      return this.resume();
    }
    // TODO: Move all the animation / tweens / children related code to Animation / Timeline
    /** @return {this} */
    cancel() {
      if (this._hasChildren) {
        forEachChildren(this, (child) => child.cancel(), true);
      } else {
        forEachChildren(this, removeTweenSliblings);
      }
      this._cancelled = 1;
      return this.pause();
    }
    /**
     * @param  {Number} newDuration
     * @return {this}
     */
    stretch(newDuration) {
      const currentDuration = this.duration;
      const normlizedDuration = normalizeTime(newDuration);
      if (currentDuration === normlizedDuration) return this;
      const timeScale = newDuration / currentDuration;
      const isSetter = newDuration <= minValue;
      this.duration = isSetter ? minValue : normlizedDuration;
      this.iterationDuration = isSetter ? minValue : normalizeTime(this.iterationDuration * timeScale);
      this._offset *= timeScale;
      this._delay *= timeScale;
      this._loopDelay *= timeScale;
      return this;
    }
    /**
      * Cancels the timer by seeking it back to 0 and reverting the attached scroller if necessary
      * @return {this}
      */
    revert() {
      tick(this, 0, 1, 0, tickModes.AUTO);
      const ap = (
        /** @type {ScrollObserver} */
        this._autoplay
      );
      if (ap && ap.linked && ap.linked === this) ap.revert();
      return this.cancel();
    }
    /**
      * Imediatly completes the timer, cancels it and triggers the onComplete callback
      * @param  {Boolean|Number} [muteCallbacks]
      * @return {this}
      */
    complete(muteCallbacks = 0) {
      return this.seek(this.duration, muteCallbacks).cancel();
    }
    /**
     * @typedef {this & {then: null}} ResolvedTimer
     */
    /**
     * @param  {Callback<ResolvedTimer>} [callback]
     * @return Promise<this>
     */
    then(callback = noop) {
      const then = this.then;
      const onResolve = () => {
        this.then = null;
        callback(
          /** @type {ResolvedTimer} */
          this
        );
        this.then = then;
        this._resolve = noop;
      };
      return new Promise((r) => {
        this._resolve = () => r(onResolve());
        if (this.completed) this._resolve();
        return this;
      });
    }
  };

  // node_modules/animejs/dist/modules/core/targets.js
  function getNodeList(v) {
    const n = isStr(v) ? scope.root.querySelectorAll(v) : v;
    if (n instanceof NodeList || n instanceof HTMLCollection) return n;
  }
  function parseTargets(targets) {
    if (isNil(targets)) return (
      /** @type {TargetsArray} */
      []
    );
    if (!isBrowser) return (
      /** @type {JSTargetsArray} */
      isArr(targets) && targets.flat(Infinity) || [targets]
    );
    if (isArr(targets)) {
      const flattened = targets.flat(Infinity);
      const parsed = [];
      for (let i = 0, l = flattened.length; i < l; i++) {
        const item = flattened[i];
        if (!isNil(item)) {
          const nodeList2 = getNodeList(item);
          if (nodeList2) {
            for (let j = 0, jl = nodeList2.length; j < jl; j++) {
              const subItem = nodeList2[j];
              if (!isNil(subItem)) {
                let isDuplicate = false;
                for (let k = 0, kl = parsed.length; k < kl; k++) {
                  if (parsed[k] === subItem) {
                    isDuplicate = true;
                    break;
                  }
                }
                if (!isDuplicate) {
                  parsed.push(subItem);
                }
              }
            }
          } else {
            let isDuplicate = false;
            for (let j = 0, jl = parsed.length; j < jl; j++) {
              if (parsed[j] === item) {
                isDuplicate = true;
                break;
              }
            }
            if (!isDuplicate) {
              parsed.push(item);
            }
          }
        }
      }
      return parsed;
    }
    const nodeList = getNodeList(targets);
    if (nodeList) return (
      /** @type {DOMTargetsArray} */
      Array.from(nodeList)
    );
    return (
      /** @type {TargetsArray} */
      [targets]
    );
  }
  function registerTargets(targets) {
    const parsedTargetsArray = parseTargets(targets);
    const parsedTargetsLength = parsedTargetsArray.length;
    if (parsedTargetsLength) {
      for (let i = 0; i < parsedTargetsLength; i++) {
        const target = parsedTargetsArray[i];
        if (!target[isRegisteredTargetSymbol]) {
          target[isRegisteredTargetSymbol] = true;
          const isSvgType = isSvg(target);
          const isDom = (
            /** @type {DOMTarget} */
            target.nodeType || isSvgType
          );
          if (isDom) {
            target[isDomSymbol] = true;
            target[isSvgSymbol] = isSvgType;
            target[transformsSymbol] = {};
          }
        }
      }
    }
    return parsedTargetsArray;
  }

  // node_modules/animejs/dist/modules/core/units.js
  var angleUnitsMap = { "deg": 1, "rad": 180 / PI, "turn": 360 };
  var convertedValuesCache = {};
  var convertValueUnit = (el, decomposedValue, unit, force = false) => {
    const currentUnit = decomposedValue.u;
    const currentNumber = decomposedValue.n;
    if (decomposedValue.t === valueTypes.UNIT && currentUnit === unit) {
      return decomposedValue;
    }
    const cachedKey = currentNumber + currentUnit + unit;
    const cached = convertedValuesCache[cachedKey];
    if (!isUnd(cached) && !force) {
      decomposedValue.n = cached;
    } else {
      let convertedValue;
      if (currentUnit in angleUnitsMap) {
        convertedValue = currentNumber * angleUnitsMap[currentUnit] / angleUnitsMap[unit];
      } else {
        const baseline = 100;
        const tempEl = (
          /** @type {DOMTarget} */
          el.cloneNode()
        );
        const parentNode = el.parentNode;
        const parentEl = parentNode && parentNode !== doc ? parentNode : doc.body;
        parentEl.appendChild(tempEl);
        const elStyle = tempEl.style;
        elStyle.width = baseline + currentUnit;
        const currentUnitWidth = (
          /** @type {HTMLElement} */
          tempEl.offsetWidth || baseline
        );
        elStyle.width = baseline + unit;
        const newUnitWidth = (
          /** @type {HTMLElement} */
          tempEl.offsetWidth || baseline
        );
        const factor = currentUnitWidth / newUnitWidth;
        parentEl.removeChild(tempEl);
        convertedValue = factor * currentNumber;
      }
      decomposedValue.n = convertedValue;
      convertedValuesCache[cachedKey] = convertedValue;
    }
    decomposedValue.t === valueTypes.UNIT;
    decomposedValue.u = unit;
    return decomposedValue;
  };

  // node_modules/animejs/dist/modules/easings/none.js
  var none = (t) => t;

  // node_modules/animejs/dist/modules/easings/eases/parser.js
  var easeInPower = (p = 1.68) => (t) => pow(t, +p);
  var easeTypes = {
    in: (easeIn) => (t) => easeIn(t),
    out: (easeIn) => (t) => 1 - easeIn(1 - t),
    inOut: (easeIn) => (t) => t < 0.5 ? easeIn(t * 2) / 2 : 1 - easeIn(t * -2 + 2) / 2,
    outIn: (easeIn) => (t) => t < 0.5 ? (1 - easeIn(1 - t * 2)) / 2 : (easeIn(t * 2 - 1) + 1) / 2
  };
  var halfPI = PI / 2;
  var doublePI = PI * 2;
  var easeInFunctions = {
    [emptyString]: easeInPower,
    Quad: easeInPower(2),
    Cubic: easeInPower(3),
    Quart: easeInPower(4),
    Quint: easeInPower(5),
    /** @type {EasingFunction} */
    Sine: (t) => 1 - cos(t * halfPI),
    /** @type {EasingFunction} */
    Circ: (t) => 1 - sqrt(1 - t * t),
    /** @type {EasingFunction} */
    Expo: (t) => t ? pow(2, 10 * t - 10) : 0,
    /** @type {EasingFunction} */
    Bounce: (t) => {
      let pow2, b = 4;
      while (t < ((pow2 = pow(2, --b)) - 1) / 11) ;
      return 1 / pow(4, 3 - b) - 7.5625 * pow((pow2 * 3 - 2) / 22 - t, 2);
    },
    /** @type {BackEasing} */
    Back: (overshoot = 1.7) => (t) => (+overshoot + 1) * t * t * t - +overshoot * t * t,
    /** @type {ElasticEasing} */
    Elastic: (amplitude = 1, period = 0.3) => {
      const a = clamp(+amplitude, 1, 10);
      const p = clamp(+period, minValue, 2);
      const s = p / doublePI * asin(1 / a);
      const e = doublePI / p;
      return (t) => t === 0 || t === 1 ? t : -a * pow(2, -10 * (1 - t)) * sin((1 - t - s) * e);
    }
  };
  var eases = /* @__PURE__ */ (() => {
    const list = { linear: none, none };
    for (let type in easeTypes) {
      for (let name in easeInFunctions) {
        const easeIn = easeInFunctions[name];
        const easeType = easeTypes[type];
        list[type + name] = /** @type {EasingFunctionWithParams|EasingFunction} */
        name === emptyString || name === "Back" || name === "Elastic" ? (a, b) => easeType(
          /** @type {EasingFunctionWithParams} */
          easeIn(a, b)
        ) : easeType(
          /** @type {EasingFunction} */
          easeIn
        );
      }
    }
    return (
      /** @type {EasesFunctions} */
      list
    );
  })();
  var easesLookups = { linear: none, none };
  var parseEaseString = (string) => {
    if (easesLookups[string]) return easesLookups[string];
    if (string.indexOf("(") <= -1) {
      const hasParams = easeTypes[string] || string.includes("Back") || string.includes("Elastic");
      const parsedFn = (
        /** @type {EasingFunction} */
        hasParams ? (
          /** @type {EasingFunctionWithParams} */
          eases[string]()
        ) : eases[string]
      );
      return parsedFn ? easesLookups[string] = parsedFn : none;
    } else {
      const split = string.slice(0, -1).split("(");
      const parsedFn = (
        /** @type {EasingFunctionWithParams} */
        eases[split[0]]
      );
      return parsedFn ? easesLookups[string] = parsedFn(...split[1].split(",")) : none;
    }
  };
  var deprecated = ["steps(", "irregular(", "linear(", "cubicBezier("];
  var parseEase = (ease) => {
    if (isStr(ease)) {
      for (let i = 0, l = deprecated.length; i < l; i++) {
        if (stringStartsWith(ease, deprecated[i])) {
          console.warn(`String syntax for \`ease: "${ease}"\` has been removed from the core and replaced by importing and passing the easing function directly: \`ease: ${ease}\``);
          return none;
        }
      }
    }
    const easeFunc = isFnc(ease) ? ease : isStr(ease) ? parseEaseString(
      /** @type {String} */
      ease
    ) : none;
    return easeFunc;
  };

  // node_modules/animejs/dist/modules/animation/animation.js
  var fromTargetObject = createDecomposedValueTargetObject();
  var toTargetObject = createDecomposedValueTargetObject();
  var inlineStylesStore = {};
  var toFunctionStore = { func: null };
  var fromFunctionStore = { func: null };
  var keyframesTargetArray = [null];
  var fastSetValuesArray = [null, null];
  var keyObjectTarget = { to: null };
  var tweenId = 0;
  var JSAnimationId = 0;
  var keyframes;
  var key;
  var generateKeyframes = (keyframes2, parameters) => {
    const properties = {};
    if (isArr(keyframes2)) {
      const propertyNames = [].concat(.../** @type {DurationKeyframes} */
      keyframes2.map((key2) => Object.keys(key2))).filter(isKey);
      for (let i = 0, l = propertyNames.length; i < l; i++) {
        const propName = propertyNames[i];
        const propArray = (
          /** @type {DurationKeyframes} */
          keyframes2.map((key2) => {
            const newKey = {};
            for (let p in key2) {
              const keyValue = (
                /** @type {TweenPropValue} */
                key2[p]
              );
              if (isKey(p)) {
                if (p === propName) {
                  newKey.to = keyValue;
                }
              } else {
                newKey[p] = keyValue;
              }
            }
            return newKey;
          })
        );
        properties[propName] = /** @type {ArraySyntaxValue} */
        propArray;
      }
    } else {
      const totalDuration = (
        /** @type {Number} */
        setValue(parameters.duration, globals.defaults.duration)
      );
      const keys = Object.keys(keyframes2).map((key2) => {
        return { o: parseFloat(key2) / 100, p: keyframes2[key2] };
      }).sort((a, b) => a.o - b.o);
      keys.forEach((key2) => {
        const offset = key2.o;
        const prop = key2.p;
        for (let name in prop) {
          if (isKey(name)) {
            let propArray = (
              /** @type {Array} */
              properties[name]
            );
            if (!propArray) propArray = properties[name] = [];
            const duration = offset * totalDuration;
            let length = propArray.length;
            let prevKey = propArray[length - 1];
            const keyObj = { to: prop[name] };
            let durProgress = 0;
            for (let i = 0; i < length; i++) {
              durProgress += propArray[i].duration;
            }
            if (length === 1) {
              keyObj.from = prevKey.to;
            }
            if (prop.ease) {
              keyObj.ease = prop.ease;
            }
            keyObj.duration = duration - (length ? durProgress : 0);
            propArray.push(keyObj);
          }
        }
        return key2;
      });
      for (let name in properties) {
        const propArray = (
          /** @type {Array} */
          properties[name]
        );
        let prevEase;
        for (let i = 0, l = propArray.length; i < l; i++) {
          const prop = propArray[i];
          const currentEase = prop.ease;
          prop.ease = prevEase ? prevEase : void 0;
          prevEase = currentEase;
        }
        if (!propArray[0].duration) {
          propArray.shift();
        }
      }
    }
    return properties;
  };
  var JSAnimation = class extends Timer {
    /**
     * @param {TargetsParam} targets
     * @param {AnimationParams} parameters
     * @param {Timeline} [parent]
     * @param {Number} [parentPosition]
     * @param {Boolean} [fastSet=false]
     * @param {Number} [index=0]
     * @param {Number} [length=0]
     */
    constructor(targets, parameters, parent, parentPosition, fastSet = false, index = 0, length = 0) {
      super(
        /** @type {TimerParams & AnimationParams} */
        parameters,
        parent,
        parentPosition
      );
      ++JSAnimationId;
      const parsedTargets = registerTargets(targets);
      const targetsLength = parsedTargets.length;
      const kfParams = (
        /** @type {AnimationParams} */
        parameters.keyframes
      );
      const params = (
        /** @type {AnimationParams} */
        kfParams ? mergeObjects(generateKeyframes(
          /** @type {DurationKeyframes} */
          kfParams,
          parameters
        ), parameters) : parameters
      );
      const {
        id,
        delay,
        duration,
        ease,
        playbackEase,
        modifier,
        composition,
        onRender
      } = params;
      const animDefaults = parent ? parent.defaults : globals.defaults;
      const animEase = setValue(ease, animDefaults.ease);
      const animPlaybackEase = setValue(playbackEase, animDefaults.playbackEase);
      const parsedAnimPlaybackEase = animPlaybackEase ? parseEase(animPlaybackEase) : null;
      const hasSpring = !isUnd(
        /** @type {Spring} */
        animEase.ease
      );
      const tEasing = hasSpring ? (
        /** @type {Spring} */
        animEase.ease
      ) : setValue(ease, parsedAnimPlaybackEase ? "linear" : animDefaults.ease);
      const tDuration = hasSpring ? (
        /** @type {Spring} */
        animEase.settlingDuration
      ) : setValue(duration, animDefaults.duration);
      const tDelay = setValue(delay, animDefaults.delay);
      const tModifier = modifier || animDefaults.modifier;
      const tComposition = isUnd(composition) && targetsLength >= K ? compositionTypes.none : !isUnd(composition) ? composition : animDefaults.composition;
      const absoluteOffsetTime = this._offset + (parent ? parent._offset : 0);
      if (hasSpring) animEase.parent = this;
      let iterationDuration = NaN;
      let iterationDelay = NaN;
      let animationAnimationLength = 0;
      let shouldTriggerRender = 0;
      for (let targetIndex = 0; targetIndex < targetsLength; targetIndex++) {
        const target = parsedTargets[targetIndex];
        const ti = index || targetIndex;
        const tl = length || targetsLength;
        let lastTransformGroupIndex = NaN;
        let lastTransformGroupLength = NaN;
        for (let p in params) {
          if (isKey(p)) {
            const tweenType = getTweenType(target, p);
            const propName = sanitizePropertyName(p, target, tweenType);
            let propValue = params[p];
            const isPropValueArray = isArr(propValue);
            if (fastSet && !isPropValueArray) {
              fastSetValuesArray[0] = propValue;
              fastSetValuesArray[1] = propValue;
              propValue = fastSetValuesArray;
            }
            if (isPropValueArray) {
              const arrayLength = (
                /** @type {Array} */
                propValue.length
              );
              const isNotObjectValue = !isObj(propValue[0]);
              if (arrayLength === 2 && isNotObjectValue) {
                keyObjectTarget.to = /** @type {TweenParamValue} */
                /** @type {unknown} */
                propValue;
                keyframesTargetArray[0] = keyObjectTarget;
                keyframes = keyframesTargetArray;
              } else if (arrayLength > 2 && isNotObjectValue) {
                keyframes = [];
                propValue.forEach((v, i) => {
                  if (!i) {
                    fastSetValuesArray[0] = v;
                  } else if (i === 1) {
                    fastSetValuesArray[1] = v;
                    keyframes.push(fastSetValuesArray);
                  } else {
                    keyframes.push(v);
                  }
                });
              } else {
                keyframes = /** @type {Array.<TweenKeyValue>} */
                propValue;
              }
            } else {
              keyframesTargetArray[0] = propValue;
              keyframes = keyframesTargetArray;
            }
            let siblings = null;
            let prevTween = null;
            let firstTweenChangeStartTime = NaN;
            let lastTweenChangeEndTime = 0;
            let tweenIndex = 0;
            for (let l = keyframes.length; tweenIndex < l; tweenIndex++) {
              const keyframe = keyframes[tweenIndex];
              if (isObj(keyframe)) {
                key = keyframe;
              } else {
                keyObjectTarget.to = /** @type {TweenParamValue} */
                keyframe;
                key = keyObjectTarget;
              }
              toFunctionStore.func = null;
              fromFunctionStore.func = null;
              const computedToValue = getFunctionValue(key.to, target, ti, tl, toFunctionStore);
              let tweenToValue;
              if (isObj(computedToValue) && !isUnd(computedToValue.to)) {
                key = computedToValue;
                tweenToValue = computedToValue.to;
              } else {
                tweenToValue = computedToValue;
              }
              const tweenFromValue = getFunctionValue(key.from, target, ti, tl);
              const easeToParse = key.ease || tEasing;
              const easeFunctionResult = getFunctionValue(easeToParse, target, ti, tl);
              const keyEasing = isFnc(easeFunctionResult) || isStr(easeFunctionResult) ? easeFunctionResult : easeToParse;
              const hasSpring2 = !isUnd(keyEasing) && !isUnd(
                /** @type {Spring} */
                keyEasing.ease
              );
              const tweenEasing = hasSpring2 ? (
                /** @type {Spring} */
                keyEasing.ease
              ) : keyEasing;
              const tweenDuration = hasSpring2 ? (
                /** @type {Spring} */
                keyEasing.settlingDuration
              ) : getFunctionValue(setValue(key.duration, l > 1 ? getFunctionValue(tDuration, target, ti, tl) / l : tDuration), target, ti, tl);
              const tweenDelay = getFunctionValue(setValue(key.delay, !tweenIndex ? tDelay : 0), target, ti, tl);
              const computedComposition = getFunctionValue(setValue(key.composition, tComposition), target, ti, tl);
              const tweenComposition = isNum(computedComposition) ? computedComposition : compositionTypes[computedComposition];
              const tweenModifier = key.modifier || tModifier;
              const hasFromvalue = !isUnd(tweenFromValue);
              const hasToValue = !isUnd(tweenToValue);
              const isFromToArray = isArr(tweenToValue);
              const isFromToValue = isFromToArray || hasFromvalue && hasToValue;
              const tweenStartTime = prevTween ? lastTweenChangeEndTime + tweenDelay : tweenDelay;
              const absoluteStartTime = round(absoluteOffsetTime + tweenStartTime, 12);
              if (!shouldTriggerRender && (hasFromvalue || isFromToArray)) shouldTriggerRender = 1;
              let prevSibling = prevTween;
              if (tweenComposition !== compositionTypes.none) {
                if (!siblings) siblings = getTweenSiblings(target, propName);
                let nextSibling = siblings._head;
                while (nextSibling && !nextSibling._isOverridden && nextSibling._absoluteStartTime <= absoluteStartTime) {
                  prevSibling = nextSibling;
                  nextSibling = nextSibling._nextRep;
                  if (nextSibling && nextSibling._absoluteStartTime >= absoluteStartTime) {
                    while (nextSibling) {
                      overrideTween(nextSibling);
                      nextSibling = nextSibling._nextRep;
                    }
                  }
                }
              }
              if (isFromToValue) {
                decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[0], target, ti, tl, fromFunctionStore) : tweenFromValue, fromTargetObject);
                decomposeRawValue(isFromToArray ? getFunctionValue(tweenToValue[1], target, ti, tl, toFunctionStore) : tweenToValue, toTargetObject);
                const originalValue = getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore);
                if (fromTargetObject.t === valueTypes.NUMBER) {
                  if (prevSibling) {
                    if (prevSibling._valueType === valueTypes.UNIT) {
                      fromTargetObject.t = valueTypes.UNIT;
                      fromTargetObject.u = prevSibling._unit;
                    }
                  } else {
                    decomposeRawValue(
                      originalValue,
                      decomposedOriginalValue
                    );
                    if (decomposedOriginalValue.t === valueTypes.UNIT) {
                      fromTargetObject.t = valueTypes.UNIT;
                      fromTargetObject.u = decomposedOriginalValue.u;
                    }
                  }
                }
              } else {
                if (hasToValue) {
                  decomposeRawValue(tweenToValue, toTargetObject);
                } else {
                  if (prevTween) {
                    decomposeTweenValue(prevTween, toTargetObject);
                  } else {
                    decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value : getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore), toTargetObject);
                  }
                }
                if (hasFromvalue) {
                  decomposeRawValue(tweenFromValue, fromTargetObject);
                } else {
                  if (prevTween) {
                    decomposeTweenValue(prevTween, fromTargetObject);
                  } else {
                    decomposeRawValue(parent && prevSibling && prevSibling.parent.parent === parent ? prevSibling._value : (
                      // No need to get and parse the original value if the tween is part of a timeline and has a previous sibling part of the same timeline
                      getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore)
                    ), fromTargetObject);
                  }
                }
              }
              if (fromTargetObject.o) {
                fromTargetObject.n = getRelativeValue(
                  !prevSibling ? decomposeRawValue(
                    getOriginalAnimatableValue(target, propName, tweenType, inlineStylesStore),
                    decomposedOriginalValue
                  ).n : prevSibling._toNumber,
                  fromTargetObject.n,
                  fromTargetObject.o
                );
              }
              if (toTargetObject.o) {
                toTargetObject.n = getRelativeValue(fromTargetObject.n, toTargetObject.n, toTargetObject.o);
              }
              if (fromTargetObject.t !== toTargetObject.t) {
                if (fromTargetObject.t === valueTypes.COMPLEX || toTargetObject.t === valueTypes.COMPLEX) {
                  const complexValue = fromTargetObject.t === valueTypes.COMPLEX ? fromTargetObject : toTargetObject;
                  const notComplexValue = fromTargetObject.t === valueTypes.COMPLEX ? toTargetObject : fromTargetObject;
                  notComplexValue.t = valueTypes.COMPLEX;
                  notComplexValue.s = cloneArray(complexValue.s);
                  notComplexValue.d = complexValue.d.map(() => notComplexValue.n);
                } else if (fromTargetObject.t === valueTypes.UNIT || toTargetObject.t === valueTypes.UNIT) {
                  const unitValue = fromTargetObject.t === valueTypes.UNIT ? fromTargetObject : toTargetObject;
                  const notUnitValue = fromTargetObject.t === valueTypes.UNIT ? toTargetObject : fromTargetObject;
                  notUnitValue.t = valueTypes.UNIT;
                  notUnitValue.u = unitValue.u;
                } else if (fromTargetObject.t === valueTypes.COLOR || toTargetObject.t === valueTypes.COLOR) {
                  const colorValue = fromTargetObject.t === valueTypes.COLOR ? fromTargetObject : toTargetObject;
                  const notColorValue = fromTargetObject.t === valueTypes.COLOR ? toTargetObject : fromTargetObject;
                  notColorValue.t = valueTypes.COLOR;
                  notColorValue.s = colorValue.s;
                  notColorValue.d = [0, 0, 0, 1];
                }
              }
              if (fromTargetObject.u !== toTargetObject.u) {
                let valueToConvert = toTargetObject.u ? fromTargetObject : toTargetObject;
                valueToConvert = convertValueUnit(
                  /** @type {DOMTarget} */
                  target,
                  valueToConvert,
                  toTargetObject.u ? toTargetObject.u : fromTargetObject.u,
                  false
                );
              }
              if (toTargetObject.d && fromTargetObject.d && toTargetObject.d.length !== fromTargetObject.d.length) {
                const longestValue = fromTargetObject.d.length > toTargetObject.d.length ? fromTargetObject : toTargetObject;
                const shortestValue = longestValue === fromTargetObject ? toTargetObject : fromTargetObject;
                shortestValue.d = longestValue.d.map((_, i) => isUnd(shortestValue.d[i]) ? 0 : shortestValue.d[i]);
                shortestValue.s = cloneArray(longestValue.s);
              }
              const tweenUpdateDuration = round(+tweenDuration || minValue, 12);
              let inlineValue = inlineStylesStore[propName];
              if (!isNil(inlineValue)) inlineStylesStore[propName] = null;
              const tween = {
                parent: this,
                id: tweenId++,
                property: propName,
                target,
                _value: null,
                _toFunc: toFunctionStore.func,
                _fromFunc: fromFunctionStore.func,
                _ease: parseEase(tweenEasing),
                _fromNumbers: cloneArray(fromTargetObject.d),
                _toNumbers: cloneArray(toTargetObject.d),
                _strings: cloneArray(toTargetObject.s),
                _fromNumber: fromTargetObject.n,
                _toNumber: toTargetObject.n,
                _numbers: cloneArray(fromTargetObject.d),
                // For additive tween and animatables
                _number: fromTargetObject.n,
                // For additive tween and animatables
                _unit: toTargetObject.u,
                _modifier: tweenModifier,
                _currentTime: 0,
                _startTime: tweenStartTime,
                _delay: +tweenDelay,
                _updateDuration: tweenUpdateDuration,
                _changeDuration: tweenUpdateDuration,
                _absoluteStartTime: absoluteStartTime,
                // NOTE: Investigate bit packing to stores ENUM / BOOL
                _tweenType: tweenType,
                _valueType: toTargetObject.t,
                _composition: tweenComposition,
                _isOverlapped: 0,
                _isOverridden: 0,
                _renderTransforms: 0,
                _inlineValue: inlineValue,
                _prevRep: null,
                // For replaced tween
                _nextRep: null,
                // For replaced tween
                _prevAdd: null,
                // For additive tween
                _nextAdd: null,
                // For additive tween
                _prev: null,
                _next: null
              };
              if (tweenComposition !== compositionTypes.none) {
                composeTween(tween, siblings);
              }
              if (isNaN(firstTweenChangeStartTime)) {
                firstTweenChangeStartTime = tween._startTime;
              }
              lastTweenChangeEndTime = round(tweenStartTime + tweenUpdateDuration, 12);
              prevTween = tween;
              animationAnimationLength++;
              addChild(this, tween);
            }
            if (isNaN(iterationDelay) || firstTweenChangeStartTime < iterationDelay) {
              iterationDelay = firstTweenChangeStartTime;
            }
            if (isNaN(iterationDuration) || lastTweenChangeEndTime > iterationDuration) {
              iterationDuration = lastTweenChangeEndTime;
            }
            if (tweenType === tweenTypes.TRANSFORM) {
              lastTransformGroupIndex = animationAnimationLength - tweenIndex;
              lastTransformGroupLength = animationAnimationLength;
            }
          }
        }
        if (!isNaN(lastTransformGroupIndex)) {
          let i = 0;
          forEachChildren(this, (tween) => {
            if (i >= lastTransformGroupIndex && i < lastTransformGroupLength) {
              tween._renderTransforms = 1;
              if (tween._composition === compositionTypes.blend) {
                forEachChildren(additive.animation, (additiveTween) => {
                  if (additiveTween.id === tween.id) {
                    additiveTween._renderTransforms = 1;
                  }
                });
              }
            }
            i++;
          });
        }
      }
      if (!targetsLength) {
        console.warn(`No target found. Make sure the element you're trying to animate is accessible before creating your animation.`);
      }
      if (iterationDelay) {
        forEachChildren(this, (tween) => {
          if (!(tween._startTime - tween._delay)) {
            tween._delay -= iterationDelay;
          }
          tween._startTime -= iterationDelay;
        });
        iterationDuration -= iterationDelay;
      } else {
        iterationDelay = 0;
      }
      if (!iterationDuration) {
        iterationDuration = minValue;
        this.iterationCount = 0;
      }
      this.targets = parsedTargets;
      this.id = !isUnd(id) ? id : JSAnimationId;
      this.duration = iterationDuration === minValue ? minValue : clampInfinity((iterationDuration + this._loopDelay) * this.iterationCount - this._loopDelay) || minValue;
      this.onRender = onRender || animDefaults.onRender;
      this._ease = parsedAnimPlaybackEase;
      this._delay = iterationDelay;
      this.iterationDuration = iterationDuration;
      if (!this._autoplay && shouldTriggerRender) this.onRender(this);
    }
    /**
     * @param  {Number} newDuration
     * @return {this}
     */
    stretch(newDuration) {
      const currentDuration = this.duration;
      if (currentDuration === normalizeTime(newDuration)) return this;
      const timeScale = newDuration / currentDuration;
      forEachChildren(this, (tween) => {
        tween._updateDuration = normalizeTime(tween._updateDuration * timeScale);
        tween._changeDuration = normalizeTime(tween._changeDuration * timeScale);
        tween._currentTime *= timeScale;
        tween._startTime *= timeScale;
        tween._absoluteStartTime *= timeScale;
      });
      return super.stretch(newDuration);
    }
    /**
     * @return {this}
     */
    refresh() {
      forEachChildren(this, (tween) => {
        const toFunc = tween._toFunc;
        const fromFunc = tween._fromFunc;
        if (toFunc || fromFunc) {
          if (fromFunc) {
            decomposeRawValue(fromFunc(), fromTargetObject);
            if (fromTargetObject.u !== tween._unit && tween.target[isDomSymbol]) {
              convertValueUnit(
                /** @type {DOMTarget} */
                tween.target,
                fromTargetObject,
                tween._unit,
                true
              );
            }
            tween._fromNumbers = cloneArray(fromTargetObject.d);
            tween._fromNumber = fromTargetObject.n;
          } else if (toFunc) {
            decomposeRawValue(getOriginalAnimatableValue(tween.target, tween.property, tween._tweenType), decomposedOriginalValue);
            tween._fromNumbers = cloneArray(decomposedOriginalValue.d);
            tween._fromNumber = decomposedOriginalValue.n;
          }
          if (toFunc) {
            decomposeRawValue(toFunc(), toTargetObject);
            tween._toNumbers = cloneArray(toTargetObject.d);
            tween._strings = cloneArray(toTargetObject.s);
            tween._toNumber = toTargetObject.o ? getRelativeValue(tween._fromNumber, toTargetObject.n, toTargetObject.o) : toTargetObject.n;
          }
        }
      });
      if (this.duration === minValue) this.restart();
      return this;
    }
    /**
     * Cancel the animation and revert all the values affected by this animation to their original state
     * @return {this}
     */
    revert() {
      super.revert();
      return cleanInlineStyles(this);
    }
    /**
     * @typedef {this & {then: null}} ResolvedJSAnimation
     */
    /**
     * @param  {Callback<ResolvedJSAnimation>} [callback]
     * @return Promise<this>
     */
    then(callback) {
      return super.then(callback);
    }
  };
  var animate = (targets, parameters) => new JSAnimation(targets, parameters, null, 0, false).init();

  // node_modules/animejs/dist/modules/timeline/position.js
  var getPrevChildOffset = (timeline, timePosition) => {
    if (stringStartsWith(timePosition, "<")) {
      const goToPrevAnimationOffset = timePosition[1] === "<";
      const prevAnimation = (
        /** @type {Tickable} */
        timeline._tail
      );
      const prevOffset = prevAnimation ? prevAnimation._offset + prevAnimation._delay : 0;
      return goToPrevAnimationOffset ? prevOffset : prevOffset + prevAnimation.duration;
    }
  };
  var parseTimelinePosition = (timeline, timePosition) => {
    let tlDuration = timeline.iterationDuration;
    if (tlDuration === minValue) tlDuration = 0;
    if (isUnd(timePosition)) return tlDuration;
    if (isNum(+timePosition)) return +timePosition;
    const timePosStr = (
      /** @type {String} */
      timePosition
    );
    const tlLabels = timeline ? timeline.labels : null;
    const hasLabels = !isNil(tlLabels);
    const prevOffset = getPrevChildOffset(timeline, timePosStr);
    const hasSibling = !isUnd(prevOffset);
    const matchedRelativeOperator = relativeValuesExecRgx.exec(timePosStr);
    if (matchedRelativeOperator) {
      const fullOperator = matchedRelativeOperator[0];
      const split = timePosStr.split(fullOperator);
      const labelOffset = hasLabels && split[0] ? tlLabels[split[0]] : tlDuration;
      const parsedOffset = hasSibling ? prevOffset : hasLabels ? labelOffset : tlDuration;
      const parsedNumericalOffset = +split[1];
      return getRelativeValue(parsedOffset, parsedNumericalOffset, fullOperator[0]);
    } else {
      return hasSibling ? prevOffset : hasLabels ? !isUnd(tlLabels[timePosStr]) ? tlLabels[timePosStr] : tlDuration : tlDuration;
    }
  };

  // node_modules/animejs/dist/modules/timeline/timeline.js
  function getTimelineTotalDuration(tl) {
    return clampInfinity((tl.iterationDuration + tl._loopDelay) * tl.iterationCount - tl._loopDelay) || minValue;
  }
  function addTlChild(childParams, tl, timePosition, targets, index, length) {
    const isSetter = isNum(childParams.duration) && /** @type {Number} */
    childParams.duration <= minValue;
    const adjustedPosition = isSetter ? timePosition - minValue : timePosition;
    if (tl.composition) tick(tl, adjustedPosition, 1, 1, tickModes.AUTO);
    const tlChild = targets ? new JSAnimation(
      targets,
      /** @type {AnimationParams} */
      childParams,
      tl,
      adjustedPosition,
      false,
      index,
      length
    ) : new Timer(
      /** @type {TimerParams} */
      childParams,
      tl,
      adjustedPosition
    );
    if (tl.composition) tlChild.init(true);
    addChild(tl, tlChild);
    forEachChildren(tl, (child) => {
      const childTLOffset = child._offset + child._delay;
      const childDur = childTLOffset + child.duration;
      if (childDur > tl.iterationDuration) tl.iterationDuration = childDur;
    });
    tl.duration = getTimelineTotalDuration(tl);
    return tl;
  }
  var TLId = 0;
  var Timeline = class extends Timer {
    /**
     * @param {TimelineParams} [parameters]
     */
    constructor(parameters = {}) {
      super(
        /** @type {TimerParams&TimelineParams} */
        parameters,
        null,
        0
      );
      ++TLId;
      this.id = !isUnd(parameters.id) ? parameters.id : TLId;
      this.duration = 0;
      this.labels = {};
      const defaultsParams = parameters.defaults;
      const globalDefaults = globals.defaults;
      this.defaults = defaultsParams ? mergeObjects(defaultsParams, globalDefaults) : globalDefaults;
      this.composition = setValue(parameters.composition, true);
      this.onRender = parameters.onRender || globalDefaults.onRender;
      const tlPlaybackEase = setValue(parameters.playbackEase, globalDefaults.playbackEase);
      this._ease = tlPlaybackEase ? parseEase(tlPlaybackEase) : null;
      this.iterationDuration = 0;
    }
    /**
     * @overload
     * @param {TargetsParam} a1
     * @param {AnimationParams} a2
     * @param {TimelinePosition|StaggerFunction<Number|String>} [a3]
     * @return {this}
     *
     * @overload
     * @param {TimerParams} a1
     * @param {TimelinePosition} [a2]
     * @return {this}
     *
     * @param {TargetsParam|TimerParams} a1
     * @param {TimelinePosition|AnimationParams} a2
     * @param {TimelinePosition|StaggerFunction<Number|String>} [a3]
     */
    add(a1, a2, a3) {
      const isAnim = isObj(a2);
      const isTimer = isObj(a1);
      if (isAnim || isTimer) {
        this._hasChildren = true;
        if (isAnim) {
          const childParams = (
            /** @type {AnimationParams} */
            a2
          );
          if (isFnc(a3)) {
            const staggeredPosition = a3;
            const parsedTargetsArray = parseTargets(
              /** @type {TargetsParam} */
              a1
            );
            const tlDuration = this.duration;
            const tlIterationDuration = this.iterationDuration;
            const id = childParams.id;
            let i = 0;
            const parsedLength = parsedTargetsArray.length;
            parsedTargetsArray.forEach((target) => {
              const staggeredChildParams = { ...childParams };
              this.duration = tlDuration;
              this.iterationDuration = tlIterationDuration;
              if (!isUnd(id)) staggeredChildParams.id = id + "-" + i;
              addTlChild(
                staggeredChildParams,
                this,
                parseTimelinePosition(this, staggeredPosition(target, i, parsedLength, this)),
                target,
                i,
                parsedLength
              );
              i++;
            });
          } else {
            addTlChild(
              childParams,
              this,
              parseTimelinePosition(this, a3),
              /** @type {TargetsParam} */
              a1
            );
          }
        } else {
          addTlChild(
            /** @type TimerParams */
            a1,
            this,
            parseTimelinePosition(this, a2)
          );
        }
        if (this.composition) this.init(true);
        return this;
      }
    }
    /**
     * @overload
     * @param {Tickable} [synced]
     * @param {TimelinePosition} [position]
     * @return {this}
     *
     * @overload
     * @param {globalThis.Animation} [synced]
     * @param {TimelinePosition} [position]
     * @return {this}
     *
     * @overload
     * @param {WAAPIAnimation} [synced]
     * @param {TimelinePosition} [position]
     * @return {this}
     *
     * @param {Tickable|WAAPIAnimation|globalThis.Animation} [synced]
     * @param {TimelinePosition} [position]
     */
    sync(synced, position) {
      if (isUnd(synced) || synced && isUnd(synced.pause)) return this;
      synced.pause();
      const duration = +/** @type {globalThis.Animation} */
      (synced.effect ? (
        /** @type {globalThis.Animation} */
        synced.effect.getTiming().duration
      ) : (
        /** @type {Tickable} */
        synced.duration
      ));
      if (!isUnd(synced) && !isUnd(
        /** @type {WAAPIAnimation} */
        synced.persist
      )) {
        synced.persist = true;
      }
      return this.add(synced, { currentTime: [0, duration], duration, delay: 0, ease: "linear", playbackEase: "linear" }, position);
    }
    /**
     * @param  {TargetsParam} targets
     * @param  {AnimationParams} parameters
     * @param  {TimelinePosition} [position]
     * @return {this}
     */
    set(targets, parameters, position) {
      if (isUnd(parameters)) return this;
      parameters.duration = minValue;
      parameters.composition = compositionTypes.replace;
      return this.add(targets, parameters, position);
    }
    /**
     * @param {Callback<Timer>} callback
     * @param {TimelinePosition} [position]
     * @return {this}
     */
    call(callback, position) {
      if (isUnd(callback) || callback && !isFnc(callback)) return this;
      return this.add({ duration: 0, delay: 0, onComplete: () => callback(this) }, position);
    }
    /**
     * @param {String} labelName
     * @param {TimelinePosition} [position]
     * @return {this}
     *
     */
    label(labelName, position) {
      if (isUnd(labelName) || labelName && !isStr(labelName)) return this;
      this.labels[labelName] = parseTimelinePosition(this, position);
      return this;
    }
    /**
     * @param  {TargetsParam} targets
     * @param  {String} [propertyName]
     * @return {this}
     */
    remove(targets, propertyName) {
      removeTargetsFromRenderable(parseTargets(targets), this, propertyName);
      return this;
    }
    /**
     * @param  {Number} newDuration
     * @return {this}
     */
    stretch(newDuration) {
      const currentDuration = this.duration;
      if (currentDuration === normalizeTime(newDuration)) return this;
      const timeScale = newDuration / currentDuration;
      const labels = this.labels;
      forEachChildren(this, (child) => child.stretch(child.duration * timeScale));
      for (let labelName in labels) labels[labelName] *= timeScale;
      return super.stretch(newDuration);
    }
    /**
     * @return {this}
     */
    refresh() {
      forEachChildren(this, (child) => {
        if (
          /** @type {JSAnimation} */
          child.refresh
        ) child.refresh();
      });
      return this;
    }
    /**
     * @return {this}
     */
    revert() {
      super.revert();
      forEachChildren(this, (child) => child.revert, true);
      return cleanInlineStyles(this);
    }
    /**
     * @typedef {this & {then: null}} ResolvedTimeline
     */
    /**
     * @param  {Callback<ResolvedTimeline>} [callback]
     * @return Promise<this>
     */
    then(callback) {
      return super.then(callback);
    }
  };
  var createTimeline = (parameters) => new Timeline(parameters).init();

  // node_modules/animejs/dist/modules/waapi/composition.js
  var WAAPIAnimationsLookups = {
    _head: null,
    _tail: null
  };
  var removeWAAPIAnimation = ($el, property, parent) => {
    let nextLookup = WAAPIAnimationsLookups._head;
    let anim;
    while (nextLookup) {
      const next = nextLookup._next;
      const matchTarget = nextLookup.$el === $el;
      const matchProperty = !property || nextLookup.property === property;
      const matchParent = !parent || nextLookup.parent === parent;
      if (matchTarget && matchProperty && matchParent) {
        anim = nextLookup.animation;
        try {
          anim.commitStyles();
        } catch {
        }
        anim.cancel();
        removeChild(WAAPIAnimationsLookups, nextLookup);
        const lookupParent = nextLookup.parent;
        if (lookupParent) {
          lookupParent._completed++;
          if (lookupParent.animations.length === lookupParent._completed) {
            lookupParent.completed = true;
            lookupParent.paused = true;
            if (!lookupParent.muteCallbacks) {
              lookupParent.onComplete(lookupParent);
              lookupParent._resolve(lookupParent);
            }
          }
        }
      }
      nextLookup = next;
    }
    return anim;
  };
  var addWAAPIAnimation = (parent, $el, property, keyframes2, params) => {
    const animation = $el.animate(keyframes2, params);
    const animTotalDuration = params.delay + +params.duration * params.iterations;
    animation.playbackRate = parent._speed;
    if (parent.paused) animation.pause();
    if (parent.duration < animTotalDuration) {
      parent.duration = animTotalDuration;
      parent.controlAnimation = animation;
    }
    parent.animations.push(animation);
    removeWAAPIAnimation($el, property);
    addChild(WAAPIAnimationsLookups, { parent, animation, $el, property, _next: null, _prev: null });
    const handleRemove = () => removeWAAPIAnimation($el, property, parent);
    animation.oncancel = handleRemove;
    animation.onremove = handleRemove;
    if (!parent.persist) {
      animation.onfinish = handleRemove;
    }
    return animation;
  };

  // node_modules/animejs/dist/modules/easings/cubic-bezier/index.js
  var calcBezier = (aT, aA1, aA2) => (((1 - 3 * aA2 + 3 * aA1) * aT + (3 * aA2 - 6 * aA1)) * aT + 3 * aA1) * aT;
  var binarySubdivide = (aX, mX1, mX2) => {
    let aA = 0, aB = 1, currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (abs(currentX) > 1e-7 && ++i < 100);
    return currentT;
  };
  var cubicBezier = (mX1 = 0.5, mY1 = 0, mX2 = 0.5, mY2 = 1) => mX1 === mY1 && mX2 === mY2 ? none : (t) => t === 0 || t === 1 ? t : calcBezier(binarySubdivide(t, mX1, mX2), mY1, mY2);

  // node_modules/animejs/dist/modules/waapi/waapi.js
  var easingToLinear = (fn, samples = 100) => {
    const points = [];
    for (let i = 0; i <= samples; i++) points.push(round(fn(i / samples), 4));
    return `linear(${points.join(", ")})`;
  };
  var WAAPIEasesLookups = {};
  var parseWAAPIEasing = (ease) => {
    let parsedEase = WAAPIEasesLookups[ease];
    if (parsedEase) return parsedEase;
    parsedEase = "linear";
    if (isStr(ease)) {
      if (stringStartsWith(ease, "linear") || stringStartsWith(ease, "cubic-") || stringStartsWith(ease, "steps") || stringStartsWith(ease, "ease")) {
        parsedEase = ease;
      } else if (stringStartsWith(ease, "cubicB")) {
        parsedEase = toLowerCase(ease);
      } else {
        const parsed = parseEaseString(ease);
        if (isFnc(parsed)) parsedEase = parsed === none ? "linear" : easingToLinear(parsed);
      }
      WAAPIEasesLookups[ease] = parsedEase;
    } else if (isFnc(ease)) {
      const easing = easingToLinear(ease);
      if (easing) parsedEase = easing;
    } else if (
      /** @type {Spring} */
      ease.ease
    ) {
      parsedEase = easingToLinear(
        /** @type {Spring} */
        ease.ease
      );
    }
    return parsedEase;
  };
  var transformsShorthands = ["x", "y", "z"];
  var commonDefaultPXProperties = [
    "perspective",
    "width",
    "height",
    "margin",
    "padding",
    "top",
    "right",
    "bottom",
    "left",
    "borderWidth",
    "fontSize",
    "borderRadius",
    ...transformsShorthands
  ];
  var validIndividualTransforms = /* @__PURE__ */ (() => [...transformsShorthands, ...validTransforms.filter((t) => ["X", "Y", "Z"].some((axis) => t.endsWith(axis)))])();
  var transformsPropertiesRegistered = null;
  var normalizeTweenValue = (propName, value, $el, i, targetsLength) => {
    let v = isStr(value) ? value : getFunctionValue(
      /** @type {any} */
      value,
      $el,
      i,
      targetsLength
    );
    if (!isNum(v)) return v;
    if (commonDefaultPXProperties.includes(propName) || stringStartsWith(propName, "translate")) return `${v}px`;
    if (stringStartsWith(propName, "rotate") || stringStartsWith(propName, "skew")) return `${v}deg`;
    return `${v}`;
  };
  var parseIndividualTweenValue = ($el, propName, from, to, i, targetsLength) => {
    let tweenValue = "0";
    const computedTo = !isUnd(to) ? normalizeTweenValue(propName, to, $el, i, targetsLength) : getComputedStyle($el)[propName];
    if (!isUnd(from)) {
      const computedFrom = normalizeTweenValue(propName, from, $el, i, targetsLength);
      tweenValue = [computedFrom, computedTo];
    } else {
      tweenValue = isArr(to) ? to.map((v) => normalizeTweenValue(propName, v, $el, i, targetsLength)) : computedTo;
    }
    return tweenValue;
  };
  var WAAPIAnimation = class {
    /**
     * @param {DOMTargetsParam} targets
     * @param {WAAPIAnimationParams} params
     */
    constructor(targets, params) {
      if (scope.current) scope.current.register(this);
      if (isNil(transformsPropertiesRegistered)) {
        if (isBrowser && (isUnd(CSS) || !Object.hasOwnProperty.call(CSS, "registerProperty"))) {
          transformsPropertiesRegistered = false;
        } else {
          validTransforms.forEach((t) => {
            const isSkew = stringStartsWith(t, "skew");
            const isScale = stringStartsWith(t, "scale");
            const isRotate = stringStartsWith(t, "rotate");
            const isTranslate = stringStartsWith(t, "translate");
            const isAngle = isRotate || isSkew;
            const syntax = isAngle ? "<angle>" : isScale ? "<number>" : isTranslate ? "<length-percentage>" : "*";
            try {
              CSS.registerProperty({
                name: "--" + t,
                syntax,
                inherits: false,
                initialValue: isTranslate ? "0px" : isAngle ? "0deg" : isScale ? "1" : "0"
              });
            } catch {
            }
          });
          transformsPropertiesRegistered = true;
        }
      }
      const parsedTargets = registerTargets(targets);
      const targetsLength = parsedTargets.length;
      if (!targetsLength) {
        console.warn(`No target found. Make sure the element you're trying to animate is accessible before creating your animation.`);
      }
      const autoplay = setValue(params.autoplay, globals.defaults.autoplay);
      const scroll = autoplay && /** @type {ScrollObserver} */
      autoplay.link ? autoplay : false;
      const alternate = params.alternate && /** @type {Boolean} */
      params.alternate === true;
      const reversed = params.reversed && /** @type {Boolean} */
      params.reversed === true;
      const loop = setValue(params.loop, globals.defaults.loop);
      const iterations = (
        /** @type {Number} */
        loop === true || loop === Infinity ? Infinity : isNum(loop) ? loop + 1 : 1
      );
      const direction = alternate ? reversed ? "alternate-reverse" : "alternate" : reversed ? "reverse" : "normal";
      const fill = "both";
      const timeScale = globals.timeScale === 1 ? 1 : K;
      this.targets = parsedTargets;
      this.animations = [];
      this.controlAnimation = null;
      this.onComplete = params.onComplete || /** @type {Callback<WAAPIAnimation>} */
      /** @type {unknown} */
      globals.defaults.onComplete;
      this.duration = 0;
      this.muteCallbacks = false;
      this.completed = false;
      this.paused = !autoplay || scroll !== false;
      this.reversed = reversed;
      this.persist = setValue(params.persist, globals.defaults.persist);
      this.autoplay = autoplay;
      this._speed = setValue(params.playbackRate, globals.defaults.playbackRate);
      this._resolve = noop;
      this._completed = 0;
      this._inlineStyles = [];
      parsedTargets.forEach(($el, i) => {
        const cachedTransforms = $el[transformsSymbol];
        const hasIndividualTransforms = validIndividualTransforms.some((t) => params.hasOwnProperty(t));
        const elStyle = $el.style;
        const inlineStyles = this._inlineStyles[i] = {};
        const easeToParse = setValue(params.ease, globals.defaults.ease);
        const easeFunctionResult = getFunctionValue(easeToParse, $el, i, targetsLength);
        const keyEasing = isFnc(easeFunctionResult) || isStr(easeFunctionResult) ? easeFunctionResult : easeToParse;
        const spring = (
          /** @type {Spring} */
          easeToParse.ease && easeToParse
        );
        const easing = parseWAAPIEasing(keyEasing);
        const duration = (spring ? (
          /** @type {Spring} */
          spring.settlingDuration
        ) : getFunctionValue(setValue(params.duration, globals.defaults.duration), $el, i, targetsLength)) * timeScale;
        const delay = getFunctionValue(setValue(params.delay, globals.defaults.delay), $el, i, targetsLength) * timeScale;
        const composite = (
          /** @type {CompositeOperation} */
          setValue(params.composition, "replace")
        );
        for (let name in params) {
          if (!isKey(name)) continue;
          const keyframes2 = {};
          const tweenParams = { iterations, direction, fill, easing, duration, delay, composite };
          const propertyValue = params[name];
          const individualTransformProperty = hasIndividualTransforms ? validTransforms.includes(name) ? name : shortTransforms.get(name) : false;
          const styleName = individualTransformProperty ? "transform" : name;
          if (!inlineStyles[styleName]) {
            inlineStyles[styleName] = elStyle[styleName];
          }
          let parsedPropertyValue;
          if (isObj(propertyValue)) {
            const tweenOptions = (
              /** @type {WAAPITweenOptions} */
              propertyValue
            );
            const tweenOptionsEase = setValue(tweenOptions.ease, easing);
            const tweenOptionsSpring = (
              /** @type {Spring} */
              tweenOptionsEase.ease && tweenOptionsEase
            );
            const to = (
              /** @type {WAAPITweenOptions} */
              tweenOptions.to
            );
            const from = (
              /** @type {WAAPITweenOptions} */
              tweenOptions.from
            );
            tweenParams.duration = (tweenOptionsSpring ? (
              /** @type {Spring} */
              tweenOptionsSpring.settlingDuration
            ) : getFunctionValue(setValue(tweenOptions.duration, duration), $el, i, targetsLength)) * timeScale;
            tweenParams.delay = getFunctionValue(setValue(tweenOptions.delay, delay), $el, i, targetsLength) * timeScale;
            tweenParams.composite = /** @type {CompositeOperation} */
            setValue(tweenOptions.composition, composite);
            tweenParams.easing = parseWAAPIEasing(tweenOptionsEase);
            parsedPropertyValue = parseIndividualTweenValue($el, name, from, to, i, targetsLength);
            if (individualTransformProperty) {
              keyframes2[`--${individualTransformProperty}`] = parsedPropertyValue;
              cachedTransforms[individualTransformProperty] = parsedPropertyValue;
            } else {
              keyframes2[name] = parseIndividualTweenValue($el, name, from, to, i, targetsLength);
            }
            addWAAPIAnimation(this, $el, name, keyframes2, tweenParams);
            if (!isUnd(from)) {
              if (!individualTransformProperty) {
                elStyle[name] = keyframes2[name][0];
              } else {
                const key2 = `--${individualTransformProperty}`;
                elStyle.setProperty(key2, keyframes2[key2][0]);
              }
            }
          } else {
            parsedPropertyValue = isArr(propertyValue) ? propertyValue.map((v) => normalizeTweenValue(name, v, $el, i, targetsLength)) : normalizeTweenValue(
              name,
              /** @type {any} */
              propertyValue,
              $el,
              i,
              targetsLength
            );
            if (individualTransformProperty) {
              keyframes2[`--${individualTransformProperty}`] = parsedPropertyValue;
              cachedTransforms[individualTransformProperty] = parsedPropertyValue;
            } else {
              keyframes2[name] = parsedPropertyValue;
            }
            addWAAPIAnimation(this, $el, name, keyframes2, tweenParams);
          }
        }
        if (hasIndividualTransforms) {
          let transforms = emptyString;
          for (let t in cachedTransforms) {
            transforms += `${transformsFragmentStrings[t]}var(--${t})) `;
          }
          elStyle.transform = transforms;
        }
      });
      if (scroll) {
        this.autoplay.link(this);
      }
    }
    /**
     * @callback forEachCallback
     * @param {globalThis.Animation} animation
     */
    /**
     * @param  {forEachCallback|String} callback
     * @return {this}
     */
    forEach(callback) {
      try {
        const cb = isStr(callback) ? (a) => a[callback]() : callback;
        this.animations.forEach(cb);
      } catch {
      }
      return this;
    }
    get speed() {
      return this._speed;
    }
    set speed(speed) {
      this._speed = +speed;
      this.forEach((anim) => anim.playbackRate = speed);
    }
    get currentTime() {
      const controlAnimation = this.controlAnimation;
      const timeScale = globals.timeScale;
      return this.completed ? this.duration : controlAnimation ? +controlAnimation.currentTime * (timeScale === 1 ? 1 : timeScale) : 0;
    }
    set currentTime(time) {
      const t = time * (globals.timeScale === 1 ? 1 : K);
      this.forEach((anim) => {
        if (!this.persist && t >= this.duration) anim.play();
        anim.currentTime = t;
      });
    }
    get progress() {
      return this.currentTime / this.duration;
    }
    set progress(progress) {
      this.forEach((anim) => anim.currentTime = progress * this.duration || 0);
    }
    resume() {
      if (!this.paused) return this;
      this.paused = false;
      return this.forEach("play");
    }
    pause() {
      if (this.paused) return this;
      this.paused = true;
      return this.forEach("pause");
    }
    alternate() {
      this.reversed = !this.reversed;
      this.forEach("reverse");
      if (this.paused) this.forEach("pause");
      return this;
    }
    play() {
      if (this.reversed) this.alternate();
      return this.resume();
    }
    reverse() {
      if (!this.reversed) this.alternate();
      return this.resume();
    }
    /**
     * @param {Number} time
     * @param {Boolean} muteCallbacks
     */
    seek(time, muteCallbacks = false) {
      if (muteCallbacks) this.muteCallbacks = true;
      if (time < this.duration) this.completed = false;
      this.currentTime = time;
      this.muteCallbacks = false;
      if (this.paused) this.pause();
      return this;
    }
    restart() {
      this.completed = false;
      return this.seek(0, true).resume();
    }
    commitStyles() {
      return this.forEach("commitStyles");
    }
    complete() {
      return this.seek(this.duration);
    }
    cancel() {
      this.muteCallbacks = true;
      this.commitStyles().forEach("cancel");
      this.animations.length = 0;
      requestAnimationFrame(() => {
        this.targets.forEach(($el) => {
          if ($el.style.transform === "none") $el.style.removeProperty("transform");
        });
      });
      return this;
    }
    revert() {
      this.cancel().targets.forEach(($el, i) => {
        const targetStyle = $el.style;
        const targetInlineStyles = this._inlineStyles[i];
        for (let name in targetInlineStyles) {
          const originalInlinedValue = targetInlineStyles[name];
          if (isUnd(originalInlinedValue) || originalInlinedValue === emptyString) {
            targetStyle.removeProperty(toLowerCase(name));
          } else {
            $el.style[name] = originalInlinedValue;
          }
        }
        if ($el.getAttribute("style") === emptyString) $el.removeAttribute("style");
      });
      return this;
    }
    /**
     * @typedef {this & {then: null}} ResolvedWAAPIAnimation
     */
    /**
     * @param  {Callback<ResolvedWAAPIAnimation>} [callback]
     * @return Promise<this>
     */
    then(callback = noop) {
      const then = this.then;
      const onResolve = () => {
        this.then = null;
        callback(
          /** @type {ResolvedWAAPIAnimation} */
          this
        );
        this.then = then;
        this._resolve = noop;
      };
      return new Promise((r) => {
        this._resolve = () => r(onResolve());
        if (this.completed) this._resolve();
        return this;
      });
    }
  };
  var waapi = {
    /**
     * @param {DOMTargetsParam} targets
     * @param {WAAPIAnimationParams} params
     * @return {WAAPIAnimation}
     */
    animate: (targets, params) => new WAAPIAnimation(targets, params),
    convertEase: easingToLinear
  };

  // node_modules/animejs/dist/modules/layout/layout.js
  var layoutId = 0;
  var nodeId = 0;
  var isElementInRoot = (root, $el) => {
    if (!root || !$el) return false;
    return root === $el || root.contains($el);
  };
  var muteElementTransition = ($el) => {
    if (!$el) return null;
    const style = $el.style;
    const transition = style.transition || "";
    style.setProperty("transition", "none", "important");
    return transition;
  };
  var restoreElementTransition = ($el, transition) => {
    if (!$el) return;
    const style = $el.style;
    if (transition) {
      style.transition = transition;
    } else {
      style.removeProperty("transition");
    }
  };
  var muteNodeTransition = (node) => {
    const store = node.layout.transitionMuteStore;
    const $el = node.$el;
    const $measure = node.$measure;
    if ($el && !store.has($el)) store.set($el, muteElementTransition($el));
    if ($measure && !store.has($measure)) store.set($measure, muteElementTransition($measure));
  };
  var restoreLayoutTransition = (store) => {
    store.forEach((value, $el) => restoreElementTransition($el, value));
    store.clear();
  };
  var hiddenComputedStyle = (
    /** @type {CSSStyleDeclaration} */
    {
      display: "none",
      visibility: "hidden",
      opacity: "0",
      transform: "none",
      position: "static"
    }
  );
  var detachNode = (node) => {
    if (!node) return;
    const parent = node.parentNode;
    if (!parent) return;
    if (parent._head === node) parent._head = node._next;
    if (parent._tail === node) parent._tail = node._prev;
    if (node._prev) node._prev._next = node._next;
    if (node._next) node._next._prev = node._prev;
    node._prev = null;
    node._next = null;
    node.parentNode = null;
  };
  var createNode = ($el, parentNode, state, recycledNode) => {
    let dataId = $el.dataset.layoutId;
    if (!dataId) dataId = $el.dataset.layoutId = `node-${nodeId++}`;
    const node = recycledNode ? recycledNode : (
      /** @type {LayoutNode} */
      {}
    );
    node.$el = $el;
    node.$measure = $el;
    node.id = dataId;
    node.index = 0;
    node.total = 1;
    node.delay = 0;
    node.duration = 0;
    node.ease = null;
    node.state = state;
    node.layout = state.layout;
    node.parentNode = parentNode || null;
    node.isTarget = false;
    node.isEntering = false;
    node.isLeaving = false;
    node.isInlined = false;
    node.hasTransform = false;
    node.inlineStyles = [];
    node.inlineTransforms = null;
    node.inlineTransition = null;
    node.branchAdded = false;
    node.branchRemoved = false;
    node.branchNotRendered = false;
    node.sizeChanged = false;
    node.hasVisibilitySwap = false;
    node.hasDisplayNone = false;
    node.hasVisibilityHidden = false;
    node.measuredInlineTransform = null;
    node.measuredInlineTransition = null;
    node.measuredDisplay = null;
    node.measuredVisibility = null;
    node.measuredPosition = null;
    node.measuredHasDisplayNone = false;
    node.measuredHasVisibilityHidden = false;
    node.measuredIsVisible = false;
    node.measuredIsRemoved = false;
    node.measuredIsInsideRoot = false;
    node.properties = /** @type {LayoutNodeProperties} */
    {
      transform: "none",
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      clientLeft: 0,
      clientTop: 0,
      width: 0,
      height: 0
    };
    node.layout.properties.forEach((prop) => node.properties[prop] = 0);
    node._head = null;
    node._tail = null;
    node._prev = null;
    node._next = null;
    return node;
  };
  var recordNodeState = (node, $measure, computedStyle, skipMeasurements) => {
    const $el = node.$el;
    const root = node.layout.root;
    const isRoot = root === $el;
    const properties = node.properties;
    const rootNode = node.state.rootNode;
    const parentNode = node.parentNode;
    const computedTransforms = computedStyle.transform;
    const inlineTransforms = $el.style.transform;
    const parentNotRendered = parentNode ? parentNode.measuredIsRemoved : false;
    const position = computedStyle.position;
    if (isRoot) node.layout.absoluteCoords = position === "fixed" || position === "absolute";
    node.$measure = $measure;
    node.inlineTransforms = inlineTransforms;
    node.hasTransform = computedTransforms && computedTransforms !== "none";
    node.measuredIsInsideRoot = isElementInRoot(root, $measure);
    node.measuredInlineTransform = null;
    node.measuredDisplay = computedStyle.display;
    node.measuredVisibility = computedStyle.visibility;
    node.measuredPosition = position;
    node.measuredHasDisplayNone = computedStyle.display === "none";
    node.measuredHasVisibilityHidden = computedStyle.visibility === "hidden";
    node.measuredIsVisible = !(node.measuredHasDisplayNone || node.measuredHasVisibilityHidden);
    node.measuredIsRemoved = node.measuredHasDisplayNone || node.measuredHasVisibilityHidden || parentNotRendered;
    let hasAdjacentText = false;
    let s = $el.previousSibling;
    while (s && (s.nodeType === Node.COMMENT_NODE || s.nodeType === Node.TEXT_NODE && !s.textContent.trim())) s = s.previousSibling;
    if (s && s.nodeType === Node.TEXT_NODE) {
      hasAdjacentText = true;
    } else {
      s = $el.nextSibling;
      while (s && (s.nodeType === Node.COMMENT_NODE || s.nodeType === Node.TEXT_NODE && !s.textContent.trim())) s = s.nextSibling;
      hasAdjacentText = s !== null && s.nodeType === Node.TEXT_NODE;
    }
    node.isInlined = hasAdjacentText;
    if (node.hasTransform && !skipMeasurements) {
      const transitionMuteStore = node.layout.transitionMuteStore;
      if (!transitionMuteStore.get($el)) node.inlineTransition = muteElementTransition($el);
      if ($measure === $el) {
        $el.style.transform = "none";
      } else {
        if (!transitionMuteStore.get($measure)) node.measuredInlineTransition = muteElementTransition($measure);
        node.measuredInlineTransform = $measure.style.transform;
        $measure.style.transform = "none";
      }
    }
    let left = 0;
    let top = 0;
    let width = 0;
    let height = 0;
    if (!skipMeasurements) {
      const rect = $measure.getBoundingClientRect();
      left = rect.left;
      top = rect.top;
      width = rect.width;
      height = rect.height;
    }
    for (let name in properties) {
      const computedProp = name === "transform" ? computedTransforms : computedStyle[name] || computedStyle.getPropertyValue && computedStyle.getPropertyValue(name);
      if (!isUnd(computedProp)) properties[name] = computedProp;
    }
    properties.left = left;
    properties.top = top;
    properties.clientLeft = skipMeasurements ? 0 : $measure.clientLeft;
    properties.clientTop = skipMeasurements ? 0 : $measure.clientTop;
    let absoluteLeft, absoluteTop;
    if (isRoot) {
      if (!node.layout.absoluteCoords) {
        absoluteLeft = 0;
        absoluteTop = 0;
      } else {
        absoluteLeft = left;
        absoluteTop = top;
      }
    } else {
      const p = parentNode || rootNode;
      const parentLeft = p.properties.left;
      const parentTop = p.properties.top;
      const borderLeft = p.properties.clientLeft;
      const borderTop = p.properties.clientTop;
      if (!node.layout.absoluteCoords) {
        if (p === rootNode) {
          const rootLeft = rootNode.properties.left;
          const rootTop = rootNode.properties.top;
          const rootBorderLeft = rootNode.properties.clientLeft;
          const rootBorderTop = rootNode.properties.clientTop;
          absoluteLeft = left - rootLeft - rootBorderLeft;
          absoluteTop = top - rootTop - rootBorderTop;
        } else {
          absoluteLeft = left - parentLeft - borderLeft;
          absoluteTop = top - parentTop - borderTop;
        }
      } else {
        absoluteLeft = left - parentLeft - borderLeft;
        absoluteTop = top - parentTop - borderTop;
      }
    }
    properties.x = absoluteLeft;
    properties.y = absoluteTop;
    properties.width = width;
    properties.height = height;
    return node;
  };
  var updateNodeProperties = (node, props) => {
    if (!props) return;
    for (let name in props) {
      node.properties[name] = props[name];
    }
  };
  var updateNodeTimingParams = (node, params) => {
    const easeFunctionResult = getFunctionValue(params.ease, node.$el, node.index, node.total);
    const keyEasing = isFnc(easeFunctionResult) ? easeFunctionResult : params.ease;
    const hasSpring = !isUnd(keyEasing) && !isUnd(
      /** @type {Spring} */
      keyEasing.ease
    );
    node.ease = hasSpring ? (
      /** @type {Spring} */
      keyEasing.ease
    ) : keyEasing;
    node.duration = hasSpring ? (
      /** @type {Spring} */
      keyEasing.settlingDuration
    ) : getFunctionValue(params.duration, node.$el, node.index, node.total);
    node.delay = getFunctionValue(params.delay, node.$el, node.index, node.total);
  };
  var recordNodeInlineStyles = (node) => {
    const style = node.$el.style;
    const stylesStore = node.inlineStyles;
    stylesStore.length = 0;
    node.layout.recordedProperties.forEach((prop) => {
      stylesStore.push(prop, style[prop] || "");
    });
  };
  var restoreNodeInlineStyles = (node) => {
    const style = node.$el.style;
    const stylesStore = node.inlineStyles;
    for (let i = 0, l = stylesStore.length; i < l; i += 2) {
      const property = stylesStore[i];
      const styleValue = stylesStore[i + 1];
      if (styleValue && styleValue !== "") {
        style[property] = styleValue;
      } else {
        style[property] = "";
        style.removeProperty(property);
      }
    }
  };
  var restoreNodeTransform = (node) => {
    const inlineTransforms = node.inlineTransforms;
    const nodeStyle = node.$el.style;
    if (!node.hasTransform || !inlineTransforms || node.hasTransform && nodeStyle.transform === "none" || inlineTransforms && inlineTransforms === "none") {
      nodeStyle.removeProperty("transform");
    } else if (inlineTransforms) {
      nodeStyle.transform = inlineTransforms;
    }
    const $measure = node.$measure;
    if (node.hasTransform && $measure !== node.$el) {
      const measuredStyle = $measure.style;
      const measuredInline = node.measuredInlineTransform;
      if (measuredInline && measuredInline !== "") {
        measuredStyle.transform = measuredInline;
      } else {
        measuredStyle.removeProperty("transform");
      }
    }
    node.measuredInlineTransform = null;
    if (node.inlineTransition !== null) {
      restoreElementTransition(node.$el, node.inlineTransition);
      node.inlineTransition = null;
    }
    if ($measure !== node.$el && node.measuredInlineTransition !== null) {
      restoreElementTransition($measure, node.measuredInlineTransition);
      node.measuredInlineTransition = null;
    }
  };
  var restoreNodeVisualState = (node) => {
    if (node.measuredIsRemoved || node.hasVisibilitySwap) {
      node.$el.style.removeProperty("display");
      node.$el.style.removeProperty("visibility");
      if (node.hasVisibilitySwap) {
        node.$measure.style.removeProperty("display");
        node.$measure.style.removeProperty("visibility");
      }
    }
    node.layout.pendingRemoval.delete(node.$el);
  };
  var cloneNodeProperties = (node, targetNode, newState) => {
    targetNode.properties = /** @type {LayoutNodeProperties} */
    { ...node.properties };
    targetNode.state = newState;
    targetNode.isTarget = node.isTarget;
    targetNode.hasTransform = node.hasTransform;
    targetNode.inlineTransforms = node.inlineTransforms;
    targetNode.measuredIsVisible = node.measuredIsVisible;
    targetNode.measuredDisplay = node.measuredDisplay;
    targetNode.measuredIsRemoved = node.measuredIsRemoved;
    targetNode.measuredHasDisplayNone = node.measuredHasDisplayNone;
    targetNode.measuredHasVisibilityHidden = node.measuredHasVisibilityHidden;
    targetNode.hasDisplayNone = node.hasDisplayNone;
    targetNode.isInlined = node.isInlined;
    targetNode.hasVisibilityHidden = node.hasVisibilityHidden;
    return targetNode;
  };
  var LayoutSnapshot = class {
    /**
     * @param {AutoLayout} layout
     */
    constructor(layout) {
      this.layout = layout;
      this.rootNode = null;
      this.rootNodes = /* @__PURE__ */ new Set();
      this.nodes = /* @__PURE__ */ new Map();
      this.scrollX = 0;
      this.scrollY = 0;
    }
    /**
     * @return {this}
     */
    revert() {
      this.forEachNode((node) => {
        this.layout.pendingRemoval.delete(node.$el);
        node.$el.removeAttribute("data-layout-id");
        node.$measure.removeAttribute("data-layout-id");
      });
      this.rootNode = null;
      this.rootNodes.clear();
      this.nodes.clear();
      return this;
    }
    /**
     * @param {DOMTarget} $el
     * @return {LayoutNode}
     */
    getNode($el) {
      if (!$el || !$el.dataset) return;
      return this.nodes.get($el.dataset.layoutId);
    }
    /**
     * @param {DOMTarget} $el
     * @param {String} prop
     * @return {Number|String}
     */
    getComputedValue($el, prop) {
      const node = this.getNode($el);
      if (!node) return;
      return (
        /** @type {Number|String} */
        node.properties[prop]
      );
    }
    /**
     * @param {LayoutNode|null} rootNode
     * @param {LayoutNodeIterator} cb
     */
    forEach(rootNode, cb) {
      let node = rootNode;
      let i = 0;
      while (node) {
        cb(node, i++);
        if (node._head) {
          node = node._head;
        } else if (node._next) {
          node = node._next;
        } else {
          while (node && !node._next) {
            node = node.parentNode;
          }
          if (node) node = node._next;
        }
      }
    }
    /**
     * @param {LayoutNodeIterator} cb
     */
    forEachRootNode(cb) {
      this.forEach(this.rootNode, cb);
    }
    /**
     * @param {LayoutNodeIterator} cb
     */
    forEachNode(cb) {
      for (const rootNode of this.rootNodes) {
        this.forEach(rootNode, cb);
      }
    }
    /**
     * @param {DOMTarget} $el
     * @param {LayoutNode|null} parentNode
     * @return {LayoutNode|null}
     */
    registerElement($el, parentNode) {
      if (!$el || $el.nodeType !== 1) return null;
      if (!this.layout.transitionMuteStore.has($el)) this.layout.transitionMuteStore.set($el, muteElementTransition($el));
      const stack = [$el, parentNode];
      const root = this.layout.root;
      let firstNode = null;
      while (stack.length) {
        const $parent = (
          /** @type {LayoutNode|null} */
          stack.pop()
        );
        const $current = (
          /** @type {DOMTarget|null} */
          stack.pop()
        );
        if (!$current || $current.nodeType !== 1 || isSvg($current)) continue;
        const skipMeasurements = $parent ? $parent.measuredIsRemoved : false;
        const computedStyle = skipMeasurements ? hiddenComputedStyle : getComputedStyle($current);
        const hasDisplayNone = skipMeasurements ? true : computedStyle.display === "none";
        const hasVisibilityHidden = skipMeasurements ? true : computedStyle.visibility === "hidden";
        const isVisible = !hasDisplayNone && !hasVisibilityHidden;
        const existingId = $current.dataset.layoutId;
        const isInsideRoot = isElementInRoot(root, $current);
        let node = existingId ? this.nodes.get(existingId) : null;
        if (node && node.$el !== $current) {
          const nodeInsideRoot = isElementInRoot(root, node.$el);
          const measuredVisible = node.measuredIsVisible;
          const shouldReassignNode = !nodeInsideRoot && (isInsideRoot || !isInsideRoot && !measuredVisible && isVisible);
          const shouldReuseMeasurements = nodeInsideRoot && !measuredVisible && isVisible;
          if (shouldReassignNode) {
            detachNode(node);
            node = createNode($current, $parent, this, node);
          } else if (shouldReuseMeasurements) {
            recordNodeState(node, $current, computedStyle, skipMeasurements);
            let $child2 = $current.lastElementChild;
            while ($child2) {
              stack.push(
                /** @type {DOMTarget} */
                $child2,
                node
              );
              $child2 = $child2.previousElementSibling;
            }
            if (!firstNode) firstNode = node;
            continue;
          } else {
            let $child2 = $current.lastElementChild;
            while ($child2) {
              stack.push(
                /** @type {DOMTarget} */
                $child2,
                $parent
              );
              $child2 = $child2.previousElementSibling;
            }
            if (!firstNode) firstNode = node;
            continue;
          }
        } else {
          node = createNode($current, $parent, this, node);
        }
        node.branchAdded = false;
        node.branchRemoved = false;
        node.branchNotRendered = false;
        node.isTarget = false;
        node.sizeChanged = false;
        node.hasVisibilityHidden = hasVisibilityHidden;
        node.hasDisplayNone = hasDisplayNone;
        node.hasVisibilitySwap = hasVisibilityHidden && !node.measuredHasVisibilityHidden || hasDisplayNone && !node.measuredHasDisplayNone;
        this.nodes.set(node.id, node);
        node.parentNode = $parent || null;
        node._prev = null;
        node._next = null;
        if ($parent) {
          this.rootNodes.delete(node);
          if (!$parent._head) {
            $parent._head = node;
            $parent._tail = node;
          } else {
            $parent._tail._next = node;
            node._prev = $parent._tail;
            $parent._tail = node;
          }
        } else {
          this.rootNodes.add(node);
        }
        recordNodeState(node, node.$el, computedStyle, skipMeasurements);
        let $child = $current.lastElementChild;
        while ($child) {
          stack.push(
            /** @type {DOMTarget} */
            $child,
            node
          );
          $child = $child.previousElementSibling;
        }
        if (!firstNode) firstNode = node;
      }
      return firstNode;
    }
    /**
     * @param {DOMTarget} $el
     * @param {Set<DOMTarget>} candidates
     * @return {LayoutNode|null}
     */
    ensureDetachedNode($el, candidates) {
      if (!$el || $el === this.layout.root) return null;
      const existingId = $el.dataset.layoutId;
      const existingNode = existingId ? this.nodes.get(existingId) : null;
      if (existingNode && existingNode.$el === $el) return existingNode;
      let parentNode = null;
      let $ancestor = $el.parentElement;
      while ($ancestor && $ancestor !== this.layout.root) {
        if (candidates.has($ancestor)) {
          parentNode = this.ensureDetachedNode($ancestor, candidates);
          break;
        }
        $ancestor = $ancestor.parentElement;
      }
      return this.registerElement($el, parentNode);
    }
    /**
     * @return {this}
     */
    record() {
      const layout = this.layout;
      const children = layout.children;
      const root = layout.root;
      const toParse = isArr(children) ? children : [children];
      const scoped = [];
      const scopeRoot = children === "*" ? root : scope.root;
      const rootAncestorTransformStore = [];
      let $ancestor = root.parentElement;
      while ($ancestor && $ancestor.nodeType === 1) {
        const computedStyle = getComputedStyle($ancestor);
        if (computedStyle.transform && computedStyle.transform !== "none") {
          const inlineTransform = $ancestor.style.transform || "";
          const inlineTransition = muteElementTransition($ancestor);
          rootAncestorTransformStore.push($ancestor, inlineTransform, inlineTransition);
          $ancestor.style.transform = "none";
        }
        $ancestor = $ancestor.parentElement;
      }
      for (let i = 0, l = toParse.length; i < l; i++) {
        const child = toParse[i];
        scoped[i] = isStr(child) ? scopeRoot.querySelectorAll(child) : child;
      }
      const parsedChildren = registerTargets(scoped);
      this.nodes.clear();
      this.rootNodes.clear();
      const rootNode = this.registerElement(root, null);
      rootNode.isTarget = true;
      this.rootNode = rootNode;
      const inRootNodeIds = /* @__PURE__ */ new Set();
      let index = 0, total = this.nodes.size;
      this.nodes.forEach((node, id) => {
        node.index = index++;
        node.total = total;
        if (node && node.measuredIsInsideRoot) {
          inRootNodeIds.add(id);
        }
      });
      const detachedElementsLookup = /* @__PURE__ */ new Set();
      const orderedDetachedElements = [];
      for (let i = 0, l = parsedChildren.length; i < l; i++) {
        const $el = parsedChildren[i];
        if (!$el || $el.nodeType !== 1 || $el === root) continue;
        const insideRoot = isElementInRoot(root, $el);
        if (!insideRoot) {
          const layoutNodeId = $el.dataset.layoutId;
          if (!layoutNodeId || !inRootNodeIds.has(layoutNodeId)) continue;
        }
        if (!detachedElementsLookup.has($el)) {
          detachedElementsLookup.add($el);
          orderedDetachedElements.push($el);
        }
      }
      for (let i = 0, l = orderedDetachedElements.length; i < l; i++) {
        this.ensureDetachedNode(orderedDetachedElements[i], detachedElementsLookup);
      }
      for (let i = 0, l = parsedChildren.length; i < l; i++) {
        const $el = parsedChildren[i];
        const node = this.getNode($el);
        if (node) {
          let cur = node;
          while (cur) {
            if (cur.isTarget) break;
            cur.isTarget = true;
            cur = cur.parentNode;
          }
        }
      }
      this.scrollX = window.scrollX;
      this.scrollY = window.scrollY;
      this.forEachNode(restoreNodeTransform);
      for (let i = 0, l = rootAncestorTransformStore.length; i < l; i += 3) {
        const $el = (
          /** @type {DOMTarget} */
          rootAncestorTransformStore[i]
        );
        const inlineTransform = (
          /** @type {String} */
          rootAncestorTransformStore[i + 1]
        );
        const inlineTransition = (
          /** @type {String|null} */
          rootAncestorTransformStore[i + 2]
        );
        if (inlineTransform && inlineTransform !== "") {
          $el.style.transform = inlineTransform;
        } else {
          $el.style.removeProperty("transform");
        }
        restoreElementTransition($el, inlineTransition);
      }
      return this;
    }
  };
  function splitPropertiesFromParams(params) {
    const properties = {};
    const parameters = {};
    for (let name in params) {
      const value = params[name];
      const isEase = name === "ease";
      const isTiming = name === "duration" || name === "delay";
      if (isTiming || isEase) {
        if (isEase) {
          parameters[name] = /** @type {EasingParam} */
          value;
        } else {
          parameters[name] = /** @type {Number|FunctionValue} */
          value;
        }
      } else {
        properties[name] = /** @type {Number|String} */
        value;
      }
    }
    return [properties, parameters];
  }
  var AutoLayout = class {
    /**
     * @param {DOMTargetSelector} root
     * @param {AutoLayoutParams} [params]
     */
    constructor(root, params = {}) {
      if (scope.current) scope.current.register(this);
      const swapAtSplitParams = splitPropertiesFromParams(params.swapAt);
      const enterFromSplitParams = splitPropertiesFromParams(params.enterFrom);
      const leaveToSplitParams = splitPropertiesFromParams(params.leaveTo);
      const transitionProperties = params.properties;
      params.duration = setValue(params.duration, 350);
      params.delay = setValue(params.delay, 0);
      params.ease = setValue(params.ease, "inOut(3.5)");
      this.params = params;
      this.root = /** @type {DOMTarget} */
      registerTargets(root)[0];
      this.id = layoutId++;
      this.children = params.children || "*";
      this.absoluteCoords = false;
      this.swapAtParams = mergeObjects(params.swapAt || { opacity: 0 }, { ease: "inOut(1.75)" });
      this.enterFromParams = params.enterFrom || { opacity: 0 };
      this.leaveToParams = params.leaveTo || { opacity: 0 };
      this.properties = /* @__PURE__ */ new Set([
        "opacity",
        "fontSize",
        "color",
        "backgroundColor",
        "borderRadius",
        "border",
        "filter",
        "clipPath"
      ]);
      if (swapAtSplitParams[0]) for (let name in swapAtSplitParams[0]) this.properties.add(name);
      if (enterFromSplitParams[0]) for (let name in enterFromSplitParams[0]) this.properties.add(name);
      if (leaveToSplitParams[0]) for (let name in leaveToSplitParams[0]) this.properties.add(name);
      if (transitionProperties) for (let i = 0, l = transitionProperties.length; i < l; i++) this.properties.add(transitionProperties[i]);
      this.recordedProperties = /* @__PURE__ */ new Set([
        "display",
        "visibility",
        "translate",
        "position",
        "left",
        "top",
        "marginLeft",
        "marginTop",
        "width",
        "height",
        "maxWidth",
        "maxHeight",
        "minWidth",
        "minHeight"
      ]);
      this.properties.forEach((prop) => this.recordedProperties.add(prop));
      this.pendingRemoval = /* @__PURE__ */ new WeakSet();
      this.transitionMuteStore = /* @__PURE__ */ new Map();
      this.oldState = new LayoutSnapshot(this);
      this.newState = new LayoutSnapshot(this);
      this.timeline = null;
      this.transformAnimation = null;
      this.animating = [];
      this.swapping = [];
      this.leaving = [];
      this.entering = [];
      this.oldState.record();
      restoreLayoutTransition(this.transitionMuteStore);
    }
    /**
     * @return {this}
     */
    revert() {
      this.root.classList.remove("is-animated");
      if (this.timeline) {
        this.timeline.complete();
        this.timeline = null;
      }
      if (this.transformAnimation) {
        this.transformAnimation.complete();
        this.transformAnimation = null;
      }
      this.animating.length = this.swapping.length = this.leaving.length = this.entering.length = 0;
      this.oldState.revert();
      this.newState.revert();
      requestAnimationFrame(() => restoreLayoutTransition(this.transitionMuteStore));
      return this;
    }
    /**
     * @return {this}
     */
    record() {
      if (this.transformAnimation) {
        this.transformAnimation.cancel();
        this.transformAnimation = null;
      }
      this.oldState.record();
      if (this.timeline) {
        this.timeline.cancel();
        this.timeline = null;
      }
      this.newState.forEachRootNode(restoreNodeInlineStyles);
      return this;
    }
    /**
     * @param {LayoutAnimationParams} [params]
     * @return {Timeline}
     */
    animate(params = {}) {
      const animationTimings = {
        ease: setValue(params.ease, this.params.ease),
        delay: setValue(params.delay, this.params.delay),
        duration: setValue(params.duration, this.params.duration)
      };
      const tlParams = {};
      const onComplete = setValue(params.onComplete, this.params.onComplete);
      const onPause = setValue(params.onPause, this.params.onPause);
      for (let name in defaults) {
        if (name !== "ease" && name !== "duration" && name !== "delay") {
          if (!isUnd(params[name])) {
            tlParams[name] = params[name];
          } else if (!isUnd(this.params[name])) {
            tlParams[name] = this.params[name];
          }
        }
      }
      tlParams.onComplete = () => {
        const ap = (
          /** @type {ScrollObserver} */
          params.autoplay
        );
        const isScrollControled = ap && ap.linked;
        if (isScrollControled) {
          if (onComplete) onComplete(this.timeline);
          return;
        }
        if (this.transformAnimation) this.transformAnimation.cancel();
        newState.forEachRootNode((node) => {
          restoreNodeVisualState(node);
          restoreNodeInlineStyles(node);
        });
        for (let i = 0, l = transformed.length; i < l; i++) {
          const $el = transformed[i];
          $el.style.transform = newState.getComputedValue($el, "transform");
        }
        if (this.root.classList.contains("is-animated")) {
          this.root.classList.remove("is-animated");
          if (onComplete) onComplete(this.timeline);
        }
        requestAnimationFrame(() => {
          if (this.root.classList.contains("is-animated")) return;
          restoreLayoutTransition(this.transitionMuteStore);
        });
      };
      tlParams.onPause = () => {
        const ap = (
          /** @type {ScrollObserver} */
          params.autoplay
        );
        const isScrollControled = ap && ap.linked;
        if (isScrollControled) {
          if (onComplete) onComplete(this.timeline);
          if (onPause) onPause(this.timeline);
          return;
        }
        if (!this.root.classList.contains("is-animated")) return;
        if (this.transformAnimation) this.transformAnimation.cancel();
        newState.forEachRootNode(restoreNodeVisualState);
        this.root.classList.remove("is-animated");
        if (onComplete) onComplete(this.timeline);
        if (onPause) onPause(this.timeline);
      };
      tlParams.composition = false;
      const swapAtParams = mergeObjects(mergeObjects(params.swapAt || {}, this.swapAtParams), animationTimings);
      const enterFromParams = mergeObjects(mergeObjects(params.enterFrom || {}, this.enterFromParams), animationTimings);
      const leaveToParams = mergeObjects(mergeObjects(params.leaveTo || {}, this.leaveToParams), animationTimings);
      const [swapAtProps, swapAtTimings] = splitPropertiesFromParams(swapAtParams);
      const [enterFromProps, enterFromTimings] = splitPropertiesFromParams(enterFromParams);
      const [leaveToProps, leaveToTimings] = splitPropertiesFromParams(leaveToParams);
      const oldState = this.oldState;
      const newState = this.newState;
      const animating = this.animating;
      const swapping = this.swapping;
      const entering = this.entering;
      const leaving = this.leaving;
      const pendingRemoval = this.pendingRemoval;
      animating.length = swapping.length = entering.length = leaving.length = 0;
      oldState.forEachRootNode(muteNodeTransition);
      newState.record();
      newState.forEachRootNode(recordNodeInlineStyles);
      const targets = [];
      const animated = [];
      const transformed = [];
      const animatedSwap = [];
      const rootNode = newState.rootNode;
      const $root = rootNode.$el;
      newState.forEachRootNode((node) => {
        const $el = node.$el;
        const id = node.id;
        const parent = node.parentNode;
        const parentAdded = parent ? parent.branchAdded : false;
        const parentRemoved = parent ? parent.branchRemoved : false;
        const parentNotRendered = parent ? parent.branchNotRendered : false;
        let oldStateNode = oldState.nodes.get(id);
        const hasNoOldState = !oldStateNode;
        if (hasNoOldState) {
          oldStateNode = cloneNodeProperties(
            node,
            /** @type {LayoutNode} */
            {},
            oldState
          );
          oldState.nodes.set(id, oldStateNode);
          oldStateNode.measuredIsRemoved = true;
        } else if (oldStateNode.measuredIsRemoved && !node.measuredIsRemoved) {
          cloneNodeProperties(node, oldStateNode, oldState);
          oldStateNode.measuredIsRemoved = true;
        }
        const oldParentNode = oldStateNode.parentNode;
        const oldParentId = oldParentNode ? oldParentNode.id : null;
        const newParentId = parent ? parent.id : null;
        const parentChanged = oldParentId !== newParentId;
        const elementChanged = oldStateNode.$el !== node.$el;
        const wasRemovedBefore = oldStateNode.measuredIsRemoved;
        const isRemovedNow = node.measuredIsRemoved;
        if (!oldStateNode.measuredIsRemoved && !isRemovedNow && !hasNoOldState && (parentChanged || elementChanged)) {
          const oldAbsoluteLeft = oldStateNode.properties.left;
          const oldAbsoluteTop = oldStateNode.properties.top;
          const newParent = parent || newState.rootNode;
          const oldParent = newParent.id ? oldState.nodes.get(newParent.id) : null;
          const parentLeft = oldParent ? oldParent.properties.left : newParent.properties.left;
          const parentTop = oldParent ? oldParent.properties.top : newParent.properties.top;
          const borderLeft = oldParent ? oldParent.properties.clientLeft : newParent.properties.clientLeft;
          const borderTop = oldParent ? oldParent.properties.clientTop : newParent.properties.clientTop;
          oldStateNode.properties.x = oldAbsoluteLeft - parentLeft - borderLeft;
          oldStateNode.properties.y = oldAbsoluteTop - parentTop - borderTop;
        }
        if (node.hasVisibilitySwap) {
          if (node.hasVisibilityHidden) {
            node.$el.style.visibility = "visible";
            node.$measure.style.visibility = "hidden";
          }
          if (node.hasDisplayNone) {
            node.$el.style.display = oldStateNode.measuredDisplay || node.measuredDisplay || "";
            node.$measure.style.visibility = "hidden";
          }
        }
        const wasPendingRemoval = pendingRemoval.has($el);
        const wasVisibleBefore = oldStateNode.measuredIsVisible;
        const isVisibleNow = node.measuredIsVisible;
        const becomeVisible = !wasVisibleBefore && isVisibleNow && !parentNotRendered;
        const topLevelAdded = !isRemovedNow && (wasRemovedBefore || wasPendingRemoval) && !parentAdded;
        const newlyRemoved = isRemovedNow && !wasRemovedBefore && !parentRemoved;
        const topLevelRemoved = newlyRemoved || isRemovedNow && wasPendingRemoval && !parentRemoved;
        node.branchAdded = parentAdded || topLevelAdded;
        node.branchRemoved = parentRemoved || topLevelRemoved;
        node.branchNotRendered = parentNotRendered || isRemovedNow;
        if (isRemovedNow && wasVisibleBefore) {
          node.$el.style.display = oldStateNode.measuredDisplay;
          node.$el.style.visibility = "visible";
          cloneNodeProperties(oldStateNode, node, newState);
        }
        if (newlyRemoved) {
          if (node.isTarget) {
            leaving.push($el);
            node.isLeaving = true;
          }
          pendingRemoval.add($el);
        } else if (!isRemovedNow && wasPendingRemoval) {
          pendingRemoval.delete($el);
        }
        if (topLevelAdded && !parentNotRendered || becomeVisible) {
          updateNodeProperties(oldStateNode, enterFromProps);
          if (node.isTarget) {
            entering.push($el);
            node.isEntering = true;
          }
        } else if (topLevelRemoved && !parentNotRendered) {
          updateNodeProperties(node, leaveToProps);
        }
        if (node !== rootNode && node.isTarget && !node.isEntering && !node.isLeaving) {
          animating.push($el);
        }
        targets.push($el);
      });
      let enteringIndex = 0;
      let leavingIndex = 0;
      let animatingIndex = 0;
      newState.forEachRootNode((node) => {
        const $el = node.$el;
        const parent = node.parentNode;
        const oldStateNode = oldState.nodes.get(node.id);
        const nodeProperties = node.properties;
        const oldStateNodeProperties = oldStateNode.properties;
        let animatedParent = parent !== rootNode && parent;
        while (animatedParent && !animatedParent.isTarget && animatedParent !== rootNode) {
          animatedParent = animatedParent.parentNode;
        }
        const animatingTotal = animating.length;
        if (node === rootNode) {
          node.index = 0;
          node.total = animatingTotal;
          updateNodeTimingParams(node, animationTimings);
        } else if (node.isEntering) {
          node.index = animatedParent ? animatedParent.index : enteringIndex;
          node.total = animatedParent ? animatingTotal : entering.length;
          updateNodeTimingParams(node, enterFromTimings);
          enteringIndex++;
        } else if (node.isLeaving) {
          node.index = animatedParent ? animatedParent.index : leavingIndex;
          node.total = animatedParent ? animatingTotal : leaving.length;
          leavingIndex++;
          updateNodeTimingParams(node, leaveToTimings);
        } else if (node.isTarget) {
          node.index = animatingIndex++;
          node.total = animatingTotal;
          updateNodeTimingParams(node, animationTimings);
        } else {
          node.index = animatedParent ? animatedParent.index : 0;
          node.total = animatingTotal;
          updateNodeTimingParams(node, swapAtTimings);
        }
        oldStateNode.index = node.index;
        oldStateNode.total = node.total;
        for (let prop in nodeProperties) {
          nodeProperties[prop] = getFunctionValue(nodeProperties[prop], $el, node.index, node.total);
          oldStateNodeProperties[prop] = getFunctionValue(oldStateNodeProperties[prop], $el, oldStateNode.index, oldStateNode.total);
        }
        const sizeTolerance = 1;
        const widthChanged = Math.abs(nodeProperties.width - oldStateNodeProperties.width) > sizeTolerance;
        const heightChanged = Math.abs(nodeProperties.height - oldStateNodeProperties.height) > sizeTolerance;
        node.sizeChanged = widthChanged || heightChanged;
        if (node.isTarget && (!node.measuredIsRemoved && oldStateNode.measuredIsVisible || node.measuredIsRemoved && node.measuredIsVisible)) {
          if (nodeProperties.transform !== "none" || oldStateNodeProperties.transform !== "none") {
            node.hasTransform = true;
            transformed.push($el);
          }
          for (let prop in nodeProperties) {
            if (prop !== "transform" && nodeProperties[prop] !== oldStateNodeProperties[prop]) {
              animated.push($el);
              break;
            }
          }
        }
        if (!node.isTarget) {
          swapping.push($el);
          if (node.sizeChanged && parent && parent.isTarget && parent.sizeChanged) {
            if (swapAtProps.transform) {
              node.hasTransform = true;
              transformed.push($el);
            }
            animatedSwap.push($el);
          }
        }
      });
      const timingParams = {
        delay: ($el) => newState.getNode($el).delay,
        duration: ($el) => newState.getNode($el).duration,
        ease: ($el) => newState.getNode($el).ease
      };
      tlParams.defaults = timingParams;
      this.timeline = createTimeline(tlParams);
      if (!animated.length && !transformed.length && !swapping.length) {
        restoreLayoutTransition(this.transitionMuteStore);
        return this.timeline.complete();
      }
      if (targets.length) {
        this.root.classList.add("is-animated");
        for (let i = 0, l = targets.length; i < l; i++) {
          const $el = targets[i];
          const id = $el.dataset.layoutId;
          const oldNode = oldState.nodes.get(id);
          const newNode = newState.nodes.get(id);
          const oldNodeState = oldNode.properties;
          if (!newNode.isInlined) {
            if (oldNode.measuredDisplay === "grid" || newNode.measuredDisplay === "grid") $el.style.setProperty("display", "block", "important");
            if ($el !== $root || this.absoluteCoords) {
              $el.style.position = this.absoluteCoords ? "fixed" : "absolute";
              $el.style.left = "0px";
              $el.style.top = "0px";
              $el.style.marginLeft = "0px";
              $el.style.marginTop = "0px";
              $el.style.translate = `${oldNodeState.x}px ${oldNodeState.y}px`;
            }
            if ($el === $root && newNode.measuredPosition === "static") {
              $el.style.position = "relative";
              $el.style.left = "0px";
              $el.style.top = "0px";
            }
          }
          $el.style.width = `${oldNodeState.width}px`;
          $el.style.height = `${oldNodeState.height}px`;
          $el.style.minWidth = `auto`;
          $el.style.minHeight = `auto`;
          $el.style.maxWidth = `none`;
          $el.style.maxHeight = `none`;
        }
        if (oldState.scrollX !== window.scrollX || oldState.scrollY !== window.scrollY) {
          requestAnimationFrame(() => window.scrollTo(oldState.scrollX, oldState.scrollY));
        }
        for (let i = 0, l = animated.length; i < l; i++) {
          const $el = animated[i];
          const id = $el.dataset.layoutId;
          const oldNode = oldState.nodes.get(id);
          const newNode = newState.nodes.get(id);
          const oldNodeState = oldNode.properties;
          const newNodeState = newNode.properties;
          let nodeHasChanged = false;
          const animatedProps = {
            composition: "none"
          };
          if (oldNodeState.width !== newNodeState.width) {
            animatedProps.width = [oldNodeState.width, newNodeState.width];
            nodeHasChanged = true;
          }
          if (oldNodeState.height !== newNodeState.height) {
            animatedProps.height = [oldNodeState.height, newNodeState.height];
            nodeHasChanged = true;
          }
          if (!newNode.hasTransform && !newNode.isInlined) {
            animatedProps.translate = [`${oldNodeState.x}px ${oldNodeState.y}px`, `${newNodeState.x}px ${newNodeState.y}px`];
            nodeHasChanged = true;
          }
          this.properties.forEach((prop) => {
            const oldVal = oldNodeState[prop];
            const newVal = newNodeState[prop];
            if (prop !== "transform" && oldVal !== newVal) {
              animatedProps[prop] = [oldVal, newVal];
              nodeHasChanged = true;
            }
          });
          if (nodeHasChanged) {
            this.timeline.add($el, animatedProps, 0);
          }
        }
      }
      if (swapping.length) {
        for (let i = 0, l = swapping.length; i < l; i++) {
          const $el = swapping[i];
          const oldNode = oldState.getNode($el);
          const oldNodeProps = oldNode.properties;
          $el.style.width = `${oldNodeProps.width}px`;
          $el.style.height = `${oldNodeProps.height}px`;
          $el.style.minWidth = `auto`;
          $el.style.minHeight = `auto`;
          $el.style.maxWidth = `none`;
          $el.style.maxHeight = `none`;
          if (!oldNode.isInlined) {
            $el.style.translate = `${oldNodeProps.x}px ${oldNodeProps.y}px`;
          }
          this.properties.forEach((prop) => {
            if (prop !== "transform") {
              $el.style[prop] = `${oldState.getComputedValue($el, prop)}`;
            }
          });
        }
        for (let i = 0, l = swapping.length; i < l; i++) {
          const $el = swapping[i];
          const newNode = newState.getNode($el);
          const newNodeProps = newNode.properties;
          this.timeline.call(() => {
            $el.style.width = `${newNodeProps.width}px`;
            $el.style.height = `${newNodeProps.height}px`;
            $el.style.minWidth = `auto`;
            $el.style.minHeight = `auto`;
            $el.style.maxWidth = `none`;
            $el.style.maxHeight = `none`;
            if (!newNode.isInlined) {
              $el.style.translate = `${newNodeProps.x}px ${newNodeProps.y}px`;
            }
            this.properties.forEach((prop) => {
              if (prop !== "transform") {
                $el.style[prop] = `${newState.getComputedValue($el, prop)}`;
              }
            });
          }, newNode.delay + newNode.duration / 2);
        }
        if (animatedSwap.length) {
          const ease = parseEase(newState.nodes.get(animatedSwap[0].dataset.layoutId).ease);
          const inverseEased = (t) => 1 - ease(1 - t);
          const animatedSwapParams = (
            /** @type {AnimationParams} */
            {}
          );
          if (swapAtProps) {
            for (let prop in swapAtProps) {
              if (prop !== "transform") {
                animatedSwapParams[prop] = [
                  { from: ($el) => oldState.getComputedValue($el, prop), to: swapAtProps[prop] },
                  { from: swapAtProps[prop], to: ($el) => newState.getComputedValue($el, prop), ease: inverseEased }
                ];
              }
            }
          }
          this.timeline.add(animatedSwap, animatedSwapParams, 0);
        }
      }
      const transformedLength = transformed.length;
      if (transformedLength) {
        for (let i = 0; i < transformedLength; i++) {
          const $el = transformed[i];
          const node = newState.getNode($el);
          if (!node.isInlined) {
            $el.style.translate = `${oldState.getComputedValue($el, "x")}px ${oldState.getComputedValue($el, "y")}px`;
          }
          $el.style.transform = oldState.getComputedValue($el, "transform");
          if (animatedSwap.includes($el)) {
            node.ease = getFunctionValue(swapAtParams.ease, $el, node.index, node.total);
            node.duration = getFunctionValue(swapAtParams.duration, $el, node.index, node.total);
          }
        }
        this.transformAnimation = waapi.animate(transformed, {
          translate: ($el) => {
            const node = newState.getNode($el);
            if (node.isInlined) return "0px 0px";
            return `${newState.getComputedValue($el, "x")}px ${newState.getComputedValue($el, "y")}px`;
          },
          transform: ($el) => {
            const newValue = newState.getComputedValue($el, "transform");
            if (!animatedSwap.includes($el)) return newValue;
            const oldValue = oldState.getComputedValue($el, "transform");
            const node = newState.getNode($el);
            return [oldValue, getFunctionValue(swapAtProps.transform, $el, node.index, node.total), newValue];
          },
          autoplay: false,
          // persist: true,
          ...timingParams
        });
        this.timeline.sync(this.transformAnimation, 0);
      }
      return this.timeline.init();
    }
    /**
     * @param {(layout: this) => void} callback
     * @param {LayoutAnimationParams} [params]
     * @return {Timeline}
     */
    update(callback, params = {}) {
      this.record();
      callback(this);
      return this.animate(params);
    }
  };
  var createLayout = (root, params) => new AutoLayout(root, params);

  // node_modules/lenis/dist/lenis.mjs
  var version = "1.3.19";
  function clamp2(min, input, max) {
    return Math.max(min, Math.min(input, max));
  }
  function lerp2(x, y, t) {
    return (1 - t) * x + t * y;
  }
  function damp(x, y, lambda, deltaTime) {
    return lerp2(x, y, 1 - Math.exp(-lambda * deltaTime));
  }
  function modulo(n, d) {
    return (n % d + d) % d;
  }
  var Animate = class {
    isRunning = false;
    value = 0;
    from = 0;
    to = 0;
    currentTime = 0;
    // These are instanciated in the fromTo method
    lerp;
    duration;
    easing;
    onUpdate;
    /**
     * Advance the animation by the given delta time
     *
     * @param deltaTime - The time in seconds to advance the animation
     */
    advance(deltaTime) {
      if (!this.isRunning) return;
      let completed = false;
      if (this.duration && this.easing) {
        this.currentTime += deltaTime;
        const linearProgress = clamp2(0, this.currentTime / this.duration, 1);
        completed = linearProgress >= 1;
        const easedProgress = completed ? 1 : this.easing(linearProgress);
        this.value = this.from + (this.to - this.from) * easedProgress;
      } else if (this.lerp) {
        this.value = damp(this.value, this.to, this.lerp * 60, deltaTime);
        if (Math.round(this.value) === this.to) {
          this.value = this.to;
          completed = true;
        }
      } else {
        this.value = this.to;
        completed = true;
      }
      if (completed) {
        this.stop();
      }
      this.onUpdate?.(this.value, completed);
    }
    /** Stop the animation */
    stop() {
      this.isRunning = false;
    }
    /**
     * Set up the animation from a starting value to an ending value
     * with optional parameters for lerping, duration, easing, and onUpdate callback
     *
     * @param from - The starting value
     * @param to - The ending value
     * @param options - Options for the animation
     */
    fromTo(from, to, { lerp: lerp22, duration, easing, onStart, onUpdate }) {
      this.from = this.value = from;
      this.to = to;
      this.lerp = lerp22;
      this.duration = duration;
      this.easing = easing;
      this.currentTime = 0;
      this.isRunning = true;
      onStart?.();
      this.onUpdate = onUpdate;
    }
  };
  function debounce(callback, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = void 0;
        callback.apply(this, args);
      }, delay);
    };
  }
  var Dimensions = class {
    constructor(wrapper, content, { autoResize = true, debounce: debounceValue = 250 } = {}) {
      this.wrapper = wrapper;
      this.content = content;
      if (autoResize) {
        this.debouncedResize = debounce(this.resize, debounceValue);
        if (this.wrapper instanceof Window) {
          window.addEventListener("resize", this.debouncedResize);
        } else {
          this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize);
          this.wrapperResizeObserver.observe(this.wrapper);
        }
        this.contentResizeObserver = new ResizeObserver(this.debouncedResize);
        this.contentResizeObserver.observe(this.content);
      }
      this.resize();
    }
    width = 0;
    height = 0;
    scrollHeight = 0;
    scrollWidth = 0;
    // These are instanciated in the constructor as they need information from the options
    debouncedResize;
    wrapperResizeObserver;
    contentResizeObserver;
    destroy() {
      this.wrapperResizeObserver?.disconnect();
      this.contentResizeObserver?.disconnect();
      if (this.wrapper === window && this.debouncedResize) {
        window.removeEventListener("resize", this.debouncedResize);
      }
    }
    resize = () => {
      this.onWrapperResize();
      this.onContentResize();
    };
    onWrapperResize = () => {
      if (this.wrapper instanceof Window) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
      } else {
        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
      }
    };
    onContentResize = () => {
      if (this.wrapper instanceof Window) {
        this.scrollHeight = this.content.scrollHeight;
        this.scrollWidth = this.content.scrollWidth;
      } else {
        this.scrollHeight = this.wrapper.scrollHeight;
        this.scrollWidth = this.wrapper.scrollWidth;
      }
    };
    get limit() {
      return {
        x: this.scrollWidth - this.width,
        y: this.scrollHeight - this.height
      };
    }
  };
  var Emitter = class {
    events = {};
    /**
     * Emit an event with the given data
     * @param event Event name
     * @param args Data to pass to the event handlers
     */
    emit(event, ...args) {
      const callbacks = this.events[event] || [];
      for (let i = 0, length = callbacks.length; i < length; i++) {
        callbacks[i]?.(...args);
      }
    }
    /**
     * Add a callback to the event
     * @param event Event name
     * @param cb Callback function
     * @returns Unsubscribe function
     */
    on(event, cb) {
      if (this.events[event]) {
        this.events[event].push(cb);
      } else {
        this.events[event] = [cb];
      }
      return () => {
        this.events[event] = this.events[event]?.filter((i) => cb !== i);
      };
    }
    /**
     * Remove a callback from the event
     * @param event Event name
     * @param callback Callback function
     */
    off(event, callback) {
      this.events[event] = this.events[event]?.filter((i) => callback !== i);
    }
    /**
     * Remove all event listeners and clean up
     */
    destroy() {
      this.events = {};
    }
  };
  var LINE_HEIGHT = 100 / 6;
  var listenerOptions = { passive: false };
  function getDeltaMultiplier(deltaMode, size) {
    if (deltaMode === 1) return LINE_HEIGHT;
    if (deltaMode === 2) return size;
    return 1;
  }
  var VirtualScroll = class {
    constructor(element, options = { wheelMultiplier: 1, touchMultiplier: 1 }) {
      this.element = element;
      this.options = options;
      window.addEventListener("resize", this.onWindowResize);
      this.onWindowResize();
      this.element.addEventListener("wheel", this.onWheel, listenerOptions);
      this.element.addEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.addEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.addEventListener("touchend", this.onTouchEnd, listenerOptions);
    }
    touchStart = {
      x: 0,
      y: 0
    };
    lastDelta = {
      x: 0,
      y: 0
    };
    window = {
      width: 0,
      height: 0
    };
    emitter = new Emitter();
    /**
     * Add an event listener for the given event and callback
     *
     * @param event Event name
     * @param callback Callback function
     */
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    /** Remove all event listeners and clean up */
    destroy() {
      this.emitter.destroy();
      window.removeEventListener("resize", this.onWindowResize);
      this.element.removeEventListener("wheel", this.onWheel, listenerOptions);
      this.element.removeEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchend",
        this.onTouchEnd,
        listenerOptions
      );
    }
    /**
     * Event handler for 'touchstart' event
     *
     * @param event Touch event
     */
    onTouchStart = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: 0,
        y: 0
      };
      this.emitter.emit("scroll", {
        deltaX: 0,
        deltaY: 0,
        event
      });
    };
    /** Event handler for 'touchmove' event */
    onTouchMove = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier;
      const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: deltaX,
        y: deltaY
      };
      this.emitter.emit("scroll", {
        deltaX,
        deltaY,
        event
      });
    };
    onTouchEnd = (event) => {
      this.emitter.emit("scroll", {
        deltaX: this.lastDelta.x,
        deltaY: this.lastDelta.y,
        event
      });
    };
    /** Event handler for 'wheel' event */
    onWheel = (event) => {
      let { deltaX, deltaY, deltaMode } = event;
      const multiplierX = getDeltaMultiplier(deltaMode, this.window.width);
      const multiplierY = getDeltaMultiplier(deltaMode, this.window.height);
      deltaX *= multiplierX;
      deltaY *= multiplierY;
      deltaX *= this.options.wheelMultiplier;
      deltaY *= this.options.wheelMultiplier;
      this.emitter.emit("scroll", { deltaX, deltaY, event });
    };
    onWindowResize = () => {
      this.window = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
  };
  var defaultEasing = (t) => Math.min(1, 1.001 - 2 ** (-10 * t));
  var Lenis = class {
    _isScrolling = false;
    // true when scroll is animating
    _isStopped = false;
    // true if user should not be able to scroll - enable/disable programmatically
    _isLocked = false;
    // same as isStopped but enabled/disabled when scroll reaches target
    _preventNextNativeScrollEvent = false;
    _resetVelocityTimeout = null;
    _rafId = null;
    /**
     * Whether or not the user is touching the screen
     */
    isTouching;
    /**
     * The time in ms since the lenis instance was created
     */
    time = 0;
    /**
     * User data that will be forwarded through the scroll event
     *
     * @example
     * lenis.scrollTo(100, {
     *   userData: {
     *     foo: 'bar'
     *   }
     * })
     */
    userData = {};
    /**
     * The last velocity of the scroll
     */
    lastVelocity = 0;
    /**
     * The current velocity of the scroll
     */
    velocity = 0;
    /**
     * The direction of the scroll
     */
    direction = 0;
    /**
     * The options passed to the lenis instance
     */
    options;
    /**
     * The target scroll value
     */
    targetScroll;
    /**
     * The animated scroll value
     */
    animatedScroll;
    // These are instanciated here as they don't need information from the options
    animate = new Animate();
    emitter = new Emitter();
    // These are instanciated in the constructor as they need information from the options
    dimensions;
    // This is not private because it's used in the Snap class
    virtualScroll;
    constructor({
      wrapper = window,
      content = document.documentElement,
      eventsTarget = wrapper,
      smoothWheel = true,
      syncTouch = false,
      syncTouchLerp = 0.075,
      touchInertiaExponent = 1.7,
      duration,
      // in seconds
      easing,
      lerp: lerp22 = 0.1,
      infinite = false,
      orientation = "vertical",
      // vertical, horizontal
      gestureOrientation = orientation === "horizontal" ? "both" : "vertical",
      // vertical, horizontal, both
      touchMultiplier = 1,
      wheelMultiplier = 1,
      autoResize = true,
      prevent,
      virtualScroll,
      overscroll = true,
      autoRaf = false,
      anchors = false,
      autoToggle = false,
      // https://caniuse.com/?search=transition-behavior
      allowNestedScroll = false,
      __experimental__naiveDimensions = false,
      naiveDimensions = __experimental__naiveDimensions,
      stopInertiaOnNavigate = false
    } = {}) {
      window.lenisVersion = version;
      if (!window.lenis) {
        window.lenis = {};
      }
      window.lenis.version = version;
      if (orientation === "horizontal") {
        window.lenis.horizontal = true;
      }
      if (syncTouch === true) {
        window.lenis.touch = true;
      }
      if (!wrapper || wrapper === document.documentElement) {
        wrapper = window;
      }
      if (typeof duration === "number" && typeof easing !== "function") {
        easing = defaultEasing;
      } else if (typeof easing === "function" && typeof duration !== "number") {
        duration = 1;
      }
      this.options = {
        wrapper,
        content,
        eventsTarget,
        smoothWheel,
        syncTouch,
        syncTouchLerp,
        touchInertiaExponent,
        duration,
        easing,
        lerp: lerp22,
        infinite,
        gestureOrientation,
        orientation,
        touchMultiplier,
        wheelMultiplier,
        autoResize,
        prevent,
        virtualScroll,
        overscroll,
        autoRaf,
        anchors,
        autoToggle,
        allowNestedScroll,
        naiveDimensions,
        stopInertiaOnNavigate
      };
      this.dimensions = new Dimensions(wrapper, content, { autoResize });
      this.updateClassName();
      this.targetScroll = this.animatedScroll = this.actualScroll;
      this.options.wrapper.addEventListener("scroll", this.onNativeScroll);
      this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      if (this.options.anchors || this.options.stopInertiaOnNavigate) {
        this.options.wrapper.addEventListener(
          "click",
          this.onClick
        );
      }
      this.options.wrapper.addEventListener(
        "pointerdown",
        this.onPointerDown
      );
      this.virtualScroll = new VirtualScroll(eventsTarget, {
        touchMultiplier,
        wheelMultiplier
      });
      this.virtualScroll.on("scroll", this.onVirtualScroll);
      if (this.options.autoToggle) {
        this.checkOverflow();
        this.rootElement.addEventListener("transitionend", this.onTransitionEnd);
      }
      if (this.options.autoRaf) {
        this._rafId = requestAnimationFrame(this.raf);
      }
    }
    /**
     * Destroy the lenis instance, remove all event listeners and clean up the class name
     */
    destroy() {
      this.emitter.destroy();
      this.options.wrapper.removeEventListener("scroll", this.onNativeScroll);
      this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      this.options.wrapper.removeEventListener(
        "pointerdown",
        this.onPointerDown
      );
      if (this.options.anchors || this.options.stopInertiaOnNavigate) {
        this.options.wrapper.removeEventListener(
          "click",
          this.onClick
        );
      }
      this.virtualScroll.destroy();
      this.dimensions.destroy();
      this.cleanUpClassName();
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
      }
    }
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    off(event, callback) {
      return this.emitter.off(event, callback);
    }
    onScrollEnd = (e) => {
      if (!(e instanceof CustomEvent)) {
        if (this.isScrolling === "smooth" || this.isScrolling === false) {
          e.stopPropagation();
        }
      }
    };
    dispatchScrollendEvent = () => {
      this.options.wrapper.dispatchEvent(
        new CustomEvent("scrollend", {
          bubbles: this.options.wrapper === window,
          // cancelable: false,
          detail: {
            lenisScrollEnd: true
          }
        })
      );
    };
    get overflow() {
      const property = this.isHorizontal ? "overflow-x" : "overflow-y";
      return getComputedStyle(this.rootElement)[property];
    }
    checkOverflow() {
      if (["hidden", "clip"].includes(this.overflow)) {
        this.internalStop();
      } else {
        this.internalStart();
      }
    }
    onTransitionEnd = (event) => {
      if (event.propertyName.includes("overflow")) {
        this.checkOverflow();
      }
    };
    setScroll(scroll) {
      if (this.isHorizontal) {
        this.options.wrapper.scrollTo({ left: scroll, behavior: "instant" });
      } else {
        this.options.wrapper.scrollTo({ top: scroll, behavior: "instant" });
      }
    }
    onClick = (event) => {
      const path = event.composedPath();
      const linkElements = path.filter(
        (node) => node instanceof HTMLAnchorElement && node.href
      );
      const linkElementsUrls = linkElements.map(
        (element) => new URL(element.href)
      );
      const currentUrl = new URL(window.location.href);
      if (this.options.anchors) {
        const anchorElementUrl = linkElementsUrls.find(
          (targetUrl) => currentUrl.host === targetUrl.host && currentUrl.pathname === targetUrl.pathname && targetUrl.hash
        );
        if (anchorElementUrl) {
          const options = typeof this.options.anchors === "object" && this.options.anchors ? this.options.anchors : void 0;
          const target = `#${anchorElementUrl.hash.split("#")[1]}`;
          this.scrollTo(target, options);
          return;
        }
      }
      if (this.options.stopInertiaOnNavigate) {
        const hasPageLinkElementUrl = linkElementsUrls.some(
          (targetUrl) => currentUrl.host === targetUrl.host && currentUrl.pathname !== targetUrl.pathname
        );
        if (hasPageLinkElementUrl) {
          this.reset();
          return;
        }
      }
    };
    onPointerDown = (event) => {
      if (event.button === 1) {
        this.reset();
      }
    };
    onVirtualScroll = (data) => {
      if (typeof this.options.virtualScroll === "function" && this.options.virtualScroll(data) === false)
        return;
      const { deltaX, deltaY, event } = data;
      this.emitter.emit("virtual-scroll", { deltaX, deltaY, event });
      if (event.ctrlKey) return;
      if (event.lenisStopPropagation) return;
      const isTouch = event.type.includes("touch");
      const isWheel = event.type.includes("wheel");
      this.isTouching = event.type === "touchstart" || event.type === "touchmove";
      const isClickOrTap = deltaX === 0 && deltaY === 0;
      const isTapToStop = this.options.syncTouch && isTouch && event.type === "touchstart" && isClickOrTap && !this.isStopped && !this.isLocked;
      if (isTapToStop) {
        this.reset();
        return;
      }
      const isUnknownGesture = this.options.gestureOrientation === "vertical" && deltaY === 0 || this.options.gestureOrientation === "horizontal" && deltaX === 0;
      if (isClickOrTap || isUnknownGesture) {
        return;
      }
      let composedPath = event.composedPath();
      composedPath = composedPath.slice(0, composedPath.indexOf(this.rootElement));
      const prevent = this.options.prevent;
      const gestureOrientation = Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
      if (composedPath.find(
        (node) => node instanceof HTMLElement && (typeof prevent === "function" && prevent?.(node) || node.hasAttribute?.("data-lenis-prevent") || gestureOrientation === "vertical" && node.hasAttribute?.("data-lenis-prevent-vertical") || gestureOrientation === "horizontal" && node.hasAttribute?.("data-lenis-prevent-horizontal") || isTouch && node.hasAttribute?.("data-lenis-prevent-touch") || isWheel && node.hasAttribute?.("data-lenis-prevent-wheel") || this.options.allowNestedScroll && this.hasNestedScroll(node, {
          deltaX,
          deltaY
        }))
      ))
        return;
      if (this.isStopped || this.isLocked) {
        if (event.cancelable) {
          event.preventDefault();
        }
        return;
      }
      const isSmooth = this.options.syncTouch && isTouch || this.options.smoothWheel && isWheel;
      if (!isSmooth) {
        this.isScrolling = "native";
        this.animate.stop();
        event.lenisStopPropagation = true;
        return;
      }
      let delta = deltaY;
      if (this.options.gestureOrientation === "both") {
        delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
      } else if (this.options.gestureOrientation === "horizontal") {
        delta = deltaX;
      }
      if (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && this.limit > 0 && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && deltaY > 0 || this.animatedScroll === this.limit && deltaY < 0)) {
        event.lenisStopPropagation = true;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      const isSyncTouch = isTouch && this.options.syncTouch;
      const isTouchEnd = isTouch && event.type === "touchend";
      const hasTouchInertia = isTouchEnd;
      if (hasTouchInertia) {
        delta = Math.sign(this.velocity) * Math.abs(this.velocity) ** this.options.touchInertiaExponent;
      }
      this.scrollTo(this.targetScroll + delta, {
        programmatic: false,
        ...isSyncTouch ? {
          lerp: hasTouchInertia ? this.options.syncTouchLerp : 1
        } : {
          lerp: this.options.lerp,
          duration: this.options.duration,
          easing: this.options.easing
        }
      });
    };
    /**
     * Force lenis to recalculate the dimensions
     */
    resize() {
      this.dimensions.resize();
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.emit();
    }
    emit() {
      this.emitter.emit("scroll", this);
    }
    onNativeScroll = () => {
      if (this._resetVelocityTimeout !== null) {
        clearTimeout(this._resetVelocityTimeout);
        this._resetVelocityTimeout = null;
      }
      if (this._preventNextNativeScrollEvent) {
        this._preventNextNativeScrollEvent = false;
        return;
      }
      if (this.isScrolling === false || this.isScrolling === "native") {
        const lastScroll = this.animatedScroll;
        this.animatedScroll = this.targetScroll = this.actualScroll;
        this.lastVelocity = this.velocity;
        this.velocity = this.animatedScroll - lastScroll;
        this.direction = Math.sign(
          this.animatedScroll - lastScroll
        );
        if (!this.isStopped) {
          this.isScrolling = "native";
        }
        this.emit();
        if (this.velocity !== 0) {
          this._resetVelocityTimeout = setTimeout(() => {
            this.lastVelocity = this.velocity;
            this.velocity = 0;
            this.isScrolling = false;
            this.emit();
          }, 400);
        }
      }
    };
    reset() {
      this.isLocked = false;
      this.isScrolling = false;
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.lastVelocity = this.velocity = 0;
      this.animate.stop();
    }
    /**
     * Start lenis scroll after it has been stopped
     */
    start() {
      if (!this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.removeProperty("overflow");
        return;
      }
      this.internalStart();
    }
    internalStart() {
      if (!this.isStopped) return;
      this.reset();
      this.isStopped = false;
      this.emit();
    }
    /**
     * Stop lenis scroll
     */
    stop() {
      if (this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.setProperty("overflow", "clip");
        return;
      }
      this.internalStop();
    }
    internalStop() {
      if (this.isStopped) return;
      this.reset();
      this.isStopped = true;
      this.emit();
    }
    /**
     * RequestAnimationFrame for lenis
     *
     * @param time The time in ms from an external clock like `requestAnimationFrame` or Tempus
     */
    raf = (time) => {
      const deltaTime = time - (this.time || time);
      this.time = time;
      this.animate.advance(deltaTime * 1e-3);
      if (this.options.autoRaf) {
        this._rafId = requestAnimationFrame(this.raf);
      }
    };
    /**
     * Scroll to a target value
     *
     * @param target The target value to scroll to
     * @param options The options for the scroll
     *
     * @example
     * lenis.scrollTo(100, {
     *   offset: 100,
     *   duration: 1,
     *   easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
     *   lerp: 0.1,
     *   onStart: () => {
     *     console.log('onStart')
     *   },
     *   onComplete: () => {
     *     console.log('onComplete')
     *   },
     * })
     */
    scrollTo(_target, {
      offset = 0,
      immediate = false,
      lock = false,
      programmatic = true,
      // called from outside of the class
      lerp: lerp22 = programmatic ? this.options.lerp : void 0,
      duration = programmatic ? this.options.duration : void 0,
      easing = programmatic ? this.options.easing : void 0,
      onStart,
      onComplete,
      force = false,
      // scroll even if stopped
      userData
    } = {}) {
      if ((this.isStopped || this.isLocked) && !force) return;
      let target = _target;
      let adjustedOffset = offset;
      if (typeof target === "string" && ["top", "left", "start", "#"].includes(target)) {
        target = 0;
      } else if (typeof target === "string" && ["bottom", "right", "end"].includes(target)) {
        target = this.limit;
      } else {
        let node = null;
        if (typeof target === "string") {
          node = document.querySelector(target);
          if (!node) {
            if (target === "#top") {
              target = 0;
            } else {
              console.warn("Lenis: Target not found", target);
            }
          }
        } else if (target instanceof HTMLElement && target?.nodeType) {
          node = target;
        }
        if (node) {
          if (this.options.wrapper !== window) {
            const wrapperRect = this.rootElement.getBoundingClientRect();
            adjustedOffset -= this.isHorizontal ? wrapperRect.left : wrapperRect.top;
          }
          const rect = node.getBoundingClientRect();
          target = (this.isHorizontal ? rect.left : rect.top) + this.animatedScroll;
        }
      }
      if (typeof target !== "number") return;
      target += adjustedOffset;
      target = Math.round(target);
      if (this.options.infinite) {
        if (programmatic) {
          this.targetScroll = this.animatedScroll = this.scroll;
          const distance = target - this.animatedScroll;
          if (distance > this.limit / 2) {
            target -= this.limit;
          } else if (distance < -this.limit / 2) {
            target += this.limit;
          }
        }
      } else {
        target = clamp2(0, target, this.limit);
      }
      if (target === this.targetScroll) {
        onStart?.(this);
        onComplete?.(this);
        return;
      }
      this.userData = userData ?? {};
      if (immediate) {
        this.animatedScroll = this.targetScroll = target;
        this.setScroll(this.scroll);
        this.reset();
        this.preventNextNativeScrollEvent();
        this.emit();
        onComplete?.(this);
        this.userData = {};
        requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        });
        return;
      }
      if (!programmatic) {
        this.targetScroll = target;
      }
      if (typeof duration === "number" && typeof easing !== "function") {
        easing = defaultEasing;
      } else if (typeof easing === "function" && typeof duration !== "number") {
        duration = 1;
      }
      this.animate.fromTo(this.animatedScroll, target, {
        duration,
        easing,
        lerp: lerp22,
        onStart: () => {
          if (lock) this.isLocked = true;
          this.isScrolling = "smooth";
          onStart?.(this);
        },
        onUpdate: (value, completed) => {
          this.isScrolling = "smooth";
          this.lastVelocity = this.velocity;
          this.velocity = value - this.animatedScroll;
          this.direction = Math.sign(this.velocity);
          this.animatedScroll = value;
          this.setScroll(this.scroll);
          if (programmatic) {
            this.targetScroll = value;
          }
          if (!completed) this.emit();
          if (completed) {
            this.reset();
            this.emit();
            onComplete?.(this);
            this.userData = {};
            requestAnimationFrame(() => {
              this.dispatchScrollendEvent();
            });
            this.preventNextNativeScrollEvent();
          }
        }
      });
    }
    preventNextNativeScrollEvent() {
      this._preventNextNativeScrollEvent = true;
      requestAnimationFrame(() => {
        this._preventNextNativeScrollEvent = false;
      });
    }
    hasNestedScroll(node, { deltaX, deltaY }) {
      const time = Date.now();
      if (!node._lenis) node._lenis = {};
      const cache = node._lenis;
      let hasOverflowX;
      let hasOverflowY;
      let isScrollableX;
      let isScrollableY;
      let hasOverscrollBehaviorX;
      let hasOverscrollBehaviorY;
      let scrollWidth;
      let scrollHeight;
      let clientWidth;
      let clientHeight;
      if (time - (cache.time ?? 0) > 2e3) {
        cache.time = Date.now();
        const computedStyle = window.getComputedStyle(node);
        cache.computedStyle = computedStyle;
        hasOverflowX = ["auto", "overlay", "scroll"].includes(
          computedStyle.overflowX
        );
        hasOverflowY = ["auto", "overlay", "scroll"].includes(
          computedStyle.overflowY
        );
        hasOverscrollBehaviorX = ["auto"].includes(
          computedStyle.overscrollBehaviorX
        );
        hasOverscrollBehaviorY = ["auto"].includes(
          computedStyle.overscrollBehaviorY
        );
        cache.hasOverflowX = hasOverflowX;
        cache.hasOverflowY = hasOverflowY;
        if (!(hasOverflowX || hasOverflowY)) return false;
        scrollWidth = node.scrollWidth;
        scrollHeight = node.scrollHeight;
        clientWidth = node.clientWidth;
        clientHeight = node.clientHeight;
        isScrollableX = scrollWidth > clientWidth;
        isScrollableY = scrollHeight > clientHeight;
        cache.isScrollableX = isScrollableX;
        cache.isScrollableY = isScrollableY;
        cache.scrollWidth = scrollWidth;
        cache.scrollHeight = scrollHeight;
        cache.clientWidth = clientWidth;
        cache.clientHeight = clientHeight;
        cache.hasOverscrollBehaviorX = hasOverscrollBehaviorX;
        cache.hasOverscrollBehaviorY = hasOverscrollBehaviorY;
      } else {
        isScrollableX = cache.isScrollableX;
        isScrollableY = cache.isScrollableY;
        hasOverflowX = cache.hasOverflowX;
        hasOverflowY = cache.hasOverflowY;
        scrollWidth = cache.scrollWidth;
        scrollHeight = cache.scrollHeight;
        clientWidth = cache.clientWidth;
        clientHeight = cache.clientHeight;
        hasOverscrollBehaviorX = cache.hasOverscrollBehaviorX;
        hasOverscrollBehaviorY = cache.hasOverscrollBehaviorY;
      }
      if (!(hasOverflowX && isScrollableX || hasOverflowY && isScrollableY)) {
        return false;
      }
      const orientation = Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
      let scroll;
      let maxScroll;
      let delta;
      let hasOverflow;
      let isScrollable;
      let hasOverscrollBehavior;
      if (orientation === "horizontal") {
        scroll = Math.round(node.scrollLeft);
        maxScroll = scrollWidth - clientWidth;
        delta = deltaX;
        hasOverflow = hasOverflowX;
        isScrollable = isScrollableX;
        hasOverscrollBehavior = hasOverscrollBehaviorX;
      } else if (orientation === "vertical") {
        scroll = Math.round(node.scrollTop);
        maxScroll = scrollHeight - clientHeight;
        delta = deltaY;
        hasOverflow = hasOverflowY;
        isScrollable = isScrollableY;
        hasOverscrollBehavior = hasOverscrollBehaviorY;
      } else {
        return false;
      }
      if (!hasOverscrollBehavior && (scroll >= maxScroll || scroll <= 0)) {
        return true;
      }
      const willScroll = delta > 0 ? scroll < maxScroll : scroll > 0;
      return willScroll && hasOverflow && isScrollable;
    }
    /**
     * The root element on which lenis is instanced
     */
    get rootElement() {
      return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
    }
    /**
     * The limit which is the maximum scroll value
     */
    get limit() {
      if (this.options.naiveDimensions) {
        if (this.isHorizontal) {
          return this.rootElement.scrollWidth - this.rootElement.clientWidth;
        }
        return this.rootElement.scrollHeight - this.rootElement.clientHeight;
      }
      return this.dimensions.limit[this.isHorizontal ? "x" : "y"];
    }
    /**
     * Whether or not the scroll is horizontal
     */
    get isHorizontal() {
      return this.options.orientation === "horizontal";
    }
    /**
     * The actual scroll value
     */
    get actualScroll() {
      const wrapper = this.options.wrapper;
      return this.isHorizontal ? wrapper.scrollX ?? wrapper.scrollLeft : wrapper.scrollY ?? wrapper.scrollTop;
    }
    /**
     * The current scroll value
     */
    get scroll() {
      return this.options.infinite ? modulo(this.animatedScroll, this.limit) : this.animatedScroll;
    }
    /**
     * The progress of the scroll relative to the limit
     */
    get progress() {
      return this.limit === 0 ? 1 : this.scroll / this.limit;
    }
    /**
     * Current scroll state
     */
    get isScrolling() {
      return this._isScrolling;
    }
    set isScrolling(value) {
      if (this._isScrolling !== value) {
        this._isScrolling = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is stopped
     */
    get isStopped() {
      return this._isStopped;
    }
    set isStopped(value) {
      if (this._isStopped !== value) {
        this._isStopped = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is locked
     */
    get isLocked() {
      return this._isLocked;
    }
    set isLocked(value) {
      if (this._isLocked !== value) {
        this._isLocked = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is smooth scrolling
     */
    get isSmooth() {
      return this.isScrolling === "smooth";
    }
    /**
     * The class name applied to the wrapper element
     */
    get className() {
      let className = "lenis";
      if (this.options.autoToggle) className += " lenis-autoToggle";
      if (this.isStopped) className += " lenis-stopped";
      if (this.isLocked) className += " lenis-locked";
      if (this.isScrolling) className += " lenis-scrolling";
      if (this.isScrolling === "smooth") className += " lenis-smooth";
      return className;
    }
    updateClassName() {
      this.cleanUpClassName();
      this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim();
    }
    cleanUpClassName() {
      this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim();
    }
  };

  // js/home.js
  function initHome() {
    document.querySelector(".intro_holder video").setAttribute("data-layout-id", "intro-video");
    console.log("initHome");
    const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
    const layout = createLayout(".main");
    const tl = createTimeline({
      defaults: { duration: 700, ease: cubicEase }
    });
    tl.add(
      ".intro_title",
      {
        translateX: (el, i) => i === 0 ? ["100%", "0%"] : ["-100%", "0%"],
        duration: 500,
        delay: 250
      },
      0
    ).add(
      ".intro_holder video",
      {
        scale: [0, 0.5]
      },
      750
    ).add(
      ".intro_center",
      {
        translateX: (el, i) => {
          const rect = el.getBoundingClientRect();
          const padding = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.875;
          if (i === 0) {
            return -(rect.left - padding);
          } else {
            return window.innerWidth - rect.right - padding;
          }
        }
      },
      750
    ).add(".intro_holder video", {
      scale: 1
    }).add(".intro", { backgroundColor: "rgba(255,255,255,0)", duration: 250 }).add(".home-item", { clipPath: "inset(0 0 0 0)" });
    document.querySelectorAll(".home_cms--link").forEach((link) => {
      const crs = link.querySelector(".home_flw--crs");
      link.addEventListener("mousemove", (e) => {
        const linkRect = link.getBoundingClientRect();
        const crsRect = crs.getBoundingClientRect();
        const halfW = crsRect.width / 2;
        const halfH = crsRect.height / 2;
        const x = Math.min(
          Math.max(e.clientX - linkRect.left, halfW),
          linkRect.width - halfW
        );
        const y = Math.min(
          Math.max(e.clientY - linkRect.top, halfH),
          linkRect.height - halfH
        );
        crs.style.transform = `translate(${x - halfW}px, ${y - halfH}px)`;
      });
      link.addEventListener("mouseenter", () => {
        animate(crs, { opacity: 1, ease: "inOut(1.68)" });
      });
      link.addEventListener("mouseleave", () => {
        animate(crs, { opacity: 0, ease: "inOut(1.68)" });
      });
    });
    const lenis = new Lenis({
      infinite: true,
      smoothTouch: true,
      syncTouch: true,
      touchMultiplier: 1.5
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // js/about.js
  function initAbout() {
    const section = document.querySelector(".section.about");
    const grads = document.querySelectorAll(".about_bg-grad");
    const total = grads.length;
    const maxOffset = 10;
    section.addEventListener("mousemove", (e) => {
      const rect = section.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;
      const xShift = (mouseX - 0.5) * maxOffset * 3.5;
      grads.forEach((grad, i) => {
        const gradPos = i / (total - 1);
        const dist = gradPos - mouseY;
        const wave = xShift * (1 - Math.abs(dist) * 2);
        grad.style.transform = `translateX(${wave}%)`;
      });
    });
  }

  // js/work.js
  function initWork() {
    const filterBtns = document.querySelectorAll("[filter-lp]");
    const filters = document.querySelectorAll(
      '[filter-lp="filters"] [filter-lp-field]'
    );
    const items = document.querySelectorAll(
      '[filter-lp="list"] [filter-lp-field]'
    );
    let activeFilter = "all";
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const field = btn.getAttribute("filter-lp-field");
        if (activeFilter === field) {
          activeFilter = "all";
          filters.forEach((f) => f.classList.remove("is-active"));
        } else {
          activeFilter = field;
          filters.forEach((f) => f.classList.remove("is-active"));
          btn.classList.add("is-active");
        }
        items.forEach((item) => {
          const match = activeFilter === "all" || item.getAttribute("filter-lp-field") === activeFilter;
          const workItem = item.closest(".work_item");
          workItem.classList.toggle("off", !match);
          workItem.querySelector(".work_title").classList.toggle("off", !match);
        });
      });
    });
    const workItems = document.querySelectorAll(".work_item");
    workItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        if (item.classList.contains("off")) return;
        workItems.forEach((other) => {
          const isActive = other === item;
          other.querySelector(".work_title").classList.toggle("is-active", isActive);
          const tl = createTimeline();
          tl.add(other.querySelector(".work_link"), {
            display: isActive ? "block" : "none",
            duration: 0
          }).add(
            other.querySelectorAll(".work_thumb"),
            { opacity: isActive ? 1 : 0, duration: 300, ease: "outQuad" },
            isActive ? 0 : ">=0"
          );
        });
      });
    });
  }

  // js/index.js
  console.log("Getting in App JS");
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  function updateTime() {
    document.querySelector("#time").textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString(
      "en-GB",
      {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }
  updateTime();
  setInterval(updateTime, 1e3);
  var FadeTransition = class extends Transition {
    onLeave({ from, done }) {
      from.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 400,
        easing: "ease",
        fill: "forwards"
      }).finished.then(done);
    }
    onEnter({ to, done }) {
      to.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
        easing: "ease",
        fill: "forwards"
      }).finished.then(done);
    }
  };
  var DefaultRenderer = class extends Renderer {
    initialLoad() {
      this.onEnter();
    }
    onEnter() {
      const path = window.location.pathname;
      if (path === "/") initHome();
      if (path.includes("about")) initAbout();
      if (path.includes("work")) initWork();
    }
  };
  var app = new Core({
    transitions: { default: FadeTransition },
    renderers: { default: DefaultRenderer }
  });
})();
/*! Bundled license information:

animejs/dist/modules/core/consts.js:
animejs/dist/modules/core/globals.js:
animejs/dist/modules/core/helpers.js:
animejs/dist/modules/core/transforms.js:
animejs/dist/modules/core/colors.js:
animejs/dist/modules/core/values.js:
animejs/dist/modules/core/render.js:
animejs/dist/modules/core/styles.js:
animejs/dist/modules/core/clock.js:
animejs/dist/modules/core/targets.js:
animejs/dist/modules/core/units.js:
  (**
   * Anime.js - core - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/animation/additive.js:
animejs/dist/modules/animation/composition.js:
animejs/dist/modules/animation/animation.js:
  (**
   * Anime.js - animation - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/engine/engine.js:
  (**
   * Anime.js - engine - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/timer/timer.js:
  (**
   * Anime.js - timer - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/easings/none.js:
animejs/dist/modules/easings/eases/parser.js:
animejs/dist/modules/easings/cubic-bezier/index.js:
  (**
   * Anime.js - easings - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/timeline/position.js:
animejs/dist/modules/timeline/timeline.js:
  (**
   * Anime.js - timeline - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/waapi/composition.js:
animejs/dist/modules/waapi/waapi.js:
  (**
   * Anime.js - waapi - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/layout/layout.js:
  (**
   * Anime.js - layout - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)

animejs/dist/modules/index.js:
  (**
   * Anime.js - ESM
   * @version v4.3.6
   * @license MIT
   * @copyright 2026 - Julian Garnier
   *)
*/
