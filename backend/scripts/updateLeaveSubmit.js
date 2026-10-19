const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '../../../mobile app/App.js');
let content = fs.readFileSync(appJsPath, 'utf8');

const target = `    try {
      const res = await apiService.submitLeave(authToken, leaveData);
      setSubmittingLeave(false);
      Alert.alert(
        'Leave Request Submitted! ✉️',
        'Your leave application has been submitted to the Principal Office for review and approval.'
      );
      setLeaveDetails('');
      setLeaveList(prev => [
        {
          id: Date.now(),
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason,
          additional_details: leaveDetails.trim(),
          status: 'Pending Review',
          created_at: new Date().toISOString().slice(0, 10)
        },
        ...prev
      ]);
    } catch (e) {
      setSubmittingLeave(false);
      Alert.alert('Notice', 'Leave application recorded successfully.');
    }`;

const replacement = `    try {
      const res = await apiService.submitLeave(authToken, leaveData);
      setSubmittingLeave(false);
      if (res && res.success) {
        Alert.alert(
          'Leave Request Submitted! ✉️',
          'Your leave application has been submitted to the Principal Office for review and approval.'
        );
        setLeaveDetails('');
        try {
          const fresh = await apiService.getLeaves(authToken, sId);
          if (fresh && fresh.success && Array.isArray(fresh.leaves)) {
            setLeaveList(fresh.leaves);
          } else {
            setLeaveList(prev => [res.leave || {
              id: Date.now(),
              start_date: leaveStartDate,
              end_date: leaveEndDate,
              reason: leaveReason,
              additional_details: leaveDetails.trim(),
              status: 'Pending',
              submitted_at: new Date().toISOString().slice(0, 10)
            }, ...prev]);
          }
        } catch (err) {}
      } else {
        Alert.alert('Notice', res?.message || 'Unable to submit leave request to server.');
      }
    } catch (e) {
      setSubmittingLeave(false);
      Alert.alert('Error', e.message);
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(appJsPath, content, 'utf8');
  console.log('Successfully updated handleSubmitLeave in mobile App.js');
} else {
  console.log('Target block not matched exactly in App.js');
}
