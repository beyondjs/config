/**
 * Recursively copy all files of a directory
 */
module.exports = fs => async function (source, target) {
    'use strict';

    const copy = async function (source, target) {
        if ((await fs.statSync(source)).isFile()) {
            await fs.copyFileSync(source, target);
            return;
        }

        const files = await fs.readdirSync(source);
        for (let file of files) {
            const from = require('path').join(source, file);
            const to = require('path').join(target, file);

            const stat = await fs.statSync(from);
            if (stat.isDirectory()) {
                await fs.mkdirSync(to);
                await copy(from, to);
            }
            else if (stat.isFile()) {
                await fs.copyFileSync(from, to);
            }
        }
    };

    if (fs.existsSync(target)) await fs.promises.rm(target, {recursive: true});

    await fs.mkdirSync(target, {'recursive': true});
    await copy(source, target);
};
