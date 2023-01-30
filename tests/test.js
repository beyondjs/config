const fs = require('fs');
const {join} = require('path');
const {Config} = require('../index');

describe('reading config', () => {
    test('generate sources', async () => {
        const path = process.cwd();
        const tpl = join(path, 'tpl');
        const toCreate = join(path, 'sources');
        try {
            if (!fs.existsSync(tpl)) {
                console.error('template directory not found');
                return;
            }

            const copy = require('./copy')(fs);
            await copy(tpl, toCreate);
        }
        catch (e) {
            console.error(e.stack);
        }
    });
    test('read beyond.json and set config', async () => {
        const path = join(process.cwd(), 'sources');
        const config = new Config(path, {
            '/applications': 'array',
            '/applications/children/template': 'object',
            '/applications/children/template/application': 'object',
            '/applications/children/template/global': 'object',
            '/applications/children/template/processors': 'object',
            '/applications/children/template/overwrites': 'object'
        });
        config.data = 'beyond.json';

        const applications = config.get('applications');
        await applications.ready;

        const application = [...applications.items.values()][0];
        await application.ready;

        const template = application.get('template');
        await template.ready;

        const overwrites = template.get('overwrites');
        await overwrites.ready;
    });
    test('write package.json to generate error', async () => {
        const target = 'sources/package.json';
        const content = JSON.parse(fs.readFileSync(target, "utf-8"));

        // objet with error
        content.dependencies = {
            '@beyond-js/local': '~0.1.1',
            '@beyond-js/kernel': '~0.1.5',
            '@beyond-js/svelte-widgets': '~0.1.0',
            '@beyond-js/react-widgets': '18.20.4',
        }

        fs.writeFileSync(target, JSON.stringify(content));
    });
});