/*
 * ***** BEGIN LICENSE BLOCK *****
 * OpenPGP Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present OpenPGP Zimbra Secure community

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

OpenPGPSecurePrefs = function(shell, section, controller, handler) {
    if (!arguments.length) return;
    this._handler = handler;
    ZmPreferencesPage.call(this, shell, section, controller);
};

OpenPGPSecurePrefs.SECURITY = 'OPENPGP_SECURITY';

OpenPGPSecurePrefs.SETTINGS = [
    OpenPGPSecurePrefs.SECURITY
];

OpenPGPSecurePrefs._loadCallbacks = [];

OpenPGPSecurePrefs.registerSettings = function(handler) {
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.SECURITY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: 'auto'
    });

    var settings = OpenPGPSecurePrefs.SETTINGS;

    for (var i = 0; i < settings.length; i++) {
        var setting = appCtxt.getSettings().getSetting(settings[i]);
        setting.setValue(handler.getUserProperty(setting.id));
    }
};

AjxDispatcher.addPackageLoadFunction('Preferences', new AjxCallback(function() {

    OpenPGPSecurePrefs.prototype = new ZmPreferencesPage;
    OpenPGPSecurePrefs.prototype.constructor = OpenPGPSecurePrefs;

    OpenPGPSecurePrefs.prototype.toString = function() {
        return 'OpenPGPSecurePrefs';
    };

    // Setup
    OpenPGPSecurePrefs.registerPrefs = function(handler) {
        var msg = function(key){return openpgp_zimbra_secure[key];};
        ZmPref.registerPref(OpenPGPSecurePrefs.SECURITY, {
            displayContainer:   ZmPref.TYPE_RADIO_GROUP,
            orientation:        ZmPref.ORIENT_VERTICAL,
            displayOptions:     [msg('prefSecurityAuto'), msg('prefSecurityNone'), msg('prefSecuritySign'), msg('prefSecurityBoth')],
            options:            ['auto', '0', '1', '2']
        });
    
        var section = {
            title: msg('prefSection'),
            icon: 'TrustedAddresses',
            templateId: 'openpgp_zimbra_secure#Preferences',
            priority: 49,
            manageDirty: true,
            prefs: [
                ZmSetting[OpenPGPSecurePrefs.SECURITY]
            ],
            createView: function(parent, sectionObj, controller) {
                return new OpenPGPSecurePrefs(parent, sectionObj, controller, handler);
            }
        };
        ZmPref.registerPrefSection('OPENPGP_SECURITY', section);
    };

    // Saving
    OpenPGPSecurePrefs.prototype.addCommand = function(batchCommand) {
        batchCommand.add(new AjxCallback(this, this._savePrefs));
        batchCommand.size = function() {
            return this.curId || this._cmds.length;
        };
    };

    OpenPGPSecurePrefs.prototype._savePrefs = function(batchCommand) {
        var settings = OpenPGPSecurePrefs.SETTINGS;
        var zmSettings = appCtxt.getSettings();
        for (var i = 0; i < settings.length; i++) {
            var setting = zmSettings.getSetting(settings[i]);
            var value = setting.getValue();
            this._handler.setUserProperty(setting.id, value);
            setting.origValue = value;
        }
        this._controller.setDirty(this._section.id, false);

        if (batchCommand) {
            var soapDoc = AjxSoapDoc.create('NoOpRequest', 'urn:zimbraMail');
            batchCommand.addRequestParams(soapDoc);
        }
        this._handler.saveUserProperties();
    };

    for (var i = 0; i < OpenPGPSecurePrefs._loadCallbacks.length; i++) {
        OpenPGPSecurePrefs._loadCallbacks[i].run();
    }
    delete OpenPGPSecurePrefs._loadCallbacks;
}));

OpenPGPSecurePrefs.init = function(handler) {
    OpenPGPSecurePrefs.registerSettings(handler);

    var cb = new AjxCallback(function(){
        OpenPGPSecurePrefs.registerPrefs(handler);
    });

    if (OpenPGPSecurePrefs._loadCallbacks) {
        OpenPGPSecurePrefs._loadCallbacks.push(cb);
    } else {
        cb.run();
    }
};
