module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}', // Ensure Tailwind scans your files for classes
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                ppNeueMachina: ['PPNeueMachina', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
