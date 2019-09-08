lsblk
read -p "Which disk /dev/sdX ? " disk
bytesSize=$(sudo fdisk /dev/sd${disk} -l | grep Units | cut -d' ' -f8)
lastSector=$(sudo fdisk /dev/sd${disk} -l | tail -1 | sed 's/  */ /g' | cut -d' ' -f3)
toAdd=$((536870912/bytesSize))
lastSector=$((lastSector+toAdd))

sudo dd if=/dev/sd${disk} bs=${bytesSize} count=${lastSector} conv=sync,noerror status=progress | gzip -c  > nOS
