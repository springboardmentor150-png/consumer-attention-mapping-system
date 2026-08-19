import numpy as np

SHELF_ZONES = {
    1: np.array([
        [120, 100],
        [300, 100],
        [300, 400],
        [120, 400],
    ]),
    2: np.array([
        [350, 100],
        [520, 100],
        [520, 400],
        [350, 400],
    ]),
    3: np.array([
        [560, 100],
        [740, 100],
        [740, 400],
        [560, 400],
    ]),
}

SHELF_NAMES = {
    1: "Shelf A",
    2: "Shelf B",
    3: "Shelf C",
}

# Existing dwell tracking still uses legacy zone definition.
ZONE = {
    "Shelf A": [120, 100, 300, 400],
    "Shelf B": [350, 100, 520, 400],
    "Shelf C": [560, 100, 740, 400],
}
