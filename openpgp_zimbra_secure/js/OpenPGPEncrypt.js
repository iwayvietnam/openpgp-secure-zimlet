/*
 * ***** BEGIN LICENSE BLOCK *****
 * OpenPGP Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present OpenPGP Zimbra Secure

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>
 * ***** END LICENSE BLOCK *****
 *
 * OpenPGP MIME Secure Email Zimlet
 *
 * Written by nguyennv1981@gmail.com
 */

OpenPGPEncrypt = function(opts, mimeBuilder) {
    opts = opts || {
        privateKey: false,
        publicKeys: [],
        passphrase: '',
        beforeSign: false,
        onSigned: false,
        beforeEncrypt: false,
        onEncrypted: false,
        onError: false
    };
    var self = this;
    this._mimeBuilder = mimeBuilder;

    this._beforeSign = opts.beforeSign;
    this._onSigned = opts.onSigned;
    this._beforeEncrypt = opts.beforeEncrypt;
    this._onEncrypted = opts.onEncrypted;
    this._onError = opts.onError;

    this._privateKey = opts.privateKey;
    this._publicKeys = opts.publicKeys;

    this._shouldSign = false;
    this._shouldEncrypt = false;
    this._isSigned = false;
    this._isEncrypted = false;
};

OpenPGPEncrypt.prototype = new Object();
OpenPGPEncrypt.prototype.constructor = OpenPGPEncrypt;

OpenPGPEncrypt.prototype.encrypt = function() {
    var self = this;
    var sequence = Promise.resolve();

    return sequence.then(function() {
        if (AjxUtil.isFunction(self._beforeSign)) {
            self._beforeSign(self, self._mimeBuilder);
        }

        if (self._shouldSign && self._privateKey) {
            var opts = {
                data: self._mimeBuilder.toString(),
                privateKeys: self._privateKey
            };
            return openpgp.sign(opts).then(function(signedText) {
                var signatureHeader = '-----BEGIN PGP SIGNATURE-----';
                var signature = signatureHeader + signedText.data.split(signatureHeader).pop();
                self._mimeBuilder.buildSignedMessage(signature);
                self._isSigned = true;
                if (AjxUtil.isFunction(self._onSigned)) {
                    self._onSigned(self, self._mimeBuilder);
                }
                return self._mimeBuilder;
            });
        }
        else {
            return self._mimeBuilder;
        }
    })
    .then(function(builder) {
        if (AjxUtil.isFunction(self._beforeEncrypt)) {
            self._beforeEncrypt(self, self._mimeBuilder);
        }

        if (self._shouldEncrypt && self._publicKeys.length > 0) {
            var opts = {
                data: self._mimeBuilder.toString(),
                publicKeys: self._publicKeys
            };
            return openpgp.encrypt(opts).then(function(cipherText) {
                self._mimeBuilder.buildEncryptedMessage(cipherText.data);
                self._isEncrypted = true;
                if (AjxUtil.isFunction(self._onEncrypted)) {
                    self._onEncrypted(self, self._mimeBuilder);
                }
                return self._mimeBuilder;
            }, function(err) {
                if (AjxUtil.isFunction(self._onError)) {
                    self._onError(self, err);
                }
            });
        }
        else {
            if (AjxUtil.isFunction(self._onEncrypted)) {
                self._onEncrypted(self, self._mimeBuilder);
            }
            return self._mimeBuilder;
        }
    });
};

OpenPGPEncrypt.prototype.shouldSign = function(shouldSign) {
    if (typeof shouldSign === 'undefined') {
        return this._shouldSign;
    }
    else {
        this._shouldSign = shouldSign ? true : false;
    }
}

OpenPGPEncrypt.prototype.shouldEncrypt = function(shouldEncrypt) {
    if (typeof shouldEncrypt === 'undefined') {
        return this._shouldEncrypt;
    }
    else {
        this._shouldEncrypt = shouldEncrypt ? true : false;
    }
}

OpenPGPEncrypt.prototype.isSigned = function(isSigned) {
    if (typeof isSigned === 'undefined') {
        return this._isSigned;
    }
    else {
        this._isSigned = isSigned ? true : false;
    }
}

OpenPGPEncrypt.prototype.isEncrypted = function(isEncrypted) {
    if (typeof isEncrypted === 'undefined') {
        return this._isEncrypted;
    }
    else {
        this._isEncrypted = isEncrypted ? true : false;
    }
}
