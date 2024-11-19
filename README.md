Source code for the NILMInspector tool.

https://github.com/user-attachments/assets/5613c79a-45d9-4d47-84d5-df53d53d4d21

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

# Citation

```bibtex
@inproceedings{10.1145/3671127.3698794,
    author = {Bouchur, Mazen and Reinhardt, Andreas},
    title = {NILMInspector: An Interactive Tool for Data Visualization and Manipulation in Load Disaggregation},
    year = {2024},
    isbn = {9798400707063},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    url = {https://doi.org/10.1145/3671127.3698794},
    doi = {10.1145/3671127.3698794},
    booktitle = {Proceedings of the 11th ACM International Conference on Systems for Energy-Efficient Buildings, Cities, and Transportation},
    pages = {323–328},
    numpages = {6},
    keywords = {Energy Disaggregation, Explainable Artificial Intelligence, Interactive Visualization, Machine Learning Tools, Non-Intrusive Load Monitoring, Performance Evaluation},
    location = {Hangzhou, China},
    series = {BuildSys '24}
}
```
