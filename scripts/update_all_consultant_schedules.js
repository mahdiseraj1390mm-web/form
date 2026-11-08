const fs = require('fs');
const path = require('path');

function makeDaySchedule(periods) {
  return {
    enabled: true,
    periods: periods.map(([startHour, endHour]) => ({ startHour, endHour })),
  };
}

function makeSchedule({ availableDays, startHour, endHour, daySchedulesMap = {}, slotDurationMinutes = 45, restTimeMinutes = 15, topicSchedules = undefined }) {
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
    topicSchedules: topicSchedules && Object.keys(topicSchedules).length > 0 ? topicSchedules : undefined,
  };
}

// 1. خانم انصاری (کودک و نوجوان)
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
const ansariTopics = {
  child: ansariChild,
  'کودک': ansariChild,
  'مشاوره کودک': ansariChild,
  teen: ansariTeen,
  'نوجوان': ansariTeen,
  'مشاوره نوجوان': ansariTeen,
};
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

// 2. خانم شوندی (کودک و نوجوان)
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
const shavandiTopics = {
  child: shavandiChild,
  'کودک': shavandiChild,
  'مشاوره کودک': shavandiChild,
  teen: shavandiTeen,
  'نوجوان': shavandiTeen,
  'مشاوره نوجوان': shavandiTeen,
};
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

// 3. خانم زینلی (خانواده و کودک)
const zeynaliFamily = makeSchedule({
  availableDays: [3],
  startHour: '17:00',
  endHour: '18:00',
  daySchedulesMap: {
    3: [['17:00', '18:00']],
  },
});
const zeynaliChild = makeSchedule({
  availableDays: [5],
  startHour: '09:00',
  endHour: '11:00',
  daySchedulesMap: {
    5: [['09:00', '11:00']],
  },
});
const zeynaliTopics = {
  family: zeynaliFamily,
  'خانواده': zeynaliFamily,
  'ازدواج': zeynaliFamily,
  'ازدواج و خانواده': zeynaliFamily,
  'مشاوره ازدواج و خانواده': zeynaliFamily,
  child: zeynaliChild,
  'کودک': zeynaliChild,
  'مشاوره کودک': zeynaliChild,
};
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

// 4. خانم راستگو (نوجوان و بالینی)
const rastgooTeen = makeSchedule({
  availableDays: [1],
  startHour: '10:00',
  endHour: '14:00',
  daySchedulesMap: {
    1: [['10:00', '14:00']],
  },
});
const rastgooClinical = makeSchedule({
  availableDays: [1],
  startHour: '18:00',
  endHour: '20:00',
  daySchedulesMap: {
    1: [['18:00', '20:00']],
  },
});
const rastgooTopics = {
  teen: rastgooTeen,
  'نوجوان': rastgooTeen,
  'مشاوره نوجوان': rastgooTeen,
  clinical: rastgooClinical,
  'بالینی': rastgooClinical,
  'فردی': rastgooClinical,
  'بالینی و فردی': rastgooClinical,
  'مشاوره بالینی و فردی': rastgooClinical,
};
const rastgooWorkingHours = makeSchedule({
  availableDays: [1],
  startHour: '10:00',
  endHour: '20:00',
  daySchedulesMap: {
    1: [['10:00', '14:00'], ['18:00', '20:00']],
  },
  topicSchedules: rastgooTopics,
});

// 5. آقای برهانی (نوجوان و خانواده)
const borhaniSchedule = makeSchedule({
  availableDays: [0, 1, 2, 3, 4],
  startHour: '16:00',
  endHour: '20:30',
  daySchedulesMap: {
    0: [['16:00', '20:30']],
    1: [['16:00', '20:30']],
    2: [['16:00', '20:30']],
    3: [['16:00', '20:30']],
    4: [['16:00', '20:30']],
  },
});
const borhaniTopics = {
  teen: borhaniSchedule,
  'نوجوان': borhaniSchedule,
  'مشاوره نوجوان': borhaniSchedule,
  family: borhaniSchedule,
  'خانواده': borhaniSchedule,
  'ازدواج': borhaniSchedule,
  'ازدواج و خانواده': borhaniSchedule,
  'مشاوره ازدواج و خانواده': borhaniSchedule,
};
const borhaniWorkingHours = makeSchedule({
  availableDays: [0, 1, 2, 3, 4],
  startHour: '16:00',
  endHour: '20:30',
  daySchedulesMap: {
    0: [['16:00', '20:30']],
    1: [['16:00', '20:30']],
    2: [['16:00', '20:30']],
    3: [['16:00', '20:30']],
    4: [['16:00', '20:30']],
  },
  topicSchedules: borhaniTopics,
});

