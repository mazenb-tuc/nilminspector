import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

const replot = (state: State, canvas: Canvas, elms: Elms) => {
    canvas.clear()
    state.fig?.plot();
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // toggle show checkbox -> redraw
    elms.mean.show.addEventListener("change", () => replot(state, canvas, elms));
}