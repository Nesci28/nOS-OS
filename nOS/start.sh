nosFolder=$(find /home -type d -name nOS 2>/dev/null)
cd ${nosFolder}
node LaunchPad.js stop
pm2 start LaunchPad.js -- init 2>&1 >/dev/null; pm2 logs 0 --raw &
