getent passwd ztncui || useradd --system --home-dir /opt/key-networks/ztncui --shell /bin/false ztncui
if [ $(getent group zerotier-one) ]; then
  echo "Adding user ztncui to group zerotier-one..."
  usermod -a -G zerotier-one ztncui
  chmod g+r /var/lib/zerotier-one/authtoken.secret
else
  echo "Could not add user ztncui to group zerotier-one... is zerotier-one installed?"
fi
