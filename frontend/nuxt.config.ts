import path from 'path';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  
  // devServer configuration
  devServer: {
    host: '127.0.0.1',
    https: {
      key: path.resolve(__dirname, './cert.key'),  // Resolve path to the key
      cert: path.resolve(__dirname, './cert.crt')  // Resolve path to the certificate
    }
  },
  app: {
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
