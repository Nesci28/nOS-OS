#!/bin/bash

#Recommended settings:
#Cards with 8GB memory (Vega 64, Vega 56, rx580, ...):
#--threads=2 --batchsize=76
#Cards with 4GB memory:
#--threads=2 --batchsize=36

# Check https://github.com/NoncerPro/noncerpro-nimiq-opencl to see all of available options.

./noncerpro --address='NQ52 7TL5 RA6B SSAS FULC P3SR D88B X2CK 0VTX' --threads=2 --server=nimiq.icemining.ca --port=2053  --mode=dumb --optimizer --api=true
