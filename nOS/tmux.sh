if tmux list-sessions | grep -q miner ; then
  tmux kill-session -t miner
fi

urxvt -e tmux new-session -A -s miner &

minerName=("minerNvidia" "minerAmd" "minerCpu")
counter=0
for miner in "${minerName[@]}"; do
  if [[ $(screen -ls ${miner} | grep Detached | wc -l) == 1 ]]; then
    ((counter++))
  fi
done

if [[ ${counter} != 0 ]]; then
  for ((i=0;i<$counter;i++)); do
    if [[ $i != 0 ]]; then
     tmux split-window -t miner
    fi
    for miner in "${minerName[@]}"; do
      if [[ $(screen -ls ${miner} | grep Detached | wc -l) == 1 ]]; then
        minerName=( "${minerName[@]/$miner}" )
        tmux send-keys -t ${order} ${i} 'screen -x '${miner}'' Enter
        break
      fi
    done
  done
fi





#     if [[ $counter != 0 ]]
#   tmux select-layout -E -t miner even-vertical
# else 
#   tmux kill-session -t miner