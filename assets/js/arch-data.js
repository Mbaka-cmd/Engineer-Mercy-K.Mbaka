window.ARCH = (function () {
'use strict';
/* Conceptual architecture. flags: c = record store (cylinder), g = event or external system (gem),
   u = capability visible in the demo admin dashboard. Nothing here is a verified model name. */
function slug(s) { return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function part(spec) {
  var a = spec.split('::'), f = a[2] || '';
  return { name: a[0], purpose: a[1] || '', shape: /c/.test(f) ? 'cyl' : /g/.test(f) ? 'gem' : 'slab', ui: /u/.test(f) };
}
function C(key, name, purpose, flags, layout, parts, o) {
  var n = o || {}, f = flags || '';
  n.key = key; n.name = name; n.purpose = purpose;
  n.shape = /c/.test(f) ? 'cyl' : /g/.test(f) ? 'gem' : 'slab'; n.ui = /u/.test(f);
  if (parts) { n.layout = layout; n.kids = parts.map(part); }
  return n;
}

/* ---------------- 01 People & Identity ---------------- */
var people = { key: 'people', n: '01', name: 'People & Identity',
  purpose: 'Defines the people represented in the system, their relationships, and the permissions governing access to school operations.',
  layout: 'hub',
  kids: [
    C('users', 'Users', 'Sign-in identities. A user is who authenticates; roles decide what that person may do.', 'c', 'stack', [
      'Identity record::The account that represents one person in the system.::c',
      'Credential verification::Checks who is signing in before anything else happens.',
      'Session or token::Carries the verified identity across requests.::g',
      'Portal access::Routes each signed-in person to the portal their role allows.'
    ], { ctx: [['people.roles', 'Roles decide which portal and actions a user gets.', 3]] }),
    C('students', 'Students', 'The learners the school serves. Shown in the dashboard as Total Students, Add Student and Bulk Import.', 'cu', 'hub', [
      'Student record::The core record for a learner at the school.::c',
      'Single admission::Adding one student at a time.::u',
      'Bulk import::Loading many students at once from a prepared list.::u',
      'Guardian links::Connects the learner to the people responsible for them.',
      'Enrolment link::Places the learner in a class and stream for an academic year.'
    ], { ctx: [['academic.enrolments', 'Enrolment places the student in a class and year.', 4], ['people.guardians', 'Guardians are linked to the student.', 3], ['fees.invoices', 'Invoices are raised against students.', 0]] }),
    C('guardians', 'Guardians', 'The people responsible for a student, including who settles fees.', 'c', 'hub', [
      'Guardian record::A parent or guardian known to the school.::c',
      'Relationship to student::How the guardian is related to each student.',
      'Responsible payer::Which guardian settles fees for a student.',
      'Contact details::Where notices and SMS are sent.'
    ], { ctx: [['fees.payments', 'The responsible payer pays fees.', 2], ['comms.sms', 'Guardians receive SMS.', 3]] }),
    C('staff', 'Staff & Teachers', 'The adults who run and teach at the school. Shown as Teachers and Manage Staff.', 'cu', 'hub', [
      'Staff record::A member of staff known to the school.::c',
      'Teacher profile::Adding a teacher to the school.::u',
      'Staff management::Maintaining the staff list.::u',
      'Teaching assignments::Which classes and subjects a teacher covers.'
    ], { ctx: [['academic.subjects', 'Teachers are assigned to subjects.', 3], ['academic.classes', 'Teachers are assigned to classes.', 3]] }),
    C('roles', 'Roles', 'What each kind of person is allowed to see and do.', '', 'hub', [
      'Role definitions::The kinds of role the system recognises.::c',
      'Permission rules::What each role may do.',
      'Role assignment::Giving a user a role.',
      'Object-level checks::Whether a person may act on this specific record.'
    ], { ctx: [['controls.authz', 'Roles are enforced by authorization controls.', 3]] })
  ],
  links: [['users', 'students', 'Learners sign in through a user identity.'], ['users', 'staff', 'Staff sign in through a user identity.'], ['users', 'guardians', 'Guardians sign in through a user identity.'], ['users', 'roles', 'Roles decide what a user may do.'], ['guardians', 'students', 'Guardians are linked to students.'], ['roles', 'staff', 'Staff permissions come from roles.']],
  ctx: [['academic', 'Students, teachers and their assignments.', 'students', 'staff'], ['fees', 'Student and responsible-payer relationships.', 'students', 'guardians'], ['resources', 'Borrowers are people in the system.', 'users']]
};

/* ---------------- 02 Academic Structure ---------------- */
var academic = { key: 'academic', n: '02', name: 'Academic Structure',
  purpose: 'Establishes the academic context in which students are enrolled, teachers work, and academic records are organised over time.',
  layout: 'rows', rows: [['years'], ['classes', 'subjects', 'timetable'], ['streams', 'enrolments']],
  kids: [
    C('years', 'Academic years', 'The period all academic records belong to.', 'c', 'lanes', [
      'Academic year::The period all academic records belong to.::c',
      'Terms::Divisions of the year.',
      'Active period::The term currently in use.',
      'Year rollover::Moving students and structure into the next year.'
    ], { ctx: [['academic.enrolments', 'Enrolments are bound to a year.', 0], ['fees.structures', 'Fee structures apply to a year.', 1]] }),
    C('classes', 'Classes', 'The levels students are grouped into.', '', 'ring', [
      'Class level::A level such as Form 1.::c',
      'Class register::The students in a class.',
      'Class teacher::The teacher responsible for the class.'
    ], { ctx: [['academic.streams', 'Classes are divided into streams.', 0], ['people.staff', 'A teacher is responsible for each class.', 2]] }),
    C('streams', 'Streams', 'Divisions within a class. The dashboard shows a Students per Stream chart.', 'u', 'hub', [
      'Stream definition::A division of a class.::c',
      'Stream roster::Students placed in the stream.',
      'Students-per-stream view::Dashboard chart of how students are spread across streams.::u'
    ], { ctx: [['academic.classes', 'Streams belong to a class.', 0]] }),
    C('subjects', 'Subjects', 'What is taught, to whom, by whom, and how it is assessed.', '', 'hub', [
      'Subject catalogue::The subjects the school offers.::c',
      'Class allocation::Which classes take which subjects.',
      'Teacher assignment::Which teacher covers a subject for a class.',
      'Assessment mapping::How a subject connects to examinations.',
      'Timetable slots::Where a subject appears in the weekly timetable.'
    ], { ctx: [['academic.classes', 'Subjects are offered to classes.', 1], ['academic.streams', 'Allocation may be refined by stream.', 1], ['people.staff', 'Teachers are assigned to subjects.', 2], ['learning.exams', 'Examinations are set per subject.', 3], ['academic.timetable', 'Subjects occupy timetable slots.', 4]] }),
    C('enrolments', 'Enrolments', 'Which student is in which class and stream in which year.', 'c', 'hub', [
      'Enrolment record::Links a student to a class and stream for one year.::c',
      'Year binding::Ties the enrolment to an academic year.',
      'Enrolment status::Whether the student is currently enrolled.',
      'Promotion::Moving a student to the next class.'
    ], { ctx: [['people.students', 'The enrolled learner.', 0], ['academic.years', 'The year the enrolment belongs to.', 1]] }),
    C('timetable', 'Timetable', 'The weekly pattern of lessons. Available from the dashboard.', 'u', 'hub', [
      'Period grid::The weekly structure of lessons.::c',
      'Lesson slot::One subject, class and teacher at one time.',
      'Clash checks::Prevents a teacher or class being in two places at once.',
      'Teacher load::How many lessons each teacher carries.'
    ], { ctx: [['academic.subjects', 'Slots are filled by subjects.', 1]] })
  ],
  links: [['years', 'classes', 'Classes belong to an academic year.'], ['years', 'enrolments', 'Enrolments are bound to a year.'], ['classes', 'streams', 'Classes are divided into streams.'], ['classes', 'subjects', 'Subjects are offered to classes.'], ['subjects', 'timetable', 'Subjects fill timetable slots.'], ['streams', 'enrolments', 'Students are placed in streams.'], ['classes', 'enrolments', 'Students are placed in classes.']],
  ctx: [['people', 'Students, teachers and their assignments.', 'enrolments', 'subjects'], ['learning', 'Provides the academic context for assessment.', 'classes', 'subjects']]
};

/* ---------------- 03 Learning & Assessment ---------------- */
var learning = { key: 'learning', n: '03', name: 'Learning & Assessment',
  purpose: 'Represents student participation and academic performance as structured, attributable records.',
  layout: 'rows', rows: [['reports', 'kcse'], ['grading'], ['marks'], ['attendance', 'exams']],
  kids: [
    C('attendance', 'Attendance', 'Who was present. The dashboard offers Attendance and Attendance History.', 'cu', 'hub', [
      'Attendance register::The record of who was present.::c',
      'Daily marking::Recording attendance for a class.::u',
      'Attendance history::Reviewing past attendance records.::u',
      'Old-attendance clean-up::An admin action that clears attendance older than 30 days.::u'
    ], { ctx: [['academic.classes', 'Attendance is taken per class.', 1], ['controls.retention', 'Clean-up is a destructive action that needs safeguards.', 3]] }),
    C('exams', 'Examinations', 'Creating and managing exams. The dashboard shows Create Exam, Recent Exams and draft clearing.', 'u', 'lanes', [
      'Exam definition::Creating an exam.::u',
      'Draft exams::Exams not yet finalised; the dashboard can clear them.::u',
      'Subject papers::The subjects an exam covers.',
      'Marks entry::Where scores are captured.'
    ], { ctx: [['academic.subjects', 'Exams are set per subject.', 2], ['learning.marks', 'Scores are recorded as marks.', 3]] }),
    C('marks', 'Marks', 'Individual scores, attributable to a person and an exam.', 'c', 'stack', [
      'Mark entry::A score for one student in one paper.::c',
      'Validation rules::Scores must be within a valid range.',
      'Attribution::Who entered or changed a mark.',
      'Amendment history::What a mark was before it changed.'
    ], { ctx: [['controls.audit', 'Mark amendments should be auditable.', 2]] }),
    C('grading', 'Grading', 'Turning marks into grades.', '', 'hub', [
      'Grade boundaries::The ranges that map marks to grades.::c',
      'Grade calculation::Turns marks into grades.',
      'Grade distribution::Dashboard chart across all exams.::u'
    ]),
    C('reports', 'Reports', 'Printable report cards assembled from records.', '', 'ring', [
      'Data assembly::Gathering marks and attendance for a student.',
      'PDF rendering::Producing the printable report card.',
      'Distribution::Getting reports to guardians.'
    ], { ctx: [['people.guardians', 'Reports are for guardians.', 2], ['comms.notifications', 'Distribution can trigger notifications.', 2]] }),
    C('kcse', 'KCSE Results', 'National examination results, with a public results page.', 'u', 'hub', [
      'KCSE results record::Results held for past cohorts.::c',
      'Results page::The public KCSE Results page.::u',
      'Results analysis::Reading results across years.'
    ])
  ],
  links: [['exams', 'marks', 'Marks are recorded against an exam.'], ['marks', 'grading', 'Grades are calculated from marks.'], ['grading', 'reports', 'Reports present grades.'], ['attendance', 'reports', 'Participation can appear in reports.'], ['kcse', 'grading', 'Results are read against grades.']],
  ctx: [['academic', 'Academic context for attendance, examinations and reports.', 'attendance', 'exams'], ['people', 'Marks and registers are attributable to people.', 'marks', 'attendance']]
};

/* ---------------- 04 Fees & Payments ---------------- */
var fees = { key: 'fees', n: '04', name: 'Fees & Payments',
  purpose: 'Connects financial obligations to payment events and the resulting fee balances. A payment request, a confirmed payment and a generated receipt are three different things.',
  layout: 'rows', rows: [['structures'], ['invoices'], ['mpesa', 'payments'], ['receipts', 'balances']],
  kids: [
    C('structures', 'Fee structures', 'What the school charges, and to whom.', 'c', 'stack', [
      'Fee items::What the school charges for.::c',
      'Class and year scope::Which fees apply to which students.',
      'Adjustments::Changes to what a student owes.'
    ], { ctx: [['academic.years', 'Fees apply to an academic year.', 1]] }),
    C('invoices', 'Invoices', 'Statements of what is owed.', 'c', 'stack', [
      'Invoice::A statement of what is owed.::c',
      'Line items::The individual charges.',
      'Invoice status::Whether it is open or settled.',
      'Payer link::Which student and responsible payer it belongs to.'
    ], { ctx: [['people.students', 'Invoices are raised for students.', 3], ['people.guardians', 'A responsible payer settles them.', 3]] }),
    C('payments', 'Payments', 'Money received. A request is not a payment; only a verified outcome is.', 'c', 'lanes', [
      'Payment request::Asking the payer to pay. A request is not a payment.::g',
      'Provider callback::The provider reports an outcome.::g',
      'Verification::Checking the callback before trusting it.',
      'Confirmed payment::A verified payment, recorded once.::c',
      'Balance update::A balance changes only after confirmation.'
    ], { ctx: [['fees.receipts', 'A receipt follows a confirmed payment.', 3], ['comms.notifications', 'Outcomes trigger notifications.', 3], ['controls.transactions', 'Recording must be atomic and idempotent.', 3]] }),
    C('receipts', 'Receipts', 'Proof of a confirmed payment.', '', 'ring', [
      'Receipt record::The stored receipt.::c',
      'Receipt PDF::Printable proof of payment.',
      'Link to payment::A receipt points to the confirmed payment it proves.'
    ], { ctx: [['fees.payments', 'Issued only for confirmed payments.', 2]] }),
    C('mpesa', 'M-Pesa integration', 'The mobile-money rail that carries payment requests and outcomes.', 'g', 'lanes', [
      'STK push request::Prompting the payer on their phone.::g',
      'Callback endpoint::Where the provider reports the outcome.::g',
      'Callback verification::Checking that the report is genuine and not a repeat.',
      'Reconciliation::Matching provider records to the school records.'
    ], { ctx: [['controls.transactions', 'Callbacks may repeat, so handling must be idempotent.', 2]] }),
    C('balances', 'Fee balances & collection', 'Expected, collected and outstanding fees, with the collection rate.', 'cu', 'hub', [
      'Fee balance::What a student still owes.::c',
      'Expected fees::Total the school expects to collect.::u',
      'Collected::Total received so far.::u',
      'Outstanding balance::Total still owed.::u',
      'Collection rate::Collected as a share of expected.::u',
      'Fee status chart::Visual summary on the dashboard.::u'
    ], { ctx: [['tenant.admin', 'Summarised on the admin dashboard.', 1]] })
  ],
  links: [['structures', 'invoices', 'Fee structures generate invoices.'], ['invoices', 'payments', 'Payments settle invoices.'], ['mpesa', 'payments', 'M-Pesa carries requests and outcomes.'], ['payments', 'receipts', 'A receipt follows a confirmed payment.'], ['payments', 'balances', 'Confirmed payments reduce balances.'], ['invoices', 'balances', 'Invoices set what is owed.']],
  ctx: [['people', 'Student and responsible-payer relationships.', 'invoices', 'payments'], ['comms', 'Payment outcomes and notifications.', 'payments', 'receipts']]
};

/* ---------------- 05 School Resources ---------------- */
var resources = { key: 'resources', n: '05', name: 'School Resources',
  purpose: 'Represents school resources and the transactions that determine their availability.',
  layout: 'ring',
  kids: [
    C('books', 'Books', 'The library catalogue. The dashboard has a Library section.', 'cu', 'hub', [
      'Catalogue entry::A book the library holds.::c',
      'Copies::How many copies exist and where they are.',
      'Library management view::The library screen in the admin console.::u'
    ]),
    C('borrowing', 'Borrowing records', 'Who has which book, and until when.', 'c', 'stack', [
      'Borrowing record::One loan of one book.::c',
      'Borrower::The person borrowing.',
      'Due date::When the book should return.'
    ], { ctx: [['people.users', 'Borrowers are people in the system.', 1]] }),
    C('returns', 'Returns', 'Closing a loan and restoring availability.', 'g', 'stack', [
      'Return record::The event of a book coming back.::g',
      'Overdue handling::What happens when a book is late.',
      'Availability update::The book becomes borrowable again.'
    ], { ctx: [['resources.books', 'Returns restore availability.', 2]] })
  ],
  links: [['books', 'borrowing', 'Borrowing changes availability.'], ['borrowing', 'returns', 'Returns complete the transaction.'], ['returns', 'books', 'Returns restore availability.']],
  ctx: [['people', 'Borrowing and return transactions.', 'borrowing', 'returns']]
};

/* ---------------- 06 Communication ---------------- */
var comms = { key: 'comms', n: '06', name: 'Communication',
  purpose: 'Connects operational events to appropriate recipients. Communication activity is recorded separately from successful delivery.',
  layout: 'rows', rows: [['notices', 'notifications'], ['sms'], ['delivery']],
  kids: [
    C('notices', 'Notices', 'Announcements. The dashboard has a Notice Board.', 'u', 'hub', [
      'Notice::An announcement.::c',
      'Audience::Who should see it.',
      'Publication::Putting it on the notice board.::u'
    ], { ctx: [['people.guardians', 'Notices target guardians, students and staff.', 1]] }),
    C('notifications', 'Notifications', 'Turning events into messages for the right people.', 'g', 'hub', [
      'Event trigger::Something happened, such as a payment.::g',
      'Template::What the message says.',
      'Recipient rule::Who should be told.',
      'Channel choice::Which route the message takes.'
    ], { ctx: [['fees.payments', 'Payment outcomes are a common trigger.', 0]] }),
    C('sms', 'SMS', 'Single and bulk text messages. The dashboard has Bulk SMS.', 'ug', 'lanes', [
      'Message composition::Writing a single or bulk SMS.::u',
      'Recipient resolution::Turning a group into phone numbers.',
      'Provider hand-off::Passing the message to the SMS provider.::g',
      'Provider response::What the provider says happened.::g'
    ], { ctx: [['comms.delivery', 'Every attempt gets a delivery record.', 3], ['people.guardians', 'Guardians are common recipients.', 1]] }),
    C('delivery', 'Delivery records', 'What actually happened to each message.', 'c', 'stack', [
      'Send attempt::One try at sending a message.::c',
      'Provider status::What the provider reports.::g',
      'Failure and retry::What happens when a send fails.',
      'User-visible state::What the sender is told.'
    ], { ctx: [['controls.background', 'Retries run as background work.', 2]] })
  ],
  links: [['notices', 'sms', 'Notices can be sent as SMS.'], ['notifications', 'sms', 'Notifications go out through channels such as SMS.'], ['sms', 'delivery', 'Each send attempt gets a delivery record.'], ['notifications', 'notices', 'Events can produce notices.']],
  ctx: [['fees', 'Payment outcomes drive notifications.', 'notifications'], ['people', 'Recipients are guardians, students and staff.', 'sms', 'notices']]
};

/* ---------------- School / Tenant ---------------- */
var tenant = { key: 'tenant', name: 'School / Tenant',
  purpose: 'The institutional boundary that scopes records, users and operations.',
  layout: 'hub',
  kids: [
    C('profile', 'School profile', 'How the school presents itself: name, crest, contact details and opening hours.', 'cu', 'hub', [
      'School identity::Name and crest shown across the site.::c',
      'Contact details::Phone, email and address in the header and footer.::u',
      'Opening hours::Hours shown in the header.::u'
    ]),
    C('admin', 'Admin console', 'The administrator dashboard: counts, fee summary, analytics and quick actions.', 'u', 'hub', [
      'Dashboard::The single overview screen for administrators.::u',
      'Headline counts::Total students, teachers, streams and exams created.::u',
      'Fee summary::Expected, collected, balance and collection rate.::u',
      'Analytics charts::Students per stream, fee status and grade distribution.::u',
      'Quick actions::Shortcuts to add students, create exams, send SMS and more.::u',
      'Recent activity::Latest students and exams.::u',
      'Data management::Clearing draft exams and old attendance.::u'
    ], { ctx: [['people.students', 'Counts and quick actions draw on students.', 1], ['fees.balances', 'The fee summary reads fee balances.', 2], ['learning.grading', 'The grade chart reads grading.', 3], ['controls.retention', 'Data management is a retention concern.', 6]] }),
    C('website', 'Public website', 'The public face of the school: home, about, academics, co-curricular, student life, gallery, news, results and contact.', 'u', 'ring', [
      'Home and About::Introducing the school.::u',
      'Academics and Co-curricular::What the school teaches and offers.::u',
      'Student life and Gallery::Life at the school in words and pictures.::u',
      'News::Public updates.::u',
      'KCSE Results page::Published results.::u',
      'Contact::How to reach the school.::u'
    ], { ctx: [['learning.kcse', 'Results are published here.', 4], ['comms.notices', 'Some announcements may be public.', 3]] }),
    C('config', 'Tenant configuration', 'What makes one school different from another.', 'c', 'hub', [
      'Tenant record::The school itself as a record.::c',
      'School settings::Per-school choices.',
      'Data scoping rule::Every record belongs to one school.'
    ], { ctx: [['controls.isolation', 'Scoping is enforced by tenant isolation.', 2]] })
  ]
};

/* ---------------- Engineering Controls ---------------- */
var controls = { key: 'controls', name: 'Engineering Controls',
  purpose: 'Cross-cutting controls that apply across the whole platform rather than belonging to one module.',
  layout: 'ring',
  kids: [
    C('isolation', 'Tenant isolation', 'Keeping one school data separate from another.', '', 'stack', [
      'Tenant scoping rule::Every record belongs to one school.::c',
      'Applied at data access::Queries are limited to the current school.',
      'Verification::How isolation would be demonstrated to a reviewer.'
    ], { ctx: [['tenant.config', 'The scoping rule originates in configuration.', 0]] }),
    C('authz', 'Authentication and authorization', 'Who someone is, and what they may do.', '', 'stack', [
      'Authentication::Proving who someone is.',
      'Role checks::What a role may do.',
      'Object-level checks::Whether this person may act on this record.',
      'Session lifetime::How long a sign-in remains valid.'
    ], { ctx: [['people.roles', 'Roles supply the permission model.', 1]] }),
    C('validation', 'Data validation', 'Rejecting wrong data early.', '', 'stack', [
      'Input validation::Rejecting malformed input.',
      'Business rules::Rules such as valid score ranges.',
      'Database constraints::Rules enforced by the database itself.'
    ]),
    C('audit', 'Auditability', 'Being able to say who did what, and when.', 'c', 'stack', [
      'Audit record::Who did what, and when.::c',
      'Sensitive actions::Which actions must be recorded.',
      'Audit retention::How long audit records are kept.'
    ], { ctx: [['learning.marks', 'Mark changes are a key audit case.', 1]] }),
    C('transactions', 'Database transactions', 'Making related changes succeed or fail together.', '', 'stack', [
      'Atomic unit of work::Related changes succeed or fail together.',
      'Rollback::Undoing a partial failure.',
      'Idempotent handling::Processing a repeated event once.'
    ], { ctx: [['fees.payments', 'Payment recording depends on this.', 2]] }),
    C('background', 'Background processing', 'Work that happens outside the request.', 'g', 'lanes', [
      'Job queue::Work waiting to run.::c',
      'Scheduled work::Tasks that run at set times.',
      'Retry policy::What happens when a task fails.'
    ], { ctx: [['comms.sms', 'Bulk SMS is long-running work.', 0]] }),
    C('retention', 'Data retention & clean-up', 'Deleting temporary data safely. The dashboard can clear draft exams and old attendance.', 'u', 'hub', [
      'Safeguards::Confirmation, archiving and audit around destructive actions.',
      'Clear draft exams::A dashboard action.::u',
      'Clear old attendance::Removes attendance older than 30 days.::u',
      'Attendance history::Review before clearing.::u'
    ], { ctx: [['controls.audit', 'Destructive actions should be audited.', 0], ['learning.attendance', 'Attendance is the data being cleared.', 2]] })
  ],
  links: [['isolation', 'authz', 'Isolation and authorization together decide access.'], ['transactions', 'background', 'Background work still needs transactional safety.'], ['audit', 'retention', 'Destructive actions should be audited.']]
};

/* ---------------- Root ---------------- */
var root = { key: 'root', name: 'School Management SaaS',
  purpose: 'A school is the institutional boundary. Six operational domains share data beneath it, and engineering controls underpin all of them.',
  layout: 'overview',
  kids: [tenant, people, academic, learning, fees, resources, comms, controls],
  links: [['people', 'academic', 'Students, teachers and their assignments.'], ['academic', 'learning', 'Academic context for attendance, examinations and reports.'], ['people', 'fees', 'Student and responsible-payer relationships.'], ['fees', 'comms', 'Relevant payment outcomes and notifications.'], ['resources', 'people', 'Borrowing and return transactions.']]
};

var byId = {};
function fix(n, p) {
  n.parent = p; n.key = n.key || slug(n.name);
  n.id = !p ? 'root' : (p === root ? n.key : p.id + '.' + n.key);
  byId[n.id] = n;
  (n.kids || []).forEach(function (k) { fix(k, n); });
}
fix(root, null);
function kid(sc, x) { return typeof x === 'number' ? sc.kids[x] : sc.kids.filter(function (k) { return k.key === x; })[0]; }
function resolve(n) {
  if (!n.kids) return;
  var k = n.kids, L = n.links, i;
  if (!L) {
    L = [];
    if (n.layout === 'hub') for (i = 1; i < k.length; i++) L.push([k[0].key, k[i].key]);
    else if (n.layout === 'lanes' || n.layout === 'stack') for (i = 0; i < k.length - 1; i++) L.push([k[i].key, k[i + 1].key]);
  }
  n.edges = L.map(function (l) { var a = kid(n, l[0]), b = kid(n, l[1]); return a && b ? { a: a.id, b: b.id, t: l[2] || '' } : null; }).filter(Boolean);
  n.ctxs = (n.ctx || []).map(function (c) {
    return { ref: c[0], t: c[1], to: c.slice(2).map(function (x) { var t = kid(n, x); return t ? t.id : null; }).filter(Boolean) };
  }).filter(function (c) { return byId[c.ref] && c.to.length; });
  k.forEach(resolve);
}
resolve(root);
return { root: root, byId: byId };
})();