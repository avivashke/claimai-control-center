-- ClaimAI Seed Data Script

-- 1. Seed Product Items
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-001', 'bug', 'ClaimAI (Internal)', 'Bug', 'Email Automation / Appraisers', 'Initial-estimate email not sent to appraiser (Hachshara claims)', 'In claims against Hachshara Insurance, the appraiser does not receive the automated email requesting an initial damage estimate. Verify the trigger condition and dispatch flow for this insurer.', 'High', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Next Sprint', '2026-11-17', '2026-12-08', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-002', 'bug', 'ClaimAI (Internal)', 'Performance', 'Claim Creation', 'Slow claim-creation process', 'Opening a new claim is very slow. Move heavy processing to asynchronous background jobs and/or optimize performance so the user is never blocked.', 'High', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Next Sprint', '2026-11-17', '2026-12-08', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-003', 'bug', 'ClaimAI (Internal)', 'Integration', 'Bafi Integration', 'Bafi import – filter by specific claim, digits-only claim number', 'The Bafi import must be filtered by the specific claim, and the claim number must be parsed as digits only.', 'High', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Next Sprint', '2026-11-17', '2026-12-08', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-004', 'bug', 'ClaimAI (Internal)', 'Bug', 'Email Parsing / Documents', 'Email auto-assignment and form placement in document sections', 'Automatic assignment of emails to "Incoming Correspondence" does not work correctly, and forms are not placed in their designated document sections.', 'High', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Next Sprint', '2026-11-17', '2026-12-08', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-005', 'bug', 'ClaimAI (Internal)', 'Bug', 'Bafi Integration', 'Bafi session disconnects on every document pull', 'Every document pull from Bafi logs the user out of Bafi and forces a new login. The session must persist during and after the pull.', 'Critical', 'Open', 'Dev Team', 'User report', 'Dev Request Portal – User report', 'Hotfix', '2026-11-17', '2026-11-24', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-006', 'bug', 'ClaimAI (Internal)', 'Bug', 'WhatsApp Bot / Documents', 'Incident-scene photos from WhatsApp filed under "Appraiser Photos"', 'Incident-scene photos that the customer sends via WhatsApp are still being filed under "Appraiser Photos". Route them to the "Incident Scene Photos & Videos" document section (see roadmap item for the new section).', 'High', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Direct request – 17.11.2026', 'Hotfix', '2026-11-17', '2026-11-24', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-007', 'bug', 'ClaimAI (Internal)', 'Fix', 'Claim Editing', 'Partial save at every stage of a claim', 'Ensure that at any stage a partially populated claim can be opened, any single detail – however small – edited, and saved, without being blocked by mandatory fields or mandatory documents.', 'Critical', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Direct request – 17.11.2026', 'Hotfix', '2026-11-17', '2026-11-24', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-008', 'bug', 'ClaimAI (Internal)', 'Bug', 'Claim Editing / Third-Party', 'Cannot save a single added document after questionnaire (Third-Party claim)', 'After the customer completes the questionnaire, entering Edit mode and adding one document (e.g. a consent form) does not allow updating the claim unless all other documents are provided. Mandatory-field and mandatory-document validations block small incremental updates in the Edit Claim window. Observed on a Third-Party claim – same root cause as the policy-claim partial-save issue discussed previously. Allow saving any single change.', 'Critical', 'Open', 'Dev Team', 'Aviv Ashkenazi', 'Direct request – 17.11.2026', 'Hotfix', '2026-11-17', '2026-11-24', 2, '🟢 On track', '#1 · 17/11/26 10:00 · Aviv Ashkenazi: Same issue we discussed yesterday on the policy claim – partial progress cannot be saved in Edit Claim because of mandatory fields/documents. This case is a Third-Party claim.')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-009', 'bug', 'Racheli Asraf', 'Fix', 'Claim Creation / Uploads', 'Prevent data loss when a claim gets stuck', 'When a claim gets stuck (e.g. a large file upload or another failure), the claim must not be lost unsaved – auto-save a draft and recover gracefully.', 'High', 'Open', 'Dev Team', 'Racheli Asraf', 'Dev Request Portal – Racheli Asraf requests', 'Next Sprint', '2026-11-17', '2026-12-08', 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('FX-010', 'bug', 'Randa', 'Bug', 'Bafi Integration', 'Bafi pulls documents from the general folder instead of the claim folder', 'Reported live during a session with Randa (17.11.2026, 10:04): Bafi still pulls documents from the client''s general documents folder instead of the Claims folder. In Bafi every client has a Claims folder with a sub-folder per claim containing its own documents – the import must target the specific claim folder.', 'Critical', 'Open', 'Dev Team', 'Aviv (with Randa)', 'WhatsApp – 17.11.2026 10:04', 'Hotfix', '2026-11-17', '2026-11-24', 2, '🟢 On track', '#3 · 18/11/26 09:17 · Aviv Ashkenazi: דעדגןכהנדןו')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-001', 'roadmap', 'ClaimAI (Internal)', 'Feature', 'Claim Editing – Amounts', 'Emotional distress & linkage interest in claim amounts', 'In the amounts section of the Edit Claim window, add "Emotional Distress" and "Linkage Interest" categories – tailored especially for attorneys.', 'Medium', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Latest update (Aviv)', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-002', 'roadmap', 'ClaimAI (Internal)', 'Enhancement', 'Notice Form / Coverage Check', 'Auto-detect and auto-fill the insurance company', 'Auto-populate the Insurance Company field from the notice-form data and the coverage check, so the user does not need to set it manually when it already exists.', 'Medium', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Latest update (Aviv)', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-003', 'roadmap', 'ClaimAI (Internal)', 'Enhancement', 'Notice Form', 'Vehicle-identification guidance in the notice form', 'While filling in the notice form, show clear guidance on which vehicle is meant – the claimant''s vehicle or the third party''s vehicle.', 'Low', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Latest update (Aviv)', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-004', 'roadmap', 'ClaimAI (Internal)', 'Feature', 'Agent Claim', 'Save draft at any stage of an agent claim', 'In agent claims, allow saving a draft at any stage of claim creation, even with minimal data.', 'High', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Latest update (Aviv)', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-005', 'roadmap', 'ClaimAI (Internal)', 'Feature', 'Users & Permissions', 'Partner-user model (dual admin)', 'Add a partner-user option in which two users both hold admin permissions and all cases are fully visible and transparent to each other.', 'Medium', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Latest update (Aviv)', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-006', 'roadmap', 'ClaimAI (Internal)', 'Feature', 'Claim Calculation', 'Total-loss vehicle claim calculation', 'For total-loss vehicles the system currently calculates by damage amount instead of vehicle value. The claim should equal the price-list value minus the salvage-value offset.', 'High', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Latest update (Aviv)', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-007', 'roadmap', 'Shlomik kedem', 'Feature', 'Claim Types – Damage Report', 'Damage report only (Form 68) – insurer''s own customer', 'Allow submitting a damage report only (Form 68) for damage caused by the insurance company''s own customer – not a policy claim, not a third-party claim and not an agent claim. No garage, appraiser or damage-location selection and no mandatory fields.', 'High', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Direct request – 17.11.2026', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-008', 'roadmap', 'ClaimAI (Internal)', 'Feature', 'Claim Types – Policy Notice', 'Policy notification only – third party hit, no own damage', 'Allow submitting a claim as a notification to the policy only, for cases where the insured hit a third party but has no damage of their own – without mandatory fields such as repairing garage, appraiser report, appraiser name, etc.', 'High', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Direct request – 17.11.2026', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-009', 'roadmap', 'ClaimAI (Internal)', 'Feature', 'UI / Localization', 'Smart one-click "Translate to Hebrew" button', 'Add a smart button that translates all on-screen content to Hebrew in a single click.', 'Medium', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Direct request – 17.11.2026', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-010', 'roadmap', 'ClaimAI (Internal)', 'Upgrade', 'Notes', 'Separate the notes mechanism from reminders', 'Create a dedicated Notes button, display notes in the claim view card, and persist them so they do not disappear after re-login.', 'Medium', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-011', 'roadmap', 'ClaimAI (Internal)', 'Upgrade', 'Claim View', 'Reorder Claim View – communication history above documents', 'Move the communication-history section above the documents section in the Claim View window (higher priority).', 'Low', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-012', 'roadmap', 'ClaimAI (Internal)', 'Upgrade', 'Documents', 'New "Incident Scene Photos & Videos" document section', 'In Edit Claim, add a new document section named "Incident Scene Photos & Videos".', 'High', 'Backlog', 'Dev Team', 'Aviv Ashkenazi', 'Dev Request Portal – Original document', 'Next Sprint', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-013', 'roadmap', 'Finkel Agency', 'Enhancement', 'Outlook Integration', 'View linked documents in the built-in Outlook', 'In the built-in Outlook, allow viewing all documents linked to the claim when composing a new email.', 'Medium', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-014', 'roadmap', 'Finkel Agency', 'Enhancement', 'Email', 'Remember recipient addresses when sending from a claim', 'When sending an email from the claim row, remember previously used addresses (both To and CC).', 'Medium', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-015', 'roadmap', 'Finkel Agency', 'Enhancement', 'Email', 'Editable email subject when sending', 'When sending an email from the claim row, allow editing and changing the email subject.', 'Low', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-016', 'roadmap', 'Finkel Agency', 'Enhancement', 'Document Intake', 'Auto-capture insurer and handling garage', 'Automatically capture the insurance company from an uploaded form, and auto-fill the "Handling Garage" based on the logged-in user.', 'Medium', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-017', 'roadmap', 'Finkel Agency', 'Feature', 'Forms / Insurers', 'One-click Form 68 and non-filing generation', 'Generate Form 68 from the insurance companies in one click, and generate a non-filing declaration / send an automatic email to obtain it.', 'High', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-018', 'roadmap', 'Finkel Agency', 'Feature', 'Insurers / Coverage Check', 'Harel, Securitas and automatic consent form', 'Add Harel to the garage-arrangement list, add Securitas to the coverage check, and automatically insert the consent form after signing.', 'Medium', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-019', 'roadmap', 'Finkel Agency', 'Feature', 'Email Parsing', 'Auto-extract the claim number from insurer emails', 'Automatically extract the claim number from the insurer''s reply email and insert it into the claim card and the claims table.', 'High', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-020', 'roadmap', 'Finkel Agency', 'Enhancement', 'Alerts / Reminders', 'Unsent-claim alert and reminder search by date', 'Show a prominent alert when a claim fails to be sent from the portal, and allow searching by date in the All Reminders screen.', 'High', 'Backlog', 'Dev Team', 'Finkel Agency', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-021', 'roadmap', 'Finkel Agency', 'Feature', 'Demand Letter', 'Demand-letter preview from Edit Claim', 'Add a preview button for the demand letter inside the Edit Claim window, so the letter can be reviewed before sending.', 'Medium', 'Backlog', 'Dev Team', 'Lilach (Finkel Agency)', 'Dev Request Portal – Lilach''s requests', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-022', 'roadmap', 'Finkel Agency', 'Feature', 'Demand Letter', 'Claim-specific note in the demand letter', 'Allow adding, from the claim window, a note to that claim''s demand letter only – without changing the global letter template and without affecting demand letters of other claims.', 'Medium', 'Backlog', 'Dev Team', 'Lilach (Finkel Agency)', 'Dev Request Portal – Lilach''s requests', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-023', 'roadmap', 'Jamal Dabbah', 'Enhancement', 'Garage Report', '"Days in treatment" component in the Garages report', 'Add a "Days in treatment" tracking component to the Garages report.', 'Medium', 'Backlog', 'Dev Team', 'Jamal Dabbah', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-024', 'roadmap', 'Jamal Dabbah', 'Feature', 'Liens / Finance Companies', 'Lien-handling workflow (finance companies)', 'One-click request to the lienholder for a letter of intent approving the release of funds, including managing the correspondence with the lienholder.', 'High', 'Backlog', 'Dev Team', 'Jamal Dabbah', 'Dev Request Portal – Original document', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-025', 'roadmap', 'Jamal Dabbah', 'Feature', 'Digital Signature', 'Lien-release form for digital signature', 'Send the "Lien Release for Insurance Proceeds" form to the customer in one click, to be signed by the lienholder and returned to the agent.', 'High', 'Backlog', 'Dev Team', 'Jamal Dabbah', 'Dev Request Portal – Original document', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-026', 'roadmap', 'Jamal Dabbah', 'Feature', 'WhatsApp Bot', 'Auto-fill the notice form from the WhatsApp questionnaire', 'Allow the WhatsApp questionnaire to automatically populate the notice form.', 'High', 'Backlog', 'Dev Team', 'Jamal Dabbah', 'Dev Request Portal – Original document', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-027', 'roadmap', 'Jamal Dabbah', 'Feature', 'WhatsApp Bot / Legal', 'Non-filing declaration via the bot', 'If the WhatsApp bot receives an answer that the customer has no insurance, trigger a task to sign a non-filing declaration (attorney-verified).', 'Medium', 'Backlog', 'Dev Team', 'Jamal Dabbah', 'Dev Request Portal – Original document', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-028', 'roadmap', 'Jamal Dabbah', 'Feature', 'Reports', 'Inbound/outbound communication report', 'Generate an inbound and outbound communication report per customer (for use if legal proceedings are opened).', 'Medium', 'Backlog', 'Dev Team', 'Jamal Dabbah', 'Dev Request Portal – Original document', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-029', 'roadmap', 'Racheli Asraf', 'Feature', 'Claim Calculation', 'Automatic total-loss detection', 'Automatically detect a total loss based on the depreciation percentages in the appraiser report.', 'High', 'Backlog', 'Dev Team', 'Racheli Asraf', 'Dev Request Portal – Racheli Asraf requests', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-030', 'roadmap', 'Racheli Asraf', 'Enhancement', 'Insurers', 'Remember insurers and leasing companies entered under "Other"', 'Remember insurance companies added under the "Other" field (e.g. leasing companies) for re-use later.', 'Low', 'Backlog', 'Dev Team', 'Racheli Asraf', 'Dev Request Portal – Racheli Asraf requests', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-031', 'roadmap', 'Racheli Asraf', 'Enhancement', 'Claims List / Filters', 'Filter claims not yet sent to the insurer', 'Allow filtering by the status "not sent to insurer", with a warning icon similar to Shomera, Direct Insurance and Phoenix.', 'Medium', 'Backlog', 'Dev Team', 'Racheli Asraf', 'Dev Request Portal – Racheli Asraf requests', 'Q1 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-032', 'roadmap', 'Racheli Asraf', 'Feature', 'Users & Audit Trail', 'Per-user work allocation and action audit trail', 'For accounts where a whole team works on the same mailbox, enable allocation by user and a full audit trail of who opened the case, who edited it and further actions – for reporting.', 'High', 'Backlog', 'Dev Team', 'Racheli Asraf', 'Dev Request Portal – Racheli Asraf requests', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;
INSERT INTO product_items (id, category, client, type, module, title, description, priority, status, owner, reported_by, source, release, opened_date, target_date, days_open, health, notes)
VALUES ('RM-033', 'roadmap', 'Racheli Asraf', 'Feature', 'Claim Management', 'Duplicate a claim for a second insurer', 'Allow duplicating an existing claim in order to send it to a second insurance company when there are two third parties.', 'Medium', 'Backlog', 'Dev Team', 'Racheli Asraf', 'Dev Request Portal – Racheli Asraf requests', 'Q2 2027', '2026-11-17', NULL, 2, '🟢 On track', NULL)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, priority = EXCLUDED.priority;

