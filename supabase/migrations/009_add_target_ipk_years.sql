alter table student_targets
  add column if not exists target_ipk numeric(3,2) null,
  add column if not exists target_years integer null;
