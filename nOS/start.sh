nosFolder=$(find /home -type d -name nOS 2>/dev/null)
cd ${nosFolder}
pm2 start --name LaunchPad LaunchPad.js -- init 2>&1 >/dev/null
pm2 logs LaunchPad --raw
