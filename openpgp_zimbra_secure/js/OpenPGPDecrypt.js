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

OpenPGPDecrypt = function(opts) {
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
    this._messageEncrypted = false;
};

OpenPGPDecrypt.prototype = new Object();
OpenPGPDecrypt.prototype.constructor = OpenPGPDecrypt;

OpenPGPDecrypt.prototype.decrypt = function(message) {
    var self = this;
    var codec = window['emailjs-mime-codec'];
    var sequence = Promise.resolve(message);

    return sequence.then(function(message) {
        var parser = new window['emailjs-mime-parser']();
        parser.write(message);
        parser.end();

        var ct = parser.node.contentType.value;
        if(OpenPGPUtils.isEncryptedMessage(ct) && self._privateKey) {
            var cipherText = '';
            var messageHeader = '-----BEGIN PGP MESSAGE-----';
            var pgpNode = parser.node._childNodes.find(function(node) {
                return OpenPGPUtils.hasInlinePGPContent(node.raw, OpenPGPUtils.OPENPGP_MESSAGE_HEADER);
            });
            if (pgpNode) {
                cipherText = codec.fromTypedArray(pgpNode.content);
            }

            var opts = {
                message: openpgp.message.readArmored(cipherText),
                publicKeys: self._publicKeys,
                privateKey: self._privateKey
            };
            return openpgp.decrypt(opts).then(function(plainText) {
                return {
                    content: plainText.data,
                    signatures: plainText.signatures,
                    encrypted: true
                }
            });
        }
        else {
            return {
                content: message,
                signatures: [],
                encrypted: false
            }
        }
    }, function(err) {
        self.onError(err);
    })
    .then(function(message) {
        if (message.encrypted === false || message.signatures.length == 0) {
            var parser = new window['emailjs-mime-parser']();
            parser.write(message.content);
            parser.end();

            var ct = parser.node.contentType.value;
            if (OpenPGPUtils.isSignedMessage(ct) && self._publicKeys.length > 0) {
                var bodyContent = '';
                var signature = '';
                parser.node._childNodes.forEach(function(node) {
                    var ct = node.contentType.value;
                    if (OpenPGPUtils.isSignatureContentType(ct)) {
                        signature = codec.fromTypedArray(node.content);
                    }
                    else if (!OpenPGPUtils.isPGPContentType(ct)) {
                        bodyContent = node.raw;
                    }
                });

                var pgpMessage = openpgp.message.readSignedContent(bodyContent.replace(/\r?\n/g, '\r\n'), signature);
                message.signatures = pgpMessage.verify(self._publicKeys);
                if (bodyContent.length > 0) {
                    message.content = bodyContent;
                }
            }
        }
        message.signatures.forEach(function(signature) {
            self._publicKeys.forEach(function(key) {
                var keyid = key.primaryKey.keyid;
                if (keyid.equals(signature.keyid)) {
                    signature.userid = key.getPrimaryUser().user.userId.userid;
                }
            });
        });
        var mimeMessage = mimemessage.parse(message.content.replace(/\r?\n/g, '\r\n'));
        mimeMessage.signatures = message.signatures;
        mimeMessage.encrypted = message.encrypted;
        return mimeMessage;
    }, function(err) {
        self.onError(err);
    })
    .then(function(mimeMessage) {
        self.onDecrypted(mimeMessage);
        return mimeMessage;
    });
};

OpenPGPDecrypt.prototype.onDecrypted = function(message) {
    if (this._onDecrypted instanceof AjxCallback) {
        this._onDecrypted.run(this, message);
    } else if (AjxUtil.isFunction(this._onDecrypted)) {
        this._onDecrypted(this, message);
    }
}

OpenPGPDecrypt.prototype.onError = function(err) {
    if (this._onError instanceof AjxCallback) {
        this._onError.run(this, err);
    } else if (AjxUtil.isFunction(this._onError)) {
        this._onError(this, err);
    }
}

OpenPGPDecrypt.decryptContent = function(content, publicKeys, privateKey, onDecrypted) {
    var sequence = Promise.resolve();

    return sequence.then(function() {
        if (content.indexOf(OpenPGPUtils.OPENPGP_MESSAGE_HEADER) > 0) {
            var opts = {
                message: openpgp.message.readArmored(content),
                privateKey: privateKey
            };
            return openpgp.decrypt(opts).then(function(plainText) {
                return plainText.data;
            });
        }
        else {
            return content;
        }
    })
    .then(function(plainText) {
        if (plainText.indexOf(OpenPGPUtils.OPENPGP_SIGNED_MESSAGE_HEADER) > 0) {
            var opts = {
                message: openpgp.cleartext.readArmored(plainText),
                publicKeys: publicKeys
            };
            return openpgp.verify(opts).then(function(signature) {
                var signatures = signature.signatures;
                signatures.forEach(function(signature) {
                    publicKeys.forEach(function(key) {
                        var keyid = key.primaryKey.keyid;
                        if (keyid.equals(signature.keyid)) {
                            signature.userid = key.getPrimaryUser().user.userId.userid;
                        }
                    });
                });
                return {
                    content: signature.data,
                    signatures: signatures
                };
            });
        }
        else {
            return {
                content: plainText,
                signatures: []
            };
        }
    })
    .then(function(result) {
        if (onDecrypted instanceof AjxCallback) {
            onDecrypted.run(result);
        } else if (AjxUtil.isFunction(onDecrypted)) {
            onDecrypted(result);
        }
        return result;
    });
}
