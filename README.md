# nOS

# Installation

```bash 
git clone https://github.com/Nesci28/nOS.git
```

## Linux

#### Dependancies
| nvidia        	| opencl-amd  	        | openssh 	          |
|:---------------	|:-------------	        |:---------	          |
| __screen__        	| __shellinabox__ 	| __nvidia-settings__	|
| __nodejs__        	| __npm__         	| __gnu-netcat__      |
| __libmicrohttpd__ 	| __curl__        	|         	          |


### Arch
#### official repo
``
sudo pacman -S nvidia screen nodejs npm libmicrohttpd curl openssh nvidia-settings gnu-netcat
``
``
ln -s llibmicrohttpd.so.12 libmicrohttpd.so.10
``

#### aur
```bash
cd ~/Downloads
git clone https://aur.archlinux.org/shellinabox-git.git
cd shellinabox-git

awk '
  /make/ {
      print 'find . -name "service.c" -exec sed -i -e "s|-oRhostsRSAAuthentication=no||g" {} \;'
      print 'find . -name "service.c" -exec sed -i -e "s|-oRSAAuthentication=no||g" {} \;'
  }
  { print }
  ' PKGBUILD

makepkg -Acs
sudo pacman -U *.tar.xz

cd ..
git clone https://aur.archlinux.org/opencl-amd.git
cd opencl-amd
makepkg -Acs
sudo pacman -U opencl*.tar.xz
```

## Windows
WIP


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


```
Math.round(Number(minWatt) + (maxWatt - minWatt) / 100 * (maxPower - 50))
exemple :
Gtx 1070 Ti 
minWatt by nvidia-smi = 90 W
maxWatt by nvidia-smi = 217 W
Powerlimit % configured = 70
Math.round(Number(90) + (217 - 90) / 100 * (70 - 50)) == 115 W
```
# Usage

#### start
```bash
node Launchpad.js init
```
```
###### Linux
screen -x minerNvividia or screen -x minerAmd or screen -x minerCpu
```
#### stop
```bash
node Launchpad.js stop
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/)
