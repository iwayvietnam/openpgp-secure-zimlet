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

/**
 * Zimlet handler constructor.
 */
function openpgp_zimbra_secure_HandlerObject() {
    this._pgpMessageCache = appCtxt.isChildWindow ? window.opener.openpgp_zimbra_secure_HandlerObject.getInstance()._pgpMessageCache : {};
    this._pgpAttachments = appCtxt.isChildWindow ? window.opener.openpgp_zimbra_secure_HandlerObject.getInstance()._pgpAttachments : {};
    this._overridedClasses = {};

    this._keyStore = new OpenPGPSecureKeyStore(this);

    var itemName = 'openpgp-secure-password-' + this.getUserID();
    if (!localStorage[itemName]) {
        localStorage[itemName] = OpenPGPUtils.randomString({
            length: 24
        });
    }
    this._securePassword = localStorage[itemName];
};

openpgp_zimbra_secure_HandlerObject.prototype = new ZmZimletBase();
openpgp_zimbra_secure_HandlerObject.prototype.constructor = openpgp_zimbra_secure_HandlerObject;

openpgp_zimbra_secure_HandlerObject.prototype.toString = function() {
    return 'openpgp_zimbra_secure_HandlerObject';
};

var OpenPGPZimbraSecure = openpgp_zimbra_secure_HandlerObject;

OpenPGPZimbraSecure.NAME = 'openpgp_zimbra_secure';

OpenPGPZimbraSecure.BUTTON_CLASS = 'openpgp_zimbra_secure_button';
OpenPGPZimbraSecure.PREF_SECURITY = 'OPENPGP_SECURITY';
OpenPGPZimbraSecure.USER_SECURITY = 'OPENPGP_USER_SECURITY';

OpenPGPZimbraSecure.OPENPGP_AUTO = 'openpgp_auto';
OpenPGPZimbraSecure.OPENPGP_DONTSIGN = 'openpgp_dontsign';
OpenPGPZimbraSecure.OPENPGP_SIGN = 'openpgp_sign';
OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT = 'openpgp_signencrypt';

/**
 * Zimlet initialize.
 */
OpenPGPZimbraSecure.prototype.init = function() {
    var self = this;

    if (appCtxt.isChildWindow) {
        this._handleNewWindow();
    }

    AjxDispatcher.addPackageLoadFunction('Mail', new AjxCallback(this, function() {
        self._overrideZmComposeView();
    }));

    AjxDispatcher.addPackageLoadFunction('MailCore', new AjxCallback(this, function(){
        self._overrideZmMailMsg();
        self._overrideZmMailMsgView();
        self._overrideZmMsgController();

        if (!appCtxt.isChildWindow) {
            self._overrideZmConv();
            self._overrideZmMailListController();
        }
    }));

    AjxDispatcher.addPackageLoadFunction('Startup1_2', new AjxCallback(this, function() {
        self._overrideZmSearch();
    }));

    AjxDispatcher.addPackageLoadFunction('NewWindow_2', new AjxCallback(this, function() {
        self._handleNewWindow();
    }));

    OpenPGPUtils.OPENPGP_CONTENT_TYPES.forEach(function(contentType) {
        ZmMimeTable._table[contentType] = {
            desc: 'OpenPGP encrypted file',
            image: 'PGPEncrypted',
            imageLarge: 'PGPEncrypted'
        };
    });

    var resource = [
        'js/openpgpjs/openpgp.min.js',
        '?v=',
        window.cacheKillerVersion
    ].join('');
    this._addJsScripts([
        this.getResource(resource)
    ], new AjxCallback(function() {
        self._initOpenPGP();
    }));
};

/**
 * Handle new window.
 */
OpenPGPZimbraSecure.prototype._handleNewWindow = function() {
    this._overrideZmMailMsg();
    this._overrideZmSearch();
    this._overrideZmMailMsgView();
    this._overrideZmComposeView();

    if (!this._overridedClasses['ZmNewWindow']) {
        var deepCopyFunc = ZmNewWindow.prototype._deepCopyMsg;
        ZmNewWindow.prototype._deepCopyMsg = function(msg) {
            var newMsg = deepCopyFunc.call(this, msg);
            var oldMsg = newMsg.cloneOf;
            if (oldMsg && oldMsg.attrs) {
                newMsg.attrs = oldMsg.attrs;
            }
            return newMsg;
        };
        this._overridedClasses['ZmNewWindow'] = true;
    }
};

