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

module.exports = {
    phoneNumberFormatter
};
