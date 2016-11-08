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

var OPENPGP_SECURITY_TYPES = [
    {label: openpgp_zimbra_secure.dontSignMessage, className: 'DontSign'},
    {label: openpgp_zimbra_secure.signMessage, className: 'Sign'},
    {label: openpgp_zimbra_secure.signAndEncryptMessage, className: 'SignEncrypt'}
];

function openpgp_zimbra_secure_HandlerObject() {
    this._msgDivCache = {};
    this._pgpMimeCache = appCtxt.isChildWindow ? window.opener.openpgp_zimbra_secure_HandlerObject.getInstance()._pgpMimeCache : {};
    this._patchedFuncs = {};
    this._pendingAttachments = [];
    this._pgpKeys = new OpenPGPSecureKeys(this);
};

openpgp_zimbra_secure_HandlerObject.prototype = new ZmZimletBase();
openpgp_zimbra_secure_HandlerObject.prototype.constructor = openpgp_zimbra_secure_HandlerObject;

openpgp_zimbra_secure_HandlerObject.prototype.toString = function() {
    return 'openpgp_zimbra_secure_HandlerObject';
};

var OpenPGPZimbraSecure = openpgp_zimbra_secure_HandlerObject;

OpenPGPZimbraSecure.BUTTON_CLASS = 'openpgp_zimbra_secure_button';
OpenPGPZimbraSecure.PREF_SECURITY = 'OPENPGP_SECURITY';
OpenPGPZimbraSecure.USER_SECURITY = 'OPENPGP_USER_SECURITY';

OpenPGPZimbraSecure.OPENPGP_DONTSIGN = 0;
OpenPGPZimbraSecure.OPENPGP_SIGN = 1;
OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT = 2;

OpenPGPZimbraSecure.settings = [];

OpenPGPZimbraSecure.prototype.init = function() {
    var self = this;

    this._addJsScripts([
        'js/mimemessage/mimemessage.js',
        'js/openpgpjs/openpgp.min.js'
    ]);

    AjxDispatcher.addPackageLoadFunction('MailCore', new AjxCallback(this, function(){
        var sendMsgFunc = ZmMailMsg.prototype._sendMessage;
        ZmMailMsg.prototype._sendMessage = function(params) {
            self._sendMessage(sendMsgFunc, this, params);
        }

        var fetchMsgFunc = ZmMailMsg._handleResponseFetchMsg;
        ZmMailMsg._handleResponseFetchMsg = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                fetchMsgFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };

        var responseLoadMsgsFunc = ZmConv.prototype._handleResponseLoadMsgs;
        ZmConv.prototype._handleResponseLoadMsgs = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                responseLoadMsgsFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };
    }));

    AjxDispatcher.addPackageLoadFunction('Startup1_2', new AjxCallback(this, function() {
        var self = this;

        var responseGetConvFunc = ZmSearch.prototype._handleResponseGetConv;
        ZmSearch.prototype._handleResponseGetConv = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                responseGetConvFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };

        var responseExecuteFunc = ZmSearch.prototype._handleResponseExecute;
        ZmSearch.prototype._handleResponseExecute = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                responseExecuteFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };
    }));

    var pwdKey = 'secure_password_' + this.getUsername();
    if (localStorage[pwdKey]) {
        OpenPGPZimbraSecure.settings['secure_password'] = localStorage[pwdKey];
    }
    else {
        localStorage[pwdKey] = OpenPGPZimbraSecure.settings['secure_password'] = OpenPGPUtils.randomString({
            length: 24
        });
    }

    try {
        setTimeout(function() {
            self._initOpenPGP();
        }, 1000);
    } catch (err) {
        try {
            setTimeout(function() {
                self._initOpenPGP();
            }, 5000);
        } catch (err) {
            try {
                setTimeout(function() {
                    self._initOpenPGP();
                }, 10000);
            } catch (err) {}
        }
    }
};

OpenPGPZimbraSecure.getInstance = function() {
    return appCtxt.getZimletMgr().getZimletByName('openpgp_zimbra_secure').handlerObject;
};

