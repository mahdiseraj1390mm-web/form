const fs = require('fs');

const file = 'src/context/form-context.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add updateSubmissionData to interface FormContextType
const ifaceTarget = `  updateSubmissionStatus: (submissionId: string, newStatus: SubmissionStatus) => void;`;
const ifaceRepl = `  updateSubmissionStatus: (submissionId: string, newStatus: SubmissionStatus) => void;
  updateSubmissionData: (submissionId: string, updatedFields: Record<string, any>) => void;`;

if (!content.includes('updateSubmissionData:')) {
  content = content.replace(ifaceTarget, ifaceRepl);
}

// 2. Add implementation of updateSubmissionData
const fnTarget = `  const updateSubmissionStatus = (submissionId: string, newStatus: SubmissionStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s))
    );
  };`;

const fnRepl = `  const updateSubmissionStatus = (submissionId: string, newStatus: SubmissionStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s))
    );
  };

  const updateSubmissionData = (submissionId: string, updatedFields: Record<string, any>) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId || s.trackingCode === submissionId || (s.data && s.data.caseCode === submissionId)) {
          return {
            ...s,
            data: { ...s.data, ...updatedFields },
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    try {
      fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_submission_data',
          submissionId,
          updatedFields,
        }),
      }).catch(() => {});
    } catch {}
  };`;

if (!content.includes('const updateSubmissionData =')) {
  content = content.replace(fnTarget, fnRepl);
}

// 3. Export updateSubmissionData in value={{ ... }}
const exportTarget = `        updateSubmissionStatus,
        addSubmissionComment,`;
const exportRepl = `        updateSubmissionStatus,
        updateSubmissionData,
        addSubmissionComment,`;

if (!content.includes('updateSubmissionData,') || content.indexOf('updateSubmissionData,') === content.lastIndexOf('updateSubmissionData,')) {
  content = content.replace(exportTarget, exportRepl);
}

// 4. Update cache version and ensure fields always use base.fields
content = content.replace(/const CACHE_VERSION = 'v-2026-11-01-counselor-visibility-v15';/, `const CACHE_VERSION = 'v-2026-11-06-mandatory-fields-v16';`);

const baseReplTarget = `          return {
            ...base,
            ...f,
            generalSettings: {`;
const baseReplNew = `          return {
            ...base,
            ...f,
            fields: base.fields,
            steps: base.steps,
            rules: base.rules,
            generalSettings: {`;
if (content.includes(baseReplTarget)) {
  content = content.replace(baseReplTarget, baseReplNew);
}

fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
console.log('form-context.tsx patched successfully');
