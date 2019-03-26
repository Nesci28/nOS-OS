lsblk
read -p 'Select disk /dev/sdX : ' disk
cd /mnt/USB
rm README.md
git pull origin master
size=$(df ${disk}4 | tail -1 | sed 's/  */ /g' | cut -d ' ' -f3)
S=$(echo "scale=0; ${size}*1.1" | bc); S=${S%.*}; S=$((S*2+204800+1024000))
echo $S

size=$(df ${disk}4 -h | tail -1 | sed 's/  */ /g' | cut -d ' ' -f3)
sudo dd if=${disk} bs=2048 count=${S} conv=sync,noerror | pv -s ${size} | sudo dd of=~/image/nOS.img