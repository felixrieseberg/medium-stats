const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const { table } = require("table");
const stringify = require("csv-stringify");

const { prompt } = require("./prompt");
const { findExecutable } = require("./executable");

const urlPromptText = `
Please enter the URL to your Medium statistics page. Examples:
- https://medium.com/@felixrieseberg/stats
- https://slack.engineering/stats/stories
`;

async function getTargetUrl() {
  const input = process.argv[process.argv.length - 1];

  if (input.startsWith("http")) {
    return input;
  } else {
    return prompt(urlPromptText);
  }
}

async function getTargetUrl() {
  const input = process.argv[process.argv.length - 1];

  if (input.startsWith("http")) {
    return input;
  } else {
    return prompt(urlPromptText);
  }
}

async function getLinks(page) {
  return page.$$eval("a", links => {
    return links.filter(a => a.textContent === "Details").map(a => a.href);
  });
}

async function getStats(page) {
  return page.$$eval("h2", elements => {
    let externalRefHeader = [...elements].find(h2 => {
      return h2.textContent === "External referrals";
    });
    let externalRefDiv = externalRefHeader.parentElement.parentElement;
    let externalRows = [...externalRefDiv.children];

    // Remove the first one
    externalRows.splice(0, 1);

    const data = {};

    for (const child of externalRows) {
      const title = child.children[0].textContent;
      const num = child.children[1].children[0].textContent;
      let finalNum = num;

      if (num.includes(".")) {
        finalNum = finalNum.replace(".", "");
        finalNum = finalNum.replace("K", "00");
      } else {
        finalNum = finalNum.replace("K", "000");
      }

      data[title] = (data[title] || 0) + parseInt(finalNum, 10);
    }

    return data;
  });
}

async function awaitUrl(page, url) {
  return new Promise(resolve => {
    console.log(`Now waiting for browser to reach ${url}. Please sign in!`);

    const interval = setInterval(async () => {
      const pageUrl = page.url();

      if (pageUrl === url) {
        process.stdout.write("");
        console.log(`Reached target url ${url}`);
        clearInterval(interval);
        resolve();
      }
    }, 750);
  });
}

function getSingleTable(data) {
  const rows = [];

  for (const key of Object.keys(data)) {
    rows.push([key, data[key]]);
  }

  return [["Source", "Visits"], ...rows];
}

function getTable(data) {
  const rows = [];

  for (const key of Object.keys(data)) {
    rows.push([key.toUpperCase(), ""]);
    rows.push(...getSingleTable(data[key]));
    rows.push(["", ""]);
  }

  return rows;
}

async function getCsv(table) {
  return new Promise((resolve, reject) => {
    stringify(table, (err, output) => {
      if (err) {
        return reject(err);
      }

      resolve(output);
    });
  });
}

async function main() {
  let data = {};
  let totals = {};
  let targetUrl = await getTargetUrl();

  console.log(`Opening browser. Please sign into Medium.`);

  const browser = await puppeteer.launch({
    executablePath: await findExecutable(),
    headless: false
  });
  const page = await browser.newPage();

  await page.goto(targetUrl);
  await awaitUrl(page, targetUrl);

  console.log(`Found target page ${targetUrl}`);

  const links = await getLinks(page);
  let i = 0;
  console.log(`Processing ${links.length} links`);

  for (const link of links) {
    await page.goto(link);
    await page.waitForXPath('//h2[text()="External referrals"]');
    const stats = await getStats(page);

    data[link] = stats;

    for (const key of Object.keys(stats)) {
      totals[key] = (totals[key] || 0) + stats[key];
    }

    i++;
    console.log(`${i}/${links.length} Processed ${link}`);
  }

  await browser.close();

  data["Totals"] = totals;

  const tableData = getTable(data);

  console.log(`\n We're done!\n`);
  console.log(table(tableData));

  fs.writeFileSync(
    path.join(process.cwd(), "medium_result.json"),
    JSON.stringify(data, undefined, 2)
  );
  fs.writeFileSync(
    path.join(process.cwd(), "medium_result.csv"),
    await getCsv(tableData)
  );

  console.log(`Results saved to medium_results.json and medium_results.csv`);
}

main();
