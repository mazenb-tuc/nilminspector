import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

function replot(state: State, canvas: Canvas) {
    canvas.clear()
    state.fig?.plot();
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    elms.suntimes.show.addEventListener("change", () => {
        replot(state, canvas)
    });

    elms.suntimes.lineWidth.addEventListener("change", () => {
        replot(state, canvas)
    });
}
