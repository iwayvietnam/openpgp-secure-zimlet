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

GenerateKeypairView = function(params) {
    params.className = params.className || "DwtComposite GenerateKeypairView";
    DwtComposite.call(this, params);

    this._name = params.name;
    this._emails = params.emails;
    this._passphrase = params.passphrase;
    this._keyOptions = [1024, 2048, 2048];

    this._handler = params.handler;
    this._createHtmlFromTemplate(this.TEMPLATE, {
        id: this.getHTMLElId()
    });

    this._initialize();
};

GenerateKeypairView.prototype = new DwtComposite;
GenerateKeypairView.prototype.constructor = CertificateUserView;

GenerateKeypairView.prototype.TEMPLATE = "openpgp_zimbra_secure#GenerateKeypairView";

GenerateKeypairView.prototype._initialize = function() {
    var id = this.getHTMLElId();

    var txtName = this._txtName = new DwtInputField({parent: this});
    txtName.setValue(AjxStringUtil.htmlEncode(this._name));
    txtName.replaceElement(id + "_txtName");

    var txtEmails = this._txtEmails = new DwtInputField({parent: this});
    txtEmails.setValue(AjxStringUtil.htmlEncode(this._emails));
    txtEmails.replaceElement(id + "_txtEmails");

    var txtPassphrase = this._txtPassphrase = new DwtInputField({parent: this, type:  DwtInputField.PASSWORD});
    txtPassphrase.setValue(AjxStringUtil.htmlEncode(this._passphrase));
    txtPassphrase.replaceElement(id + "_txtPassphrase");

    var selKeyLength = this._selKeyLength = new DwtSelect({parent: this});
    OpenPGPUtils.forEach(this._keyOptions, function(keyLength) {
        var opt = new DwtSelectOption(keyLength, null, keyLength);
        selKeyLength.addOption(opt);
    });
    selKeyLength.replaceElement(id + "_selKeyLength");

    var btnPwdGen = this._btnPwdGen = new DwtButton({parent: this});
    btnPwdGen.setText(OpenPGPUtils.prop('btnPwdGen'));
    btnPwdGen.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._genPw, this));
    btnPwdGen.replaceElement(id + "_btnPwdGen");

    var btnShowHide = this._btnShowHide = new DwtButton({parent: this});
    btnShowHide.setText(OpenPGPUtils.prop('btnShowHide'));
    btnShowHide.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._showHide, this));
    btnShowHide.replaceElement(id + "_btnShowHide");
};

GenerateKeypairView.prototype._genPw = function() {
    this._txtPassphrase.setValue(OpenPGPUtils.randomString({
        length: 24,
        special: true
    }));
}

GenerateKeypairView.prototype._showHide = function() {
}
