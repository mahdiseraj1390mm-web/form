const fs = require('fs');
const content = fs.readFileSync('src/lib/belhagh-forms.ts', 'utf8');
const lines = content.split('\n');
const fields = [];
let f = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/id:\s*['"]([^'"]+)['"]/);
  if (m && !line.includes('form-') && !line.includes('step-') && !line.includes('opt-')) {
    if (f) fields.push(f);
    f = { id: m[1], line: i + 1, text: line };
  } else if (f) {
    f.text += ' ' + line;
  }
}
if (f) fields.push(f);

console.log('Total fields found:', fields.length);
fields.forEach(field => {
  const isReq = field.text.includes('required: true');
  if (!isReq && !field.id.startsWith('f_phone_') && !field.id.startsWith('f_alert_')) {
    console.log('Not required:', field.id, 'line:', field.line);
  }
});
