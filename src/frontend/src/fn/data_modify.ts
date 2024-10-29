import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // either mains OR gt and NOT BOTH
    elms.data.modify.mains.enabled.addEventListener("change", () => {
        elms.data.modify.gt.enabled.checked = false
    })

    elms.data.modify.gt.enabled.addEventListener("change", () => {
        elms.data.modify.mains.enabled.checked = false
    })
}
