// The native geolocation module is unavailable in Jest. Tests set the behaviour they need.
module.exports = {
  __esModule: true,
  default: {
    requestAuthorization: jest.fn(),
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
    setRNConfiguration: jest.fn(),
  },
};
