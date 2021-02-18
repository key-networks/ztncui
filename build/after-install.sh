#!/bin/bash

ETC='/opt/key-networks/ztncui/etc'
if [ -f ${ETC}/passwd ]; then
  echo "Password file aready exists"
else
  echo "Copying default password file..."
  cp -pv ${ETC}/default.passwd ${ETC}/passwd
fi
if [ -f /opt/key-networks/ztncui/etc/tls/privkey.pem ] && [ -f /opt/key-networks/ztncui/etc/tls/fullchain.pem ]; then
  echo "TLS key and certificate already exist"
else
  echo "Generating new TLS key and self-signed certificate..."
  openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout /opt/key-networks/ztncui/etc/tls/privkey.pem -out /opt/key-networks/ztncui/etc/tls/fullchain.pem -subj "/C=XX/ST=YY/L=ZZ/O=Security/OU=SelfSigned/CN=example.com"
fi
chown ztncui.ztncui /opt/key-networks/ztncui/etc/tls/*
echo "Enabling and starting ztncui service..."
systemctl enable ztncui
systemctl start ztncui
