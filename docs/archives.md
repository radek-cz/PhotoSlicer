# Export and saved sessions

PhotoSlicer processes scans in the browser. Creating a ZIP downloads nothing and
does not save a completed session; both actions are explicit on the export
screen.

## ZIP contents

- Full-resolution cropped JPEG files.
- `metadata/<crop-name>.json` with each crop's metadata and source-region
  coordinates.
- `metadata.json`, a consolidated JSON index of the exported crops.
- `index.txt`, a tab-separated searchable text index of titles, descriptions,
  dates, people, locations, and topics.
- `README.txt`, which describes the coordinate system and unavailable data.

Coordinates are measured in pixels in the original source image. `exportedAt`
is the time the ZIP was generated. Original capture timestamps are not
available; dates entered by the user are included as object metadata. Original
source images are not included in the ZIP.

## Saved sessions

Choosing **Save session locally** stores the ZIP, source-image bytes, crop
regions, and metadata in a versioned IndexedDB database on this device. The
Saved archives page can download the stored ZIP or delete an individual saved
session. Deleting a session does not remove a previously downloaded ZIP or the
current workflow draft.
