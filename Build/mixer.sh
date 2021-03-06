# Dependancies: du, losetup, rsync, gdrive, p7zip

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
cat="sd${disk1}"

sudo mount ${disk}4 /mnt/USB

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
sudo umount -lf /mnt/USB
sudo mount ${disk}4 /mnt/USB

cd /mnt/USB/home/nos
git pull origin master
sudo rm -r .cache

cd ~
sudo cp .conkyrc /mnt/USB/home/nos/.conkyrc
line=$(grep -n "bat:" /mnt/USB/home/nos/.conkyrc | cut -d ':' -f1)
line2=$((line+1))
text=$(sed "${line},${line2}d" /mnt/USB/home/nos/.conkyrc)
touch copy_file.txt
echo "${text}" > copy_file.txt
sudo mv copy_file.txt /mnt/USB/home/nos/.conkyrc
sudo cp .config/i3/config .config/i3/config_bck
# sed -n -i 'p;7a exec termite --hold -e "/home/nos/nOS/start.sh"' .config/i3/config_bck
sudo mv .config/i3/config_bck /mnt/USB/home/nos/.config/i3/config
sudo cp .config/i3/conky-i3bar.sh /mnt/USB/home/nos/.config/i3/conky-i3bar.sh
sudo mkdir /mnt/USB/home/nos/.config/termite
sudo cp .compton.conf /mnt/USB/home/nos/.compton.conf
sudo cp .config/termite/config /mnt/USB/home/nos/.config/termite/config
sudo cp /etc/i3status.conf /mnt/USB/etc/i3status.conf
sudo cp .xinitrc /mnt/USB/home/nos/.xinitrc
sudo cp .bashrc /mnt/USB/home/nos/.bashrc
line=$(wc -l .bashrc | cut -d ' ' -f1)
line2=$((line-1))
text=$(sed "${line},${line2}d" /mnt/USB/home/nos/.bashrc)
text=$(sed "${line},${line2}d" /mnt/USB/home/nos/.bashrc)
touch copy_file.txt
echo "${text}" > copy_file.txt
sudo mv copy_file.txt /mnt/USB/home/nos/.bashrc
sudo cp SystemConfig.json /mnt/USB/home/nos/SystemConfig.json
sudo cp CoinsConfig.json /mnt/USB/home/nos/CoinsConfig.json
sudo cp Overclocks.json /mnt/USB/home/nos/Overclocks.json
sudo mkdir /mnt/USB/home/nos/nOS/Data/
sudo rm /mnt/USB/home/nos/nOS/Data/Init.txt
sudo chmod -R a+rwX /mnt/USB/home/nos
cd /mnt/USB/home/nos
sudo mkdir Logs
sudo touch ./Logs/History.txt
sudo echo "serveo.net,159.89.214.31 ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDxYGqSKVwJpQD1F0YIhz+bd5lpl7YesKjtrn1QD1RjQcSj724lJdCwlv4J8PcLuFFtlAA8AbGQju7qWdMN9ihdHvRcWf0tSjZ+bzwYkxaCydq4JnCrbvLJPwLFaqV1NdcOzY2NVLuX5CfY8VTHrps49LnO0QpGaavqrbk+wTWDD9MHklNfJ1zSFpQAkSQnSNSYi/M2J3hX7P0G2R7dsUvNov+UgNKpc4n9+Lq5Vmcqjqo2KhFyHP0NseDLpgjaqGJq2Kvit3QowhqZkK4K77AA65CxZjdDfpjwZSuX075F9vNi0IFpFkGJW9KlrXzI4lIzSAjPZBURhUb8nZSiPuzj" > /mnt/USB/home/nos/.ssh/known_hosts

size=$(sudo df -h /mnt/USB | tail -1 | sed 's/  */ /g' | cut -d ' ' -f3 | sed 's/G//g')
size=$(echo "(${size} + 0.6)" | scale=0 bc)

cd ~/Build/Image
fallocate -l ${size}G nOS.img
sleep 5
sudo fdisk nOS.img <<EOF
o
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

sudo mkfs.fat -F32 ${loopDevice}p2
yes Y | sudo mkfs.ext4 ${loopDevice}p4
# sudo dd if=${disk}1 of=${loopDevice}p1 bs=512 status=progress
# sudo dd if=${disk}2 of=${loopDevice}p2 bs=512 status=progress
# sudo dd if=${disk}3 of=${loopDevice}p3 bs=512 status=progress

sudo mkdir -p /mnt/source /mnt/destination
sudo mount ${loopDevice}p4 /mnt/destination

sudo rsync -aHAX --info=progress2 /mnt/USB/* /mnt/destination

cd /mnt/destination
sudo mount -t proc /proc proc/
sudo mount --rbind /sys sys/
sudo mount --rbind /dev dev/
sudo mount --rbind /run run/

# Original
# grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB --removable
# grub-install --target=i386-pc --recheck ${loopDevice}

# WIP
# grub-install --target=x86_64-efi --recheck --removable --efi-directory=/boot/efi --boot-directory=/boot
# grub-install --target=i386-pc --recheck --boot-directory=/mnt/boot ${loopDevice}


disk=$disk loopDevice=$loopDevice sudo -E chroot /mnt/destination /bin/bash <<"EOT"
mount -a
oldUUID=$(lsblk -oNAME,UUID ${disk}4 | tail -1 | cut -d ' ' -f2)
newUUID=$(lsblk -oNAME,UUID ${loopDevice}p4 | tail -1 | cut -d ' ' -f2)
sed -i "s/${oldUUID}/${newUUID}/g" /etc/fstab
sed -i "s/${oldUUID}/${newUUID}/g" /boot/grub/grub.cfg
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB --removable
grub-install --target=i386-pc --recheck ${loopDevice}
grub-mkconfig -o /boot/grub/grub.cfg
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
for ((i = 0; i < 10; i++)); do
  ID=$(gdrive list | grep "nOS.zst" | tail -1 | sed 's/  */ /g' | cut -d ' ' -f1)
  if [[ ! -z ${ID} ]]; then
    response=''
    while [[ ${response} == *"Error 403"* || -z ${response} ]]; do
      response=$(gdrive delete ${ID})
      sleep 1
    done
  fi
done
echo -e "Done deleting the old version of nOS on the gdrive"

# sudo rm nOS.zst
7z a nOS.zip nOS.img
# zstdmt --long nOS.img -o nOS.zst

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
sed -i "/Download:/c\Download: [https://drive.google.com/open?id=${ID}](https://drive.google.com/open?id=${ID})  " README.md
sed -i "/md5:/c\md5: ${md5hash}" README.md

git add README.md
git commit -am "Auto-Update: Download link and md5 hash (from mixer)"
git push origin master

sudo shutdown -r now
