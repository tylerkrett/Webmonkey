import path from 'path';
import puppeteer from 'puppeteer';
import * as R from 'ramda';
import moment from 'moment';
import delay from 'delay';
import * as utils from './utils';

let hasErrored = false;
let isNavigation = false;

export default async function main({
    url,
    debug,
    timeout,
    iterations,
    hooks,
    screenshots,
    helpers
}) {
    const options = debug ? { headless: false, devtools: true } : {};
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    utils.silenceDialogs(page);
    utils.exposeFunctions(page);

    const client = await page.target().createCDPSession();
    await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (4 * 1024 * 1024) / 8,
        uploadThroughput: (3 * 1024 * 1024) / 8,
        latency: 20
    });

    page.on('pageerror', async error => {
        hasErrored = true;
        helpers.log('error', error.toString());
        isNavigation && (await utils.awaitPage(page, timeout));
        await page.screenshot({
            path: path.resolve(
                screenshots,
                `webmonkey_error_${moment().format()}.png`
            ),
            fullPage: true
        });
        return void browser.close();
    });

    await hooks.create(page);
    await page.goto(url);
    await page.on('request', async request => {
        isNavigation = request.isNavigationRequest();
    });

    for (const _ of R.range(0, iterations + 1)) {
        !hasErrored && isNavigation && (await utils.awaitPage(page, timeout));
        await delay(utils.randomBetween(0, 1500));
        !hasErrored && (await utils.runBehaviour({ page, helpers }));
        void _;
    }

    await browser.close();
    await hooks.destroy(page);
}