OpenPGPZimbraSecure.prototype.getPGPKeys = function() {
    return this._pgpKeys;
};

/**
 * Additional processing of message from server before handling control back
 * to Zimbra.
 *
 * @param {AjxCallback} callback original callback
 * @param {ZmCsfeResult} csfeResult
 */
OpenPGPZimbraSecure.prototype._handleMessageResponse = function(callback, csfeResult) {
    console.log('handleMessageResponse');
    var self = this;
    var encoded = false;
    if (csfeResult) {
        var response = csfeResult.getResponse();
    }
    else {
        response = { _jsns: 'urn:zimbraMail', more: false };
    }
    console.log(response);

    function hasPGPPart(part) {
        var cType = part.ct;

        if (OpenPGPUtils.isOPENPGPContentType(cType)) {
            return true;
        } else if (!part.mp) {
            return false;
        }
        if (cType != ZmMimeTable.MSG_RFC822) {
            //do not look at subparts in attached message
            for (var i = 0; i < part.mp.length; i++) {
                if (hasPGPPart(part.mp[i]))
                    return true;
            }
        }

        return false;
    }

    var pgpMsgs = [];
    var msgs = [];

    for (var name in response) {
        var m = response[name].m;
        if (!m && response[name].c) {
            m = response[name].c[0].m;
        }
        if (m) {
            for (var i = 0; i < m.length; i++) {
                if (m[i]) {
                    msgs.push(m[i]);
                }
            }
        }
    }

    msgs.forEach(function(msg) {
        if (hasPGPPart(msg)) {
            pgpMsgs.push(msg);
        }
    });

    if (pgpMsgs.length == 0) {
        callback.run(csfeResult);
    } else {
        this._loadMessages(callback, csfeResult, pgpMsgs);
    }
};

/**
 * Load and decrypt the given pgp messages.
 * @param {AjxCallback} callback
 * @param {?} csfeResult
 * @param {Array} pgpMsgs messages to load.
 */
OpenPGPZimbraSecure.prototype._loadMessages = function(callback, csfeResult, pgpMsgs){
    var self = this;
    var handled = 0;
    var allLoadedCheck = new AjxCallback(function(){
        handled += 1;

        if (handled == pgpMsgs.length) {
            callback.run(csfeResult);
        }
    });

    pgpMsgs.forEach(function(msg) {
        var newCallback = new AjxCallback(self, self._decryptMessage, [allLoadedCheck, msg]);
        var partId = msg.part ? '&part=' + msg.part : '';
        //add a timestamp param so that browser will not cache the request
        var timestamp = '&timestamp=' + new Date().getTime();

        var loadUrl = [
            appCtxt.get(ZmSetting.CSFE_MSG_FETCHER_URI), '&id=', msg.id, partId, timestamp
        ].join('');

        AjxRpc.invoke('', loadUrl, {
            'X-Zimbra-Encoding': 'x-base64'
        }, newCallback, true);
    });
};

/**
 * PGP Mime decrypt the given text.
 * @param {AjxCallback} callback
 * @param {ZmMailMsg} msg
 * @param {Object} response
 */
OpenPGPZimbraSecure.prototype._decryptMessage = function(callback, msg, response){
    if (response.success) {
        var decryptor = new OpenPGPDecrypt({
            privateKey: this._pgpKeys.getPrivateKey(),
            publicKeys: this._pgpKeys.getPublicKeys(),
            onDecrypted: function(decryptor, message) {
                console.log(message);
                callback.run();
                // this.onDecrypted(callback, msg, message);
            },
            onError: function(decryptor, error) {
                console.log(error);
            }
        }, OpenPGPUtils.base64Decode(response.text));
        decryptor.decrypt();
    } else {
        console.warn('Failed to get message source:');
        console.warn(response);
        callback.run();
    }
};

/**
 * Process the decrypted message before parsing control back to Zimbra.
 * @param {AjxCallback} callback
 * @param {ZmMailMsg} msg
 * @param {Object} response from Java.
 */
