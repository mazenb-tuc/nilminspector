import torch

from .consts import selected_gpu


def get_device() -> torch.device:
    # check if CUDA is available
    device = torch.device("cpu")
    if torch.cuda.is_available():
        device = torch.device(f"cuda:{selected_gpu}")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    return device
