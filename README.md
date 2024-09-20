Source code for the NILMInspector tool.

# Environment Setup

```sh
conda create -n nilminspector python=3.11 -y
conda activate nilminspector

# nilmtk
mkdir nilmtk; cd nilmtk; git clone https://github.com/nilmtk/nilm_metadata; cd nilm_metadata; pip install -e '.[dev]' --no-deps
cd ..; git clone https://github.com/nilmtk/nilmtk; cd nilmtk; pip install -e '.[dev]' --no-deps
cd ..; git clone https://github.com/nilmtk/nilmtk-contrib; cd nilmtk-contrib; pip install -e '.[dev]' --no-deps

# enilm
cd ma-embeddedml/enilm/enilm; pip install -e '.[dev]' --no-deps

# other packages
pip install ipykernel pandas torch scikit-learn plotly matplotlib seaborn tables hmmlearn python-doc-inherit pyyaml tensorflow cvxpy pydantic tqdm loguru tslearn holidays python-dotenv jupyter ipywidgets nbdev

# for backend
pip install fastapi "uvicorn[standard]"

# for frontend
curl -fsSL https://bun.sh/install | bash

# cache dir
mkdir -p ${CACHE_FOLDER}
```
