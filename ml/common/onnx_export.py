# ml/common/onnx_export.py
"""Convert a fitted scikit-learn pipeline to ONNX."""
import copy

from skl2onnx import to_onnx
from skl2onnx.common.data_types import FloatTensorType, StringTensorType

TARGET_OPSET = 17


def _fix_categorical_imputer(pipeline):
    """skl2onnx only converts string imputers whose missing value is a string.
    Categorical inputs come from dropdowns in the app, so they are never missing:
    switching the sentinel from NaN to "" does not change any prediction."""
    preprocessor = pipeline.named_steps["preprocessor"]
    if "cat" in preprocessor.named_transformers_:
        preprocessor.named_transformers_["cat"].named_steps["impute"].missing_values = ""


def export_onnx(pipeline, numeric, categorical, path):
    """Write the pipeline to `path`. Returns the ONNX input names in the order numeric + categorical."""
    model = copy.deepcopy(pipeline)
    _fix_categorical_imputer(model)
    initial_types = ([(c, FloatTensorType([None, 1])) for c in numeric]
                     + [(c, StringTensorType([None, 1])) for c in categorical])
    onx = to_onnx(model, initial_types=initial_types, target_opset=TARGET_OPSET,
                  options={id(model.named_steps["model"]): {"zipmap": False}})
    path.write_bytes(onx.SerializeToString())
    return [graph_input.name for graph_input in onx.graph.input]