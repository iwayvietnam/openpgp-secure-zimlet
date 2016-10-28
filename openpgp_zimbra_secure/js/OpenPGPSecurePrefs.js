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
    this._id = this.getHTMLElId();
};

OpenPGPSecurePrefs.SECURITY = 'OPENPGP_SECURITY';
OpenPGPSecurePrefs.PRIVATE_KEY = 'OPENPGP_PRIVATE_KEY';
OpenPGPSecurePrefs.PASSPHRASE = 'OPENPGP_PASSPHRASE';
OpenPGPSecurePrefs.PUBLIC_KEY = 'OPENPGP_PUBLIC_KEY';
OpenPGPSecurePrefs.PUBLIC_KEYS = 'OPENPGP_PUBLIC_KEYS';

OpenPGPSecurePrefs.KEYPAIR_GEN = 'OPENPGP_KEYPAIR_GEN';
OpenPGPSecurePrefs.KEY_SUBMIT = 'OPENPGP_KEY_SUBMIT';
OpenPGPSecurePrefs.KEY_ADD = 'OPENPGP_KEY_ADD';
OpenPGPSecurePrefs.KEY_LOOKUP = 'OPENPGP_KEY_LOOKUP';
OpenPGPSecurePrefs.PASSPHRASE_TOGGLE = 'OPENPGP_PASSPHRASE_TOGGLE';

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
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.KEYPAIR_GEN, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.KEY_SUBMIT, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.PASSPHRASE_TOGGLE, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.KEY_ADD, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.KEY_LOOKUP, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    appCtxt.getSettings().registerSetting(OpenPGPSecurePrefs.PUBLIC_KEYS, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });

    var zmSettings = appCtxt.getSettings();
    OpenPGPUtils.forEach(OpenPGPSecurePrefs.SETTINGS, function(name) {
        var setting = zmSettings.getSetting(name);
        setting.setValue(handler.getUserProperty(setting.id));
    });

    var publicKeySetting = zmSettings.getSetting(OpenPGPSecurePrefs.PUBLIC_KEY);
    publicKeySetting.setValue(handler.publicKey);

    var privateKeySetting = zmSettings.getSetting(OpenPGPSecurePrefs.PRIVATE_KEY);
    privateKeySetting.setValue(handler.privateKey);

    var passphraseSetting = zmSettings.getSetting(OpenPGPSecurePrefs.PASSPHRASE);
    passphraseSetting.setValue(handler.privatePass);
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
            displayContainer: ZmPref.TYPE_STATIC
        });

        ZmPref.registerPref(OpenPGPSecurePrefs.PUBLIC_KEY, {
            displayName:      OpenPGPUtils.prop('prefPublicKey'),
            displayContainer: ZmPref.TYPE_TEXTAREA
        });
    
        ZmPref.registerPref(OpenPGPSecurePrefs.KEYPAIR_GEN, {
            displayContainer: ZmPref.TYPE_STATIC
        });
        ZmPref.registerPref(OpenPGPSecurePrefs.KEY_SUBMIT, {
            displayContainer: ZmPref.TYPE_STATIC
        });
        ZmPref.registerPref(OpenPGPSecurePrefs.PASSPHRASE_TOGGLE, {
            displayContainer: ZmPref.TYPE_STATIC
        });
        ZmPref.registerPref(OpenPGPSecurePrefs.KEY_ADD, {
            displayContainer: ZmPref.TYPE_STATIC
        });
        ZmPref.registerPref(OpenPGPSecurePrefs.KEY_LOOKUP, {
            displayContainer: ZmPref.TYPE_STATIC
        });
        ZmPref.registerPref(OpenPGPSecurePrefs.PUBLIC_KEYS, {
            displayContainer: ZmPref.TYPE_CUSTOM
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
                ZmSetting[OpenPGPSecurePrefs.KEYPAIR_GEN],
                ZmSetting[OpenPGPSecurePrefs.KEY_SUBMIT],
                ZmSetting[OpenPGPSecurePrefs.PASSPHRASE_TOGGLE],
                ZmSetting[OpenPGPSecurePrefs.KEY_ADD],
                ZmSetting[OpenPGPSecurePrefs.KEY_LOOKUP],
                ZmSetting[OpenPGPSecurePrefs.PUBLIC_KEYS]
            ],
            createView: function(parent, sectionObj, controller) {
                return new OpenPGPSecurePrefs(parent, sectionObj, controller, handler);
            }
        };
        ZmPref.registerPrefSection('SECURITY_PREFERENCES', section);
    };

    // Saving
    OpenPGPSecurePrefs.prototype.addCommand = function(batchCommand) {
        batchCommand.add(new AjxCallback(this, this._savePrefs));
        batchCommand.size = function() {
            return this.curId || this._cmds.length;
        };
    };

    OpenPGPSecurePrefs.prototype._savePrefs = function(batchCommand) {
        var self = this;
        var settings = OpenPGPSecurePrefs.SETTINGS;
        var zmSettings = appCtxt.getSettings();

        OpenPGPUtils.forEach(settings, function(name) {
            var setting = zmSettings.getSetting(name);
            var value = setting.getValue();
            self._handler.setUserProperty(setting.id, value);
            setting.origValue = value;
        });

        this._controller.setDirty(this._section.id, false);

        if (batchCommand) {
            var soapDoc = AjxSoapDoc.create('NoOpRequest', 'urn:zimbraMail');
            batchCommand.addRequestParams(soapDoc);
        }
        this._handler.saveUserProperties();

        var privKeyInput = document.getElementById(self._id + '_' + OpenPGPSecurePrefs.PRIVATE_KEY);
        var privateKey = privKeyInput.value;

        var pubKeyInput = document.getElementById(self._id + '_' + OpenPGPSecurePrefs.PUBLIC_KEY);
        var publicKey = pubKeyInput.value;

        var passphraseInput = document.getElementById(self._id + '_' + OpenPGPSecurePrefs.PASSPHRASE);
        var passphrase = passphraseInput.value;

        var securePwd = OpenPGPZimbraSecure.settings['secure_password'];
        OpenPGPUtils.localStorageSave(
            'openpgp_private_key_' + this._handler.getUsername(),
            securePwd,
            privateKey
        );
        OpenPGPUtils.localStorageSave(
            'openpgp_passphrase_' + this._handler.getUsername(),
            securePwd,
            passphrase
        );
        localStorage['openpgp_public_key_' + this._handler.getUsername()] = publicKey;
    };

    OpenPGPSecurePrefs.prototype._setupStatic = function(id, setup, value) {
        if (id == OpenPGPSecurePrefs.KEYPAIR_GEN) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnKeyGen'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyGen, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.KEY_SUBMIT) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnKeySubmit'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keySubmit, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.PASSPHRASE_TOGGLE) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnShowHide'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._togglePassphrase, this));
            return button;
        } else if (id == OpenPGPSecurePrefs.PASSPHRASE) {
            var input = new DwtInputField({parent: this, id: id, size: 40, type: DwtInputField.PASSWORD});
            var zmSettings = appCtxt.getSettings();
            var passphrase = zmSettings.getSetting(OpenPGPSecurePrefs.PASSPHRASE).getValue();
            input.setValue(passphrase);
            return input;
        } else if(id == OpenPGPSecurePrefs.KEY_ADD) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnKeyAdd'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyAdd, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.KEY_LOOKUP) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(OpenPGPUtils.prop('btnKeyLookup'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyLookup, this));
            return button;
        } else {
            return ZmPreferencesPage.prototype._setupStatic.apply(this, arguments);
        }
    };

    OpenPGPSecurePrefs.prototype._setupCustom = function(id, setup, value) {
        if (id == OpenPGPSecurePrefs.PUBLIC_KEYS) {
            var publicKeyList = this._publicKeyList = new PublicKeyListView({
                parent: this,
                id: id,
                publicKeys: this._handler.publicKeys
            });
            console.log(publicKeyList);
            return publicKeyList;
        } else {
            return ZmPreferencesPage.prototype._setupCustom.call(this, id, setup, value);
        }
    };

    OpenPGPSecurePrefs.prototype._keyGen = function() {
        var self = this;
        if (this._handler._genkeyDialog) {
            this._handler._genkeyDialog.popup();
        }
        else {
            var dialog = this._handler._genkeyDialog = new GenerateKeypairDialog(
                this._handler,
                OpenPGPUtils.prop('keyPairGenTitle'),
                function() {
                    var view = dialog.getView();
                    var name = view.txtName.getValue();
                    var email = view.txtEmail.getValue();
                    var passphrase = view.txtPassphrase.getValue();
                    var numBits = view.selNumBits.getValue();

                    var userIds = [];
                    var addresses = email.split(', ');
                    OpenPGPUtils.forEach(addresses, function(address) {
                        userIds.push({name: name, email: address});
                    });

                    var opts = {
                        userIds: userIds,
                        numBits: numBits,
                        passphrase: passphrase
                    };
                    return openpgp.generateKey(opts).then(function(key) {
                        var privKeyInput = document.getElementById(self._id + '_' + OpenPGPSecurePrefs.PRIVATE_KEY);
                        privKeyInput.value = key.privateKeyArmored;

                        var pubKeyInput = document.getElementById(self._id + '_' + OpenPGPSecurePrefs.PUBLIC_KEY);
                        pubKeyInput.value = key.publicKeyArmored;

                        var passphraseInput = document.getElementById(self._id + '_' + OpenPGPSecurePrefs.PASSPHRASE);
                        passphraseInput.value = passphrase;

                        var keyPair = {
                            privateKey: key.privateKeyArmored,
                            publicKey: key.publicKeyArmored,
                            passphrase: passphrase
                        };
                        return keyPair;
                    });
                },
                false,
                [DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]
            );
            dialog.popup();
        }
    }

    OpenPGPSecurePrefs.prototype._keySubmit = function() {
        var self = this;
        var pubKeyInput = document.getElementById(this._id + '_' + OpenPGPSecurePrefs.PUBLIC_KEY);
        var publicKey = pubKeyInput.value;
        if (publicKey.length > 0) {
            var keyServer = this._handler.getZimletContext().getConfig('openpgp-key-server');
            var hkp = new openpgp.HKP(keyServer);
            hkp.upload(publicKey).then(function() {
                self._handler.displayStatusMessage(OpenPGPUtils.prop('publicKeyAdded'));
            });
        }
    }

    OpenPGPSecurePrefs.prototype._togglePassphrase = function() {
        var input = document.getElementById(this._id + '_' + OpenPGPSecurePrefs.PASSPHRASE);
        if (input.getAttribute('type') == 'password') {
            input.setAttribute('type', 'text');
        } else {
            input.setAttribute('type', 'password');
        }
    };

    OpenPGPSecurePrefs.prototype._keyAdd = function() {
    }

    OpenPGPSecurePrefs.prototype._keyLookup = function() {
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