OpenPGPZimbraSecure.prototype.onDecrypted = function(callback, msg, mimeMessage) {
    var pgpInfo = mimeMessage;
    this._pgpMimeCache[msg.id] = pgpInfo;

    if (pgpInfo) {
        var contents = pgpInfo[pgpInfo.length - 1].contents;
        var bodyfound = false;

        msg.mp = contents.m.mp;
        // set share invites if present
        if(contents.m.shr){
            msg.shr = contents.m.shr;
        }

        function fixContentLocation(part) {
            if (part.cachekey) {
                part.cl = OpenPGPZimbraSecure.getCallbackURL(part.cachekey, part.filename || '');
                part.relativeCl = true;
            }
        }

        OpenPGPZimbraSecure._visitParts(msg, fixContentLocation);

        // find a body
        function findbody(ctype, part) {
            if (part.mp) {
                findbody(ctype, part.mp);
            } else if (part.ct) {
                if (part.ct == ctype) {
                    part.body = bodyfound = true;
                } else if (part.cd == 'inline') {
                    part.body = true;
                }
            } else {
                for (var i = 0; !bodyfound && i < part.length; i++) {
                    findbody(ctype, part[i]);
                }
            }
        }

        findbody(ZmMimeTable.TEXT_HTML, msg);
        if (!bodyfound)
            findbody(ZmMimeTable.TEXT_PLAIN, msg);

        // find attachments with a Content-ID
        var datamap = {};

        OpenPGPZimbraSecure._visitParts(msg, function(part) {
            if (part.ci && part.content) {
                datamap['cid:' + part.ci.replace(/[<>]/g, '')] = part.content;
            }
        });

        // sanitize using the sanitizer Google Caja
        OpenPGPZimbraSecure._visitParts(msg, function(part) {
            if (part.ct == ZmMimeTable.TEXT_HTML) {
                part.content = SMIMESanitizer.sanitize(part.content, datamap);
            }
        });
    }
    callback.run(); // increment handled
};

