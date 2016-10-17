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

OpenPGPMimeBuilder = function(opts) {
    opts = opts || {
        headers: [],
        contentParts: [],
        attachments: []
    };
    this._headers = opts.headers;
    this._contentParts = opts.contentParts;
    this._attachments = opts.attachments;
    this._message = mimemessage.factory({
        body: []
    });
    var self = this;

    OpenPGPUtils.forEach(this._headers, function(header){
        self._message.header(header.name, header.value);
    });

    if (this._attachments.length > 0 || this._contentParts.length > 1) {
        this._message.contentType('multipart/mixed; boundary=' + OpenPGPUtils.randomString());
    }

    if (this._contentParts.length > 1) {
        var alternate = mimemessage.factory({
            contentType: 'multipart/alternative',
            body: []
        });
        OpenPGPUtils.forEach(this._contentParts, function(cp){
            var contentType = cp.ct;
            if (contentType == 'text/plain' || contentType == 'text/html') {
                contentType += '; charset=utf-8';
            }
            var contentEntity = mimemessage.factory({
                contentType: contentType,
                contentTransferEncoding: 'quoted-printable',
                body: quotedPrintable.encode(utf8.encode(cp.content._content))
            });
            alternate.body.push(contentEntity);
        });
        this._message.body.push(alternate);
    }
    else {
        if (this._contentParts.length > 0) {
            var cp = this._contentParts[0];
            var contentType = cp.ct;
            if (contentType == 'text/plain' || contentType == 'text/html') {
                contentType += '; charset=utf-8';
            }
            if (this._attachments.length > 0) {
                var alternate = mimemessage.factory({
                    contentType: contentType,
                    contentTransferEncoding: 'quoted-printable',
                    body: quotedPrintable.encode(utf8.encode(cp.content._content))
                });
                this._message.body.push(alternate);
            }
            else {
                this._message.contentType(contentType);
                this._message.contentTransferEncoding('quoted-printable');
                this._message.body = quotedPrintable.encode(utf8.encode(cp.content._content));
            }
        }
    }

    OpenPGPUtils.forEach(this._attachments, function(mp){
        var attach = mimemessage.factory({
            contentType: mp.ct,
            contentTransferEncoding: 'base64',
            body: mp.data
        });
        attach.header('Content-Disposition', mp.cd);
        self._message.body.push(attach);
    });
};

OpenPGPMimeBuilder.prototype = new Object();
OpenPGPMimeBuilder.prototype.constructor = OpenPGPMimeBuilder;

/**
 * Build pgp signed mime message and attach signature
 * @param {String} The signature of message.
 */
OpenPGPMimeBuilder.prototype.buildSignedMessage = function(signature) {
    var message = this._message;
    var ctParts = [
        OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE,
        'protocol="' + OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE + '"',
        'micalg="pgp-sha256"',
        'boundary=' + OpenPGPUtils.randomString()
    ];
    this._message = mimemessage.factory({
        contentType: ctParts.join(';'),
        body: []
    });

    var pgpMime = mimemessage.factory({
        contentType: OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE,
        contentTransferEncoding: '7bit',
        body: signature
    });
    pgpMime.header('Content-Description', 'OpenPGP signed message');
    this._message.body.push(message);
    this._message.body.push(pgpMime);
}

OpenPGPMimeBuilder.prototype.buildEncryptedMessage = function(encryptedText) {
    var ctParts = [
        OpenPGPUtils.ENCRYPTED_MESSAGE_CONTENT_TYPE,
        'protocol="' + OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE + '"',
        'boundary=' + OpenPGPUtils.randomString()
    ];
    this._message = mimemessage.factory({
        contentType: ctParts.join(';'),
        body: []
    });

    var versionMime = mimemessage.factory({
        contentType: OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE,
        contentTransferEncoding: '7bit',
        body: 'Version: 1'
    });
    versionMime.header('Content-Description', 'PGP/MIME Versions Identification');

    var pgpMime = mimemessage.factory({
        contentType: 'application/octet-stream; name="encrypted.asc"',
        contentTransferEncoding: '7bit',
        body: encryptedText
    });
    pgpMime.header('Content-Disposition', 'inline; filename="encrypted.asc"');
    pgpMime.header('Content-Description', 'OpenPGP encrypted message');
    this._message.body.push(versionMime);
    this._message.body.push(pgpMime);
}

/**
 * Import headers from zimbra message object
 * @param {Object} The mail message is inluded in the jsonObj msg.
 */
OpenPGPMimeBuilder.prototype.importHeaders = function(msg) {
    var self = this;
    if (msg.e) {
        var toAddresses = [];
        var ccAddresses = [];
        var bccAddresses = [];
        var rtAddresses = [];
        OpenPGPUtils.forEach(msg.e, function(e) {
            if (e.t == 'f') {
                self.header('From', e.a);
            }
            if (e.t == 's') {
                self.header('Sender', e.a);
            }
            if (e.t == 't') {
                toAddresses.push(e.a);
            }
            if (e.t == 'c') {
                ccAddresses.push(e.a);
            }
            if (e.t == 'b') {
                bccAddresses.push(e.a);
            }
            if (e.t == 'r') {
                rtAddresses.push(e.a);
            }
            if (e.t == 'n') {
                self.header('Disposition-Notification-To', e.a);
            }
        });
        if (toAddresses.length > 0) {
            this.header('To', toAddresses.join(', '));
        }
        if (ccAddresses.length > 0) {
            this.header('Cc', ccAddresses.join(', '));
        }
        if (bccAddresses.length > 0) {
            this.header('Bcc', bccAddresses.join(', '));
        }
        if (rtAddresses.length > 0) {
            this.header('Reply-To', rtAddresses.join(', '));
        }
    }
    if (msg.irt) {
        this.header('In-Reply-To', msg.irt._content);
    }
    if (msg.su) {
        this.header('Subject', msg.su._content);
    }
    if (msg.header) {
        OpenPGPUtils.forEach(msg.header, function(header) {
            self.header(header.name, header._content);
        });
    }
};

/**
 * Get mime message object
 */
OpenPGPMimeBuilder.prototype.getMessage = function() {
    return this._message;
};

OpenPGPMimeBuilder.prototype.toString = function(opts) {
    return this._message.toString(opts);
};

/**
 * Get/Set headers to mime message object
 */
OpenPGPMimeBuilder.prototype.header = function(name, value) {
    this._message.header(name, value);
}
