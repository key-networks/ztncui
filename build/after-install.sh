ETC='/opt/key-networks/ztncui/etc'
echo "Copying default password file..."
cp -pv $ETC/default.passwd $ETC/passwd
. ./tls.sh
echo "Enabling and starting ztncui service..."
systemctl enable ztncui
systemctl start ztncui
