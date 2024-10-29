set dotenv-load

PIP := env_var("CONDA_ENV_BIN_PATH") / "pip"
DATETIME := `date '+%Y-%m-%d %H:%M:%S'`

tmux:
	tmux new-session -d -s nilm-inspector

dev:
	cd src/backend  && just dev
	cd src/frontend && just dev

# generate requirements from the env
gen-req:
	mv requirements.txt requirements.txt.bak
	echo "# Auto generated on {{DATETIME}}" > requirements.txt
	{{PIP}} freeze >> requirements.txt
