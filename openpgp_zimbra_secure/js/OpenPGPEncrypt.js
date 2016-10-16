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

OpenPGPEncrypt = function(opts, mimeBuilder, pgp) {
    opts = opts || {
        privateKey: '',
        publicKeys: [],
        passphrase: '',
        shouldEncrypt: false,
        beforeEncrypt: false,
        afterEncrypt: false,
        onError: false
    };
    this._mimeBuilder = mimeBuilder;
    this._pgp = pgp || openpgp;
    this._pgpKey = this._pgp.key;
    this._pgp = this._pgp.default;

    var privateKey = this._pgpKey.readArmored(opts.privateKey).keys[0];
    if (!privateKey.decrypt(opts.passphrase)) {
        throw new Error('Wrong passphrase! Could not decrypt the private key!');
    }
    this._privateKey = privateKey;
    this._publicKeys = [];
    OpenPGPUtils.forEach(opts.publicKeys, function(key) {
        this._publicKeys.push(self._pgpKey.readArmored(key).keys[0]);
    });

    this._shouldEncrypt = opts.shouldEncrypt;
    this._beforeEncrypt = opts.beforeEncrypt;
    this._afterEncrypt = opts.afterEncrypt;
    this._onError = opts.onError;
};

OpenPGPEncrypt.prototype = new Object();
OpenPGPEncrypt.prototype.constructor = OpenPGPEncrypt;

OpenPGPEncrypt.prototype.encrypt = function() {
    var self = this;
    if (this._beforeEncrypt) {
        this._beforeEncrypt(this, this._mimeBuilder);
    }
    var opts = {
        data: self._mimeBuilder.toString(),
        privateKeys: this._privateKey,
        armor: true
    };
    return this._pgp.sign(options).then(function(signedMessage) {
        var signatureHeader = '-----BEGIN PGP SIGNATURE-----';
        var signature = signatureHeader + signedMessage.data.split(signatureHeader).pop();
        self._mimeBuilder.buildSignedMessage(signature);
    }, function(err) {
        if (self._onError) {
            self._onError(self, err);
        }
    }).then(function() {
        if (self._shouldEncrypt) {
            var opts = {
                data: self._mimeBuilder.toString(),
                privateKeys: this._privateKey,
                publicKeys: this._publicKeys,
                armor: true
            };
            self._pgp.encrypt(opts).then(function(cipherText) {
                self._mimeBuilder.buildEncryptedMessage(cipherText.data);
                if (self._afterEncrypt) {
                    self._afterEncrypt(self, self._mimeBuilder);
                }
            }, function(err) {
                if (this._onError) {
                    this._onError(this, err);
                }
            });
        }
        else if (self._afterEncrypt){
            self._afterEncrypt(self, self._mimeBuilder);
        }
    });
};
