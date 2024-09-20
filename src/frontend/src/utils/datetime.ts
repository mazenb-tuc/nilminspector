// a datetime string with timezone information
// e.g. 2016-12-26T00:00:00+3:00
// e.g. 2016-12-26T00:00:00Z
export type ISOTimeStamp = string;
export type ISOTimeStampStampedData = {
    [key: ISOTimeStamp]: number;
}

// a datetime string without any timezone information
// e.g. 2016-12-26T00:00:00
// note: calling new Date(simpleDateString) will create a date object in the local timezone
export type SimpleDateString = string;
export type SimpleDateStringStampedData = {
    [key: SimpleDateString]: number;
}

export function validateSimpleDateString(date: SimpleDateString): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date);
}

export function isoDateStringToSimpleDateString(isoDateString: string): SimpleDateString {
    let result = "";
    const minusRegEx = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(-\d{2}:\d{2})/

    // is UTC (ends with Z)
    if (isoDateString.endsWith('Z')) {
        // remove Z
        result = isoDateString.slice(0, -1);
    }

    // has + after the time
    else if (isoDateString.includes('+')) {
        // remove the timezone offset
        result = isoDateString.slice(0, isoDateString.indexOf('+'));
    }

    // has - after the time
    else if (minusRegEx.test(isoDateString)) {
        // remove the timezone offset
        result = isoDateString.replace(minusRegEx, '$1');
    }

    // no timezone offset
    else {
        result = isoDateString;
    }

    // remove the .XXX part as in 2014-09-01T14:01:00.345 -> 2014-09-01T14:01:00
    if (result.includes('.')) {
        result = result.slice(0, result.indexOf('.'));
    }

    if (!validateSimpleDateString(result)) {
        throw new Error(`Invalid ISO string ${isoDateString}: cannot be converted to simple date string (result: ${result})`);
    }

    return result;
}

export function dateToSimpleDateString(date: Date): SimpleDateString {
    return isoDateStringToSimpleDateString(date.toISOString())
}

export function isoTimeStampedDataToSimpleDateStringStampedData(isoTimeStampedData: ISOTimeStampStampedData): SimpleDateStringStampedData {
    const result: SimpleDateStringStampedData = {};

    for (const isoTimeStamp in isoTimeStampedData) {
        result[isoDateStringToSimpleDateString(isoTimeStamp)] = isoTimeStampedData[isoTimeStamp];
    }

    return result;
}

export function getTimeFromSimpleDateString(date: SimpleDateString): string {
    if (!validateSimpleDateString(date)) {
        throw new Error(`Invalid simple date string ${date}`);
    }
    return date.split('T')[1];
}

export function getDateFromSimpleDateString(date: SimpleDateString): string {
    if (!validateSimpleDateString(date)) {
        throw new Error(`Invalid simple date string ${date}`);
    }
    return date.split('T')[0];
}
