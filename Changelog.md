[05-07-2019]

- Added the hability to Overclock AMD GPUs
- Added the RXBOOST function which sets the REF to 120 (might have to check if the GPU is a RX model)

[24-04-2019]

- Fixed the function that copies over the configurations from the WebApp

[22-04-2019]

- GPUFanControl is set to 1 in nvidia-settings on the first boot

[21-04-201]

- Fixed an issue in mixer.sh that wasnt installing new packages
- Added in mixer.sh something to make sure the image will auto-start nOS on startup

[20-04-2019]

- Continued the implementation of the new back-end endpoints
- Add the real background logo
- Fixed an issue in mixer.sh that wasnt copying over .bashrc and .conkyrc

[19-04-2019]

- Changed DB.js to work with the Authentication system

[18-04-2019]

- Fixed a display bug in PowerController
- Changed DB.js to work with the new Back-End refactorization

[16-04-2019]

- My 3rd child was born

[13-05-2019]

- The rigs doesnt contact the DB directly anymore, goes through the server
- Fixed a bug in mixer.sh that was creating a "sudo" file in the home directory

[12-05-2019] **Beta version 1.0.1**

- Start.sh now properly restart nOS if it is already running
- nOS restarts when there is new configurations coming from the Webapp
- nOS restarts when it detects a new update
- Fixed a bug where the hashrate was returning null since the switch from Screen to PM2
- Fixed a bug where the miners log were returning null since the switch from Screen to PM2
- Added Total Wattage to getInfo.js

[11-05-2019]

- Added the capacity to the Webapp to send external commands

[10-05-2019]

- New i3status bar design
- Changed dmenu to rofi

[09-05-2019]

- **Release of the first Beta version**
- mixer.sh now makes sure to fully update the system of the master image before cloning it

**Beta Version 1.0.0**

[08-05-2019]

- **switched the use of Screen to pm2 to run the different processes**
- Set autoReconnect to true on the DB
- Changed the order in which the functions are getting called in launchPad
- Fixed tmux.sh when there is multiple active PM2s
- Switched the use of child_process to Simple-Git when running GIT commands
- getInfo now checks the local and the remote last git commit hash on start and every 2 hours to check for a new update
- Put the entire LaunchPad.js into a try / catch block so that the system doesnt hang when a problem occurs

[05-05-2019]

- **Fixed the GPU ID when there is multiple AMD GPUs in the rig, ROCM-smi doesnt give the ID in a normal sequence**
- Fixed tmux.sh on mixed Rigs
- HiveOS_API now as a function to check the latest version of a miner and compares it to the local version (didn't implement a auto-updater yet..)

[04-05-2019]

- **Fixed increasing the fan when the temperature of the GPU was getting too high. \*\*\***
- **Fixed PowerController lowering the wattage of the GPU when it reached the maximum Fan Speed and the Temperature is still too high**
- Created the first Changelog
- Added an auto-updater that checks the git repo every 2 hours and pull if there is a new commit hash detected
- Changed HiveOS API file in future of adding an auto miner updater (WIP)
- Fixed the error message when it was trying to fetch the miners log when nothing was currently running
- Added SSH command 'hash' to show the current hashrate

**No version number yet, still WIP**
