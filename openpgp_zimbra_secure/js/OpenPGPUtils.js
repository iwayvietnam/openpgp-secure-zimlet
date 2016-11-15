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

OpenPGPUtils = function() {};

OpenPGPUtils.BASE64_TABLE_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
OpenPGPUtils.BASE64_TABLE = OpenPGPUtils.BASE64_TABLE_STRING.split("");

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

OpenPGPUtils.isSignedMessage = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE], cType) !== -1;
};

OpenPGPUtils.isEncryptedMessage = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.ENCRYPTED_MESSAGE_CONTENT_TYPE], cType) !== -1;
};

OpenPGPUtils.hasSignatureContentType = function(msg) {
    return msg.hasContentType(OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE);
};

OpenPGPUtils.hasEncryptedContentType = function(msg) {
    return msg.hasContentType(OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE);
};

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

OpenPGPUtils.isOPENPGPContentType = function(cType) {
    return AjxUtil.indexOf(OpenPGPUtils.OPENPGP_CONTENT_TYPES, cType) !== -1;
};

OpenPGPUtils.isSignatureContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE], cType) !== -1;
};

OpenPGPUtils.isEncryptedContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE], cType) !== -1;
};

OpenPGPUtils.isPGPKeysContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_KEYS_CONTENT_TYPE], cType) !== -1;
};

OpenPGPUtils.localStorageSave = function(key, pwd, data) {
    var opts = {
        data: data,
        passwords: [pwd]
    };
    return openpgp.encrypt(opts).then(function(encrypted) {
        localStorage[key] = encrypted.data;
        return encrypted.data;
    });
}

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
}

/*
 * base64 encode
 * https://github.com/open-eid/hwcrypto.js
 *
 * Copyright (c) 2015 Martin Paljak, Estonian Information System Authority
 * Licensed under the MIT license.
 */
OpenPGPUtils.base64Encode = function(bin) {
    if (!window.btoa) {
        for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
          var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
          if ((a | b | c) > 255) throw new Error("String contains an invalid character");
          base64[base64.length] = OpenPGPUtils.BASE64_TABLE[a >> 2] + OpenPGPUtils.BASE64_TABLE[((a << 4) & 63) | (b >> 4)] +
                                  (isNaN(b) ? "=" : OpenPGPUtils.BASE64_TABLE[((b << 2) & 63) | (c >> 6)]) +
                                  (isNaN(b + c) ? "=" : OpenPGPUtils.BASE64_TABLE[c & 63]);
        }
        return base64.join("");
    }
    else {
        return window.btoa(bin);
    }
};

/*
 * base64 decode
 * https://github.com/open-eid/hwcrypto.js
 *
 * Copyright (c) 2015 Martin Paljak, Estonian Information System Authority
 * Licensed under the MIT license.
 */
OpenPGPUtils.base64Decode = function(base64) {
    if (!window.atob) {
        if (/(=[^=]+|={3,})$/.test(base64)) throw new Error("String contains an invalid character");
        base64 = base64.replace(/=/g, "");
        var n = base64.length & 3;
        if (n === 1) throw new Error("String contains an invalid character");
        for (var i = 0, j = 0, len = base64.length / 4, bin = []; i < len; ++i) {
            var a = OpenPGPUtils.BASE64_TABLE_STRING.indexOf(base64[j++] || "A"), b = OpenPGPUtils.BASE64_TABLE_STRING.indexOf(base64[j++] || "A");
            var c = OpenPGPUtils.BASE64_TABLE_STRING.indexOf(base64[j++] || "A"), d = OpenPGPUtils.BASE64_TABLE_STRING.indexOf(base64[j++] || "A");
            if ((a | b | c | d) < 0) throw new Error("String contains an invalid character");
            bin[bin.length] = ((a << 2) | (b >> 4)) & 255;
            bin[bin.length] = ((b << 4) | (c >> 2)) & 255;
            bin[bin.length] = ((c << 6) | d) & 255;
        };
        return String.fromCharCode.apply(null, bin).substr(0, bin.length + n - 4);
    }
    else {
        return window.atob(base64);
    }
};

/*
 * hex to base64
 * https://github.com/open-eid/hwcrypto.js
 *
 * Copyright (c) 2015 Martin Paljak, Estonian Information System Authority
 * Licensed under the MIT license.
 */
