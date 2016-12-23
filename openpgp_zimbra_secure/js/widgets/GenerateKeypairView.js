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

GenerateKeypairView = function(params) {
    params.className = params.className || 'DwtComposite GenerateKeypairView';
    DwtComposite.call(this, params);

    this._name = params.name;
    this._email = params.email;
    this._numBits = [1024, 2048, 4096];

    this._createHtmlFromTemplate(this.TEMPLATE, {
        id: this.getHTMLElId()
    });

    this._initialize();
};

GenerateKeypairView.prototype = new DwtComposite;
GenerateKeypairView.prototype.constructor = GenerateKeypairView;

GenerateKeypairView.prototype.toString = function() {
    return 'GenerateKeypairView';
};

GenerateKeypairView.prototype.TEMPLATE = OpenPGPZimbraSecure.NAME + '#GenerateKeypairView';

GenerateKeypairView.prototype._initialize = function() {
    var id = this.getHTMLElId();

    var txtName = this.txtName = new DwtInputField({parent: this, className: 'GenKeyInput'});
    txtName.setValue(AjxStringUtil.htmlEncode(this._name));
    txtName.replaceElement(id + '_txtName');

    var txtEmail = this.txtEmail = new DwtInputField({parent: this, className: 'GenKeyInput'});
    txtEmail.setValue(AjxStringUtil.htmlEncode(this._email));
    txtEmail.replaceElement(id + '_txtEmail');

    var txtPassphrase = this.txtPassphrase = new DwtInputField({parent: this, className: 'GenKeyInput', type: DwtInputField.PASSWORD});
    txtPassphrase.setValue(OpenPGPUtils.randomString({
        length: 24
    }));
    txtPassphrase.replaceElement(id + '_txtPassphrase');

    var selNumBits = this.selNumBits = new DwtSelect({parent: this});
    this._numBits.forEach(function(numBits) {
        var selected = (numBits === 2048);
        var opt = new DwtSelectOption(numBits, selected, numBits);
        selNumBits.addOption(opt);
    });
    selNumBits.replaceElement(id + '_selNumBits');

    var btnPwdGen = this.btnPwdGen = new DwtButton({parent: this});
    btnPwdGen.setText(OpenPGPUtils.getMessage('btnPwdGen'));
    btnPwdGen.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._genPw, this));
    btnPwdGen.replaceElement(id + '_btnPwdGen');

    var btnShowHide = this.btnShowHide = new DwtButton({parent: this});
    btnShowHide.setText(OpenPGPUtils.getMessage('btnShowHide'));
    btnShowHide.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._showHide, this));
    btnShowHide.replaceElement(id + '_btnShowHide');
};

GenerateKeypairView.prototype._genPw = function() {
    this.txtPassphrase.setValue(OpenPGPUtils.randomString({
        length: 24
    }));
};

GenerateKeypairView.prototype._showHide = function() {
    var id = this.getHTMLElId();
    var input = document.getElementById(id + '_txtPassphrase');
    if (input.getAttribute('type') == 'password') {
        input.setAttribute('type', 'text');
    } else {
        input.setAttribute('type', 'password');   
    }
};
