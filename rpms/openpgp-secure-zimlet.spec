Name:           openpgp-secure-zimlet
Version:        1.0.6
Release:        1%{?dist}
Summary:        OpenPGP Secure Zimlet

Group:          Applications/Internet
License:        AGPLv3
URL:            https://github.com/iwayvietnam/openpgp-secure-zimlet
Source0:        https://github.com/iwayvietnam/openpgp-secure-zimlet/archive/%{version}.tar.gz

Requires:       zimbra-core >= 8.6
BuildRequires:  zip
BuildArch:      noarch

%description
OpenPGP Secure Zimlet - Add PGP/MIME support to Zimbra Webmail.

%prep
%setup -q


%build
cd openpgp_zimbra_secure
zip -r openpgp_zimbra_secure.zip *


%install
mkdir -p $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra
cp -R openpgp_zimbra_secure/openpgp_zimbra_secure.zip $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra


%post
if [ $1 -eq 2 ] ; then
    su - zimbra -c "cp /opt/zimbra/zimlets-deployed/openpgp_zimbra_secure/config_template.xml /opt/zimbra/zimlets-deployed/openpgp-secure-zimlet-config_template.xml"
fi
su - zimbra -c "zmzimletctl deploy /opt/zimbra/zimlets-extra/openpgp_zimbra_secure.zip"
if [ $1 -eq 2 ] ; then
    su - zimbra -c "mv -f /opt/zimbra/zimlets-deployed/openpgp-secure-zimlet-config_template.xml /opt/zimbra/zimlets-deployed/openpgp_zimbra_secure/config_template.xml"
    su - zimbra -c "zmzimletctl configure /opt/zimbra/zimlets-deployed/openpgp_zimbra_secure/config_template.xml"
fi


%posttrans
su - zimbra -c "zmprov fc all"
su - zimbra -c "zmmailboxdctl restart"


%preun
if [ $1 -eq 0 ] ; then
    su - zimbra -c "zmzimletctl undeploy openpgp_zimbra_secure"
    su - zimbra -c "zmprov fc all"
fi


%files
/opt/zimbra/zimlets-extra/openpgp_zimbra_secure.zip


%changelog
* Fri Dec 23 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.6-1
- Update to release 1.0.6

* Fri Dec 23 2016 Truong Anh Tuan <tuanta@iwayvetnam.com> - 1.0.5-2
- Update source URL

* Tue Dec 20 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.5-1
- Update to release 1.0.5

* Mon Dec 19 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.4-1
- Update to release 1.0.4

* Mon Dec 12 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.3-1
- Update to release 1.0.3

* Fri Dec 09 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.2-1
- Update to release 1.0.2.

* Thu Dec 08 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.1-1
- Update to release 1.0.1.

* Sun Nov 20 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.0-1
- Initial release 1.0.0 from upstream.
