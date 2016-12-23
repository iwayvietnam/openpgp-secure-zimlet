/**
 * ***** BEGIN LICENSE BLOCK *****
 * OpenPGP Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present iWay Vietnam - http://www.iwayvietnam.com

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

PublicKeyListView = function(params) {
    params.className = params.className || 'DwtListView PublicKeyListView';
    params.headerList = params.headerList || this._getHeaderList();
    DwtListView.call(this, params);
    this.createHeaderHtml();
    this.setSize('100%', '100%');

    this._onDeleteItem = params.onDeleteItem || function(item) {};
    this._itemIds = [];

    var self = this;
    var publicKeys = params.publicKeys || [];
    publicKeys.forEach(function(key) {
        self.addPublicKey(key);
    });

    this.addActionListener(new AjxListener(this, this._listActionListener));
};

PublicKeyListView.prototype = new DwtListView;
PublicKeyListView.prototype.constructor = PublicKeyListView;

PublicKeyListView.prototype.toString = function() {
    return 'PublicKeyListView';
};

PublicKeyListView.FIELD_UID = 'uid';
PublicKeyListView.FIELD_FINGERPRINT = 'fingerprint';
PublicKeyListView.FIELD_KEY_LENGTH = 'keyLength';
PublicKeyListView.FIELD_CREATED = 'created';

PublicKeyListView.prototype.addPublicKey = function(key) {
    var keyInfo = OpenPGPSecureKeyStore.keyInfo(key);
    var fingerprint = keyInfo.fingerprint;

    if (!this._itemIds[fingerprint]) {
        this._itemIds[fingerprint] = fingerprint;

        var keyUid = '';
        if (keyInfo.uids) {
            keyInfo.uids.forEach(function(uid) {
                keyUid += uid + '<br>';
            });
        }

        this.addItem({
            id: fingerprint,
            uid: keyUid,
            fingerprint: fingerprint,
            keyLength: keyInfo.keyLength,
            created: keyInfo.created.toISOString().substr(0, 10)
        });
    }
};

PublicKeyListView.prototype._getHeaderList = function () {
    var headers = [];
    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_UID,
        text: OpenPGPUtils.getMessage('prefUid')
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_FINGERPRINT,
        text: OpenPGPUtils.getMessage('prefFingerprint'),
        width: 330
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_KEY_LENGTH,
        text: OpenPGPUtils.getMessage('prefKeyLength'),
        width: 100
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_CREATED,
        text: OpenPGPUtils.getMessage('prefCreated'),
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
        htmlArr[idx++] = item.keyLength;
    }
    else if (field === PublicKeyListView.FIELD_CREATED) {
        htmlArr[idx++] = item.created;
    }
    else {
        htmlArr[idx++] = item.toString ? item.toString() : item;
    }
    return idx;
};

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
        (ZmMsg.confirmDeleteForever).replace(/{0,.*,1#|\|2#.*\}/g, ''),
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
