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

updateAurPackages() {
aurPackages="${aurPackages[@]}" resolv="${resolv}" sudo -E chroot /mnt/USB /bin/bash <<"EOT"
mount -a
echo "${resolv}" >> /etc/resolv.conf
mkdir /home/nos/Downloads
cd /home/nos/Downloads
for i in ${aurPackages[@]}; do
  git clone $i
  folder=$(echo "$i" | cut -d'/' -f4 | cut -d'.' -f1)
  cd ${folder}
  makepkg -Acs
  sudo pacman -U *.tar.xz
done
sudo rm -r /home/nos/Downloads
EOT
}

lsblk
read -p "Which disk /dev/sdX ? " disk
bytesSize=$(sudo fdisk /dev/sd${disk} -l | grep Units | cut -d' ' -f8)
lastSector=$(sudo fdisk /dev/sd${disk} -l | tail -1 | sed 's/  */ /g' | cut -d' ' -f3)

cd /mnt/USB
sudo mount -t proc /proc proc/; sudo mount --rbind /sys sys/; sudo mount --rbind /dev dev/; sudo mount --rbind /run run/
resolv="
domain cgocable.ca
nameserver 205.151.67.2
nameserver 205.151.67.6
nameserver 205.151.67.34"
packages=$(cat ~/Build/packages.txt)
packages=(${packages})
aurPackages=$(cat ~/Build/aurPackages.txt)
aurPackages=(${aurPackages})
echo "" > ~/Build/packages.txt
echo "" > ~/Build/aurPackages.txt

if [[ -z ${packages} ]]; then
  updateWithoutPackages
else
  updateWithPackages
fi
if [[ ! -z ${aurPackages} ]]; then
  updateAurPackages
fi

sudo dd if=/dev/sd${disk} bs=${bytesSize} count=${lastSector} conv=sync,noerror status=progress | gzip -c  > nOS.gz
