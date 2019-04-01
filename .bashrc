#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '

if [[ ! -z ${SSH_TTY} ]] || [[ ! -z ${SSH_CONNECTION} ]] || [[ ! -z ${SSH_CLIENT} ]]; then
  nosFolder=$(find /home -type d -name nOS 2>/dev/null)
  echo "For a list of SSH commands, type : node ${nosFolder}/SSH.js help"
fi

alias start='nosFolder=$(find /home -type d -name nOS 2>/dev/null); cd ${nosFolder}; pm2 start LaunchPad.js -- init 2>&1 >/dev/null; pm2 logs 0 --raw &'
alias stop='nosFolder=$(find /home -type d -name nOS 2>/dev/null); cd ${nosFolder}; node LaunchPad.js stop'