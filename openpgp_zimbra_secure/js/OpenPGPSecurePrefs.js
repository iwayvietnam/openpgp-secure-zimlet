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

OpenPGPSecurePrefs = function(shell, section, controller, handler) {
    if (!arguments.length) return;
    this._handler = handler;
    this._keyStore = handler.getKeyStore();
    ZmPreferencesPage.call(this, shell, section, controller);
    this._id = this.getHTMLElId();
};

OpenPGPSecurePrefs.SECURITY = 'OPENPGP_SECURITY';
OpenPGPSecurePrefs.KEY_SERVER = 'OPENPGP_KEY_SERVER';

OpenPGPSecurePrefs.PRIVATE_KEY = 'OPENPGP_PRIVATE_KEY';
OpenPGPSecurePrefs.PASSPHRASE = 'OPENPGP_PASSPHRASE';
OpenPGPSecurePrefs.PUBLIC_KEYS = 'OPENPGP_PUBLIC_KEYS';

OpenPGPSecurePrefs.KEYPAIR_GEN = 'OPENPGP_KEYPAIR_GEN';
OpenPGPSecurePrefs.KEY_SUBMIT = 'OPENPGP_KEY_SUBMIT';
OpenPGPSecurePrefs.KEY_SEND = 'OPENPGP_KEY_SEND';
OpenPGPSecurePrefs.KEY_EXPORT = 'OPENPGP_KEY_EXPORT';
OpenPGPSecurePrefs.KEY_EXPORT_ALL = 'OPENPGP_KEY_EXPORT_ALL';
OpenPGPSecurePrefs.KEY_ADD = 'OPENPGP_KEY_ADD';
OpenPGPSecurePrefs.KEY_LOOKUP = 'OPENPGP_KEY_LOOKUP';
OpenPGPSecurePrefs.PASSPHRASE_TOGGLE = 'OPENPGP_PASSPHRASE_TOGGLE';

OpenPGPSecurePrefs.SECURITY_SETTINGS = [
    OpenPGPSecurePrefs.SECURITY,
    OpenPGPSecurePrefs.KEY_SERVER
];

OpenPGPSecurePrefs._loadCallbacks = [];

