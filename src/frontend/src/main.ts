import "@/styles/common.css";
import "@/styles/mvp-mod.css";

import Elms from "@/classes/elms";
import Canvas from "@/classes/canvas";
import State from "@/classes/state";

import * as data from "@/fn/data/index";
import * as predict from "@/fn/predict";
import * as snapshot from "@/fn/snapshot";
import * as std from "@/fn/std";
import * as mean from "@/fn/mean";
import * as shift from "@/fn/shift";
import * as zoom from "@/fn/zoom";
import * as models from "@/fn/models";
import * as fm from "@/fn/fm";
import * as suntimes from "@/fn/suntimes";

import * as nav from "@/utils/nav";

const elms = new Elms();
const state = new State(elms);
const canvas = new Canvas(elms, state);

window.onload = async () => {
  nav.disableNavElms()

  await loadStyles();
  canvas.reset();
  await setup();

  // load and plot sample data on page load
  await data.random(state, canvas, elms);

  nav.enableNavElms()
};

async function loadStyles() {
  const css = document.createElement("link");
  css.rel = "stylesheet";

  css.href = "https://unpkg.com/mvp.css"
  // css.href = "https://matcha.mizu.sh/matcha.css"
  document.head.appendChild(css);
}

async function setup() {
  // ordered
  await state.setup()

  // in random order
  await Promise.all([
    data.setup(state, canvas, elms),
    predict.setup(state, canvas, elms),
    snapshot.setup(state, canvas, elms),
    std.setup(state, canvas, elms),
    mean.setup(state, canvas, elms),
    shift.setup(state, canvas, elms),
    zoom.setup(state, canvas, elms),
    models.setup(state, canvas, elms),
    fm.setup(state, canvas, elms),
    suntimes.setup(state, canvas, elms),
  ])
}