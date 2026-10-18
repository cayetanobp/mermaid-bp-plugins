import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.package_bookstack_release import package_release


class PackageBookStackReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1])
        self.root = Path(self.temp.name)
        self.package = self.root / "package"
        self.output = self.root / "release"
        self.package.mkdir()
        (self.package / "plugin.json").write_text(json.dumps({"id": "bookstack", "version": "1.0.0", "apiVersion": 1}))
        (self.package / "index.js").write_text("export default {};\n")

    def tearDown(self):
        self.temp.cleanup()

    def package_once(self):
        return package_release(
            self.package,
            self.output,
            "1.0.0-beta.1",
            "https://github.com/cayetanobp/mermaid-bp/releases/tag/1.0.0-beta.1",
        )

    def test_package_is_installable_reproducible_and_cross_linked(self):
        first = self.package_once()
        first_bytes = first["archive"].read_bytes()
        second = self.package_once()
        self.assertEqual(first_bytes, second["archive"].read_bytes())
        self.assertEqual(hashlib.sha256(first_bytes).hexdigest(), second["sha256"])
        with zipfile.ZipFile(first["archive"]) as archive:
            self.assertEqual(archive.namelist(), ["bookstack/index.js", "bookstack/mermaid-bp-release.json", "bookstack/plugin.json"])
            metadata = json.loads(archive.read("bookstack/mermaid-bp-release.json"))
            self.assertEqual(metadata["plugin"], {"id": "bookstack", "version": "1.0.0", "apiVersion": 1})
            self.assertEqual(metadata["compatibleCore"]["betaVersion"], "1.0.0-beta.1")
            self.assertIn("plugins/", metadata["installation"])

    def test_rejects_non_api_v1_or_wrong_core_release_url(self):
        manifest_path = self.package / "plugin.json"
        manifest_path.write_text(json.dumps({"id": "bookstack", "version": "1.0.0", "apiVersion": 2}))
        with self.assertRaisesRegex(ValueError, "API v1"):
            self.package_once()
        manifest_path.write_text(json.dumps({"id": "bookstack", "version": "1.0.0", "apiVersion": 1}))
        with self.assertRaisesRegex(ValueError, "release URL"):
            package_release(self.package, self.output, "1.0.0-beta.1", "https://example.com/release")


if __name__ == "__main__":
    unittest.main()
