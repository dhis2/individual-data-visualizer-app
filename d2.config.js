/** @type {import('@dhis2/cli-app-scripts').D2Config} */
const config = {
    type: 'app',
    name: 'individual-data-visualizer',
    // id: TBD, needed to publish to the App Hub (see release.yml)
    title: 'Individual Data Visualizer',
    minDHIS2Version: '2.43.3',
    direction: 'auto',
    pwa: {
        enabled: true,
    },

    pluginType: 'DASHBOARD',

    entryPoints: {
        app: './src/app.ts',
        plugin: './src/dashboard-plugin.tsx',
    },

    viteConfigExtensions: 'vite-extensions.config.mts',
}

module.exports = config
