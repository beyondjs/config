jest.setTimeout(20000);

const fs = require('fs');
const {join} = require('path');
const copy = require('./copy')(fs);

describe('reading config', () => {
    test('generate test sources', async () => {
        const path = process.cwd();
        const tpl = join(path, 'tpl');
        const toCreate = join(path, 'sources');
        try {
            if (!fs.existsSync(tpl)) {
                console.error('template directory not found');
                return;
            }
            await copy(tpl, toCreate);
        }
        catch (e) {
            console.error(e.stack);
        }
    });
    test('read beyond.json and set config', async () => {
        const path = join(process.cwd(), 'sources');
        const {Config} = require('../../index');
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
        let target = 'sources/package.json';
        let content = `
            {
              "name": "test-config-app",
              "template": "template/template.json",
              "dependencies": {
                "@beyond-js/local": "~0.1.1",
              }
            }
        `;
        await fs.writeFileSync(target, content);
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
    test('clean test', async () => {
        const target = 'sources/package.json';
        const content = `
{
  "name": "test-config-app",
  "template": "template/template.json",
  "dependencies": {
    "@beyond-js/local": "~0.1.1",
    "@beyond-js/kernel": "~0.1.5",
    "@beyond-js/svelte-widgets": "~0.1.0",
    "@beyond-js/react-widgets": "18.20.4"
  }
}
        `;
        await fs.writeFileSync(target, content);
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
});