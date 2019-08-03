# Dependancies: gdrive, losetup, rsync, gdrive, p7zip

updateWithoutPackages() {
resolv="${resolv}" sudo -E chroot /mnt/USB /bin/bash <<"EOT"
mount -a
echo "${resolv}" >> /etc/resolv.conf
pacman -Syy
pacman -Syu --noconfirm
pacman -Scc --noconfirm
echo "" > /etc/resolv.conf
EOT
}

updateWithPackages() {
packages="${packages[@]}" resolv="${resolv}" sudo -E chroot /mnt/USB /bin/bash <<"EOT"
mount -a
echo "${resolv}" >> /etc/resolv.conf
pacman -Syy
pacman -Syu --noconfirm
pacman -S ${packages[@]} --noconfirm
pacman -Scc --noconfirm
echo "" > /etc/resolv.conf
EOT
}

lsblk
read -p 'Select the disk letter /dev/sdX : ' disk1
disk="/dev/sd${disk1}"

sudo mount ${disk}1 /mnt/USB

cd /mnt/USB
sudo mount -t proc /proc proc/; sudo mount --rbind /sys sys/; sudo mount --rbind /dev dev/; sudo mount --rbind /run run/
resolv="
domain cgocable.ca
nameserver 205.151.67.2
nameserver 205.151.67.6
nameserver 205.151.67.34"
packages=$(cat ~/Build/packages.txt)
packages=(${packages})
echo "" > ~/Build/packages.txt

if [[ -z ${packages} ]]; then
  updateWithoutPackages
else
  updateWithPackages
fi

cd ~
sudo umount -l /mnt/USB
sudo mount ${disk}1 /mnt/USB

cd /mnt/USB/home/nos
git reset --hard
git pull origin master
sudo rm -r .cache

cd ~
sudo mkdir /mnt/USB/home/nos/nOS/Data/
sudo rm /mnt/USB/home/nos/nOS/Data/Init.txt

cd /mnt/USB/home/nos
sudo mkdir Logs
sudo touch ./Logs/History.txt
sudo echo "serveo.net,159.89.214.31 ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDxYGqSKVwJpQD1F0YIhz+bd5lpl7YesKjtrn1QD1RjQcSj724lJdCwlv4J8PcLuFFtlAA8AbGQju7qWdMN9ihdHvRcWf0tSjZ+bzwYkxaCydq4JnCrbvLJPwLFaqV1NdcOzY2NVLuX5CfY8VTHrps49LnO0QpGaavqrbk+wTWDD9MHklNfJ1zSFpQAkSQnSNSYi/M2J3hX7P0G2R7dsUvNov+UgNKpc4n9+Lq5Vmcqjqo2KhFyHP0NseDLpgjaqGJq2Kvit3QowhqZkK4K77AA65CxZjdDfpjwZSuX075F9vNi0IFpFkGJW9KlrXzI4lIzSAjPZBURhUb8nZSiPuzj" > /mnt/USB/home/nos/.ssh/known_hosts

size=$(sudo df -h /mnt/USB | tail -1 | sed 's/  */ /g' | cut -d ' ' -f3 | sed 's/G//g')
size=$(echo "(${size} + 0.59)" | scale=0 bc)
sizeTotal=$(echo "(${size} + 0.01)" | scale=0 bc)
echo $size
echo $sizeTotal

cd ~/Build/Image
fallocate -l ${sizeTotal}G nOS.img

(
echo o
echo n 
echo p
echo 1
echo   
echo +${size}G 
echo n
echo p
echo 2
echo 
echo +10M
echo w
) | sudo fdisk nOS.img

sudo losetup -fP nOS.img
loopDevice=$(losetup -a | head -1 | cut -d ' ' -f1 | sed 's/://g')
if [[ -z ${loopDevice} ]]; then
  read -p "Something went wrong, try to run \"sudo losetup -fP nOS.img\" manually" var
fi

yes Y | sudo mkfs.ext4 ${loopDevice}p1
sudo mkntfs ${loopDevice}p2

sudo mkdir -p /mnt/destination
sudo mount ${loopDevice}p1 /mnt/destination

