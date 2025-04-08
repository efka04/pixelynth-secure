module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}', // Ensure Tailwind scans your files for classes
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                kdamThmorPro: ['Kdam Thmor Pro', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
