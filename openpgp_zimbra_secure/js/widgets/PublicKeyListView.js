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
    params.publicKeys = params.publicKeys || [];
    DwtListView.call(this, params);
    this.createHeaderHtml(PublicKeyListView.FIELD_UID);
    this.setSize('100%', '100%');

    this._pgp = pgp || openpgp;
    this._pgpKey = this._pgp.key;

    this._publicKeys = [];
    this._dupes = [];

    var self = this;
    params.publicKeys.forEach(function(key) {
        self.addPublicKey(key);
    });
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

PublicKeyListView.prototype._getHeaderList = function () {
    var headers = [];

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_UID,
        text: OpenPGPUtils.prop('prefUid'),
        sortable: PublicKeyListView.FIELD_UID
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_FINGERPRINT,
        text: OpenPGPUtils.prop('prefFingerprint'),
        width: 330,
        sortable: PublicKeyListView.FIELD_FINGERPRINT
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_KEY_LENGTH,
        text: OpenPGPUtils.prop('prefKeyLength'),
        width: 100,
        sortable: PublicKeyListView.FIELD_KEY_LENGTH
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_CREATED,
        text: OpenPGPUtils.prop('prefCreated'),
        width: 170,
        sortable: PublicKeyListView.FIELD_CREATED
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

PublicKeyListView.prototype.addPublicKey = function(armoredKey) {
    var self = this;
    var pubKey = this._pgpKey.readArmored(armoredKey);
    pubKey.keys.forEach(function(key) {
        self._publicKeys.push(key);
        var priKey = key.primaryKey;
        var isDuplicate = false;

        var fingerprint = priKey.fingerprint;
        var keyUid = '';
        key.users.forEach(function(user) {
            var uid = user.userId.userid;
            if (!self._dupes[fingerprint + uid]) {
                self._dupes[fingerprint + uid] = fingerprint + uid;
                keyUid = keyUid + AjxStringUtil.htmlEncode(uid) + '<br>';
            }
            else {
                isDuplicate = true;
            }
        });
        if (!isDuplicate) {
            var keyLength = '';
            if (priKey.mpi.length > 0) {
                keyLength = (priKey.mpi[0].byteLength() * 8);
            }
            self.addItem({
                uid: keyUid,
                fingerprint: fingerprint,
                key_length: keyLength,
                created: priKey.created
            });
        }
    });
}