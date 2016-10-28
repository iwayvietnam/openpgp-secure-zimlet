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

GenerateKeypairDialog = function(handler, title, onOk, onCancel, standardButtons) {
    OpenPGPDialog.call(
        this,
        handler,
        title,
        onOk,
        onCancel,
        standardButtons
    );

    if (appCtxt.get(ZmSetting.DISPLAY_NAME)) {
        displayName = appCtxt.get(ZmSetting.DISPLAY_NAME);
    } else {
        displayName = appCtxt.getActiveAccount().name;
    }  

    var emails = [appCtxt.getActiveAccount().name];
    var aliases = appCtxt.get(ZmSetting.MAIL_ALIASES);
    if(aliases) {
        OpenPGPUtils.forEach(aliases, function(alias) {
            emails.push(alias);
        });      
    }

    var view = new GenerateKeypairView({
        parent: this,
        handler: handler,
        name: displayName,
        email: emails.join(', ')
    });
    this.setView(view);
};

GenerateKeypairDialog.prototype = new OpenPGPDialog;
GenerateKeypairDialog.prototype.constructor = GenerateKeypairDialog;

GenerateKeypairDialog.prototype.toString = function() {
    return 'GenerateKeypairDialog';
};
