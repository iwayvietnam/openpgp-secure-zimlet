/*
 * ***** BEGIN LICENSE BLOCK *****
 * OpenEC Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present OpenEC Zimbra Secure community

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
 * S/MIME Secure Email Zimlet
 *
 * Written by nguyennv@iwayvietnam.com
 */

OpenPGPDecrypt = function(opts) {
    opts = opts || {
        message: '',
        onDecrypted: false,
        onError: false
    };
    this._message = mimemessage.parse(opts.message);
    this._onDecrypted = opts.onDecrypted;
    this._onError = opts.onError;
    this._trustedCerts = [];

    var self = this;
    if (this._message) {
        var ct = this._message.contentType().fulltype;
        if (OpenPGPUtils.isSignedContentType(ct)) {
            var bodyContent = '';
            var signature = '';
            OpenPGPUtils.forEach(this._message.body, function(body) {
                if (OpenEcUtils.isOPENPGPContentType(body.contentType().fulltype)) {
                    signature = body.body;
                }
                else {
                    bodyContent = body.toString();
                }
            });
        }
        else if(OpenPGPUtils.isEncryptedContentType(ct)) {
        }
    }
};

OpenPGPDecrypt.prototype = new Object();
OpenPGPDecrypt.prototype.constructor = OpenPGPDecrypt;

OpenPGPDecrypt.prototype._decrypt = function(message) {
};

OpenPGPDecrypt.prototype._verify = function(signature, content) {
};
