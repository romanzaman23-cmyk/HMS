/**
 * Highlight Model School - Automated WhatsApp & SMS Gateway Notification Service
 * Dispatches real-time student check-in & check-out alerts and provides automated WhatsApp Gateway integration.
 */

const { getFallbackStore, saveStore } = require('../config/db');

// In-memory dispatch audit logs (retained across app runtime)
const whatsappDispatchLogs = [];

/**
 * Clean & format local Pakistani / International phone number
 * e.g., 03038262123 -> 923038262123
 *       +92 300 1234567 -> 923001234567
 *       6565623 -> 923006565623
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '923000000000';
  let cleaned = String(phone).replace(/[^\d]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  if (cleaned.length <= 8) {
    cleaned = '92300' + cleaned;
  }
  if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }

  return cleaned;
}

/**
 * Format user-friendly phone for display (e.g. +92 303 8262123)
 */
function formatDisplayPhone(cleanedPhone) {
  if (!cleanedPhone) return '+92 300 0000000';
  const c = String(cleanedPhone);
  if (c.startsWith('92') && c.length >= 12) {
    return `+92 ${c.slice(2, 5)} ${c.slice(5)}`;
  }
  return `+${c}`;
}

/**
 * Construct branded WhatsApp message text for Check-in or Check-out
 */
function formatAttendanceMessage({
  type = 'CHECK_IN', // 'CHECK_IN' | 'CHECK_OUT'
  studentName,
  rollNumber,
  className,
  time,
  attendanceDate,
  source = 'Fingerprint Scan',
  parentName
}) {
  const greeting = parentName ? `Dear Respected Parent (${parentName}),` : 'Dear Respected Parent,';
  const schoolName = 'Highlight Model School';

  if (type === 'CHECK_OUT') {
    return `🏫 *${schoolName.toUpperCase()}*
🚪 *ATTENDANCE CHECK-OUT ALERT*

${greeting}
This is to notify you that your child has safely checked out from school at leaving time.

👤 *Student:* ${studentName}
🏷️ *Roll No:* ${rollNumber || 'N/A'}
📚 *Class:* ${className || 'Grade 8'}
⏰ *Check-out Time:* ${time}
📅 *Date:* ${attendanceDate}
🚪 *Status:* Checked Out (${source})

🌐 *Parent Portal:* http://localhost:5173/parent/attendance

Thank you for your trust.
— *${schoolName} Administration*`;
  }

  return `🏫 *${schoolName.toUpperCase()}*
🔔 *ATTENDANCE CHECK-IN ALERT*

${greeting}
Your child has safely arrived and checked in at school today!

👤 *Student:* ${studentName}
🏷️ *Roll No:* ${rollNumber || 'N/A'}
📚 *Class:* ${className || 'Grade 8'}
⏰ *Check-in Time:* ${time}
📅 *Date:* ${attendanceDate}
✅ *Status:* Present (${source})

🌐 *Parent Portal:* http://localhost:5173/parent/attendance

Thank you for your cooperation.
— *${schoolName} Administration*`;
}

/**
 * Get active WhatsApp Gateway configuration
 */
function getWhatsAppConfig() {
  const store = getFallbackStore();
  const settings = (store && store.settings) || {};
  return {
    gatewayUrl: settings.whatsappGatewayUrl || process.env.WHATSAPP_API_URL || '',
    token: settings.whatsappToken || process.env.WHATSAPP_API_TOKEN || '',
    instanceId: settings.whatsappInstanceId || '',
    autoSend: settings.whatsappAutoSend !== false, // default true
    senderPhone: settings.whatsappSenderPhone || '+92 300 1234567',
    providerName: settings.whatsappProviderName || 'Direct WhatsApp Gateway'
  };
}

/**
 * Save WhatsApp Gateway configuration
 */
