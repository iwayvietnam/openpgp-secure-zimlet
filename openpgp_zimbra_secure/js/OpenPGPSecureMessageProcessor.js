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
 * Message processor constructor.
 */
OpenPGPSecureMessageProcessor = function(handler, callback, csfeResult) {
    this._handler = handler;
    this._callback = callback;
    this._csfeResult = csfeResult;
};

OpenPGPSecureMessageProcessor.prototype = new Object();
OpenPGPSecureMessageProcessor.prototype.constructor = OpenPGPSecureMessageProcessor;

/**
 * Processor the message.
 */
OpenPGPSecureMessageProcessor.prototype.process = function() {
    var pgpMsgs = [];
    var inlinePGPMsgs = [];
    var msgs = [];
    var response = this._csfeResult ? this._csfeResult.getResponse() : { _jsns: 'urn:zimbraMail', more: false };

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
        msg.hasPGPKey = false;
        msg.pgpKey = false;
        if (OpenPGPSecureMessageProcessor.hasInlinePGP(msg)) {
            inlinePGPMsgs.push(msg);
        }
        else if (OpenPGPSecureMessageProcessor.hasPGPPart(msg)) {
            pgpMsgs.push(msg);
        }
    });

    if (pgpMsgs.length == 0 && inlinePGPMsgs.length == 0) {
        this._callback.run(this._csfeResult);
    }
    else {
        if (pgpMsgs.length > 0) {
            this._loadPGPMessages(pgpMsgs);
        }
        if (inlinePGPMsgs.length > 0) {
            this._loadInlinePGPMessages(inlinePGPMsgs);
        }
    }
};

/**
 * Load and decrypt the given pgp messages.
 * @param {Array} pgpMsgs messages to load.
 */
