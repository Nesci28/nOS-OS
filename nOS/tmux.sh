urxvt -e echo $(tty)

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
  for ((i=0;i<counter-1;i++)); do
    tmux split-window -t miner
  done
  for miner in "${minerName[@]}"; do
    if [[ $(screen -ls ${miner} | grep Detached | wc -l) == 1 ]]; then
      PPTY=$(tmux display -t miner -p "#{pane_tty}")
      sudo ~/nOS/helpers/ttyecho -n $PPTY "screen -x $miner"
    fi
  done
  tmux select-layout -E -t miner even-vertical
else 
  tmux kill-session -t miner
fi