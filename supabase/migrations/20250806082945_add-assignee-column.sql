alter table tasks add column assignee text;
update tasks set assignee = executor where assignee is null;
