echo "Launching nOS, please stand-by.."
pm2 flush 2>&1 >/dev/null
nosFolder=$(find /home -type d -name nOS 2>/dev/null)
cd ${nosFolder}
process=$(pm2 jlist | grep LaunchPad)
if [[ ! -z ${process} ]]; then
  node LaunchPad.js stop
fi

pm2 start --name LaunchPad LaunchPad.js -- init 2>&1 >/dev/null
pm2 logs LaunchPad --raw
