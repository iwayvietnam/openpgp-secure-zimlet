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

OpenPGPSecureKeyStore = function(handler) {
    this._handler = handler;
    this._fingerprints = [];
    this._addCallbacks = [];
    this._removeCallbacks = [];
    this._userId = this._handler.getUserID();

    this.passphrase = '';
    this.privateKey = false;
    this.publicKeys = [];
};

OpenPGPSecureKeyStore.ADD_CALLBACK = 'add';
OpenPGPSecureKeyStore.REMOVE_CALLBACK = 'remove';

OpenPGPSecureKeyStore.prototype = new Object();
OpenPGPSecureKeyStore.prototype.constructor = OpenPGPSecureKeyStore;

OpenPGPSecureKeyStore.prototype.init = function() {
    var self = this;

    var sequence = Promise.resolve();
    return sequence.then(function() {
        return self.setPublicKeys(self._readPublicKeys());
    })
    .then(function() {
        return OpenPGPUtils.localStorageRead(
            'openpgp_secure_passphrase_' + self._userId,
            self._handler.getSecurePassword()
        )
        .then(function(passphrase) {
            return passphrase;
        });
    })
    .then(function(passphrase) {
        if (passphrase) {
            return OpenPGPUtils.localStorageRead(
                'openpgp_secure_private_key_' + self._userId,
                self._handler.getSecurePassword()
            )
            .then(function(privateKey) {
                if (privateKey) {
                    var privKey = openpgp.key.readArmored(privateKey);
                    privKey.keys.forEach(function(key) {
                        if (key.decrypt(passphrase)) {
                            self.privateKey = key;
                            self.passphrase = passphrase;
                        }
                        else {
                            throw new Error(self._handler.getMessage('decryptPrivateKeyError'));
                        }
                    });
                }
                return self.privateKey;
            });
        }
        else {
            return self.privateKey;
        }
    })
    .then(function(privateKey) {
        if (privateKey) {
            self.addPublicKey(privateKey.toPublic());
        }
    });
};

OpenPGPSecureKeyStore.prototype.addPublicKey = function(key) {
    if (key.isPublic()) {
        var self = this;
        var added = false;

        var fingerprint = key.primaryKey.fingerprint;
        if (!self._fingerprints[fingerprint]) {
            self._fingerprints[fingerprint] = fingerprint;
            self.publicKeys.push(key);
            added = true;
        }

        if (added) {
            this._addCallbacks.forEach(function(callback) {
                callback.run(key);
            });
            this._storePublicKeys();
        }
    }
};

OpenPGPSecureKeyStore.prototype.removePublicKey = function(fingerprint) {
    var self = this;
    var removed = false;
    this.publicKeys.forEach(function(key, index) {
        if (fingerprint == key.primaryKey.fingerprint) {
            self.publicKeys.splice(index, 1);
            delete self._fingerprints[fingerprint];
            removed = true;
        }
    });

    if (removed) {
        this._removeCallbacks.forEach(function(callback) {
            callback.run(fingerprint);
        });
        this._storePublicKeys();
    }
};

OpenPGPSecureKeyStore.prototype.addCallback = function(callback, type) {
    if (type === OpenPGPSecureKeyStore.REMOVE_CALLBACK) {
        this._removeCallbacks.push(callback);
    }
    else {
        this._addCallbacks.push(callback);
    }
};

OpenPGPSecureKeyStore.prototype.getPassphrase = function() {
    return this.passphrase;
};

OpenPGPSecureKeyStore.prototype.getPrivateKey = function() {
    return this.privateKey;
};

OpenPGPSecureKeyStore.prototype.setPrivateKey = function(privateKey, passphrase) {
    var self = this;
    var privKey = openpgp.key.readArmored(privateKey);
    privKey.keys.forEach(function(key) {
        if (key.decrypt(passphrase)) {
            self.privateKey = key;
            self.passphrase = passphrase;
            self.addPublicKey(key.toPublic());

            OpenPGPUtils.localStorageSave(
                'openpgp_secure_private_key_' + self._userId,
                self._handler.getSecurePassword(),
                privateKey
            );
            OpenPGPUtils.localStorageSave(
                'openpgp_secure_passphrase_' + self._userId,
                self._handler.getSecurePassword(),
                passphrase
            );
        }
        else {
            throw new Error(this._handler.getMessage('decryptPrivateKeyError'));
        }
    });
    return this;
};

