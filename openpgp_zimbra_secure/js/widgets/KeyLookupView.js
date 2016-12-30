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

KeyLookupView = function(params) {
    params.className = params.className || 'DwtComposite KeyLookupView';
    DwtComposite.call(this, params);

    this._handler = params.handler;
    this._hkp = new openpgp.HKP(params.keyServer);

    this._createHtmlFromTemplate(this.TEMPLATE, {
        id: this.getHTMLElId()
    });

    this._initialize();
};

KeyLookupView.prototype = new DwtComposite;
KeyLookupView.prototype.constructor = KeyLookupView;

KeyLookupView.prototype.toString = function() {
    return 'KeyLookupView';
};

KeyLookupView.prototype.TEMPLATE = OpenPGPZimbraSecure.NAME + '#KeyLookupView';

KeyLookupView.prototype._initialize = function() {
    var id = this.getHTMLElId();

    var txtQuery = this.txtQuery = new DwtInputField({parent: this, className: 'KeyLookupInput'});
    txtQuery.replaceElement(id + '_txtQuery');

    var btnSearch = this.btnSearch = new DwtButton({parent: this});
    btnSearch.setText(this._handler.getMessage('btnSearch'));
    btnSearch.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyLookup, this));
    btnSearch.replaceElement(id + '_btnSearch');
};

KeyLookupView.prototype.reset = function() {
    this.txtQuery.setValue('');
    document.getElementById(this.getHTMLElId() + '_Result').innerHTML = '';
};

KeyLookupView.prototype._keyLookup = function() {
    var self = this;
    var query = this.txtQuery.getValue();
    if (query.length > 0) {
        var opts = {
            query: query
        };
        this._hkp.lookup(opts).then(function(publicKey) {
            var id = self.getHTMLElId();
            var pubKey = openpgp.key.readArmored(publicKey);
            var html = '';
            pubKey.keys.forEach(function(key) {
                html = html + OpenPGPUtils.renderTemplate('KeyLookupResult', OpenPGPSecureKeyStore.keyInfo(key));
            });
            document.getElementById(id + '_Result').innerHTML = html;
        });
    }
};
