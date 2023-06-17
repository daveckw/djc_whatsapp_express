const { format } = require("date-fns");

const dateToString = (date) => {
    if (!(date instanceof Date)) {
        throw new Error("Invalid date object.");
    }

    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
    const formattedDate = format(date, `yyyyMMddHHmmss${milliseconds}`);
    return formattedDate;
};

exports.dateToString = dateToString;
