/**
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

function openpgp_zimbra_secure_HandlerObject() {
    this._pgpMessageCache = appCtxt.isChildWindow ? window.opener.openpgp_zimbra_secure_HandlerObject.getInstance()._pgpMessageCache : {};
    this._sendingAttachments = [];
    this._pgpAttachments = {};
    this._keyStore = new OpenPGPSecureKeyStore(this);
    this._securePassword = '';
    var pwdKey = 'openpgp_secure_password_' + this.getUserID();
    if (localStorage[pwdKey]) {
        this._securePassword = localStorage[pwdKey];
    }
    if (this._securePassword.length == 0) {
        localStorage[pwdKey] = this._securePassword = OpenPGPUtils.randomString({
            length: 24
        });
    }
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

OpenPGPZimbraSecure.OPENPGP_AUTO = 'openpgp_auto';
OpenPGPZimbraSecure.OPENPGP_DONTSIGN = 'openpgp_dontsign';
OpenPGPZimbraSecure.OPENPGP_SIGN = 'openpgp_sign';
OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT = 'openpgp_signencrypt';

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

        var responseLoadMsgsFunc = ZmConv.prototype._handleResponseLoadMsgs;
        ZmConv.prototype._handleResponseLoadMsgs = function(callback, result) {
            var newCallback = new AjxCallback(this, function(newResult) {
                responseLoadMsgsFunc.call(this, callback, newResult || result);
            });
            self._handleMessageResponse(newCallback, result);
        };
        self._overrideZmMailMsgView();
        self._addAttachmentHandler();
    }));

    AjxDispatcher.addPackageLoadFunction('Startup1_2', new AjxCallback(this, function() {
        self._overrideZmSearch();
    }));

    AjxDispatcher.addPackageLoadFunction('NewWindow_2', new AjxCallback(this, function() {
        self._handleNewWindow();
    }));

    this._addJsScripts([
        this.getResource('js/openpgpjs/openpgp.min.js')
    ], new AjxCallback(function() {
        self._initOpenPGP();
    }));
};

OpenPGPZimbraSecure.prototype._handleNewWindow = function() {
    this._overrideZmMailMsg();
    this._overrideZmSearch();
    this._overrideZmMailMsgView();
    this._overrideZmComposeView();
};

OpenPGPZimbraSecure.prototype._overrideZmMailMsg = function() {
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
};

OpenPGPZimbraSecure.prototype._overrideZmSearch = function() {
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
};

OpenPGPZimbraSecure.prototype._overrideZmMailMsgView = function() {
    var self = this;
    var inlineImgFunc = ZmMailMsgView.__unfangInternalImage;
    ZmMailMsgView.__unfangInternalImage = function(msg, elem, aname, external) {
        var result = inlineImgFunc(msg, elem, aname, external);
        if (aname == 'src' && self._pgpMessageCache[msg.id]) {
            var pgpMessage = self._pgpMessageCache[msg.id];
            if (pgpMessage.encrypted && pgpMessage.attachments.length > 0) {
                var pnSrc = Dwt.getAttr(elem, 'pn' + aname);
                var mceSrc = Dwt.getAttr(elem, 'data-mce-' + aname);
                var link = pnSrc || mceSrc || Dwt.getAttr(elem, aname);

                if (link && link.substring(0, 4) === 'cid:') {
                    var attachment = pgpMessage.attachments.find(function(attachment) {
                        return (attachment.cid && attachment.cid === link.substring(4));
                    });
                    if (attachment) {
                        var content = OpenPGPUtils.base64Encode(attachment.content);
                        var newLink = 'data:' + attachment.type + ';base64,' + content.replace(/\r?\n/g, '');
                        elem.setAttribute('src', newLink);
                    }
                }
            }
        }
        return result;
    };

    ZmMailMsgView.displayAdditionalHdrsInMsgView.securityHeader = '<span class="securityHeader">' + this.getMessage('messageSecurityHeader') + '</span>';
};

OpenPGPZimbraSecure.prototype._overrideZmComposeView = function() {
    var self = this;
    var setFromSelectFunc = ZmComposeView.prototype._setFromSelect;
    ZmComposeView.prototype._setFromSelect = function(msg) {
        setFromSelectFunc.call(this, msg);
        if (msg && self._pgpMessageCache[msg.id]) {
            var pgpMessage = self._pgpMessageCache[msg.id];
            if (pgpMessage.encrypted && pgpMessage.attachments.length > 0) {
                var controller = this.getController();
                var aids = [];
                var draftAids = [];
                var url = appCtxt.get(ZmSetting.CSFE_ATTACHMENT_UPLOAD_URI) + '?fmt=raw';
                pgpMessage.attachments.forEach(function(attachment) {
                    var callback = new AjxCallback(function(response) {
                        if (response.success) {
                            var values = JSON.parse('[' + response.text.replace(/'/g, '"')  + ']');
                            if (values && values.length == 3 && values[0] == 200) {
                                attachment.aid = values[2];
                                aids.push(attachment.aid);
                                if (!attachment.cid) {
                                    draftAids.push(attachment.aid);
                                }
                            }
                            if (aids.length == pgpMessage.attachments.length) {
                                controller.saveDraft(ZmComposeController.DRAFT_TYPE_AUTO, draftAids.join(','));
                            }
                        }
                    });
                    var content = (attachment.type.indexOf(ZmMimeTable.TEXT) == -1) ? OpenPGPUtils.stringToBin(attachment.content) : attachment.content;
                    AjxRpc.invoke(content, url, {
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
};

OpenPGPZimbraSecure.prototype._addAttachmentHandler = function() {
    var self = this;

    OpenPGPUtils.OPENPGP_CONTENT_TYPES.forEach(function(contentType) {
        ZmMimeTable._table[contentType] = {
            desc: 'OpenPGP encrypted file',
            image: 'PGPEncrypted',
            imageLarge: 'PGPEncrypted'
        };
    });

    var app = appCtxt.getAppController().getApp(ZmId.APP_MAIL);
    var controller = app.getMsgController(app.getCurrentSessionId(ZmId.VIEW_MSG));
    var viewType = appCtxt.getViewTypeFromId(ZmMsgController.getDefaultViewType());
    controller._initializeView(viewType);
    var view = controller._view[viewType];

    for (var mimeType in ZmMimeTable._table) {
        if (mimeType === OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE) {
            view.addAttachmentLinkHandler(mimeType, 'OpenPGPZimbraSecure', function(attachment) {
                var title = self.getMessage('decryptFile');
                var linkId = view._getAttachmentLinkId(attachment.part, 'decrypt');
                var linkAttrs = [
                    'href="javascript:;"',
                    'onclick="OpenPGPZimbraSecure.decryptAttachment(\'' + attachment.label + '\', \'' + attachment.url + '\')"',
                    'class="AttLink"',
                    'style="text-decoration:underline;"',
                    'id="' + linkId + '"',
                    'title="' + title + '"'
                ];
                return '<a ' + linkAttrs.join(' ') + '>' + title + '</a>';
            });
        }
    }
};

OpenPGPZimbraSecure.prototype.getKeyStore = function() {
    return this._keyStore;
};

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
 * This method is called when a message is viewed in Zimbra.
 * This method is called by the Zimlet framework when a user clicks-on a message in the mail application.
 */
