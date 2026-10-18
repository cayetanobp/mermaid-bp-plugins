#!/usr/bin/env python3
"""Create a reproducible, installable BookStack release bundle."""

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path


def package_release(package_dir: Path, output_dir: Path, core_version: str, core_release_url: str) -> dict:
    package_dir = package_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((package_dir / "plugin.json").read_text(encoding="utf-8"))
    if manifest.get("id") != "bookstack" or manifest.get("apiVersion") != 1:
        raise ValueError("BookStack must target the public plugin API v1.")
    version = manifest.get("version", "")
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", version):
        raise ValueError("plugin.json must contain a valid plugin version.")
    if not re.fullmatch(r"\d+\.\d+\.\d+-beta\.\d+", core_version):
        raise ValueError("The compatible core version must be a beta version.")
    expected_core_url = f"https://github.com/cayetanobp/mermaid-bp/releases/tag/{core_version}"
    if core_release_url != expected_core_url:
        raise ValueError("The core release URL must match the selected Mermaid BP beta tag.")

    metadata = {
        "schemaVersion": 1,
        "plugin": {"id": "bookstack", "version": version, "apiVersion": 1},
        "compatibleCore": {"apiVersions": [1], "betaVersion": core_version, "releaseUrl": core_release_url},
        "installation": "Extract the archive and copy the complete bookstack/ folder into plugins/ in the Mermaid BP distribution.",
    }
    (package_dir / "mermaid-bp-release.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n"
    )

    archive_name = f"bookstack-v{version}.zip"
    archive_path = output_dir / archive_name
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        files = sorted(path for path in package_dir.rglob("*") if path.is_file())
        if not files:
            raise ValueError("The built plugin package is empty.")
        for path in files:
            relative = path.relative_to(package_dir).as_posix()
            info = zipfile.ZipInfo(f"bookstack/{relative}", date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    checksum_path = output_dir / f"{archive_name}.sha256"
    checksum_path.write_text(f"{digest}  {archive_name}\n", encoding="ascii", newline="\n")
    release_metadata_path = output_dir / f"bookstack-v{version}.release.json"
    metadata["archive"] = {"file": archive_name, "sha256": digest}
    release_metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    return {"archive": archive_path, "checksum": checksum_path, "metadata": release_metadata_path, "sha256": digest}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--core-version", required=True)
    parser.add_argument("--core-release-url", required=True)
    args = parser.parse_args()
    result = package_release(args.package_dir, args.output_dir, args.core_version, args.core_release_url)
    print(f"{result['archive']}\n{result['checksum']}\n{result['metadata']}\n{result['sha256']}")


if __name__ == "__main__":
    main()