/**
 * Override ZmMailMsg class.
 */
OpenPGPZimbraSecure.prototype._overrideZmMailMsg = function() {
    if (!this._overridedClasses['ZmMailMsg']) {
        var self = this;
        var sendMsgFunc = ZmMailMsg.prototype._sendMessage;
        ZmMailMsg.prototype._sendMessage = function(params) {
            self._sendMessage(sendMsgFunc, this, params);
        };

        var fetchMsgFunc = ZmMailMsg._handleResponseFetchMsg;
        ZmMailMsg._handleResponseFetchMsg = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                fetchMsgFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };
        this._overridedClasses['ZmMailMsg'] = true;
    }
};


/**
 * Override ZmConv class.
 */
OpenPGPZimbraSecure.prototype._overrideZmConv = function() {
    if (!this._overridedClasses['ZmConv']) {
        var responseLoadMsgsFunc = ZmConv.prototype._handleResponseLoadMsgs;
        ZmConv.prototype._handleResponseLoadMsgs = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                responseLoadMsgsFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };
        this._overridedClasses['ZmConv'] = true;
    }
};

/**
 * Override ZmSearch class.
 */
OpenPGPZimbraSecure.prototype._overrideZmSearch = function() {
    if (!this._overridedClasses['ZmSearch']) {
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
        this._overridedClasses['ZmSearch'] = true;
    }
};

/**
 * Override ZmMailMsgView class.
 */
OpenPGPZimbraSecure.prototype._overrideZmMailMsgView = function() {
    if (!this._overridedClasses['ZmMailMsgView']) {
        var self = this;
        var inlineImgFunc = ZmMailMsgView.__unfangInternalImage;
        ZmMailMsgView.__unfangInternalImage = function(msg, elem, aname, external) {
            var result = inlineImgFunc(msg, elem, aname, external);
            if (typeof aname !== 'undefined' && typeof msg !== 'undefined' && aname == 'src' && self._pgpMessageCache[msg.id]) {
                var pgpMessage = self._pgpMessageCache[msg.id];
                if (pgpMessage.encrypted && pgpMessage.attachments.length > 0) {
                    var pnSrc = Dwt.getAttr(elem, 'pn' + aname);
                    var mceSrc = Dwt.getAttr(elem, 'data-mce-' + aname);
                    var link = pnSrc || mceSrc || Dwt.getAttr(elem, aname);

                    if (link && link.substring(0, 4) === 'cid:') {
                        var attachment = false;
                        pgpMessage.attachments.forEach(function(attach) {
                            if (!attachment && (attach.cid && attach.cid === link.substring(4))) {
                                attachment = attach;
                            };
                        });
                        if (attachment) {
                            var content = OpenPGPUtils.base64Encode(openpgp.util.str2Uint8Array(attachment.content));
                            var newLink = 'data:' + attachment.type + ';base64,' + content.replace(/\r?\n/g, '');
                            elem.setAttribute('src', newLink);
                        }
                    }
                }
            }
            return result;
        };

        if (!ZmMailMsgView._attachmentHandlers) {
            ZmMailMsgView._attachmentHandlers = {};
        }
        for (var mimeType in ZmMimeTable._table) {
            if (mimeType === OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE) {
                if (!ZmMailMsgView._attachmentHandlers[mimeType]) {
                    ZmMailMsgView._attachmentHandlers[mimeType] = {};
                }
                ZmMailMsgView._attachmentHandlers[mimeType]['OpenPGPZimbraSecure'] = function(attachment) {
                    var title = self.getMessage('decryptFile');
                    var linkId = DwtId.makeId(ZmId.VIEW_MSG, attachment.mid, ZmId.MV_ATT_LINKS, attachment.part, 'decrypt');
                    var linkAttrs = [
                        'href="javascript:;"',
                        'onclick="OpenPGPZimbraSecure.decryptAttachment(\'' + attachment.label + '\', \'' + attachment.url + '\')"',
                        'class="AttLink"',
                        'style="text-decoration:underline;"',
                        'id="' + linkId + '"',
                        'title="' + title + '"'
                    ];
                    return '<a ' + linkAttrs.join(' ') + '>' + title + '</a>';
                };
            }
        }

        ZmMailMsgView.displayAdditionalHdrsInMsgView.securityHeader = '<span class="securityHeader">' + this.getMessage('messageSecurityHeader') + '</span>';
        this._overridedClasses['ZmMailMsgView'] = true;
    }
};

