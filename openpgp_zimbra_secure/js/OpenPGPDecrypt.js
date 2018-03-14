/**
 * ***** BEGIN LICENSE BLOCK *****
 * OpenPGP Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present iWay Vietnam - http://www.iwayvietnam.com

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
 * Written by Nguyen Van Nguyen <nguyennv1981@gmail.com>
 */

/**
 * Decrypt constructor.
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
};

OpenPGPDecrypt.prototype = new Object();
OpenPGPDecrypt.prototype.constructor = OpenPGPDecrypt;

/**
 * Decrypt message.
 *
 * @param {String} message The email message for decrypting
 * @return {Promise<Object>} the Promise object
 */
OpenPGPDecrypt.prototype.decrypt = function(message) {
    var self = this;
    var sequence = Promise.resolve(message);

    return sequence.then(function(message) {
        var encrypted = false;
        var signed = false;
        var signedNode = false;
        var cipherText = '';
        var signature = '';

        var parser = new window['emailjs-mime-parser']();
        parser.onheader = function(node){
            var ct = node.contentType.value;
            if (OpenPGPUtils.isEncryptedMessage(ct)) {
                encrypted = true;
            }
            if (OpenPGPUtils.isSignedMessage(ct)) {
                signed = true;
            }
        };
        parser.onbody = function(node, chunk){
            if (encrypted && OpenPGPUtils.hasInlinePGPContent(node.raw, OpenPGPUtils.OPENPGP_MESSAGE_HEADER)) {
                cipherText = OpenPGPUtils.binToString(chunk);
            }
            if (signed) {
                var ct = node.contentType.value;
                if (OpenPGPUtils.isSignatureContentType(ct) || OpenPGPUtils.hasInlinePGPContent(node.raw, OpenPGPUtils.OPENPGP_SIGNATURE_HEADER)) {
                    signature = OpenPGPUtils.binToString(chunk);
                }
            }
        };
        parser.write(message);
        parser.end();

        if (signed) {
            parser.node._childNodes.forEach(function(node) {
                var ct = node.contentType.value;
                if (!signedNode && !OpenPGPUtils.isPGPContentType(ct)) {
                    signedNode = node;
                };
            });
        }

        if (encrypted && cipherText.length > 0) {
            var opts = {
                message: openpgp.message.readArmored(cipherText),
                publicKeys: self._publicKeys,
                privateKey: self._privateKey
            };
            return openpgp.decrypt(opts).then(function(plainText) {
                return {
                    content: plainText.data,
                    signature: signature,
                    signatures: plainText.signatures,
                    encrypted: encrypted
                }
            });
        }
        else {
            return {
                content: signedNode ? signedNode.raw.replace(/\r?\n/g, AjxStringUtil.CRLF) : message,
                signature: signature,
                signatures: [],
                encrypted: encrypted
            }
        }
    }, function(err) {
        self.onError(err);
        return {
            content: message,
            signature: '',
            signatures: [],
            encrypted: false
        }
    })
    .then(function(message) {
        if (message.encrypted === false || message.signatures.length == 0) {
            if (message.signature.length == 0) {
                var parser = new window['emailjs-mime-parser']();
                parser.onbody = function(node, chunk){
                    var ct = node.contentType.value;
                    if (OpenPGPUtils.isSignatureContentType(ct) || OpenPGPUtils.hasInlinePGPContent(node.raw, OpenPGPUtils.OPENPGP_SIGNATURE_HEADER)) {
                        message.signature = openpgp.util.bin2str(chunk);
                    }
                };
                parser.write(message.content);
                parser.end();

                var signedNode = false;
                parser.node._childNodes.forEach(function(node) {
                    var ct = node.contentType.value;
                    if (!signedNode && !OpenPGPUtils.isPGPContentType(ct)) {
                        signedNode = node;
                    };
                });
                if (signedNode) {
                    message.content = signedNode.raw.replace(/\r?\n/g, AjxStringUtil.CRLF);
                }
            }

            if (message.signature.length > 0) {
                var opts = {
                    message: openpgp.message.fromText(message.content),
                    signature: openpgp.signature.readArmored(message.signature),
                    publicKeys: self._publicKeys
                };
                return openpgp.verify(opts).then(function(verified) {
                    message.signatures = verified.signatures;
                    return message;
                });
            }
        }

        return message;
    }, function(err) {
        self.onError(err);
        return {
            content: message,
            signature: '',
            signatures: [],
            encrypted: false
        }
    })
    .then(function(message) {
        message.signatures.forEach(function(signature) {
            signature.userid = '';
            self._publicKeys.forEach(function(key) {
                var keyid = key.primaryKey.keyid;
                if (keyid.equals(signature.keyid)) {
                    key.getUserIds().forEach(function(userId) {
                        if (signature.userid.length == 0) {
                            signature.userid = userId;
                        }
                        else {
                            signature.userid += ', ' + userId;
                        }
                    });
                }
            });
        });

        self.onDecrypted(message);
        return message;
    });
};

