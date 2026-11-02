# Repository Guidelines

## Project Structure & Module Organization

This repository is a static Chinese-language illustrated guide to plants in the *Shijing*. Root pages include `index.html` (home), `head.html` (shared navigation embedded through an iframe), `list.html` (plant browser), and `shijing.html` (poem index). Shared site styles live in `main.css`.

Individual plant entries live in `pages/`, with entry styles in `pages/pages.css` and botanical images in `pages/pic/`. The `src/` directory contains icons, fonts, and other site assets. Edit the existing HTML directly; no application framework or generated output is required.

## Build, Test, and Development Commands

- Open `index.html` in a browser for a local preview.
- If Python 3 is installed, run `python3 -m http.server 8000` from the repository root and visit `http://localhost:8000/` for an HTTP preview.
- Run `git diff --check` to check changes for whitespace errors before committing.
- Run `git diff --stat` to review the scope of changes, especially across plant entries.

There is no configured build step, dependency installation, test runner, formatter, or linter.

## Coding Style & Naming Conventions

Use four-space indentation in CSS and nested HTML where consistent with surrounding code. Preserve UTF-8 Chinese text, quotations, and source attributions. Follow nearby markup and inline JavaScript conventions; keep shared styling in the corresponding stylesheet.

Plant filenames combine a numeric identifier and Chinese name, such as `pages/1艾.html`. Preserve existing filenames and identifiers; check referring links and selection logic when adding or renaming entries. Use relative asset paths appropriate to each page's directory.

## Testing Guidelines

Validation is manual; no automated coverage threshold is configured. Preview changed pages and exercise navigation, plant selection, and embedded content. Confirm images and fonts load, scrolling works, and browser console and network panels show no new errors. Check narrow viewports when changing layout. Verify content edits, botanical names, and citations against source material.

## Commit & Pull Request Guidelines

History uses short Chinese and English subjects, including `首页` and `格式化代码`; no strict convention is established. Write concise, descriptive subjects and keep commits focused.

Pull requests should describe affected pages, explain the change, and list manual validation. Link relevant issues when available and include before/after screenshots for visible layout changes.
