window.__ModuleLoader__.load({
  id: 'dsh-device-deck',
  factory(require) {
    var module = { exports: {} };
    var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_react8 = require("react");
var import_react_dom5 = __toESM(require("react-dom"), 1);

// src/client/android.js
var import_react4 = require("react");
var import_react_dom = __toESM(require("react-dom"), 1);

// src/client/constants.js
var API = "/api/device-deck";
var STORE_KEY = ["dsh-device-deck", "state", "v1"].join(".");
var T_META = 1;
var T_CONFIG = 2;
var T_DATA = 3;
var T_ERROR = 4;
var T_END = 5;
var HEADER_HEIGHT = 36;
var STRIP_HEIGHT = 50;
var LINK_LIMIT = 20;

// src/client/api.js
async function apiJson(path, init) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...init
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
  return data;
}
function postJson(path, value) {
  return apiJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value)
  });
}
async function clipboardMatches(text) {
  if (!navigator.clipboard?.readText) return true;
  try {
    return await navigator.clipboard.readText() === text;
  } catch {
    return true;
  }
}
async function copyText(value, deniedMessage) {
  const text = String(value || "");
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      if (await clipboardMatches(text)) return;
    } catch {
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error(deniedMessage || "clipboard unavailable");
  if (!await clipboardMatches(text)) throw new Error(deniedMessage || "clipboard unavailable");
}
function shotUrl(shotPath) {
  return `${API}/file?path=${encodeURIComponent(shotPath)}`;
}
function deleteShotFile(shotPath) {
  return apiJson(`/screenshots?path=${encodeURIComponent(shotPath)}`, { method: "DELETE" });
}
function clearShotHistory() {
  return apiJson("/screenshots", { method: "DELETE" });
}
async function copyShotImage(shotPath) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("clipboard unavailable");
  }
  const response = await fetch(shotUrl(shotPath), { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
}
async function attachShot(ctx, sessionId, inputActions, shot, t) {
  const conversation = ctx.conversation || ctx.get?.("conversation");
  if (!conversation?.createDrafts) throw new Error(t.attachUnavailable);
  const binding = ctx.sessions?.binding?.(sessionId);
  if (!binding) throw new Error(t.attachUnavailable);
  let actions = inputActions;
  if (!actions?.addAttachments) {
    try {
      actions = conversation.input?.for?.(binding.ctx)?.actions;
    } catch {
    }
  }
  if (!actions?.addAttachments) throw new Error(t.attachUnavailable);
  const response = await fetch(shotUrl(shot.path), { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const file = new File([blob], shot.name || `device-shot-${Date.now()}.png`, { type: "image/png" });
  const ordinary = binding.session.getSnapshot().subagent === null;
  const drafts = conversation.createDrafts(sessionId, [file], ordinary);
  if (!actions.addAttachments(drafts.map((draft) => draft.id))) {
    conversation.releaseDraftAttachments?.(drafts);
    throw new Error(t.attachUnavailable);
  }
  try {
    conversation.input?.for?.(binding.ctx)?.focus?.();
  } catch {
  }
}

// src/client/i18n.js
var import_react = require("react");

// src/client/copy.js
var COPY = {
  zh: {
    title: "Device Deck",
    live: "\u5B9E\u65F6",
    connecting: "\u8FDE\u63A5\u4E2D",
    offline: "\u79BB\u7EBF",
    noDevice: "\u672A\u68C0\u6D4B\u5230 Android \u8BBE\u5907",
    noDeviceHint: "\u8BF7\u8FDE\u63A5 USB \u5E76\u5F00\u542F\u8C03\u8BD5\uFF0C\u6216\u542F\u52A8\u6A21\u62DF\u5668\u3002",
    adbMissing: "\u672A\u627E\u5230 adb",
    refresh: "\u5237\u65B0\u8BBE\u5907",
    capture: "\u622A\u56FE",
    menuShot: "\u8BBE\u5907\u955C\u50CF\u622A\u56FE",
    menuShotHint: "\u9009\u62E9\u622A\u56FE\u5E76\u52A0\u5165\u8F93\u5165\u6846",
    pickerTitle: "\u9009\u62E9\u622A\u56FE",
    pickerHint: "\u70B9\u51FB\u622A\u56FE\u52A0\u5165\u5F53\u524D\u8F93\u5165\u6846",
    pickerLoading: "\u6B63\u5728\u8BFB\u53D6\u622A\u56FE\u2026",
    pickerEmpty: "\u8FD8\u6CA1\u6709\u622A\u56FE\u3002\u5148\u5728\u8BBE\u5907\u955C\u50CF\u4E2D\u622A\u56FE\u3002",
    pickerLoadFailed: "\u8BFB\u53D6\u622A\u56FE\u5931\u8D25\uFF1A{error}",
    pickerAttachFailed: "\u52A0\u5165\u5931\u8D25\uFF1A{error}",
    pickerBusy: "\u6B63\u5728\u52A0\u5165\u2026",
    pickerDelete: "\u5220\u9664",
    pickerDeleteFailed: "\u5220\u9664\u5931\u8D25\uFF1A{error}",
    pickerClear: "\u6E05\u7A7A",
    pickerClearing: "\u6B63\u5728\u6E05\u7A7A\u2026",
    pickerClearConfirm: "\u786E\u8BA4\u6E05\u7A7A",
    pickerClearFailed: "\u6E05\u7A7A\u5931\u8D25\uFF1A{error}",
    attachUnavailable: "\u5F53\u524D\u8F93\u5165\u6846\u4E0D\u53EF\u7528",
    history: "\u622A\u56FE\u5386\u53F2",
    close: "\u6536\u8D77",
    back: "\u8FD4\u56DE\u952E",
    home: "\u4E3B\u5C4F\u5E55",
    text: "\u6587\u672C\u8F93\u5165",
    link: "\u6253\u5F00\u94FE\u63A5",
    textHint: "\u82F1\u6587\u3001\u6570\u5B57\u4E0E\u5E38\u89C1\u7B26\u53F7\u76F4\u63A5\u8F93\u5165\uFF1B\u4E2D\u6587\u4F1A\u7C98\u8D34\u5230\u8BBE\u5907\u526A\u8D34\u677F\uFF08\u9700\u6253\u5F00\u955C\u50CF\uFF09\u3002",
    sendText: "\u53D1\u9001",
    sendShortcut: "\u2318/Ctrl + \u21B5",
    open: "\u6253\u5F00",
    urlHint: "https://\u2026 \u6216 app://\u2026",
    linkHistory: "\u5386\u53F2\u94FE\u63A5",
    linkEmpty: "\u8FD8\u6CA1\u6709\u6253\u5F00\u8FC7\u94FE\u63A5",
    linkPin: "\u7F6E\u9876",
    linkUnpin: "\u53D6\u6D88\u7F6E\u9876",
    linkRemove: "\u5220\u9664",
    retry: "\u91CD\u65B0\u8FDE\u63A5",
    streamError: "\u672A\u80FD\u8FDE\u63A5\u5230\u8BBE\u5907\u5B9E\u65F6\u753B\u9762",
    disconnected: "\u8BBE\u5907\u753B\u9762\u5DF2\u65AD\u5F00",
    emptyShot: "\u8FD8\u6CA1\u6709\u622A\u56FE",
    selected: "\u5DF2\u9009\u5B9A",
    previewClose: "\u5173\u95ED\u9884\u89C8",
    previewCopy: "\u590D\u5236\u56FE\u7247",
    copyShotDone: "\u56FE\u7247\u5DF2\u590D\u5236",
    copyShotFailed: "\u590D\u5236\u56FE\u7247\u5931\u8D25\uFF1A{error}",
    shotSaved: "\u622A\u56FE\u5DF2\u4FDD\u5B58",
    fileSending: "\u6B63\u5728\u53D1\u9001 {name}",
    fileSent: "\u5DF2\u53D1\u9001\u5230 {path}",
    fileFailed: "\u53D1\u9001\u5931\u8D25\uFF1A{error}",
    connectingHint: "\u6B63\u5728\u8FDE\u63A5\u8BBE\u5907\u753B\u9762\u2026",
    switchDevice: "\u5207\u6362\u8BBE\u5907",
    screenshotStrip: "\u622A\u56FE",
    enterText: "\u5148\u5728\u624B\u673A\u4E0A\u70B9\u9009\u8F93\u5165\u6846\uFF0C\u518D\u5728\u6B64\u8F93\u5165",
    enterUrl: "\u8F93\u5165\u5730\u5740\u540E\u56DE\u8F66",
    menuRunning: "\u8FD0\u884C\u4E2D",
    menuNoOnline: "\u6CA1\u6709\u8BBE\u5907\u5728\u7EBF",
    menuReady: "\u5DF2\u5C31\u7EEA",
    menuStarting: "\u542F\u52A8\u4E2D",
    menuEmulator: "\u6A21\u62DF\u5668",
    menuReal: "\u771F\u673A",
    menuIosEmulator: "iOS \u6A21\u62DF\u5668",
    menuNotStarted: "\u672A\u542F\u52A8 \xB7 \u65E0\u7A97\u53E3\u8FD0\u884C",
    menuAndroidEmulators: "Android \u6A21\u62DF\u5668",
    menuIosEmulators: "iOS \u6A21\u62DF\u5668",
    menuIosDevices: "iOS \u771F\u673A",
    menuIosMirrorOpen: "\u6253\u5F00\u955C\u50CF",
    menuIosWdaHint: "\u9996\u6B21\u542F\u52A8\u9700\u8981\u6784\u5EFA WebDriverAgent\uFF0C\u7EA6 2\u20135 \u5206\u949F\u3002",
    iosHome: "\u4E3B\u5C4F\u5E55",
    iosPreparing: "\u6B63\u5728\u51C6\u5907 iOS \u955C\u50CF\u2026",
    iosStarting: "\u6B63\u5728\u542F\u52A8 WebDriverAgent\u2026",
    iosBuilding: "\u6B63\u5728\u6784\u5EFA WebDriverAgent\u2026",
    iosReady: "\u5DF2\u8FDE\u63A5",
    iosFailed: "iOS \u955C\u50CF\u542F\u52A8\u5931\u8D25",
    iosStop: "\u505C\u6B62\u955C\u50CF",
    menuShutdown: "\u5DF2\u5173\u673A",
    menuStart: "\u542F\u52A8",
    menuStartingBtn: "\u542F\u52A8\u4E2D",
    menuStop: "\u505C\u6B62\u6A21\u62DF\u5668",
    menuOpenMirror: "\u6253\u5F00\u955C\u50CF",
    menuOpenSimulator: "\u6253\u5F00 Simulator",
    menuWifiPlaceholder: "192.168.1.102:5555",
    menuConnect: "\u8FDE\u63A5",
    menuConnecting: "\u8FDE\u63A5\u4E2D",
    menuRefresh: "\u91CD\u65B0\u68C0\u6D4B\u8BBE\u5907",
    menuAll: "\u5168\u90E8",
    menuCollapse: "\u6536\u8D77",
    menuEmpty: "\u6CA1\u6709\u53EF\u7528\u6A21\u62DF\u5668",
    menuEmptyHint: "\u53EF\u8FDE\u63A5\u65E0\u7EBF ADB \u771F\u673A\uFF0C\u6216\u5B89\u88C5 Android AVD\u3002",
    menuIosUnsupported: "\u5DF2\u6253\u5F00 Simulator\uFF1BiOS \u753B\u9762\u6682\u4E0D\u652F\u6301\u955C\u50CF\u3002",
    menuJustStarted: "\u521A\u521A\u542F\u52A8",
    menuMinutes: "\u5206",
    menuSeconds: "\u79D2",
    menuHours: "\u5C0F\u65F6",
    menuDeviceUnit: "\u53F0",
    menuItemUnit: "\u4E2A",
    menuStartingWait: "\u6A21\u62DF\u5668\u6B63\u5728\u542F\u52A8\uFF0C\u5C31\u7EEA\u540E\u53EF\u6253\u5F00\u955C\u50CF",
    menuStopRequested: "\u5DF2\u8BF7\u6C42\u505C\u6B62",
    menuOnline: "\u53F0\u5728\u7EBF",
    menuNoDevice: "\u6CA1\u6709\u8BBE\u5907\u5728\u7EBF\uFF0C\u70B9\u51FB\u542F\u52A8\u6A21\u62DF\u5668",
    railBack: "\u8FD4\u56DE",
    railHome: "\u4E3B\u9875",
    railRecents: "\u6700\u8FD1\u4EFB\u52A1",
    railText: "\u8F93\u5165",
    railLink: "\u94FE\u63A5",
    railFile: "\u6587\u4EF6",
    railHistory: "\u622A\u56FE\u5386\u53F2",
    railCapture: "\u622A\u56FE",
    railCopyPage: "\u590D\u5236\u9875\u9762\u5730\u5740",
    copyPageDone: "\u9875\u9762\u5730\u5740\u5DF2\u590D\u5236",
    copyPageEmpty: "\u672A\u8BFB\u53D6\u5230\u9875\u9762\u5730\u5740",
    copyPageDenied: "\u526A\u8D34\u677F\u4E0D\u53EF\u7528",
    copyPageFailed: "\u590D\u5236\u5931\u8D25\uFF1A{error}",
    railRefresh: "\u91CD\u8FDE",
    railClose: "\u6536\u8D77"
  },
  en: {
    title: "Device Deck",
    live: "Live",
    connecting: "Connecting",
    offline: "Offline",
    noDevice: "No Android device found",
    noDeviceHint: "Connect USB with debugging on, or start an emulator.",
    adbMissing: "adb not found",
    refresh: "Refresh devices",
    capture: "Screenshot",
    menuShot: "Device screenshot",
    menuShotHint: "Pick a screenshot and add it to the composer",
    pickerTitle: "Choose a screenshot",
    pickerHint: "Click a screenshot to add it to the composer",
    pickerLoading: "Loading screenshots\u2026",
    pickerEmpty: "No screenshots yet. Capture one in the device mirror first.",
    pickerLoadFailed: "Cannot load screenshots: {error}",
    pickerAttachFailed: "Cannot add the screenshot: {error}",
    pickerBusy: "Adding\u2026",
    pickerDelete: "Delete",
    pickerDeleteFailed: "Cannot delete the screenshot: {error}",
    pickerClear: "Clear all",
    pickerClearing: "Clearing\u2026",
    pickerClearConfirm: "Confirm clear",
    pickerClearFailed: "Cannot clear the screenshots: {error}",
    attachUnavailable: "The composer is not available",
    history: "Screenshot history",
    close: "Minimize",
    back: "Back",
    home: "Home",
    text: "Text input",
    link: "Open link",
    textHint: "ASCII is typed directly; other text is pasted via the device clipboard (mirror must be open).",
    sendText: "Send",
    sendShortcut: "\u2318/Ctrl + \u21B5",
    open: "Open",
    urlHint: "https://\u2026 or app://\u2026",
    linkHistory: "Recent links",
    linkEmpty: "No links opened yet",
    linkPin: "Pin",
    linkUnpin: "Unpin",
    linkRemove: "Delete",
    retry: "Reconnect",
    streamError: "Cannot connect to the device stream",
    disconnected: "Device stream disconnected",
    emptyShot: "No screenshots yet",
    selected: "Selected",
    previewClose: "Close preview",
    previewCopy: "Copy image",
    copyShotDone: "Image copied",
    copyShotFailed: "Copy image failed: {error}",
    shotSaved: "Screenshot saved",
    fileSending: "Sending {name}",
    fileSent: "Sent to {path}",
    fileFailed: "Send failed: {error}",
    connectingHint: "Connecting to the device\u2026",
    switchDevice: "Switch device",
    screenshotStrip: "Shots",
    enterText: "Focus a field on the device, then type here",
    enterUrl: "Type a URL and press Enter",
    menuRunning: "Running",
    menuNoOnline: "No device online",
    menuReady: "Ready",
    menuStarting: "Starting",
    menuEmulator: "Emulator",
    menuReal: "Device",
    menuIosEmulator: "iOS simulator",
    menuNotStarted: "Stopped \xB7 headless",
    menuAndroidEmulators: "Android emulators",
    menuIosEmulators: "iOS simulators",
    menuIosDevices: "iOS devices",
    menuIosMirrorOpen: "Open mirror",
    menuIosWdaHint: "The first launch builds WebDriverAgent and takes 2\u20135 minutes.",
    iosHome: "Home",
    iosPreparing: "Preparing the iOS mirror\u2026",
    iosStarting: "Starting WebDriverAgent\u2026",
    iosBuilding: "Building WebDriverAgent\u2026",
    iosReady: "Connected",
    iosFailed: "Cannot start the iOS mirror",
    iosStop: "Stop mirror",
    menuShutdown: "Shutdown",
    menuStart: "Start",
    menuStartingBtn: "Starting",
    menuStop: "Stop emulator",
    menuOpenMirror: "Open mirror",
    menuOpenSimulator: "Open Simulator",
    menuWifiPlaceholder: "192.168.1.102:5555",
    menuConnect: "Connect",
    menuConnecting: "Connecting",
    menuRefresh: "Refresh devices",
    menuAll: "All",
    menuCollapse: "Collapse",
    menuEmpty: "No simulator available",
    menuEmptyHint: "Connect a wireless ADB device, or install an Android AVD.",
    menuIosUnsupported: "Simulator opened; the iOS mirror is not supported yet.",
    menuJustStarted: "just started",
    menuMinutes: "min",
    menuSeconds: "s",
    menuHours: "h",
    menuDeviceUnit: "devices",
    menuItemUnit: "AVDs",
    menuStartingWait: "The emulator is starting; open the mirror once it is ready.",
    menuStopRequested: "Stop requested",
    menuOnline: "online",
    menuNoDevice: "No device online. Click to start an emulator.",
    railBack: "Back",
    railHome: "Home",
    railRecents: "Recents",
    railText: "Text",
    railLink: "Link",
    railFile: "File",
    railHistory: "Screenshot history",
    railCapture: "Screenshot",
    railCopyPage: "Copy page address",
    copyPageDone: "Page address copied",
    copyPageEmpty: "No page address found",
    copyPageDenied: "The clipboard is not available",
    copyPageFailed: "Copy failed: {error}",
    railRefresh: "Reconnect",
    railClose: "Close"
  }
};

// src/client/i18n.js
function currentCopy(ctx) {
  const active = ctx.locale?.getLocale?.().active || "en";
  return String(active).toLowerCase().startsWith("zh") ? COPY.zh : COPY.en;
}
function useCopy(ctx) {
  const [copy, setCopy] = (0, import_react.useState)(() => currentCopy(ctx));
  (0, import_react.useEffect)(() => {
    if (!ctx.locale?.subscribe) return void 0;
    return ctx.locale.subscribe(() => setCopy(currentCopy(ctx)));
  }, [ctx]);
  return copy;
}

// src/client/store.js
var import_react2 = require("react");
function normalizeLinks(value) {
  if (!Array.isArray(value)) return [];
  const links = [];
  for (const item of value) {
    const url = typeof item?.url === "string" ? item.url.trim() : "";
    if (!url || links.some((entry) => entry.url === url)) continue;
    links.push({
      url,
      pinned: Boolean(item.pinned),
      at: Number.isFinite(item.at) ? item.at : 0
    });
  }
  return links;
}
function trimLinks(links) {
  const next = [];
  let recent = 0;
  for (const link of links) {
    if (link.pinned) {
      next.push(link);
      continue;
    }
    recent += 1;
    if (recent <= LINK_LIMIT) next.push(link);
  }
  return next;
}
function loadStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      open: Boolean(parsed?.open),
      platform: parsed?.platform === "ios" ? "ios" : "android",
      iosKind: parsed?.iosKind === "simulator" ? "simulator" : "device",
      serial: typeof parsed?.serial === "string" ? parsed.serial : "",
      offset: {
        x: Number.isFinite(parsed?.offset?.x) ? parsed.offset.x : 0,
        y: Number.isFinite(parsed?.offset?.y) ? parsed.offset.y : 0
      },
      links: trimLinks(normalizeLinks(parsed?.links))
    };
  } catch {
    return { open: false, platform: "android", iosKind: "device", serial: "", offset: { x: 0, y: 0 }, links: [] };
  }
}
var shared = loadStore();
var openListeners = /* @__PURE__ */ new Set();
function saveStore() {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(shared));
  } catch {
  }
}
function setSharedOpen(next) {
  if (shared.open === next) return;
  shared.open = next;
  saveStore();
  for (const listener of openListeners) listener();
}
function notifyStore() {
  for (const listener of openListeners) listener();
}
function subscribeStore(listener) {
  openListeners.add(listener);
  return () => openListeners.delete(listener);
}
function useSharedOpen() {
  return (0, import_react2.useSyncExternalStore)(subscribeStore, () => shared.open);
}
function useSharedPlatform() {
  return (0, import_react2.useSyncExternalStore)(subscribeStore, () => shared.platform);
}
function useSharedLinks() {
  return (0, import_react2.useSyncExternalStore)(subscribeStore, () => shared.links);
}
var shotVersion = 0;
function bumpShotVersion() {
  shotVersion += 1;
  notifyStore();
}
function useShotVersion() {
  return (0, import_react2.useSyncExternalStore)(subscribeStore, () => shotVersion);
}
function rememberLink(url) {
  const value = String(url || "").trim();
  if (!value) return;
  const previous = shared.links.find((item) => item.url === value);
  shared.links = trimLinks([
    { url: value, pinned: Boolean(previous?.pinned), at: Date.now() },
    ...shared.links.filter((item) => item.url !== value)
  ]);
  saveStore();
  notifyStore();
}
function toggleLinkPin(url) {
  const target = shared.links.find((item) => item.url === url);
  if (!target) return;
  target.pinned = !target.pinned;
  shared.links = [...shared.links];
  saveStore();
  notifyStore();
}
function removeLink(url) {
  const next = shared.links.filter((item) => item.url !== url);
  if (next.length === shared.links.length) return;
  shared.links = next;
  saveStore();
  notifyStore();
}