/**
 * Invoke onDecrypted callback.
 */
OpenPGPDecrypt.prototype.onDecrypted = function(message) {
    if (this._onDecrypted instanceof AjxCallback) {
        this._onDecrypted.run(message);
    } else if (AjxUtil.isFunction(this._onDecrypted)) {
        this._onDecrypted(message);
    }
};

/**
 * Invoke onError callback.
 */
OpenPGPDecrypt.prototype.onError = function(err) {
    if (this._onError instanceof AjxCallback) {
        this._onError.run(err);
    } else if (AjxUtil.isFunction(this._onError)) {
        this._onError(err);
    }
};

/**
 * Decrypt inline content.
 *
 * @param {String} content The content for decrypting
 * @param {Array} publicKeys The public key for verify signature
 * @param {Key} privateKey The private key for decrypting
 * @param {AjxCallback/Function} onDecrypted The callback is invoke after decrypting
 * @return {Promise<Object>} the Promise object
 */
OpenPGPDecrypt.decryptContent = function(content, publicKeys, privateKey, onDecrypted) {
    var sequence = Promise.resolve();

    return sequence.then(function() {
        if (content.indexOf(OpenPGPUtils.OPENPGP_MESSAGE_HEADER) > 0) {
            var opts = {
                message: openpgp.message.readArmored(content),
                publicKeys: publicKeys,
                privateKey: privateKey
            };
            return openpgp.decrypt(opts).then(function(plainText) {
                return {
                    encrypted: true,
                    content: plainText.data,
                    signatures: plainText.signatures
                };
            });
        }
        else {
            return {
                encrypted: false,
                content: content,
                signatures: []
            };
        }
    }, function(err) {
        OpenPGPZimbraSecure.popupErrorDialog(err);
        return {
            encrypted: false,
            content: content,
            signatures: []
        };
    })
    .then(function(result) {
        if (result.signatures.length == 0 && result.content.indexOf(OpenPGPUtils.OPENPGP_SIGNED_MESSAGE_HEADER) > 0) {
            var opts = {
                message: openpgp.cleartext.readArmored(result.content),
                publicKeys: publicKeys
            };
            return openpgp.verify(opts).then(function(signature) {
                return {
                    encrypted: false,
                    content: signature.data,
                    signatures: signature.signatures
                };
            });
        }
        else {
            return result;
        }
    }, function(err) {
        OpenPGPZimbraSecure.popupErrorDialog(err);
        return {
            encrypted: false,
            content: content,
            signatures: []
        };
    })
    .then(function(result) {
        result.signatures.forEach(function(signature) {
            publicKeys.forEach(function(key) {
                var keyid = key.primaryKey.keyid;
                if (keyid.equals(signature.keyid)) {
                    signature.userid = key.getPrimaryUser().user.userId.userid;
                }
            });
        });
        if (onDecrypted instanceof AjxCallback) {
            onDecrypted.run(result);
        } else if (AjxUtil.isFunction(onDecrypted)) {
            onDecrypted(result);
        }
        return result;
    });
};
