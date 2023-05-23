const {join} = require('path');

describe('reading config', () => {
    test('read beyond.json and set config', async () => {
        const path = join(process.cwd(), 'package');

        const callback = key => {
            console.log('hola callback', key);
            return 'hola callback'
        };
        const {Config} = require('../../index');
        const config = new Config(path, {
            '/applications': 'array',
            '/applications/children/template': 'object'
        });
        config.data = 'beyond.json';

        const applications = config.get('applications');
        await applications.ready;

        const application = [...applications.items.values()][0];
        await application.ready;

        const template = application.get('template');
        await template.ready;

        console.log(9, 'template', template.valid)
    });
});