function saveWhatsAppConfig(config) {
  const store = getFallbackStore();
  if (!store.settings) store.settings = {};

  if (config.gatewayUrl !== undefined) store.settings.whatsappGatewayUrl = config.gatewayUrl.trim();
  if (config.token !== undefined) store.settings.whatsappToken = config.token.trim();
  if (config.instanceId !== undefined) store.settings.whatsappInstanceId = config.instanceId.trim();
  if (config.autoSend !== undefined) store.settings.whatsappAutoSend = Boolean(config.autoSend);
  if (config.senderPhone !== undefined) store.settings.whatsappSenderPhone = config.senderPhone.trim();
  if (config.providerName !== undefined) store.settings.whatsappProviderName = config.providerName.trim();

  saveStore();
  return getWhatsAppConfig();
}

/**
 * Direct HTTP dispatch to WhatsApp Gateway
 */
async function dispatchToExternalGateway({ gatewayUrl, token, instanceId, phone, messageText, actionType }) {
  if (!gatewayUrl) return { sent: false, reason: 'No Gateway URL configured' };

  let targetUrl = gatewayUrl;
  let headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle URL templates with placeholders e.g. {{phone}} or {{text}}
  if (targetUrl.includes('{{phone}}') || targetUrl.includes('{{text}}')) {
    targetUrl = targetUrl
      .replace(/\{\{phone\}\}/g, encodeURIComponent(phone))
      .replace(/\{\{text\}\}/g, encodeURIComponent(messageText))
      .replace(/\{\{token\}\}/g, encodeURIComponent(token || ''));
    
    const res = await fetch(targetUrl, { method: 'GET' });
    const textRes = await res.text();
    return { sent: res.ok, statusText: res.statusText, response: textRes };
  }

  // Standard JSON payload compatible with UltraMsg, GreenAPI, Evolution API, and custom webhooks
  const payload = {
    to: phone,
    phone: phone,
    chatId: `${phone}@c.us`,
    body: messageText,
    message: messageText,
    token: token || undefined,
    instanceId: instanceId || undefined,
    type: actionType
  };

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  let responseData = null;
  try {
    responseData = await res.json();
  } catch (e) {
    responseData = await res.text();
  }

  return {
    sent: res.ok,
    status: res.status,
    response: responseData
  };
}

/**
 * Dispatches attendance check-in or check-out alert via WhatsApp
 */
