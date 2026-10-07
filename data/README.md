# Support knowledge for UAT

Copy the reviewed TipTune JSONL files here before starting UAT:

- `tiptune_train.jsonl`
- `tiptune_val.jsonl`

They are read only by the server-side `/api/support/chat` route and are never
sent to the browser.
