#!/bin/bash

set -eux -o pipefail

SRC_DIR=../src
PKG_DIR=../dist
BUILD_DIR=`pwd`
STAGING_DIR=../staging

NAME='ztncui'
DESCRIPTION='ZeroTier network controller user interface'
VERSION=`grep version ../src/package.json | cut -f4 -d'"'`
VENDOR='Key Networks https://key-networks.com'
MAINTAINER='Key Networks https://key-networks.com'
URL='https://key-networks.com'
LICENSE='GPLv3'


rm -fr $STAGING_DIR && mkdir $STAGING_DIR
rm -fr $PKG_DIR && mkdir $PKG_DIR

cd ../src
npm install
pkg -c ./package.json -t node8-linux-x64 bin/www -o ztncui
cd -

install -m 750 -d $STAGING_DIR/opt
install -m 750 -d $STAGING_DIR/opt/key-networks
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui/etc
install -m 600 $SRC_DIR/etc/default.passwd $STAGING_DIR/opt/key-networks/ztncui/etc/default.passwd
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui/etc/tls
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui/node_modules/argon2/build/Release
install -m 755 $SRC_DIR/node_modules/argon2/build/Release/argon2.node $STAGING_DIR/opt/key-networks/ztncui/node_modules/argon2/build/Release/
install -m 755 $SRC_DIR/ztncui $STAGING_DIR/opt/key-networks/ztncui/

openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout $STAGING_DIR/opt/key-networks/ztncui/etc/tls/privkey.pem -out $STAGING_DIR/opt/key-networks/ztncui/etc/tls/fullchain.pem -config $BUILD_DIR/openssl.cnf

GENERAL_FPM_FLAGS="
  --name $NAME
  --version $VERSION
  --url $URL
  --license $LICENSE
  --chdir $STAGING_DIR
  --package $PKG_DIR
  --directories /opt/key-networks
  --after-install /dev/null
  --before-install /dev/null
  --after-remove /dev/null
  --before-remove /dev/null
  --after-upgrade /dev/null
  --before-upgrade /dev/null
"

fpm -s dir -t rpm \
  $GENERAL_FPM_FLAGS \
  --vendor "$VENDOR" \
  --maintainer "$MAINTAINER" \
  --description "$DESCRIPTION" \
  --rpm-use-file-permissions \
  .

fpm -s dir -t deb \
  $GENERAL_FPM_FLAGS \
  --vendor "$VENDOR" \
  --maintainer "$MAINTAINER" \
  --description "$DESCRIPTION" \
  --deb-use-file-permissions \
  .

