# Hướng dẫn cài đặt và sử dụng OpenPGP Secure Zimlet
## Hướng dẫn cài đặt
### Kích hoạt OpenPGP Secure Zimlet
1. Tại trang chủ chọn mục **Preferences -> Zimlets**
![zimlet-prefs.png](zimlet-prefs.png)
1. Chọn "**OpenPGP Secure Email**" để kích hoạt OpenPGP Secure Zimlet
![zimlet-select.png](zimlet-select.png)

### Cấu hình OpenPGP Security
1. Tại trang chủ chọn mục **Preferences -> OpenPGP Security**
![openpgp-pref-select.png](openpgp-pref-select.png)
1. Mục "**OpenPGP Mail Security**" bao gồm các lựa chọn:

> **Auto (remember last settings)**: OpenPGP Security sẽ sử dụng lựa chọn gửi thư gần nhất.

> **Do not sign or encrypt**: Không sử dụng tính năng ký số và mã hóa nội dung thư.

> **Sign Only**: Chỉ sử dụng tính năng ký số nội dung thư.

> **Sign and encrypt**: Sử dụng đồng thời tính năng ký số và mã hóa nội dung thư.

![openpgp-secure-config.png](openpgp-secure-config.png)

### Manage your Key Pair
1. Open your Preferences in Zimbra.
1. Navigate to "OpenPGP Security" you will see "Key pair" Section
![openpgp-keypair-config-empty.png](openpgp-keypair-config-empty.png)
1. You can enter you existed key pair or
1. Click "Generate key pair" button, a "Generate key pair" will appear.
![openpgp-keypair-genarate.png](openpgp-keypair-genarate.png)
1. After click "Ok" button. Your key pair is generated and "Key pair" Section will look like this
![openpgp-keypair-config.png](openpgp-keypair-config.png)
1. You can submit your public key to pgp key server by clicking "Submit to Key server" button.
1. You can send your public key to someone by clicking "Send public key" button. A new compose window will open for sending your public key.
![openpgp-public-key-send.png](openpgp-public-key-send.png)
1. You can save your private key to a file by clicking "Export key" button.

### Manage public keys
1. Open your Preferences in Zimbra.
1. Navigate to "OpenPGP Security" you will see "Public keys" Section
![openpgp-public-key-list.png](openpgp-public-key-list.png)
1. You can lookup someone's public key on key server by clicking "Key server lookup" button.
![openpgp-public-key-lookup.png](openpgp-public-key-lookup.png)
1. You can add armored public keys by clicking "Add public key" button.
![openpgp-public-key-add.png](openpgp-public-key-add.png)
1. You can download all public keys and save to file by clicking "Export all keys" button.
1. Your can delete a public key by right click a public on list and choose "Delete"
![openpgp-public-key-delete.png](openpgp-public-key-delete.png)

### Composing
1. In "Mail" tab click "New Message". A "Compose" tab will appears.
1. On toolbar of "Compose" tab. You can choose "Don't Sign", "Sign", "Sign and Encrypt" your message
![openpgp-compose-select-sign.png](openpgp-compose-select-sign.png)
1. You can sign your message on "Compose" tab like this
![openpgp-compose-sign.png](openpgp-compose-sign.png)
1. If you don't have your private key, a waring dialog will appears
![openpgp-compose-sign-warn.png](openpgp-compose-sign-warn.png)
1. You can sign and encrypt your message on "Compose" tab like this
![openpgp-compose-encrypt.png](openpgp-compose-encrypt.png)
1. If one or more receivers don't have public key, a waring dialog will appears
![openpgp-compose-encrypt-warn.png](openpgp-compose-encrypt-warn.png)

### Reading signed/encrypted messages
1. Reading signed message
![openpgp-read-inline-signed-message.png](openpgp-read-inline-signed-message.png)
1. Reading encrypted message
![openpgp-read-inline-ecrypted-message.png](openpgp-read-inline-ecrypted-message.png)
