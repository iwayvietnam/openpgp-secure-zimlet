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

OpenPGPEncrypt = function(opts) {
    opts = opts || {
        privateKey: false,
        publicKeys: [],
        passphrase: '',
        beforeEncrypt: false,
        onEncrypted: false,
        onError: false
    };
    this._beforeEncrypt = opts.beforeEncrypt;
    this._onEncrypted = opts.onEncrypted;
    this._onError = opts.onError;

    this._privateKey = opts.privateKey;
    this._publicKeys = opts.publicKeys;

    this._shouldSign = true;
    this._shouldEncrypt = false;
};

OpenPGPEncrypt.prototype = new Object();
OpenPGPEncrypt.prototype.constructor = OpenPGPEncrypt;

OpenPGPEncrypt.prototype.encrypt = function(mimeBuilder) {
    var self = this;
    var sequence = Promise.resolve(mimeBuilder);
    return sequence.then(function(mimeBuilder) {
        self.onCallback(self._beforeEncrypt, mimeBuilder);

        if (self._shouldEncrypt && self._publicKeys.length > 0) {
            var opts = {
                data: mimeBuilder.toString(),
                publicKeys: self._publicKeys
            };
            if (self._shouldSign && self._privateKey) {
                opts.privateKeys = self._privateKey;
            }
            return openpgp.encrypt(opts).then(function(cipherText) {
                mimeBuilder.buildEncryptedMessage(cipherText.data);
                return mimeBuilder;
            }, function(err) {
                self.onError(err);
            });
        }
        else if (self._shouldSign && self._privateKey) {
            var opts = {
                data: mimeBuilder.toString(),
                privateKeys: self._privateKey
            };
            return openpgp.sign(opts).then(function(signedText) {
                var signatureHeader = '-----BEGIN PGP SIGNATURE-----';
                var signature = signatureHeader + signedText.data.split(signatureHeader).pop();
                mimeBuilder.buildSignedMessage(signature);
                return mimeBuilder;
            });
        }
        return mimeBuilder;
    })
    .then(function(mimeBuilder) {
        self.onCallback(self._onEncrypted, mimeBuilder);
        return mimeBuilder;
    });
};

OpenPGPEncrypt.prototype.onCallback = function(callback, mimeBuilder) {
    if (callback instanceof AjxCallback) {
        callback.run(this, mimeBuilder);
    } else if (AjxUtil.isFunction(callback)) {
        callback(this, mimeBuilder);
    }
}

OpenPGPEncrypt.prototype.onError = function(err) {
    if (this._onError instanceof AjxCallback) {
        this._onError.run(this, err);
    } else if (AjxUtil.isFunction(this._onError)) {
        this._onError(this, err);
    }
}

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