// src/client/ui.js
var import_react3 = require("react");
function concatBytes(left, right) {
  if (left.length === 0) return right;
  const out = new Uint8Array(left.length + right.length);
  out.set(left, 0);
  out.set(right, left.length);
  return out;
}
function avcCodecString(data) {
  let nal = -1;
  for (let index = 0; index + 3 < data.length; index += 1) {
    if (data[index] !== 0 || data[index + 1] !== 0) continue;
    if (data[index + 2] === 1) {
      nal = index + 3;
      break;
    }
    if (data[index + 2] === 0 && data[index + 3] === 1) {
      nal = index + 4;
      break;
    }
  }
  if (nal < 0 || nal + 3 >= data.length) return "avc1.42E01E";
  const hex = (value) => Number(value || 0).toString(16).toUpperCase().padStart(2, "0");
  return `avc1.${hex(data[nal + 1])}${hex(data[nal + 2])}${hex(data[nal + 3])}`;
}
function statusLabel(t, status) {
  if (status === "live") return t.live;
  if (status === "connecting") return t.connecting;
  return t.offline;
}
function Icon({ name, size = 15 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    style: { display: "block" }
  };
  switch (name) {
    case "phone":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("rect", { x: 6, y: 2.5, width: 12, height: 19, rx: 2.6 }), (0, import_react3.createElement)("path", { d: "M10 5.5h4" }), (0, import_react3.createElement)("circle", { cx: 12, cy: 18.4, r: 0.7, fill: "currentColor", stroke: "none" }));
    case "camera":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M3 8.5h3.2l1.4-2h8.8l1.4 2H21v11H3z" }), (0, import_react3.createElement)("circle", { cx: 12, cy: 13.5, r: 3.4 }));
    case "refresh":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M20 11a8 8 0 1 0-2.3 6.1" }), (0, import_react3.createElement)("path", { d: "M20 4v7h-7" }));
    case "history":
      return (0, import_react3.createElement)(
        "svg",
        common,
        (0, import_react3.createElement)("path", { d: "M18 22H4a2 2 0 0 1-2-2V6" }),
        (0, import_react3.createElement)("path", { d: "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" }),
        (0, import_react3.createElement)("circle", { cx: 12, cy: 8, r: 2 }),
        (0, import_react3.createElement)("rect", { x: 6, y: 2, width: 16, height: 16, rx: 2 })
      );
    case "close":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M6 6l12 12M18 6 6 18" }));
    case "minimize":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M5 12h14" }));
    case "back":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M15 5l-7 7 7 7" }));
    case "home":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M4 11 12 4l8 7" }), (0, import_react3.createElement)("path", { d: "M6.5 10v9.5h11V10" }));
    case "recents":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("rect", { x: 8, y: 3.5, width: 12.5, height: 12.5, rx: 2.2 }), (0, import_react3.createElement)("rect", { x: 3.5, y: 8, width: 12.5, height: 12.5, rx: 2.2 }));
    case "keyboard":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("rect", { x: 2.5, y: 6, width: 19, height: 12, rx: 2.2 }), (0, import_react3.createElement)("path", { d: "M6 10h1M10 10h1M14 10h1M18 10h.5M7 14h10" }));
    case "globe":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("circle", { cx: 12, cy: 12, r: 9 }), (0, import_react3.createElement)("path", { d: "M3 12h18" }), (0, import_react3.createElement)("ellipse", { cx: 12, cy: 12, rx: 4.5, ry: 9 }));
    case "pin":
      return (0, import_react3.createElement)(
        "svg",
        common,
        (0, import_react3.createElement)("path", { d: "M9 10.76a2 2 0 0 1-1.11-1.79L7 4h10l-.89 4.97A2 2 0 0 1 15 10.76V12l2 2H7l2-2z" }),
        (0, import_react3.createElement)("path", { d: "M12 14v7" })
      );
    case "copy":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("rect", { x: 9, y: 9, width: 11, height: 11, rx: 2 }), (0, import_react3.createElement)("path", { d: "M5 15V6a2 2 0 0 1 2-2h8" }));
    case "paperclip":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }));
    case "chevron":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M6 9l6 6 6-6" }));
    case "alert":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M12 3 2.5 20h19z" }), (0, import_react3.createElement)("path", { d: "M12 9v5M12 17.2v.1" }));
    case "android":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M7 9h10v7.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 16.5z" }), (0, import_react3.createElement)("path", { d: "M9 9 7.5 5.5M15 9l1.5-3.5" }), (0, import_react3.createElement)("path", { d: "M5 10.5v5M19 10.5v5" }));
    case "monitorplay":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("rect", { x: 3, y: 4, width: 18, height: 13, rx: 2 }), (0, import_react3.createElement)("path", { d: "M10 8.5l5 2.5-5 2.5z" }), (0, import_react3.createElement)("path", { d: "M12 17v3M9 20h6" }));
    case "power":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M12 3v8" }), (0, import_react3.createElement)("path", { d: "M6.7 6.7a8 8 0 1 0 10.6 0" }));
    case "wifi":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M3.5 9.5a13 13 0 0 1 17 0" }), (0, import_react3.createElement)("path", { d: "M6.5 13a8.5 8.5 0 0 1 11 0" }), (0, import_react3.createElement)("path", { d: "M9.5 16.5a4 4 0 0 1 5 0" }), (0, import_react3.createElement)("circle", { cx: 12, cy: 19.5, r: 0.7, fill: "currentColor", stroke: "none" }));
    case "play":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M8 5.5l10 6.5-10 6.5z" }));
    case "external":
      return (0, import_react3.createElement)("svg", common, (0, import_react3.createElement)("path", { d: "M14 4h6v6" }), (0, import_react3.createElement)("path", { d: "M20 4 11 13" }), (0, import_react3.createElement)("path", { d: "M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" }));
    default:
      return null;
  }
}
function LinkHistory({ t, onPick, onTogglePin, onRemove }) {
  const links = useSharedLinks();
  if (links.length === 0) return (0, import_react3.createElement)("div", { className: "dd-link-empty" }, t.linkEmpty);
  const ordered = [...links].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at);
  return (0, import_react3.createElement)(
    "div",
    { className: "dd-link-history" },
    (0, import_react3.createElement)("div", { className: "dd-link-history-title" }, t.linkHistory),
    ordered.map((link) => (0, import_react3.createElement)(
      "div",
      {
        className: "dd-link-row",
        key: link.url,
        "data-pinned": link.pinned ? "true" : "false"
      },
      (0, import_react3.createElement)("button", {
        type: "button",
        className: "dd-link-pick",
        title: link.url,
        onClick: () => onPick(link.url)
      }, (0, import_react3.createElement)("span", { className: "dd-link-url" }, link.url)),
      (0, import_react3.createElement)("button", {
        type: "button",
        className: "dd-link-icon dd-link-pin",
        title: link.pinned ? t.linkUnpin : t.linkPin,
        "aria-label": link.pinned ? t.linkUnpin : t.linkPin,
        "data-pinned": link.pinned ? "true" : "false",
        onClick: () => onTogglePin(link.url)
      }, (0, import_react3.createElement)(Icon, { name: "pin", size: 11 })),
      (0, import_react3.createElement)("button", {
        type: "button",
        className: "dd-link-icon dd-link-remove",
        title: t.linkRemove,
        "aria-label": t.linkRemove,
        onClick: () => onRemove(link.url)
      }, (0, import_react3.createElement)(Icon, { name: "close", size: 10 }))
    ))
  );
}
function LauncherIcon({ size = 16 }) {
  return (0, import_react3.createElement)(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, style: { display: "block" } },
    (0, import_react3.createElement)("rect", { x: 6.5, y: 2.5, width: 11, height: 19, rx: 2.5 }),
    (0, import_react3.createElement)("path", { d: "M10.5 5.5h3" }),
    (0, import_react3.createElement)("circle", { cx: 12, cy: 18.2, r: 0.6, fill: "currentColor", stroke: "none" })
  );
}
function formatDuration(seconds, t) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (total < 60) return t.menuJustStarted;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes} ${t.menuMinutes} ${total % 60} ${t.menuSeconds}`;
  return `${Math.floor(minutes / 60)} ${t.menuHours} ${minutes % 60} ${t.menuMinutes}`;
}

// src/client/android.js
function Panel({ ctx, onClose }) {
  const t = useCopy(ctx);
  const [devices, setDevices] = (0, import_react4.useState)([]);
  const [adb, setAdb] = (0, import_react4.useState)(null);
  const [loadingDevices, setLoadingDevices] = (0, import_react4.useState)(true);
  const [serial, setSerial] = (0, import_react4.useState)(shared.serial || "");
  const [status, setStatus] = (0, import_react4.useState)("connecting");
  const [error, setError] = (0, import_react4.useState)("");
  const [videoSize, setVideoSize] = (0, import_react4.useState)({ width: 1080, height: 2400 });
  const [shots, setShots] = (0, import_react4.useState)([]);
  const shotVersion2 = useShotVersion();
  const [stripOpen, setStripOpen] = (0, import_react4.useState)(false);
  const [previewShot, setPreviewShot] = (0, import_react4.useState)(null);
  const [inputOpen, setInputOpen] = (0, import_react4.useState)(false);
  const [linkOpen, setLinkOpen] = (0, import_react4.useState)(false);
  const [text, setText] = (0, import_react4.useState)("");
  const [url, setUrl] = (0, import_react4.useState)("");
  const [notice, setNotice] = (0, import_react4.useState)("");
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [pushing, setPushing] = (0, import_react4.useState)(false);
  const [nonce, setNonce] = (0, import_react4.useState)(0);
  const [offset, setOffset] = (0, import_react4.useState)(shared.offset || { x: 0, y: 0 });
  const [switcherOpen, setSwitcherOpen] = (0, import_react4.useState)(false);
  const [ripple, setRipple] = (0, import_react4.useState)(null);
  const [railTip, setRailTip] = (0, import_react4.useState)(null);
  const [frameWidth, setFrameWidth] = (0, import_react4.useState)(360);
  const canvasRef = (0, import_react4.useRef)(null);
  const viewportRef = (0, import_react4.useRef)(null);
  const ctx2dRef = (0, import_react4.useRef)(null);
  const pointerRef = (0, import_react4.useRef)(null);
  const retryRef = (0, import_react4.useRef)(0);
  const dragRef = (0, import_react4.useRef)(null);
  const menuRef = (0, import_react4.useRef)(null);
  const fileInputRef = (0, import_react4.useRef)(null);
  const frameRef = (0, import_react4.useRef)(null);
  const linkInputRef = (0, import_react4.useRef)(null);
  const device = devices.find((item) => item.serial === serial);
  const deviceName = device?.model || (serial ? serial : "Android");
  const onlineDevices = devices.filter((item) => item.state === "device");
  const flash = (0, import_react4.useCallback)((message) => {
    setNotice(message);
  }, []);
  (0, import_react4.useEffect)(() => {
    if (!notice || pushing) return void 0;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice, pushing]);
  (0, import_react4.useEffect)(() => {
    if (!serial) return;
    shared.serial = serial;
    saveStore();
  }, [serial]);
  (0, import_react4.useEffect)(() => {
    retryRef.current = 0;
    setPreviewShot(null);
  }, [serial]);
  const refreshDevices = (0, import_react4.useCallback)(async () => {
    try {
      const data = await apiJson("/devices");
      setAdb(data.adb || null);
      const list = Array.isArray(data.devices) ? data.devices : [];
      setDevices(list);
      setSerial((previous) => {
        const online = list.filter((item) => item.state === "device");
        if (previous && online.some((item) => item.serial === previous)) return previous;
        return online[0]?.serial || "";
      });
    } catch (fetchError) {
      setAdb({ available: false, error: fetchError.message });
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, []);
  (0, import_react4.useEffect)(() => {
    void refreshDevices();
    const timer = window.setInterval(() => void refreshDevices(), 1e4);
    return () => window.clearInterval(timer);
  }, [refreshDevices]);
  (0, import_react4.useLayoutEffect)(() => {
    const frame = frameRef.current;
    if (!frame) return void 0;
    const measure = () => {
      const height = frame.clientHeight;
      if (height <= 0) return;
      const usable = height - HEADER_HEIGHT - (stripOpen ? STRIP_HEIGHT : 0);
      if (usable <= 0) return;
      const aspect = videoSize.width / Math.max(1, videoSize.height);
      const maxWidth = Math.max(260, Math.min(520, window.innerWidth - 80));
      const next = Math.max(260, Math.min(maxWidth, Math.round(usable * aspect)));
      setFrameWidth((previous) => Math.abs(previous - next) <= 1 ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [videoSize.width, videoSize.height, stripOpen]);
  const refreshShots = (0, import_react4.useCallback)(async () => {
    if (!serial) {
      setShots([]);
      return;
    }
    try {
      const data = await apiJson(`/screenshots?serial=${encodeURIComponent(serial)}`);
      setShots(Array.isArray(data.items) ? data.items : []);
    } catch {
    }
  }, [serial]);
  (0, import_react4.useEffect)(() => {
    void refreshShots();
  }, [refreshShots, shotVersion2]);
  (0, import_react4.useEffect)(() => {
    if (shots.length === 0) {
      setStripOpen(false);
      setRailTip(null);
      setPreviewShot(null);
    }
  }, [shots.length]);
  (0, import_react4.useEffect)(() => {
    if (!switcherOpen) return void 0;
    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setSwitcherOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [switcherOpen]);
  (0, import_react4.useEffect)(() => {
    if (!serial) {
      setStatus("offline");
      setError("");
      return void 0;
    }
    if (typeof VideoDecoder === "undefined") {
      setStatus("error");
      setError("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 WebCodecs \u89C6\u9891\u89E3\u7801\u3002");
      return void 0;
    }
    const controller = new AbortController();
    let cancelled = false;
    let decoder = null;
    let configured = false;
    let pendingConfig = null;
    let firstFrame = false;
    let timestamp = 0;
    let metaSize = null;
    let retryResetTimer = null;
    const watchdog = window.setTimeout(() => {
      if (cancelled || firstFrame) return;
      setStatus("error");
      setError("\u957F\u65F6\u95F4\u672A\u6536\u5230\u753B\u9762\u6570\u636E\u3002\u8BF7\u786E\u8BA4\u8BBE\u5907\u5728\u7EBF\u3002");
      controller.abort();
    }, 12e3);
    setStatus("connecting");
    setError("");
    const ensureDecoder = (codec, width, height) => {
      if (decoder !== null) return decoder;
      decoder = new VideoDecoder({
        output: (frame) => {
          if (cancelled) {
            frame.close();
            return;
          }
          const canvas = canvasRef.current;
          if (!canvas) {
            frame.close();
            return;
          }
          if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
            canvas.width = frame.displayWidth;
            canvas.height = frame.displayHeight;
          }
          try {
            if (!ctx2dRef.current) {
              ctx2dRef.current = canvas.getContext("2d", { alpha: false, desynchronized: true });
            }
            ctx2dRef.current.drawImage(frame, 0, 0);
          } finally {
            frame.close();
          }
          if (!firstFrame) {
            firstFrame = true;
            window.clearTimeout(watchdog);
            retryResetTimer = window.setTimeout(() => {
              if (!cancelled) retryRef.current = 0;
            }, 1e4);
            setStatus("live");
            setError("");
            if (width && height && (width !== videoSize.width || height !== videoSize.height)) {
              setVideoSize({ width, height });
            }
          }
        },
        error: (decodeError) => {
          if (cancelled) return;
          setStatus("error");
          setError(`\u89E3\u7801\u5931\u8D25\uFF1A${decodeError.message}`);
        }
      });
      return decoder;
    };
    const handleFrame = (type, flags, payload) => {
      if (cancelled) return;
      if (type === T_META) {
        try {
          const meta = JSON.parse(new TextDecoder().decode(payload));
          if (meta.width && meta.height) {
            metaSize = { width: meta.width, height: meta.height };
            setVideoSize({ width: meta.width, height: meta.height });
          }
          if (meta.codec !== "h264") {
            setStatus("error");
            setError(`\u6682\u4E0D\u652F\u6301 ${String(meta.codec).toUpperCase()} \u89C6\u9891\u7F16\u7801\u3002`);
            controller.abort();
          }
        } catch {
        }
        return;
      }
      if (type === T_CONFIG) {
        pendingConfig = payload.slice();
        try {
          const codec = avcCodecString(payload);
          const instance = ensureDecoder(codec, metaSize?.width, metaSize?.height);
          instance.configure({
            codec,
            optimizeForLatency: true,
            hardwareAcceleration: "no-preference"
          });
          configured = true;
        } catch (configureError) {
          setStatus("error");
          setError(`\u89E3\u7801\u5668\u521D\u59CB\u5316\u5931\u8D25\uFF1A${configureError.message}`);
        }
        return;
      }
      if (type === T_DATA) {
        if (decoder === null || !configured) return;
        try {
          let data = payload;
          if (pendingConfig !== null) {
            data = concatBytes(pendingConfig, payload);
            pendingConfig = null;
          }
          timestamp += 1e3;
          decoder.decode(new EncodedVideoChunk({
            type: (flags & 1) !== 0 ? "key" : "delta",
            timestamp,
            data
          }));
        } catch {
        }
        return;
      }
      if (type === T_ERROR) {
        try {
          const info = JSON.parse(new TextDecoder().decode(payload));
          setStatus("error");
          setError(info?.message || t.streamError);
        } catch {
          setStatus("error");
          setError(t.streamError);
        }
        controller.abort();
        return;
      }
      if (type === T_END) {
        setStatus((previous) => previous === "live" ? "offline" : previous);
      }
    };
    const readStream = async () => {
      try {
        const response = await fetch(
          `${API}/stream?serial=${encodeURIComponent(serial)}&_=${Date.now()}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        let buffer = new Uint8Array(0);
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer = concatBytes(buffer, value);
          let offsetInBuffer = 0;
          while (buffer.length - offsetInBuffer >= 6) {
            const type = buffer[offsetInBuffer];
            const flags = buffer[offsetInBuffer + 1];
            const length = buffer[offsetInBuffer + 2] << 24 | buffer[offsetInBuffer + 3] << 16 | buffer[offsetInBuffer + 4] << 8 | buffer[offsetInBuffer + 5];
            if (buffer.length - offsetInBuffer - 6 < length) break;
            const payload = buffer.slice(offsetInBuffer + 6, offsetInBuffer + 6 + length);
            handleFrame(type, flags, payload);
            offsetInBuffer += 6 + length;
          }
          buffer = offsetInBuffer > 0 ? buffer.slice(offsetInBuffer) : buffer;
        }
        if (!cancelled) {
          const wasLive = firstFrame;
          setStatus((previous) => previous === "live" ? "offline" : "error");
          setError(wasLive ? t.disconnected : t.streamError);
          if (wasLive && retryRef.current < 3) {
            retryRef.current += 1;
            window.setTimeout(() => {
              if (!cancelled) setNonce((value) => value + 1);
            }, 1200 * retryRef.current);
          }
        }
      } catch (streamError) {
        if (cancelled || controller.signal.aborted) return;
        setStatus("error");
        setError(streamError?.message || t.streamError);
        if (retryRef.current < 3) {
          retryRef.current += 1;
          window.setTimeout(() => {
            if (!cancelled) setNonce((value) => value + 1);
          }, 1200 * retryRef.current);
        }
      }
    };
    void readStream();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(watchdog);
      if (retryResetTimer) window.clearTimeout(retryResetTimer);
      if (decoder !== null && decoder.state !== "closed") {
        try {
          decoder.close();
        } catch {
        }
      }
      decoder = null;
      ctx2dRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [serial, nonce]);
  const ratioFromEvent = (0, import_react4.useCallback)((clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const aspect = videoSize.width / videoSize.height;
    let width = rect.width;
    let height = rect.height;
    if (width / height > aspect) width = height * aspect;
    else height = width / aspect;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      inside: x >= 0 && x <= 1 && y >= 0 && y <= 1,
      left,
      top,
      width,
      height
    };
  }, [videoSize]);
  const runAction = (0, import_react4.useCallback)(async (action) => {
    if (!serial) return false;
    setBusy(true);
    try {
      await postJson("/action", {
        serial,
        action: { ...action, frameWidth: videoSize.width, frameHeight: videoSize.height }
      });
      return true;
    } catch (actionError) {
      flash(actionError.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [serial, busy, videoSize, flash]);
  const wheelRef = (0, import_react4.useRef)({ timer: 0, dx: 0, dy: 0, x: 0.5, y: 0.5, busy: false });
  const flushWheel = (0, import_react4.useCallback)(() => {
    const pending = wheelRef.current;
    if (pending.busy) return;
    const dx = pending.dx;
    const dy = pending.dy;
    pending.dx = 0;
    pending.dy = 0;
    if (!dx && !dy || !serial) return;
    pending.busy = true;
    void postJson("/action", {
      serial,
      action: {
        type: "scroll",
        ratioX: pending.x,
        ratioY: pending.y,
        scrollX: Math.max(-160, Math.min(160, dx * 0.16)),
        scrollY: Math.max(-160, Math.min(160, -dy * 0.16)),
        frameWidth: videoSize.width,
        frameHeight: videoSize.height
      }
    }).catch(() => void 0).finally(() => {
      pending.busy = false;
      if ((pending.dx || pending.dy) && !pending.timer) {
        pending.timer = window.setTimeout(() => {
          pending.timer = 0;
          flushWheel();
        }, 32);
      }
    });
  }, [serial, videoSize]);
  const handleWheel = (0, import_react4.useCallback)((event) => {
    if (status !== "live" || !serial) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    const pending = wheelRef.current;
    pending.dx += event.deltaX * unit;
    pending.dy += event.deltaY * unit;
    pending.x = ratio.x;
    pending.y = ratio.y;
    if (pending.timer) return;
    pending.timer = window.setTimeout(() => {
      pending.timer = 0;
      flushWheel();
    }, 32);
  }, [status, serial, flushWheel, ratioFromEvent]);
  const wheelHandlerRef = (0, import_react4.useRef)(handleWheel);
  wheelHandlerRef.current = handleWheel;
  (0, import_react4.useEffect)(() => {
    const viewport = viewportRef.current;
    if (!viewport) return void 0;
    const listener = (event) => wheelHandlerRef.current(event);
    viewport.addEventListener("wheel", listener, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", listener);
      const pending = wheelRef.current;
      if (pending.timer) window.clearTimeout(pending.timer);
      pending.timer = 0;
      pending.dx = 0;
      pending.dy = 0;
    };
  }, []);
  const handlePointerDown = (event) => {
    if (status !== "live" || event.button === 2) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerRef.current = {
      x: ratio.x,
      y: ratio.y,
      clientX: event.clientX,
      clientY: event.clientY,
      time: Date.now()
    };
  };
  const handlePointerUp = (event) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start || status !== "live") return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio) return;
    const dx = event.clientX - start.clientX;
    const dy = event.clientY - start.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - start.time;
    if (distance < 12 && duration < 400) {
      const viewport = viewportRef.current;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        const id = Date.now();
        setRipple({ left: event.clientX - rect.left, top: event.clientY - rect.top, id });
        window.setTimeout(() => setRipple((current) => current?.id === id ? null : current), 280);
      }
      void runAction({ type: "tap", ratioX: ratio.x, ratioY: ratio.y });
      return;
    }
    void runAction({
      type: "swipe",
      ratioX: start.x,
      ratioY: start.y,
      ratioEndX: ratio.x,
      ratioEndY: ratio.y,
      duration: Math.max(120, Math.min(1e3, duration))
    });
  };
  const capture = (0, import_react4.useCallback)(async () => {
    if (!serial || busy) return;
    setBusy(true);
    try {
      const data = await postJson("/screenshot", { serial });
      setShots((previous) => [data.shot, ...previous.map((item) => ({ ...item, selected: false }))]);
      setStripOpen(true);
      flash(t.shotSaved);
    } catch (captureError) {
      flash(captureError.message);
    } finally {
      setBusy(false);
    }
  }, [serial, busy, flash, t]);
  const copyPageAddress = (0, import_react4.useCallback)(async () => {
    if (!serial) return;
    try {
      const data = await apiJson(`/page-address?serial=${encodeURIComponent(serial)}`);
      const address = String(data?.address || "").trim();
      if (!address) throw new Error(t.copyPageEmpty);
      try {
        await postJson("/clipboard", { text: address });
      } catch (hostError) {
        if (/HTTP 404/.test(hostError.message)) throw hostError;
        await copyText(address, t.copyPageDenied);
      }
      flash(t.copyPageDone);
    } catch (copyError) {
      flash(t.copyPageFailed.replace("{error}", copyError.message));
    }
  }, [serial, flash, t]);
  const pushFile = (0, import_react4.useCallback)(async (file) => {
    if (!file || !serial || pushing) return;
    setPushing(true);
    flash(t.fileSending.replace("{name}", file.name));
    try {
      const response = await fetch(`${API}/file-push?serial=${encodeURIComponent(serial)}&name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
        cache: "no-store"
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || `HTTP ${response.status}`);
      flash(t.fileSent.replace("{path}", data.path || file.name));
    } catch (error2) {
      flash(t.fileFailed.replace("{error}", error2.message));
    } finally {
      setPushing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [serial, pushing, flash, t]);
  const selectShot = (0, import_react4.useCallback)(async (shot) => {
    if (!shot) return;
    setPreviewShot(shot);
    if (shot.selected) return;
    try {
      await postJson("/screenshots/select", { path: shot.path });
      setShots((previous) => previous.map((item) => ({ ...item, selected: item.path === shot.path })));
    } catch (selectError) {
      flash(selectError.message);
    }
  }, [flash]);
  const copyPreview = (0, import_react4.useCallback)(async () => {
    if (!previewShot) return;
    try {
      await copyShotImage(previewShot.path);
      flash(t.copyShotDone);
    } catch (copyError) {
      flash(t.copyShotFailed.replace("{error}", copyError.message));
    }
  }, [previewShot, flash, t]);
  const sendText = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setInputOpen(false);
    const sent = await runAction({ type: "text", text: value });
    if (sent) setText((current) => current === value ? "" : current);
  };
  const openUrl = async () => {
    const value = url.trim();
    if (!value || busy) return;
    const opened = await runAction({ type: "openUrl", url: value });
    if (!opened) return;
    rememberLink(value);
    setUrl("");
    setLinkOpen(false);
  };
  const pickLink = (value) => {
    setUrl(value);
    linkInputRef.current?.focus();
  };
  const startDrag = (event) => {
    if (event.target.closest?.("button") || event.target.closest?.("input") || event.target.closest?.("textarea")) return;
    dragRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: offset.x,
      y: offset.y
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nextX = Math.max(-width + 120, Math.min(width - 120, drag.x + event.clientX - drag.clientX));
    const nextY = Math.max(-80, Math.min(height - 120, drag.y + event.clientY - drag.clientY));
    setOffset({ x: nextX, y: nextY });
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    shared.offset = offset;
    saveStore();
  };
  const showRailTip = (label, element) => {
    const rect = element.getBoundingClientRect();
    setRailTip({
      label,
      top: Math.round(rect.top + rect.height / 2),
      right: Math.max(8, Math.round(window.innerWidth - rect.left + 8))
    });
  };
  const railButton = (label, icon, action, options = {}) => (0, import_react4.createElement)("button", {
    type: "button",
    "aria-label": label,
    "aria-disabled": options.disabled ? "true" : "false",
    "data-disabled": options.disabled && !options.locked ? "true" : "false",
    "data-locked": options.locked ? "true" : "false",
    "data-active": options.active ? "true" : "false",
    onMouseEnter: (event) => showRailTip(label, event.currentTarget),
    onMouseLeave: () => setRailTip(null),
    onFocus: (event) => showRailTip(label, event.currentTarget),
    onBlur: () => setRailTip(null),
    onClick: () => {
      if (options.disabled) return;
      setRailTip(null);
      action();
    }
  }, (0, import_react4.createElement)(Icon, { name: icon, size: 14 }));
  const statusText = statusLabel(t, status);
  const offline = status === "error" || status === "offline";
  const isCompact = frameWidth < 330;
  return (0, import_react4.createElement)(
    "div",
    {
      className: "dd-panel",
      style: { transform: `translate(${offset.x}px, ${offset.y}px)` },
      role: "dialog",
      "aria-label": t.title
    },
    (0, import_react4.createElement)(
      "div",
      {
        ref: frameRef,
        className: "dd-frame",
        style: {
          width: `${frameWidth}px`,
          ...stripOpen ? { height: `calc(min(70vh, 840px) + ${STRIP_HEIGHT}px)` } : {}
        }
      },
      (0, import_react4.createElement)(
        "div",
        {
          className: "dd-head",
          onPointerDown: startDrag,
          onPointerMove: moveDrag,
          onPointerUp: endDrag,
          onPointerCancel: endDrag
        },
        (0, import_react4.createElement)(
          "div",
          { className: "dd-head-left" },
          (0, import_react4.createElement)(
            "div",
            { ref: menuRef, style: { position: "relative" } },
            (0, import_react4.createElement)(
              "button",
              {
                type: "button",
                className: "dd-device",
                title: t.switchDevice,
                "data-open": switcherOpen ? "true" : "false",
                onClick: () => setSwitcherOpen((value) => !value)
              },
              (0, import_react4.createElement)(Icon, { name: "phone", size: 13 }),
              (0, import_react4.createElement)("span", { className: "dd-device-name", style: { maxWidth: isCompact ? 150 : 240 } }, deviceName),
              (0, import_react4.createElement)(Icon, { name: "chevron", size: 10 })
            ),
            switcherOpen && (0, import_react4.createElement)(
              "div",
              { className: "dd-menu" },
              (0, import_react4.createElement)("div", { className: "dd-menu-title" }, t.switchDevice),
              devices.length === 0 ? (0, import_react4.createElement)("div", { style: { padding: "8px 7px", color: "#a1a1aa", fontSize: "11.5px" } }, t.noDevice) : devices.map((item) => (0, import_react4.createElement)(
                "button",
                {
                  key: item.serial,
                  type: "button",
                  className: "dd-menu-item",
                  "data-active": item.serial === serial ? "true" : "false",
                  disabled: item.state !== "device",
                  onClick: () => {
                    setSwitcherOpen(false);
                    if (item.state !== "device") return;
                    setSerial(item.serial);
                  }
                },
                (0, import_react4.createElement)(Icon, { name: "phone", size: 12 }),
                (0, import_react4.createElement)("span", null, item.model || item.serial),
                (0, import_react4.createElement)("em", null, item.state === "device" ? item.isEmulator ? "\u6A21\u62DF\u5668" : "" : item.state)
              ))
            )
          ),
          (0, import_react4.createElement)(
            "div",
            { className: "dd-head-right" },
            (0, import_react4.createElement)(
              "span",
              { className: "dd-status", "data-status": status, "data-compact": isCompact ? "true" : "false" },
              (0, import_react4.createElement)("span", { className: "dd-dot" }),
              !isCompact && (0, import_react4.createElement)("span", null, statusText)
            ),
            (0, import_react4.createElement)("button", {
              type: "button",
              className: "dd-head-refresh",
              title: t.railRefresh,
              "aria-label": t.railRefresh,
              onClick: () => {
                retryRef.current = 0;
                setNonce((value) => value + 1);
              }
            }, (0, import_react4.createElement)(Icon, { name: "refresh", size: 12 }))
          )
        )
      ),
      (0, import_react4.createElement)("input", {
        ref: fileInputRef,
        type: "file",
        style: { display: "none" },
        onChange: (event) => {
          const file = event.target.files?.[0];
          if (file) void pushFile(file);
        }
      }),
      (0, import_react4.createElement)(
        "div",
        { className: "dd-body" },
        (0, import_react4.createElement)(
          "div",
          { className: "dd-rail" },
          railButton(t.railBack, "back", () => void runAction({ type: "key", key: "back" }), { disabled: !serial || busy, locked: busy }),
          railButton(t.railHome, "home", () => void runAction({ type: "key", key: "home" }), { disabled: !serial || busy, locked: busy }),
          railButton(t.railRecents, "recents", () => void runAction({ type: "key", key: "recents" }), { disabled: !serial || busy, locked: busy }),
          railButton(t.railText, "keyboard", () => {
            setInputOpen((value) => !value);
            setLinkOpen(false);
          }, { disabled: !serial, active: inputOpen }),
          railButton(t.railLink, "globe", () => {
            setLinkOpen((value) => !value);
            setInputOpen(false);
          }, { disabled: !serial, active: linkOpen }),
          railButton(t.railFile, "paperclip", () => fileInputRef.current?.click(), { disabled: !serial || pushing, locked: pushing }),
          railButton(t.railCopyPage, "copy", () => void copyPageAddress(), { disabled: !serial || busy, locked: busy }),
          (0, import_react4.createElement)("div", { className: "dd-rail-sep" }),
          shots.length > 0 && railButton(t.railHistory, "history", () => setStripOpen((value) => !value), { active: stripOpen }),
          railButton(t.railCapture, "camera", () => void capture(), { disabled: !serial || busy, locked: busy }),
          (0, import_react4.createElement)("div", { className: "dd-rail-sep" }),
          railButton(t.railClose, "minimize", onClose)
        ),
        (0, import_react4.createElement)(
          "div",
          {
            className: "dd-viewport",
            ref: viewportRef,
            style: { borderRadius: stripOpen ? 0 : "0 0 10px 10px" },
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
            onPointerCancel: () => {
              pointerRef.current = null;
            },
            onContextMenu: (event) => event.preventDefault()
          },
          (0, import_react4.createElement)("canvas", { className: "dd-canvas", ref: canvasRef }),
          ripple && (0, import_react4.createElement)("span", {
            className: "dd-ripple",
            style: { left: `${ripple.left}px`, top: `${ripple.top}px` }
          }),
          !serial && (0, import_react4.createElement)(
            "div",
            { className: "dd-overlay" },
            (0, import_react4.createElement)(Icon, { name: "alert", size: 20 }),
            (0, import_react4.createElement)("strong", null, adb?.available === false ? t.adbMissing : t.noDevice),
            (0, import_react4.createElement)("p", null, adb?.available === false ? adb.error || t.adbMissing : t.noDeviceHint),
            (0, import_react4.createElement)("button", {
              type: "button",
              className: "dd-btn",
              onClick: () => {
                setLoadingDevices(true);
                void refreshDevices();
              }
            }, (0, import_react4.createElement)(Icon, { name: "refresh", size: 12 }), t.refresh)
          ),
          serial && status === "connecting" && (0, import_react4.createElement)(
            "div",
            { className: "dd-overlay" },
            (0, import_react4.createElement)("span", { className: "dd-spinner" }),
            (0, import_react4.createElement)("span", null, t.connectingHint)
          ),
          serial && offline && (0, import_react4.createElement)(
            "div",
            { className: "dd-overlay" },
            (0, import_react4.createElement)(Icon, { name: "alert", size: 20 }),
            (0, import_react4.createElement)("strong", null, status === "offline" ? t.disconnected : t.streamError),
            (0, import_react4.createElement)("p", null, error || t.noDeviceHint),
            (0, import_react4.createElement)("button", {
              type: "button",
              className: "dd-btn",
              onClick: () => {
                retryRef.current = 0;
                setNonce((value) => value + 1);
              }
            }, (0, import_react4.createElement)(Icon, { name: "refresh", size: 12 }), t.retry)
          ),
          previewShot && (0, import_react4.createElement)(
            "div",
            {
              className: "dd-preview",
              onPointerDown: (event) => event.stopPropagation(),
              onPointerUp: (event) => event.stopPropagation(),
              onPointerCancel: (event) => event.stopPropagation()
            },
            (0, import_react4.createElement)("img", { src: shotUrl(previewShot.path), alt: previewShot.name, draggable: false }),
            (0, import_react4.createElement)(
              "div",
              { className: "dd-preview-actions" },
              (0, import_react4.createElement)("button", {
                type: "button",
                className: "dd-preview-copy",
                title: t.previewCopy,
                "aria-label": t.previewCopy,
                onClick: () => void copyPreview()
              }, (0, import_react4.createElement)(Icon, { name: "copy", size: 12 })),
              (0, import_react4.createElement)("button", {
                type: "button",
                className: "dd-preview-close",
                title: t.previewClose,
                "aria-label": t.previewClose,
                onClick: () => setPreviewShot(null)
              }, (0, import_react4.createElement)(Icon, { name: "close", size: 12 }))
            )
          )
        )
      ),
      stripOpen && (0, import_react4.createElement)(
        "div",
        { className: "dd-strip" },
        (0, import_react4.createElement)("span", { className: "dd-strip-label" }, t.screenshotStrip),
        shots.length === 0 ? (0, import_react4.createElement)("span", { style: { color: "#71717a", fontSize: "10.5px" } }, t.emptyShot) : shots.map((shot) => (0, import_react4.createElement)("button", {
          key: shot.path,
          type: "button",
          className: "dd-thumb",
          "data-selected": previewShot?.path === shot.path ? "true" : "false",
          title: previewShot?.path === shot.path ? t.selected : shot.name,
          onClick: () => void selectShot(shot)
        }, (0, import_react4.createElement)("img", { src: shotUrl(shot.path), alt: shot.name, draggable: false })))
      )
    ),
    inputOpen && (0, import_react4.createElement)(
      "div",
      { className: "dd-pop", style: { top: "46%" } },
      (0, import_react4.createElement)(
        "div",
        { className: "dd-pop-head" },
        (0, import_react4.createElement)("span", null, t.text),
        (0, import_react4.createElement)(
          "div",
          { className: "dd-pop-head-actions" },
          (0, import_react4.createElement)("kbd", { className: "dd-kbd" }, t.sendShortcut),
          (0, import_react4.createElement)("button", { type: "button", onClick: () => setInputOpen(false), title: t.close }, (0, import_react4.createElement)(Icon, { name: "close", size: 12 }))
        )
      ),
      (0, import_react4.createElement)("textarea", {
        "aria-keyshortcuts": "Meta+Enter Control+Enter",
        value: text,
        autoFocus: true,
        placeholder: t.enterText,
        onChange: (event) => setText(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void sendText();
          }
        }
      }),
      (0, import_react4.createElement)(
        "div",
        { className: "dd-pop-foot" },
        (0, import_react4.createElement)("span", { className: "dd-pop-hint" }, t.textHint),
        (0, import_react4.createElement)("button", { type: "button", className: "dd-send", disabled: !text.trim() || busy, onClick: () => void sendText() }, t.sendText)
      )
    ),
    linkOpen && (0, import_react4.createElement)(
      "div",
      { className: "dd-pop dd-pop-link", style: { top: "50%" } },
      (0, import_react4.createElement)(
        "div",
        { className: "dd-pop-head" },
        (0, import_react4.createElement)("span", null, t.link),
        (0, import_react4.createElement)("button", { type: "button", onClick: () => setLinkOpen(false), title: t.close }, (0, import_react4.createElement)(Icon, { name: "close", size: 12 }))
      ),
      (0, import_react4.createElement)("textarea", {
        ref: linkInputRef,
        className: "dd-pop-url",
        value: url,
        autoFocus: true,
        spellCheck: false,
        placeholder: t.urlHint,
        onChange: (event) => setUrl(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void openUrl();
          }
        }
      }),
      (0, import_react4.createElement)(LinkHistory, {
        t,
        onPick: pickLink,
        onTogglePin: toggleLinkPin,
        onRemove: removeLink
      }),
      (0, import_react4.createElement)(
        "div",
        { className: "dd-pop-foot" },
        (0, import_react4.createElement)("span", { className: "dd-pop-hint" }, t.enterUrl),
        (0, import_react4.createElement)("button", { type: "button", className: "dd-send", disabled: !url.trim() || busy, onClick: () => void openUrl() }, t.open)
      )
    ),
    notice && (0, import_react4.createElement)("div", { className: "dd-notice" }, notice),
    railTip && import_react_dom.default.createPortal(
      (0, import_react4.createElement)("div", {
        className: "dd-rail-tip",
        style: { top: `${railTip.top}px`, right: `${railTip.right}px` }
      }, railTip.label),
      document.body
    )
  );
}

// src/client/ios.js
var import_react5 = require("react");
var import_react_dom2 = __toESM(require("react-dom"), 1);
function IosPanel({ ctx, onClose }) {
  const t = useCopy(ctx);
  const [udid, setUdid] = (0, import_react5.useState)(shared.serial || "");
  const [kind, setKind] = (0, import_react5.useState)(shared.iosKind === "simulator" ? "simulator" : "device");
  const [devices, setDevices] = (0, import_react5.useState)([]);
  const [status, setStatus] = (0, import_react5.useState)("starting");
  const [error, setError] = (0, import_react5.useState)("");
  const [progress, setProgress] = (0, import_react5.useState)("");
  const [screen, setScreen] = (0, import_react5.useState)({ width: 390, height: 844 });
  const [nonce, setNonce] = (0, import_react5.useState)(0);
  const [offset, setOffset] = (0, import_react5.useState)(shared.offset || { x: 0, y: 0 });
  const [frameWidth, setFrameWidth] = (0, import_react5.useState)(320);
  const [shots, setShots] = (0, import_react5.useState)([]);
  const shotVersion2 = useShotVersion();
  const [stripOpen, setStripOpen] = (0, import_react5.useState)(false);
  const [previewShot, setPreviewShot] = (0, import_react5.useState)(null);
  const [inputOpen, setInputOpen] = (0, import_react5.useState)(false);
  const [text, setText] = (0, import_react5.useState)("");
  const [linkOpen, setLinkOpen] = (0, import_react5.useState)(false);
  const [url, setUrl] = (0, import_react5.useState)("");
  const [notice, setNotice] = (0, import_react5.useState)("");
  const [ripple, setRipple] = (0, import_react5.useState)(null);
  const [railTip, setRailTip] = (0, import_react5.useState)(null);
  const [switcherOpen, setSwitcherOpen] = (0, import_react5.useState)(false);
  const viewportRef = (0, import_react5.useRef)(null);
  const pointerRef = (0, import_react5.useRef)(null);
  const dragRef = (0, import_react5.useRef)(null);
  const menuRef = (0, import_react5.useRef)(null);
  const frameRef = (0, import_react5.useRef)(null);
  const linkInputRef = (0, import_react5.useRef)(null);
  const device = devices.find((item) => item.udid === udid);
  const deviceName = device?.name || udid || "iPhone";
  (0, import_react5.useEffect)(() => {
    if (!udid) return;
    shared.serial = udid;
    shared.platform = "ios";
    shared.iosKind = kind;
    saveStore();
  }, [udid, kind]);
  (0, import_react5.useEffect)(() => {
    setPreviewShot(null);
  }, [udid]);
  const refreshDevices = (0, import_react5.useCallback)(async () => {
    try {
      const data = await apiJson("/inventory");
      const physical = (data?.ios?.devices?.items || []).map((item) => ({
        udid: item.udid,
        name: item.name,
        detail: [item.model, item.osVersion ? `iOS ${item.osVersion}` : "", "\u771F\u673A"].filter(Boolean).join(" \xB7 "),
        kind: "device"
      }));
      const simulators = (data?.ios?.running || []).map((item) => ({
        udid: item.udid,
        name: item.name,
        detail: [item.version ? `iOS ${item.version}` : "", "\u6A21\u62DF\u5668"].filter(Boolean).join(" \xB7 "),
        kind: "simulator"
      }));
      setDevices([...physical, ...simulators]);
    } catch {
    }
  }, []);
  (0, import_react5.useEffect)(() => {
    void refreshDevices();
  }, [refreshDevices]);
  const refreshShots = (0, import_react5.useCallback)(async () => {
    if (!udid) {
      setShots([]);
      return;
    }
    try {
      const data = await apiJson(`/screenshots?serial=${encodeURIComponent(udid)}`);
      setShots(Array.isArray(data.items) ? data.items : []);
    } catch {
    }
  }, [udid]);
  (0, import_react5.useEffect)(() => {
    void refreshShots();
  }, [refreshShots, shotVersion2]);
  (0, import_react5.useEffect)(() => {
    if (!notice) return void 0;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);
  (0, import_react5.useEffect)(() => {
    const frame = frameRef.current;
    if (!frame) return void 0;
    const measure = () => {
      const height = frame.clientHeight;
      if (height <= 0) return;
      const usable = height - HEADER_HEIGHT - (stripOpen ? STRIP_HEIGHT : 0);
      if (usable <= 0) return;
      const aspect = screen.width / Math.max(1, screen.height);
      const maxWidth = Math.max(240, Math.min(520, window.innerWidth - 80));
      const next = Math.max(240, Math.min(maxWidth, Math.round(usable * aspect)));
      setFrameWidth((previous) => Math.abs(previous - next) <= 1 ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [screen.width, screen.height, stripOpen]);
  (0, import_react5.useEffect)(() => {
    if (!udid) return void 0;
    let cancelled = false;
    setStatus("starting");
    setError("");
    setProgress(t.iosPreparing);
    const poll = window.setInterval(() => {
      void apiJson(`/ios/mirror/status?udid=${encodeURIComponent(udid)}`).then((data) => {
        if (cancelled) return;
        if (data?.message) setProgress(data.message);
      }).catch(() => void 0);
    }, 1500);
    void postJson("/ios/mirror/start", { udid, kind }).then((data) => {
      if (cancelled) return;
      if (data?.screen?.width) setScreen({ width: data.screen.width, height: data.screen.height });
      setProgress("");
      setStatus("live");
    }).catch((startError) => {
      if (cancelled) return;
      setStatus("error");
      setError(startError.message);
    }).finally(() => window.clearInterval(poll));
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [udid, kind, nonce]);
  const ratioFromEvent = (clientX, clientY) => {
    const viewport = viewportRef.current;
    if (!viewport) return null;
    const rect = viewport.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(1, rect.width);
    const y = (clientY - rect.top) / Math.max(1, rect.height);
    return { x, y, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
  };
  const sendAction = (0, import_react5.useCallback)(async (action) => {
    if (!udid) return false;
    try {
      await postJson("/ios/action", { udid, kind, action });
      return true;
    } catch (actionError) {
      setNotice(actionError.message);
      return false;
    }
  }, [udid, kind]);
  const wheelRef = (0, import_react5.useRef)({ timer: 0, dy: 0, x: 0.5, y: 0.5, busy: false });
  const flushWheel = (0, import_react5.useCallback)(() => {
    const pending = wheelRef.current;
    if (pending.busy) return;
    const dy = pending.dy;
    pending.dy = 0;
    if (!dy || !udid) return;
    pending.busy = true;
    void postJson("/ios/action", {
      udid,
      kind,
      action: {
        type: "scroll",
        ratioX: pending.x,
        ratioY: pending.y,
        scrollY: Math.max(-48, Math.min(48, -dy * 0.16))
      }
    }).catch(() => void 0).finally(() => {
      pending.busy = false;
      if (pending.dy && !pending.timer) {
        pending.timer = window.setTimeout(() => {
          pending.timer = 0;
          flushWheel();
        }, 64);
      }
    });
  }, [udid, kind]);
  const handleWheel = (0, import_react5.useCallback)((event) => {
    if (status !== "live" || !udid) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    const pending = wheelRef.current;
    pending.dy += event.deltaY * unit;
    pending.x = ratio.x;
    pending.y = ratio.y;
    if (pending.timer) return;
    pending.timer = window.setTimeout(() => {
      pending.timer = 0;
      flushWheel();
    }, 160);
  }, [status, udid, flushWheel, ratioFromEvent]);
  const wheelHandlerRef = (0, import_react5.useRef)(handleWheel);
  wheelHandlerRef.current = handleWheel;
  (0, import_react5.useEffect)(() => {
    const viewport = viewportRef.current;
    if (!viewport) return void 0;
    const listener = (event) => wheelHandlerRef.current(event);
    viewport.addEventListener("wheel", listener, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", listener);
      const pending = wheelRef.current;
      if (pending.timer) window.clearTimeout(pending.timer);
      pending.timer = 0;
      pending.dy = 0;
    };
  }, []);
  const handlePointerDown = (event) => {
    if (status !== "live" || event.button === 2) return;
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio || !ratio.inside) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerRef.current = {
      x: ratio.x,
      y: ratio.y,
      clientX: event.clientX,
      clientY: event.clientY,
      time: Date.now()
    };
  };
  const handlePointerUp = (event) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start || status !== "live") return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const ratio = ratioFromEvent(event.clientX, event.clientY);
    if (!ratio) return;
    const dx = event.clientX - start.clientX;
    const dy = event.clientY - start.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - start.time;
    if (distance < 12 && duration < 400) {
      const viewport = viewportRef.current;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        const id = Date.now();
        setRipple({ left: event.clientX - rect.left, top: event.clientY - rect.top, id });
        window.setTimeout(() => setRipple((current) => current?.id === id ? null : current), 280);
      }
      void sendAction({ type: "tap", ratioX: ratio.x, ratioY: ratio.y });
      return;
    }
    void sendAction({
      type: "swipe",
      ratioX: start.x,
      ratioY: start.y,
      ratioEndX: ratio.x,
      ratioEndY: ratio.y,
      duration: Math.max(120, Math.min(1e3, duration))
    });
  };
  const selectShot = (0, import_react5.useCallback)(async (shot) => {
    if (!shot) return;
    setPreviewShot(shot);
    if (shot.selected) return;
    try {
      await postJson("/screenshots/select", { path: shot.path });
      setShots((previous) => previous.map((item) => ({ ...item, selected: item.path === shot.path })));
    } catch (selectError) {
      setNotice(selectError.message);
    }
  }, []);
  const copyPreview = (0, import_react5.useCallback)(async () => {
    if (!previewShot) return;
    try {
      await copyShotImage(previewShot.path);
      setNotice(t.copyShotDone);
    } catch (copyError) {
      setNotice(t.copyShotFailed.replace("{error}", copyError.message));
    }
  }, [previewShot, t]);
  const capture = async () => {
    if (!udid) return;
    try {
      const data = await postJson("/ios/screenshot", { udid, kind });
      setShots((previous) => [data.shot, ...previous.map((item) => ({ ...item, selected: false }))]);
      setStripOpen(true);
      setNotice(t.shotSaved);
    } catch (captureError) {
      setNotice(captureError.message);
    }
  };
  const stopMirror = async () => {
    try {
      await postJson("/ios/mirror/stop", { udid });
    } catch {
    }
    onClose();
  };
  const sendText = async () => {
    const value = text.trim();
    if (!value) return;
    setInputOpen(false);
    const sent = await sendAction({ type: "text", text: value });
    if (sent) setText("");
  };
  const openUrl = async () => {
    const value = url.trim();
    if (!value) return;
    const opened = await sendAction({ type: "openUrl", url: value });
    if (!opened) return;
    rememberLink(value);
    setUrl("");
    setLinkOpen(false);
  };
  const pickLink = (value) => {
    setUrl(value);
    linkInputRef.current?.focus();
  };
  const startDrag = (event) => {
    if (event.target.closest?.("button") || event.target.closest?.("input") || event.target.closest?.("textarea")) return;
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, x: offset.x, y: offset.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nextX = Math.max(-width + 120, Math.min(width - 120, drag.x + event.clientX - drag.clientX));
    const nextY = Math.max(-80, Math.min(height - 120, drag.y + event.clientY - drag.clientY));
    setOffset({ x: nextX, y: nextY });
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    shared.offset = offset;
    saveStore();
  };
  const showRailTip = (label, element) => {
    const rect = element.getBoundingClientRect();
    setRailTip({
      label,
      top: Math.round(rect.top + rect.height / 2),
      right: Math.max(8, Math.round(window.innerWidth - rect.left + 8))
    });
  };
  const railButton = (label, icon, action, options = {}) => (0, import_react5.createElement)("button", {
    type: "button",
    "aria-label": label,
    "aria-disabled": options.disabled ? "true" : "false",
    "data-disabled": options.disabled ? "true" : "false",
    "data-active": options.active ? "true" : "false",
    onMouseEnter: (event) => showRailTip(label, event.currentTarget),
    onMouseLeave: () => setRailTip(null),
    onFocus: (event) => showRailTip(label, event.currentTarget),
    onBlur: () => setRailTip(null),
    onClick: () => {
      if (options.disabled) return;
      setRailTip(null);
      action();
    }
  }, (0, import_react5.createElement)(Icon, { name: icon, size: 14 }));
  const isCompact = frameWidth < 330;
  const isLive = status === "live";
  return (0, import_react5.createElement)(
    "div",
    {
      className: "dd-panel",
      style: { transform: `translate(${offset.x}px, ${offset.y}px)` },
      role: "dialog",
      "aria-label": t.title
    },
    (0, import_react5.createElement)(
      "div",
      {
        ref: frameRef,
        className: "dd-frame",
        style: {
          width: `${frameWidth}px`,
          ...stripOpen ? { height: `calc(min(70vh, 840px) + ${STRIP_HEIGHT}px)` } : {}
        }
      },
      (0, import_react5.createElement)(
        "div",
        {
          className: "dd-head",
          onPointerDown: startDrag,
          onPointerMove: moveDrag,
          onPointerUp: endDrag,
          onPointerCancel: endDrag
        },
        (0, import_react5.createElement)(
          "div",
          { className: "dd-head-left" },
          (0, import_react5.createElement)(
            "div",
            { ref: menuRef, style: { position: "relative" } },
            (0, import_react5.createElement)(
              "button",
              {
                type: "button",
                className: "dd-device",
                title: t.switchDevice,
                "data-open": switcherOpen ? "true" : "false",
                onClick: () => setSwitcherOpen((value) => !value)
              },
              (0, import_react5.createElement)(Icon, { name: "phone", size: 13 }),
              (0, import_react5.createElement)("span", { className: "dd-device-name", style: { maxWidth: isCompact ? 150 : 240 } }, deviceName),
              (0, import_react5.createElement)(Icon, { name: "chevron", size: 10 })
            ),
            switcherOpen && (0, import_react5.createElement)(
              "div",
              { className: "dd-menu" },
              (0, import_react5.createElement)("div", { className: "dd-menu-title" }, t.switchDevice),
              devices.length === 0 ? (0, import_react5.createElement)("div", { style: { padding: "8px 7px", color: "#a1a1aa", fontSize: "11.5px" } }, t.menuEmpty) : devices.map((item) => (0, import_react5.createElement)(
                "button",
                {
                  key: item.udid,
                  type: "button",
                  className: "dd-menu-item",
                  "data-active": item.udid === udid && item.kind === kind ? "true" : "false",
                  onClick: () => {
                    setSwitcherOpen(false);
                    setKind(item.kind);
                    setUdid(item.udid);
                  }
                },
                (0, import_react5.createElement)(Icon, { name: "phone", size: 12 }),
                (0, import_react5.createElement)("span", null, item.name),
                (0, import_react5.createElement)("em", null, item.detail || "")
              ))
            )
          ),
          (0, import_react5.createElement)(
            "div",
            { className: "dd-head-right" },
            (0, import_react5.createElement)(
              "span",
              { className: "dd-status", "data-status": isLive ? "live" : status === "error" ? "error" : "connecting", "data-compact": isCompact ? "true" : "false" },
              (0, import_react5.createElement)("span", { className: "dd-dot" }),
              !isCompact && (0, import_react5.createElement)("span", null, isLive ? t.iosReady : status === "error" ? t.iosFailed : t.menuStarting)
            ),
            (0, import_react5.createElement)("button", {
              type: "button",
              className: "dd-head-refresh",
              title: t.retry,
              "aria-label": t.retry,
              onClick: () => setNonce((value) => value + 1)
            }, (0, import_react5.createElement)(Icon, { name: "refresh", size: 12 }))
          )
        )
      ),
      (0, import_react5.createElement)(
        "div",
        { className: "dd-body" },
        (0, import_react5.createElement)(
          "div",
          { className: "dd-rail" },
          railButton(t.railBack, "back", () => void sendAction({ type: "back" }), { disabled: !isLive }),
          railButton(t.iosHome, "home", () => void sendAction({ type: "home" }), { disabled: !isLive }),
          railButton(t.railText, "keyboard", () => {
            setInputOpen((value) => !value);
            setLinkOpen(false);
          }, { disabled: !isLive, active: inputOpen }),
          railButton(t.railLink, "globe", () => {
            setLinkOpen((value) => !value);
            setInputOpen(false);
          }, { disabled: !isLive, active: linkOpen }),
          (0, import_react5.createElement)("div", { className: "dd-rail-sep" }),
          shots.length > 0 && railButton(t.railHistory, "history", () => setStripOpen((value) => !value), { active: stripOpen }),
          railButton(t.railCapture, "camera", () => void capture(), { disabled: !isLive }),
          (0, import_react5.createElement)("div", { className: "dd-rail-sep" }),
          railButton(t.railClose, "minimize", onClose),
          railButton(t.iosStop, "power", () => void stopMirror(), { disabled: !udid })
        ),
        (0, import_react5.createElement)(
          "div",
          {
            className: "dd-viewport",
            ref: viewportRef,
            style: { borderRadius: stripOpen ? 0 : "0 0 10px 10px" },
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
            onPointerCancel: () => {
              pointerRef.current = null;
            },
            onContextMenu: (event) => event.preventDefault()
          },
          isLive && (0, import_react5.createElement)("img", {
            className: "dd-canvas",
            key: `${udid}-${nonce}`,
            src: `${API}/ios/stream?udid=${encodeURIComponent(udid)}&kind=${kind}&_=${nonce}`,
            alt: deviceName,
            draggable: false,
            onError: () => {
              setStatus("error");
              setError(t.streamError);
            }
          }),
          ripple && (0, import_react5.createElement)("span", {
            className: "dd-ripple",
            style: { left: `${ripple.left}px`, top: `${ripple.top}px` }
          }),
          !udid && (0, import_react5.createElement)(
            "div",
            { className: "dd-overlay" },
            (0, import_react5.createElement)(Icon, { name: "alert", size: 20 }),
            (0, import_react5.createElement)("strong", null, t.menuEmpty),
            (0, import_react5.createElement)("p", null, t.menuEmptyHint)
          ),
          udid && status === "starting" && (0, import_react5.createElement)(
            "div",
            { className: "dd-overlay" },
            (0, import_react5.createElement)("span", { className: "dd-spinner" }),
            (0, import_react5.createElement)("span", null, progress || t.iosStarting),
            (0, import_react5.createElement)("p", null, t.menuIosWdaHint)
          ),
          udid && status === "error" && (0, import_react5.createElement)(
            "div",
            { className: "dd-overlay" },
            (0, import_react5.createElement)(Icon, { name: "alert", size: 20 }),
            (0, import_react5.createElement)("strong", null, t.iosFailed),
            (0, import_react5.createElement)("p", null, error || t.menuIosWdaHint),
            (0, import_react5.createElement)("button", {
              type: "button",
              className: "dd-btn",
              onClick: () => setNonce((value) => value + 1)
            }, (0, import_react5.createElement)(Icon, { name: "refresh", size: 12 }), t.retry)
          ),
          previewShot && (0, import_react5.createElement)(
            "div",
            {
              className: "dd-preview",
              onPointerDown: (event) => event.stopPropagation(),
              onPointerUp: (event) => event.stopPropagation(),
              onPointerCancel: (event) => event.stopPropagation()
            },
            (0, import_react5.createElement)("img", { src: shotUrl(previewShot.path), alt: previewShot.name, draggable: false }),
            (0, import_react5.createElement)(
              "div",
              { className: "dd-preview-actions" },
              (0, import_react5.createElement)("button", {
                type: "button",
                className: "dd-preview-copy",
                title: t.previewCopy,
                "aria-label": t.previewCopy,
                onClick: () => void copyPreview()
              }, (0, import_react5.createElement)(Icon, { name: "copy", size: 12 })),
              (0, import_react5.createElement)("button", {
                type: "button",
                className: "dd-preview-close",
                title: t.previewClose,
                "aria-label": t.previewClose,
                onClick: () => setPreviewShot(null)
              }, (0, import_react5.createElement)(Icon, { name: "close", size: 12 }))
            )
          )
        )
      ),
      stripOpen && (0, import_react5.createElement)(
        "div",
        { className: "dd-strip" },
        (0, import_react5.createElement)("span", { className: "dd-strip-label" }, t.screenshotStrip),
        shots.length === 0 ? (0, import_react5.createElement)("span", { style: { color: "#71717a", fontSize: "10.5px" } }, t.emptyShot) : shots.map((shot) => (0, import_react5.createElement)("button", {
          key: shot.path,
          type: "button",
          className: "dd-thumb",
          "data-selected": previewShot?.path === shot.path ? "true" : "false",
          title: previewShot?.path === shot.path ? t.selected : shot.name,
          onClick: () => void selectShot(shot)
        }, (0, import_react5.createElement)("img", { src: shotUrl(shot.path), alt: shot.name, draggable: false })))
      )
    ),
    inputOpen && (0, import_react5.createElement)(
      "div",
      { className: "dd-pop", style: { top: "46%" } },
      (0, import_react5.createElement)(
        "div",
        { className: "dd-pop-head" },
        (0, import_react5.createElement)("span", null, t.text),
        (0, import_react5.createElement)(
          "div",
          { className: "dd-pop-head-actions" },
          (0, import_react5.createElement)("kbd", { className: "dd-kbd" }, t.sendShortcut),
          (0, import_react5.createElement)("button", { type: "button", onClick: () => setInputOpen(false), title: t.close }, (0, import_react5.createElement)(Icon, { name: "close", size: 12 }))
        )
      ),
      (0, import_react5.createElement)("textarea", {
        "aria-keyshortcuts": "Meta+Enter Control+Enter",
        value: text,
        autoFocus: true,
        placeholder: t.enterText,
        onChange: (event) => setText(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void sendText();
          }
        }
      }),
      (0, import_react5.createElement)(
        "div",
        { className: "dd-pop-foot" },
        (0, import_react5.createElement)("span", { className: "dd-pop-hint" }, t.textHint),
        (0, import_react5.createElement)("button", { type: "button", className: "dd-send", disabled: !text.trim(), onClick: () => void sendText() }, t.sendText)
      )
    ),
    linkOpen && (0, import_react5.createElement)(
      "div",
      { className: "dd-pop dd-pop-link", style: { top: "50%" } },
      (0, import_react5.createElement)(
        "div",
        { className: "dd-pop-head" },
        (0, import_react5.createElement)("span", null, t.link),
        (0, import_react5.createElement)("button", { type: "button", onClick: () => setLinkOpen(false), title: t.close }, (0, import_react5.createElement)(Icon, { name: "close", size: 12 }))
      ),
      (0, import_react5.createElement)("textarea", {
        ref: linkInputRef,
        className: "dd-pop-url",
        value: url,
        autoFocus: true,
        spellCheck: false,
        placeholder: t.urlHint,
        onChange: (event) => setUrl(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void openUrl();
          }
        }
      }),
      (0, import_react5.createElement)(LinkHistory, {
        t,
        onPick: pickLink,
        onTogglePin: toggleLinkPin,
        onRemove: removeLink
      }),
      (0, import_react5.createElement)(
        "div",
        { className: "dd-pop-foot" },
        (0, import_react5.createElement)("span", { className: "dd-pop-hint" }, t.enterUrl),
        (0, import_react5.createElement)("button", { type: "button", className: "dd-send", disabled: !url.trim(), onClick: () => void openUrl() }, t.open)
      )
    ),
    notice && (0, import_react5.createElement)("div", { className: "dd-notice" }, notice),
    railTip && import_react_dom2.default.createPortal(
      (0, import_react5.createElement)("div", {
        className: "dd-rail-tip",
        style: { top: `${railTip.top}px`, right: `${railTip.right}px` }
      }, railTip.label),
      document.body
    )
  );
}

// src/client/launcher.js
var import_react6 = require("react");
var import_react_dom3 = __toESM(require("react-dom"), 1);
function DevicePicker({
  inventory,
  rect,
  menuRef,
  t,
  onOpenAndroid,
  onOpenIos,
  onOpenIosDevice,
  onStartAvd,
  onStartIos,
  onStop,
  onRefresh,
  onNotice,
  launching,
  stopping,
  wifiAddress,
  setWifiAddress,
  onConnectWifi,
  wifiBusy,
  wifiResult,
  notice
}) {
  const [expanded, setExpanded] = (0, import_react6.useState)({});
  const android = inventory?.android || { running: [], avds: { available: false, items: [], pending: [], message: "" } };
  const ios = inventory?.ios || { available: false, running: [], pending: [], devices: { available: false, items: [] } };
  const iosDevices = ios.devices?.items || [];
  const running = [
    ...(android.running || []).map((row) => ({ ...row, platform: "android" })),
    ...(ios.running || []).map((simulator) => ({
      platform: "ios",
      udid: simulator.udid,
      name: simulator.name,
      serial: simulator.udid,
      state: "booted",
      kind: "ios",
      uptimeSeconds: null,
      version: simulator.version
    }))
  ];
  const pendingAvds = android.avds?.pending || [];
  const pendingIos = ios.pending || [];
  const hasContent = running.length > 0 || pendingAvds.length > 0 || pendingIos.length > 0 || iosDevices.length > 0;
  const limit = (key, total) => expanded[key] ? total : Math.min(2, total);
  const toggle = (key) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
  const more = (key, total, unit) => total > 2 ? (0, import_react6.createElement)(
    "button",
    {
      key: `more-${key}`,
      type: "button",
      className: "dd-picker-more",
      "data-expanded": expanded[key] ? "true" : "false",
      onClick: () => toggle(key)
    },
    (0, import_react6.createElement)("span", null, expanded[key] ? t.menuCollapse : `${t.menuAll} ${total} ${unit}`),
    (0, import_react6.createElement)(Icon, { name: "chevron", size: 10 })
  ) : null;
  const keyOf = (row) => row.platform === "ios" ? `ios-${row.udid}` : `android-${row.serial || row.pid}`;
  const kindOf = (row) => row.platform === "ios" ? t.menuIosEmulator : row.kind === "\u771F\u673A" ? t.menuReal : t.menuEmulator;
  const detailOf = (row) => {
    if (row.platform === "ios") {
      return `${t.menuIosEmulator}${row.version ? ` \xB7 iOS ${row.version}` : ""}`;
    }
    if (row.state === "starting") return `${t.menuEmulator} \xB7 ${t.menuStarting}`;
    if (row.kind === "\u771F\u673A") return `${t.menuReal} \xB7 ${row.serial}`;
    const uptime = row.uptimeSeconds !== null && row.uptimeSeconds !== void 0 ? formatDuration(row.uptimeSeconds, t) : row.serial;
    return `${t.menuEmulator} \xB7 ${uptime}`;
  };
  const openRow = (row) => {
    if (row.platform === "ios") {
      onOpenIosDevice({ ...row, kind: "simulator" });
      return;
    }
    if (!row.serial) {
      onNotice(t.menuStartingWait);
      return;
    }
    onOpenAndroid(row);
  };
  return (0, import_react6.createElement)(
    "div",
    {
      ref: menuRef,
      className: "dd-picker",
      style: {
        top: rect.top,
        right: rect.right,
        maxHeight: `calc(100vh - ${Math.max(120, rect.top + 12)}px)`
      }
    },
    (0, import_react6.createElement)(
      "div",
      { className: "dd-picker-scroll" },
      (0, import_react6.createElement)(
        "div",
        { className: "dd-picker-section" },
        (0, import_react6.createElement)("span", null, t.menuRunning),
        (0, import_react6.createElement)("span", { className: "dd-picker-count" }, String(running.length))
      ),
      running.length === 0 ? (0, import_react6.createElement)("div", { className: "dd-picker-empty dd-picker-empty-inline" }, t.menuNoOnline) : (0, import_react6.createElement)(
        "div",
        null,
        running.slice(0, limit("running", running.length)).map((row) => (0, import_react6.createElement)(
          "div",
          {
            key: keyOf(row),
            className: "dd-picker-row"
          },
          (0, import_react6.createElement)(
            "button",
            {
              type: "button",
              className: "dd-picker-main",
              title: t.menuOpenMirror,
              onClick: () => openRow(row)
            },
            (0, import_react6.createElement)(
              "div",
              { className: "dd-picker-line" },
              (0, import_react6.createElement)("span", {
                className: "dd-picker-glyph"
              }, (0, import_react6.createElement)(Icon, { name: "phone", size: 13 })),
              (0, import_react6.createElement)("span", { className: "dd-picker-name" }, row.name),
              (0, import_react6.createElement)("span", {
                className: "dd-picker-status",
                "data-state": row.state === "booted" ? "booted" : "starting"
              }, row.state === "booted" ? t.menuReady : t.menuStarting)
            ),
            (0, import_react6.createElement)("div", { className: "dd-picker-detail" }, detailOf(row))
          ),
          row.platform === "android" && row.serial && (0, import_react6.createElement)("button", {
            type: "button",
            className: "dd-picker-icon",
            title: t.menuOpenMirror,
            onClick: () => onOpenAndroid(row)
          }, (0, import_react6.createElement)(Icon, { name: "monitorplay", size: 14 })),
          row.platform === "ios" && (0, import_react6.createElement)("button", {
            type: "button",
            className: "dd-picker-icon",
            title: t.menuOpenSimulator,
            onClick: () => void onOpenIos(row)
          }, (0, import_react6.createElement)(Icon, { name: "external", size: 14 })),
          (row.platform === "ios" || row.kind !== "\u771F\u673A") && (0, import_react6.createElement)("button", {
            type: "button",
            className: "dd-picker-icon",
            "data-danger": "true",
            title: t.menuStop,
            disabled: Boolean(stopping),
            onClick: () => void onStop(row)
          }, stopping === keyOf(row) ? (0, import_react6.createElement)("span", { className: "dd-picker-spinner" }) : (0, import_react6.createElement)(Icon, { name: "power", size: 13 }))
        )),
        more("running", running.length, t.menuDeviceUnit)
      ),
      iosDevices.length > 0 && (0, import_react6.createElement)(
        import_react6.Fragment,
        { key: "ios-device-section" },
        (0, import_react6.createElement)(
          "div",
          { className: "dd-picker-section" },
          (0, import_react6.createElement)("span", null, t.menuIosDevices),
          (0, import_react6.createElement)("span", { className: "dd-picker-count" }, String(iosDevices.length))
        ),
        (0, import_react6.createElement)(
          "div",
          null,
          iosDevices.map((device) => (0, import_react6.createElement)(
            "div",
            {
              key: device.udid,
              className: "dd-picker-row"
            },
            (0, import_react6.createElement)(
              "button",
              {
                type: "button",
                className: "dd-picker-main",
                title: t.menuIosMirrorOpen,
                onClick: () => onOpenIosDevice(device)
              },
              (0, import_react6.createElement)(
                "div",
                { className: "dd-picker-line" },
                (0, import_react6.createElement)("span", {
                  className: "dd-picker-glyph"
                }, (0, import_react6.createElement)(Icon, { name: "phone", size: 13 })),
                (0, import_react6.createElement)("span", { className: "dd-picker-name" }, device.name),
                device.mirroring?.status === "ready" && (0, import_react6.createElement)("span", {
                  className: "dd-picker-status",
                  "data-state": "booted"
                }, t.iosReady),
                device.mirroring?.status === "starting" && (0, import_react6.createElement)("span", {
                  className: "dd-picker-status",
                  "data-state": "starting"
                }, t.menuStarting)
              ),
              (0, import_react6.createElement)(
                "div",
                { className: "dd-picker-detail" },
                `${device.model || device.productType || "iOS"}${device.osVersion ? ` \xB7 iOS ${device.osVersion}` : ""}${device.transport ? ` \xB7 ${device.transport}` : ""}`
              )
            ),
            (0, import_react6.createElement)("button", {
              type: "button",
              className: "dd-picker-icon",
              title: t.menuIosMirrorOpen,
              onClick: () => onOpenIosDevice(device)
            }, (0, import_react6.createElement)(Icon, { name: "monitorplay", size: 14 }))
          ))
        )
      ),
      android.avds?.available && pendingAvds.length > 0 && (0, import_react6.createElement)(
        import_react6.Fragment,
        { key: "android-section" },
        (0, import_react6.createElement)(
          "div",
          { className: "dd-picker-section" },
          (0, import_react6.createElement)("span", null, t.menuAndroidEmulators)
        ),
        (0, import_react6.createElement)(
          "div",
          null,
          pendingAvds.slice(0, limit("android", pendingAvds.length)).map((name) => (0, import_react6.createElement)(
            "div",
            {
              key: name,
              className: "dd-picker-row",
              "data-static": "true"
            },
            (0, import_react6.createElement)(
              "div",
              { className: "dd-picker-main" },
              (0, import_react6.createElement)(
                "div",
                { className: "dd-picker-line" },
                (0, import_react6.createElement)("span", {
                  className: "dd-picker-glyph"
                }, (0, import_react6.createElement)(Icon, { name: "phone", size: 13 })),
                (0, import_react6.createElement)("div", { className: "dd-picker-name" }, name)
              ),
              (0, import_react6.createElement)("div", { className: "dd-picker-detail" }, t.menuNotStarted)
            ),
            (0, import_react6.createElement)(
              "button",
              {
                type: "button",
                className: "dd-picker-start",
                disabled: Boolean(launching),
                onClick: () => void onStartAvd(name)
              },
              launching === `avd-${name}` ? (0, import_react6.createElement)("span", { className: "dd-picker-spinner" }) : (0, import_react6.createElement)(Icon, { name: "play", size: 10 }),
              (0, import_react6.createElement)("span", null, launching === `avd-${name}` ? t.menuStartingBtn : t.menuStart)
            )
          )),
          more("android", pendingAvds.length, t.menuItemUnit)
        )
      ),
      ios.available && pendingIos.length > 0 && (0, import_react6.createElement)(
        import_react6.Fragment,
        { key: "ios-section" },
        (0, import_react6.createElement)(
          "div",
          { className: "dd-picker-section" },
          (0, import_react6.createElement)("span", null, t.menuIosEmulators)
        ),
        (0, import_react6.createElement)(
          "div",
          null,
          pendingIos.slice(0, limit("ios", pendingIos.length)).map((simulator) => (0, import_react6.createElement)(
            "div",
            {
              key: simulator.udid,
              className: "dd-picker-row",
              "data-static": "true"
            },
            (0, import_react6.createElement)(
              "div",
              { className: "dd-picker-main" },
              (0, import_react6.createElement)(
                "div",
                { className: "dd-picker-line" },
                (0, import_react6.createElement)("span", {
                  className: "dd-picker-glyph"
                }, (0, import_react6.createElement)(Icon, { name: "phone", size: 13 })),
                (0, import_react6.createElement)("div", { className: "dd-picker-name" }, simulator.name)
              ),
              (0, import_react6.createElement)(
                "div",
                { className: "dd-picker-detail" },
                `${t.menuShutdown}${simulator.version ? ` \xB7 iOS ${simulator.version}` : ""}`
              )
            ),
            (0, import_react6.createElement)(
              "button",
              {
                type: "button",
                className: "dd-picker-start",
                disabled: Boolean(launching),
                onClick: () => void onStartIos(simulator)
              },
              launching === `ios-${simulator.udid}` ? (0, import_react6.createElement)("span", { className: "dd-picker-spinner" }) : (0, import_react6.createElement)(Icon, { name: "play", size: 10 }),
              (0, import_react6.createElement)("span", null, launching === `ios-${simulator.udid}` ? t.menuStartingBtn : t.menuStart)
            )
          )),
          more("ios", pendingIos.length, t.menuDeviceUnit)
        )
      ),
      !hasContent && (0, import_react6.createElement)(
        "div",
        { className: "dd-picker-empty" },
        t.menuEmpty,
        (0, import_react6.createElement)("br", null),
        t.menuEmptyHint
      ),
      inventory?.adb?.available === false && (0, import_react6.createElement)(
        "div",
        { className: "dd-picker-notice" },
        inventory.adb.error || t.adbMissing
      )
    ),
    notice && (0, import_react6.createElement)("div", { className: "dd-picker-notice" }, notice),
    (0, import_react6.createElement)(
      "div",
      { className: "dd-picker-wifi" },
      (0, import_react6.createElement)(
        "div",
        { className: "dd-picker-wifi-row" },
        (0, import_react6.createElement)(Icon, { name: "wifi", size: 14 }),
        (0, import_react6.createElement)("input", {
          className: "dd-picker-input",
          value: wifiAddress,
          placeholder: t.menuWifiPlaceholder,
          spellCheck: false,
          onChange: (event) => setWifiAddress(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void onConnectWifi();
            }
          }
        }),
        (0, import_react6.createElement)("button", {
          type: "button",
          className: "dd-picker-connect",
          disabled: !wifiAddress.trim() || wifiBusy,
          onClick: () => void onConnectWifi()
        }, wifiBusy ? t.menuConnecting : t.menuConnect),
        (0, import_react6.createElement)("button", {
          type: "button",
          className: "dd-picker-icon",
          title: t.menuRefresh,
          onClick: () => void onRefresh()
        }, (0, import_react6.createElement)(Icon, { name: "refresh", size: 14 }))
      ),
      wifiResult && (0, import_react6.createElement)("div", {
        className: "dd-picker-result",
        "data-ok": wifiResult.ok ? "true" : "false"
      }, wifiResult.text)
    )
  );
}
function makeLauncher(ctx) {
  return function DeviceMirrorLauncher() {
    const open = useSharedOpen();
    const [menuOpen, setMenuOpen] = (0, import_react6.useState)(false);
    const [menuRect, setMenuRect] = (0, import_react6.useState)(null);
    const [inventory, setInventory] = (0, import_react6.useState)(null);
    const [deviceCount, setDeviceCount] = (0, import_react6.useState)(0);
    const [menuNotice, setMenuNotice] = (0, import_react6.useState)("");
    const [launching, setLaunching] = (0, import_react6.useState)(null);
    const [stopping, setStopping] = (0, import_react6.useState)(null);
    const [wifiAddress, setWifiAddress] = (0, import_react6.useState)("");
    const [wifiBusy, setWifiBusy] = (0, import_react6.useState)(false);
    const [wifiResult, setWifiResult] = (0, import_react6.useState)(null);
    const t = useCopy(ctx);
    const buttonRef = (0, import_react6.useRef)(null);
    const menuRef = (0, import_react6.useRef)(null);
    const reloadInventory = (0, import_react6.useCallback)(async () => {
      try {
        const data = await apiJson("/inventory");
        setInventory(data);
        const count = (Array.isArray(data.android?.running) ? data.android.running.length : 0) + (Array.isArray(data.ios?.running) ? data.ios.running.length : 0) + (Array.isArray(data.ios?.devices?.items) ? data.ios.devices.items.length : 0);
        setDeviceCount(count);
      } catch (error) {
        setInventory((previous) => previous || {
          adb: { available: false, error: error.message },
          android: { running: [], avds: { available: false, items: [], pending: [], message: error.message } },
          ios: { available: false, message: error.message, running: [], pending: [] }
        });
      }
    }, []);
    (0, import_react6.useEffect)(() => {
      void reloadInventory();
      const timer = window.setInterval(() => void reloadInventory(), menuOpen ? 5e3 : 15e3);
      return () => window.clearInterval(timer);
    }, [reloadInventory, menuOpen]);
    (0, import_react6.useEffect)(() => {
      if (!menuOpen) return void 0;
      const onPointerDown = (event) => {
        if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
        setMenuOpen(false);
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") setMenuOpen(false);
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown, true);
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [menuOpen]);
    (0, import_react6.useEffect)(() => {
      if (!menuOpen) return void 0;
      const close = () => setMenuOpen(false);
      window.addEventListener("resize", close);
      return () => window.removeEventListener("resize", close);
    }, [menuOpen]);
    const openMenu = () => {
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuRect({
          top: Math.round(rect.bottom + 6),
          right: Math.max(8, Math.round(window.innerWidth - rect.right))
        });
      }
      setMenuOpen(true);
      setMenuNotice("");
      setWifiResult(null);
      if (open) setSharedOpen(false);
      void reloadInventory();
    };
    const openAndroid = (row) => {
      if (!row.serial) {
        setMenuNotice(t.menuStartingWait);
        return;
      }
      shared.platform = "android";
      shared.serial = row.serial;
      saveStore();
      notifyStore();
      setSharedOpen(true);
      setMenuOpen(false);
    };
    const openIosMirror = (row) => {
      shared.platform = "ios";
      shared.iosKind = row.kind === "simulator" ? "simulator" : "device";
      shared.serial = row.udid;
      saveStore();
      notifyStore();
      setSharedOpen(true);
      setMenuOpen(false);
    };
    const openIos = async (row) => {
      try {
        const result = await postJson("/ios/open", { udid: row.udid });
        setMenuNotice(result.message || t.menuIosUnsupported);
      } catch (error) {
        setMenuNotice(error.message);
      }
    };
    const startAvd = async (name) => {
      if (launching) return;
      const key = `avd-${name}`;
      setLaunching(key);
      setMenuNotice("");
      try {
        const result = await postJson("/emulator/start", { name });
        setMenuNotice(result.message || t.menuStartingBtn);
      } catch (error) {
        setMenuNotice(error.message);
      } finally {
        window.setTimeout(() => setLaunching((current) => current === key ? null : current), 2500);
        void reloadInventory();
      }
    };
    const startIos = async (simulator) => {
      if (launching) return;
      const key = `ios-${simulator.udid}`;
      setLaunching(key);
      setMenuNotice("");
      try {
        const result = await postJson("/ios/boot", { udid: simulator.udid });
        setMenuNotice(result.message || t.menuStartingBtn);
      } catch (error) {
        setMenuNotice(error.message);
      } finally {
        window.setTimeout(() => setLaunching((current) => current === key ? null : current), 2500);
        void reloadInventory();
      }
    };
    const stopRow = async (row) => {
      if (stopping) return;
      const key = row.platform === "ios" ? `ios-${row.udid}` : `android-${row.serial || row.pid}`;
      setStopping(key);
      try {
        const result = row.platform === "ios" ? await postJson("/ios/shutdown", { udid: row.udid }) : await postJson("/emulator/stop", { serial: row.serial, pid: row.pid });
        setMenuNotice(result.message || t.menuStopRequested);
      } catch (error) {
        setMenuNotice(error.message);
      } finally {
        setStopping(null);
        window.setTimeout(() => void reloadInventory(), 600);
      }
    };
    const connectWifi = async () => {
      const address = wifiAddress.trim();
      if (!address || wifiBusy) return;
      setWifiBusy(true);
      setWifiResult(null);
      try {
        const result = await postJson("/wifi/connect", { address });
        setWifiResult({ ok: Boolean(result.success), text: result.message });
        if (result.success) setWifiAddress("");
      } catch (error) {
        setWifiResult({ ok: false, text: error.message });
      } finally {
        setWifiBusy(false);
        void reloadInventory();
      }
    };
    const title = deviceCount > 0 ? `\u8BBE\u5907 \xB7 ${deviceCount} ${t.menuOnline}` : `\u8BBE\u5907 \xB7 ${t.menuNoDevice}`;
    return (0, import_react6.createElement)(
      import_react6.Fragment,
      null,
      (0, import_react6.createElement)(
        "button",
        {
          ref: buttonRef,
          type: "button",
          className: "dd-launcher",
          title,
          "aria-label": t.title,
          "aria-keyshortcuts": "Control+M",
          "aria-expanded": menuOpen,
          "data-active": menuOpen || open ? "true" : "false",
          "data-count": deviceCount > 0 ? "true" : "false",
          onClick: openMenu
        },
        (0, import_react6.createElement)(LauncherIcon, { size: 16 }),
        deviceCount > 0 && (0, import_react6.createElement)("span", { className: "dd-launcher-count" }, deviceCount > 99 ? "99+" : String(deviceCount))
      ),
      menuOpen && menuRect ? import_react_dom3.default.createPortal(
        (0, import_react6.createElement)(DevicePicker, {
          inventory,
          rect: menuRect,
          menuRef,
          t,
          onOpenAndroid: openAndroid,
          onOpenIos: openIos,
          onOpenIosDevice: openIosMirror,
          onStartAvd: startAvd,
          onStartIos: startIos,
          onStop: stopRow,
          onRefresh: reloadInventory,
          onNotice: setMenuNotice,
          launching,
          stopping,
          wifiAddress,
          setWifiAddress,
          onConnectWifi: connectWifi,
          wifiBusy,
          wifiResult,
          notice: menuNotice
        }),
        document.body
      ) : null
    );
  };
}

// src/client/picker.js
var import_react7 = require("react");
var import_react_dom4 = __toESM(require("react-dom"), 1);
var shotPicker = {
  sessionId: null,
  listeners: /* @__PURE__ */ new Set()
};
function notifyShotPicker() {
  for (const listener of shotPicker.listeners) listener();
}
function openShotPicker(sessionId) {
  if (!sessionId) return;
  shotPicker.sessionId = sessionId;
  notifyShotPicker();
}
function closeShotPicker(sessionId) {
  if (sessionId !== void 0 && shotPicker.sessionId !== sessionId) return;
  shotPicker.sessionId = null;
  notifyShotPicker();
}
function useShotPickerSession() {
  const [sessionId, setSessionId] = (0, import_react7.useState)(shotPicker.sessionId);
  (0, import_react7.useEffect)(() => {
    const sync = () => setSessionId(shotPicker.sessionId);
    shotPicker.listeners.add(sync);
    sync();
    return () => {
      shotPicker.listeners.delete(sync);
    };
  }, []);
  return sessionId;
}
function shotTimeText(at) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(void 0, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function ShotPicker({ ctx, sessionId, inputActions, onClose }) {
  const t = useCopy(ctx);
  const [shots, setShots] = (0, import_react7.useState)([]);
  const [loading, setLoading] = (0, import_react7.useState)(true);
  const [error, setError] = (0, import_react7.useState)("");
  const [busy, setBusy] = (0, import_react7.useState)("");
  const [removing, setRemoving] = (0, import_react7.useState)("");
  const [confirmClear, setConfirmClear] = (0, import_react7.useState)(false);
  (0, import_react7.useEffect)(() => {
    let alive = true;
    apiJson("/screenshots").then((data) => {
      if (alive) setShots(Array.isArray(data.items) ? data.items : []);
    }).catch((loadError) => {
      if (alive) setError(t.pickerLoadFailed.replace("{error}", loadError.message));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [t]);
  (0, import_react7.useEffect)(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  const choose = async (shot) => {
    if (busy || removing) return;
    setBusy(shot.path);
    setError("");
    try {
      await attachShot(ctx, sessionId, inputActions, shot, t);
      onClose();
    } catch (attachError) {
      setError(t.pickerAttachFailed.replace("{error}", attachError.message));
    } finally {
      setBusy("");
    }
  };
  const remove = async (shot) => {
    if (busy || removing) return;
    setRemoving(shot.path);
    setError("");
    try {
      await deleteShotFile(shot.path);
      setShots((previous) => previous.filter((item) => item.path !== shot.path));
      bumpShotVersion();
    } catch (removeError) {
      setError(t.pickerDeleteFailed.replace("{error}", removeError.message));
    } finally {
      setRemoving("");
    }
  };
  const clearAll = async () => {
    if (busy || removing || shots.length === 0) return;
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    setRemoving("all");
    setError("");
    try {
      await clearShotHistory();
      setShots([]);
      bumpShotVersion();
    } catch (clearError) {
      setError(t.pickerClearFailed.replace("{error}", clearError.message));
    } finally {
      setRemoving("");
    }
  };
  (0, import_react7.useEffect)(() => {
    if (!confirmClear) return void 0;
    const timer = window.setTimeout(() => setConfirmClear(false), 4e3);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);
  return import_react_dom4.default.createPortal(
    (0, import_react7.createElement)(
      "div",
      {
        className: "dd-shot-mask",
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose();
        }
      },
      (0, import_react7.createElement)(
        "div",
        {
          className: "dd-shot-panel",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": t.pickerTitle
        },
        (0, import_react7.createElement)(
          "div",
          { className: "dd-shot-head" },
          (0, import_react7.createElement)(
            "div",
            { className: "dd-shot-titles" },
            (0, import_react7.createElement)("strong", null, t.pickerTitle),
            (0, import_react7.createElement)("span", null, t.pickerHint)
          ),
          (0, import_react7.createElement)("button", {
            type: "button",
            className: "dd-shot-clear",
            "data-confirm": confirmClear ? "true" : "false",
            disabled: Boolean(busy) || Boolean(removing) || shots.length === 0,
            onClick: () => void clearAll()
          }, removing === "all" ? t.pickerClearing : confirmClear ? t.pickerClearConfirm : t.pickerClear),
          (0, import_react7.createElement)("button", {
            type: "button",
            className: "dd-shot-close",
            title: t.close,
            "aria-label": t.close,
            onClick: onClose
          }, (0, import_react7.createElement)(Icon, { name: "close", size: 12 }))
        ),
        loading ? (0, import_react7.createElement)("div", { className: "dd-shot-state" }, (0, import_react7.createElement)("span", { className: "dd-spinner" }), t.pickerLoading) : error && shots.length === 0 ? (0, import_react7.createElement)("div", { className: "dd-shot-state" }, error) : shots.length === 0 ? (0, import_react7.createElement)("div", { className: "dd-shot-state" }, t.pickerEmpty) : (0, import_react7.createElement)(
          import_react7.Fragment,
          null,
          error && (0, import_react7.createElement)("div", { className: "dd-shot-error" }, error),
          (0, import_react7.createElement)(
            "div",
            { className: "dd-shot-grid" },
            shots.map((shot) => (0, import_react7.createElement)(
              "div",
              {
                key: shot.path,
                className: "dd-shot-item",
                "data-busy": busy === shot.path || removing === shot.path ? "true" : "false",
                title: new Date(shot.at).toLocaleString()
              },
              (0, import_react7.createElement)(
                "button",
                {
                  type: "button",
                  className: "dd-shot-pick",
                  disabled: Boolean(busy) || Boolean(removing),
                  onClick: () => void choose(shot)
                },
                (0, import_react7.createElement)("img", { src: shotUrl(shot.path), alt: shot.name, draggable: false }),
                (0, import_react7.createElement)("span", { className: "dd-shot-time" }, busy === shot.path ? t.pickerBusy : shotTimeText(shot.at))
              ),
              (0, import_react7.createElement)("button", {
                type: "button",
                className: "dd-shot-remove",
                title: t.pickerDelete,
                "aria-label": t.pickerDelete,
                disabled: Boolean(busy) || Boolean(removing),
                onClick: () => void remove(shot)
              }, (0, import_react7.createElement)(Icon, { name: "close", size: 10 }))
            ))
          )
        )
      )
    ),
    document.body
  );
}

// src/client/styles.js
var CSS = `
  .dd-launcher{position:relative;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-launcher:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-launcher[data-active="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-launcher[data-count="true"]{width:auto;padding:0 4px;gap:3px}
  .dd-launcher-count{font-size:10px;font-weight:500;line-height:1;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
  .dd-launcher:hover .dd-launcher-count{color:var(--dsw-alias-label-primary)}
  .dd-panel{position:fixed;right:18px;top:64px;display:flex;align-items:center;z-index:9000;font-family:inherit;color:#e4e4e7;pointer-events:none}
  .dd-frame{position:relative;flex:none;display:flex;flex-direction:column;height:min(70vh,840px);max-height:calc(100vh - 72px);background:#18181b;border:1px solid #27272a;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.14);overflow:visible;color:#f4f4f5;pointer-events:auto;transition:width .2s ease;animation:dd-in .18s ease-out}
  .dd-head{height:36px;flex:none;display:flex;align-items:center;gap:4px;padding:0 8px;background:#27272a;border-bottom:1px solid rgba(63,63,70,.6);border-radius:10px 10px 0 0;user-select:none;cursor:grab}
  .dd-head:active{cursor:grabbing}
  .dd-head-left{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;flex:1}
  .dd-device{display:flex;align-items:center;gap:4px;min-width:0;height:22px;padding:0 4px;margin-left:-4px;border:0;border-radius:5px;background:transparent;color:#f4f4f5;cursor:pointer;font:inherit}
  .dd-device:hover{background:rgba(255,255,255,.07)}
  .dd-device svg:first-child{color:#10b981;flex:none}
  .dd-device svg:last-child{color:#71717a;flex:none;transition:transform .15s ease}
  .dd-device[data-open="true"] svg:last-child{transform:rotate(180deg)}
  .dd-device-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500}
  .dd-status{display:inline-flex;align-items:center;gap:3px;height:18px;padding:0 5px;border-radius:4px;font-size:10px;font-weight:500;white-space:nowrap;border:1px solid transparent;flex:none}
  .dd-status[data-compact="true"]{padding:0 4px}
  .dd-status[data-status="live"]{background:rgba(16,185,129,.12);color:#34d399;border-color:rgba(16,185,129,.2)}
  .dd-status[data-status="connecting"]{background:rgba(234,179,8,.12);color:#facc15;border-color:rgba(234,179,8,.2)}
  .dd-status[data-status="error"],.dd-status[data-status="offline"]{background:rgba(239,68,68,.12);color:#f87171;border-color:rgba(239,68,68,.2)}
  .dd-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
  .dd-head-right{display:flex;align-items:center;gap:2px;flex:none}
  .dd-head-refresh{display:flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-head-refresh:hover{background:rgba(255,255,255,.1);color:#f4f4f5}
  .dd-body{position:relative;flex:1;min-height:0;display:flex}
  .dd-rail{position:absolute;right:calc(100% + 2px);top:50%;transform:translateY(-50%);width:32px;display:flex;flex-direction:column;background:#fff;border:1px solid #e3e3e8;border-right:0;border-radius:9px 0 0 9px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06);pointer-events:auto;z-index:2}
  .dd-rail button{display:flex;align-items:center;justify-content:center;width:100%;height:38px;border:0;border-bottom:1px solid #f1f1f4;background:transparent;color:#63636b;cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-rail button:last-child{border-bottom:0}
  .dd-rail-sep{height:1px;flex:none;background:#f1f1f4}
  .dd-rail-tip{position:fixed;z-index:9600;transform:translateY(-50%);padding:3px 7px;border-radius:5px;background:rgba(24,24,27,.95);border:1px solid rgba(255,255,255,.14);color:#f4f4f5;font-size:10.5px;line-height:1.4;white-space:nowrap;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.2)}
  .dd-rail button:hover:not([data-disabled="true"]){background:#fafafc;color:#1c1c21}
  .dd-rail button[data-locked="true"]{pointer-events:none}
  .dd-rail button[data-disabled="true"]{opacity:.35;cursor:default}
  .dd-rail button[data-active="true"]{background:#eeedfd;color:#4f46e5}
  .dd-viewport{position:relative;flex:1;min-width:0;background:#000;overflow:hidden;touch-action:none;cursor:crosshair;border-radius:0 0 10px 10px}
  .dd-canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
  .dd-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.82);color:#e4e4e7;text-align:center;padding:18px;font-size:12px;line-height:1.6;z-index:3}
  .dd-overlay strong{font-size:12.5px;font-weight:600;color:#fafafa}
  .dd-overlay p{margin:0;color:#a1a1aa;max-width:250px}
  .dd-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 12px;border:0;border-radius:6px;background:#3f3f46;color:#fafafa;font:inherit;font-size:11.5px;font-weight:500;cursor:pointer;transition:background .15s ease}
  .dd-btn:hover{background:#52525b}
  .dd-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:#a5b4fc;border-radius:50%;animation:dd-spin .9s linear infinite}
  @keyframes dd-spin{to{transform:rotate(360deg)}}
  .dd-ripple{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.35);pointer-events:none;animation:dd-ripple .28s ease-out forwards}
  @keyframes dd-ripple{from{transform:scale(.5);opacity:1}to{transform:scale(1.6);opacity:0}}
  @keyframes dd-in{from{opacity:0}to{opacity:1}}
  .dd-strip{height:50px;flex:none;display:flex;align-items:center;gap:5px;padding:0 8px;background:#1c1c21;border-top:1px solid rgba(63,63,70,.6);border-radius:0 0 10px 10px;overflow-x:auto;overflow-y:hidden}
  .dd-strip-label{flex:none;font-size:10px;color:#71717a;padding-right:2px}
  .dd-thumb{flex:none;height:38px;padding:0;border:1px solid rgba(255,255,255,.14);border-radius:4px;background:#000;overflow:hidden;cursor:pointer;opacity:.75;transition:opacity .15s ease,border-color .15s ease}
  .dd-thumb:hover{opacity:1}
  .dd-thumb[data-selected="true"]{border-color:#818cf8;box-shadow:0 0 0 1px rgba(129,140,248,.7);opacity:1}
  .dd-thumb img{height:100%;width:auto;display:block;object-fit:cover}
  .dd-preview{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;background:#000;cursor:default;animation:dd-in .15s ease-out}
  .dd-preview img{width:100%;height:100%;object-fit:contain;display:block}
  .dd-preview-actions{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:6px}
  .dd-preview-actions button{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:6px;background:rgba(24,24,27,.72);color:#f4f4f5;cursor:pointer;backdrop-filter:blur(4px);transition:background .15s ease}
  .dd-preview-copy:hover{background:rgba(99,102,241,.85)}
  .dd-preview-close:hover{background:rgba(239,68,68,.85)}
  .dd-pop{position:absolute;right:calc(100% + 42px);top:50%;transform:translateY(-50%);width:240px;max-width:calc(100% - 52px);display:flex;flex-direction:column;background:#fff;border:1px solid #e3e3e8;border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,.22),0 2px 6px rgba(0,0,0,.06);z-index:6;overflow:hidden;color:#1c1c21;pointer-events:auto}
  .dd-pop-head{display:flex;align-items:center;justify-content:space-between;gap:8px;height:38px;padding:0 6px 0 12px;font-size:12px;font-weight:600;flex:none}
  .dd-pop-head button{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:#8f8f98;cursor:pointer;transition:background .15s ease,color .15s ease}
  .dd-pop-head button:hover{background:rgba(0,0,0,.06);color:#1c1c21}
  .dd-pop-head button:focus-visible{outline:2px solid #4f46e5;outline-offset:1px}
  .dd-pop-head-actions{display:flex;align-items:center;gap:6px;flex:none}
  .dd-kbd{display:inline-flex;align-items:center;height:18px;padding:0 6px;border:1px solid #ececf0;border-radius:5px;background:#f7f7f9;color:#8f8f98;font:inherit;font-size:9.5px;font-weight:500;line-height:1;white-space:nowrap}
  .dd-pop textarea{box-sizing:border-box;width:calc(100% - 20px);margin:0 10px;height:96px;resize:none;border:1px solid #ececf0;border-radius:8px;outline:none;background:#f7f7f9;color:#1c1c21;padding:8px 10px;font:inherit;font-size:12px;line-height:1.6;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease}
  .dd-pop textarea::placeholder{color:#96969f}
  .dd-pop textarea:hover{background:#f4f4f7}
  .dd-pop textarea:focus{background:#fff;border-color:#c9c9d2;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
  .dd-pop textarea.dd-pop-url{height:76px;overflow-y:auto;word-break:break-all;overflow-wrap:anywhere}
  .dd-pop input{box-sizing:border-box;width:calc(100% - 20px);margin:0 10px;height:34px;border:1px solid #ececf0;border-radius:8px;outline:none;background:#f7f7f9;color:#1c1c21;padding:0 10px;font:inherit;font-size:12px}
  .dd-pop input:focus{background:#fff;border-color:#c9c9d2;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
  .dd-pop-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px 10px;flex:none}
  .dd-pop-hint{font-size:10px;color:#8f8f98;line-height:1.45;min-width:0}
  .dd-send{border:0;border-radius:7px;height:26px;padding:0 12px;background:#1c1c21;color:#fff;font:inherit;font-size:11px;font-weight:500;cursor:pointer;flex:none;transition:background .15s ease}
  .dd-send:hover:not(:disabled){background:#33333c}
  .dd-send:disabled{background:#e9e9ee;color:#a4a4ad;cursor:default}
  .dd-pop-link{top:50%;max-height:calc(100% - 12px)}
  .dd-link-history{flex:0 1 auto;min-height:0;max-height:160px;overflow-y:auto;margin:6px 10px 0;padding:2px 0 0;border-top:1px solid #f0f0f3}
  .dd-link-history-title{padding:4px 2px;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;color:#a0a0a8}
  .dd-link-empty{margin:6px 10px 0;padding:10px 0;border-top:1px solid #f0f0f3;text-align:center;font-size:10px;line-height:1.5;color:#a0a0a8}
  .dd-link-row{display:flex;align-items:center;gap:1px;border-radius:6px}
  .dd-link-row:hover{background:#f4f4f7}
  .dd-link-pick{flex:1;min-width:0;display:flex;align-items:center;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;padding:6px;text-align:left;cursor:pointer}
  .dd-link-url{flex:1;min-width:0;font-size:10.5px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dd-link-row[data-pinned="true"] .dd-link-url{color:#4f46e5}
  .dd-link-pick:hover .dd-link-url{color:#4f46e5}
  .dd-link-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:#a0a0a8;cursor:pointer}
  .dd-link-icon:hover{color:#1c1c21}
  .dd-link-pin[data-pinned="true"]{color:#4f46e5}
  .dd-link-pin[data-pinned="true"] svg{fill:currentColor}
  .dd-link-remove:hover{color:#dc2626}
  .dd-menu{position:absolute;left:8px;top:40px;width:238px;max-height:300px;overflow-y:auto;padding:4px;background:#232327;border:1px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:8}
  .dd-menu-title{padding:5px 7px 4px;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase;color:#71717a}
  .dd-menu-item{display:flex;align-items:center;gap:7px;width:100%;height:30px;padding:0 7px;border:0;border-radius:6px;background:transparent;color:#e4e4e7;cursor:pointer;font:inherit;text-align:left}
  .dd-menu-item:hover{background:rgba(255,255,255,.07)}
  .dd-menu-item[data-active="true"]{background:rgba(99,102,241,.18)}
  .dd-menu-item span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
  .dd-menu-item em{flex:none;margin-left:auto;font-style:normal;font-size:9.5px;color:#71717a}
  .dd-notice{position:absolute;left:50%;bottom:68px;transform:translateX(-50%);max-width:300px;padding:6px 11px;border-radius:7px;background:rgba(24,24,27,.94);border:1px solid rgba(255,255,255,.14);color:#e4e4e7;font-size:11px;line-height:1.45;text-align:center;z-index:9;box-shadow:0 8px 20px rgba(0,0,0,.3);pointer-events:auto}
  .dd-picker{position:fixed;z-index:9500;width:min(320px,calc(100vw - 16px));display:flex;flex-direction:column;background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay));-webkit-backdrop-filter:blur(24px) saturate(1.8);backdrop-filter:blur(24px) saturate(1.8);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 18px 44px -14px rgba(15,17,21,.24),0 4px 12px -6px rgba(15,17,21,.1);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit;pointer-events:auto;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;animation:dd-picker-in .14s cubic-bezier(.2,.8,.3,1)}
  @keyframes dd-picker-in{from{opacity:0;transform:translateY(-4px) scale(.99)}to{opacity:1;transform:none}}
  .dd-picker-scroll{flex:1;min-height:0;overflow-y:auto;padding:4px 0 4px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2) transparent}
  .dd-picker-scroll::-webkit-scrollbar{width:8px}
  .dd-picker-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-scrollbar-bg-l2);border:2px solid transparent;border-radius:4px;background-clip:content-box}
  .dd-picker-section{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 14px;margin-top:6px;font-size:11px;font-weight:500;line-height:16px;letter-spacing:.02em;color:var(--dsw-alias-label-secondary)}
  .dd-picker-section:first-child{margin-top:0;padding-top:8px}
  .dd-picker-count{font-size:10.5px;font-weight:500;color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums}
  .dd-picker-row{display:flex;align-items:center;gap:2px;margin:0 6px;padding:7px 8px;border-radius:9px;transition:background .12s ease}
  .dd-picker-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
  .dd-picker-row[data-static="true"]:hover{background:transparent}
  .dd-picker-row[data-static="true"] .dd-picker-main{cursor:default}
  .dd-picker-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;text-align:left;padding:0;cursor:pointer}
  .dd-picker-main:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
  .dd-picker-line{display:flex;align-items:center;gap:7px;min-width:0}
  .dd-picker-glyph{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-tertiary)}
  .dd-picker-name{font-size:12.5px;font-weight:500;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dd-picker-detail{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:23px}
  .dd-picker-status{flex:none;display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 6px;border-radius:999px;font-size:10px;font-weight:500;line-height:1;white-space:nowrap}
  .dd-picker-status::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor;flex:none}
  .dd-picker-status[data-state="booted"]{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);color:var(--dsw-alias-state-success-primary)}
  .dd-picker-status[data-state="starting"]{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);color:var(--dsw-alias-label-secondary)}
  .dd-picker-status[data-state="starting"]::before{background:transparent;border:1.5px solid currentColor}
  .dd-picker-icon{flex:none;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;transition:background .12s ease,color .12s ease}
  .dd-picker-icon:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
  .dd-picker-icon:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
  .dd-picker-icon[data-danger="true"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}
  .dd-picker-icon:disabled{opacity:.4;cursor:default}
  .dd-picker-start{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:5px;height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;font-weight:500;line-height:1;white-space:nowrap;cursor:pointer;transition:background .12s ease,border-color .12s ease}
  .dd-picker-start:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-fill);border-color:var(--dsw-alias-border-l3)}
  .dd-picker-start:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
  .dd-picker-start:disabled{opacity:.45;cursor:default}
  .dd-picker-more{display:flex;align-items:center;justify-content:center;gap:4px;width:calc(100% - 12px);height:28px;margin:2px 6px 2px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer;transition:background .12s ease,color .12s ease}
  .dd-picker-more:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
  .dd-picker-more svg{transition:transform .15s ease}
  .dd-picker-more[data-expanded="true"] svg{transform:rotate(180deg)}
  .dd-picker-empty{padding:16px 14px;text-align:center;font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
  .dd-picker-empty-inline{padding:8px 14px 10px;text-align:left}
  .dd-picker-notice{margin:6px 6px 4px;padding:6px 8px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover);font-size:11px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
  .dd-picker-wifi{flex:none;display:flex;flex-direction:column;gap:6px;padding:10px 12px 12px;border-top:1px solid var(--dsw-alias-border-l1)}
  .dd-picker-wifi-row{display:flex;align-items:center;gap:6px}
  .dd-picker-wifi-row > svg{flex:none;color:var(--dsw-alias-label-caption)}
  .dd-picker-input{flex:1;min-width:0;height:30px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;outline:none;transition:border-color .12s ease,box-shadow .12s ease}
  .dd-picker-input::placeholder{color:var(--dsw-alias-label-caption)}
  .dd-picker-input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)}
  .dd-picker-connect{flex:none;display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 12px;border:1px solid transparent;border-radius:8px;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);font:inherit;font-size:12px;font-weight:500;line-height:1;white-space:nowrap;cursor:pointer;transition:background .12s ease,color .12s ease}
  .dd-picker-connect:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
  .dd-picker-connect:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
  .dd-picker-connect:disabled{background:color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);color:var(--dsw-alias-label-caption);cursor:default}
  .dd-picker-result{display:flex;align-items:center;gap:4px;font-size:11px;line-height:1.4;color:var(--dsw-alias-label-secondary);overflow:hidden}
  .dd-picker-result[data-ok="false"]{color:var(--dsw-alias-state-error-primary)}
  .dd-picker-result[data-ok="true"]{color:var(--dsw-alias-state-success-primary)}
  .dd-picker-spinner{width:11px;height:11px;border:1.5px solid color-mix(in srgb, currentColor 25%, transparent);border-top-color:currentColor;border-radius:50%;animation:dd-spin .8s linear infinite;display:inline-block;flex:none}
  .dd-shot-mask{position:fixed;inset:0;z-index:9450;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.5);backdrop-filter:blur(2px)}
  .dd-shot-panel{width:min(560px,calc(100vw - 32px));max-height:min(72vh,640px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit;animation:dd-in .16s ease-out}
  .dd-shot-head{flex:none;display:flex;align-items:flex-start;gap:10px;padding:12px 12px 10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
  .dd-shot-titles{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
  .dd-shot-titles strong{font-size:12.5px;font-weight:600}
  .dd-shot-titles span{font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
  .dd-shot-close{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
  .dd-shot-close:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
  .dd-shot-clear{flex:none;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;line-height:1;cursor:pointer}
  .dd-shot-clear:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
  .dd-shot-clear[data-confirm="true"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
  .dd-shot-clear:disabled{opacity:.45;cursor:default}
  .dd-shot-grid{flex:1;min-height:0;overflow-y:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;align-content:start}
  .dd-shot-item{position:relative;display:flex;flex-direction:column;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:#000;overflow:hidden;color:var(--dsw-alias-label-primary);font:inherit;text-align:center;transition:border-color .15s ease}
  .dd-shot-item:hover{border-color:var(--dsw-alias-brand-primary)}
  .dd-shot-item[data-busy="true"]{border-color:var(--dsw-alias-brand-primary)}
  .dd-shot-pick{display:flex;flex-direction:column;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:center;cursor:pointer}
  .dd-shot-pick:disabled{cursor:default}
  .dd-shot-remove{position:absolute;top:3px;right:3px;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:rgba(9,9,11,.62);color:#fafafa;cursor:pointer;opacity:0;transition:opacity .12s ease,background .12s ease}
  .dd-shot-item:hover .dd-shot-remove,.dd-shot-remove:focus-visible{opacity:1}
  .dd-shot-remove:hover{background:#dc2626}
  .dd-shot-remove:disabled{display:none}
  .dd-shot-item img{display:block;width:100%;aspect-ratio:9/16;object-fit:contain;background:#000;opacity:.92}
  .dd-shot-pick:hover img{opacity:1}
  .dd-shot-time{display:block;padding:4px 2px;font-size:9.5px;line-height:1.3;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--dsw-alias-bg-base)}
  .dd-shot-item[data-busy="true"] .dd-shot-time{color:var(--dsw-alias-brand-primary)}
  .dd-shot-state{flex:1;min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 18px;text-align:center;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
  .dd-shot-state .dd-spinner{border-color:color-mix(in srgb, var(--dsw-alias-label-secondary) 25%, transparent);border-top-color:var(--dsw-alias-brand-primary)}
  .dd-shot-error{flex:none;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:10.5px;line-height:1.45;color:var(--dsw-alias-state-error-primary)}
`;

// src/client/index.js
function makeMirrorHost(ctx) {
  return function DeviceMirrorHost() {
    const open = useSharedOpen();
    const platform = useSharedPlatform();
    const shotSession = useShotPickerSession();
    (0, import_react8.useEffect)(() => {
      const onKeyDown = (event) => {
        if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        if (event.repeat) return;
        if (String(event.key).toLowerCase() !== "m") return;
        event.preventDefault();
        event.stopPropagation();
        setSharedOpen(!shared.open);
      };
      window.addEventListener("keydown", onKeyDown, true);
      return () => window.removeEventListener("keydown", onKeyDown, true);
    }, []);
    return (0, import_react8.createElement)(
      import_react8.Fragment,
      null,
      (0, import_react8.createElement)("style", { "data-dsh-device-deck": "" }, CSS),
      open ? import_react_dom5.default.createPortal(
        platform === "ios" ? (0, import_react8.createElement)(IosPanel, {
          ctx,
          onClose: () => setSharedOpen(false)
        }) : (0, import_react8.createElement)(Panel, {
          ctx,
          onClose: () => setSharedOpen(false)
        }),
        document.body
      ) : null,
      shotSession ? (0, import_react8.createElement)(ShotPicker, {
        ctx,
        sessionId: shotSession,
        onClose: () => closeShotPicker(shotSession)
      }) : null
    );
  };
}
function ShotMenuIcon({ size = 14 }) {
  return (0, import_react8.createElement)(Icon, { name: "camera", size });
}
var index_default = {
  inject: ["slots", "sessions", "locale", "conversation"],
  apply(ctx) {
    const Launcher = makeLauncher(ctx);
    const MirrorHost = makeMirrorHost(ctx);
    ctx.slots.inject(
      "shell.overlay",
      () => ctx.slots.register({
        name: "shell.overlay",
        id: "device-deck-mirror",
        order: 20
      }, MirrorHost)
    );
    ctx.slots.inject(
      "conversation.session.header.utilities",
      () => ctx.slots.register({
        name: "conversation.session.header.utilities",
        id: "device-deck",
        order: 10
      }, Launcher)
    );
    ctx.inject(["commandUi"], (scope) => {
      const commands = scope.get("commandUi");
      scope.effect(() => commands.register({
        name: "device-shot",
        label: () => currentCopy(ctx).menuShot,
        description: () => currentCopy(ctx).menuShotHint,
        icon: ShotMenuIcon,
        available: (session) => Boolean(session?.sessionId && ctx.sessions?.binding?.(session.sessionId)),
        ui: {
          kind: "action",
          run: (session) => {
            openShotPicker(session.sessionId);
          }
        }
      }), "device-deck: screenshot command");
    });
  }
};
    return module.exports.default ?? module.exports;
  },
});