OpenPGPSecureMessageProcessor.prototype._loadPGPMessages = function(pgpMsgs){
    var self = this;
    var handled = 0;
    var allLoadedCallback = new AjxCallback(function(){
        handled += 1;
        if (handled == pgpMsgs.length) {
            self._callback.run(self._csfeResult);
        }
    });

    pgpMsgs.forEach(function(msg) {
        var newCallback = new AjxCallback(self, self._decryptMessage, [allLoadedCallback, msg]);
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
OpenPGPSecureMessageProcessor.prototype._decryptMessage = function(callback, msg, response){
    var self = this;
    if (response.success) {
        var decryptor = new OpenPGPDecrypt({
            privateKey: this._handler.getKeyStore().getPrivateKey(),
            publicKeys: this._handler.getKeyStore().getAllPublicKeys(),
            onDecrypted: function(message) {
                self.onDecrypted(callback, msg, message);
            },
            onError: function(error) {
                console.log(error);
                self._onDecryptError('decrypting-error');
            }
        });
        decryptor.decrypt(OpenPGPUtils.base64Decode(response.text));
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
 * @param {Object} PGP mime message.
 */
OpenPGPSecureMessageProcessor.prototype.onDecrypted = function(callback, msg, message) {
    var self = this;
    var pgpMessage = {
        textContent: '',
        signatures: message.signatures,
        encrypted: message.encrypted,
        attachments: [],
        hasPGPKey: msg.hasPGPKey,
        pgpKey: msg.pgpKey
    };

    var codec = window['emailjs-mime-codec'];
    var parser = new window['emailjs-mime-parser']();
    parser.onbody = function(node, chunk){
        var cd = (node.headers['content-disposition']) ? node.headers['content-disposition'][0] : false;
        var cte = (node.headers['content-transfer-encoding']) ? node.headers['content-transfer-encoding'][0] : false;
        var isAttach = cd ? OpenPGPUtils.isAttachment(cd.initial) : false;
        var ct = node.contentType;
        var content = '';
        if (ct.value === ZmMimeTable.TEXT_HTML ||
            ct.value === ZmMimeTable.TEXT_PLAIN ||
            ct.value === ZmMimeTable.TEXT_XML) {
            content = OpenPGPUtils.utf8Decode(chunk);
            if (cte && cte.value == 'quoted-printable') {
                content = codec.quotedPrintableDecode(content);
            }
            pgpMessage.textContent = content;
        }
        else {
            content = openpgp.util.bin2str(chunk);
        }
        if (pgpMessage.encrypted && cd && isAttach) {
            var attachment = {
                id: OpenPGPUtils.randomString(),
                type: ct.value,
                name: 'attachment',
                size: content.length,
                content: content
            };
            if (cd.params && cd.params.filename) {
                attachment.name = cd.params.filename;
            }
            else if (ct.params && ct.params.name) {
                attachment.name = ct.params.name;
            }

            var cid = (node.headers['content-id']) ? node.headers['content-id'][0] : false;
            if (cid) {
                attachment.cid = cid.value.replace(/[<>]/g, '');
            }

            pgpMessage.attachments.push(attachment);
            self._handler._pgpAttachments[attachment.id] = attachment;
        }
        var hasPGPKey = OpenPGPUtils.isPGPKeysContentType(ct.value) || OpenPGPUtils.hasInlinePGPContent(content, OpenPGPUtils.OPENPGP_PUBLIC_KEY_HEADER);
        if (hasPGPKey) {
            pgpMessage.hasPGPKey = hasPGPKey;
            pgpMessage.pgpKey = content;
        }
    };
    parser.write(message.content);
    parser.end();

    if (pgpMessage.encrypted && pgpMessage.textContent.length > 0) {
        DOMPurify.addHook('uponSanitizeAttribute', function(node, data) {
            if (data.attrName == 'src' && data.attrValue.indexOf('cid:') >= 0) {
                node.setAttribute('pnsrc', data.attrValue);
                var cid = data.attrValue.substring(4);
                var attachment = false;
                pgpMessage.attachments.forEach(function(attach) {
                    if (!attachment && (attach.cid && attach.cid === cid)) {
                        attachment = attach;
                    };
                });

                if (attachment) {
                    var content = OpenPGPUtils.base64Encode(openpgp.util.str2Uint8Array(attachment.content));
                    data.attrValue = 'data:' + attachment.type + ';base64,' + content.replace(/\r?\n/g, '');
                }
            }
        });
        pgpMessage.textContent = DOMPurify.sanitize(pgpMessage.textContent);
        DOMPurify.removeHook('uponSanitizeAttribute');
    }

    pgpMessage.mimeNode = parser.node;
    this._handler._pgpMessageCache[msg.id] = pgpMessage;
    this._addSecurityHeader(msg, pgpMessage.signatures);

    if (pgpMessage.encrypted) {
        var mp = OpenPGPUtils.mimeNodeToZmMimePart(pgpMessage.mimeNode);
        msg.mp = [mp];
    }

    callback.run();
};

/**
 * Load and decrypt the given inline pgp messages.
 * @param {AjxCallback} callback
 * @param {?} csfeResult
 * @param {Array} inlinePGPMsgs messages to load.
 */
OpenPGPSecureMessageProcessor.prototype._loadInlinePGPMessages = function(inlinePGPMsgs){
    var self = this;
    var handled = 0;
    var allLoadedCallback = new AjxCallback(function(){
        handled += 1;
        if (handled == inlinePGPMsgs.length) {
            self._callback.run(self._csfeResult);
        }
    });

    inlinePGPMsgs.forEach(function(msg) {
        var newCallback = new AjxCallback(self, self._decryptInlineMessage, [allLoadedCallback, msg]);
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
 * Decrypt the given text of inline pgp message.
 * @param {AjxCallback} callback
 * @param {ZmMailMsg} msg
 * @param {Object} response
 */
OpenPGPSecureMessageProcessor.prototype._decryptInlineMessage = function(callback, msg, response){
    var self = this;
    if (response.success) {
        var contentPart = false;
        OpenPGPUtils.visitMimePart(msg, function(mp) {
            if (mp.body && mp.content) {
                contentPart = mp;
            }
        });
        if (contentPart) {
            if (contentPart.ct.indexOf(ZmMimeTable.TEXT_HTML) >= 0) {
                var content = AjxStringUtil.trim(AjxStringUtil.stripTags(contentPart.content));
            }
            else {
                var content = contentPart.content;
            }
            OpenPGPDecrypt.decryptContent(
                content,
                this._handler.getKeyStore().getAllPublicKeys(),
                this._handler.getKeyStore().getPrivateKey(),
                function(result) {
                    if (result.content) {
                        result.content = DOMPurify.sanitize(result.content);
                        if (contentPart.ct.indexOf(ZmMimeTable.TEXT_HTML) >= 0) {
                            contentPart.content = '<pre>' + result.content + '</pre>';
                        }
                        else {
                            contentPart.content = result.content;
                        }
                    }

                    var pgpMessage = {
                        textContent: result.content,
                        signatures: result.signatures,
                        encrypted: result.encrypted,
                        attachments: [],
                        hasPGPKey: msg.hasPGPKey,
                        pgpKey: msg.pgpKey
                    };

                    var parser = new window['emailjs-mime-parser']();
                    parser.onbody = function(node, chunk){
                        var ct = node.contentType;
                        var content = openpgp.util.bin2str(chunk);
                        var hasPGPKey = OpenPGPUtils.isPGPKeysContentType(ct.value) || OpenPGPUtils.hasInlinePGPContent(content, OpenPGPUtils.OPENPGP_PUBLIC_KEY_HEADER);
                        if (hasPGPKey) {
                            pgpMessage.hasPGPKey = hasPGPKey;
                            pgpMessage.pgpKey = content;
                        }
                    };
                    parser.write(OpenPGPUtils.base64Decode(response.text));
                    parser.end();

                    pgpMessage.mimeNode = parser.node;
                    self._handler._pgpMessageCache[msg.id] = pgpMessage;
                    self._addSecurityHeader(msg, pgpMessage.signatures);
                    callback.run();
                }
            );
        }
        else {
            callback.run();
        }
    } else {
        console.warn('Failed to get message source:');
        console.warn(response);
        callback.run();
    }
};

OpenPGPSecureMessageProcessor.prototype._onDecryptError = function(error){
    OpenPGPZimbraSecure.popupErrorDialog(error);
};

/**
 * Add security header to message.
 */
OpenPGPSecureMessageProcessor.prototype._addSecurityHeader = function(msg, signatures) {
    var self = this;
    if (signatures.length > 0 && !msg._attrs) {
        msg._attrs = {};
    }
    signatures.forEach(function(signature) {
        var userId = AjxStringUtil.htmlEncode(signature.userId);
        if (!userId) {
            userId = self._handler.getMessage('keyInfoKeyId') + ': ' + signature.keyid.toHex();
        }
        var desc = signature.valid ? AjxMessageFormat.format(self._handler.getMessage('goodSignatureFrom'), userId) : AjxMessageFormat.format(self._handler.getMessage('badSignatureFrom'), userId);

        var htmlArr = [];
        htmlArr.push(AjxMessageFormat.format('<span class="securityValue {0}">', signature.valid ? 'valid' : 'invalid'));
        htmlArr.push(AjxMessageFormat.format('<img class="OpenPGPSecureImage" align="left" src="{0}" />', self._handler.getResource(signature.valid ? 'imgs/valid.png' : 'imgs/corrupt.png')));
        htmlArr.push(desc);
        htmlArr.push('</span>');

        msg._attrs.securityHeader = htmlArr.join('');
    });
};

/**
 * Check message has pgp part.
 */
OpenPGPSecureMessageProcessor.hasPGPPart = function(part) {
    var ct = part.ct;
    if (OpenPGPUtils.isPGPContentType(ct)) {
        return true;
    }
    else if (!part.mp) {
        return false;
    }
    else {
        if (ct != ZmMimeTable.MSG_RFC822) {
            for (var i = 0; i < part.mp.length; i++) {
                if (OpenPGPSecureMessageProcessor.hasPGPPart(part.mp[i]))
                    return true;
            }
        }
    }

    return false;
};

/**
 * Check message has inline pgp part.
 */
OpenPGPSecureMessageProcessor.hasInlinePGP = function(part) {
    if (part.content) {
        var content;
        if (part.ct.indexOf(ZmMimeTable.TEXT_HTML) >= 0) {
            content = AjxStringUtil.trim(AjxStringUtil.stripTags(part.content));
        }
        else {
            content = part.content;
        }
        return OpenPGPUtils.isArmored(content);
    } else if (!part.mp) {
        return false;
    }
    else {
        for (var i = 0; i < part.mp.length; i++) {
            if (OpenPGPSecureMessageProcessor.hasInlinePGP(part.mp[i]))
                return true;
        }
    }
    return false
};
