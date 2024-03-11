"use strict";

const { app, BrowserWindow, screen, protocol, ipcMain } = require("electron");
const path = require("path");
const homeDir = app.getPath("home");
const fs = require("fs");
const readline = require("readline");

const calculateWindowZoom = () => {
  const isSteamUi = process.env.SteamGamepadUI;
  const isOverlayUi = process.env.STEAM_OVERLAY;
  const useNativeRes = process.env.NATIVE_RESOLUTION;

  // Get scale factor for steamui
  let scaleFactor;
  let { width, height } = screen.getPrimaryDisplay().size;

  const ZOOM_RATIO = 1.1;
  const MAX_RATIO = 2;
  const RESOLUTION_BOOST = 1.3;

  if (isSteamUi || isOverlayUi) {
    if (useNativeRes) {
      // Assume we are on a screen the size of the deck
      // And add a bit of zoom even for that
      // This will launch in the panel's native resolution (laggy)
      scaleFactor = (ZOOM_RATIO * width) / 1280;
      scaleFactor = scaleFactor > 3 ? 3 : scaleFactor;
      console.error(
        "Launching in native resolution in steamui. Zoom factor: " + scaleFactor
      );
    } else {
      // Scale the display to be 30% more dense than the steam deck
      // Then apply the rest as scaling
      // Helps with performance
      let ratio = width / 1280 / RESOLUTION_BOOST;
      scaleFactor = ZOOM_RATIO * RESOLUTION_BOOST;
      if (ratio < 1) {
        ratio = 1;
      } else if (ratio > MAX_RATIO) {
        scaleFactor = (ZOOM_RATIO * ratio) / MAX_RATIO;
        scaleFactor = Math.round(10 * scaleFactor) / 10;
        ratio = MAX_RATIO;
      }

      width = Math.round(width / ratio);
      height = Math.round(height / ratio);
      console.error(
        `Launching in steamui in resolution ${width}x${height}. Zoom factor: ${scaleFactor}.`
      );
    }
  } else {
    scaleFactor = 1.0;
  }

  return { width, height, scaleFactor, isSteamUi, isOverlayUi };
};

const createMainWindow = async () => {
  let { width, height, scaleFactor, isSteamUi, isOverlayUi } =
    calculateWindowZoom();

  let mainWindow = new BrowserWindow({
    ...(isSteamUi || isOverlayUi
      ? { width: width, height: height, resizable: false }
      : { width: 1280, height: 800 }),
    show: false,
    ...(isOverlayUi && { transparent: true }),
    backgroundColor: "#1a202c",
    icon: path.join(__dirname, "./icon/android-chrome-512x512.png"),
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
      zoomFactor: scaleFactor,
      preload: path.join(__dirname, "./preload.js"),
    },
  });
  mainWindow.setMenu(null);
  if (isOverlayUi) mainWindow.setBackgroundColor("#00000000");

  fileProtocolRedirect();

  // Load a proper webpage so js can run
  const startURL = require("url").format({
    protocol: "file",
    slashes: true,
    // pathname: require("node:path").join(__dirname, "./static/build/index.html"),
    pathname: "index.html",
  });
  await mainWindow.loadURL(startURL);

  // Set appropriate initial state for the app
  let cmd;
  if (isOverlayUi) {
    cmd =
      `window.electronUtils.setUiType("closed");` +
      `window.electronUtils.setAppType("overlay");`;
  } else {
    cmd = `window.electronUtils.setAppType("app");`;
  }
  await mainWindow.webContents.executeJavaScript(cmd);

  // Attempt to autologin with user token
  try {
    console.error(`Checking dir '${homeDir}' for the user token.`);
    const token = fs.readFileSync(`${homeDir}/.config/hhd/token`, {
      encoding: "utf8",
      flag: "r",
    });

    const cmd = `window.electronUtils.login("${encodeURI(token)}");`;
    await mainWindow.webContents.executeJavaScript(cmd);
  } catch (err) {
    console.error("Token file not found, skipping autologin.");
  }

  await mainWindow.whenReady;

  mainWindow.webContents.zoomFactor = scaleFactor;
  mainWindow.show();

  // Handle Overlay Communication
  if (!isOverlayUi) return;

  const rl = readline.createInterface({
    input: process.stdin,
  });

  let currentType = "closed";

  // Inform hhd of the new status
  ipcMain.on("update-status", (_, stat) => {
    currentType = stat;
    console.log(`stat:${stat}`);
  });

  // Receive open and close commands
  rl.on("line", (line) => {
    if (!line.startsWith("cmd:")) return;
    const cmd = line.trim().substring(4);

    let uiType = null;
    switch (cmd) {
      case "open_qam":
        // If the user presses QAM again close
        if (currentType === "qam") {
          console.error("QAM is currently open, closing.");
          uiType = "closed";
        } else {
          uiType = "qam";
        }
        break;
      case "open_overlay":
      case "open_expanded":
        // If the user presses QAM for expanded and we are expanded close
        if (currentType === "expanded") {
          console.error("Currently expanded, closing.");
          uiType = "closed";
        } else {
          uiType = "expanded";
        }
        break;
      case "open_notification":
        uiType = "notification";
        break;
      case "close":
        uiType = "closed";
        break;
      case "close_now":
        uiType = "closed";
        console.log(`stat:closed`);
        break;
    }
    if (!uiType) return;

    if (mainWindow) {
      console.error(`Switching ui to '${uiType}'`);
      mainWindow.webContents.executeJavaScript(
        `window.electronUtils.setUiType("${uiType}");`
      );
    }
  });
};

function fileProtocolRedirect() {
  // Redirect local files to proper path
  // TODO: Fix this. Probably insecure.
  protocol.interceptFileProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substr(7); /* all urls start with 'file://' */
      callback({
        path: path.normalize(`${__dirname}/static/build/${url}`.split("#")[0]),
      });
    },
    (err) => {
      if (err) console.error("Failed to register protocol");
    }
  );
}

app.disableHardwareAcceleration();
app.whenReady().then(() => createMainWindow());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
