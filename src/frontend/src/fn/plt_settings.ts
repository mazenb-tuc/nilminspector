import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import replot from "@/utils/replot"
import constants from "@/utils/constants";



export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // for each plot setting, add a selector option
    Object.entries(constants.pltSettings).forEach(([settingsName, _]) => {
        const option = document.createElement("option")
        option.value = settingsName
        option.innerText = settingsName
        elms.plot.load.selector.appendChild(option)
    })

    elms.plot.load.loadBtn.addEventListener("click", async () => {
        const selectedSettingsName = elms.plot.load.selector.value as keyof typeof constants.pltSettings
        const selectedSettings = constants.pltSettings[selectedSettingsName]

        elms.plot.lineWidth.value = selectedSettings.lineWidth.toString()

        elms.canvasCtrl.width.value = selectedSettings.canvas.width.toString()
        elms.canvasCtrl.height.value = selectedSettings.canvas.height.toString()

        elms.plot.padding.buttom.value = selectedSettings.padding.buttom.toString()
        elms.plot.padding.top.value = selectedSettings.padding.top.toString()
        elms.plot.padding.left.value = selectedSettings.padding.left.toString()
        elms.plot.padding.right.value = selectedSettings.padding.right.toString()

        elms.plot.labels.fontSize.value = selectedSettings.labels.fontSize.toString()
        elms.plot.labels.padding.buttom.input.value = selectedSettings.labels.padding.buttom.toString()

        elms.plot.labels.every.y.value = selectedSettings.labels.every.y.toString()
        elms.plot.labels.every.startFromZeroW.checked = selectedSettings.labels.every.startFromZeroW

        replot(state, canvas)
    })
}
