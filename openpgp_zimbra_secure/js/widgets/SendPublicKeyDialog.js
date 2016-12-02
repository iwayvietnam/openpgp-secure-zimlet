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

SendPublicKeyDialog = function(handler, onOk, onCancel) {
    OpenPGPDialog.call(
        this,
        handler,
        handler.getMessage('sendPublicKeyTitle'),
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
    var publicKey = this._handler.getKeyStore().getPublicKey();
    var email = this.getEmail();
    var addresses = AjxEmailAddress.getValidAddresses(this.getEmail(), AjxEmailAddress.TO);
    if (publicKey && addresses.size() > 0) {
        var msg = new ZmMailMsg();

        msg.shouldSign = true;
        msg.shouldEncrypt = false;
        msg.attachPublicKey = true;

        var addr = OpenPGPUtils.getDefaultSenderAddress();
        msg.setSubject(AjxMessageFormat.format(this._handler.getMessage('sendPublicKeySubject'), addr.toString()));
        msg.setAddress(AjxEmailAddress.FROM, addr);
        msg.setAddresses(AjxEmailAddress.TO, addresses);

        var textContents = [];
        var keyInfo = OpenPGPSecureKeyStore.keyInfo(publicKey);
        keyInfo.uids.forEach(function(uid, index) {
            textContents.push('User ID[' + index + ']: ' + AjxStringUtil.htmlDecode(uid));
        });
        textContents.push('Fingerprint: ' + keyInfo.fingerprint);
        textContents.push('Key ID: ' + keyInfo.keyid);
        textContents.push('Created: ' + keyInfo.created);
        textContents.push('Key Length: ' + keyInfo.keyLength);

        var textPart = new ZmMimePart();
        textPart.setContentType(ZmMimeTable.TEXT_PLAIN);
        textPart.setContent(textContents.join('\r\n'));
        textPart.setIsBody(true);

        msg.setTopPart(textPart);
        msg.send(false, callback);
    }
};
