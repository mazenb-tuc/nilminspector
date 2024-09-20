import State from "@/classes/state";
import Elms from "@/classes/elms";
import Canvas from "@/classes/canvas";

import { Snapshot } from "@/types/common";


function createSnapshot(state: State, elms: Elms): Snapshot | undefined {
    const snapshotDesc = elms.snapshot.desc.value;
    let snapshotName = elms.snapshot.name.value;

    // name is not provided
    if (snapshotName === "") {
        let lastSnapshotName = "Snapshot"

        // previous name was provided? => use it
        if (state.snapshots.length > 0) {
            lastSnapshotName = state.snapshots[state.snapshots.length - 1].name;
        }

        // current snapshot count for the name
        let currSnapshotCount = state.snapshots.length;

        // previous name ends with a number? => use it as the current count
        const match = lastSnapshotName.match(/\d+$/);
        if (match) {
            currSnapshotCount = parseInt(match[0].trim());
            lastSnapshotName = lastSnapshotName.replace(match[0], "");
        }

        // add current snapshot count to make it unique
        snapshotName = `${lastSnapshotName} ${currSnapshotCount + 1}`;
    }


    // make sure the name is unique
    if (state.snapshots.some((snapshot) => snapshot.name === snapshotName)) {
        alert("Snapshot name must be unique");
        return;
    }

    // copy plot canvas to an image
    const img = new Image();
    img.src = elms.draw.canvas.toDataURL();
    img.width = elms.draw.canvas.width;
    img.height = elms.draw.canvas.height;

    // copy legend (modify id to not conflict with the original one)
    const legend = elms.draw.legend.cloneNode(true) as HTMLElement;
    legend.id = `legend-${snapshotName}`;

    // copy info (without elms with the class ephemeral)
    const info = elms.draw.info.cloneNode(true) as HTMLElement;
    info.id = `info-${snapshotName}`;
    const ephemeralElms = info.querySelectorAll(".ephemeral");
    ephemeralElms.forEach((elm) => elm.remove());

    // copy the fm node (although it may be empty)
    const fm = elms.fm.canvasContainer.cloneNode(true) as HTMLElement;
    fm.id = `fm-${snapshotName}`;
    const fm_imgs_dataurl: string[] = [];
    elms.fm.canvasContainer.querySelectorAll("canvas").forEach((canvas) => {
        fm_imgs_dataurl.push(canvas.toDataURL());
    });

    return {
        name: snapshotName,
        desc: snapshotDesc,
        pred_error: JSON.parse(JSON.stringify(state.lastErrors)), // deep copy
        img, legend, info, fm, fm_imgs_dataurl,
    }
}

function take(state: State, elms: Elms) {
    const currSnapshot = createSnapshot(state, elms);
    if (currSnapshot === undefined) return;

    // add to state
    state.snapshots.push(currSnapshot);

    // create header for the snapshot
    const headerContinaer = document.createElement("div");
    const header = document.createElement("h3");
    header.appendChild(document.createTextNode(currSnapshot.name));
    headerContinaer.appendChild(header);

    // add description if provided
    if (currSnapshot.desc !== "") {
        const desc = document.createElement("p");
        desc.appendChild(document.createTextNode(currSnapshot.desc));
        headerContinaer.appendChild(desc);
    }

    // plot and img in horizontal layout
    const drawAreaContainer = document.createElement("div");
    drawAreaContainer.classList.add("draw-area");
    drawAreaContainer.appendChild(currSnapshot.img);
    drawAreaContainer.appendChild(currSnapshot.legend);
    drawAreaContainer.appendChild(currSnapshot.info);
    drawAreaContainer.appendChild(currSnapshot.fm);

    // plot fm images
    currSnapshot.fm_imgs_dataurl.forEach((dataurl, i) => {
        const img = new Image();
        img.src = dataurl;
        // copy image to canvas
        img.onload = () => {
            const canvas = drawAreaContainer.querySelectorAll("canvas")[i] as HTMLCanvasElement;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
        }
    });

    // create snapshot element
    const snapshotElm = document.createElement("div");
    snapshotElm.classList.add("snapshot");
    snapshotElm.appendChild(headerContinaer);
    snapshotElm.appendChild(drawAreaContainer);

    // button to remove the snapshot
    const removeButton = document.createElement("button");
    removeButton.appendChild(document.createTextNode("Remove"));
    removeButton.addEventListener("click", () => {
        snapshotElm.remove();
        state.snapshots = state.snapshots.filter((snapshot) => snapshot.name !== currSnapshot.name);
    })
    snapshotElm.appendChild(removeButton);

    // button to load the snapshot
    const loadButton = document.createElement("button");
    loadButton.appendChild(document.createTextNode("Load"));
    loadButton.addEventListener("click", () => {
        alert("TODO")
    })
    snapshotElm.appendChild(loadButton);

    // append to the snapshots container
    elms.snapshotsContainer.appendChild(snapshotElm);
}

function save() {
    alert("TODO")
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    elms.snapshot.take.addEventListener("click", () => take(state, elms));
    elms.snapshot.save.addEventListener("click", () => save());
}
