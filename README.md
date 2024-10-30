Source code for the NILMInspector tool.

# Environment Setup

## Create Conda Environment

```sh
conda create -n nilminspector python=3.11 -y
conda activate nilminspector
```

## Install NILMTK

```sh
# nilmtk
mkdir nilmtk; cd nilmtk; git clone https://github.com/nilmtk/nilm_metadata; cd nilm_metadata; pip install -e '.[dev]' --no-deps
cd ..; git clone https://github.com/nilmtk/nilmtk; cd nilmtk; pip install -e '.[dev]' --no-deps
cd ..; git clone https://github.com/nilmtk/nilmtk-contrib; cd nilmtk-contrib; pip install -e '.[dev]' --no-deps

# update nilmtk-contrib from old keras imports
cp ma-embeddedml/src/nilmtk-contrib/nilmtk_contrib/disaggregate/*.py ./nilmtk_contrib/disaggregate
```

## Install Dependencies

```sh
pip install -r requirements.txt

# js runtime for frontend
# e.g. bun
curl -fsSL https://bun.sh/install | bas

# docker for your os
# e.g. for mac
brew install colima docker
colima start
```

## Cache Folder

```sh
mkdir -p ${CACHE_FOLDER}
```

## Helpful Development Tools

- git
- tmux
- vscodium

# Start the Application (Development Mode)

```sh
cd src/backend; just start-redis start-celery start-flower dev
cd src/frontend; just dev
```

To see the API docs:

```sh
cd src/backend; just open-api
```

To monitor celery tasks:

```sh
cd src/backend; just open-flower
```

# Train a model and export its info for the tool

See `tut/train_export.ipynb` and then add the path of the exported JSON file to the `all_exps` list in `src/backend/exps.py` by loading it like this:

```python
ModelExp.model_validate_json(
    (cache_folder / "nbs" / EXP_NAME / "exp.json").read_text()
)
```
