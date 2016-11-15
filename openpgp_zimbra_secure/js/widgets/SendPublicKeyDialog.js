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

SendPublicKeyDialog = function(handler, onOk, onCancel) {
    OpenPGPDialog.call(
        this,
        handler,
        OpenPGPUtils.prop('sendPublicKeyTitle'),
        onOk,
        onCancel,
        [DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]
    );

    this.setView(new SendPublicKeyView({
        parent: this
    }));
};

SendPublicKeyDialog.prototype = new OpenPGPDialog;
SendPublicKeyDialog.prototype.constructor = SendPublicKeyDialog;

SendPublicKeyDialog.prototype.toString = function() {
    return 'SendPublicKeyDialog';
};

SendPublicKeyDialog.prototype.getEmail = function() {
    return this.getView().txtEmail.getValue();
};

SendPublicKeyDialog.prototype.setEmail = function(email) {
    return this.getView().txtEmail.setValue(email);
};

SendPublicKeyDialog.prototype.sendPubicKey = function(callback) {
    var publicKey = this._handler.getPGPKeys().getPublicKey();
    var email = this.getEmail();
    var addresses = emailAddresses.parseAddressList(email);
    if (publicKey && addresses.length > 0) {
        var addr = OpenPGPUtils.getDefaultSenderAddress();

        var msg = new ZmMailMsg();
        msg.shouldEncrypt = false;
        msg.setSubject(AjxMessageFormat.format(OpenPGPUtils.prop('sendPublicKeySubject'), addr.toString()));
        msg.setAddress(AjxEmailAddress.FROM, addr);
        var addrs = new AjxVector();
        addresses.forEach(function(address) {
            addrs.add(new AjxEmailAddress(address.address, AjxEmailAddress.TO, address.name));
        });
        msg.setAddresses(AjxEmailAddress.TO, addrs);

        var top = new ZmMimePart();
        top.setContentType(ZmMimeTable.MULTI_MIXED);

        var textContents = [];
        var keyInfo = OpenPGPSecureKeys.keyInfo(publicKey);
        keyInfo.uids.forEach(function(uid, index) {
            textContents.push('User ID[' + index + ']: ' + AjxStringUtil.htmlDecode(uid));
        });
        textContents.push('Fingerprint: ' + keyInfo.fingerprint);
        textContents.push('Key ID: ' + keyInfo.keyid);
        textContents.push('Created: ' + keyInfo.created);
        textContents.push('Key Length: ' + keyInfo.keyLength);

        var textPart = new ZmMimePart();
        textPart.setContentType(ZmMimeTable.TEXT_PLAIN);
        textPart.setContent(textContents.join("\r\n"));
        textPart.setIsBody(true);
        top.children.add(textPart);

        var keyPart = new ZmMimePart();
        keyPart.setContentType(OpenPGPUtils.OPENPGP_KEYS_CONTENT_TYPE);
        keyPart.setContent(publicKey.armor());
        top.children.add(keyPart);

        msg.setTopPart(top);
        msg.send(false, callback);
    }
};
