/**
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

OpenPGPMimeBuilder.SIGNED_PREAMBLE = 'This is an OpenPGP/MIME signed message (RFC 4880 and 3156)';
OpenPGPMimeBuilder.ENCRYPTED_PREAMBLE = 'This is an OpenPGP/MIME encrypted message (RFC 4880 and 3156)';
OpenPGPMimeBuilder.VERSION_CONTENT = 'Version: 1';

OpenPGPMimeBuilder.PGP_DESC = 'OpenPGP message';
OpenPGPMimeBuilder.SIGNED_DESC = 'OpenPGP digital signature';
OpenPGPMimeBuilder.ENCRYPTED_DESC = 'OpenPGP encrypted message';
OpenPGPMimeBuilder.KEY_DESC = 'OpenPGP key message';
OpenPGPMimeBuilder.VERSION_DESC = 'PGP/MIME Versions Identification';

OpenPGPMimeBuilder.prototype = new Object();
OpenPGPMimeBuilder.prototype.constructor = OpenPGPMimeBuilder;

OpenPGPMimeBuilder.prototype.buildPlainText = function(message) {
    message = message || {
        contents: [],
        attachments: []
    };
    var MimeNode = window['emailjs-mime-builder'];
    var self = this, textNode, contentNode, alternateNode, contentNodes = [], attachmentNodes = [];

    if (message.contents) {
        message.contents.forEach(function(mp){
            var node = new MimeNode(contentType).setContent(mp.content._content);
            var contentType = mp.ct;
            if (contentType === ZmMimeTable.TEXT_PLAIN || contentType === ZmMimeTable.TEXT_HTML) {
                node.setHeader('content-transfer-encoding', 'quoted-printable');
            }
            contentNodes.push(node);
        });
    }
    if (message.attachments) {
        message.attachments.forEach(function(mp){
            var node = new MimeNode(mp.ct)
                .setHeader('content-transfer-encoding', mp.cte)
                .setHeader('content-disposition', mp.cd)
                .setContent(OpenPGPUtils.base64Decode(mp.data));
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
    var signedNode = new MimeNode(ctParts.join('; '))
        .setContent(OpenPGPMimeBuilder.SIGNED_PREAMBLE);
    signedNode.appendChild(mimeNode);
    signedNode.createChild(OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE)
        .setHeader('content-transfer-encoding', '7bit')
        .setHeader('content-description', OpenPGPMimeBuilder.SIGNED_DESC)
        .setContent(signature);
    return signedNode;
};

OpenPGPMimeBuilder.prototype.buildEncrypted = function(cipherText) {
    var MimeNode = window['emailjs-mime-builder'];
    var ctParts = [
        OpenPGPUtils.ENCRYPTED_MESSAGE_CONTENT_TYPE,
        'protocol="' + OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE + '"'
    ];
    var encryptedNode = new MimeNode(ctParts.join('; '))
        .setContent(OpenPGPMimeBuilder.ENCRYPTED_PREAMBLE);
    encryptedNode.createChild(OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE)
        .setHeader('content-transfer-encoding', '7bit')
        .setHeader('content-description', OpenPGPMimeBuilder.VERSION_DESC)
        .setContent(OpenPGPMimeBuilder.VERSION_CONTENT);
    encryptedNode.createChild(ZmMimeTable.APP_OCTET_STREAM, {filename: 'encrypted.asc'})
        .setHeader('content-transfer-encoding', '7bit')
        .setHeader('content-disposition', 'inline')
        .setHeader('content-description', OpenPGPMimeBuilder.ENCRYPTED_DESC)
        .setContent(cipherText);
    return encryptedNode;
};
