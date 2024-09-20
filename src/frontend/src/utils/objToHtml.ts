export default function objectToHtmlList(obj: object): string {
    const makeList = (obj: object): string => {
        return Object.entries(obj).map(([key, value]) => {
            // array of numbers (like norm_params) => format accordingly
            if (Array.isArray(value) && value.every(item => typeof item === 'number')) {
                return `<li><details><summary>${key}:</summary><ul>` +
                    value.map((num, index) => `<li><b>${index === 0 ? 'Mean' : 'Std'}:</b> ${num.toFixed(2)}</li>`).join('') +
                    `</ul></details></li>`;
            }
            // sub-object? => recurse
            else if (typeof value === 'object' && value !== null) {
                return `<li><details><summary>${key}:</summary><ul>${makeList(value)}</ul></details></li>`;
            }
            // number (like percentages or counts?
            else if (typeof value === 'number') {
                return `<li><b>${key}:</b> ${value % 1 === 0 ? value : value.toFixed(2)}</li>`;
            }
            // default to normal key/value pair
            return `<li><b>${key}:</b> ${value}</li>`;
        }).join('');
    };

    return `<ul>${makeList(obj)}</ul>`;
}