/**
 * Register settings.
 *
 * @param {Object} handler Zimlet handler object
 */
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

    var keyServer = handler.getZimletContext().getConfig('openpgp-key-server');
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_SERVER, {
        type: ZmSetting.T_PREF,
        dataType: ZmSetting.D_STRING,
        defaultValue: keyServer
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
    zmSettings.registerSetting(OpenPGPSecurePrefs.KEY_EXPORT_ALL, {
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

/**
 * Register preferences.
 *
 * @param {Object} handler Zimlet handler object
 */
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

    var keyServers = JSON.parse(handler.getZimletContext().getConfig('openpgp-key-servers'));
    ZmPref.registerPref(OpenPGPSecurePrefs.KEY_SERVER, {
        displayName:      handler.getMessage('prefKeyServer'),
        displayContainer: ZmPref.TYPE_SELECT,
        displayOptions:   keyServers,
        options:          keyServers
    });

    ZmPref.registerPref(OpenPGPSecurePrefs.PRIVATE_KEY, {
        displayName:      handler.getMessage('prefPrivateKey'),
        displayContainer: ZmPref.TYPE_TEXTAREA
    });

    ZmPref.registerPref(OpenPGPSecurePrefs.PASSPHRASE, {
        displayContainer: ZmPref.TYPE_STATIC
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
    ZmPref.registerPref(OpenPGPSecurePrefs.KEY_EXPORT_ALL, {
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
        templateId: OpenPGPZimbraSecure.NAME + '#Preferences',
        priority: 49,
        manageDirty: true,
        prefs: [
            ZmSetting[OpenPGPSecurePrefs.SECURITY],
            ZmSetting[OpenPGPSecurePrefs.KEY_SERVER],
            ZmSetting[OpenPGPSecurePrefs.PRIVATE_KEY],
            ZmSetting[OpenPGPSecurePrefs.PASSPHRASE],
            ZmSetting[OpenPGPSecurePrefs.KEYPAIR_GEN],
            ZmSetting[OpenPGPSecurePrefs.KEY_SUBMIT],
            ZmSetting[OpenPGPSecurePrefs.KEY_SEND],
            ZmSetting[OpenPGPSecurePrefs.KEY_EXPORT],
            ZmSetting[OpenPGPSecurePrefs.KEY_EXPORT_ALL],
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

    /**
     * Add saving command.
     */
    OpenPGPSecurePrefs.prototype.addCommand = function(batchCommand) {
        batchCommand.add(new AjxCallback(this, this._savePrefs));
        batchCommand.size = function() {
            return this.curId || this._cmds.length;
        };
    };

    /**
     * Saving preference values.
     *
     * @private
     */
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

        this._keyStore.setPrivateKey(privateKey, passphrase);

        this._controller.setDirty(this._section.id, false);

        if (batchCommand) {
            var soapDoc = AjxSoapDoc.create('NoOpRequest', 'urn:zimbraMail');
            batchCommand.addRequestParams(soapDoc);
        }
        this._handler.saveUserProperties();
    };

    /**
     * Setup static settings.
     *
     * @private
     */
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
        } else if(id == OpenPGPSecurePrefs.KEY_EXPORT_ALL) {
            var button = new DwtButton({parent: this, id: id});
            button.setText(this._handler.getMessage('btnKeyExportAll'));
            button.setHandler(DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._keyExportAll, this));
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

    /**
     * Setup custom settings.
     *
     * @private
     */
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

    /**
     * Genarate key pair
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._keyGen = function() {
        var self = this;
        if (!this._handler._genkeyDialog) {
            this._handler._genkeyDialog = new GenerateKeypairDialog(
                this._handler,
                function(dialog) {
                    return dialog.generateKey().then(function(key) {
                        self.setFormValue(OpenPGPSecurePrefs.PRIVATE_KEY, key.privateKey.replace(/\r?\n/g, '\n'));
                        self.setFormValue(OpenPGPSecurePrefs.PASSPHRASE, key.passphrase);

                        return key;
                    });
                }
            );
        }
        this._handler._genkeyDialog.popup();
    };

    /**
     * Submit public key to key server
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._keySubmit = function() {
        var self = this;
        var publicKey = this._keyStore.getPublicKey();
        if (publicKey) {
            var keyServer = this.getFormValue(OpenPGPSecurePrefs.KEY_SERVER);
            var hkp = new openpgp.HKP(keyServer);
            hkp.upload(publicKey.armor()).then(function() {
                self._handler.displayStatusMessage(self._handler.getMessage('publicKeySubmitted'));
            });
        }
    };

    /**
     * Send public key to someone
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._keySend = function() {
        var self = this;
        var controller = AjxDispatcher.run('GetComposeController');
        var publicKey = this._keyStore.getPublicKey();
        if (controller && publicKey) {
            var textContents = [];
            var keyInfo = OpenPGPSecureKeyStore.keyInfo(publicKey);
            keyInfo.uids.forEach(function(uid, index) {
                textContents.push(self._handler.getMessage('keyInfoUid') + '[' + index + ']: ' + uid);
            });
            textContents.push(this._handler.getMessage('keyInfoFingerprint') + ': ' + keyInfo.fingerprint);
            textContents.push(this._handler.getMessage('keyInfoKeyId') + ': ' + keyInfo.keyid);
            textContents.push(this._handler.getMessage('keyInfoCreated') + ': ' + keyInfo.created);
            textContents.push(this._handler.getMessage('keyInfoKeylength') + ': ' + keyInfo.keyLength);

            var addr = OpenPGPUtils.getDefaultSenderAddress();
            var params = {
                action: ZmOperation.NEW_MESSAGE,
                composeMode: Dwt.HTML,
                subjOverride: AjxMessageFormat.format(this._handler.getMessage('sendPublicKeySubject'), addr.toString()),
                extraBodyText: textContents.join('<br>'),
                callback: new AjxCallback(function(controller) {
                    var url = appCtxt.get(ZmSetting.CSFE_ATTACHMENT_UPLOAD_URI) + '?fmt=raw';
                    var callback = new AjxCallback(function(response) {
                        if (response.success) {
                            var values = JSON.parse('[' + response.text.replace(/'/g, '"')  + ']');
                            if (values && values.length == 3 && values[0] == 200) {
                                controller.saveDraft(ZmComposeController.DRAFT_TYPE_AUTO, values[2]);
                            }
                        }
                    });
                    AjxRpc.invoke(publicKey.armor(), url, {
                        'Content-Type': OpenPGPUtils.OPENPGP_KEYS_CONTENT_TYPE + '; name="key.asc"',
                        'Content-Disposition': 'inline; filename="key.asc"',
                        'Content-Transfer-Encoding': '7bit'
                    }, callback);
                })
            };
            controller.doAction(params);
        }
    };

    /**
     * Export private key for downloading
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._keyExport = function() {
        var privateKey = this.getFormValue(OpenPGPSecurePrefs.PRIVATE_KEY);
        OpenPGPUtils.saveTextAs(privateKey, 'key.asc');
    };

    /**
     * Export all public keys for downloading
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._keyExportAll = function() {
        var publicKeys = this._keyStore.exportPublicKeys();
        OpenPGPUtils.saveTextAs(publicKeys, 'keys.asc');
    };

    /**
     * Toogle show/hide state of passphrase input
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._togglePassphrase = function() {
        var input = document.getElementById(this._id + '_' + OpenPGPSecurePrefs.PASSPHRASE);
        if (input.getAttribute('type') == 'password') {
            input.setAttribute('type', 'text');
        } else {
            input.setAttribute('type', 'password');
        }
    };

    /**
     * Add public keys to key store
     *
     * @private
     */
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
    };

    /**
     * Lookup public keys on key server
     *
     * @private
     */
    OpenPGPSecurePrefs.prototype._keyLookup = function() {
        var self = this;
        var keyServer = this.getFormValue(OpenPGPSecurePrefs.KEY_SERVER);
        var dialog = new KeyLookupDialog(
            this._handler,
            keyServer,
            function() {
                var publicKeys = dialog.getPublicKeys();
                publicKeys.forEach(function(armoredKey) {
                    var pubKey = openpgp.key.readArmored(armoredKey);
                    pubKey.keys.forEach(function(key) {
                        self._keyStore.addPublicKey(key);
                    });
                });
            }
        );
        dialog.popup();
    };

    OpenPGPSecurePrefs._loadCallbacks.forEach(function(cb) {
        cb.run();
    });
    delete OpenPGPSecurePrefs._loadCallbacks;
}));

/**
 * Initialize
 */
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
