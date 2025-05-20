#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, and pipeline failures
IFS=$'\n\t'       # Stricter word splitting

echo "Creating Python virtual environment and installing requirements..."
python3 -m venv /workspace/venv
source /workspace/venv/bin/activate
pip install -r /workspace/requirements.txt
echo "Python virtual environment setup complete"