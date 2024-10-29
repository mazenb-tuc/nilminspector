import State from "@/classes/state"
import Canvas from "@/classes/canvas"

export default function replot(state: State, canvas: Canvas) {
    canvas.clear()
    state.fig?.plot();
}