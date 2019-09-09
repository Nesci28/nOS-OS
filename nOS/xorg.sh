#!/bin/sh

if [[ $(lspci | grep VGA | head -1) == *"NVIDIA"*  ]]; then
	if [[ -f /etc/X11/xorg.conf.bck  ]]; then
		sudo mv /etc/X11/xorg.conf.bck /etc/X11/xorg.conf
	fi
	if [[ -f /etc/X11/xorg.conf.d.bck  ]]; then
		sudo mv /etc/X11/xorg.conf.d.bck /etc/X11/xorg.conf.d
	fi
	if [[ -f /etc/X11/mhwd.d/nvidia.conf.bck  ]]; then
		sudo mv /etc/X11/mhwd.d/nvidia.conf.bck /etc/X11/mhwd.d/nvidia.conf
	fi
else
	if [[ -f /etc/X11/xorg.conf  ]]; then
		sudo mv /etc/X11/xorg.conf /etc/X11/xorg.conf.bck
	fi
	if [[ -f /etx/X11/xorg.conf.d  ]]; then
		sudo mv /etc/X11/xorg.conf.d /etc/X11/xorg.conf.d.bck
	fi
	if [[ -f /etc/X11/mhwd.d/nvidia.conf  ]]; then
		sudo mv /etc/X11/mhwd.d/nvidia.conf /etc/X11/mhwd.d/nvidia.conf.bck
	fi
fi

