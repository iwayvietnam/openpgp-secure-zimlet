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

OpenPGPUtils = function() {};

OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE = 'multipart/signed';
OpenPGPUtils.ENCRYPTED_MESSAGE_CONTENT_TYPE = 'multipart/encrypted';

OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE = 'application/pgp-signature';
OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE = 'application/pgp-encrypted';
OpenPGPUtils.OPENPGP_KEYS_CONTENT_TYPE = 'application/pgp-keys';

OpenPGPUtils.OPENPGP_CONTENT_TYPES = [
    OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE,
    OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE,
    OpenPGPUtils.OPENPGP_KEYS_CONTENT_TYPE
];

OpenPGPUtils.OPENPGP_MESSAGE_HEADER = 'BEGIN PGP MESSAGE';
OpenPGPUtils.OPENPGP_SIGNATURE_HEADER = 'BEGIN PGP SIGNATURE'
OpenPGPUtils.OPENPGP_SIGNED_MESSAGE_HEADER = 'BEGIN PGP SIGNED MESSAGE';
OpenPGPUtils.OPENPGP_PRIVATE_KEY_HEADER = 'BEGIN PGP PRIVATE KEY BLOCK';
OpenPGPUtils.OPENPGP_PUBLIC_KEY_HEADER = 'BEGIN PGP PUBLIC KEY BLOCK';


OpenPGPUtils.OPENPGP_MESSAGE_HEADERS = [
    OpenPGPUtils.OPENPGP_MESSAGE_HEADER,
    OpenPGPUtils.OPENPGP_SIGNATURE_HEADER,
    OpenPGPUtils.OPENPGP_SIGNED_MESSAGE_HEADER,
    OpenPGPUtils.OPENPGP_PRIVATE_KEY_HEADER,
    OpenPGPUtils.OPENPGP_PUBLIC_KEY_HEADER,
];

OpenPGPUtils.AMORED_HEADER_REG = /^-----BEGIN PGP (MESSAGE, PART \d+\/\d+|MESSAGE, PART \d+|SIGNED MESSAGE|MESSAGE|PUBLIC KEY BLOCK|PRIVATE KEY BLOCK|SIGNATURE)-----$\n/m;

/**
 * Determine content type is openpgp signed message.
 */
OpenPGPUtils.isSignedMessage = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE], cType) !== -1;
};

/**
 * Determine content type is openpgp ecnrypted message.
 */
OpenPGPUtils.isEncryptedMessage = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.ENCRYPTED_MESSAGE_CONTENT_TYPE], cType) !== -1;
};

/**
 * Determine zimbra mail message has openpgp signature content type.
 */
OpenPGPUtils.hasSignatureContentType = function(msg) {
    return msg.hasContentType(OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE);
};

/**
 * Determine zimbra mail message has openpgp encrypted content type.
 */
OpenPGPUtils.hasEncryptedContentType = function(msg) {
    return msg.hasContentType(OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE);
};

/**
 * Determine zimbra mail message has openpgp content type.
 */
OpenPGPUtils.hasOPENPGPContentType = function(msg) {
    var has = false;
    OpenPGPUtils.OPENPGP_CONTENT_TYPES.forEach(function(ct) {
        has = msg.hasContentType(ct);
        if (has) {
            return;
        }
    });
    return has;
};

/**
 * Determine content type is openpgp content type.
 */
OpenPGPUtils.isPGPContentType = function(cType) {
    return AjxUtil.indexOf(OpenPGPUtils.OPENPGP_CONTENT_TYPES, cType) !== -1;
};

/**
 * Determine content type is openpgp signature content type.
 */
OpenPGPUtils.isSignatureContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE], cType) !== -1;
};

/**
 * Determine content type is openpgp encrypted content type.
 */
OpenPGPUtils.isEncryptedContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE], cType) !== -1;
};

/**
 * Determine content type is openpgp key content type.
 */
OpenPGPUtils.isPGPKeysContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_KEYS_CONTENT_TYPE], cType) !== -1;
};