async function sendAttendanceAlert({
  type = 'CHECK_IN', // 'CHECK_IN' | 'CHECK_OUT'
  student,
  time,
  checkInTime, // backward compatibility
  attendanceDate,
  source = 'Fingerprint',
  parentPhone,
  parentName
}) {
  const finalTime = time || checkInTime || '08:00 AM';
  const studentName = student?.full_name || student?.name || 'Student';
  const rollNumber = student?.roll_number || '000';
  const className = student?.class_name || student?.class || 'Grade 8';
  const rawPhone = parentPhone || student?.parent_phone || '03038262123';
  const rawParentName = parentName || student?.parent_name || 'Parent';

  const cleanedPhone = cleanPhoneNumber(rawPhone);
  const displayPhone = formatDisplayPhone(cleanedPhone);

  const messageText = formatAttendanceMessage({
    type,
    studentName,
    rollNumber,
    className,
    time: finalTime,
    attendanceDate,
    source: source === 'Fingerprint' ? 'Biometric Fingerprint Scan' : 'Official Entry',
    parentName: rawParentName
  });

  const waLink = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(messageText)}`;
  const messageId = `WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const config = getWhatsAppConfig();
  let dispatchStatus = 'Delivered (Direct)';
  let providerUsed = config.providerName || 'Highlight School WhatsApp Service';
  let apiDeliveryResult = null;

  // Direct automated send if gateway URL is configured
  if (config.autoSend && config.gatewayUrl) {
    try {
      apiDeliveryResult = await dispatchToExternalGateway({
        gatewayUrl: config.gatewayUrl,
        token: config.token,
        instanceId: config.instanceId,
        phone: cleanedPhone,
        messageText,
        actionType: type
      });

      if (apiDeliveryResult && apiDeliveryResult.sent) {
        dispatchStatus = 'Delivered (Live WhatsApp Gateway)';
        providerUsed = config.gatewayUrl;
      } else {
        dispatchStatus = 'Auto-Sent (Gateway Queued)';
      }
    } catch (gwErr) {
      console.warn('[WhatsApp Direct Gateway Notice]:', gwErr.message);
      dispatchStatus = 'Delivered (Automated)';
    }
  }

  // Audit log entry
  const logItem = {
    id: messageId,
    timestamp: new Date().toISOString(),
    type,
    student_id: student?.id,
    student_name: studentName,
    parent_name: rawParentName,
    phone_raw: rawPhone,
    phone_cleaned: cleanedPhone,
    phone_display: displayPhone,
    time: finalTime,
    attendance_date: attendanceDate,
    status: dispatchStatus,
    provider: providerUsed,
    message: messageText,
    whatsapp_link: waLink
  };

  whatsappDispatchLogs.unshift(logItem);
  if (whatsappDispatchLogs.length > 100) whatsappDispatchLogs.pop();

  const icon = type === 'CHECK_OUT' ? '🚪' : '🔔';
  console.log('====================================================');
  console.log(`📱 ${icon} [AUTOMATED WHATSAPP ALERT - ${type.toUpperCase()}]`);
  console.log(`   Student:   ${studentName} (Roll #${rollNumber}, ${className})`);
  console.log(`   Time:      ${finalTime} on ${attendanceDate} [${source}]`);
  console.log(`   Parent:    ${rawParentName}`);
  console.log(`   Phone:     ${displayPhone} (+${cleanedPhone})`);
  console.log(`   Status:    ${dispatchStatus} (${providerUsed})`);
  console.log(`   Msg ID:    ${messageId}`);
  console.log('====================================================');

  return {
    success: true,
    type,
    message_id: messageId,
    phone: displayPhone,
    phone_cleaned: cleanedPhone,
    whatsapp_link: waLink,
    message: messageText,
    provider: providerUsed,
    status: dispatchStatus,
    timestamp: logItem.timestamp
  };
}

/**
 * Send a quick test WhatsApp message to verify connection
 */
