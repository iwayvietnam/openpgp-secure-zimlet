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

OpenPGPUtils.isSignedMessage = function(msg) {
    if (msg.hasContentType(OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE)) {
        return true;
    }
    else {
        return OpenPGPUtils.hasSignatureContentType(msg);
    }
};

OpenPGPUtils.isEncryptedMessage = function(msg) {
    if (msg.hasContentType(OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE)) {
        return true;
    }
    else {
        return OpenPGPUtils.hasEncryptedContentType(msg);
    }
};

OpenPGPUtils.hasSignatureContentType = function(msg) {
    return msg.hasContentType(OpenPGPUtils.OPENPGP_SIGNATURE_CONTENT_TYPE);
};

OpenPGPUtils.hasEncryptedContentType = function(msg) {
    return msg.hasContentType(OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE);
};

OpenPGPUtils.hasOPENPGPContentType = function(msg) {
    var has = false;
    OpenPGPUtils.forEach(OpenPGPUtils.OPENPGP_CONTENT_TYPES, function(ct) {
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

OpenPGPUtils.isSignedContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.SIGNED_MESSAGE_CONTENT_TYPE], cType) !== -1;
};

OpenPGPUtils.isEncryptedContentType = function(cType) {
    return AjxUtil.indexOf([OpenPGPUtils.OPENPGP_ENCRYPTED_CONTENT_TYPE], cType) !== -1;
};

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

OpenPGPUtils.hexToBase64 = function(hex) {
    return OpenPGPUtils.base64Encode(String.fromCharCode.apply(null,
        hex.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
    );
};

OpenPGPUtils.hexToBin = function(hex) {
    var bytes = [];

    for(var i = 0; i < hex.length - 1; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return String.fromCharCode.apply(String, bytes);;
};

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
        var rpcreq = new AjxRpcRequest();

        if (addTimestamp) {
            //add a timestamp param so that browser will not cache the request
            url += "&timestamp=" + new Date().getTime();
        }
        var response = rpcreq.invoke('', url,
                                     { 'X-Zimbra-Encoding': 'x-base64' },
                                     null, true);
        cType = rpcreq.__httpReq.getResponseHeader('Content-Type');
        cDisposition= rpcreq.__httpReq.getResponseHeader('Content-Disposition');

        iType = rpcreq.__httpReq.getResponseHeader('X-Zimbra-ItemType');
        if (iType == 'message') {
            //this is a attached message
            cDisposition = 'attachment; ';
            //now set the file name for this attachment.
            var m =  appCtxt.cacheGet(part.id); //get the attached message from cache
            if (m && m.subject) {
                cDisposition += 'filename="' + m.subject + '"';
            }
        }
        if (iType == 'document' && !cDisposition) {
            var iname = rpcreq.__httpReq.getResponseHeader('X-Zimbra-ItemName');
            if (iname) {
                cDisposition = 'attachment; filename="' + iname + '"';
            }
        }

        if (response.success) {
            return { data: response.text, ct: cType, cd: cDisposition};
        }
    }
};

OpenPGPUtils.getDefaultSenderAddress = function() {
    var account = (appCtxt.accountList.defaultAccount ||
                   appCtxt.accountList.activeAccount ||
                   appCtxt.accountList.mainAccount);
    var identity = appCtxt.getIdentityCollection(account).defaultIdentity;

    return new AjxEmailAddress(identity.sendFromAddress, AjxEmailAddress.FROM, identity.sendFromDisplay);
};

OpenPGPUtils.forEach = function(obj, iteratee) {
    for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
    }
};

OpenPGPUtils.prop = function(key) {
    return openpgp_zimbra_secure[key];
};

/*
 * random-string
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
