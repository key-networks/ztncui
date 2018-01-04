#!/bin/bash

ETC='/opt/key-networks/ztncui/etc'

echo "Copying default password file..."
cp -v $ETC/default.passwd $ETC/passwd
if [ $? -eq 0 ]; then
  exit 0
else
  exit 1
fi
