connection() {
  ssid=$(jq -r '."Wifi Name"' ~/SystemConfig.json)
  pass=$(jq -r '."Wifi Password"' ~/SystemConfig.json)
  if [[ ! -z $ssid && ! -z $pass ]]; then
    nmcli d wifi connect ${ssid} password ${pass} 2>&1 >/dev/null
    nmcli con modify ${ssid} connection.permissions '' 2>&1 >/dev/null
  else 
    echo "Not connected and no Wifi connection setup in the config file."
    echo "Stopping nOS"
    exit 1
  fi
}

checkForConnection() {
  echo -ne '                           (0%)\r'
  for i in {1..10}; do
    [[ $i == 1 ]] && echo -ne '###                        (10%)\r'
    [[ $i == 2 ]] && echo -ne '#####                      (20%)\r'
    [[ $i == 3 ]] && echo -ne '########                   (30%)\r'
    [[ $i == 4 ]] && echo -ne '##########                 (40%)\r'
    [[ $i == 5 ]] && echo -ne '#############              (50%)\r'
    [[ $i == 6 ]] && echo -ne '###############            (60%)\r'
    [[ $i == 7 ]] && echo -ne '##################         (70%)\r'
    [[ $i == 8 ]] && echo -ne '####################       (80%)\r'
    [[ $i == 9 ]] && echo -ne '#######################    (90%)\r'
    [[ $i == 10 ]] && echo -ne '######################### (100%)\r'

    wget -q --spider http://google.com
    if [[ $? -eq 0 ]]; then
      echo -ne '######################### (100%)\r'
      break
    fi
    if [[ $i -eq 10 ]]; then
      connection
      checkForConnection
    fi
    sleep 1
  done
}

echo "Launching nOS, please stand-by.."
pm2 flush 2>&1 >/dev/null
nosFolder=$(find /home -type d -name nOS 2>/dev/null)
cd ${nosFolder}
process=$(pm2 jlist | grep LaunchPad)
if [[ ! -z ${process} ]]; then
  node LaunchPad.js stop
fi

echo "Checking for connection."
checkForConnection
echo ""

pm2 start --name LaunchPad LaunchPad.js -- init 2>&1 >/dev/null
pm2 logs LaunchPad --raw
