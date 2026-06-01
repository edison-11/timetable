# TODO
- [ ] Diagnose and fix “Server error” on DOS “View Data” (dashboard stats) by correcting missing tenant/school context.
- [ ] Link all relevant rows in tenant tables to school_id of `MUBUGATSS` (script-based, safe updates where school_id is NULL).
- [ ] Run `scripts/backfill-school-id.js` and verify affected rows per table.
- [ ] Re-test DOS “View Data” to confirm dashboard/stats works.

