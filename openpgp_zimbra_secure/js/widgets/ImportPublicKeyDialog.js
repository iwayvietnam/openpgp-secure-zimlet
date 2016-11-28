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

ImportPublicKeyDialog = function(handler, onOk, onCancel, key) {
    OpenPGPDialog.call(
        this,
        handler,
        handler.getMessage('importPublicKeyTitle'),
        onOk,
        onCancel,
        [DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]
    );
    this._key = key;

    this.setView(new ImportPublicKeyView({
        parent: this
    }, OpenPGPSecureKeyStore.keyInfo(key)));
};

ImportPublicKeyDialog.prototype = new OpenPGPDialog;
ImportPublicKeyDialog.prototype.constructor = ImportPublicKeyDialog;

ImportPublicKeyDialog.prototype.toString = function() {
    return 'ImportPublicKeyDialog';
};

ImportPublicKeyDialog.prototype.importPublicKey = function() {
    this._handler.getKeyStore().addPublicKey(this._key);
    this._handler.displayStatusMessage(this._handler.getMessage('publicKeyImported'));
    this._handler.handlePublicKeyChange();
};
