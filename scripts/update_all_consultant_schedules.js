const fs = require('fs');
const path = require('path');

function makeDaySchedule(periods) {
  return {
    enabled: true,
    periods: periods.map(([startHour, endHour]) => ({ startHour, endHour })),
  };
}

function makeSchedule({
  availableDays,
  startHour,
  endHour,
  daySchedulesMap = {},
  slotDurationMinutes = 45,
  restTimeMinutes = 15,
  topicSchedules = undefined,
}) {
  const daySchedules = {};
  for (const dayIdx of availableDays) {
    if (daySchedulesMap[dayIdx]) {
      daySchedules[dayIdx] = makeDaySchedule(daySchedulesMap[dayIdx]);
    } else {
      daySchedules[dayIdx] = makeDaySchedule([[startHour, endHour]]);
    }
  }
  return {
    slotDurationMinutes,
    restTimeMinutes,
    availableDays,
    startHour,
    endHour,
    daySchedules,
    holidays: ['جمعه'],
    capacityPerSlot: 1,
    topicSchedules:
      topicSchedules && Object.keys(topicSchedules).length > 0 ? topicSchedules : undefined,
  };
}

// تعریف دقیق زمان‌بندی هر موضوع با کلید یکتای رسمی (child | teen | education | clinical | family)
function buildConsultantConfigMap(borhaniDays = [0, 1, 2]) {
  // ۱. خانم انصاری (کودک و نوجوان)
  const ansariChild = makeSchedule({
    availableDays: [0, 1, 2],
    startHour: '10:00',
    endHour: '19:00',
    daySchedulesMap: {
      0: [['15:00', '19:00']],
      1: [['10:00', '12:00'], ['15:00', '16:00']],
      2: [['10:00', '12:00']],
    },
  });
  const ansariTeen = makeSchedule({
    availableDays: [2, 3, 4],
    startHour: '10:00',
    endHour: '19:00',
    daySchedulesMap: {
      2: [['15:00', '17:00']],
      3: [['15:00', '17:00'], ['18:00', '19:00']],
      4: [['10:00', '12:00']],
    },
  });
  const ansariTopics = { child: ansariChild, teen: ansariTeen };
  const ansariWorkingHours = makeSchedule({
    availableDays: [0, 1, 2, 3, 4],
    startHour: '10:00',
    endHour: '19:00',
    daySchedulesMap: {
      0: [['15:00', '19:00']],
      1: [['10:00', '12:00'], ['15:00', '16:00']],
      2: [['10:00', '12:00'], ['15:00', '17:00']],
      3: [['15:00', '17:00'], ['18:00', '19:00']],
      4: [['10:00', '12:00']],
    },
    topicSchedules: ansariTopics,
  });

  // ۲. خانم شوندی (کودک و نوجوان)
  const shavandiChild = makeSchedule({
    availableDays: [0, 2, 4],
    startHour: '13:00',
    endHour: '15:00',
    daySchedulesMap: {
      0: [['13:00', '15:00']],
      2: [['13:00', '15:00']],
      4: [['13:00', '15:00']],
    },
  });
  const shavandiTeen = makeSchedule({
    availableDays: [1, 3],
    startHour: '13:00',
    endHour: '15:00',
    daySchedulesMap: {
      1: [['13:00', '15:00']],
      3: [['13:00', '15:00']],
    },
  });
  const shavandiTopics = { child: shavandiChild, teen: shavandiTeen };
  const shavandiWorkingHours = makeSchedule({
    availableDays: [0, 1, 2, 3, 4],
    startHour: '13:00',
    endHour: '15:00',
    daySchedulesMap: {
      0: [['13:00', '15:00']],
      1: [['13:00', '15:00']],
      2: [['13:00', '15:00']],
      3: [['13:00', '15:00']],
      4: [['13:00', '15:00']],
    },
    topicSchedules: shavandiTopics,
  });

  // ۳. خانم زینلی (کودک و ازدواج/خانواده)
  const zeynaliFamily = makeSchedule({
    availableDays: [3],
    startHour: '17:00',
    endHour: '18:00',
    daySchedulesMap: { 3: [['17:00', '18:00']] },
  });
  const zeynaliChild = makeSchedule({
    availableDays: [5],
    startHour: '09:00',
    endHour: '11:00',
    daySchedulesMap: { 5: [['09:00', '11:00']] },
  });
  const zeynaliTopics = { child: zeynaliChild, family: zeynaliFamily };
  const zeynaliWorkingHours = makeSchedule({
    availableDays: [3, 5],
    startHour: '09:00',
    endHour: '18:00',
    daySchedulesMap: {
      3: [['17:00', '18:00']],
      5: [['09:00', '11:00']],
    },
    topicSchedules: zeynaliTopics,
  });

  // ۴. خانم راستگو (نوجوان و بالینی)
  const rastgooTeen = makeSchedule({
    availableDays: [1],
    startHour: '10:00',
    endHour: '14:00',
    daySchedulesMap: { 1: [['10:00', '14:00']] },
  });
  const rastgooClinical = makeSchedule({
    availableDays: [1],
    startHour: '18:00',
    endHour: '20:00',
    daySchedulesMap: { 1: [['18:00', '20:00']] },
  });
  const rastgooTopics = { teen: rastgooTeen, clinical: rastgooClinical };
  const rastgooWorkingHours = makeSchedule({
    availableDays: [1],
    startHour: '10:00',
    endHour: '20:00',
    daySchedulesMap: {
      1: [['10:00', '14:00'], ['18:00', '20:00']],
    },
    topicSchedules: rastgooTopics,
  });

  // ۵. علیرضا برهانی (نوجوان و خانواده) - حفظ روزهای انتخابی مدیر در پنل
  const borhaniDayMap = {};
  for (const d of borhaniDays) borhaniDayMap[d] = [['16:00', '20:30']];
  const borhaniTeen = makeSchedule({
    availableDays: [...borhaniDays],
    startHour: '16:00',
    endHour: '20:30',
    daySchedulesMap: borhaniDayMap,
  });
  const borhaniFamily = makeSchedule({
    availableDays: [...borhaniDays],
    startHour: '16:00',
    endHour: '20:30',
    daySchedulesMap: borhaniDayMap,
  });
  const borhaniTopics = { teen: borhaniTeen, family: borhaniFamily };
  const borhaniWorkingHours = makeSchedule({
    availableDays: [...borhaniDays],
    startHour: '16:00',
    endHour: '20:30',
    daySchedulesMap: borhaniDayMap,
    topicSchedules: borhaniTopics,
  });

  // ۶. خانم کریمی (ازدواج و خانواده)
  const karimiFamily = makeSchedule({
    availableDays: [1, 3],
    startHour: '10:00',
    endHour: '12:00',
    daySchedulesMap: {
      1: [['10:00', '12:00']],
      3: [['10:00', '12:00']],
    },
  });
  const karimiTopics = { family: karimiFamily };
  const karimiWorkingHours = makeSchedule({
    availableDays: [1, 3],
    startHour: '10:00',
    endHour: '12:00',
    daySchedulesMap: {
      1: [['10:00', '12:00']],
      3: [['10:00', '12:00']],
    },
    topicSchedules: karimiTopics,
  });

  // ۷. خانم گلیایی (بالینی)
  const golyayiClinical = makeSchedule({
    availableDays: [2],
    startHour: '11:00',
    endHour: '12:00',
    daySchedulesMap: { 2: [['11:00', '12:00']] },
  });
  const golyayiTopics = { clinical: golyayiClinical };
  const golyayiWorkingHours = makeSchedule({
    availableDays: [2],
    startHour: '11:00',
    endHour: '12:00',
    daySchedulesMap: { 2: [['11:00', '12:00']] },
    topicSchedules: golyayiTopics,
  });

  // ۸. خانم یاوری (بالینی)
  const yavariClinical = makeSchedule({
    availableDays: [0, 3],
    startHour: '11:00',
    endHour: '14:00',
    daySchedulesMap: {
      0: [['11:00', '12:00']],
      3: [['13:00', '14:00']],
    },
  });
  const yavariTopics = { clinical: yavariClinical };
  const yavariWorkingHours = makeSchedule({
    availableDays: [0, 3],
    startHour: '11:00',
    endHour: '14:00',
    daySchedulesMap: {
      0: [['11:00', '12:00']],
      3: [['13:00', '14:00']],
    },
    topicSchedules: yavariTopics,
  });

  // ۹. یاسر فرهمندی (کودک)
  const farahmandiChild = makeSchedule({
    availableDays: [6],
    startHour: '09:00',
    endHour: '12:00',
    daySchedulesMap: { 6: [['09:00', '12:00']] },
  });
  const farahmandiTopics = { child: farahmandiChild };
  const farahmandiWorkingHours = makeSchedule({
    availableDays: [6],
    startHour: '09:00',
    endHour: '12:00',
    daySchedulesMap: { 6: [['09:00', '12:00']] },
    topicSchedules: farahmandiTopics,
  });

  // ۱۰. خانم تیموریان (کودک)
  const teymourianChild = makeSchedule({
    availableDays: [4],
    startHour: '10:00',
    endHour: '13:00',
    daySchedulesMap: { 4: [['10:00', '13:00']] },
  });
  const teymourianTopics = { child: teymourianChild };
  const teymourianWorkingHours = makeSchedule({
    availableDays: [4],
    startHour: '10:00',
    endHour: '13:00',
    daySchedulesMap: { 4: [['10:00', '13:00']] },
    topicSchedules: teymourianTopics,
  });

  // ۱۱. آقای عبدی (تحصیلی)
  const abdiEducation = makeSchedule({
    availableDays: [3, 4],
    startHour: '16:00',
    endHour: '18:00',
    daySchedulesMap: {
      3: [['16:00', '18:00']],
      4: [['16:00', '18:00']],
    },
  });
  const abdiTopics = { education: abdiEducation };
  const abdiWorkingHours = makeSchedule({
    availableDays: [3, 4],
    startHour: '16:00',
    endHour: '18:00',
    daySchedulesMap: {
      3: [['16:00', '18:00']],
      4: [['16:00', '18:00']],
    },
    topicSchedules: abdiTopics,
  });

  // ۱۲. خانم عبدی (خانواده)
  const abdiFamilySchedule = makeSchedule({
    availableDays: [4],
    startHour: '08:00',
    endHour: '13:00',
    daySchedulesMap: { 4: [['08:00', '13:00']] },
  });
  const abdiFamilyTopics = { family: abdiFamilySchedule };
  const abdiFamilyWorkingHours = makeSchedule({
    availableDays: [4],
    startHour: '08:00',
    endHour: '13:00',
    daySchedulesMap: { 4: [['08:00', '13:00']] },
    topicSchedules: abdiFamilyTopics,
  });

  // ۱۳. دکتر صدیقی (بدون نوبت‌دهی)
  const sedighiWorkingHours = makeSchedule({
    availableDays: [],
    startHour: '17:00',
    endHour: '18:00',
    daySchedulesMap: {},
  });

  // ۱۴. دکتر ترشیزی (بدون نوبت‌دهی)
  const torshiziWorkingHours = makeSchedule({
    availableDays: [],
    startHour: '10:00',
    endHour: '14:00',
    daySchedulesMap: {},
  });

  return {
    'user-counselor-ansari': {
      allowedTopics: ['child', 'teen'],
      workingHours: ansariWorkingHours,
      topicWorkingHours: ansariTopics,
      enabled: true,
    },
    'user-counselor-shavandi': {
      allowedTopics: ['child', 'teen'],
      workingHours: shavandiWorkingHours,
      topicWorkingHours: shavandiTopics,
      enabled: true,
    },
    'user-counselor-zeynali': {
      allowedTopics: ['child', 'family'],
      workingHours: zeynaliWorkingHours,
      topicWorkingHours: zeynaliTopics,
      enabled: true,
    },
    'user-counselor-rastgoo': {
      allowedTopics: ['teen', 'clinical'],
      workingHours: rastgooWorkingHours,
      topicWorkingHours: rastgooTopics,
      enabled: true,
    },
    'user-counselor-borhani': {
      allowedTopics: ['teen', 'family'],
      workingHours: borhaniWorkingHours,
      topicWorkingHours: borhaniTopics,
      enabled: true,
    },
    'user-counselor-karimi': {
      allowedTopics: ['family'],
      workingHours: karimiWorkingHours,
      topicWorkingHours: karimiTopics,
      enabled: true,
    },
    'user-counselor-golyayi': {
      allowedTopics: ['clinical'],
      workingHours: golyayiWorkingHours,
      topicWorkingHours: golyayiTopics,
      enabled: true,
    },
    'user-counselor-yavari': {
      allowedTopics: ['clinical'],
      workingHours: yavariWorkingHours,
      topicWorkingHours: yavariTopics,
      enabled: true,
    },
    'user-counselor-farahmandi': {
      allowedTopics: ['child'],
      workingHours: farahmandiWorkingHours,
      topicWorkingHours: farahmandiTopics,
      enabled: true,
    },
    'user-counselor-teymourian': {
      allowedTopics: ['child'],
      workingHours: teymourianWorkingHours,
      topicWorkingHours: teymourianTopics,
      enabled: true,
    },
    'user-counselor-abdi': {
      allowedTopics: ['education'],
      workingHours: abdiWorkingHours,
      topicWorkingHours: abdiTopics,
      enabled: true,
    },
    'user-counselor-abdi-family': {
      allowedTopics: ['family'],
      workingHours: abdiFamilyWorkingHours,
      topicWorkingHours: abdiFamilyTopics,
      enabled: true,
    },
    'user-counselor-sedighi': {
      allowedTopics: ['family'],
      workingHours: sedighiWorkingHours,
      topicWorkingHours: {},
      enabled: false,
    },
    'user-counselor-torshizi': {
      allowedTopics: ['clinical'],
      workingHours: torshiziWorkingHours,
      topicWorkingHours: {},
      enabled: false,
    },
  };
}

