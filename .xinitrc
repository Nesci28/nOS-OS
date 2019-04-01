#!/bin/bash
if [[ $(tty) == '/dev/tty1' ]]; then
  vga=$(lspci | grep ' VGA ' | head -1)
  if [[ "${vga}" == *"NVIDIA"* ]]; then
    if [[ ! -f /etc/X11/xorg.conf ]]; then
      sudo mv /etc/X11/xorg.conf.bck /etc/X11/xorg.conf
      sudo mv /etc/X11/xorg.conf.d.bck /etx/X11/xorg.conf.d
    fi
  else
    if [[ ! -f /etx/X11/xorg.conf.bck ]]; then
      sudo mv /etc/X11/xorg.conf /etc/X11/xorg.conf.bck
      sudo mv /etx/X11/xorg.conf.d /etx/X11/xorg.conf.d.bck
    fi
  fi
fi

~/.fehbg &
shellinaboxd &
exec i3
