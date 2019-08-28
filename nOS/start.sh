echo "Launching nOS, please stand-by.."
nosFolder=$(find /home -type d -name nOS 2>/dev/null)
cd ${nosFolder}
process=$(pm2 jlist | grep LaunchPad)
if [[ ! -z ${process} ]]; then
  node LaunchPad.js stop
fi

for run in {1..10}; do
  wget -q --spider http://google.com
  if [ $? -eq 0 ]; then
      break
  fi
  sleep 1
done

pm2 start --name LaunchPad LaunchPad.js -- init 2>&1 >/dev/null
pm2 logs LaunchPad --raw
