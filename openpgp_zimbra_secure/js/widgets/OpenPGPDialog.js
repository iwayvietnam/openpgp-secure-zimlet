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

OpenPGPDialog = function(handler, title, onOk, onCancel, standardButtons) {
    ZmDialog.call(this, {
        title: title,
        parent: appCtxt.getShell(),
        className: "OpenPGP dialog",
        standardButtons: standardButtons
    });
    this._handler = handler;
    this._onOk = onOk;
    this._onCancel = onCancel;

    var submitListener = new AjxListener(this, this._dialogSubmit);
    var cancelListener = new AjxListener(this, this._dialogCancel);

    if (this._button[DwtDialog.OK_BUTTON]) {
        this.setButtonListener(DwtDialog.OK_BUTTON, submitListener);
    }
    if (this._button[DwtDialog.CANCEL_BUTTON]) {
        this.registerCallback(DwtDialog.CANCEL_BUTTON, cancelListener);
    }
    this.setEnterListener(submitListener);
    this._createContent();
    this._initialize();
};

OpenPGPDialog.prototype = new ZmDialog;
OpenPGPDialog.prototype.constructor = OpenPGPDialog;

OpenPGPDialog.prototype.toString = function() {
    return "OpenPGPDialog";
};

OpenPGPDialog.prototype._dialogSubmit = function() {
    var result;
    if (this._onOk instanceof AjxCallback) {
        result = this._onOk.run();
    } else if (AjxUtil.isFunction(this._onOk)) {
        result = this._onOk();
    }
    if (result !== false) {
        this.popdown();
    }
};

OpenPGPDialog.prototype._dialogCancel = function() {
    this.popdown();
    if (this._onCancel instanceof AjxCallback) {
        this._onCancel.run();
    } else if (AjxUtil.isFunction(this._onCancel)) {
        this._onCancel();
    }
};

OpenPGPDialog.prototype.popup = function(onOk, onCancel) {
    if (onOk) {
        this._onOk = onOk;
    }
    if (onCancel) {
        this._onCancel = onCancel;
    }
    DwtDialog.prototype.popup.call(this);
    if (this._focusElement) {
        appCtxt.getKeyboardMgr().grabFocus(this._focusElement);
    }
};

OpenPGPDialog.prototype.clearContentElement = function() {
    while (this._contentEl.hasChildNodes()) {
        this._contentEl.removeChild(this._contentEl.firstChild);
    }
};

OpenPGPDialog.prototype.setContentElement = function(el) {
    this.clearContentElement();
    this._contentEl.appendChild(el);
};

OpenPGPDialog.prototype.getContentContainer = function(el) {
    return this._contentEl;
};

OpenPGPDialog.prototype._createContent = function() {
    if (this.CONTENT_TEMPLATE) {
        this.setContent(AjxTemplate.expand(this.CONTENT_TEMPLATE, this._getTemplateData()));
    }
};

OpenPGPDialog.prototype._getTemplateData = function() {
    return {};
};

OpenPGPDialog.prototype._initialize = function() {
};
