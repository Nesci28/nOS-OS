# nOS

[Changelog](https://github.com/Nesci28/nOS/blob/master/Changelog.md)

Download: [https://drive.google.com/open?id=1GGRAdfK5-ISHSqyA1e4Pn7f4_afA9LcQ](https://drive.google.com/open?id=1GGRAdfK5-ISHSqyA1e4Pn7f4_afA9LcQ)  
md5: 6d69201b2b216ae2a738102b3e3f61dc

# Installation
```bash 
git clone https://github.com/Nesci28/nOS.git

W.I.P
(optional: nOS rice, needs i3-gaps)
git clone https://github.com/Nesci28/nOS-rice.git
```

## Linux

### Don't forget to change the default root and user password if shellinabox is activated !!!
```bash
passwd
sudo passwd
```

#### Dependancies
| nvidia        	    | opencl-amd  	    | openssh 	          |
|:---------------	    |:-------------	    |:---------	          |
| __screen__        	| __shellinabox__ 	| __nvidia-settings__	|
| __nodejs__        	| __npm__         	| __gnu-netcat__      |
| __libmicrohttpd__ 	| __curl__        	| __jq__              |
| __tmux__          	| __rxvt-unicode__  | __pm2 (npm)__       |

Shellinabox must be running on port: 4200

### Arch
#### official repo
```bash
sudo pacman -S nvidia screen nodejs npm libmicrohttpd curl openssh nvidia-settings gnu-netcat rxvt-unicode jq
ln -s llibmicrohttpd.so.12 libmicrohttpd.so.10
sudo npm install -g pm2
```

#### aur
```bash
cd ~/Downloads
git clone https://aur.archlinux.org/shellinabox-git.git
cd shellinabox-git
lineNumber=$(grep --max-count 1 -Fnw 'make' ~/Downloads/shellinabox-git/PKGBUILD | cut -f1 -d:); sed -n -i "p;${lineNumber}a find . -name \"service.c\" -exec sed -i -e \"s|-oRhostsRSAAuthentication=no||g\" {} \;" ~/Downloads/shellinabox-git/PKGBUILD; sed -n -i "p;$((lineNumber++))a find . -name \"service.c\" -exec sed -i -e \"s|-oRSAAuthentication=no||g\" {} \;" ~/Downloads/shellinabox-git/PKGBUILD


makepkg -Acs
sudo pacman -U *.tar.xz

cd ..
git clone https://aur.archlinux.org/opencl-amd.git
cd opencl-amd
makepkg -Acs
sudo pacman -U opencl*.tar.xz
```

## Windows
W.I.P

# Configuration
## SystemConfig.json
- Use the same __Coin Name__ as in __CoinsConfig.json__
- __Serial number__ is used to let the rig know when there is an update coming from the WebApp, don't touch it.

## CoinsConfig.json
- Use the same __Coin Name__ as in __SystemConfig.json__
- __Serial number__ is used to let the rig know when there is an update coming from the WebApp, don't touch it.

## Overclocks.json
- While mining, the Fan Controller will adjust the fan speed accordingly for the GPU Temperature to be between the __Max Temperature__ +- 3.  If the fan speed reaches the __Max FanSpeed__ value, PowerController will decrease the Powerlimit of the GPU by -5 W.
- __Serial number__ is used to let the rig know when there is an update coming from the WebApp, don't touch it.

#### Nvidia
- If __Use HiveOC__ is set to true, it uses the hiveOS API to find the most popular overclocks and powerlimit values for your GPUs and set it to those.  If the hiveOS API returns empty, it then uses the __Powerlevel %, Core Clock and Mem Clock__ as default values.
- If __Use HiveOC__ is set to false, the __Powerlimit %__ is calculated with this formula :


```javascript
Formulas for power limit percentage :
Math.round(Number(minWatt) + (maxWatt - minWatt) / 50 * (maxPower - 50))

Exemple :
Gtx 1070 Ti 
minWatt by nvidia-smi = 90 W (50%)
maxWatt by nvidia-smi = 217 W (100%)
Powerlimit % configured = 70
Math.round(Number(90) + (217 - 90) / 50 * (70 - 50)) == 141 W
```

# Usage

#### start
```bash
./start.sh
or
pm2 start --name LaunchPad LaunchPad.js -- init 2>&1 >/dev/null; pm2 logs LaunchPad --raw &
or 
start (if using the full image)
```
#### stop
```bash
node Launchpad.js stop 
or
stop (if using the full image)
```

#### SSH
```bash
node SSH.js help
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/)
