ETC='/opt/key-networks/ztncui/etc'
echo "Copying default password file..."
cp -pv $ETC/default.passwd $ETC/passwd
echo "Enabling and starting ztncui service..."
systemctl enable ztncui > /dev/null 2>&1
systemctl start ztncui > /dev/null 2>&1