/**
* Sends the given message
* @param {Function} orig original func ZmMailMsg.prototype._sendMessage
* @param {ZmMailMsg} msg
* @param {Object} params the mail params inluding the jsonObj msg.
*/
OpenPGPZimbraSecure.prototype._sendMessage = function(orig, msg, params) {
    console.log(params);
    var self = this;
    var shouldSign = false, shouldEncrypt = false;
    var isDraft = false;

    if (params.jsonObj.SendMsgRequest || params.jsonObj.SaveDraftRequest) {
        // Get preference setting, and use it if the toolbar does not override it.
        shouldSign = this._shouldSign();
        shouldEncrypt = this._shouldEncrypt();

        var view = appCtxt.getCurrentView();
    }

    if (params.jsonObj.SaveDraftRequest) {
        isDraft = true;
        shouldSign = false;
        shouldEncrypt = false;
    }

    if (!shouldEncrypt && !shouldSign) {
        // call the wrapped function
        orig.apply(msg, [params]);
        return;
    }

    var input = (params.jsonObj.SendMsgRequest || params.jsonObj.SaveDraftRequest);
    var hasFrom = false;

    for (var i = 0; !hasFrom && i < input.m.e.length; i++) {
        if (input.m.e[i].t == 'f') {
            hasFrom = true;
        }
    }

    if (!hasFrom) {
        var addr = OpenPGPUtils.getDefaultSenderAddress();
        input.m.e.push({ 'a': addr.toString(), 't': 'f' });
    }

    function checkAttachments(list, cid, fmt) {
        for (var i = 0; list && i < list.length; i++) {
            var url = appCtxt.get(ZmSetting.CSFE_MSG_FETCHER_URI);
            if (fmt) {
                url += '&fmt=native';
            }
            var part = OpenPGPUtils.fetchPart(list[i], url);
            if (part) {
                if (cid) {
                    part.ci = '<' + cid + '>';
                    if (/^image\//.test(part.ct)) {
                        //for images replace the src url of cid with the data uri
                        var oldSrc = 'cid:' + cid;
                        //get the content type upto ; character
                        var ctIndex = part.ct.indexOf(';');
                        if (ctIndex == -1) ctIndex = part.ct.length;
                        var newSrc = 'data:' + part.ct.substring(0, ctIndex) + ';base64,' + part.data;
                        view._htmlEditor.replaceImageSrc(oldSrc, newSrc);
                    }
                }
                self._pendingAttachments.push(part);
            }
        }
    };

    function checkInlineAttachments(multiPart) {
        for(var i = multiPart.length - 1; i >= 0 ; i--) {
            var subPart = multiPart[i];
            if (subPart.attach) {
                checkAttachments(subPart.attach.mp, subPart.ci);
                checkAttachments(subPart.attach.doc, subPart.ci);
                multiPart.splice(i, 1);
            } else if (subPart.mp) {
                checkInlineAttachments(subPart.mp);
            }
        }
    };

    if (input.m.attach) {
        checkAttachments(input.m.attach.mp);
        checkAttachments(input.m.attach.m);
        checkAttachments(input.m.attach.cn);
        checkAttachments(input.m.attach.doc, null, 'native');
        delete input.m.attach;
    }
    checkInlineAttachments(input.m.mp);

    var contentParts = [];
    input.m.mp.forEach(function(part) {
        if (part.mp) {
            part.mp.forEach(function(mp) {
                contentParts.push(mp);
            });
        }
        else {
            contentParts.push(part);
        }
    });

    var attachments = [];
    while (this._pendingAttachments.length > 0) {
        attachments.push(this._pendingAttachments.pop());
    }

    var receivers = [];
    input.m.e.forEach(function(e) {
        if (e.t == 't') {
            receivers.push(e.a);
        }
        if (e.t == 'c') {
            receivers.push(e.a);
        }
        if (e.t == 'b') {
            receivers.push(e.a);
        }
    });

    var encryptor = new OpenPGPEncrypt({
        privateKey: this._pgpKeys.getPrivateKey(),
        publicKeys: this._pgpKeys.filterPublicKeys(receivers),
        shouldEncrypt: shouldEncrypt,
        onEncrypted: function(signer, builder) {
            builder.importHeaders(input.m);
            self._onEncrypted(params, input, orig, msg, builder.toString());
        },
        onError: function(signer, error) {
            self._onEncryptError(error);
        }
    }, new OpenPGPMimeBuilder({
        contentParts: contentParts,
        attachments: attachments
    }));
    encryptor.encrypt();
};