-- 2. Seed CRM Clients (first 100 sample in seed script)
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L1', 'לירז יעקב', 'א.י אלמוג סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', NULL, NULL, '086466664', 'liraz@almog-ins.co.il', '05/07/2026 | 14:57 | אמרה שחסר לה קריאת ועדכון סטטוס אוטומטי וגם תשמח לסנכרון עם הבאפי, ביקשה מסמך אישור סודיות כתנאי התחלתי כדי להפיג חשש חוקי מבחינת אבטחת מידע', 'ביקשה לקבל עדכון שיש קריאת מיילים נכנסים ועדכון מסמכים וסטטוס אוטומטי
פגישה/מעקב (טקסט מקורי): כשיהיה עדכון מיילים נכנסים ובאפי
ℹ️ אוחד מ-2 שורות במקור (שורות 2, 1876)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L2', 'מאיר סימוני', 'סוכן ביטוח', 'סוכנות ביטוח', 'ליד ראשוני מהמאנדיי', 'מעוניין בשיחה', NULL, '0525021003', NULL, '15/11/2026 | 09:41 | לא ענה', 'ℹ️ אוחד מ-2 שורות במקור (שורות 3, 1020)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L3', 'ליאור לוי', 'גלדיס פחחות וצבע בע"מ', 'מוסך', 'Meeting Scheduled', NULL, NULL, '0506810094', 'gladis.pahahut@gmail.com', '16/07/2026 | 09:27 | אמור להתקשר אליי ב11', 'אימיילים נוספים: lior.levi73@gmail.com
ℹ️ אוחד מ-5 שורות במקור (שורות 4, 123, 1771, 1797, 2025)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L4', 'לירון מימוני', 'לירון סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', NULL, NULL, '0543311662', 'ins.liron@gmail.com', '19/11/2026 | 02:04 | אין מענה', 'ℹ️ אוחד מ-2 שורות במקור (שורות 5, 1899)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L5', 'Naseem Sayedahmad', 'משרד עורך דין אכרם סייד אחמד', 'עורך דין', 'Meeting Scheduled', NULL, NULL, '0509630020', 'naseem.sayedahmad@mail.huji.ac.il', '16/07/2026 | 09:31 | ביקש לדבר אחרי 11', 'פגישה/מעקב (טקסט מקורי): ראשון ב12:00
ℹ️ אוחד מ-2 שורות במקור (שורות 6, 1810)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L6', 'גיא עטרי', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '0545323378', 'guya87@gmail.com', '19/07/2026 14:04 | ביקש להתקשר בשני', '29.6  |  09:00  פגישה
ℹ️ אוחד מ-3 שורות במקור (שורות 7, 1754, 2009)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L7', 'משה (מנהל צוות תביעות)', 'קדמי סוכנות לביטוח בע"מ', 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '035017702', 'Nili@kedmi-ins.co.il', '21/07/2026 | 11:06 | משה מנהל צוות תביעות', 'ליד חם
טלפונים נוספים: 0525245588')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L8', 'Mohammed Abuleil', 'וסים חביבאללה', NULL, 'Meeting Scheduled', NULL, NULL, '0503435442', 'mohammed.abuleil@gmail.com', '13/07/2026 | 15:23 | לא ענה', 'פגישה/מעקב (טקסט מקורי): יום שני
ℹ️ אוחד מ-2 שורות במקור (שורות 9, 1816)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L9', 'מור בן שושן', 'בן שושן סוכנות לביטוח בע״מ', 'סוכנות ביטוח', 'Meeting Scheduled', NULL, NULL, '039300358', 'tviot@benshoshan.co.il', '16/07/2026 | 10:12 | אמור להתקשר אליי שיגיע למשרד', 'פגישה/מעקב (טקסט מקורי): יום חמישי
ℹ️ אוחד מ-2 שורות במקור (שורות 10, 1817)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L10', 'מיטל נגל', 'מוסך מ.מ.ב', 'מוסך', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '048729729', 'tviotbit@gmail.com', NULL, 'ℹ️ אוחד מ-2 שורות במקור (שורות 11, 1818)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L11', 'Adi Funk', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0524619930', NULL, '20/07/2026 12:48 | מחכה לראשון כדי דבר עם המנהל, ואז לקבוע דמו, ביקשה להתקשר בראשון', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L12', 'Anat Segev', NULL, NULL, '1''st Lead', 'לא טופל', NULL, '0522366050', NULL, '07/09/2026 | 12:26 | אמרה שתחזור אליי, שמתי תזכורת לחזור אליה מאוחר יותר', 'ℹ️ אוחד מ-2 שורות במקור (שורות 13, 1673)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L13', 'ניסים יוחאי ביטון', NULL, NULL, '1''st Lead', 'לא טופל', NULL, '0546697767', 'nissimbitt8@gmail.com', '22/07/2026 | 16:20 | סוכנות ביטוח של ניסים קבענו פגישה פרונטלית ל2.8 ב11:00', 'דרך הגן 40 באר גנים
ℹ️ אוחד מ-2 שורות במקור (שורות 14, 1230)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L14', 'רונן נאמן', 'מרתון רעננה, נאמן מוטורס כפר סבא', NULL, '1''st Lead', 'לא טופל', NULL, '0538910093', 'ronenmr@freesbe.com', '12/11/2026 | 12:18 | עושים להם שינוי במחשוב ביקשה לדבר שיסתיים עוד שבועיים 12.11', 'ℹ️ אוחד מ-2 שורות במקור (שורות 15, 1219)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L15', 'Batsheva Gershon', 'מאי סוכנות לביטוח', 'סוכנות ביטוח', 'Adoption Monitoring', NULL, NULL, '0522696101', 'b@may-ins.co.il', '16/11/2026 | 09:42 | אייל היה אצלה בפגישה היום', 'ℹ️ אוחד מ-3 שורות במקור (שורות 16, 34, 1663)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L16', 'Lama Alkamal', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0522310701', NULL, '19/11/2026 | 02:40 | aviv.claimai | אןי מענה', 'ℹ️ אוחד מ-2 שורות במקור (שורות 17, 40)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L17', 'אהרון כהן', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0505234952', NULL, '11/11/2026 | 09:50 | ביקש לדבר ביום ראשון', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L18', 'Maor Sasi מאור סאסי', 'מוסך מאור גדרה', 'מוסך', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0542471299', 'maorsasi25@gmail.com', '21/07/2026 | 10:19 | מעוניין ביקש לדבר בראשון | 11/10/2026: נקבעה פגישת הדרכה (מאנדיי)', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L19', 'איציק ואורלי פישר', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0506588819', NULL, '16/07/2026 | 15:19 | ביקשה לקבל חומר כתוב בוואטסאפ להציג לבוס', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L20', 'Kobi Doron', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0528769921', NULL, '16/07/2026 | 14:35 | ביקש להתקשר בראשון', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L21', 'נטלי יהודה', 'אליפים סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'אין מענה', NULL, '035663113', 'nataliey@elifim.co.il', '21/07/2026 09:15 | התקשרתי למחלקת תביעות ולא ענו', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L22', 'Romi Barzilay Namdar', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '0503263260', 'romi@hozkot.co.il', '16/07/2026 | 14:25 | מעוניינת קבענו שיחה ב11', 'פגישה/מעקב (טקסט מקורי): יום שלישי ב11')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L23', 'מומיק כהן', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '0505208087', NULL, '19/07/2026 15:59 | קבענו פגישה ל27 פגישת התחברות', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L24', 'לוצקין ביטוחים, אפרת', NULL, 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0587610700', NULL, '16/07/2026 | 10:18 | אמורה לחזור אליי אפרת, להתקשר שוב מחר', 'טלפונים נוספים: 029995000')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L25', 'אתי כהן', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0506486667', NULL, '23/07/2026 | 09:03 | צריך לשלוח לה חומר לוואטסאפ כדי שתציג להנהלה', 'כן')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L26', 'Roy Darvish', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '0526246246', NULL, '14/07/2026 | 14:31 | בעל מוסך מעוניין קבענו פגישה לחמישי | 30/10/2026: ליד חוזר ממאנדיי', 'יום חמישי ב15:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L27', 'Guy Melinger', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0546387033', NULL, '16/07/2026 | 14:38 | ביקש לדבר בספטמבר אחרי החגים', 'יום חמישי ב14:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L28', 'Loret', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '0507253140', 'Loret.insurance@gmail.com', '14/07/2026 | 12:45 | קבענו פגישת דמו ליום חמישי', 'יום חמישי')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L29', 'דקל (סוניה)', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '050689388905087868510556633925', NULL, '30/06/2026 | 13:33 |  מעוניין אבל נוסע לחו''''" ביקש לחזור אליו עוד חודש וחצי', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L30', 'אבי בסול', NULL, 'מוסך', '1''st Lead', 'לא טופל', NULL, '0524316888', NULL, '20/07/2026 13:58 | אין מענה, היה מעוניין לדבר', 'בעל מוסך
ℹ️ אוחד מ-2 שורות במקור (שורות 31, 1153)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L31', 'Ravit Guy Dror', NULL, NULL, '1''st Lead', 'לא טופל', NULL, '0507370820', NULL, '13/07/2026 | 15:21 | לקחה את המספר שלי כדי לחזור אליי מאוחר יותר', 'ℹ️ אוחד מ-2 שורות במקור (שורות 32, 1148)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L32', 'סאלים דהאמשה', NULL, NULL, 'Meeting Scheduled', NULL, NULL, '0543703570', NULL, '20/07/2026 14:00 | ביקש לחזור אליו מאוחר יותר', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L33', 'גלי מנשירוב', NULL, NULL, 'Irrelevant', 'מעוניין בשיחה', NULL, '0525851088', NULL, '18/11/2026 | 10:54 | אמרה שלא רלונטי', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L34', 'גבריאל וטורי', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0525474442', NULL, '13/07/2026 | 09:32 | לא עונה 2', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L35', 'יוסי מלכה', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0547400418', NULL, '14/07/2026 | 11:18 | לא ענה', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L36', 'פרח ששון', 'פיני רייך', NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0509281135', 'perach@pinir.co.il', '13/07/2026 | 14:45 | מחכים שפיני יחזור כדי לחבר את המייל מהאדמין שלו', 'ℹ️ אוחד מ-4 שורות במקור (שורות 38, 1723, 1953, 1986)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L37', 'הרשקוביץ כפיר', 'מוסך / מרכז שירות', 'מוסך', '1''st Lead', 'לא טופל', NULL, '0537629050', NULL, '15/11/2026 | 11:43 | מספר מנותק', 'מקור: ממומן מטא
ℹ️ אוחד מ-4 שורות במקור (שורות 39, 177, 1084, 1619)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L38', 'סימה', 'סוכנות גולדפרב', 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0503009416', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L39', 'דיאנה באר שבע', NULL, NULL, 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0522704954', NULL, '26/07/2026 | 12:25 | ביקשה לדבר בתחילת חודש', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L40', 'ליאת דניאל', NULL, 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0527752626', NULL, '20/07/2026 13:20 | ביקשה להתקשר ב16:00 מעוניינת', 'סוכנת ביטוח
ℹ️ אוחד מ-2 שורות במקור (שורות 43, 631)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L41', 'רוהאם הדיה', 'האדיה רוהאם, משרד עוכי דין', NULL, 'Meeting Scheduled', NULL, NULL, '0544241351', 'roham@hadye.co.il', '09/07/2026 | 12:35 | דיברנו, סוכם שיכין מסמך דרישות ונתעדכן בהמשך', '​למצוא מיילים שיצאו מתיבה שלו
​ביקש לצפות במסמכים בלי להוריד אותם
​ביקש להוסיף שדה של מספר חשבונית בלבד, ללא צירוף מסמך מלווה.
​ביקש סינכרון של דואר נכנס/יוצא בחיווי.
​ביקש סינכרון של מידע בשני הכיוונים עם המערכת שלו, שכל הלקוחות שלו יוכלו להתעדכן / כתוספת במערכת שלו וגם בשביל השימוש שלו וחיסכון עבודה
טלפונים נוספים: 0777660850
אימיילים נוספים: office@master-sn.co.il
ℹ️ אוחד מ-6 שורות במקור (שורות 44, 596, 632, 1764, 1897, 2019)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L42', 'רעות צורים ביטוחים', 'יהודה צורים סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0545215530', 'reut@zurim.co.il', '20/07/2026 14:36 | בנימים היה אצלה, ביקשה להתקשר עוד שעה', 'טלפונים נוספים: 035608485
אימיילים נוספים: REUT@ZURIM.CO.IL
ℹ️ אוחד מ-3 שורות במקור (שורות 45, 1704, 1933)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L43', 'אורלי וולף ביטוחים', NULL, 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0522533422', NULL, '20/07/2026 14:39 | בנימין דיבר איתה ביקשה לדבר מחר בבוקר', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L44', 'איתן מרכז שירותי רכב', NULL, 'מוסך', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0503981567', NULL, '29/07/2026 | 14:46 | מעוניין מאד היה בחופשה', 'פגישה/מעקב (טקסט מקורי): יום ראשון השני של אוגוסט')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L45', 'מקאלדה לביטוח', 'סוכן', 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0505500053', NULL, '06/09/2026 | 14:37 | קבענו לדבר מחר בבוקר', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L46', 'Abed Jaber', 'סוכן', 'סוכנות ביטוח', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0505634503', NULL, '06/09/2026 | 12:51 | מעוניין במערכת ביקש לדבר בסוף החודש כי בדיוק ביצע תשלום גדול | 30/10/2026: ליד חוזר ממאנדיי (ליד חדש)', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L47', 'תהל פיטרו', 'מסלק', 'חברת ניהול תביעות', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0545308116', NULL, '06/09/2026 | 12:26 | מעוניין, ביקש לשלוח וואטסאפ עם קישור לאתר ולדבר עוד שבוע', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L48', 'דרור מזור', 'מוסך', 'מוסך', 'Meeting Scheduled', 'מעוניין בשיחה', NULL, '0522783279', NULL, '06/09/2026 | 11:55 | מעוניין בשיחה מטפל בצדי ג''', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L49', 'ג''ריס בראנסי', 'סוכן', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0526648881', NULL, '07/09/2026 | 13:51 | ביקש לדבר מחר | 06/09/2026: נקבעה פגישת הדרכה (מאנדיי)', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L50', 'אהרן שעיה', 'בעלים של צי רכב', 'מוסך', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0543004632', 'alextaxi125@gmail.com', '07/09/2026 | 13:52 | התעניין בדמו על המערכת קבענו לקבוע שיחת דמו ברביעי | 06/09/2026: נקבעה פגישת הדרכה (מאנדיי)', 'ℹ️ אוחד מ-4 שורות במקור (שורות 53, 1534, 1693, 1980)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L51', 'כפיר היימן', 'היימן סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', NULL, NULL, '0506882865', 'kfir@haiman-ins.com', '05/11/2026 | 13:33 | בוצעה הדרכה עם אתי', 'נקבעה הדרכה ל - 4.11')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L52', 'איימן אבו עקסה', 'עזאם עזיז', NULL, 'Meeting Scheduled', 'בתהליך לקביעת דמו', NULL, '0524668110', 'a0524668110@gmail.com', '29/06/2026 10:35  ביקש להתקשר מחר 30.6 | 04/10/2026: בתהליך לקביעת דמו (מאנדיי, 3 נסיונות)', 'ℹ️ אוחד מ-4 שורות במקור (שורות 55, 789, 1780, 2034)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L53', 'מזל פרץ', 'חן חסון ליסינג', NULL, 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0547372670', NULL, '09/09/2026: נקבעה פגישת הדרכה (מאנדיי, 3 נסיונות)', 'ℹ️ אוחד מ-2 שורות במקור (שורות 56, 1111)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L54', 'שושנה פרץ', NULL, NULL, 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0507835519', NULL, '02/07/2026 | 14:30 |  השאיר פרטים בטעות | 01/10/2026: חזר ונקבעה פגישת הדרכה (מאנדיי)', 'ℹ️ אוחד מ-2 שורות במקור (שורות 57, 1140)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L55', 'שילי אהרון', 'אמנון אהרון ובנו סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'בתהליך לקביעת דמו', NULL, '0505482148', 'shayli@ains.co.il', 'בתהליך לקביעת דמו (מאנדיי)', 'ℹ️ אוחד מ-2 שורות במקור (שורות 58, 1906)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L56', 'galit hadas', 'על הגל שרותי רכב', 'מוסך', 'Meeting Scheduled', 'בתהליך לקביעת דמו', NULL, '046330313', 'galithadas@gmail.com', 'בתהליך לקביעת דמו (מאנדיי)', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L57', 'Леонид Гельман', NULL, NULL, 'Meeting Scheduled', 'בתהליך לקביעת דמו', NULL, '0549252285', NULL, 'בתהליך לקביעת דמו (מאנדיי)', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L58', 'chen gal', 'חן הלפרין גיא עזרא משרד עורכי דין', 'עורך דין', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0527913939', 'chengalaw@gmail.com', '17/09/2026: נקבעה פגישת הדרכה (מאנדיי)', 'נינה גולבץ: 054-6375507
ℹ️ אוחד מ-2 שורות במקור (שורות 61, 1845)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L59', 'moshe taieb', 'טייב', NULL, 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0542503556', 'moshetaieb2016@gmail.com', 'נקבעה פגישת הדרכה במאנדיי', 'ℹ️ אוחד מ-2 שורות במקור (שורות 62, 1807)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L60', 'נסים ראבי', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0549233414', 'naseem.r1989@gmail.com', 'נקבעה פגישת הדרכה (מאנדיי)', 'מקור: ממומן מטא
ℹ️ אוחד מ-2 שורות במקור (שורות 63, 1887)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L61', 'Beni, ביידס', 'אחר', NULL, 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0505535330', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L62', 'Hammodi Salami', 'משרד עורכי דין תביעות רכב', 'עורך דין', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0509967257', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L63', 'Ofer Shita', 'סוכנות שחם-אורלן - Orlan', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0525553555', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'סוכן ביטוח
ℹ️ אוחד מ-2 שורות במקור (שורות 66, 1450)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L64', 'מוסך אלוקאלה', 'מוסך / מרכז שירות', 'מוסך', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0502020050', NULL, 'נקבעה פגישת הדרכה (מאנדיי, 2 נסיונות)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L65', 'יבגני גולבטס (אלכס מיליאבסקי מנהל)', 'י.ל.מ מוסך, פרופיל מרכז שירות', 'מוסך', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0538333977', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'הפטיש 4 נס ציונה')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L66', 'Yosef Zemach', 'מוסך יוסי צמח', 'מוסך', '1''st Lead', 'אין מענה', NULL, '0508585956', 'mosachzemach@gmail.com', '14/07/2026 | 14:20 | אין מענה', 'ברוך הירש 26 בני ברק
ℹ️ אוחד מ-2 שורות במקור (שורות 69, 1177)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L67', 'בדיר רשיד', 'חברה לניהול תביעות רכב', 'חברת ניהול תביעות', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0535553177', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L68', 'עמוס ארצי', 'ארצי מוטורס', 'מוסך', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0503079551', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'מוסך | איש קשר: דנה 0525252246')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L69', 'אביבה', 'אביבה ביטוחים', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0522634414', 'am025879888@gmail.com', 'נקבעה פגישת הדרכה (מאנדיי)', 'סוכן ביטוח')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L70', 'Ahmad Naiem Geath אחמד נעים', 'משרד עורכי דין תביעות רכב', 'עורך דין', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0549270690', NULL, 'נקבעה פגישת הדרכה (מאנדיי, 1 נסיון)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L71', 'Artyom Dadash', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0542406420', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'מקור: ממומן מטא
ℹ️ אוחד מ-3 שורות במקור (שורות 74, 1025, 1256)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L72', 'סאלח דהאמשה', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0505312234', 'topins007@gmail.com', 'נקבעה פגישת הדרכה (מאנדיי, 4 נסיונות)', 'מקור: ממומן מטא
ℹ️ אוחד מ-3 שורות במקור (שורות 75, 1143, 1560)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L73', 'Doron Ratzon', 'כל-ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0503838383', 'doron@allinsure.com', 'נקבעה פגישת הדרכה (מאנדיי)', 'גולדן הירש 24')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L74', 'רועי מורי', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0542234569', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L75', 'Bassam Daood רוזלין', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0544347800', NULL, 'נקבעה פגישת הדרכה (מאנדיי)', 'רוזלין: 0747506064
ℹ️ אוחד מ-2 שורות במקור (שורות 78, 1644)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L76', 'Miki Yor מיקי', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0504060744', 'service4@d-ins.co.il', 'נקבעה פגישת הדרכה (מאנדיי)', 'פרי: 0504988963
אימיילים נוספים: miki410@gmail.com
ℹ️ אוחד מ-2 שורות במקור (שורות 79, 1962)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L77', 'Elram Nefosi', 'אלרם סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0524043185', 'elram@gal-almagor.co.il', 'נקבעה פגישת הדרכה (מאנדיי)', 'המלאכה 22 נתניה
ℹ️ אוחד מ-2 שורות במקור (שורות 80, 615)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L78', 'Eran Hasson', 'חסון סוכנות לביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0508361277', 'eran@hasson-ins.co.il', 'נקבעה פגישת הדרכה (מאנדיי)', 'סוכן ביטוח')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L79', 'Yehudit Gagi Adv', 'משרד עורכי דין תביעות רכב', 'עורך דין', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0506256454', 'gagilaw55@gmail.com', 'נקבעה פגישת הדרכה (מאנדיי, 2 נסיונות)', 'מקור: ממומן מטא
ℹ️ אוחד מ-2 שורות במקור (שורות 82, 1592)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L80', 'ציפי קצב', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה פגישת הדרכה', NULL, '0542611620', 'gifttolove@gmail.com', 'נקבעה פגישת הדרכה (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L81', 'Meryam Briq Gadban', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', '1''st Lead', 'אין מענה', NULL, '0548121861', 'meryam_raed@hotmail.com', '13/07/2026 | 15:42 | אין מענה', 'תסנים: 0522968866
ℹ️ אוחד מ-4 שורות במקור (שורות 84, 1052, 1215, 1670)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L82', 'צמיגים, שטיפת מכוניות, ומוסך -סימון דן', 'מוסך / מרכז שירות', 'מוסך', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0524496111', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L83', 'Kamil fares', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0544666699', NULL, 'נקבעה שיחת ראשונית (מאנדיי, 1 נסיון)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L84', 'זהר לבב', 'ביטוח לבב', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0505338024', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'סוכן ביטוח')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L85', 'Shay Regev', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0522660536', NULL, 'נקבעה שיחת ראשונית (מאנדיי, 3 נסיונות)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L86', 'בסאם זהר', 'מוסך / מרכז שירות', 'מוסך', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0503557766', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא
ℹ️ אוחד מ-2 שורות במקור (שורות 89, 1567)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L87', 'Izik Ben Shimol', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0505224944', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L88', 'תמיר לסרי', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0528179595', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L89', 'לירן אפרגן', 'משרד עורכי דין תביעות רכב', 'עורך דין', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0504656530', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L90', 'שרון לבנון', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0544293193', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L91', 'Michal Kapeta', 'מוסך / מרכז שירות', 'מוסך', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0523715054', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא
ℹ️ אוחד מ-3 שורות במקור (שורות 94, 925, 1345)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L92', 'Shereen Samara', 'חברה לניהול תביעות רכב', 'חברת ניהול תביעות', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0527222258', NULL, 'נקבעה שיחת ראשונית (מאנדיי, 2 נסיונות)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L93', 'צחי שלום', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0503525354', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L94', 'אלי כהן עבור חברילדות הררי יצחק', 'אחר', NULL, 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0522536322', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L95', 'אביטל קינן', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0546623600', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L96', 'Ahmad Khalifa', 'משרד עורכי דין תביעות רכב', 'עורך דין', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0546739567', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L97', 'dudy benita', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0546274831', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L98', 'Rami', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0542634123', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L99', 'מאיר אלקבץ', 'סוכן ביטוח / סוכנות ביטוח', 'סוכנות ביטוח', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0503333072', NULL, 'נקבעה שיחת ראשונית (מאנדיי)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
INSERT INTO crm_clients (id, name, company, business_type, status, sub_status, assigned_to, phone, email, last_note, general_notes)
VALUES ('L100', 'ענבל יעל פלאח יעקב', 'משרד עורכי דין תביעות רכב', 'עורך דין', 'Meeting Scheduled', 'נקבעה שיחה ראשונית', NULL, '0532704662', NULL, 'נקבעה שיחת ראשונית (מאנדיי, 1 נסיון)', 'מקור: ממומן מטא')
ON CONFLICT (id) DO NOTHING;
