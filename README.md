# Eris Tracker

A browser-based tracker for Machine Learning challenges and submissions.

## Features

- Challenge table: type, tags, baseline, best score, estimated and actual earnings, status.
- Per-challenge submissions with version, score, and review status.
- Public and Private personal ranks.
- Automatic Pass/Fail from submission review status; separate Top leaderboard status.
- Color-coded types and statuses.

## Run locally

Serve `dist/` with any static HTTP server, for example:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. No build step or dependencies are required.

Data is stored in the current browser's localStorage and is not synchronized across devices.

## Branches

- `main`: initial source snapshot.
- `feature/initial-setup`: first development branch.

The existing Sites deployment remains independent of this repository.
