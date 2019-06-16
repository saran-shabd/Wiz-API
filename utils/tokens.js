'use string';

const jwt = require('jsonwebtoken');

const stringUtils = require('./strings');

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

const verifyTokenMiddleware = (request, response, next) => {
    let { token } = request.body;
    if (stringUtils.containsEmptyString([token]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });
    let decryptedToken = decryptToken(token);
    if (!decryptedToken.status)
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Token' });

    request.decryptToken = decryptedToken;
    next();
};

module.exports = {
    encryptOtp,
    decryptOtp,
    encryptToken,
    decryptToken,
    verifyTokenMiddleware
};