OpenPGPUtils.hexToBase64 = function(hex) {
    return OpenPGPUtils.base64Encode(String.fromCharCode.apply(null,
        hex.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
    );
};

/*
 * hex to bin
 */
OpenPGPUtils.hexToBin = function(hex) {
    var chars = [];
    var hexLength = hex.length;

    for(var i = 0; i < hexLength - 1; i += 2) {
        var charCode = parseInt(hex.substr(i, 2), 16);
        chars.push(charCode);
    }
    return String.fromCharCode.apply(String, chars);;
};

/*
 * string to bin
 * http://pkijs.org/
 *
 * Copyright (c) 2014, GMO GlobalSign
 * Licensed under the BSD-3-Clause license.
 */
OpenPGPUtils.stringToBin = function(string){
      var length = string.length;

      var resultBuffer = new ArrayBuffer(length);
      var resultView = new Uint8Array(resultBuffer);

      for(var i = 0; i < length; i++) {
          resultView[i] = string.charCodeAt(i);
      }

      return resultBuffer;
  }


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
            url += "&timestamp=" + new Date().getTime();
        }
        var response = rpcReq.invoke('', url,
                                     { 'X-Zimbra-Encoding': 'x-base64' },
                                     null, true);
        cType = rpcReq.__httpReq.getResponseHeader('Content-Type');
        cDisposition = rpcReq.__httpReq.getResponseHeader('Content-Disposition');

        iType = rpcReq.__httpReq.getResponseHeader('X-Zimbra-ItemType');
        if (iType == 'message') {
            //this is a attached message
            cDisposition = 'attachment';
            //now set the file name for this attachment.
            var m =  appCtxt.cacheGet(part.id); //get the attached message from cache
            if (m && m.subject) {
                cDisposition = 'attachment; filename="' + m.subject + '"';
            }
        }
        if (iType == 'document' && !cDisposition) {
            var iName = rpcReq.__httpReq.getResponseHeader('X-Zimbra-ItemName');
            if (iName) {
                cDisposition = 'attachment; filename="' + iName + '"';
            }
        }

        if (response.success) {
            return { data: response.text, ct: cType, cd: cDisposition};
        }
    }
};

OpenPGPUtils.visitMessage = function(message, callback) {
    callback(message);
    if (Array.isArray(message._body)) {
        message._body.forEach(function(entity) {
            OpenPGPUtils.visitMessage(entity, callback);
        });
    }
};

OpenPGPUtils.mimeMessageToZmMimePart = function(message, withAttachment) {
    var deep = 0;
    var partIndexes = [];
    withAttachment = withAttachment | false;

    function buildZmMimePart(message) {
        deep++;
        var cd = message.header('Content-Disposition');
        if (!withAttachment && cd === 'attachment') {
            deep--;
            return false;
        }

        var part = {};
        var cType = message.contentType();
        part.ct = cType.fulltype;
        if (partIndexes.length == 0) {
            part.part = 'TEXT';
        }
        else {
            part.part = partIndexes.join('.');
        }
        if (typeof message._body === 'string') {
            var content = '';
            var encode = message.header('Content-Transfer-Encoding');
            if (encode === 'quoted-printable') {
                content = utf8.decode(quotedPrintable.decode(message._body));
            }
            else {
                content = message._body;
            }
            if (part.ct == 'text/html' || part.ct == 'text/plain') {
                part.content = content;
            }
            if (encode === 'base64') {
                part.s = OpenPGPUtils.base64Decode(message._body).length;
            }
            else {
                part.s = content.length;
            }
        }
        if (cType.params.name) {
            part.filename = cType.params.name;
        }
        if (cd) {
            part.cd = cd;
        }
        if (Array.isArray(message._body)) {
            part.mp = [];
            message._body.forEach(function(entity, index) {
                partIndexes[deep - 1] = index + 1;
                var mp = buildZmMimePart(entity);
                if (mp) {
                    part.mp.push(mp);
                }
            });
        }
        deep--;
        partIndexes.pop();
        return part;
    }

    function findBody(cType, part) {
        var bodyFound = false;
        if (part.mp) {
            bodyFound = findBody(cType, part.mp);
        } else if (part.ct) {
            if (part.ct == cType) {
                part.body = bodyFound = true;
            } else if (part.cd == 'inline') {
                part.body = true;
            }
        } else {
            for (var i = 0; !bodyFound && i < part.length; i++) {
                bodyFound = findBody(cType, part[i]);
            }
        }
        return bodyFound;
    }

    var mimePart = buildZmMimePart(message);
    if (!findBody('text/html', mimePart))
        findBody('text/plain', mimePart);

    return mimePart;
};

OpenPGPUtils.getDefaultSenderAddress = function() {
    var account = (appCtxt.accountList.defaultAccount ||
                   appCtxt.accountList.activeAccount ||
                   appCtxt.accountList.mainAccount);
    var identity = appCtxt.getIdentityCollection(account).defaultIdentity;

    return new AjxEmailAddress(identity.sendFromAddress, AjxEmailAddress.FROM, identity.sendFromDisplay);
};

OpenPGPUtils.prop = function(key) {
    return openpgp_zimbra_secure[key];
};

OpenPGPUtils.saveAs = function(data, name, type) {
    data = OpenPGPUtils.base64Decode(data);
    if (type.indexOf('text/html') >= 0 || type.indexOf('text/plain') >= 0) {
        saveTextAs(data, name);
    }
    else {
        if (typeof data === 'string') {
            data = OpenPGPUtils.stringToBin(data);
        }
        var blob = new Blob([data], {type: type});
        saveAs(blob, name);
    }
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
