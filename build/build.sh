#!/bin/sh

set -e

THISDIR=`pwd`
if [ `basename $THISDIR`  != 'build' ]; then
  echo "Execute `basename $0` from the build directory"
  exit 1
fi

BASE_DIR=`dirname $THISDIR`
SRC_DIR=$BASE_DIR/src
BUILD_DIR=$BASE_DIR/build
PKG_DIR=$BASE_DIR/Release
STAGING_DIR=$BASE_DIR/Staging

NAME='ztncui'
DESCRIPTION='ZeroTier network controller user interface'
VERSION=`grep version ../src/package.json | cut -f4 -d'"'`
VENDOR='Key Networks'
MAINTAINER='https://key-networks.com/contact'
URL='https://key-networks.com'
LICENSE='GPLv3'

BINDINGGYP='node_modules/argon2/binding.gyp'

NODE_VER='v16'

if [ ! -f /usr/lib/gcc/x86_64-redhat-linux/8/libstdc++.a ]; then
  echo "You must install libstdc++-static"
  exit 1
fi

DEPS="rpmbuild rpmsign npm node"

for DEP in ${DEPS}; do
  if ! which ${DEP}; then
    echo "Missing dependency ${DEP}"
    exit 1
  fi
done

rm -fr $STAGING_DIR && mkdir $STAGING_DIR
rm -fr $PKG_DIR && mkdir $PKG_DIR

pushd .
cd ../src
pushd .

NVER=`node --version`
if [[ ${NVER%%.*} != ${NODE_VER} ]]; then
  echo "Missing dependency node ${NODE_VER}"
  exit 1
fi

[[ -d ../src/node_modules ]] && rm -fr ../src/node_modules

npm install

patch --forward --dry-run --silent $BINDINGGYP $BUILD_DIR/binding.gyp.patch
if [ $? -eq 0 ]; then
  echo "Applying patch to $BINDINGGYP..."
  patch --forward $BINDINGGYP $BUILD_DIR/binding.gyp.patch
fi
if [ $? -ne 0 ]; then
  echo "Failed to patch $BINDINGGYP"
  exit 1
fi

cd node_modules/argon2/
node-gyp rebuild
if [ $? -ne 0 ]; then
  echo "Failed to rebuild argon2"
  exit 1
fi

popd
pkg -c ./package.json -t node16-linux-x64 bin/www -o $BUILD_DIR/ztncui

popd

install -m 755 -d $STAGING_DIR/opt
install -m 750 -d $STAGING_DIR/opt/key-networks
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui/etc
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui/etc/tls
install -m 750 -d $STAGING_DIR/opt/key-networks/ztncui/node_modules/argon2/build/Release
install -m 755 -d $STAGING_DIR/lib/systemd/system
install -m 600 $SRC_DIR/etc/default.passwd $STAGING_DIR/opt/key-networks/ztncui/etc/default.passwd
install -m 755 $SRC_DIR/node_modules/argon2/build/Release/argon2.node $STAGING_DIR/opt/key-networks/ztncui/node_modules/argon2/build/Release/
install -m 755 $BUILD_DIR/ztncui $STAGING_DIR/opt/key-networks/ztncui/
install -m 644 $BUILD_DIR/ztncui.service $STAGING_DIR/lib/systemd/system

rm -f $BUILD_DIR/ztncui

GENERAL_FPM_FLAGS="
  --name $NAME
  --version $VERSION
  --url $URL
  --license $LICENSE
  --chdir $STAGING_DIR
  --package $PKG_DIR
  --directories /opt/key-networks
  --depends zerotier-one
  --depends openssl
  --before-install before-install.sh
  --after-install after-install.sh
  --before-remove before-remove.sh
  --after-remove after-remove.sh
  --before-upgrade before-upgrade.sh
  --after-upgrade after-upgrade.sh
"

fpm -s dir -t rpm \
  $GENERAL_FPM_FLAGS \
  --vendor "$VENDOR" \
  --maintainer "$MAINTAINER" \
  --description "$DESCRIPTION" \
  --rpm-user ztncui \
  --rpm-group ztncui \
  .

fpm -s dir -t deb \
  $GENERAL_FPM_FLAGS \
  --vendor "$VENDOR" \
  --maintainer "$MAINTAINER" \
  --description "$DESCRIPTION" \
  --deb-user ztncui \
  --deb-group ztncui \
  .

rpm --addsign ../Release/ztncui*rpm
rpm --checksig ../Release/ztncui*rpm

createrepo $PKG_DIR
gpg -u 'Key Networks' --detach-sign --armor $PKG_DIR/repodata/repomd.xml