/**
 * Override ZmMsgController class.
 */
OpenPGPZimbraSecure.prototype._overrideZmMsgController = function() {
    if (!this._overridedClasses['ZmMsgController']) {
        var self = this;
        var listener = ZmMsgController.prototype._printListener;
        ZmMsgController.prototype._printListener = function(ev) {
            var id;
            var msg = this.getMsg();
            if (msg instanceof ZmConv) {
                id = msg.msgIds[0];
            }
            else {
                id = msg.id;
            }

            var pgpMessage = self._pgpMessageCache[id];
            if (pgpMessage && pgpMessage.encrypted && pgpMessage.textContent.length > 0) {
                self._encryptedMessagePrint(msg, pgpMessage);
            }
            else {
                listener.call(this, ev);
            }
        };

        var controller = AjxDispatcher.run('GetMsgController');
        controller._listeners[ZmOperation.PRINT] = controller._printListener.bind(controller);

        this._overridedClasses['ZmMsgController'] = true;
    }
};

/**
 * Override ZmMailListController class.
 */
OpenPGPZimbraSecure.prototype._overrideZmMailListController = function() {
    if (!this._overridedClasses['ZmMailListController']) {
        var self = this;
        var listener = ZmMailListController.prototype._printListener;
        ZmMailListController.prototype._printListener = function(ev) {
            var msg = this.getMsg();
            if (msg) {
                var pgpMessage = self._pgpMessageCache[msg.id];
                if (pgpMessage && pgpMessage.encrypted && pgpMessage.textContent.length > 0) {
                    self._encryptedMessagePrint(msg, pgpMessage);
                }
                else {
                    listener.call(this, ev);
                }
            }
            else {
                listener.call(this, ev);
            }
        };

        var controller = AjxDispatcher.run('GetMailListController');
        controller._listeners[ZmOperation.PRINT] = controller._printListener.bind(controller);

        this._overridedClasses['ZmMailListController'] = true;
    }
};

/**
 * Override ZmComposeView class.
 */
OpenPGPZimbraSecure.prototype._overrideZmComposeView = function() {
    if (!this._overridedClasses['ZmComposeView']) {
        var self = this;
        var setFromSelectFunc = ZmComposeView.prototype._setFromSelect;
        ZmComposeView.prototype._setFromSelect = function(msg) {
            setFromSelectFunc.call(this, msg);
            if (msg && self._pgpMessageCache[msg.id]) {
                var pgpMessage = self._pgpMessageCache[msg.id];
                if (pgpMessage.encrypted && pgpMessage.attachments.length > 0) {
                    var controller = this.getController();
                    var draftAids = [];
                    var url = appCtxt.get(ZmSetting.CSFE_ATTACHMENT_UPLOAD_URI) + '?fmt=extended,raw';
                    pgpMessage.attachments.forEach(function(attachment, index) {
                        var callback = new AjxCallback(function(response) {
                            if (response.success) {
                                var values = eval("[" + response.text + "]");
                                if (values && values.length == 3 && values[0] == 200) {
                                    values[2].forEach(function(value) {
                                        attachment.aid = value.aid;
                                        if (!attachment.cid) {
                                            draftAids.push(value);
                                        }
                                    });
                                }
                            }
                            if (pgpMessage.attachments.length == index + 1) {
                                controller.saveDraft(ZmComposeController.DRAFT_TYPE_AUTO, draftAids);
                            }
                        });
                        var content = (attachment.type.indexOf(ZmMimeTable.TEXT) == -1) ? openpgp.util.str2Uint8Array(attachment.content) : attachment.content;
                        AjxRpc.invoke(content, url, {
                            'Cache-Control': 'no-cache',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': attachment.type,
                            'Content-Disposition': 'attachment; filename="' + attachment.name + '"'
                        }, callback);
                    });
                }
            }
        };

        var topPartFunc = ZmComposeView.prototype._getTopPart;
        ZmComposeView.prototype._getTopPart = function(msg, isDraft, bodyContent) {
            if (this._origMsg && self._pgpMessageCache[this._origMsg.id]) {
                var pgpMessage = self._pgpMessageCache[this._origMsg.id];
                if (pgpMessage.encrypted && pgpMessage.attachments.length > 0) {
                    pgpMessage.attachments.forEach(function(attachment) {
                        if (attachment.cid && attachment.aid) {
                            msg.addInlineAttachmentId(attachment.cid, attachment.aid);
                            delete attachment.aid;
                        }
                    });
                }
            }
            return topPartFunc.call(this, msg, isDraft, bodyContent);
        };
        this._overridedClasses['ZmComposeView'] = true;
    }
};

