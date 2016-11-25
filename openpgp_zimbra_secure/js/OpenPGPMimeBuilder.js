/*
 * ***** BEGIN LICENSE BLOCK *****
 * OpenPGP Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present Nguyen Van Nguyen <nguyennv1981@gmail.com>

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

OpenPGPMimeBuilder = function() {};

OpenPGPMimeBuilder.prototype = new Object();
OpenPGPMimeBuilder.prototype.constructor = OpenPGPMimeBuilder;

OpenPGPMimeBuilder.prototype.buildPlainText = function(message) {
    message = message || {
        contents: [],
        attachments: []
    };
    var codec = window['emailjs-mime-codec'];
    var MimeNode = window['emailjs-mime-builder'];
    var self = this, textNode, contentNode, alternateNode, contentNodes = [], attachmentNodes = [];

    if (message.contents) {
        message.contents.forEach(function(mp){
            var contentType = mp.ct;
            if (contentType === ZmMimeTable.TEXT_PLAIN || contentType === ZmMimeTable.TEXT_HTML) {
                var node = new MimeNode(contentType)
                    .setHeader('content-transfer-encoding', 'quoted-printable')
                    .setContent(mp.content._content);
                contentNodes.push(node);
            }
            else if (OpenPGPUtils.isPGPContentType(contentType)) {
                var filename = 'message.asc';
                var desc = 'OpenPGP message';
                if (OpenPGPUtils.isSignatureContentType(contentType)) {
                    filename = 'signature.asc';
                    desc = 'OpenPGP signed message';
                }
                if (OpenPGPUtils.isEncryptedContentType(contentType)) {
                    filename = 'encrypted.asc';
                    desc = 'OpenPGP encrypted message';
                }
                if (OpenPGPUtils.isPGPKeysContentType(contentType)) {
                    filename = 'key.asc';
                    desc = 'OpenPGP key message';
                }
                var node = new MimeNode(contentType, {filename: filename})
                    .setHeader('content-transfer-encoding', '7bit')
                    .setHeader('content-disposition', 'inline')
                    .setHeader('content-description', desc)
                    .setContent(mp.content._content);
                attachmentNodes.push(node);
            }
            else {
                var node = new MimeNode(contentType).setContent(mp.content._content);
                contentNodes.push(node);
            }
        });
    }
    if (message.attachments) {
        message.attachments.forEach(function(mp){
            var node = new MimeNode(mp.ct)
                .setHeader('content-transfer-encoding', 'base64')
                .setHeader('content-disposition', mp.cd)
                .setContent(codec.base64.decode(mp.data));
            if (mp.ci) {
                node.setHeader('content-id', mp.ci);
            }
            attachmentNodes.push(node);
        });
    }

    if (contentNodes.length > 0) {
        if (contentNodes.length === 1) {
            contentNode = contentNodes.pop();
        }
        else {
            alternateNode = new MimeNode(ZmMimeTable.MULTI_ALT);
            while (contentNodes.length > 0) {
                alternateNode.appendChild(contentNodes.pop());
            }
        }
    }

    if (attachmentNodes.length > 0) {
        textNode = new MimeNode(ZmMimeTable.MULTI_MIXED);
        if (alternateNode) {
            textNode.appendChild(alternateNode);
        }
        else if (contentNode) {
            textNode.appendChild(contentNode);
        }
        while (attachmentNodes.length > 0) {
            textNode.appendChild(attachmentNodes.pop());
        }
    }
    else {
        if (alternateNode) {
            textNode = alternateNode;
        }
        else if (contentNode) {
            textNode = contentNode;
        }
        else {
            textNode = new MimeNode(ZmMimeTable.TEXT_PLAIN);
        }
    }
    var rootNode = new MimeNode();
    rootNode.appendChild(textNode);
    return textNode;
};

OpenPGPMimeBuilder.prototype.buildSigned = function(mimeNode, signature) {
    var MimeNode = window['emailjs-mime-builder'];
    var ctParts = [
        OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE,
        'protocol="' + OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE + '"',
        'micalg="pgp-sha256"'
    ];
    var signedNode = new MimeNode(ctParts.join('; '));
    signedNode.appendChild(mimeNode);
    signedNode.createChild(OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE)
        .setHeader('content-transfer-encoding', '7bit')
        .setHeader('content-description', 'OpenPGP signed message')
        .setContent(signature);
    return signedNode;
};

OpenPGPMimeBuilder.prototype.buildEncrypted = function(cipherText) {
    var MimeNode = window['emailjs-mime-builder'];
    var ctParts = [
        OpenPGPUtils.ENCRYPTED_MESSAGE_CONTENT_TYPE,
        'protocol="' + OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE + '"'
    ];
    var encryptedNode = new MimeNode(ctParts.join('; '));
    encryptedNode.createChild(OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE)
        .setHeader('content-transfer-encoding', '7bit')
        .setHeader('content-description', 'PGP/MIME Versions Identification')
        .setContent('Version: 1');
    encryptedNode.createChild(ZmMimeTable.APP_OCTET_STREAM, {filename: 'encrypted.asc'})
        .setHeader('content-transfer-encoding', '7bit')
        .setHeader('content-disposition', 'inline')
        .setHeader('content-description', 'OpenPGP encrypted message')
        .setContent(cipherText);
    return encryptedNode;
};
