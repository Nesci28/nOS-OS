# Dependancies: du, losetup, rsync, gdrive, zip

lsblk
read -p 'Select the disk letter /dev/sdX : ' disk1
disk="/dev/sd${disk1}"
cat="sd${disk1}"

sudo mount ${disk}3 /mnt/USB

cd /mnt/USB/home/nos
git fetch origin master
sudo rm -r .cache

size=$(sudo du -cs --block-size=512 /mnt/USB | tail -1)
size=$(echo ${size} | cut -d ' ' -f1)
size=$((size+838436))

cd ~/image
sudo dd if=/dev/zero of=~/image/nOS.img bs=512 count=${size} status=progress
sudo gdisk nOS.img <<EOF
o
Y
n
1

+1MB
EF02
n
2

+100MB
EF00
n
3

+10MB
0700
n
4


8300
p
w
y
EOF

sudo losetup -fP nOS.img
loopDevice=$(losetup -a | head -1 | cut -d ' ' -f1 | sed 's/://g')

sudo mkfs.ext4 ${loopDevice}p4
sudo dd if=${disk}1 of=${loopDevice}p1 bs=512 status=progress
sudo dd if=${disk}2 of=${loopDevice}p2 bs=512 status=progress
sudo dd if=${disk}4 of=${loopDevice}p3 bs=512 status=progress

sudo mkdir -p /mnt/source /mnt/destination
sudo mount ${loopDevice}p4 /mnt/destination

sudo rsync -aHAX --info=progress2 /mnt/USB/* /mnt/destination

oldUUID=$(lsblk -oNAME,UUID ${disk}3)
newUUID=$(lsblk -oNAME,UUID ${loopDevice}p4)
sed "s/^UUID=${oldUUID}$/UUID=${newUUDI}/" </mnt/destination/etc/fstab

echo $newUUID
cat /mnt/destination/etc/fstab

sleep 234

sudo umount ${loopDevice}p4
sudo losetup -d ${loopDevice}

zip nOS.zip nOS.img

gdrive upload nOS.zip
sleep 5
ID=$(gdrive list | grep nOS.img | cut -d ' ' -f1)
sleep 5
gdrive share ${ID}