if (require.main === module) {
  const SCHEDULES_MAP = buildConsultantConfigMap([0, 1, 2]);

  // ۱. بروزرسانی data/team_members.json
  const teamPath = path.join(process.cwd(), 'data', 'team_members.json');
  const members = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
  for (const m of members) {
    if (SCHEDULES_MAP[m.id]) {
      m.allowedTopics = SCHEDULES_MAP[m.id].allowedTopics;
      m.workingHours = SCHEDULES_MAP[m.id].workingHours;
      m.topicWorkingHours = SCHEDULES_MAP[m.id].topicWorkingHours;
      console.log(`Updated local member: ${m.name} (${m.id}) -> topics=${JSON.stringify(m.allowedTopics)}`);
    }
  }
  fs.writeFileSync(teamPath, JSON.stringify(members, null, 2), 'utf8');
  console.log('✓ Successfully updated data/team_members.json');

  // ۲. بروزرسانی data/forms.json (form-belhagh-booking -> f_booking)
  const formsPath = path.join(process.cwd(), 'data', 'forms.json');
  const forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));
  const bookingForm = forms.find((f) => f.id === 'form-belhagh-booking');
  if (bookingForm) {
    const bookingField = bookingForm.fields.find((f) => f.id === 'f_booking');
    if (bookingField && bookingField.appointmentData) {
      bookingField.appointmentData.selectedConsultants = (
        bookingField.appointmentData.selectedConsultants || []
      ).map((sc) => {
        const conf = SCHEDULES_MAP[sc.consultantId];
        if (conf) {
          return {
            ...sc,
            enabled: conf.enabled,
            enabledTopics: conf.allowedTopics,
            customWorkingHours: conf.workingHours,
            topicSchedules: conf.topicWorkingHours,
          };
        }
        return sc;
      });
      console.log('✓ Successfully updated f_booking in data/forms.json');
    }
  }
  fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2), 'utf8');
  console.log('✓ Successfully updated data/forms.json');
}

module.exports = { buildConsultantConfigMap };
