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

GenerateKeypairDialog = function(handler, onOk, onCancel) {
    OpenPGPDialog.call(
        this,
        handler,
        handler.getMessage('keyPairGenTitle'),
        onOk,
        onCancel,
        [DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]
    );

    if (appCtxt.get(ZmSetting.DISPLAY_NAME)) {
        displayName = appCtxt.get(ZmSetting.DISPLAY_NAME);
    } else {
        displayName = appCtxt.getActiveAccount().name;
    }  

    var emails = [appCtxt.getActiveAccount().name];
    var aliases = appCtxt.get(ZmSetting.MAIL_ALIASES);
    if(aliases) {
        aliases.forEach(function(alias) {
            emails.push(alias);
        });      
    }

    var view = new GenerateKeypairView({
        parent: this,
        name: displayName,
        email: emails.join(', ')
    });
    this.setView(view);
};

GenerateKeypairDialog.prototype = new OpenPGPDialog;
GenerateKeypairDialog.prototype.constructor = GenerateKeypairDialog;

GenerateKeypairDialog.prototype.toString = function() {
    return 'GenerateKeypairDialog';
};

GenerateKeypairDialog.prototype.generateKey = function() {
    var view = this.getView();
    var name = view.txtName.getValue();
    var email = view.txtEmail.getValue();
    var passphrase = view.txtPassphrase.getValue();
    var numBits = view.selNumBits.getValue();

    var userIds = [];
    var addrs = AjxEmailAddress.getValidAddresses(email);
    addrs.foreach(function(addr) {
        userIds.push({name: name, email: addr.getAddress()});
    });

    var opts = {
        userIds: userIds,
        numBits: numBits,
        passphrase: passphrase
    };
    return openpgp.generateKey(opts).then(function(key) {
        return {
            privateKey: AjxStringUtil.trim(key.privateKeyArmored),
            publicKey: AjxStringUtil.trim(key.publicKeyArmored),
            passphrase: passphrase
        };
    });
};
