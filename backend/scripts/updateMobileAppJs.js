const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '../../../mobile app/App.js');
console.log('App.js path:', appJsPath);

if (!fs.existsSync(appJsPath)) {
  console.error('App.js not found:', appJsPath);
  process.exit(1);
}

let content = fs.readFileSync(appJsPath, 'utf8');

// 1. Update loadStudentData timetable loading
const oldTimetableLoad = `// 5. Timetable (Display empty state if none assigned)\n      setTimetableData({});`;
const newTimetableLoad = `// 5. Timetable (Fetch live assigned timetable for student's class)
      try {
        const ttRes = await apiService.getTimetable(token, studentData.className);
        if (ttRes && ttRes.success && ttRes.data && Object.keys(ttRes.data).length > 0) {
          setTimetableData(ttRes.data);
        } else {
          setTimetableData({});
        }
      } catch (e) {
        console.log('[App] Timetable load error:', e.message);
        setTimetableData({});
      }`;

if (content.includes(oldTimetableLoad)) {
  content = content.replace(oldTimetableLoad, newTimetableLoad);
  console.log('Updated loadStudentData in App.js');
} else {
  console.log('oldTimetableLoad pattern not found, checking alternatives...');
}

// 2. Update Timetable screen render
const oldTimetableRender = `{/* Day Selector Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorRow}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTabBtn, selectedDay === day && styles.dayTabBtnActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayTabBtnText, selectedDay === day && styles.dayTabBtnTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.emptyStateBox}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyStateTitle}>Your timetable has not been published yet.</Text>
              <Text style={styles.emptyStateSubtitle}>
                No class periods are scheduled for {selectedDay}. The administration will publish the schedule here once assigned.
              </Text>
            </View>`;

const newTimetableRender = `{/* Day Selector Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorRow}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                const count = (timetableData && timetableData[day]) ? timetableData[day].length : 0;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayTabBtn, selectedDay === day && styles.dayTabBtnActive]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayTabBtnText, selectedDay === day && styles.dayTabBtnTextActive]}>
                      {day} {count > 0 ? \`(\${count})\` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Scheduled Periods for Selected Day */}
            {(!timetableData || !timetableData[selectedDay] || timetableData[selectedDay].length === 0) ? (
              <View style={styles.emptyStateBox}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>Your timetable has not been published yet.</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No class periods are scheduled for {selectedDay}. The administration will publish the schedule here once assigned.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 6, gap: 10 }}>
                {timetableData[selectedDay].map((period, idx) => {
                  const isBreak = period.isBreak || (period.period && period.period.toLowerCase().includes('break')) || (period.subject && period.subject.toLowerCase().includes('recess'));
                  return (
                    <View
                      key={period.id || idx}
                      style={[
                        styles.periodCard,
                        isBreak && styles.periodCardBreak
                      ]}
                    >
                      <View style={styles.periodCardTop}>
                        <View style={[styles.periodBadge, isBreak && styles.periodBadgeBreak]}>
                          <Text style={[styles.periodBadgeText, isBreak && styles.periodBadgeTextBreak]}>
                            {period.period}
                          </Text>
                        </View>
                        <View style={styles.periodTimeWrap}>
                          <Ionicons name="time-outline" size={13} color={isBreak ? '#b45309' : COLORS.textMuted} />
                          <Text style={[styles.periodTimeText, isBreak && { color: '#b45309' }]}>
                            {period.time}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.periodSubjectText, isBreak && { color: '#78350f' }]}>
                        {period.subject}
                      </Text>

                      <View style={styles.periodMetaRow}>
                        <View style={styles.periodMetaItem}>
                          <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                          <Text style={styles.periodMetaText}>{period.teacher || 'Class Teacher'}</Text>
                        </View>
                        <View style={styles.periodMetaItem}>
                          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                          <Text style={styles.periodMetaText}>{period.room || 'Room 103'}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}`;

if (content.includes(oldTimetableRender)) {
  content = content.replace(oldTimetableRender, newTimetableRender);
  console.log('Updated Timetable Screen render in App.js');
} else {
  console.log('oldTimetableRender pattern not exact match, using regex...');
  const regex = /\{\/\* Day Selector Tabs \*\/\}[\s\S]*?<\/View>\s*<\/View>/;
  if (regex.test(content)) {
    content = content.replace(regex, newTimetableRender);
    console.log('Replaced Timetable render via regex in App.js');
  }
}

// 3. Add styles if not present
if (!content.includes('periodCard:')) {
  const stylesToAdd = `
  periodCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 8,
  },
  periodCardBreak: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  periodCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  periodBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  periodBadgeBreak: {
    backgroundColor: '#fef3c7',
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  periodBadgeTextBreak: {
    color: '#b45309',
  },
  periodTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  periodSubjectText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  periodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  periodMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
`;
  // Place before closing "});" of StyleSheet.create
  const lastStyleBrace = content.lastIndexOf('});');
  if (lastStyleBrace !== -1) {
    content = content.substring(0, lastStyleBrace) + stylesToAdd + content.substring(lastStyleBrace);
    console.log('Added period styles to App.js');
  }
}

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('Successfully written updates to mobile App.js!');
