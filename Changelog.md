No version number yet, still WIP

[04-05-2019]
- __Fixed increasing the fan when the temperature of the GPU was getting too high. ***__
- __Fixed PowerController lowering the wattage of the GPU when it reached the maximum Fan Speed and the Temperature is still too high__
- Created the first Changelog
- Added an auto-updater that checks the git repo every 2 hours and pull if there is a new commit hash detected
- Changed HiveOS API file in future of adding an auto miner updater (WIP)
- Fixed the error message when it was trying to fetch the miners log when nothing was currently running
- Added SSH command 'hash' to show the current hashrate

[05-05-2019]
- __Fixed the GPU ID when there is multiple AMD GPUs in the rig, ROCM-smi doesnt give the ID in a normal sequence__
- Fixed tmux.sh on mixed Rigs
- HiveOS_API now as a function to check the latest version of a miner and compares it to the local version (didn't implement a auto-updater yet..)

[08-05-2019]
- __switched the use of Screen to pm2 to run the different processes__
- Set autoReconnect to true on the DB
- Changed the order in which the functions are getting called in launchPad
- Fixed tmux.sh when there is multiple active PM2s
- Switched the use of child_process to Simple-Git when running GIT commands
- getInfo now checks the local and the remote last git commit hash on start and every 2 hours to check for a new update
- Put the entire LaunchPad.js into a try / catch block so that the system doesnt hang when a problem occurs


