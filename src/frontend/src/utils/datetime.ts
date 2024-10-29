// a datetime string with timezone information
// e.g. 2016-12-26T00:00:00+3:00 or 2016-12-26T00:00:00Z
export type ISOTimeStamp = string;
export type ISOTimeStampStampedData = {
    [key: ISOTimeStamp]: number;
}

// a datetime string without any timezone information
// e.g. 2016-12-26T00:00:00
// note: calling new Date(simpleDateString) will create a date object in the local timezone
export type SimpleDateTimeString = string;
export type SimpleDateTimeStringStampedData = {
    [key: SimpleDateTimeString]: number;
}

// a simple date string without any time/timezone information
// e.g. 2016-12-26
export type SimpleDateString = string;

// time information without date or timezone information
// e.g. 13:30:44
export type SimpleTimeString = string;

export function validateSimpleDateTimeString(date: SimpleDateTimeString): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date);
}

export function validateSimpleDate(date: SimpleDateString): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function isoToSimple(isoTs: ISOTimeStamp): SimpleDateTimeString {
    let result = "";
    const minusRegEx = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(-\d{2}:\d{2})/

    // is UTC (ends with Z)
    if (isoTs.endsWith('Z')) {
        // remove Z
        result = isoTs.slice(0, -1);
    }

    // has + after the time
    else if (isoTs.includes('+')) {
        // remove the timezone offset
        result = isoTs.slice(0, isoTs.indexOf('+'));
    }

    // has - after the time
    else if (minusRegEx.test(isoTs)) {
        // remove the timezone offset
        result = isoTs.replace(minusRegEx, '$1');
    }

    // no timezone offset
    else {
        result = isoTs;
    }

    // remove the .XXX part as in 2014-09-01T14:01:00.345 -> 2014-09-01T14:01:00
    if (result.includes('.')) {
        result = result.slice(0, result.indexOf('.'));
    }

    if (!validateSimpleDateTimeString(result)) {
        throw new Error(`Invalid ISO string ${isoTs}: cannot be converted to simple date string (result: ${result})`);
    }

    return result;
}

export function dateToSimpleDateString(date: Date): SimpleDateTimeString {
    return isoToSimple(date.toISOString())
}

export function isoDataToSimple(isoTimeStampedData: ISOTimeStampStampedData): SimpleDateTimeStringStampedData {
    const result: SimpleDateTimeStringStampedData = {};

    for (const isoTimeStamp in isoTimeStampedData) {
        result[isoToSimple(isoTimeStamp)] = isoTimeStampedData[isoTimeStamp];
    }

    return result;
}

export function getTimeFromSimpleDateTimeString(date: SimpleDateTimeString): SimpleTimeString {
    if (!validateSimpleDateTimeString(date)) {
        throw new Error(`Invalid simple date string ${date}`);
    }
    return date.split('T')[1];
}

export function getDateFromSimpleDateTimeString(date: SimpleDateTimeString): SimpleDateString {
    // e.g. 2016-12-26T12:34:56 -> 2016-12-26
    if (!validateSimpleDateTimeString(date)) {
        throw new Error(`Invalid simple date string ${date}`);
    }
    return date.split('T')[0];
}