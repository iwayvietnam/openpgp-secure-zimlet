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

PublicKeyListView = function(params, pgp) {
    params.className = params.className || 'DwtListView PublicKeyListView';
    params.headerList = params.headerList || this._getHeaderList();
    DwtListView.call(this, params);
    this.createHeaderHtml();
    this.setSize('100%', '100%');

    this._onDeleteItem = params.onDeleteItem || function(item) {};
    this._pgp = pgp || openpgp;
    this._pgpKey = this._pgp.key;
    this._itemIds = [];

    var self = this;
    var publicKeys = params.publicKeys || [];
    publicKeys.forEach(function(key) {
        self.addPublicKey(key);
    });

    this.addActionListener(new AjxListener(this, this._listActionListener));
}

PublicKeyListView.prototype = new DwtListView;
PublicKeyListView.prototype.constructor = PublicKeyListView;

PublicKeyListView.prototype.toString = function() {
    return 'PublicKeyListView';
};

PublicKeyListView.FIELD_UID = 'uid';
PublicKeyListView.FIELD_FINGERPRINT = 'fingerprint';
PublicKeyListView.FIELD_KEY_LENGTH = 'key_length';
PublicKeyListView.FIELD_CREATED = 'created';

PublicKeyListView.prototype.addPublicKey = function(armoredKey) {
    var self = this;
    var pubKey = this._pgpKey.readArmored(armoredKey);
    pubKey.keys.forEach(function(key) {
        var priKey = key.primaryKey;

        var fingerprint = priKey.fingerprint;
        if (!self._itemIds[fingerprint]) {
            self._itemIds[fingerprint] = fingerprint;

            var keyUid = '';
            key.users.forEach(function(user) {
                keyUid = keyUid + AjxStringUtil.htmlEncode(user.userId.userid) + '<br>';
            });

            var keyLength = '';
            if (priKey.mpi.length > 0) {
                keyLength = (priKey.mpi[0].byteLength() * 8);
            }
            self.addItem({
                id: fingerprint,
                uid: keyUid,
                fingerprint: fingerprint,
                key_length: keyLength,
                created: priKey.created
            });
        }
    });
}

PublicKeyListView.prototype._getHeaderList = function () {
    var headers = [];

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_UID,
        text: OpenPGPUtils.prop('prefUid')
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_FINGERPRINT,
        text: OpenPGPUtils.prop('prefFingerprint'),
        width: 330
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_KEY_LENGTH,
        text: OpenPGPUtils.prop('prefKeyLength'),
        width: 100
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_CREATED,
        text: OpenPGPUtils.prop('prefCreated'),
        width: 170
    }));

    return headers;
};

PublicKeyListView.prototype._getCellContents = function(htmlArr, idx, item, field, colIdx, params) {
    if (field === PublicKeyListView.FIELD_UID) {
        htmlArr[idx++] = item.uid;
    }
    else if (field === PublicKeyListView.FIELD_FINGERPRINT) {
        htmlArr[idx++] = item.fingerprint;
    }
    else if (field === PublicKeyListView.FIELD_KEY_LENGTH) {
        htmlArr[idx++] = item.key_length;
    }
    else if (field === PublicKeyListView.FIELD_CREATED) {
        htmlArr[idx++] = item.created;
    }
    else {
        htmlArr[idx++] = item.toString ? item.toString() : item;
    }
    return idx;
}

PublicKeyListView.prototype._listActionListener = function (ev) {
    var actionMenu = this._initializeActionMenu();
    actionMenu.popup(0, ev.docX, ev.docY);
};

PublicKeyListView.prototype._initializeActionMenu = function () {
    if (!this._actionMenu) {
        var params = {
            parent: appCtxt.getShell(),
            menuItems: [ZmOperation.DELETE],
            context: this.toString(),
            controller: this
        };
        this._actionMenu = new ZmActionMenu(params);
        this._addMenuListeners(this._actionMenu);
    }
    return this._actionMenu;
};

PublicKeyListView.prototype._addMenuListeners = function (menu) {
    menu.addSelectionListener(ZmOperation.DELETE, new AjxListener(this, this._deleteListener), 0);
    menu.addPopdownListener(new AjxListener(this, this._menuPopdownListener));
};

PublicKeyListView.prototype._deleteListener = function() {
    var deleteDialog = new DwtMessageDialog({
        parent: appCtxt.getShell(),
        buttons: [DwtDialog.YES_BUTTON, DwtDialog.NO_BUTTON]
    });
    deleteDialog.setMessage(
        (ZmMsg.confirmDeleteForever).replace(/{0,.*,1#|\|2#.*\}/g,""),
        DwtMessageDialog.WARNING_STYLE,
        ZmMsg.remove
    );

    var listener = new AjxListener(this, this._deleteCallback, [deleteDialog]);
    deleteDialog.setButtonListener(DwtDialog.YES_BUTTON, listener);
    deleteDialog.addEnterListener(listener);
    deleteDialog.popup();
};

PublicKeyListView.prototype._deleteCallback = function(dialog) {
    var items = this.getSelection();
    if (items.length > 0) {
        var item = items[0];
        this._onDeleteItem(item);
        delete this._itemIds[item.id];
        this.removeItem(item);
    }
    dialog.popdown();
};

PublicKeyListView.prototype._menuPopdownListener = function(menu) {
};