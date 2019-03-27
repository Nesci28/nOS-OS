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
size=$((size+838439))

cd ~/image
sudo dd if=/dev/zero of=~/image/nOS.img bs=512 count=${size} status=progress
sudo losetup -fP nOS.img
loopDevice=$(losetup -a | head -1 | cut -d ' ' -f1 | sed 's/://g')
sudo gdisk ${loopDevice} <<EOF
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
EOF
sleep 234
system "sudo mkfs.ext4 /dev/loop1p4" || exit
system "sudo dd if=#{@a[0]}p1 of=#{@b[0]}p1 bs=#{LBA_BLOCKSIZE} status=progress" || exit
system "sudo dd if=#{@a[0]}p2 of=#{@b[0]}p2 bs=#{LBA_BLOCKSIZE} status=progress" || exit
system "sudo dd if=#{@a[0]}p3 of=#{@b[0]}p3 bs=#{LBA_BLOCKSIZE} status=progress" || exit
system "mkdir -p #{@a[1]} #{@b[1]}" || exit
mount @a
mount @b
system "sudo rsync -aHAX --info=progress2 #{@a[1]}/ #{@b[1]}" || exit





# sudo mount -o loop,offset=117440512 nOS.img ~/image/mnt/
# sleep 234
# zip nOS.zip nOS.img
# gdrive upload nOS.zip
# sleep 5
# ID=$(gdrive list | grep nOS.img | cut -d ' ' -f1)
# sleep 5
# gdrive share ${ID}