sudo rsync -aHAX --info=progress2 /mnt/USB/* /mnt/destination

cd /mnt/destination
sudo mount -t proc /proc proc/
sudo mount --rbind /sys sys/
sudo mount --rbind /dev dev/
sudo mount --rbind /run run/

disk=$disk loopDevice=$loopDevice sudo -E chroot /mnt/destination /bin/bash <<"EOT"
grub-install ${loopDevice}
grub-mkconfig -o /boot/grub/grub.cfg
oldUUID=$(lsblk -oNAME,UUID ${disk}1 | tail -1 | cut -d ' ' -f2)
newUUID=$(lsblk -oNAME,UUID ${loopDevice}p1 | tail -1 | cut -d ' ' -f2)
sed -i "s/${oldUUID}/${newUUID}/g" /etc/fstab
sed -i "s/${oldUUID}/${newUUID}/g" /boot/grub/grub.cfg
oldUUID=$(lsblk -oNAME,UUID ${disk}2 | tail -1 | cut -d ' ' -f2)
newUUID=$(lsblk -oNAME,UUID ${loopDevice}p2 | tail -1 | cut -d ' ' -f2)
sed -i "s/${oldUUID}/${newUUID}/g" /etc/fstab
sed -i "s/${oldUUID}/${newUUID}/g" /boot/grub/grub.cfg
mkinitcpio -p linux
EOT

sudo mkdir -p /mnt/ntfs
sudo mount ${loopDevice}p2 /mnt/ntfs
sudo cp ~/SystemConfig.json /mnt/ntfs/SystemConfig.json
sudo cp ~/CoinsConfig.json /mnt/ntfs/CoinsConfig.json
sudo cp ~/Overclocks.json /mnt/ntfs/Overclocks.json

sudo umount -l /mnt/destination
sudo umount -l /mnt/ntfs
sudo losetup -d ${loopDevice}

# sudo shutdown -r now

# cd ~/Build/Image

# for ((i = 0; i < 10; i++)); do
#   ID=$(gdrive list | grep "nOS.zip" | tail -1 | sed 's/  */ /g' | cut -d ' ' -f1)
#   if [[ ! -z ${ID} ]]; then
#     response=''
#     while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
#       response=$(gdrive delete ${ID})
#       sleep 1
#     done
#   fi
# done
# for ((i = 0; i < 10; i++)); do
#   ID=$(gdrive list | grep "nOS.zst" | tail -1 | sed 's/  */ /g' | cut -d ' ' -f1)
#   if [[ ! -z ${ID} ]]; then
#     response=''
#     while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
#       response=$(gdrive delete ${ID})
#       sleep 1
#     done
#   fi
# done
# echo -e "Done deleting the old version of nOS on the gdrive"

# # sudo rm nOS.zst
# 7z a nOS.zip nOS.img
# # zstdmt --long nOS.img -o nOS.zst

# md5hash=$(md5sum nOS.zip | sed 's/  */ /g' | cut -d ' ' -f1)

# response=''
# while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
#   response=$(gdrive upload nOS.zip)
#   sleep 1
# done
# echo -e "Done uploading the new version of nOS on the gdrive"

# ID=''
# while [[ -z ${ID} ]]; do
#   ID=$(gdrive list | grep "nOS.zip" | sed 's/  */ /g' | cut -d ' ' -f1)
#   sleep 1
# done
# echo -e "gdrive ID of the new version of nOS is : ${ID}"

# response=''
# while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
#   response=$(gdrive share ${ID})
#   sleep 1
# done
# echo -e "new version is set to : Shared"

# cd ~/Build
# node md5.js "https://drive.google.com/open?id=${ID}" "${md5hash}"

# cd ~
# sed -i "/Download:/c\Download: [https://drive.google.com/open?id=${ID}](https://drive.google.com/open?id=${ID})  " README.md
# sed -i "/md5:/c\md5: ${md5hash}" README.md

# git add README.md
# git commit -am "Auto-Update: Download link and md5 hash (from mixer)"
# git push origin master

# sudo shutdown -r now