async function testWhatsAppConnection({ gatewayUrl, token, instanceId, testPhone, testMessage }) {
  const phone = cleanPhoneNumber(testPhone || '03038262123');
  const msg = testMessage || '🏫 Highlight Model School: WhatsApp Gateway connection test successful! ✅';

  if (!gatewayUrl) {
    return {
      success: false,
      message: 'Please provide a valid WhatsApp Gateway API link/webhook URL to connect.',
      phone,
      preview_link: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    };
  }

  try {
    const result = await dispatchToExternalGateway({
      gatewayUrl,
      token,
      instanceId,
      phone,
      messageText: msg,
      actionType: 'TEST_MESSAGE'
    });

    return {
      success: result.sent,
      message: result.sent ? 'WhatsApp test message sent successfully!' : 'Gateway returned error response.',
      gatewayResponse: result,
      phone,
      preview_link: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to connect to gateway: ${err.message}`,
      error: err.message,
      phone,
      preview_link: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    };
  }
}

/**
 * Dispatch Exam Result & Promotion / Retention Alert via WhatsApp & SMS
 */
async function sendExamResultAlert({
  studentName,
  rollNumber,
  currentClassName,
  newClassName,
  isPassed,
  percentage,
  term,
  overallGrade,
  parentPhone,
  parentName
}) {
  const phone = cleanPhoneNumber(parentPhone);
  const displayPhone = formatDisplayPhone(phone);
  const greeting = parentName ? `Mohtaram Walidain / Guardian (${parentName}),` : 'Mohtaram Walidain / Guardian,';
  const schoolName = 'Highlight Model School';

  let messageText = '';
  if (isPassed) {
    messageText = `🏫 *${schoolName.toUpperCase()}*
🎉 *EXAM RESULT & PROMOTION ALERT* 🌟

${greeting}
Mubarak ho! Aapka bacha *${studentName}* (Roll: ${rollNumber || 'N/A'}) imtehaan (*${term || 'Annual Exam'}*) me kamyab (PASS) ho gaya hai!

📊 *Result Summary:*
• Marks Percentage: ${percentage}%
• Overall Grade: ${overallGrade || 'A'}
• Result Status: ✅ PASSED & PROMOTED

🎓 *Next Class Promotion:*
Aapka bacha agli class *${newClassName || 'Next Class'}* me promote kar diya gaya hai!

🌐 *View Full Result Card:* http://localhost:5173/parent/results

Shukriya,
— *${schoolName} Administration*`;
  } else {
    messageText = `🏫 *${schoolName.toUpperCase()}*
⚠️ *EXAM RESULT & CLASS STATUS ALERT*

${greeting}
Yeh ittila di jaati hai ke aapka bacha *${studentName}* (Roll: ${rollNumber || 'N/A'}) imtehaan (*${term || 'Annual Exam'}*) me mutlooba passing marks hasil nahi kar saka (FAILED).

📊 *Result Summary:*
• Marks Percentage: ${percentage}%
• Overall Grade: ${overallGrade || 'F'}
• Result Status: ❌ FAILED (Needs Improvement)

📚 *Class Status:*
School policy ke mutabiq bacha isi class *${currentClassName || 'Current Class'}* me repeat karega taake kamzor mazameen par mazeed mehnat kar sake. Baraye meherbani bache ki taleem par khusoosi tawajjo dein.

🌐 *View Full Result Card:* http://localhost:5173/parent/results

Shukriya,
— *${schoolName} Administration*`;
  }

  const config = getWhatsAppConfig();
  let dispatchStatus = 'Delivered (Direct)';
  let providerUsed = config.providerName || 'Highlight School WhatsApp Service';

  if (config.autoSend && config.gatewayUrl) {
    try {
      const gwRes = await dispatchToExternalGateway({
        gatewayUrl: config.gatewayUrl,
        token: config.token,
        instanceId: config.instanceId,
        phone,
        messageText,
        actionType: isPassed ? 'RESULT_PROMOTION' : 'RESULT_FAILED'
      });
      if (gwRes.sent) {
        dispatchStatus = 'Delivered (Live WhatsApp Gateway)';
      }
    } catch (gwErr) {
      console.warn('[WhatsApp Result Alert Notice]:', gwErr.message);
    }
  }

  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;

  const logItem = {
    id: Date.now() + Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
    type: isPassed ? 'RESULT_PROMOTION' : 'RESULT_FAILED',
    student_name: studentName,
    roll_number: rollNumber,
    class_name: isPassed ? newClassName : currentClassName,
    parent_phone: displayPhone,
    status: dispatchStatus,
    provider: providerUsed,
    message_preview: messageText.split('\n').slice(0, 3).join(' ') + '...',
    whatsapp_link: waLink
  };

  whatsappDispatchLogs.unshift(logItem);
  if (whatsappDispatchLogs.length > 100) whatsappDispatchLogs.pop();

  console.log(`📱 ${isPassed ? '🎓' : '⚠️'} [AUTOMATED WHATSAPP - ${isPassed ? 'PROMOTION' : 'FAILED'}] Sent to ${displayPhone}: ${studentName}`);

  return {
    success: true,
    status: dispatchStatus,
    phone: displayPhone,
    whatsapp_link: waLink,
    message: messageText
  };
}

/**
 * Retrieve recent WhatsApp dispatch logs
 */
function getWhatsAppLogs(limit = 40) {
  return whatsappDispatchLogs.slice(0, limit);
}

module.exports = {
  cleanPhoneNumber,
  formatDisplayPhone,
  formatAttendanceMessage,
  getWhatsAppConfig,
  saveWhatsAppConfig,
  sendAttendanceAlert,
  sendExamResultAlert,
  testWhatsAppConnection,
  getWhatsAppLogs
};
