const phoneNumberFormatter = function (number) {
    // Check if number is not a string
    if (typeof number !== "string") {
        try {
            // Try to convert number to string
            number = number.toString();
        } catch (error) {
            // Log error message and throw error
            console.error("Error converting number to string:", error);
            throw error;
        }
    }

    let formatted = number.replace(/\D/g, "");

    if (formatted.startsWith("0")) {
        formatted = "60" + formatted.substr(1);
    }

    if (!formatted.endsWith("@c.us")) {
        formatted += "@c.us";
    }

    return formatted;
};

const extractNumbers = (s) => {
    // Check if number is not a string
    if (typeof s !== "string") {
        try {
            // Try to convert number to string
            s = s.toString();
        } catch (error) {
            // Log error message and throw error
            console.error("Error converting number to string:", error);
            throw error;
        }
    }
    let number = s.match(/\d+/g).join("");
    return number;
};

module.exports = {
    phoneNumberFormatter,
    extractNumbers
};

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";

exports.reset = reset;
exports.red = red;
exports.green = green;
