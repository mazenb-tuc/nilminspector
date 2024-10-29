import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import replot from "@/utils/replot"


export async function setup(state: State, canvas: Canvas, elms: Elms) {
    elms.suntimes.show.addEventListener("change", () => {
        replot(state, canvas)
    });

    elms.suntimes.lineWidth.addEventListener("change", () => {
        replot(state, canvas)
    });
}