// 6. خانم کریمی (خانواده)
const karimiSchedule = makeSchedule({
  availableDays: [1, 3],
  startHour: '10:00',
  endHour: '12:00',
  daySchedulesMap: {
    1: [['10:00', '12:00']],
    3: [['10:00', '12:00']],
  },
});
const karimiTopics = {
  family: karimiSchedule,
  'خانواده': karimiSchedule,
  'ازدواج': karimiSchedule,
  'مشاوره ازدواج و خانواده': karimiSchedule,
};
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

// 7. خانم گلیایی (بالینی)
const golyayiSchedule = makeSchedule({
  availableDays: [2],
  startHour: '11:00',
  endHour: '12:00',
  daySchedulesMap: {
    2: [['11:00', '12:00']],
  },
});
const golyayiTopics = {
  clinical: golyayiSchedule,
  'بالینی': golyayiSchedule,
  'فردی': golyayiSchedule,
  'مشاوره بالینی و فردی': golyayiSchedule,
};
const golyayiWorkingHours = makeSchedule({
  availableDays: [2],
  startHour: '11:00',
  endHour: '12:00',
  daySchedulesMap: {
    2: [['11:00', '12:00']],
  },
  topicSchedules: golyayiTopics,
});

// 8. خانم یاوری (بالینی)
const yavariSchedule = makeSchedule({
  availableDays: [0, 3],
  startHour: '11:00',
  endHour: '14:00',
  daySchedulesMap: {
    0: [['11:00', '12:00']],
    3: [['13:00', '14:00']],
  },
});
const yavariTopics = {
  clinical: yavariSchedule,
  'بالینی': yavariSchedule,
  'فردی': yavariSchedule,
  'مشاوره بالینی و فردی': yavariSchedule,
};
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

// 9. آقای فرهمندی (کودک)
const farahmandiSchedule = makeSchedule({
  availableDays: [6],
  startHour: '09:00',
  endHour: '12:00',
  daySchedulesMap: {
    6: [['09:00', '12:00']],
  },
});
const farahmandiTopics = {
  child: farahmandiSchedule,
  'کودک': farahmandiSchedule,
  'مشاوره کودک': farahmandiSchedule,
};
const farahmandiWorkingHours = makeSchedule({
  availableDays: [6],
  startHour: '09:00',
  endHour: '12:00',
  daySchedulesMap: {
    6: [['09:00', '12:00']],
  },
  topicSchedules: farahmandiTopics,
});

// 10. خانم تیموریان (کودک)
const teymourianSchedule = makeSchedule({
  availableDays: [4],
  startHour: '10:00',
  endHour: '13:00',
  daySchedulesMap: {
    4: [['10:00', '13:00']],
  },
});
const teymourianTopics = {
  child: teymourianSchedule,
  'کودک': teymourianSchedule,
  'مشاوره کودک': teymourianSchedule,
};
const teymourianWorkingHours = makeSchedule({
  availableDays: [4],
  startHour: '10:00',
  endHour: '13:00',
  daySchedulesMap: {
    4: [['10:00', '13:00']],
  },
  topicSchedules: teymourianTopics,
});

// 11. آقای عبدی (تحصیلی)
const abdiSchedule = makeSchedule({
  availableDays: [3, 4],
  startHour: '16:00',
  endHour: '18:00',
  daySchedulesMap: {
    3: [['16:00', '18:00']],
    4: [['16:00', '18:00']],
  },
});
const abdiTopics = {
  education: abdiSchedule,
  'تحصیلی': abdiSchedule,
  'مشاوره تحصیلی و برنامه‌ریزی': abdiSchedule,
};
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

// 12. خانم عبدی (خانواده)
const abdiFamilySchedule = makeSchedule({
  availableDays: [4],
  startHour: '08:00',
  endHour: '13:00',
  daySchedulesMap: {
    4: [['08:00', '13:00']],
  },
});
const abdiFamilyTopics = {
  family: abdiFamilySchedule,
  'خانواده': abdiFamilySchedule,
  'ازدواج': abdiFamilySchedule,
  'مشاوره ازدواج و خانواده': abdiFamilySchedule,
};
const abdiFamilyWorkingHours = makeSchedule({
  availableDays: [4],
  startHour: '08:00',
  endHour: '13:00',
  daySchedulesMap: {
    4: [['08:00', '13:00']],
  },
  topicSchedules: abdiFamilyTopics,
});

