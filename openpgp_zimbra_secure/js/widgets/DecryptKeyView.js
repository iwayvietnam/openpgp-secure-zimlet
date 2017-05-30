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

DecryptKeyView = function(params) {
    params.className = params.className || 'DwtComposite DecryptKeyView';
    DwtComposite.call(this, params);

    this._privateKey = params.privateKey;

    this._createHtmlFromTemplate(this.TEMPLATE, {
        id: this.getHTMLElId()
    });

    this._initialize();
};

DecryptKeyView.prototype = new DwtComposite;
DecryptKeyView.prototype.constructor = DecryptKeyView;

DecryptKeyView.prototype.toString = function() {
    return 'DecryptKeyView';
};

DecryptKeyView.prototype.TEMPLATE = OpenPGPZimbraSecure.NAME + '#DecryptKeyView';

DecryptKeyView.prototype._initialize = function() {
    var id = this.getHTMLElId();

    var txtPrivateKey = this.txtPrivateKey = new DwtInputField({
        parent: this,
        forceMultiRow: true,
        className: 'KeyAddInput'
    });
    txtPrivateKey.setValue(AjxStringUtil.htmlEncode(this._privateKey));
    txtPrivateKey.replaceElement(id + '_txtPrivateKey');

    var txtPassphrase = this.txtPassphrase = new DwtInputField({
        parent: this,
        className: 'GenKeyInput',
        type: DwtInputField.PASSWORD
    });
    txtPassphrase.replaceElement(id + '_txtPassphrase');
};