/**
 * Get openpgp key store.
 */
OpenPGPZimbraSecure.prototype.getKeyStore = function() {
    return this._keyStore;
};

/**
 * Get secure password for encrypt/decrypt sensitive data.
 */
OpenPGPZimbraSecure.prototype.getSecurePassword = function() {
    return this._securePassword;
};

/**
 * Additional processing of message from server before handling control back
 * to Zimbra.
 *
 * @param {AjxCallback} callback original callback
 * @param {ZmCsfeResult} csfeResult
 */
OpenPGPZimbraSecure.prototype._handleMessageResponse = function(callback, csfeResult) {
    var processor = new OpenPGPSecureMessageProcessor(this, callback, csfeResult);
    processor.process();
};

/**
* Sends the given message
* @param {Function} orig original func ZmMailMsg.prototype._sendMessage
* @param {ZmMailMsg} msg
* @param {Object} params the mail params inluding the jsonObj msg.
*/
OpenPGPZimbraSecure.prototype._sendMessage = function(orig, msg, params) {
    var sender = new OpenPGPSecureSender(this, orig, msg, params);
    sender.send();
};

/**
 * This method is called when a message is sent in Zimbra.
 */
OpenPGPZimbraSecure.prototype.emailErrorCheck = function(msg, boolAndErrorMsgArray) {
    var receivers = OpenPGPSecureSender.getReceivers(msg);
    var missing = this.getKeyStore().publicKeyMissing(receivers);

    if (this._shouldEncrypt() && missing.length > 0) {
        boolAndErrorMsgArray.push({
            zimletName: this.toString(),
            hasError: true,
            errorMsg: AjxMessageFormat.format(this.getMessage('notHavePublicKeyWarning'), missing.join(', '))
        });
    }
    else if (this._shouldSign() && !this.getKeyStore().getPrivateKey()) {
        boolAndErrorMsgArray.push({
            zimletName: this.toString(),
            hasError: true,
            errorMsg: this.getMessage('notHavePrivateKeyWarning')
        });
    }
};

/**
 * This method is called when a message is viewed in Zimbra.
 * This method is called by the Zimlet framework when a user clicks-on a message in the mail application.
 */
OpenPGPZimbraSecure.prototype.onMsgView = function(msg, oldMsg, msgView) {
    this._renderMessageInfo(msg, msgView);
};

/**
 * Render cached openpgp message.
 */
