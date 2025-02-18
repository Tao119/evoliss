export const getFormattedDate = (date: Date, format: string): string | false => {

    if (!(date instanceof Date)) {
        return false;
    }

    const symbol = {
        M: date.getUTCMonth() + 1,
        d: date.getUTCDate(),
        h: date.getUTCHours(),
        m: date.getUTCMinutes(),
        s: date.getUTCSeconds(),
    };

    const formatted = format.replace(/(M+|d+|h+|m+|s+)/g, (v) =>
        ((v.length > 1 ? "0" : "") + symbol[v.slice(-1) as keyof typeof symbol]).slice(-2)
    );

    return formatted.replace(/(y+)/g, (v) =>
        date.getFullYear().toString().slice(-v.length)
    );
};
