#!/usr/bin/env python3
"""Convert an XLSX workbook to a loss-conscious JSON snapshot using stdlib only."""

from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def column_number(cell_reference: str) -> int:
    letters = re.match(r"[A-Z]+", cell_reference)
    if letters is None:
        raise ValueError(f"Invalid XLSX cell reference: {cell_reference}")
    number = 0
    for letter in letters.group(0):
        number = number * 26 + ord(letter) - ord("A") + 1
    return number


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(node.itertext()) for node in root.findall("main:si", NS)]


def typed_value(cell: ElementTree.Element, strings: list[str]):
    value_node = cell.find("main:v", NS)
    inline_node = cell.find("main:is", NS)
    cell_type = cell.get("t")

    if cell_type == "inlineStr":
        return "".join(inline_node.itertext()) if inline_node is not None else ""
    if value_node is None:
        return None

    value = value_node.text or ""
    if cell_type == "s":
        return strings[int(value)]
    if cell_type == "b":
        return value == "1"
    if cell_type in {"str", "e"}:
        return value
    if not value:
        return None

    number = float(value)
    return int(number) if number.is_integer() else number


def convert(source: Path, destination: Path) -> None:
    file_bytes = source.read_bytes()
    digest = hashlib.sha256(file_bytes).hexdigest()

    with zipfile.ZipFile(source) as archive:
        strings = shared_strings(archive)
        workbook = ElementTree.fromstring(archive.read("xl/workbook.xml"))
        relationships = ElementTree.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            relation.get("Id"): relation.get("Target")
            for relation in relationships.findall("pkg:Relationship", NS)
        }
        sheet_entries = workbook.findall("main:sheets/main:sheet", NS)
        sheets = []

        for index, entry in enumerate(sheet_entries, start=1):
            target = targets[entry.get(f"{{{NS['rel']}}}id")]
            sheet_path = str(PurePosixPath("xl") / target)
            if target.startswith("/"):
                sheet_path = target.lstrip("/")
            elif target.startswith("../"):
                sheet_path = str(PurePosixPath("xl") / target)
            sheet_path = str(PurePosixPath(sheet_path))
            root = ElementTree.fromstring(archive.read(sheet_path))
            rows = []

            for row in root.findall("main:sheetData/main:row", NS):
                row_number = int(row.get("r", "0"))
                cells = {}
                formulas = {}
                style_ids = {}
                highest_column = 0

                for cell in row.findall("main:c", NS):
                    reference = cell.get("r", "")
                    column = column_number(reference)
                    highest_column = max(highest_column, column)
                    value = typed_value(cell, strings)
                    formula = cell.find("main:f", NS)
                    if value is not None:
                        cells[column] = value
                    if formula is not None:
                        formulas[reference] = {
                            "expression": formula.text or "",
                            "attributes": dict(formula.attrib),
                        }
                    if cell.get("s") is not None:
                        style_ids[reference] = int(cell.get("s"))

                if not cells and not formulas:
                    continue

                values = [cells.get(column) for column in range(1, highest_column + 1)]
                row_entry = {"rowNumber": row_number, "values": values}
                if formulas:
                    row_entry["formulas"] = formulas
                if style_ids:
                    row_entry["styleIds"] = style_ids
                rows.append(row_entry)

            sheets.append(
                {
                    "name": entry.get("name", ""),
                    "index": index,
                    "state": entry.get("state", "visible"),
                    "rows": rows,
                }
            )

    snapshot = {
        "formatVersion": 1,
        "sourceFilename": source.name,
        "sourceSha256": digest,
        "sheets": sheets,
    }
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n")
    row_count = sum(len(sheet["rows"]) for sheet in sheets)
    print(f"Snapshot créé : {len(sheets)} onglets, {row_count} lignes, SHA-256 {digest}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python3 scripts/xlsx_to_legacy_json.py SOURCE.xlsx DESTINATION.json")
    convert(Path(sys.argv[1]), Path(sys.argv[2]))