OpenPGPZimbraSecure.prototype._onEncrypted = function(params, input, orig, msg, message) {
    var url = appCtxt.get(ZmSetting.CSFE_ATTACHMENT_UPLOAD_URI) + '?fmt=raw';

    var callback = new AjxCallback(this, function(response) {
        var values = null;
        if (response.success) {
            var values = JSON.parse('[' + response.text.replace(/'/g, '"')  + ']');
        }
        if (values && values.length == 3 && values[0] == 200) {
            var uploadId = values[2];
            var origCallback = params.callback;
            var origMsg = input.m;

            params.callback = new AjxCallback(this, function(response) {
                try {
                    origCallback.run(response);
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            });

            input.m = { aid: uploadId };

            for (var k in origMsg) {
                if (k != 'mp') {
                    input.m[k] = origMsg[k];
                }
            }

            orig.apply(msg, [params]);
        }
        else {
            this._onEncryptError('Signing failed');
        }
    });

    AjxRpc.invoke(message, url, {
        'Content-Type': ZmMimeTable.MSG_RFC822,
        'Content-Disposition': 'attachment; filename="message.eml"'
    }, callback);
};

OpenPGPZimbraSecure.prototype._onEncryptError = function(error){
    console.error(error);
    OpenPGPZimbraSecure.popupErrorDialog();
};

/**
 * This method gets called by the Zimlet framework when a toolbar is created.
 *
 * @param {ZmApp} app
 * @param {ZmButtonToolBar} toolbar
 * @param {ZmController} controller
 * @param {String} viewId
 */
OpenPGPZimbraSecure.prototype.initializeToolbar = function(app, toolbar, controller, viewId) {
    if (viewId.indexOf('COMPOSE') >= 0) {
        var button;
        var children = toolbar.getChildren();
        for (var i = 0; i < children.length && !button; i++) {
            if (Dwt.hasClass(children[i].getHtmlElement(), OpenPGPZimbraSecure.BUTTON_CLASS)) {
                button = children[i];
                break;
            }
        }
        var selectedValue;
        var enableSecurityButton = true;
        var msg = controller.getMsg();
        if (msg && msg.isInvite()) {
            selectedValue = OpenPGPZimbraSecure.OPENPGP_DONTSIGN;
            enableSecurityButton = false;
        } else if (msg && msg.isDraft) {
            selectedValue = OpenPGPZimbraSecure.OPENPGP_DONTSIGN;
        } else {
            selectedValue = this._getSecuritySetting();
        }
        if (!button) {
            var index = AjxUtil.indexOf(toolbar.opList, ZmOperation.COMPOSE_OPTIONS) + 1;
            var id = Dwt.getNextId() + '_' + OpenPGPZimbraSecure.BUTTON_CLASS;
            
            var securityButton = new DwtToolBarButton({
                parent: toolbar,
                id: id + '_checkbox',
                index: index,
                className: OpenPGPZimbraSecure.BUTTON_CLASS + ' ZToolbarButton'
            });

            var securityMenu = new DwtMenu({
                parent: securityButton,
                id: id + '_menu'
            });
            var signingRadioId = id + '_menu_sign';

            securityButton.setMenu(securityMenu);

            var listener = new AjxListener(this, this._handleSelectSigning, [securityButton]);

            var nosignButton = new DwtMenuItem({parent: securityMenu, style: DwtMenuItem.RADIO_STYLE, radioGroupId: signingRadioId});
            nosignButton.setText(OpenPGPUtils.prop('dontSignMessage'));
            nosignButton.addSelectionListener(listener);
            nosignButton.setData('sign', OpenPGPZimbraSecure.OPENPGP_DONTSIGN);

            var signButton = new DwtMenuItem({parent: securityMenu, style: DwtMenuItem.RADIO_STYLE, radioGroupId: signingRadioId});
            signButton.setText(OpenPGPUtils.prop('signMessage'));
            signButton.addSelectionListener(listener);
            signButton.setData('sign', OpenPGPZimbraSecure.OPENPGP_SIGN);

            var signAndEncryptButton = new DwtMenuItem({parent: securityMenu, style: DwtMenuItem.RADIO_STYLE, radioGroupId: signingRadioId});
            signAndEncryptButton.setText(OpenPGPUtils.prop('signAndEncryptMessage'));
            signAndEncryptButton.addSelectionListener(listener);
            signAndEncryptButton.setData('sign', OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT);

            securityMenu.checkItem('sign', selectedValue, true);
            this._setSecurityImage(securityButton, selectedValue);
            securityButton.setEnabled(enableSecurityButton);
        } else {
            var menu = button.getMenu();
            if (menu) {
                menu.checkItem('sign', selectedValue, true);
                this._setSecurityImage(button, selectedValue);
            }
            button.setEnabled(enableSecurityButton);
        }
    }
};

OpenPGPZimbraSecure.prototype._setSecurityImage = function(button, value) {
    button.setImage(OPENPGP_SECURITY_TYPES[value].className);
    button.setText(OPENPGP_SECURITY_TYPES[value].label);
};

/*
 * Event handler for select signing button on toolbar
 */
OpenPGPZimbraSecure.prototype._handleSelectSigning = function(button, ev) {
    var value = ev.dwtObj.getData('sign');

    this._setSecurityImage(button, value);

    var view = appCtxt.getCurrentView();
    var composeCtrl = view && view.getController && view.getController();

    // hide upload button form to suppress HTML5 file upload dialogs
    OpenPGPZimbraSecure._fixFormVisibility(view._attButton.getHtmlElement(), value == OpenPGPZimbraSecure.OPENPGP_DONTSIGN);

    this.setUserProperty(OpenPGPZimbraSecure.USER_SECURITY, value);
    this.saveUserProperties();
    composeCtrl.saveDraft(ZmComposeController.DRAFT_TYPE_AUTO);
};

OpenPGPZimbraSecure._fixFormVisibility = function(element, visible) {
    if (AjxEnv.supportsHTML5File) {
        var forms = element.getElementsByTagName('form');

        for (var i = 0; i < forms.length; i++)
            Dwt.setVisible(forms.item(i), visible);
    }
};

OpenPGPZimbraSecure.prototype._getSecurityButtonFromToolbar = function(toolbar) {
    var children = toolbar.getChildren();
    for (var i = 0; i < children.length; i++) {
        if (Dwt.hasClass(children[i].getHtmlElement(), OpenPGPZimbraSecure.BUTTON_CLASS)) {
            return children[i];
        }
    }
};

OpenPGPZimbraSecure.prototype._getUserSecuritySetting = function(ctlr, useToolbarOnly) {
    var app = appCtxt.getApp('Mail');
    AjxDispatcher.require(['MailCore','Mail']);
    var view = appCtxt.getAppViewMgr().getCurrentView();
    ctlr = ctlr || (view && view.isZmComposeView && view.getController());
    if (!useToolbarOnly) {
        ctlr = ctlr || app.getComposeController(app.getCurrentSessionId('COMPOSE'));
    }
    var toolbar = ctlr && ctlr._toolbar;
    var button = toolbar && this._getSecurityButtonFromToolbar(toolbar);
    var menu = button && button.getMenu();

    if (menu) {
        return menu.getSelectedItem().getData('sign');
    } else if (useToolbarOnly) {
        //only local setting is requested.
        return false;
    } else {
        return this._getSecuritySetting();
    }
};

OpenPGPZimbraSecure.prototype._getSecuritySetting = function() {
    if (appCtxt.isChildWindow) {
        return window.opener.appCtxt.getZimletMgr().getZimletByName('openpgp_zimbra_secure').handlerObject._getUserSecuritySetting();
    } else {
        var setting = appCtxt.get(OpenPGPZimbraSecure.PREF_SECURITY);
        if (setting == 'auto') {
            return Number(this.getUserProperty(OpenPGPZimbraSecure.USER_SECURITY) || 0);
        } else {
            return Number(setting);
        }
    }
};

OpenPGPZimbraSecure.prototype._shouldSign = function(ctlr, useToolbarOnly) {
    var value = this._getUserSecuritySetting(ctlr, useToolbarOnly);
    return (value == OpenPGPZimbraSecure.OPENPGP_SIGN || value == OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT);
};

OpenPGPZimbraSecure.prototype._shouldEncrypt = function(ctlr, useToolbarOnly) {
    return this._getUserSecuritySetting(ctlr, useToolbarOnly) == OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT;
};

OpenPGPZimbraSecure.prototype._addJsScripts = function(paths) {
    var self = this;
    var head = document.getElementsByTagName('HEAD').item(0);
    paths.forEach(function(path) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = self.getResource(path);
        head.appendChild(script);
    });
};

OpenPGPZimbraSecure.prototype._initOpenPGP = function() {
    var self = this;
    var securePwd = OpenPGPZimbraSecure.settings['secure_password'];
    var sequence = Promise.resolve();

    sequence.then(function() {
        var path = self.getResource('js/openpgpjs/openpgp.worker.min.js');
        openpgp.initWorker({
            path: path
        });
        return self._pgpKeys.init(securePwd);
    })
    .then(function(pgpKeys) {
        OpenPGPSecurePrefs.init(self);
    });
};

OpenPGPZimbraSecure.popupErrorDialog = function(errorCode){
    if(!errorCode){
        errorCode = 'unknown-error';
    }
    var msg = OpenPGPUtils.prop(errorCode);
    var title = OpenPGPUtils.prop(errorCode + '-title');

    var dialog = appCtxt.getHelpMsgDialog();
    dialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE, title);
    dialog.setHelpURL(appCtxt.get(ZmSetting.SMIME_HELP_URI));
    dialog.popup();
};
