const fs = require('fs');
const path = require('path');

const WIN32 = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe',
  'C:\\\Program Files (x86)\\\Google\\\Chrome\\\Application\\chrome.exe'
];

const DARWIN = [];

async function findExecutable() {
  let expected = '';

  if (process.platform === 'win32') {
    expected = WIN32.find((e) => fs.existsSync(e));
  } else if (process.platform === 'darwin') {
    expected = DARWIN.find((e) => fs.existsSync(e));
  }

  if (!expected) {
    return prompt('Please enter the path to a Chromium-based browser:')
  }
}

module.exports = { findExecutable }
