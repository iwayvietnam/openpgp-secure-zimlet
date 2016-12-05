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

OpenPGPSecureSender = function(handler, callback, msg, params) {
    this._handler = handler;
    this._callback = callback;
    this._msg = msg;
    this._params = params;

    this._sendingAttachments = [];
    this._input = params.jsonObj.SendMsgRequest;

    this._shouldSign = false;
    this._shouldEncrypt = false;
    if (this._input) {
        this._shouldSign = handler._shouldSign();
        this._shouldEncrypt = handler._shouldEncrypt();
    }
};

OpenPGPSecureSender.prototype = new Object();
OpenPGPSecureSender.prototype.constructor = OpenPGPSecureSender;

OpenPGPSecureSender.prototype.send = function() {
    if (this._shouldSign || this._shouldEncrypt) {
        this._encryptMessage();
    }
    else {
        this._callback.apply(this._msg, [this._params]);
    }
};

OpenPGPSecureSender.prototype._encryptMessage = function() {
    var self = this;
    var handler = this._handler;
    var msg = this._msg;
    var input = this._input;
    var view = appCtxt.getCurrentView();

    function checkAttachments(list, cid, fmt) {
        for (var i = 0; list && i < list.length; i++) {
            var url = appCtxt.get(ZmSetting.CSFE_MSG_FETCHER_URI) + '&disp=a';
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
                        var newSrc = 'data:' + part.ct.substring(0, ctIndex) + ';base64,' + OpenPGPUtils.base64Encode(part.data);
                        view._htmlEditor.replaceImageSrc(oldSrc, newSrc);
                    }
                }
                self._sendingAttachments.push(part);
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

    var contents = [];
    input.m.mp.forEach(function(part) {
        OpenPGPUtils.visitMimePart(part, function(mp) {
            if (mp.content && (mp.ct === ZmMimeTable.TEXT_PLAIN || mp.ct === ZmMimeTable.TEXT_HTML)) {
                contents.push(mp);
            }
        });
    });

    var attachments = [];
    while (this._sendingAttachments.length > 0) {
        attachments.push(this._sendingAttachments.pop());
    }

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

    var receivers = OpenPGPSecureSender.getReceivers(msg);
    var encryptor = new OpenPGPEncrypt({
        privateKey: handler.getKeyStore().getPrivateKey(),
        publicKeys: handler.getKeyStore().havingPublicKeys(receivers),
        onEncrypted: function(mimeNode) {
            mimeNode.setHeader(self._msgHeaders());
            self._onEncrypted(mimeNode.build());
        },
        onError: function(error) {
            console.log(error);
            self._onEncryptError('encrypting-error');
        }
    });
    encryptor.shouldSign(this._shouldSign);
    encryptor.shouldEncrypt(this._shouldEncrypt);
    encryptor.encrypt(contents, attachments);
};

OpenPGPSecureSender.prototype._onEncrypted = function(message) {
    var self = this;
    var msg = this._msg;
    var params = this._params;
    var input = this._input;
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

            self._callback.apply(msg, [params]);
        }
        else {
            self._onEncryptError('encrypting-error');
        }
    });

    AjxRpc.invoke(message, url, {
        'Content-Type': ZmMimeTable.MSG_RFC822,
        'Content-Disposition': 'attachment; filename="message.eml"'
    }, callback);
};

OpenPGPSecureSender.prototype._onEncryptError = function(error){
    OpenPGPZimbraSecure.popupErrorDialog(error);
};

OpenPGPSecureSender.prototype._msgHeaders = function() {
    var msg = this._input.m;
    var headers = {};
    if (msg.e) {
        var toAddresses = [];
        var ccAddresses = [];
        var bccAddresses = [];
        var rtAddresses = [];
        msg.e.forEach(function(e) {
            if (e.t == 'f') {
                headers['from'] = e.a;
            }
            if (e.t == 's') {
                headers['sender'] = e.a;
            }
            if (e.t == 't') {
                toAddresses.push(e.a);
            }
            if (e.t == 'c') {
                ccAddresses.push(e.a);
            }
            if (e.t == 'b') {
                bccAddresses.push(e.a);
            }
            if (e.t == 'r') {
                rtAddresses.push(e.a);
            }
            if (e.t == 'n') {
                headers['disposition-notification-to'] = e.a;
            }
        });
        if (toAddresses.length > 0) {
            headers['to'] = toAddresses.join(', ');
        }
        if (ccAddresses.length > 0) {
            headers['cc'] = ccAddresses.join(', ');
        }
        if (bccAddresses.length > 0) {
            headers['bcc'] = bccAddresses.join(', ');
        }
        if (rtAddresses.length > 0) {
            headers['reply-to'] = rtAddresses.join(', ');
        }
    }
    if (msg.irt) {
        headers['in-reply-to'] = msg.irt._content;
    }
    if (msg.su) {
        headers['subject'] = msg.su._content;
    }
    if (msg.header) {
        msg.header.forEach(function(header) {
            headers[header.name] = header._content;
        });
    }
    return headers;
};

OpenPGPSecureSender.getReceivers = function(msg) {
    var addr = OpenPGPUtils.getDefaultSenderAddress();
    var receivers = [addr.getAddress()];
    var types = [AjxEmailAddress.TO, AjxEmailAddress.CC, AjxEmailAddress.BCC];
    types.forEach(function(type) {
        var addrs = msg.getAddresses(type).getArray();
        addrs.forEach(function(addr) {
            receivers.push(addr.getAddress());
        });
    });
    return receivers;
};
