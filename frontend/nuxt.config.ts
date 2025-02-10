import path from 'path';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  devServer: {
    host: '0.0.0.0', // Default: localhost
    port: 3000,      // Default: 3000
  },
  app: {
    baseURL: '/dnd/',
    cdnURL: 'https://patrikborzik.sk/dnd/',
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
})

