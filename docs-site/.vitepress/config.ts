import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'HIVE-R',
    description: 'Your AI Development Team - 13 AI agents that work together to build your product',

    base: '/docs/',

    head: [
        ['link', { rel: 'icon', href: '/docs/logo.svg' }]
    ],

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'API', link: '/api/endpoints' },
            { text: 'Studio', link: 'https://hive-r.com/app' }
        ],

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Installation', link: '/guide/installation' },
                    { text: 'Quick Start', link: '/guide/quick-start' }
                ]
            },
            {
                text: 'Concepts',
                items: [
                    { text: 'The 13 Agents', link: '/concepts/agents' },
                    { text: 'Subgraphs', link: '/concepts/subgraphs' },
                    { text: 'Architecture', link: '/concepts/architecture' }
                ]
            },
            {
                text: 'API Reference',
                items: [
                    { text: 'Endpoints', link: '/api/endpoints' },
                    { text: 'Streaming', link: '/api/streaming' },
                    { text: 'Authentication', link: '/api/authentication' }
                ]
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Prompting Guide', link: '/reference/prompts' },
                    { text: 'Design Systems', link: '/reference/design-systems' },
                    { text: 'Security', link: '/reference/security' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/HIVE-R/hive-r' }
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2026 HIVE-R'
        },

        search: {
            provider: 'local'
        }
    }
})
