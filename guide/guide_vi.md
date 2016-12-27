# Hướng dẫn cài đặt và sử dụng OpenPGP Secure Zimlet
## Kích hoạt OpenPGP Secure Zimlet
1. Tại trang chủ chọn mục **Preferences -> Zimlets**<br/>
 ![zimlet-prefs.png](zimlet-prefs.png)
2. Chọn "**OpenPGP Secure Email**" để kích hoạt OpenPGP Secure Zimlet<br/>
 ![zimlet-select.png](zimlet-select.png)

## Cấu hình OpenPGP Security
### **OpenPGP Mail Security**<br/>
 1. Tại trang chủ chọn mục **Preferences -> OpenPGP Security**<br/>
 ![openpgp-pref-select.png](openpgp-pref-select.png)
 2. Mục "**OpenPGP Mail Security**" bao gồm các tùy chọn gửi thư:<br/>
  - **Auto (remember last settings)**: OpenPGP Security sẽ sử dụng tùy chọn gửi thư gần nhất.<br/>
  - **Do not sign or encrypt**: Không sử dụng tính năng ký số và mã hóa nội dung thư.<br/>
  - **Sign Only**: Chỉ sử dụng tính năng ký số nội dung thư.<br/>
  - **Sign and encrypt**: Sử dụng đồng thời tính năng ký số và mã hóa nội dung thư.
 ![openpgp-secure-config.png](openpgp-secure-config.png)   
### **Key pair**<br/>
 1. Tại trang chủ chọn mục **Preferences -> OpenPGP Security**. Mục **Key pair** sẽ có giao diện như hình mình họa bên dưới. Người dùng điền các thông tin đã có sẵn vào các mục ***Private key***, ***Passphrase*** và ***Public key***.<br/>
 ![openpgp-keypair-config-empty.png](openpgp-keypair-config-empty.png)
 2. Trong trường hợp người dùng chưa có cặp khóa hoặc muốn tạo một cặp khóa mới, chọn **Generate key pair** sẽ xuất hiện một pop-up yêu cầu nhập đầy đủ các thông tin về Họ tên (Name), Địa chỉ hòm thư điện tử (Email), Mật khẩu khóa (Passphrase) và lựa chọn độ dài của khóa (Key length).<br/>
 ![openpgp-keypair-genarate.png](openpgp-keypair-genarate.png)
 3. Sau khi điền đầy đủ thông tin yêu cầu, chọn **OK** để tiến hành khởi tạo cặp khóa. Cặp khóa được khởi tạo sẽ được hiển thị như trong hình.<br/>
 ![openpgp-keypair-config.png](openpgp-keypair-config.png)
 4. Người dùng có thể gửi khóa công khai (Public key) đến máy chủ (thao tác này sẽ giúp người dùng khác có thể tìm kiếm được khóa công khai của bạn) bằng cách bấm vào tùy chọn **Submit to key server**.
 5. Trong trường hợp cần gửi khóa công khai của mình đến người khác, người dùng có thể chọn **Send public key**. Một cửa sổ soạn thạo thư mới sẽ xuất hiện cho phép bạn gửi khóa công khai của bạn cho người nhận.<br/>
 ![openpgp-public-key-send.png](openpgp-public-key-send.png)
 6. Chọn **Export key** để lưu offline khóa bí mật (Private key) của người dùng về thiết bị.

### **Manage public keys**
 1. Tại trang chủ chọn mục **Preferences -> OpenPGP Security**. Mục **Manage public keys** sẽ có giao diện như hình mình họa bên dưới.<br/>
 ![openpgp-public-key-list.png](openpgp-public-key-list.png)
 2. Tùy chọn **Key server lookup** sẽ hỗ trợ người dùng tìm kiếm và thêm khóa công khai của người dùng khác từ máy chủ.</br>
 ![openpgp-public-key-lookup.png](openpgp-public-key-lookup.png)
 3. Tùy chọn **Add public key** sẽ hỗ trợ người dùng thêm trực tiếp khóa công khai của người dùng bằng cách Paste nội dung khóa công khai của người dùng cần thêm, sau đó chọn **OK** để hoàn tất việc thêm khóa công khai mới vào danh sách.<br/>
 ![openpgp-public-key-add.png](openpgp-public-key-add.png)
 4. Tùy chọn **Export all keys** sẽ hỗ trợ lưu offline toàn bộ danh sách khóa công khai về thiết bị của người dùng.
 5. Người dùng có thể xóa khóa công khai trong danh sách bằng cách click chuột phải vào khóa công khai cần xóa và chọn **Delete**.<br/>
 ![openpgp-public-key-delete.png](openpgp-public-key-delete.png)

## Soạn thảo thư sử dụng OpenPGP Secure Zimlet
 1. Tại mục **Mail** chọn **New Message**. Một cửa sổ soạn thảo thư mới sẽ xuất hiện
 2. Trên thanh tác vụ của cửa sổ soạn thảo thư, người dùng có thể lựa chọn:
   - **Don't sign**: Không sử dụng tính năng ký số và mã hóa nội dung thư.
   
   - **Sign**: Chỉ sử dụng tính năng ký số nội dung thư.
   
   - **Sign and encrypt**: Sử dụng đồng thời tính năng ký số và mã hóa nội dung thư.<br/>
   ![openpgp-compose-select-sign.png](openpgp-compose-select-sign.png)
 3. Sau khi chọn tùy chọn phù hợp, bấm **Send** để gửi thư.<br/>
 ![openpgp-compose-sign.png](openpgp-compose-sign.png)
 4. Trong trường hợp người dùng chưa có khóa bí mật, một popup cảnh báo sẽ xuất hiện với nội dung như hình bên dưới.<br/>
 ![openpgp-compose-sign-warn.png](openpgp-compose-sign-warn.png)
 5. Trong trường hợp người dùng chưa có khóa công khai của người nhận, một popup cảnh báo sẽ xuất hiện với nội dung như hình bên dưới. <br/>
 ![openpgp-compose-encrypt-warn.png](openpgp-compose-encrypt-warn.png)

## Đọc thư có nội dung được ký số/mã hóa
 Thư có nội dung ký số/mã hóa sẽ được mã hóa và có chú thích như hình minh họa bên dưới.
 ![openpgp-read-inline-signed-message.png](openpgp-read-inline-signed-message.png)
 ![openpgp-read-inline-ecrypted-message.png](openpgp-read-inline-ecrypted-message.png)
