/*
 * ***** BEGIN LICENSE BLOCK *****
 * OpenPGP Zimbra Secure is the open source digital signature and encrypt for Zimbra Collaboration Open Source Edition software
 * Copyright (C) 2016-present Nguyen Van Nguyen <nguyennv1981@gmail.com>

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

OpenPGPSecurePrefs = function(shell, section, controller, handler) {
    if (!arguments.length) return;
    this._handler = handler;
    this._keyStore = handler.getKeyStore();
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
OpenPGPSecurePrefs.KEY_SEND = 'OPENPGP_KEY_SEND';
OpenPGPSecurePrefs.KEY_EXPORT = 'OPENPGP_KEY_EXPORT';
OpenPGPSecurePrefs.KEY_ADD = 'OPENPGP_KEY_ADD';
OpenPGPSecurePrefs.KEY_LOOKUP = 'OPENPGP_KEY_LOOKUP';
OpenPGPSecurePrefs.PASSPHRASE_TOGGLE = 'OPENPGP_PASSPHRASE_TOGGLE';

OpenPGPSecurePrefs.SECURITY_SETTINGS = [
    OpenPGPSecurePrefs.SECURITY
];

OpenPGPSecurePrefs._loadCallbacks = [];

OpenPGPSecurePrefs.registerSettings = function(handler) {
    var keyStore = handler.getKeyStore();
    var privateKey = keyStore.getPrivateKey();
    var publicKey = keyStore.getPublicKey();

    var zmSettings = appCtxt.getSettings();
    zmSettings.registerSetting(OpenPGPSecurePrefs.SECURITY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: OpenPGPZimbraSecure.OPENPGP_AUTO
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.PRIVATE_KEY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: privateKey ? privateKey.armor().trim().replace(/\r?\n/g, '\n') : ''
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.PASSPHRASE, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: keyStore.getPassphrase()
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.PUBLIC_KEY, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: publicKey ? publicKey.armor().trim().replace(/\r?\n/g, '\n') : ''
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEYPAIR_GEN, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_SUBMIT, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_SEND, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_EXPORT, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.PASSPHRASE_TOGGLE, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_ADD, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_LOOKUP, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });
    zmSettings.registerSetting(OpenPGPSecurePrefs.PUBLIC_KEYS, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_NONE
    });

    OpenPGPSecurePrefs.SECURITY_SETTINGS.forEach(function(name) {
        var setting = zmSettings.getSetting(name);
        setting.setValue(handler.getUserProperty(setting.id));
    });
};

OpenPGPSecurePrefs.registerPrefs = function(handler) {
    ZmPref.registerPref(OpenPGPSecurePrefs.SECURITY, {
        displayContainer: ZmPref.TYPE_RADIO_GROUP,
        orientation:      ZmPref.ORIENT_VERTICAL,
        displayOptions:   [
            handler.getMessage('prefSecurityAuto'),
            handler.getMessage('prefSecurityNone'),
            handler.getMessage('prefSecuritySign'),
            handler.getMessage('prefSecurityBoth')
        ],
        options: [
            OpenPGPZimbraSecure.OPENPGP_AUTO,
            OpenPGPZimbraSecure.OPENPGP_DONTSIGN,
            OpenPGPZimbraSecure.OPENPGP_SIGN,
            OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT
        ]
    });

    ZmPref.registerPref(OpenPGPSecurePrefs.PRIVATE_KEY, {
        displayName:      handler.getMessage('prefPrivateKey'),
        displayContainer: ZmPref.TYPE_TEXTAREA
    });

    ZmPref.registerPref(OpenPGPSecurePrefs.PASSPHRASE, {
        displayContainer: ZmPref.TYPE_STATIC
    });

    ZmPref.registerPref(OpenPGPSecurePrefs.PUBLIC_KEY, {
        displayName:      handler.getMessage('prefPublicKey'),
        displayContainer: ZmPref.TYPE_TEXTAREA
    });

    ZmPref.registerPref(OpenPGPSecurePrefs.KEYPAIR_GEN, {
        displayContainer: ZmPref.TYPE_STATIC
    });
    ZmPref.registerPref(OpenPGPSecurePrefs.KEY_SUBMIT, {
        displayContainer: ZmPref.TYPE_STATIC
    });
    ZmPref.registerPref(OpenPGPSecurePrefs.KEY_SEND, {
        displayContainer: ZmPref.TYPE_STATIC
    });
    ZmPref.registerPref(OpenPGPSecurePrefs.KEY_EXPORT, {
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
        title: handler.getMessage('prefSection'),
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
            ZmSetting[OpenPGPSecurePrefs.KEY_SEND],
            ZmSetting[OpenPGPSecurePrefs.KEY_EXPORT],
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

AjxDispatcher.addPackageLoadFunction('Preferences', new AjxCallback(function() {
    OpenPGPSecurePrefs.prototype = new ZmPreferencesPage;
    OpenPGPSecurePrefs.prototype.constructor = OpenPGPSecurePrefs;

    OpenPGPSecurePrefs.prototype.toString = function() {
        return 'OpenPGPSecurePrefs';
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
        var zmSettings = appCtxt.getSettings();

        OpenPGPSecurePrefs.SECURITY_SETTINGS.forEach(function(name) {
            var setting = zmSettings.getSetting(name);
            var value = setting.getValue();
            self._handler.setUserProperty(setting.id, value);
            setting.origValue = value;
        });

        var privateKeySetting = zmSettings.getSetting(OpenPGPSecurePrefs.PRIVATE_KEY);
        var privateKey = privateKeySetting.origValue = privateKeySetting.getValue();

        var passphraseSetting = zmSettings.getSetting(OpenPGPSecurePrefs.PASSPHRASE);
        var passphrase = passphraseSetting.origValue = passphraseSetting.getValue();

        var publicKeySetting = zmSettings.getSetting(OpenPGPSecurePrefs.PUBLIC_KEY);
        var publicKey = publicKeySetting.origValue = publicKeySetting.getValue();

        this._keyStore.setPrivateKey(privateKey, passphrase);
        this._keyStore.setPublicKey(publicKey);

        this._controller.setDirty(this._section.id, false);

        if (batchCommand) {
            var soapDoc = AjxSoapDoc.create('NoOpRequest', 'urn:zimbraMail');
            batchCommand.addRequestParams(soapDoc);
        }
        this._handler.saveUserProperties();
    };

    OpenPGPSecurePrefs.prototype._setupStatic = function(id, setup, value) {
        if (id == OpenPGPSecurePrefs.KEYPAIR_GEN) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnKeyGen'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyGen, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.KEY_SUBMIT) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnKeySubmit'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keySubmit, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.KEY_SEND) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnKeySend'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keySend, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.KEY_EXPORT) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnKeyExport'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyExport, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.PASSPHRASE_TOGGLE) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnShowHide'));
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
            button.setText(this._handler.getMessage('btnKeyAdd'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyAdd, this));
            return button;
        } else if(id == OpenPGPSecurePrefs.KEY_LOOKUP) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnKeyLookup'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyLookup, this));
            return button;
        } else {
            return ZmPreferencesPage.prototype._setupStatic.apply(this, arguments);
        }
    };

    OpenPGPSecurePrefs.prototype._setupCustom = function(id, setup, value) {
        var self = this;
        if (id == OpenPGPSecurePrefs.PUBLIC_KEYS) {
            var publicKeyList = this._publicKeyList = new PublicKeyListView({
                parent: this,
                id: id,
                onDeleteItem: function(item) {
                    if (item) {
                        self._keyStore.removePublicKey(item.id);
                    }
                },
                publicKeys: this._keyStore.getPublicKeys()
            });
            this._keyStore.addCallback(new AjxCallback(function(key) {
                publicKeyList.addPublicKey(key);
            }));
            return publicKeyList;
        } else {
            return ZmPreferencesPage.prototype._setupCustom.call(this, id, setup, value);
        }
    };

    OpenPGPSecurePrefs.prototype._keyGen = function() {
        var self = this;
        if (!this._handler._genkeyDialog) {
            this._handler._genkeyDialog = new GenerateKeypairDialog(
                this._handler,
                function(dialog) {
                    return dialog.generateKey().then(function(key) {
                        self.setFormValue(OpenPGPSecurePrefs.PRIVATE_KEY, key.privateKey.replace(/\r?\n/g, '\n'));
                        self.setFormValue(OpenPGPSecurePrefs.PASSPHRASE, key.passphrase);
                        self.setFormValue(OpenPGPSecurePrefs.PUBLIC_KEY, key.publicKey.replace(/\r?\n/g, '\n'));

                        return key;
                    });
                }
            );
        }
        this._handler._genkeyDialog.popup();
    }

    OpenPGPSecurePrefs.prototype._keySubmit = function() {
        var self = this;
        var publicKey = this.getFormValue(OpenPGPSecurePrefs.PUBLIC_KEY);
        if (publicKey.length > 0) {
            var keyServer = this._handler.getZimletContext().getConfig('openpgp-key-server');
            var hkp = new openpgp.HKP(keyServer);
            hkp.upload(publicKey).then(function() {
                self._handler.displayStatusMessage(self._handler.getMessage('publicKeySubmitted'));
            });
        }
    }

    OpenPGPSecurePrefs.prototype._keySend = function() {
        var self = this;
        if (this._handler._keySendDialog) {
            var dialog = this._handler._keySendDialog;
            dialog.setEmail('');
        }
        else {
            var dialog = this._handler._keySendDialog = new SendPublicKeyDialog(
                this._handler,
                function(dialog) {
                    dialog.sendPubicKey(new AjxCallback(function() {
                        self._handler.displayStatusMessage(self._handler.getMessage('sendPublicKeySubmitted'));
                    }));
                }
            );
        }
        dialog.popup();
    }

    OpenPGPSecurePrefs.prototype._keyExport = function() {
        var privateKey = this.getFormValue(OpenPGPSecurePrefs.PRIVATE_KEY);
        var publicKey = this.getFormValue(OpenPGPSecurePrefs.PUBLIC_KEY);
        OpenPGPUtils.saveTextAs(privateKey + '\n\n' + publicKey, 'keypair.asc');
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
        var self = this;
        if (this._handler._keyAddDialog) {
            var dialog = this._handler._keyAddDialog;
            dialog.setPublicKey('');
        }
        else {
            var dialog = this._handler._keyAddDialog = new KeyAddDialog(
                this._handler,
                function() {
                    var pubKey = openpgp.key.readArmored(dialog.getPublicKey());
                    pubKey.keys.forEach(function(key) {
                        self._keyStore.addPublicKey(key);
                    });
                }
            );
        }
        dialog.popup();
    }

    OpenPGPSecurePrefs.prototype._keyLookup = function() {
        var self = this;
        if (this._handler._keyLookupDialog) {
            var dialog = this._handler._keyLookupDialog;
            dialog.getView().reset();
        }
        else {
            var dialog = this._handler._keyLookupDialog = new KeyLookupDialog(
                this._handler,
                function() {
                    var pubKey = openpgp.key.readArmored(dialog.getPublicKey());
                    pubKey.keys.forEach(function(key) {
                        self._keyStore.addPublicKey(key);
                    });
                }
            );
        }
        dialog.popup();
    }

    OpenPGPSecurePrefs._loadCallbacks.forEach(function(cb) {
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
