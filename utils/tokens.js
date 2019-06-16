'use string';

const jwt = require('jsonwebtoken');

const { APP_SECRET, OTP_SECRET } = process.env;

const encryptOtp = object => {
    return jwt.sign(object, OTP_SECRET, { expiresIn: '24h' });
};

const decryptOtp = token => {
    try {
        const decoded = jwt.verify(token, OTP_SECRET, { maxAge: '24h' });
        return { status: true, decoded };
    } catch (err) {
        return { status: false, decoded: null };
    }
};

const encryptToken = object => {
    return jwt.sign(object, APP_SECRET);
};

const decryptToken = token => {
    try {
        const decoded = jwt.verify(token, APP_SECRET);
        return { status: true, decoded };
    } catch (err) {
        return { status: false, decoded: null };
    }
};

module.exports = {
    encryptOtp,
    decryptOtp,
    encryptToken,
    decryptToken
};
