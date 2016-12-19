# OpenPGP Secure Zimlet
 OpenPGP Secure Zimlet - Sign, verify, encrypt, and decrypt email with OpenPGP/MIME for Zimbra

Bugs and feedback: https://github.com/nguyennv/openpgp-secure-zimlet/issues

## Features
- Automatically sign/encrypt mail when sending, verify/decrypt received mail
- Support [OpenPGP/MIME](https://www.ietf.org/rfc/rfc3156.txt) on both message sending and receiving
- Support [Inline-PGP](https://www.ietf.org/rfc/rfc4880.txt) signed/encrypted received messages
- Support decrypting OpenPGP/MIME and Inline-PGP encrypted attachments
- Support GUI for easy configuration and OpenPGP key management

##Install OpenPGP Secure Zimlet
### Install from git
    [root@zimbra ~]# cd /tmp/
    [root@zimbra ~]# git clone https://github.com/nguyennv/openpgp-secure-zimlet
    [root@zimbra ~]# cd /tmp/openpgp-secure-zimlet
    [root@zimbra ~]# ./build.sh
    [root@zimbra ~]# su zimbra
    [root@zimbra ~]# zmzimletctl deploy /tmp/openpgp-secure-zimlet/openpgp_zimbra_secure.zip
    [root@zimbra ~]# zmmailboxdctl restart

## Supported environments
This zimlet has been tested with Zimbra Collaboration Open Source Edition 8.6 and 8.7. This zimlet is not available for use in Zimbra Desktop.

Platform:
- Windows: Internet Explorer 11, Google Chrome, Chromium, Mozilla Firefox
- Linux: Google Chrome, Chromium, Mozilla Firefox, Opera

### License

Copyright (C) 2016  Nguyen Van Nguyen

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
