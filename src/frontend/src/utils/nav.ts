function getNavElms(): (HTMLInputElement | HTMLButtonElement | HTMLSelectElement)[] {
    const buttons = Array.from(document.querySelectorAll("button"));
    const inputs = Array.from(document.querySelectorAll("input"));
    const selects = Array.from(document.querySelectorAll("select"));
    const navElms = [
        ...buttons,
        ...inputs,
        ...selects,
    ]

    // filter out any elm with the class "navExclude"
    return navElms.filter((el) => !el.classList.contains("navExclude"));
}

export function disableNavElms() {
    getNavElms().forEach((el) => {
        el.disabled = true;
    });
}

export function enableNavElms() {
    getNavElms().forEach((el) => {
        el.disabled = false;
    })
}
