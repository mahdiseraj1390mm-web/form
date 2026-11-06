const fs = require('fs');

const file = 'src/components/submissions/client-dossier-fullview.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state and methods after isExportingExcel state
const stateTarget = `  const [isExportingExcel, setIsExportingExcel] = useState(false);`;
const stateRepl = `  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // استیت و متدهای ویرایش مشخصات مراجع توسط مشاور
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    f_name: '',
    f_family: '',
    f_mobile: '',
    f_birth_date: '',
    f_role_in_family: '',
    f_family_members: '',
    f_marital_status: '',
    f_children_count: '',
    f_province_city: '',
    f_school_name: '',
    f_school_supervisor: '',
    f_mentor_name: '',
    f_physical_illness: '',
    f_mental_illness: '',
    f_medications: '',
  });

  const openEditProfileModal = () => {
    setEditProfileForm({
      f_name: combinedData.f_name || '',
      f_family: combinedData.f_family || '',
      f_mobile: clientCase.mobile || combinedData.f_mobile || '',
      f_birth_date: combinedData.f_birth_date || '',
      f_role_in_family: combinedData.f_role_in_family || clientCase.roleInFamily || '',
      f_family_members: combinedData.f_family_members || '',
      f_marital_status: combinedData.f_marital_status || '',
      f_children_count: combinedData.f_children_count || combinedData.children_count || '',
      f_province_city: clientCase.provinceCity || combinedData.f_province_city || '',
      f_school_name: combinedData.f_school_name || '',
      f_school_supervisor: combinedData.f_school_supervisor || '',
      f_mentor_name: combinedData.f_mentor_name || '',
      f_physical_illness: combinedData.f_physical_illness || '',
      f_mental_illness: combinedData.f_mental_illness || '',
      f_medications: combinedData.f_medications || '',
    });
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfileEdit = () => {
    const targetSub = clientCase.submissions[0];
    if (!targetSub) return;

    updateSubmissionData(targetSub.id, editProfileForm);

    const changes: string[] = [];
    if (editProfileForm.f_physical_illness !== combinedData.f_physical_illness) changes.push(\`بیماری جسمی: \${editProfileForm.f_physical_illness}\`);
    if (editProfileForm.f_mental_illness !== combinedData.f_mental_illness) changes.push(\`بیماری روحی: \${editProfileForm.f_mental_illness}\`);
    if (editProfileForm.f_medications !== combinedData.f_medications) changes.push(\`داروها: \${editProfileForm.f_medications}\`);
    if (editProfileForm.f_marital_status !== combinedData.f_marital_status) changes.push(\`وضعیت تاهل: \${editProfileForm.f_marital_status}\`);
    
    const summary = changes.length > 0 ? changes.join(' | ') : 'ویرایش اطلاعات هویتی و سلامت';
    addSubmissionComment(targetSub.id, adminName, adminRole, \`✏️ ویرایش پرونده مراجع توسط مشاور: \${summary}\`);

    setIsEditProfileModalOpen(false);
  };`;

if (!content.includes('isEditProfileModalOpen')) {
  content = content.replace(stateTarget, stateRepl);
}

// 2. Add Edit button on Profile tab
const profileHeaderTarget = `<div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center gap-2">
                <User className="w-4 h-4 text-[#173f6b]" />
                <h3 className="text-sm font-extrabold text-slate-900">مشخصات هویتی و فردی مراجع</h3>
              </div>`;

const profileHeaderRepl = `<div className="p-5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#173f6b]" />
                  <h3 className="text-sm font-extrabold text-slate-900">مشخصات هویتی و فردی مراجع</h3>
                </div>
                <button
                  onClick={openEditProfileModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold transition cursor-pointer"
                >
                  <Edit className="size-3.5" />
                  <span>ویرایش مشخصات مراجع</span>
                </button>
              </div>`;

if (content.includes(profileHeaderTarget)) {
  content = content.replace(profileHeaderTarget, profileHeaderRepl);
}

// 3. Add Edit modal at bottom of component right before the last </div>
const modalHtml = `
      {/* مودال ویرایش مشخصات مراجع توسط مشاور */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in" dir="rtl">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">ویرایش پرونده و شرح‌حال مراجع</h3>
                  <p className="text-[11px] text-slate-400">به‌روزرسانی سوابق بیماری، اطلاعات هویتی و تغییرات دوره‌ای مراجع</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام خانوادگی:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_family}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_family: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تلفن همراه:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_mobile}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_mobile: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاریخ تولد (شمسی):</label>
                  <input
                    type="text"
                    placeholder="روز / ماه / سال"
                    value={editProfileForm.f_birth_date}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_birth_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">وضعیت تأهل:</label>
                  <select
                    value={editProfileForm.f_marital_status}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_marital_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="مجرد">مجرد</option>
                    <option value="متاهل">متاهل</option>
                    <option value="مطلقه">مطلقه</option>
                    <option value="همسر فوت شده">همسر فوت شده</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نقش در خانواده:</label>
                  <select
                    value={editProfileForm.f_role_in_family}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_role_in_family: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="پدر">پدر</option>
                    <option value="مادر">مادر</option>
                    <option value="دختر">دختر</option>
                    <option value="پسر">پسر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تعداد اعضای خانواده:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_family_members}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_family_members: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">استان و شهرستان:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_province_city}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_province_city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* بخش سلامت و بیماری‌ها */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs font-black text-rose-700">سوابق سلامت و بیماری‌ها (شرح‌حال پزشک/مشاور):</div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سابقه بیماری جسمی:</label>
                  <textarea
                    rows={2}
                    placeholder="در صورت عدم بیماری بنویسید «ندارم»..."
                    value={editProfileForm.f_physical_illness}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_physical_illness: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سابقه بیماری روحی/روانی:</label>
                  <textarea
                    rows={2}
                    placeholder="در صورت عدم بیماری بنویسید «ندارم»..."
                    value={editProfileForm.f_mental_illness}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_mental_illness: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">داروهای مصرفی:</label>
                  <textarea
                    rows={2}
                    placeholder="در صورت عدم مصرف بنویسید «ندارم»..."
                    value={editProfileForm.f_medications}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_medications: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* مدرسه معارفی */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام مدرسه معارفی:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_school_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_school_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ناظم مدرسه:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_school_supervisor}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_school_supervisor: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">مربی تربیتی:</label>
                  <input
                    type="text"
                    value={editProfileForm.f_mentor_name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, f_mentor_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveProfileEdit}
                className="px-5 py-2.5 rounded-xl bg-[#173f6b] hover:bg-[#123357] text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره تغییرات در پرونده</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;

const lastDivIdx = content.lastIndexOf('</div>');
if (lastDivIdx !== -1 && !content.includes('isEditProfileModalOpen && (')) {
  content = content.slice(0, lastDivIdx) + modalHtml + '\n' + content.slice(lastDivIdx);
}

fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
console.log('client-dossier-fullview.tsx (part 2) patched successfully');
