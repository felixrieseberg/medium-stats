const fs = require("fs");

const WIN32 = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
];

const DARWIN = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta"
];

async function findExecutable() {
  let expected;

  if (process.platform === "win32") {
    expected = WIN32.find(e => fs.existsSync(e));
  } else if (process.platform === "darwin") {
    expected = DARWIN.find(e => fs.existsSync(e));
  }

  if (!expected) {
    expected = await prompt(
      "Please enter the path to a Chromium-based browser"
    );
  }

  return expected;
}

module.exports = { findExecutable };
