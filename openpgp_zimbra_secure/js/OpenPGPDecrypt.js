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

OpenPGPDecrypt = function(opts, message) {
    opts = opts || {
        privateKey: false,
        publicKeys: [],
        onDecrypted: false,
        onError: false
    };
    var self = this;
    this._onDecrypted = opts.onDecrypted;
    this._onError = opts.onError;

    this._privateKey = opts.privateKey;
    this._publicKeys = opts.publicKeys;
    this._message = mimemessage.parse(message);
    if (!this._message) {
        throw new Error(OpenPGPUtils.prop('parseMessageError'));
    }
};

OpenPGPDecrypt.prototype = new Object();
OpenPGPDecrypt.prototype.constructor = OpenPGPDecrypt;

OpenPGPDecrypt.prototype.decrypt = function() {
    var self = this;
    var sequence = Promise.resolve();

    return sequence.then(function() {
        self._message.encrypted = false;
        var ct = self._message.contentType().fulltype;
        if(OpenPGPUtils.isEncryptedMessage(ct) && self._privateKey) {
            var cipherText = '';
            var messageHeader = '-----BEGIN PGP MESSAGE-----';
            self._message.body.forEach(function(body) {
                var content = body.toString({noHeaders: true});
                if (content.indexOf(messageHeader) >= 0) {
                    cipherText = content;
                }
            });

            var opts = {
                message: openpgp.message.readArmored(cipherText),
                privateKey: self._privateKey
            };
            return openpgp.decrypt(opts).then(function(plainText) {
                var data = plainText.data.replace(/\r?\n/g, "\r\n");
                self._message = mimemessage.parse(data);
                if (!self._message) {
                    throw new Error(OpenPGPUtils.prop('parseDecryptedMessageError'));
                }
                else {
                    self._message.encrypted = true;
                }
                return self._message;
            }, function(err) {
                if (AjxUtil.isFunction(self._onError)) {
                    self._onError(self, err);
                }
                return self._message;
            });
        }
        else {
            return self._message; 
        }
    }, function(err) {
        if (AjxUtil.isFunction(self._onError)) {
            self._onError(self, err);
        }
        return self._message;
    })
    .then(function(message) {
        if (message) {
            var signatures = [];
            var ct = message.contentType().fulltype;
            if (OpenPGPUtils.isSignedMessage(ct) && self._publicKeys.length > 0) {
                var bodyContent = '';
                var signature = '';
                message.body.forEach(function(body) {
                    if (OpenPGPUtils.isSignatureContentType(body.contentType().fulltype)) {
                        signature = body.toString({noHeaders: true});
                    }
                    else {
                        bodyContent = body.toString();
                    }
                });
                var pgpMessage = openpgp.message.readSignedContent(bodyContent, signature);
                signatures = pgpMessage.verify(self._publicKeys);
                signatures.forEach(function(signature) {
                    self._publicKeys.forEach(function(key) {
                        var keyid = key.primaryKey.keyid;
                        if (keyid.equals(signature.keyid)) {
                            signature.userid = key.getPrimaryUser().user.userId.userid;
                        }
                    });
                });
            }
            message.signatures = signatures;
        }
        return message;
    }, function(err) {
        if (AjxUtil.isFunction(self._onError)) {
            self._onError(self, err);
        }
        return self._message;
    })
    .then(function(message) {
        if (AjxUtil.isFunction(self._onDecrypted)) {
            self._onDecrypted(self, message);
        }
        return message;
    });
};
