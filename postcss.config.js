export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Enhanced browser support for cross-compatibility
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'Firefox ESR',
        'not dead',
        'not IE 11',
        'Chrome >= 88',
        'Firefox >= 85',
        'Safari >= 14',
        'Edge >= 88'
      ],
      // Add vendor prefixes for experimental features
      grid: 'autoplace',
      flexbox: 'no-2009',
      // Support for CSS custom properties
      supports: true,
      // Add prefixes for backdrop-filter
      cascade: true
    },
  },
}
