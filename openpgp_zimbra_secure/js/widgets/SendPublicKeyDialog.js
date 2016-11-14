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

SendPublicKeyDialog.prototype.sendPubicKey = function(callback) {
    var privateKey = this._handler.getPGPKeys().getPrivateKey();
    if (privateKey) {
        var addr = OpenPGPUtils.getDefaultSenderAddress();
        var email = this.getView().txtEmail.getValue();
        var addresses = emailAddresses.parseAddressList(email);

        var msg = new ZmMailMsg();
        msg.setSubject(AjxMessageFormat.format(OpenPGPUtils.prop('sendPublicKeySubject'), addr.toString()));
        msg.setAddress(AjxEmailAddress.FROM, addr);
        addresses.forEach(function(address) {
            msg.addAddress(AjxEmailAddress.TO, new AjxEmailAddress(address.address, AjxEmailAddress.TO, address.name));
        });

        var top = new ZmMimePart();
        top.setContentType(ZmMimeTable.MULTI_MIXED);

        var textContents = [];
        privateKey.users.forEach(function(user, index) {
            textContents.push('User ID[' + index + ']: ' + user.userId.userid);
        });
        textContents.push('Fingerprint: ' + privateKey.primaryKey.fingerprint);
        textContents.push('Key ID: ' + privateKey.keyid.toHex());
        textContents.push('Created: ' + privateKey.primaryKey.created);
        var keyLength = '';
        if (privateKey.primaryKey.mpi.length > 0) {
            keyLength = (privateKey.primaryKey.mpi[0].byteLength() * 8);
        }
        textContents.push('Key Length: ' + keyLength);

        var textPart = new ZmMimePart();
        textPart.setContentType(ZmMimeTable.TEXT_PLAIN);
        textPart.setContent(textContents.join("\r\n"));
        textPart.setIsBody(true);
        top.children.add(textPart);

        var keyPart = new ZmMimePart();
        keyPart.setContentType('application/pgp-keys');
        keyPart.setContent(privateKey.armor());
        top.children.add(keyPart);

        msg.setTopPart(top);
        msg.send(false, callback);
    }
};
