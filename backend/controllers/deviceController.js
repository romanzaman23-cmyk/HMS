const fingerprintService = require('../services/fingerprintService');
const whatsappService = require('../services/whatsappService');

// Get fingerprint device info and live connection status
async function getDevice(req, res) {
  try {
    const device = await fingerprintService.getDeviceInfo();
    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Connect to device (real TCP socket attempt on configured port 4370)
async function connect(req, res) {
  try {
    const result = await fingerprintService.connectDevice(3500);
    return res.json({ success: result.success, status: result.status, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Disconnect from device
async function disconnect(req, res) {
  try {
    const result = fingerprintService.disconnectDevice();
    return res.json({ success: true, status: result.status, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Sync student biometric data to device
async function sync(req, res) {
  try {
    const result = await fingerprintService.syncStudents();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Update device configuration (IP, Port, Name, Location)
async function updateSettings(req, res) {
  try {
    const updated = await fingerprintService.updateDeviceConfig(req.body);
    return res.json({ success: true, message: 'Device configuration updated.', device: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// View device event logs
async function getLogs(req, res) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await fingerprintService.getDeviceLogs(limit);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Simulate / Push attendance punch (e.g. student puts finger on sensor)
async function punch(req, res) {
  try {
    const { fingerprint_device_id, student_id, punch_type } = req.body;
    let targetStudentId = student_id;
    if (!targetStudentId && !fingerprint_device_id) {
      const store = fingerprintService.getFallbackStore ? fingerprintService.getFallbackStore() : null;
      targetStudentId = 1791453068646; // Roman Zamam default
    }
    const result = await fingerprintService.processAttendanceScan({
      fingerprint_device_id,
      student_id: targetStudentId,
      punch_type: punch_type || 'Auto',
      source: 'Fingerprint'
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Manual toggle connection status (helper for demonstration when hardware is not plugged in)
async function mockToggle(req, res) {
  try {
    const { status } = req.body; // 'Connected' or 'Disconnected'
    const updated = fingerprintService.setManualConnectionState(status || 'Connected');
    return res.json({ success: true, device: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// WhatsApp Gateway Settings
async function getWhatsAppConfig(req, res) {
  try {
    const config = whatsappService.getWhatsAppConfig();
    return res.json({ success: true, config });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateWhatsAppConfig(req, res) {
  try {
    const config = whatsappService.saveWhatsAppConfig(req.body);
    return res.json({
      success: true,
      message: 'WhatsApp Gateway configuration updated successfully.',
      config
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function testWhatsApp(req, res) {
  try {
    const { gatewayUrl, token, instanceId, testPhone, testMessage } = req.body;
    const result = await whatsappService.testWhatsAppConnection({
      gatewayUrl,
      token,
      instanceId,
      testPhone,
      testMessage
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getWhatsAppLogs(req, res) {
  try {
    const limit = parseInt(req.query.limit || '40', 10);
    const logs = whatsappService.getWhatsAppLogs(limit);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDevice,
  connect,
  disconnect,
  sync,
  updateSettings,
  getLogs,
  punch,
  mockToggle,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  testWhatsApp,
  getWhatsAppLogs
};
