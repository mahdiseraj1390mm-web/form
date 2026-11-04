const fs = require('fs');
const path = require('path');

// 1. Update submissions-hub.tsx
const hubPath = path.join(__dirname, '..', 'src', 'components', 'submissions', 'submissions-hub.tsx');
let hubContent = fs.readFileSync(hubPath, 'utf8');

// Replace the highlighted cell where fullName is shown
const oldCell = `{/* نام مراجع و آواتار */}
                        <td className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {c.fullName.slice(0, 1)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{c.fullName}</span>
                              {c.roleInFamily && (
                                <span className="text-[11px] text-slate-400 block -mt-0.5">
                                  نقش: {c.roleInFamily} خانواده
                                </span>
                              )}
                            </div>
                          </div>
                        </td>`;

const newCell = `{/* مشخصات مراجع - نمایش کد پرونده و نقش (حفظ محرمانگی) */}
                        <td className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 shadow-2xs">
                              SP
                            </div>
                            <div>
                              <span className="font-mono font-black text-slate-900 block text-xs">{c.caseCode}</span>
                              {c.roleInFamily && (
                                <span className="text-[11px] text-slate-400 block -mt-0.5">
                                  نقش: {c.roleInFamily} خانواده
                                </span>
                              )}
                            </div>
                          </div>
                        </td>`;

if (hubContent.includes('{c.fullName.slice(0, 1)}')) {
  hubContent = hubContent.replace(
    /\{\/\* نام مراجع و آواتار \*\/\}[\s\S]*?<\/td>/,
    newCell
  );
  fs.writeFileSync(hubPath, hubContent, 'utf8');
  console.log('Submissions-hub updated: client name replaced with case code!');
} else {
  console.log('Could not find avatar pattern in submissions-hub');
}
