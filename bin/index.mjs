#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import figlet from 'figlet';
import capitalise from 'capitalize';
import chalk from 'chalk';
import minimist from 'minimist';
import runWebmonkey from '../src/index.mjs';
import { getHooks } from './utils.mjs';

const argv = minimist(process.argv.slice(2));
const bin = path.dirname(new URL(import.meta.url).pathname);
const pkg = JSON.parse(
    fs.readFileSync(path.resolve(`${bin}/../package.json`), 'utf8')
);

async function main() {
    const header = figlet.textSync(capitalise(pkg.name), { font: 'univers' });
    header && console.log(chalk.gray(header));
    console.log(
        '\n',
        chalk.gray('Version:'.padStart(header ? 121 : 0)),
        pkg.version,
        '\n\n'
    );
    return await runWebmonkey(await getHooks(argv.hooks));
}

main();
