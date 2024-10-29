// TODO: get BACKEND_PORT from env file

export default {
  backendApiUrl: "http://localhost:8000/api",
  canvasFontFamily: "Consolas,monaco,monospace",
  matplotlibColors: [
    "#2077B4",
    "#FF7F0E",
    "#2CA02C",
    "#D62728",
    "#9467BD",
    "#8C564B",
    "#E377C2",
    "#7F7F7F",
    "#BCBD22",
    "#17BECF",
  ],
  colors: {
    "sunrise": "#FFA500",
    "sunset": "#FF4500",
  },
  // default values for different elements
  defaults: {
    labels: {
      padding: {
        buttom: 25,
      }
    }
  },
  pltSettings: {
    Default: {
      lineWidth: 1,
      canvas: {
        width: 800,
        height: 600,
      },
      padding: {
        buttom: 30,
        top: 10,
        left: 70,
        right: 0,
      },
      labels: {
        fontSize: 10,
        padding: {
          buttom: 25,
        },
        every: {
          y: 140,
          startFromZeroW: false,
        },
      }
    },
    Paper: {
      lineWidth: 2,
      canvas: {
        width: 800,
        height: 600,
      },
      padding: {
        buttom: 46,
        top: 10,
        left: 70,
        right: 0,
      },
      labels: {
        fontSize: 15,
        padding: {
          buttom: 30,
        },
        every: {
          y: 200,
          startFromZeroW: true,
        },
      }
    },
    Presentation: {
      lineWidth: 2,
      canvas: {
        width: 800,
        height: 600,
      },
      padding: {
        buttom: 46,
        top: 10,
        left: 70,
        right: 0,
      },
      labels: {
        fontSize: 15,
        padding: {
          buttom: 30,
        },
        every: {
          y: 200,
          startFromZeroW: true,
        },
      }
    },
  }
};
