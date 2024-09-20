ENV_NAME=nilminspector
BIN_PATH=$(shell conda info --base)/envs/$(ENV_NAME)/bin
PIP=$(BIN_PATH)/pip
DATETIME=$(shell date '+%Y-%m-%d %H:%M:%S')

# generate requirements from the env
gen-req:
	echo "# Auto generated on $(DATETIME)" >requirements.txt
	${PIP} freeze >> requirements.txt
