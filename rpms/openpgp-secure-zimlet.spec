Name:           openpgp-secure-zimlet
Version:        1.0.1
Release:        1%{?dist}
Summary:        OpenPGP Secure Zimlet

Group:          Applications/Internet
License:        AGPLv3
URL:            https://github.com/nguyennv/openpgp-secure-zimlet
Source0:        https://github.com/nguyennv/openpgp-secure-zimlet/archive/%{version}.tar.gz

Requires:       zimbra-core >= 8.6
BuildRequires:  zip
BuildArch:      noarch

%description
OpenPGP Secure Zimlet - Sign, verify, encrypt, and decrypt email with PGP/MIME by OpenPGP for Zimbra.

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
* Tue Dec 08 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.1-1
- Update to release 1.0.1.

* Sun Nov 20 2016 Nguyen Van Nguyen <nguyennv1981@gmail.com> - 1.0.0-1
- Initial release 1.0.0 from upstream.
