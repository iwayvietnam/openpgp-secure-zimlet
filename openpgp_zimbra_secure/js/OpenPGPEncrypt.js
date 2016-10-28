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
        onEncrypted: false,
        onError: false
    };
    var self = this;
    this._mimeBuilder = mimeBuilder;
    this._pgp = pgp || openpgp;
    this._pgpKey = this._pgp.key;
    this._shouldEncrypt = opts.shouldEncrypt;
    this._onEncrypted = opts.onEncrypted;
    this._onError = opts.onError;

    var privateKey = this._pgpKey.readArmored(opts.privateKey).keys[0];
    if (!privateKey.decrypt(opts.passphrase)) {
        throw new Error('Wrong passphrase! Could not decrypt the private key!');
    }
    this._privateKey = privateKey;
    this._publicKeys = [];
    OpenPGPUtils.forEach(opts.publicKeys, function(key) {
        self._publicKeys.push(self._pgpKey.readArmored(key).keys[0]);
    });
};

OpenPGPEncrypt.prototype = new Object();
OpenPGPEncrypt.prototype.constructor = OpenPGPEncrypt;

OpenPGPEncrypt.prototype.encrypt = function() {
    var self = this;
    var sequence = Promise.resolve();

    return sequence.then(function() {
        var opts = {
            data: self._mimeBuilder.toString(),
            privateKeys: self._privateKey,
            armor: true
        };
        return self._pgp.sign(opts).then(function(signedText) {
            var signatureHeader = '-----BEGIN PGP SIGNATURE-----';
            var signature = signatureHeader + signedText.data.split(signatureHeader).pop();
            self._mimeBuilder.buildSignedMessage(signature);
            return self._mimeBuilder;
        });
    })
    .then(function(builder) {
        if (self._shouldEncrypt) {
            var opts = {
                data: self._mimeBuilder.toString(),
                publicKeys: self._publicKeys,
                armor: true
            };
            return self._pgp.encrypt(opts).then(function(cipherText) {
                self._mimeBuilder.buildEncryptedMessage(cipherText.data);
                if (self._onEncrypted) {
                    self._onEncrypted(self, self._mimeBuilder);
                }
                return self._mimeBuilder;
            }, function(err) {
                if (self._onError) {
                    self._onError(self, err);
                }
            });
        }
        else {
            return self._mimeBuilder;
        }
    });
};
