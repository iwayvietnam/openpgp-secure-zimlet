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
OpenPGPSecurePrefs.PRIVATE_KEY = 'OPENPGP_PRIVATE_KEY';
OpenPGPSecurePrefs.PASSPHRASE = 'OPENPGP_PASSPHRASE';
OpenPGPSecurePrefs.PUBLIC_KEY = 'OPENPGP_PUBLIC_KEY';

OpenPGPSecurePrefs.GEN_KEYPAIR = 'OPENPGP_GEN_KEYPAIR';
OpenPGPSecurePrefs.SUBMIT_KEY = 'OPENPGP_SUBMIT_KEY';


OpenPGPSecurePrefs.SETTINGS = [
    OpenPGPSecurePrefs.SECURITY,
    OpenPGPSecurePrefs.PUBLIC_KEY
];

OpenPGPSecurePrefs._loadCallbacks = [];

OpenPGPSecurePrefs.registerSettings = function(handler) {
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.SECURITY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: 'auto'
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.PRIVATE_KEY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.PASSPHRASE, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.PUBLIC_KEY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING
    });

    OpenPGPUtils.forEach(OpenPGPSecurePrefs.SETTINGS, function(name) {
        var setting = appCtxt.getSettings().getSetting(name);
        setting.setValue(handler.getUserProperty(setting.id));
    });
};

AjxDispatcher.addPackageLoadFunction('Preferences', new AjxCallback(function() {

    OpenPGPSecurePrefs.prototype = new ZmPreferencesPage;
    OpenPGPSecurePrefs.prototype.constructor = OpenPGPSecurePrefs;

    OpenPGPSecurePrefs.prototype.toString = function() {
        return 'OpenPGPSecurePrefs';
    };

    // Setup
    OpenPGPSecurePrefs.registerPrefs = function(handler) {
        ZmPref.registerPref(OpenPGPSecurePrefs.SECURITY, {
            displayContainer: ZmPref.TYPE_RADIO_GROUP,
            orientation:      ZmPref.ORIENT_VERTICAL,
            displayOptions:   [
                OpenPGPUtils.prop('prefSecurityAuto'),
                OpenPGPUtils.prop('prefSecurityNone'),
                OpenPGPUtils.prop('prefSecuritySign'),
                OpenPGPUtils.prop('prefSecurityBoth')
            ],
            options:          ['auto', '0', '1', '2']
        });

        ZmPref.registerPref(OpenPGPSecurePrefs.PRIVATE_KEY, {
            displayName:      OpenPGPUtils.prop('prefPrivateKey'),
            displayContainer: ZmPref.TYPE_TEXTAREA
        });

        ZmPref.registerPref(OpenPGPSecurePrefs.PASSPHRASE, {
            displayName:      OpenPGPUtils.prop('prefPassphrase'),
            displayContainer: ZmPref.TYPE_INPUT
        });

        ZmPref.registerPref(OpenPGPSecurePrefs.PUBLIC_KEY, {
            displayName:      OpenPGPUtils.prop('prefPublicKey'),
            displayContainer: ZmPref.TYPE_TEXTAREA
        });
    
        ZmPref.registerPref(OpenPGPSecurePrefs.GEN_KEYPAIR, {
            displayContainer: ZmPref.TYPE_STATIC
        });
        ZmPref.registerPref(OpenPGPSecurePrefs.SUBMIT_KEY, {
            displayContainer: ZmPref.TYPE_STATIC
        });

        var section = {
            title: OpenPGPUtils.prop('prefSection'),
            icon: 'TrustedAddresses',
            templateId: 'openpgp_zimbra_secure#Preferences',
            priority: 49,
            manageDirty: true,
            prefs: [
                ZmSetting[OpenPGPSecurePrefs.SECURITY],
                ZmSetting[OpenPGPSecurePrefs.PRIVATE_KEY],
                ZmSetting[OpenPGPSecurePrefs.PASSPHRASE],
                ZmSetting[OpenPGPSecurePrefs.PUBLIC_KEY],
                ZmSetting[OpenPGPSecurePrefs.GEN_KEYPAIR],
                ZmSetting[OpenPGPSecurePrefs.SUBMIT_KEY]
            ],
            createView: function(parent, sectionObj, controller) {
                return new OpenPGPSecurePrefs(parent, sectionObj, controller, handler);
            }
        };
        ZmPref.registerPrefSection(OpenPGPSecurePrefs.SECURITY, section);
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

        OpenPGPUtils.forEach(settings, function(name) {
            var setting = zmSettings.getSetting(name);
            var value = setting.getValue();
            this._handler.setUserProperty(setting.id, value);
            setting.origValue = value;
        });

        this._controller.setDirty(this._section.id, false);

        if (batchCommand) {
            var soapDoc = AjxSoapDoc.create('NoOpRequest', 'urn:zimbraMail');
            batchCommand.addRequestParams(soapDoc);
        }
        this._handler.saveUserProperties();
    };

    OpenPGPSecurePrefs.prototype._setupStatic = function(id, setup, value) {
        if (id == OpenPGPSecurePrefs.GEN_KEYPAIR) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnKeyGen'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyGen, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.SUBMIT_KEY) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnKeySubmit'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keySubmit, this));
            return button;
        } else {
            return ZmPreferencesPage.prototype._setupStatic.apply(this, arguments);
        }
    };

    OpenPGPSecurePrefs.prototype._keyGen = function() {
        var dialog = new GenerateKeypairDialog(this._handler);
        dialog.popup();
    }

    OpenPGPSecurePrefs.prototype._keySubmit = function() {
    }

    OpenPGPUtils.forEach(OpenPGPSecurePrefs._loadCallbacks, function(cb) {
        cb.run();
    });
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