/**
 * Determine content is inline openpgp message.
 */
OpenPGPUtils.hasInlinePGPContent = function(content, header) {
    if (AjxUtil.indexOf(OpenPGPUtils.OPENPGP_MESSAGE_HEADERS, header) !== -1) {
        return content.indexOf(header) > 0;
    }
    else {
        for (var i = 0; i < OpenPGPUtils.OPENPGP_MESSAGE_HEADERS.length; i++) {
            var header = OpenPGPUtils.OPENPGP_MESSAGE_HEADERS[i];
            if (content.indexOf(header) > 0) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Determine content is armored.
 */
OpenPGPUtils.isArmored = function(content) {
    var header = content.replace(/[\t\r ]+\n/g, '\n').match(OpenPGPUtils.AMORED_HEADER_REG);
    if (!header) {
        return false;
    }
    return true;
};

/**
 * Determine content disposition attachment.
 */
OpenPGPUtils.isAttachment = function(cd) {
    return cd.indexOf('attachment') >=0 || (cd.indexOf('inline') >=0 && cd.indexOf('filename') > 0);
};

/**
 * Determine content is html.
 */
OpenPGPUtils.isHtml = function(str) {
    return /<[a-z][\s\S]*>/i.test(str);
};

/**
 * Encrypt and save data to browser's local storage.
 */
OpenPGPUtils.localStorageSave = function(key, pwd, data) {
    var opts = {
        data: data,
        passwords: [pwd]
    };
    return openpgp.encrypt(opts).then(function(encrypted) {
        localStorage[key] = encrypted.data;
        return encrypted.data;
    });
};

/**
 * Read data from browser's local storage and decrypt.
 */
OpenPGPUtils.localStorageRead = function(key, pwd) {
    var sequence = Promise.resolve();
    return sequence.then(function() {
        if (localStorage[key]) {
            var encrypted = localStorage[key];
            var opts = {
                message: openpgp.message.readArmored(encrypted),
                password: pwd
            };
            return openpgp.decrypt(opts).then(function(plaintext) {
                return plaintext.data;
            });
        }
        else {
            return false;
        }
    });
};

/*
 * Encodes input into base64
 *
 * @param {String|Uint8Array} data Data to be encoded into base64
 */
OpenPGPUtils.base64Encode = function(data) {
    var codec = window['emailjs-mime-codec'];
    return codec.base64.encode(data);
};

/*
 * Decodes base64 encoded string into an unicode string
 *
 * @param {String} data Base64 encoded data
 */
OpenPGPUtils.base64Decode = function(base64) {
    var codec = window['emailjs-mime-codec'];
    return codec.base64.decode(base64, 'string');
};

/*
 * Decodes base64 encoded string into an array
 *
 * @param {String} data Base64 encoded data
 */
OpenPGPUtils.base64ToBin = function(base64) {
    var codec = window['emailjs-mime-codec'];
    return codec.base64.decode(base64);
};

/*
 * Convert string into an array
 */
OpenPGPUtils.stringToBin = function(string){
    var codec = window['emailjs-mime-codec'];
    return codec.toTypedArray(string);
}

/*
 * Convert an array into string
 */
OpenPGPUtils.binToString = function(buf){
    var codec = window['emailjs-mime-codec'];
    return codec.fromTypedArray(buf);
}

/*
 * Decode a utf-8 array
 */
OpenPGPUtils.utf8Decode = function(buf){
    var codec = window['emailjs-mime-codec'];
    return codec.charset.decode(buf, 'utf-8');
}

/**
 * Fetch part content of a message.
 */
OpenPGPUtils.fetchPart = function(part, baseUrl) {
    var url, cType, cDisposition, iType;
    var addTimestamp = true;

    if (part.id) {
        url = [baseUrl, '&id=', part.id].join('');
    } else if (part.mid && part.part) {
        url = [baseUrl, '&id=', part.mid, '&part=', part.part].join('');
    } else if (part.path) {
        url = [baseUrl.replace(/\?.*/,''), part.path].join('');
        addTimestamp = false;
    } else {
        OpenPGPZimbraSecure.popupErrorDialog('attach-convert-error');
    }

    if (url) {
        var rpcReq = new AjxRpcRequest();

        if (addTimestamp) {
            //add a timestamp param so that browser will not cache the request
            url += '&timestamp=' + new Date().getTime();
        }
        var response = rpcReq.invoke('', url, { 'X-Zimbra-Encoding': 'x-base64' }, null, true);
        cType = rpcReq.__httpReq.getResponseHeader('Content-Type');
        cDisposition = rpcReq.__httpReq.getResponseHeader('Content-Disposition');

        iType = rpcReq.__httpReq.getResponseHeader('X-Zimbra-ItemType');
        if (iType == 'document' && !cDisposition) {
            var iName = rpcReq.__httpReq.getResponseHeader('X-Zimbra-ItemName');
            if (iName) {
                cDisposition = 'attachment; filename="' + iName + '"';
            }
        }

        if (response.success) {
            var codec = window['emailjs-mime-codec'];
            return {
                data: codec.base64.decode(response.text),
                ct: cType,
                cd: cDisposition,
                cte: 'base64'
            };
        }
    }
};

/**
 * Visit recursion parent of an object.
 */
OpenPGPUtils.visitParent = function(parent, callback) {
    callback(parent);
    if (parent.parent) {
        OpenPGPUtils.visitParent(parent.parent, callback);
    }
};

/**
 * Visit mime part and its child mime part.
 */
OpenPGPUtils.visitMimePart = function(part, callback) {
    callback(part);
    if (part.mp) {
        part.mp.forEach(function(mp) {
            OpenPGPUtils.visitMimePart(mp, callback);
        });
    }
};

/**
 * Visit emailjs mime node and its child nodes.
 */
OpenPGPUtils.visitMimeNode = function(node, callback) {
    callback(node);
    if (Array.isArray(node._childNodes)) {
        node._childNodes.forEach(function(childNode) {
            OpenPGPUtils.visitMimeNode(childNode, callback);
        });
    }
};

/**
 * Build mime part from emailjs mime node.
 */
OpenPGPUtils.mimeNodeToZmMimePart = function(node, withAttachment) {
    var deep = 0;
    withAttachment = withAttachment | false;

    function buildZmMimePart(node) {
        deep++;
        var cd = (node.headers['content-disposition']) ? node.headers['content-disposition'][0] : false;
        var isAttach = cd ? OpenPGPUtils.isAttachment(cd.initial) : false;
        if (!withAttachment && isAttach) {
            deep--;
            return false;
        }

        var part = {};
        var ct = node.contentType;
        part.ct = ct.value;
        if (node.path.length == 0) {
            part.part = 'TEXT';
        }
        else {
            part.part = node.path.join('.');
        }
        if (node.content) {
            var content = '';
            if (part.ct === ZmMimeTable.TEXT_HTML || part.ct === ZmMimeTable.TEXT_PLAIN) {
                content = OpenPGPUtils.utf8Decode(node.content);
                DOMPurify.addHook('uponSanitizeAttribute', function(node, data) {
                    if (data.attrName == 'src' && data.attrValue.indexOf('cid:') >= 0) {
                        node.setAttribute('pnsrc', data.attrValue);
                    }
                });
                var config = {
                    ADD_ATTR: ['pnsrc', 'data-mce-src']
                };
                part.content = DOMPurify.sanitize(content, config);
                DOMPurify.removeHook('uponSanitizeAttribute');
            }
            else {
                content = OpenPGPUtils.binToString(node.content);
            }
            part.s = content.length;
        }
        if (cd.params && cd.params.filename) {
            part.filename = cd.params.filename;
        }
        else if (ct.params && ct.params.name) {
            part.filename = ct.params.name;
        }
        if (cd) {
            part.cd = cd.value;
        }
        if (Array.isArray(node._childNodes)) {
            part.mp = [];
            node._childNodes.forEach(function(childNode) {
                var mp = buildZmMimePart(childNode);
                if (mp) {
                    part.mp.push(mp);
                }
            });
        }
        deep--;
        return part;
    }

    var mimePart = buildZmMimePart(node);
    if (!OpenPGPUtils.findBody(ZmMimeTable.TEXT_HTML, mimePart))
        OpenPGPUtils.findBody(ZmMimeTable.TEXT_PLAIN, mimePart);

    return mimePart;
};

/**
 * Find body mime part.
 */
OpenPGPUtils.findBody = function(cType, part) {
    var bodyFound = false;
    if (part.mp) {
        bodyFound = OpenPGPUtils.findBody(cType, part.mp);
    } else if (part.ct) {
        if (part.ct == cType) {
            part.body = bodyFound = true;
        } else if (part.cd == 'inline') {
            part.body = true;
        }
    } else {
        for (var i = 0; !bodyFound && i < part.length; i++) {
            bodyFound = OpenPGPUtils.findBody(cType, part[i]);
        }
    }
    return bodyFound;
};

/**
 * Get default sender email address.
 */
OpenPGPUtils.getDefaultSenderAddress = function() {
    var account = (appCtxt.accountList.defaultAccount ||
                   appCtxt.accountList.activeAccount ||
                   appCtxt.accountList.mainAccount);
    var identity = appCtxt.getIdentityCollection(account).defaultIdentity;

    return new AjxEmailAddress(identity.sendFromAddress, AjxEmailAddress.FROM, identity.sendFromDisplay);
};

/**
 * Get message from zimlet.
 */
OpenPGPUtils.getMessage = function(key) {
    return OpenPGPZimbraSecure.getInstance().getMessage(key);
};

/**
 * Save text data as download.
 */
OpenPGPUtils.saveTextAs = function(text, name) {
    var blob = new Blob([text], {type: ZmMimeTable.TEXT_PLAIN + '; charset=utf-8'});
    saveAs(blob, name);
};

/**
 * Save data as download.
 */
OpenPGPUtils.saveAs = function(data, name, type) {
    if (typeof data === 'string') {
        data = openpgp.util.str2Uint8Array(data);
    }
    var blob = new Blob([data], {type: type});
    saveAs(blob, name);
};

/**
 * Render template.
 */
OpenPGPUtils.renderTemplate = function(templateId, data) {
    return AjxTemplate.expand(OpenPGPZimbraSecure.NAME + '#' + templateId, data);
};

/**
 * Build base rest url of current account.
 *
 * @param {String} object Rest object
 * @param {hash} params Set of query string names and values
 */
OpenPGPUtils.restUrl = function(object, params) {
    return AjxUtil.formatUrl({
        host: location.hostname,
        path: '/home/' + appCtxt.getActiveAccount().name + '/' + object,
        qsReset: true,
        qsArgs: params
    });
};

/*
 * random string
 * https://github.com/valiton/node-random-string
 *
 * Copyright (c) 2013 Valiton GmbH, Bastian 'hereandnow' Behrens
 * Licensed under the MIT license.
 */
OpenPGPUtils.randomString = function(opts) {
    var numbers = '0123456789',
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        specials = '!$%^&*()_+|~-=`{}[]:;<>?,./';

    function _defaults(opts) {
        opts || (opts = {});
        return {
            length: opts.length || 32,
            numeric: typeof opts.numeric === 'boolean' ? opts.numeric : true,
            letters: typeof opts.letters === 'boolean' ? opts.letters : true,
            special: typeof opts.special === 'boolean' ? opts.special : false
        };
    }

    function _buildChars(opts) {
        var chars = '';
        if (opts.numeric) { chars += numbers; }
        if (opts.letters) { chars += letters; }
        if (opts.special) { chars += specials; }
        return chars;
    }

    opts = _defaults(opts);
    var i, rn,
        rnd = '',
        len = opts.length,
        randomChars = _buildChars(opts);
    for (i = 1; i <= len; i++) {
        rnd += randomChars.substring(rn = Math.floor(Math.random() * randomChars.length), rn + 1);
    }
    return rnd;
};
