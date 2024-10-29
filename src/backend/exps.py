from typing import List, Iterable, Type
from collections import Counter

from .mem import cache_folder
from .types.exp import Exp, ModelExp


def get_multi_exp_for(exp_name: str, exp_class: Type[Exp] = ModelExp) -> Iterable[Exp]:
    # extend by all exps!
    exps_path = cache_folder / "nbs" / exp_name / "exps"
    if not exps_path.exists():
        raise FileNotFoundError(f"Can't find exps folder: {exps_path}")
    for exp_file in exps_path.glob("*.json"):
        yield exp_class.model_validate_json(exp_file.read_text())


all_exps: List[Exp] = [
    Exp.model_validate_json((cache_folder / "exp.json").read_text()),
]

# exp names must be unique
if len(all_exps) != len(set(dhe.exp_name for dhe in all_exps)):
    # print exp with same exp_name
    counted_exp_names = Counter([dhe.exp_name for dhe in all_exps])
    for exp_name, count in counted_exp_names.items():
        if count > 1:
            print(f"{exp_name} has {count} occurrences")
    raise RuntimeError("Exp names are not unique")


def get_exp_by_name(exp_name: str) -> Exp:
    for dhe in all_exps:
        if dhe.exp_name == exp_name:
            return dhe
    raise ValueError(f"Can't find exp by name: {exp_name}")


def get_model_exp_by_name(exp_name: str) -> ModelExp:
    exp: Exp = get_exp_by_name(exp_name)
    if not isinstance(exp, ModelExp):
        raise ValueError("Errors can only be computed for ModelExp")
    return exp
