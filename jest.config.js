module.exports = {
  preset: "ts-jest/presets/js-with-babel",
  clearMocks: true,
  setupFiles: [
    "./setupJest.js"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/node_modules/"
  ],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!@openinsights)",
  ],
};