OpenPGPSecureKeyStore.prototype.getPublicKey = function() {
    return this.privateKey ? this.privateKey.toPublic() : false;
};

OpenPGPSecureKeyStore.prototype.getPublicKeys = function() {
    return this.publicKeys;
};

OpenPGPSecureKeyStore.prototype.setPublicKeys = function(publicKeys) {
    var self = this;
    publicKeys.forEach(function(armoredKey) {
        var pubKey = openpgp.key.readArmored(armoredKey);
        pubKey.keys.forEach(function(key) {
            var fingerprint = key.primaryKey.fingerprint;
            if (!self._fingerprints[fingerprint]) {
                self.publicKeys.push(key);
                self._fingerprints[fingerprint] = fingerprint;
            }
        });
    });
    return this;
};

OpenPGPSecureKeyStore.prototype.havingPublicKeys = function(addresses) {
    var dupes = [];
    var publicKeys = [];
    this.publicKeys.forEach(function(key) {
        addresses.forEach(function(address) {
            for (i = 0; i < key.users.length; i++) {
                var uid = key.users[i].userId.userid;
                var fingerprint = key.primaryKey.fingerprint;
                if (uid.indexOf(address) >= 0 && !dupes[fingerprint + uid]) {
                    publicKeys.push(key);
                    dupes[fingerprint + uid] = fingerprint + uid;
                }
            }
        });
    });
    return publicKeys;
};

OpenPGPSecureKeyStore.prototype.publicKeyMissing = function(addresses) {
    var uidAddresses = [];
    this.publicKeys.forEach(function(key) {
        for (i = 0; i < key.users.length; i++) {
            var addr = AjxEmailAddress.parse(key.users[i].userId.userid);
            if (addr) {
                uidAddresses[addr.getAddress()] = addr.getAddress();
            }
        }
    });

    var missing = [];
    addresses.forEach(function(address) {
        if (!uidAddresses[address]) {
            missing.push(address);
        }
    });
    return missing;
};

OpenPGPSecureKeyStore.prototype.publicKeyExisted = function(fingerprint) {
    return this._fingerprints[fingerprint] ? true : false;
};

OpenPGPSecureKeyStore.prototype.exportPublicKeys = function() {
    var packetlist = new openpgp.packet.List();
    this.publicKeys.forEach(function(key) {
        packetlist.read(key.toPacketlist().write());
    });
    return openpgp.armor.encode(openpgp.enums.armor.public_key, packetlist.write());
};

OpenPGPSecureKeyStore.keyInfo = function(key) {
    var uids = [];
    var userIds = key.getUserIds();
    if (userIds) {
        userIds.forEach(function(uid) {
            uids.push(AjxStringUtil.htmlEncode(uid));
        });
    }

    var priKey = key.primaryKey;
    var keyLength = '';
    if (priKey.mpi.length > 0) {
        keyLength = (priKey.mpi[0].byteLength() * 8);
    }
    return {
        value: key.armor(),
        uids: uids,
        fingerprint: priKey.fingerprint,
        keyid: priKey.getKeyId().toHex(),
        algorithm: priKey.algorithm,
        keyLength: keyLength,
        created: priKey.created
    };
};

OpenPGPSecureKeyStore.prototype._readPublicKeys = function() {
    var publicKeys = [];
    var storeKey = 'openpgp_secure_public_keys_' + this._userId;
    if (localStorage[storeKey]) {
        publicKeys = JSON.parse(localStorage[storeKey]);
    }
    return publicKeys;
};

OpenPGPSecureKeyStore.prototype._storePublicKeys = function() {
    var publicKeys = [];
    this.publicKeys.forEach(function(key) {
        publicKeys.push(key.armor());
    });
    var storeKey = 'openpgp_secure_public_keys_' + this._userId;
    localStorage[storeKey] = JSON.stringify(publicKeys);
};
