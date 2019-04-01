# Dependancies: du, losetup, rsync, gdrive, zip, pv

lsblk
read -p 'Select the disk letter /dev/sdX : ' disk1
disk="/dev/sd${disk1}"
cat="sd${disk1}"

sudo mount ${disk}3 /mnt/USB

cd /mnt/USB/home/nos
git pull origin master
sudo rm -r .cache

size=$(sudo du -cs --block-size=512 /mnt/USB | tail -1)
size=$(echo ${size} | cut -d ' ' -f1)
size=$((size+2000000))

cd ~/Build/Image
sudo dd if=/dev/zero of=~/Build/Image/nOS.img bs=512 count=${size} status=progress
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
cd ~/Build/Image
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

sudo cp /mnt/USB/home/nos/SystemConfig.json /mnt/destination/ntfs/SystemConfig.json
sudo cp /mnt/USB/home/nos/CoinsConfig.json /mnt/destination/ntfs/CoinsConfig.json
sudo cp /mnt/USB/home/nos/Overclocks.json /mnt/destination/ntfs/Overclocks.json

sudo umount -l /mnt/destination/boot
sudo umount -l /mnt/destination/ntfs
sudo umount -l /mnt/destination
sudo losetup -d ${loopDevice}

cd ~/Build/Image

for ((i = 0; i < 10; i++)); do
  ID=$(gdrive list | grep "nOS.zip" | tail -1 | sed 's/  */ /g' | cut -d ' ' -f1)
  if [[ ! -z ${ID} ]]; then
    response=''
    while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
      response=$(gdrive delete ${ID})
      sleep 1
    done
  fi
done
echo -e "Done deleting the old version of nOS on the gdrive"

pv nOS.img | zip > nOS.zip

md5hash=$(md5sum nOS.zip | sed 's/  */ /g' | cut -d ' ' -f1)

response=''
while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
  response=$(gdrive upload nOS.zip)
  sleep 1
done
echo -e "Done uploading the new version of nOS on the gdrive"

ID=''
while [[ -z ${ID} ]]; do
  ID=$(gdrive list | grep "nOS.zip" | sed 's/  */ /g' | cut -d ' ' -f1)
  sleep 1
done
echo -e "gdrive ID of the new version of nOS is : ${ID}"

response=''
while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
  response=$(gdrive share ${ID})
  sleep 1
done
echo -e "new version is set to : Shared"

cd ~/Build
node md5.js "https://drive.google.com/open?id=${ID}" "${md5hash}"

cd ~
sed -i "/Download:/c\Download: https://drive.google.com/open?id=${ID}" README.md
sed -i "/md5:/c\md5: ${md5hash}" README.md

git add README.md
git commit -am "Auto-Update: Download link and md5 hash (from mixer)"
git push origin master
