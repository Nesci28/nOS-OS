containsElement () {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

if tmux list-sessions | grep miner ; then
  tmux kill-session -t miner
fi

termite -e "tmux new-session -A -s miner" &

jlist=$(pm2 jlist)
jlistLength=$(echo "${jlist}" | jq '.[].name' | wc -l)
jlistArray=$(echo "${jlist}" | jq '.[].name')
jlistArray=($jlistArray)
[[ -z ${jlistLength} ]] && jlistLength=0

minerName=("minerNvidia" "minerAmd" "minerCpu")
counter=0
for ((i=0;i<jlistLength;i++)); do
  currentName=$(echo "${jlist}" | jq -r '.['$i'].name')
  echo $currentName
  containsElement "${currentName}" "${minerName[@]}"
  res=$?
  if [[ ${res} == 0 ]]; then
    if [[ ${counter} != 0 ]]; then
      tmux split-window -t miner
    fi
    tmux send-keys -t ${counter} 'pm2 logs '${currentName}' --raw' Enter
    ((counter++))
  fi
done

exit
