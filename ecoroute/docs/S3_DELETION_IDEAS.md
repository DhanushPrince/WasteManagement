# Ideas: Persisting "Removed" Stops and Deleting in S3

## What’s implemented now

- **Excluded (removed) stops persist across page reload** using `localStorage` under the key `ecoroute_excluded_stops`.
- Stored as `{ ids: number[], datasetLength: number }`. Exclusions are restored only if the loaded dataset has the same length (same dataset); otherwise they are cleared.
- So after reload, the same stops stay removed until you clear site data or the dataset file/length changes.

---

## Options for “delete in S3”

Right now the app only **reads** the dataset from S3. To actually remove stops from the dataset in S3, you need a way to **update or replace** the object in S3. Here are practical options.

### 1. Backend API that updates the dataset in S3 (recommended if you have a server)

- Add an API (e.g. Node/Express, Lambda, or your existing backend) that:
  - Accepts the list of stop IDs (or a stable key like `area_name` + `lat` + `lng`) to remove.
  - Reads the current dataset from S3 (same key you use today).
  - Removes those entries from the JSON array.
  - Writes the updated JSON back to S3 (same key or a versioned key, e.g. `input/dataset_v2.json`).
- The app would call this API when the user confirms “Remove from route” (and optionally a “Save to S3” or “Apply deletions to S3” button).
- **Pros:** Real deletion in S3; all users see the same data.  
- **Cons:** Needs a backend with IAM (or credentials) that can read/write the bucket.

### 2. Separate “exclusions” file in S3 (no change to main dataset file)

- Keep the main dataset JSON in S3 as-is.
- Add a small “exclusions” object in S3, e.g. `input/excluded_stops.json` (or per-user/keyed by dataset), e.g.:
  - `{ "excluded_ids": [1, 5, 7] }`  
  - or `{ "excluded_keys": ["area1|10.1|76.2", ...] }` for stable keys.
- A backend (or a Lambda triggered on upload) writes this file when the user “saves exclusions to S3”.
- The app **reads both** the dataset and the exclusions file; if the exclusions file exists, it hides those stops (same as current “removed” behaviour, but driven from S3).
- **Pros:** No rewriting the main dataset; simple to add; reversible.  
- **Cons:** “Deletion” is logical (filtered in the app), not physical removal from the main JSON.

### 3. Export updated dataset and upload to S3 manually

- In the app, add an **“Export dataset”** (or “Download without removed stops”) button.
- It builds a JSON that is the current dataset **minus** the excluded stops (using the same structure as your S3 dataset).
- User downloads the file and uploads it to S3 (Console, CLI, or your pipeline), replacing the original object.
- **Pros:** No backend; no credentials in the app; works with current S3 setup.  
- **Cons:** Manual step; no automatic sync; multiple users would have to share the same file.

### 4. Soft delete in the dataset (backend adds a flag)

- Backend (or an offline job) that can write to S3 updates the dataset JSON so that removed stops have a flag, e.g. `"deleted": true` or `"excluded": true`.
- The app, when loading the dataset, filters out any item with that flag (and optionally shows “removed” in the UI if you want).
- **Pros:** Single source of truth in S3; can be reversed by flipping the flag.  
- **Cons:** Requires a backend (or process) that can PATCH/update the JSON in S3; dataset schema changes.

---

## Recommendation

- **Short term:** Use the current **localStorage** persistence (already implemented) so removed stops survive reloads.
- **For real “delete in S3”:**
  - If you can add a small backend: use **Option 1** (rewrite dataset in S3) or **Option 2** (exclusions file in S3).
  - If you want no backend: use **Option 3** (export JSON without removed stops, then upload to S3 manually).

If you tell me which option you prefer (e.g. “backend API” vs “export only”), I can outline the exact API shape or the export format to match your current dataset.
