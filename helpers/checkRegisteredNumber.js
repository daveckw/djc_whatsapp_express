const checkRegisteredNumber = async function (number, client) {
    try {
        const isRegistered = await client.isRegisteredUser(number);
        return isRegistered;
    } catch (err) {
        console.log(err);
        return false;
    }
};

module.exports = { checkRegisteredNumber };
