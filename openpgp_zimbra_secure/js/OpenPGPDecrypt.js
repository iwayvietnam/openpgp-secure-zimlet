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

OpenPGPDecrypt = function(opts, message, pgp) {
    opts = opts || {
        privateKey: '',
        publicKeys: [],
        passphrase: '',
        onDecrypted: false,
        onError: false
    };
    var self = this;
    this._pgp = pgp || openpgp;
    this._pgpKey = this._pgp.key;
    this._onDecrypted = opts.onDecrypted;
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
    this._message = mimemessage.parse(message);
    if (!this._message) {
        throw new Error('Wrong message! Could not parse the email message!');
    }
};

OpenPGPDecrypt.prototype = new Object();
OpenPGPDecrypt.prototype.constructor = OpenPGPDecrypt;

OpenPGPDecrypt.prototype.decrypt = function() {
    var self = this;
    var sequence = Promise.resolve();

    return sequence.then(function() {
        var ct = self._message.contentType().fulltype;
        if(OpenPGPUtils.isEncryptedContentType(ct)) {
            var messageHeader = '-----BEGIN PGP MESSAGE-----';
            var cipherText = messageHeader + self._message.toString({noHeaders: true}).split(messageHeader).pop();

            var opts = {
                message: openpgp.message.readArmored(cipherText),
                publicKeys: self._publicKeys,
                privateKey: self._privateKey
            };
            return openpgp.decrypt(opts).then(function(plainText) {
                var data = plainText.data.replace(/\r?\n/g, "\r\n");
                var message = mimemessage.parse(data);
                if (!message) {
                    throw new Error('Wrong message! Could not parse the decrypted email message!');
                }
                return message;
            });
        }
        else {
            return self._message; 
        }
    }, function(err) {
        if (self._onError) {
            self._onError(self, err);
        }
    })
    .then(function(message) {
        var signatures = [];
        var ct = message.contentType().fulltype;
        if (OpenPGPUtils.isSignedContentType(ct)) {
            var bodyContent = '';
            var signature = '';
            OpenPGPUtils.forEach(message.body, function(body) {
                if (OpenEcUtils.isOPENPGPContentType(body.contentType().fulltype)) {
                    signature = body.toString({noHeaders: true});
                }
                else {
                    bodyContent = body.toString();
                }
            });

            var pgpMessage = openpgp.message.readSignedContent(content, signature);
            var signatures = pgpMessage.verify(self._publicKeys);
        }
        message.signatures = signatures;
        return message;
    }, function(err) {
        if (self._onError) {
            self._onError(self, err);
        }
    })
    .then(function(message) {
        if (self._onDecrypted) {
            self._onDecrypted(self, message);
        }
        return message;
    });
};
