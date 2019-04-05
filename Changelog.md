[04-05-2019]
- __Fixed increasing the fan when the temperature of the GPU was getting too high. ***__
- __Fixed PowerController lowering the wattage of the GPU when it reached the maximum Fan Speed and the Temperature is still too high__
- Created the first Changelog
- Added an auto-updater that checks the git repo every 2 hours and pull if there is a new commit hash detected
- Changed HiveOS API file in future of adding an auto miner updater (WIP)
- Fixed the error message when it was trying to fetch the miners log when nothing was currently running
- Added SSH command 'hash' to show the current hashrate
