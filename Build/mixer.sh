# Dependancies: du, losetup, rsync, gdrive, p7zip

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
size=$((size+1000000))

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

sleep 1
cd ~/image
sudo losetup -fP nOS.img
loopDevice=$(losetup -a | head -1 | cut -d ' ' -f1 | sed 's/://g')
if [[ -z ${loopDevice} ]]; then
  read -p "Something went wrong, try to run \"sudo losetup -fP nOS.img\" manually" var
fi

sudo mkfs.ext4 ${loopDevice}p4
sudo dd if=${disk}1 of=${loopDevice}p1 bs=512 status=progress
sudo dd if=${disk}2 of=${loopDevice}p2 bs=512 status=progress
sudo dd if=${disk}4 of=${loopDevice}p3 bs=512 status=progress

sudo mkdir -p /mnt/source /mnt/destination
sudo mount ${loopDevice}p4 /mnt/destination

sudo rsync -aHAX --info=progress2 /mnt/USB/* /mnt/destination

cd /mnt/destination
sudo mount -t proc /proc proc/
sudo mount --rbind /sys sys/
sudo mount --rbind /dev dev/
sudo mount --rbind /run run/

disk=$disk loopDevice=$loopDevice sudo -E chroot /mnt/destination /bin/bash <<"EOT"
mount -a
oldUUID=$(lsblk -oNAME,UUID ${disk}3 | tail -1 | cut -d ' ' -f2)
newUUID=$(lsblk -oNAME,UUID ${loopDevice}p4 | tail -1 | cut -d ' ' -f2)
sed -i "s/${oldUUID}/${newUUID}/g" /etc/fstab
sed -i "s/${oldUUID}/${newUUID}/g" /boot/grub/grub.cfg
mkinitcpio -p linux
EOT

sudo cp ~/mnt/USB/home/nos/SystemConfig.json /mnt/destination/ntfs/SystemConfig.json
sudo cp ~/mnt/USB/home/nos/CoinsConfig.json /mnt/destination/ntfs/CoinsConfig.json
sudo cp ~/mnt/USB/home/nos/Overclocks.json /mnt/destination/ntfs/Overclocks.json

sudo umount -l /mnt/destination/boot
sudo umount -l /mnt/destination/ntfs
sudo umount -l /mnt/destination
sudo losetup -d ${loopDevice}

cd ~/image

ID=$(gdrive list | grep nOS.zip | cut -d ' ' -f1)

if [[ ! -z ${ID} ]]; then
  response=''
  while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
    response=$(gdrive delete ${ID})
    sleep 1
  done
fi

7z a nOS.zip nOS.img

response=''
while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
  response=$(gdrive upload nOS.zip)
  sleep 1
done
response=''
while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
  response=$(gdrive share -i ${ID})
  sleep 1
done
