# Gombe Community Helpdesk — Offline Edition

A multi-module, offline-first community issue and action tracking prototype built with plain HTML, CSS, and JavaScript. Designed as a beginner-friendly project for learning, demos, and open-source contributions.

## Features

- Dashboard with live counts and recent reports
- Issue reports: create, edit, search, filter, prioritize, update status, delete
- Action tasks: create, search, update progress, link to a report, delete
- Community directory: manage local contacts and roles
- Resource register: track equipment/supplies, quantity, condition, location
- Analytics: breakdown by report status and category
- Backup and restore as JSON; issue export as CSV
- Settings and dark mode
- Responsive desktop/mobile layout
- Local persistence via browser localStorage
- Optional service worker cache for offline use after the first successful load

## Run locally

### Quick way
Extract the ZIP and open `index.html` in a modern browser. Most features work directly. Service-worker caching is only available on localhost or HTTPS, not when opening a file directly.

### Recommended way (offline-capable PWA)
Use a local static server. If Python is installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Load the site once while the files are available. The service worker caches the app files so the interface can open again offline from the same local server origin. No internet or package installation is needed for the app itself.

## Publish to GitHub Pages

1. Create a public repository named `gombe-community-helpdesk-offline`.
2. Upload all files to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then save.
5. Open the URL GitHub Pages provides. Visit it once online so the service worker can cache the app.

## Storage and privacy

- Reports, tasks, contacts, resources, and preferences are stored in this browser on this device.
- Data does not synchronize between people or devices.
- Clearing browser site data can erase the workspace. Use Backup & Restore regularly.
- This prototype has no authentication, encryption, access control, server, or official connection to government services.
- Do not store sensitive personal data or confidential reports.

## Suggested open-source contributions

1. Add Hausa language support across all screens.
2. Add CSV export for tasks, contacts, and resources.
3. Add unit tests for filters, statistics, and backup validation.
4. Add IndexedDB migration for larger records.
5. Improve keyboard and screen-reader accessibility.
6. Add a secure optional backend for shared, moderated reports.

## Project structure

- `index.html` — page layout and all module views
- `style.css` — responsive interface and themes
- `app.js` — application state, modules, storage, export/import, UI interactions
- `sw.js` — service worker cache for offline app-shell access
- `manifest.webmanifest` — installable web app metadata
- `LICENSE` — MIT License

## License

MIT. See `LICENSE`.
