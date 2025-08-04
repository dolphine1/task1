export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // CSS Framework
  css: ['~/assets/css/tailwind.css'],
  
  // Modules
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt'
  ],
  
  // Compatibility date
  compatibilityDate: '2025-08-04'
})