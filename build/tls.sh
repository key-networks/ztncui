echo "Generating new TLS key and self-signed certificate..."
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout /opt/key-networks/ztncui/etc/tls/privkey.pem -out /opt/key-networks/ztncui/etc/tls/fullchain.pem -
