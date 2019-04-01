#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '

if [[ $(tty) == '/dev/tty1' ]]; then
  vga=$(lspci | grep ' VGA ' | head -1)
  if [[ "${vga}" == *"nvidia"* ]]; then
    if [[ ! -f /etc/X11/xorg.conf ]]; then
      sudo mv /etc/X11/xorg.conf.bck /etc/X11/xorg.conf
      sudo mv /etc/X11/xorg.conf.d.bck /etx/X11/xorg.conf.d
    fi
    
    xorgNumber=$(cat /etc/X11/xorg.conf | grep 'Option         "Coolbits" "28"' | wc -l)
    gpuNumber=$(nvidia-smi --qury-gpu=gpu_name --format=noheader,csv | wc -l)
    if [[ ${xorgNumber} != ${gpuNumber} ]]; then
      sudo nvidia-xconfig -a --cool-bits 28
      sudo systemctl reboot
    fi
  else
    if [[ ! -f /etx/X11/xorg.conf.bck ]]; then
      sudo mv /etc/X11/xorg.conf /etc/X11/xorg.conf.bck
      sudo mv /etx/X11/xorg.conf.d /etx/X11/xorg.conf.d.bck
    fi
  fi
fi

if [[ ! -z ${SSH_TTY} ]] || [[ ! -z ${SSH_CONNECTION} ]] || [[ ! -z ${SSH_CLIENT} ]]; then
  nosFolder=$(find /home -type d -name nOS 2>/dev/null)
  echo "For a list of SSH commands, type : node ${nosFolder}/SSH.js help"
fi

alias start='nosFolder=$(find /home -type d -name nOS 2>/dev/null); cd ${nosFolder}; pm2 start LaunchPad.js -- init 2>&1 >/dev/null; pm2 logs 0 --raw &'
alias stop='nosFolder=$(find /home -type d -name nOS 2>/dev/null); cd ${nosFolder}; node LaunchPad.js stop'