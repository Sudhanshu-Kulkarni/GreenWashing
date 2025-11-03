export default {
  expo: {
    name: "ESG Claim Verification",
    slug: "esg-claim-verification",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Environment configuration
      environment: process.env.NODE_ENV || 'development',
      pythonBackendUrl: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',
      useMockData: process.env.USE_MOCK_DATA !== 'false'
    }
  }
};