#!/usr/bin/env python3
"""Fix all Windows backslashes in Python files."""

import os
import re
from pathlib import Path

def fix_file(filepath):
    """Replace Windows paths with Unix paths in a single file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace all Windows-style paths
    # Data\Something -> Data/Something
    # Controllers\Something -> Controllers/Something
    content = re.sub(r'\\([A-Z])', r'/\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Fixed: {filepath}")

def main():
    """Fix all Python files in apps directory."""
    apps_dir = Path('apps')
    py_files = list(apps_dir.rglob('*.py'))

    print(f"Found {len(py_files)} Python files")

    for pyfile in py_files:
        try:
            fix_file(pyfile)
        except Exception as e:
            print(f"Error fixing {pyfile}: {e}")

    print("\nDone!")

if __name__ == '__main__':
    main()