OpenPGPZimbraSecure.prototype.onMsgView = function(msg, oldMsg, msgView) {
    this._renderMessageInfo(msg, msgView);
};

OpenPGPZimbraSecure.prototype._renderMessageInfo = function(msg, view) {
    var self = this;
    if (!msg || !view._hdrTableId || msg.isDraft)
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

        if (pgpMessage.attachments.length > 0) {
            var numFormatter = AjxNumberFormat.getInstance();
            var msgBody = Dwt.byId(view._msgBodyDivId);
            var div = document.createElement('div');
            div.id = view._attLinksId;
            div.className = 'attachments';

            var linkId = '';
            var attLinkIds = [];
            var htmlArr = [];
            htmlArr.push('<table id="' + view._attLinksId + '_table" cellspacing="0" cellpadding="0" border="0">');
            pgpMessage.attachments.forEach(function(attachment, index) {
                htmlArr.push('<tr><td>');
                htmlArr.push('<table border=0 cellpadding=0 cellspacing=0 style="margin-right:1em; margin-bottom:1px"><tr>');
                htmlArr.push('<td style="width:18px">');

                var clientVersion = OpenPGPZimbraSecure.getClientVersion();
                var mimeInfo = ZmMimeTable.getInfo(attachment.type);
                if (clientVersion.indexOf('8.7.0_GA') >= 0 || clientVersion.indexOf('8.7.1_GA') >= 0) {
                    htmlArr.push(AjxImg.getImageHtml({
                        imageName: mimeInfo ? mimeInfo.image : 'GenericDoc',
                        styles: 'position:relative;',
                        altText: ZmMsg.attachment
                    }));
                }
                else {
                    htmlArr.push(AjxImg.getImageHtml(mimeInfo ? mimeInfo.image : 'GenericDoc', 'position:relative;', null, false, false, null, ZmMsg.attachment));
                }
                htmlArr.push('</td><td style="white-space:nowrap">');

                var linkAttrs = [
                    'class="AttLink"',
                    'href="javascript:;//' + attachment.name + '"',
                    'data-id="' + attachment.id + '"'
                ].join(' ');
                htmlArr.push('<span class="Object" role="link">');
                linkId = view._attLinksId + '_' + msg.id + '_' + index + '_name';
                htmlArr.push('<a id="' + linkId + '" ' + linkAttrs + ' title="' + attachment.name + '">' + attachment.name + '</a>');
                attLinkIds.push(linkId);
                htmlArr.push('</span>');

                if (attachment.size < 1024) {
                    size = numFormatter.format(attachment.size) + ' ' + ZmMsg.b;
                }
                else if (attachment.size < (1024 * 1024)) {
                    size = numFormatter.format(Math.round((attachment.size / 1024) * 10) / 10) + ' ' + ZmMsg.kb;
                }
                else {
                    size = numFormatter.format(Math.round((attachment.size / (1024 * 1024)) * 10) / 10) + ' ' + ZmMsg.mb;
                }
                htmlArr.push('&nbsp;(' + size + ')&nbsp;');

                htmlArr.push('|&nbsp;');
                linkId = view._attLinksId + '_' + msg.id + '_' + index + '_download';
                htmlArr.push('<a id="' + linkId + '" ' + linkAttrs + ' style="text-decoration:underline" title="' + ZmMsg.download + '">' + ZmMsg.download + '</a>');
                attLinkIds.push(linkId);

                htmlArr.push('</td></tr></table>');
                htmlArr.push('</td></tr>');
            });
            htmlArr.push('</table>');

            div.innerHTML = htmlArr.join('');
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

    if (pgpMessage.hasPGPKey) {
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

OpenPGPZimbraSecure.prototype.handlePublicKeyChange = function() {
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
                var convs = child.getList().getArray();
                convs.forEach(function(conv) {
                    conv._loaded = false;
                });
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
            nosignButton.setText(this.getMessage('dontSignMessage'));
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
    security_types[OpenPGPZimbraSecure.OPENPGP_DONTSIGN] = {label: this.getMessage('dontSignMessage'), className: 'PGPDontSign'};
    security_types[OpenPGPZimbraSecure.OPENPGP_SIGN] = {label: this.getMessage('signMessage'), className: 'PGPSign'};
    security_types[OpenPGPZimbraSecure.OPENPGP_SIGNENCRYPT] = {label: this.getMessage('signAndEncryptMessage'), className: 'PGPSignEncrypt'};

    if (security_types[value]) {
        button.setImage(security_types[value].className);
        button.setText(security_types[value].label);
    }
    else {
        button.setImage('DontSign');
        button.setText(this.getMessage('dontSignMessage'));
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
        if (setting == OpenPGPZimbraSecure.OPENPGP_AUTO) {
            return this.getUserProperty(OpenPGPZimbraSecure.USER_SECURITY) || OpenPGPZimbraSecure.OPENPGP_DONTSIGN;
        } else {
            return setting;
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

OpenPGPZimbraSecure.prototype._addJsScripts = function(scripts, callback) {
    return AjxInclude(scripts, null, callback);
};

OpenPGPZimbraSecure.prototype._initOpenPGP = function() {
    var self = this;
    var sequence = Promise.resolve();
    sequence.then(function() {
        var path = self.getResource('js/openpgpjs/openpgp.worker.min.js');
        openpgp.initWorker({
            path: path
        });
        return self._keyStore.init();
    })
    .then(function() {
        OpenPGPSecurePrefs.init(self);
    });
};

OpenPGPZimbraSecure.decryptAttachment = function(name, url) {
    if (name.substring(name.length - 4) === '.pgp' || name.substring(name.length - 4) === '.asc') {
        name = name.substring(0, name.length - 4);
    }
    var callback = new AjxCallback(function(response) {
        if (response.success) {
            var handler = OpenPGPZimbraSecure.getInstance();
            var data = OpenPGPUtils.base64Decode(response.text);
            if (OpenPGPUtils.hasInlinePGPContent(data, OpenPGPUtils.OPENPGP_MESSAGE_HEADER)) {
                var opts = {
                    message: openpgp.message.readArmored(data),
                    privateKey: handler.getKeyStore().getPrivateKey()
                };
            }
            else {
                var opts = {
                    message: openpgp.message.read(OpenPGPUtils.stringToBin(data)),
                    privateKey: handler.getKeyStore().getPrivateKey(),
                    format: 'binary'
                };
            }
            openpgp.decrypt(opts).then(function(plainText) {
                OpenPGPUtils.saveAs(plainText.data, name, ZmMimeTable.APP_OCTET_STREAM);
            });
        }
    });

    AjxRpc.invoke('', url, {
        'X-Zimbra-Encoding': 'x-base64'
    }, callback, true);
};

OpenPGPZimbraSecure.prototype._download = function(element) {
    var id = Dwt.getAttr(element, 'data-id');
    if (id && this._pgpAttachments[id]) {
        var attachment = this._pgpAttachments[id];
        OpenPGPUtils.saveAs(attachment.content, attachment.name, attachment.type);
    }
};

OpenPGPZimbraSecure.popupErrorDialog = function(errorCode){
    if(!errorCode){
        errorCode = 'unknown-error';
    }
    var msg = OpenPGPUtils.getMessage(errorCode);
    var title = OpenPGPUtils.getMessage(errorCode + '-title');

    var dialog = appCtxt.getHelpMsgDialog();
    dialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE, title);
    dialog.setHelpURL(appCtxt.get(ZmSetting.SMIME_HELP_URI));
    dialog.popup();
};

OpenPGPZimbraSecure.getInstance = function() {
    return appCtxt.getZimletMgr().getZimletByName('openpgp_zimbra_secure').handlerObject;
};

OpenPGPZimbraSecure.getClientVersion = function() {
    return appCtxt.get(ZmSetting.CLIENT_VERSION);
};
