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
 * Encrypt constructor.
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

/**
 * Encrypting.
 *
 * @param {Array} contents The content parts of message for encrypting
 * @param {Array} attachments The attachment parts message for encrypting
 * @return {Promise<Object>} the Promise object
 */
OpenPGPEncrypt.prototype.encrypt = function(contents, attachments) {
    var self = this;
    var builder = new OpenPGPMimeBuilder();
    var sequence = Promise.resolve(builder.buildPlainText(contents, attachments));

    return sequence.then(function(mimeNode) {
        self.onCallback(self._beforeEncrypt, mimeNode);

        if (self._shouldEncrypt && self._publicKeys.length > 0) {
            var opts = {
                data: mimeNode.build(),
                publicKeys: self._publicKeys
            };
            if (self._shouldSign && self._privateKey) {
                opts.privateKeys = self._privateKey;
            }
            return openpgp.encrypt(opts).then(function(cipherText) {
                return builder.buildEncrypted(cipherText.data);
            });
        }
        else if (self._shouldSign && self._privateKey) {
            var hashAlg = 'pgp-' + openpgp.util.get_hashAlgorithmString(openpgp.config.prefer_hash_algorithm);
            var signature = self._detachedSign(mimeNode.build());
            return builder.buildSigned(mimeNode, signature, hashAlg.toLowerCase());
        }
        return mimeNode;
    }, function(err) {
        self.onError(err);
        return false;
    }).then(function(mimeNode) {
        if (mimeNode) {
            self.onCallback(self._onEncrypted, mimeNode);
        }
        return mimeNode;
    });
};

/**
 * Invoke a callback.
 */
OpenPGPEncrypt.prototype.onCallback = function(callback, obj) {
    if (callback instanceof AjxCallback) {
        callback.run(obj);
    } else if (AjxUtil.isFunction(callback)) {
        callback(obj);
    }
};

/**
 * Invoke error callback.
 */
OpenPGPEncrypt.prototype.onError = function(err) {
    if (this._onError instanceof AjxCallback) {
        this._onError.run(err);
    } else if (AjxUtil.isFunction(this._onError)) {
        this._onError(err);
    }
};

/**
 * Get/set sign state.
 */
OpenPGPEncrypt.prototype.shouldSign = function(shouldSign) {
    if (typeof shouldSign === 'undefined') {
        return this._shouldSign;
    }
    else {
        this._shouldSign = shouldSign ? true : false;
    }
};

/**
 * Get/set encrypt state.
 */
OpenPGPEncrypt.prototype.shouldEncrypt = function(shouldEncrypt) {
    if (typeof shouldEncrypt === 'undefined') {
        return this._shouldEncrypt;
    }
    else {
        this._shouldEncrypt = shouldEncrypt ? true : false;
    }
};

/**
 * Detached sign.
 */
OpenPGPEncrypt.prototype._detachedSign = function(content) {
    var message = openpgp.message.fromBinary(OpenPGPUtils.stringToBin(content));
    var signedMessage = message.sign([this._privateKey]);
    var signature = signedMessage.packets.filterByTag(openpgp.enums.packet.signature);
    var armored = openpgp.armor.encode(openpgp.enums.armor.message, signature.write());
    return armored.replace('PGP MESSAGE', 'PGP SIGNATURE');
}