OpenPGPZimbraSecure.prototype._renderMessageInfo = function(msg, view) {
    var self = this;
    if (!msg || msg.isDraft)
        return;
    var pgpMessage = this._pgpMessageCache[msg.id];
    if (!pgpMessage) {
        return;
    }

    if (pgpMessage.encrypted) {
        var el = Dwt.byId(view._attLinksId);
        if (el) {
            return;
        }

        var msgBody = Dwt.byId(view._msgBodyDivId);
        if (pgpMessage.attachments.length > 0 && msgBody) {
            var numFormatter = AjxNumberFormat.getInstance();
            var data = {
                attLinksId: view._attLinksId,
                attachments: []
            };

            var linkId = '';
            var attLinkIds = [];
            pgpMessage.attachments.forEach(function(attachment, index) {
                var imageHtml = '';
                var links = [];

                var clientVersion = OpenPGPZimbraSecure.getClientVersion();
                var mimeInfo = ZmMimeTable.getInfo(attachment.type);
                if (clientVersion.indexOf('8.7.') >= 0 || clientVersion.indexOf('8.8.') >= 0) {
                    imageHtml = AjxImg.getImageHtml({
                        imageName: mimeInfo ? mimeInfo.image : 'GenericDoc',
                        styles: 'position:relative;',
                        altText: ZmMsg.attachment
                    });
                }
                else {
                    imageHtml = AjxImg.getImageHtml(mimeInfo ? mimeInfo.image : 'GenericDoc', 'position:relative;', null, false, false, null, ZmMsg.attachment);
                }

                var linkAttrs = [
                    'class="AttLink"',
                    'href="javascript:;//' + attachment.name + '"',
                    'data-id="' + attachment.id + '"'
                ].join(' ');
                links.push('<span class="Object" role="link">');
                linkId = view._attLinksId + '_' + msg.id + '_' + index + '_name';
                links.push('<a id="' + linkId + '" ' + linkAttrs + ' title="' + attachment.name + '">' + attachment.name + '</a>');
                attLinkIds.push(linkId);
                links.push('</span>');

                var size = AjxUtil.formatSize(attachment.size, false, 2);
                links.push('&nbsp;(' + size + ')&nbsp;');

                links.push('|&nbsp;');
                linkId = view._attLinksId + '_' + msg.id + '_' + index + '_download';
                links.push('<a id="' + linkId + '" ' + linkAttrs + ' style="text-decoration:underline" title="' + ZmMsg.download + '">' + ZmMsg.download + '</a>');
                attLinkIds.push(linkId);
                data.attachments.push({
                    imageHtml: imageHtml,
                    links: links.join('')
                });
            });

            var div = document.createElement('div');
            div.innerHTML = OpenPGPUtils.renderTemplate('EncryptedAttachments', data);
            msgBody.parentNode.insertBefore(div, msgBody);

            attLinkIds.forEach(function(id) {
                var link = Dwt.byId(id);
                if (link) {
                    link.onclick = function() {
                        self._download(this);
                    };
                }
            });
        }
    }

    if (pgpMessage.hasPGPKey && !appCtxt.isChildWindow) {
        var pgpKey = pgpMessage.pgpKey;
        if (pgpKey) {
            var pubKey = openpgp.key.readArmored(pgpKey);
            pubKey.keys.forEach(function(key) {
                if (key.isPublic() && !self._keyStore.publicKeyExisted(key.primaryKey.fingerprint)) {
                    var dialog = self._keyImportDialog = new ImportPublicKeyDialog(
                        self,
                        function(dialog) {
                            dialog.importPublicKey();
                        },
                        false,
                        key
                    );
                    dialog.popup();
                }
            });
        }
    }
};

/**
 * This method is called when public key is changed.
 */