// 13. دکتر صدیقی (فعلاً غیرفعال در نوبت‌دهی)
const sedighiWorkingHours = makeSchedule({
  availableDays: [],
  startHour: '17:00',
  endHour: '18:00',
  daySchedulesMap: {},
});

// 14. دکتر ترشیزی (فعلاً غیرفعال در نوبت‌دهی)
const torshiziWorkingHours = makeSchedule({
  availableDays: [],
  startHour: '10:00',
  endHour: '14:00',
  daySchedulesMap: {},
});

// مپینگ کامل
const SCHEDULES_MAP = {
  'user-counselor-ansari': { workingHours: ansariWorkingHours, topicWorkingHours: ansariTopics },
  'user-counselor-shavandi': { workingHours: shavandiWorkingHours, topicWorkingHours: shavandiTopics },
  'user-counselor-zeynali': { workingHours: zeynaliWorkingHours, topicWorkingHours: zeynaliTopics },
  'user-counselor-rastgoo': { workingHours: rastgooWorkingHours, topicWorkingHours: rastgooTopics },
  'user-counselor-borhani': { workingHours: borhaniWorkingHours, topicWorkingHours: borhaniTopics },
  'user-counselor-karimi': { workingHours: karimiWorkingHours, topicWorkingHours: karimiTopics },
  'user-counselor-golyayi': { workingHours: golyayiWorkingHours, topicWorkingHours: golyayiTopics },
  'user-counselor-yavari': { workingHours: yavariWorkingHours, topicWorkingHours: yavariTopics },
  'user-counselor-farahmandi': { workingHours: farahmandiWorkingHours, topicWorkingHours: farahmandiTopics },
  'user-counselor-teymourian': { workingHours: teymourianWorkingHours, topicWorkingHours: teymourianTopics },
  'user-counselor-abdi': { workingHours: abdiWorkingHours, topicWorkingHours: abdiTopics },
  'user-counselor-abdi-family': { workingHours: abdiFamilyWorkingHours, topicWorkingHours: abdiFamilyTopics },
  'user-counselor-sedighi': { workingHours: sedighiWorkingHours, topicWorkingHours: {} },
  'user-counselor-torshizi': { workingHours: torshiziWorkingHours, topicWorkingHours: {} },
};

// ۱. بروزرسانی data/team_members.json
const teamPath = path.join(process.cwd(), 'data', 'team_members.json');
const members = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
for (const m of members) {
  if (SCHEDULES_MAP[m.id]) {
    m.workingHours = SCHEDULES_MAP[m.id].workingHours;
    m.topicWorkingHours = SCHEDULES_MAP[m.id].topicWorkingHours;
    console.log(`Updated team member: ${m.name} (${m.id}) with topic schedules`);
  }
}
fs.writeFileSync(teamPath, JSON.stringify(members, null, 2), 'utf8');
console.log('✓ Successfully updated data/team_members.json');

// ۲. بروزرسانی data/forms.json (form-belhagh-booking)
const formsPath = path.join(process.cwd(), 'data', 'forms.json');
const forms = JSON.parse(fs.readFileSync(formsPath, 'utf8'));
const bookingForm = forms.find((f) => f.id === 'form-belhagh-booking');
if (bookingForm) {
  const bookingField = bookingForm.fields.find((f) => f.id === 'f_booking');
  if (bookingField && bookingField.appointmentData) {
    bookingField.appointmentData.selectedConsultants = (bookingField.appointmentData.selectedConsultants || []).map((sc) => {
      const conf = SCHEDULES_MAP[sc.consultantId];
      if (conf) {
        return {
          ...sc,
          customWorkingHours: conf.workingHours,
          topicSchedules: conf.topicWorkingHours,
        };
      }
      return sc;
    });
    console.log('✓ Successfully updated f_booking in form-belhagh-booking with per-topic schedules');
  }
}
fs.writeFileSync(formsPath, JSON.stringify(forms, null, 2), 'utf8');
console.log('✓ Successfully updated data/forms.json');
