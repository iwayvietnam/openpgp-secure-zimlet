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
    var self = this;
    OpenPGPUtils.forEach(params.publicKeys, function(key) {
        self._publicKeys = self._publicKeys.concat(self._pgpKey.readArmored(key).keys);
    });
    console.log(this._publicKeys);
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
        width: ZmMsg.COLUMN_WIDTH_TYPE_DLV,
        sortable: PublicKeyListView.FIELD_FINGERPRINT
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_KEY_LENGTH,
        text: OpenPGPUtils.prop('prefPriKeyLength'),
        width: ZmMsg.COLUMN_WIDTH_SIZE_DLV,
        sortable: PublicKeyListView.FIELD_KEY_LENGTH
    }));

    headers.push(new DwtListHeaderItem({
        field: PublicKeyListView.FIELD_CREATED,
        text: OpenPGPUtils.prop('prefCreated'),
        width: ZmMsg.COLUMN_WIDTH_DATE_DLV,
        sortable: PublicKeyListView.FIELD_CREATED
    }));

    return headers;
};