OpenPGPZimbraSecure.prototype.onPublicKeyChange = function() {
    var controller = AjxDispatcher.run('GetConvListController');
    var itemView = controller.getItemView();
    if (itemView instanceof ZmConvView2) {
        itemView.clearChangeListeners();
    }
    var paneView = controller.getCurrentView();
    if (paneView instanceof ZmConvDoublePaneView) {
        var children = paneView.getChildren();
        children.forEach(function(child) {
            if (child instanceof ZmConvListView) {
                var list = child.getList();
                if (list) {
                    var convs = list.getArray();
                    convs.forEach(function(conv) {
                        conv._loaded = false;
                    });
                }
            }
        });
    }
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
    var self = this;
    if (!appCtxt.isChildWindow && AjxUtil.indexOf(toolbar.opList, ZmOperation.PRINT) && (controller instanceof ZmConvListController)) {
        var button = toolbar.getButton(ZmOperation.PRINT);
        if (button) {
            button.removeSelectionListeners();
            var listener = controller._printListener;
            var printListener = function(ev) {
                var msg = controller.getMsg();
                if (msg) {
                    var pgpMessage = self._pgpMessageCache[msg.id];
                    if (pgpMessage && pgpMessage.encrypted && pgpMessage.textContent.length > 0) {
                        self._encryptedMessagePrint(msg, pgpMessage);
                    }
                    else {
                        listener.call(controller, ev);
                    }
                }
                else {
                    listener.call(controller, ev);
                }
            };
            button.addSelectionListener(printListener.bind(controller));
        }
    }

    if (viewId.indexOf(ZmId.VIEW_COMPOSE) >= 0) {
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
            nosignButton.setText(this.getMessage('dontEncryptMessage'));
            nosignButton.addSelectionListener(listener);
            nosignButton.setData('sign', OpenPGPZimbraSecure.OPENPGP_DONTSIGN);

            var signButton = new DwtMenuItem({parent: securityMenu, style: DwtMenuItem.RADIO_STYLE, radioGroupId: signingRadioId});
            signButton.setText(this.getMessage('signMessage'));
            signButton.addSelectionListener(listener);
            signButton.setData('sign', OpenPGPZimbraSecure.OPENPGP_SIGN);

            var signAndEncryptButton = new DwtMenuItem({parent: securityMenu, style: DwtMenuItem.RADIO_STYLE, radioGroupId: signingRadioId});
            signAndEncryptButton.setText(this.getMessage('signAndEncryptMessage'));
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
    var security_types = {};
    security_types[OpenPGPZimbraSecure.OPENPGP_DONTSIGN] = {label: this.getMessage('dontEncryptMessage'), className: 'PGPDontSign'};
    security_types[OpenPGPZimbraSecure.OPENPGP_SIGN] = {label: this.getMessage('signMessage'), className: 'PGPSign'};
    security_types[OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT] = {label: this.getMessage('signAndEncryptMessage'), className: 'PGPSignEncrypt'};

    if (security_types[value]) {
        button.setImage(security_types[value].className);
        button.setText(security_types[value].label);
    }
    else {
        button.setImage('DontSign');
        button.setText(this.getMessage('dontEncryptMessage'));
    }
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

        for (var i = 0; i < forms.length; i++) {
            Dwt.setVisible(forms.item(i), visible);
        }
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

/**
 * Get toolbar security setting of user.
 */
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

/**
 * Get security setting of user.
 */
OpenPGPZimbraSecure.prototype._getSecuritySetting = function() {
    if (appCtxt.isChildWindow) {
        return window.opener.appCtxt.getZimletMgr().getZimletByName(OpenPGPZimbraSecure.NAME).handlerObject._getUserSecuritySetting();
    } else {
        var setting = appCtxt.get(OpenPGPZimbraSecure.PREF_SECURITY);
        if (setting == OpenPGPZimbraSecure.OPENPGP_AUTO) {
            return this.getUserProperty(OpenPGPZimbraSecure.USER_SECURITY) || OpenPGPZimbraSecure.OPENPGP_DONTSIGN;
        } else {
            return setting;
        }
    }
};

/**
 * Get should sign state of user.
 */
OpenPGPZimbraSecure.prototype._shouldSign = function(ctlr, useToolbarOnly) {
    var value = this._getUserSecuritySetting(ctlr, useToolbarOnly);
    return (value == OpenPGPZimbraSecure.OPENPGP_SIGN || value == OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT);
};

/**
 * Get should encrypt state of user.
 */
OpenPGPZimbraSecure.prototype._shouldEncrypt = function(ctlr, useToolbarOnly) {
    return this._getUserSecuritySetting(ctlr, useToolbarOnly) == OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT;
};

/**
 * Add js scripts and run a callback.
 *
 * @param {array}   scripts    An array of script paths
 * @param {AjxCallback} callback the callback will be called when all scripts were processed
 */
OpenPGPZimbraSecure.prototype._addJsScripts = function(scripts, callback) {
    return AjxInclude(scripts, null, callback);
};

/**
 * Initialize openpgp in key store and preference page.
 */
OpenPGPZimbraSecure.prototype._initOpenPGP = function() {
    var self = this;
    var sequence = Promise.resolve();
    sequence.then(function() {
        var resource = [
            'js/openpgpjs/openpgp.worker.min.js',
            '?v=',
            window.cacheKillerVersion
        ].join('');
        var path = self.getResource(resource);
        openpgp.initWorker({
            path: path
        });
        return self._keyStore.init();
    })
    .then(function() {
        if (!appCtxt.isChildWindow) {
            OpenPGPSecurePrefs.init(self);
        }
    });
};

/**
 * Decrypted encrypted attachment and download.
 *
 * @param {String} name The name of attachment
 * @param {String} url  The URL of attachment
 */
OpenPGPZimbraSecure.decryptAttachment = function(name, url) {
    if (name.substring(name.length - 4) === '.pgp' || name.substring(name.length - 4) === '.asc') {
        name = name.substring(0, name.length - 4);
    }
    var callback = new AjxCallback(function(response) {
        if (response.success) {
            var handler = OpenPGPZimbraSecure.getInstance();
            var data = OpenPGPUtils.base64Decode(response.text);
            if (data.indexOf(OpenPGPMimeBuilder.VERSION_CONTENT) > -1) {
                OpenPGPUtils.saveTextAs(data, name);
            }
            else {
                if (OpenPGPUtils.hasInlinePGPContent(data, OpenPGPUtils.OPENPGP_MESSAGE_HEADER)) {
                    var opts = {
                        message: openpgp.message.readArmored(data),
                        privateKey: handler.getKeyStore().getPrivateKey()
                    };
                }
                else {
                    var opts = {
                        message: openpgp.message.read(OpenPGPUtils.base64ToBin(response.text)),
                        privateKey: handler.getKeyStore().getPrivateKey(),
                        format: 'binary'
                    };
                }
                openpgp.decrypt(opts).then(function(plainText) {
                    OpenPGPUtils.saveAs(plainText.data, name, ZmMimeTable.APP_OCTET_STREAM);
                });
            }
        }
    });

    AjxRpc.invoke('', url, {
        'X-Zimbra-Encoding': 'x-base64'
    }, callback, true);
};

/**
 * Download content of encrypted message attachment.
 *
 * @param {Object} element The HMLT DOM element
 */
OpenPGPZimbraSecure.prototype._download = function(element) {
    var id = Dwt.getAttr(element, 'data-id');
    if (id && this._pgpAttachments[id]) {
        var attachment = this._pgpAttachments[id];
        OpenPGPUtils.saveAs(attachment.content, attachment.name, attachment.type);
    }
};

/**
 * Show error dialog.
 *
 * @param {String} errorCode The error code
 */
OpenPGPZimbraSecure.popupErrorDialog = function(errorCode){
    if(!errorCode){
        errorCode = 'unknown-error';
    }
    var msg = OpenPGPUtils.getMessage(errorCode);
    var title = OpenPGPUtils.getMessage(errorCode + '-title');
    var zimlet = OpenPGPZimbraSecure.getInstance();
    var helpUrl = zimlet.getZimletContext().getConfig('help-url');

    var dialog = appCtxt.getHelpMsgDialog();
    dialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE, title);
    dialog.setHelpURL(helpUrl);
    dialog.popup();
};

/**
 * Gets the zimlet handler.
 * 
 * @return {Object} the zimlet handler
 */
OpenPGPZimbraSecure.getInstance = function() {
    return appCtxt.getZimletMgr().getZimletByName(OpenPGPZimbraSecure.NAME).handlerObject;
};

/**
 * Gets client version.
 * 
 * @return  {String}
 */
OpenPGPZimbraSecure.getClientVersion = function() {
    return appCtxt.get(ZmSetting.CLIENT_VERSION);
};

/**
 * Open new window for encrypted message printing.
 */
OpenPGPZimbraSecure.prototype._encryptedMessagePrint = function(msg, pgpMessage) {
    var parrams = {
        from: msg.sentByAddr,
        subject: msg.subject,
        toRecipient: false,
        ccRecipient: false,
        bccRecipient: false,
        replyTo: false,
        sentAt: new Date(msg.sentDate),
        msgBody: OpenPGPUtils.isHtml(pgpMessage.textContent) ? pgpMessage.textContent : AjxStringUtil.convertToHtml(pgpMessage.textContent, false, '<pre>', '</pre>')
    };

    var toAddresses = msg.getAddresses(AjxEmailAddress.TO).getArray();
    if (toAddresses.length > 0) {
        var to = [];
        toAddresses.forEach(function(addr) {
            to.push(AjxStringUtil.htmlEncode(addr.toString()));
        });
        parrams.toRecipient = to.join(', ');
    }

    var ccAddresses = msg.getAddresses(AjxEmailAddress.CC).getArray();
    if (ccAddresses.length > 0) {
        var cc = [];
        ccAddresses.forEach(function(addr) {
            cc.push(AjxStringUtil.htmlEncode(addr.toString()));
        });
        parrams.ccRecipient = cc.join(', ');
    }

    var bccAddresses = msg.getAddresses(AjxEmailAddress.BCC).getArray();
    if (bccAddresses.length > 0) {
        var bcc = [];
        bccAddresses.forEach(function(addr) {
            bcc.push(AjxStringUtil.htmlEncode(addr.toString()));
        });
        parrams.bccRecipient = bcc.join(', ');
    }

    var replyToAddresses = msg.getAddresses(AjxEmailAddress.REPLY_TO).getArray();
    if (replyToAddresses.length > 0) {
        var replyTo = [];
        replyToAddresses.forEach(function(addr) {
            replyTo.push(AjxStringUtil.htmlEncode(addr.toString()));
        });
        parrams.replyTo = replyTo.join(', ');
    }

    var printWindow = window.open('', 'Print-Window', 'width=800, height=600');
    printWindow.document.open();
    printWindow.document.write(OpenPGPUtils.renderTemplate('EncryptedPrint', parrams));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};
