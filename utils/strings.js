'use strict';

const bcrypt = require('bcryptjs');
const cryptr = require('cryptr');

const { APP_SECRET } = process.env;

const appCryptr = new cryptr(APP_SECRET);

const containsEmptyString = args => {
    for (let i = 0; i < args.length; ++i)
        if (undefined === args[i] || '' === args[i]) return true;
    return false;
};

const checkOnlyDigits = str => {
    const regex = /^\d+$/;
    return regex.test(str);
};

const checkOnlyAlphas = str => {
    const regex = /^[a-zA-Z]*$/;
    return regex.test(str);
};

const checkRegno = regno => {
    return regno.toString().length === 9 && checkOnlyDigits(regno);
};

const generateRandomAlphaNumericStr = length => {
    let result = '';
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
};

const hashStr = str => {
    let salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(str, salt);
};

const verifyHashStr = (hash, str) => {
    return bcrypt.compareSync(str, hash);
};

const encryptStr = str => {
    return appCryptr.encrypt(str);
};

const decryptStr = str => {
    return appCryptr.decrypt(str);
};

module.exports = {
    containsEmptyString,
    generateRandomAlphaNumericStr,
    checkOnlyDigits,
    checkOnlyAlphas,
    checkRegno,
    hashStr,
    verifyHashStr,
    encryptStr,
    decryptStr
};
