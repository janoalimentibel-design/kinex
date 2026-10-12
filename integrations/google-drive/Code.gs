// Personal KINEX endpoint. Never log request bodies, tokens or health data.
// Set KINEX_TOKEN in Script Properties to 64 random hexadecimal characters.
function doGet() { return json_({ ok: true, service: 'KINEX upload only' }); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function drive_(url, method, body) {
  var response = UrlFetchApp.fetch('https://www.googleapis.com/' + url, {
    method: method, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (response.getResponseCode() >= 300) throw new Error('drive_' + response.getResponseCode());
  return JSON.parse(response.getContentText());
}
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e.postData || e.postData.contents.length > 4000000) return json_({ ok: false });
    var request = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('KINEX_TOKEN');
    if (!secret || !/^[a-f0-9]{64}$/.test(secret) || request.token !== secret) return json_({ ok: false });
    if (!/^[a-f0-9-]{36}$/.test(request.device) || !Number.isInteger(request.version) || request.version < 0 || typeof request.payload !== 'string') return json_({ ok: false });
    var snapshot = JSON.parse(request.payload);
    if (snapshot.schemaVersion !== 2 || !snapshot.data || !Array.isArray(snapshot.data.sessions) || !Array.isArray(snapshot.data.customExercises) || !snapshot.data.plan) return json_({ ok: false });
    if (!lock.tryLock(10000)) return json_({ ok: false });
    var key = 'device_' + request.device;
    var state = JSON.parse(props.getProperty(key) || '{"version":0}');
    var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, request.payload));
    if (state.hash === hash) return json_({ ok: true, version: state.version });
    if (state.version !== request.version) return json_({ ok: false, error: 'conflict' });
    if (!state.fileId) {
      var file = drive_('drive/v3/files?fields=id', 'post', { name: 'KINEX seguimiento privado ' + request.device + '.json', mimeType: 'application/json' });
      state.fileId = file.id;
      // Retain file identity even if the subsequent upload fails.
      props.setProperty(key, JSON.stringify(state));
    }
    drive_('upload/drive/v3/files/' + encodeURIComponent(state.fileId) + '?uploadType=media&fields=id', 'patch', {
      schemaVersion: 2, device: request.device, syncedAt: new Date().toISOString(), data: snapshot.data
    });
    state.version += 1; state.hash = hash;
    props.setProperty(key, JSON.stringify(state));
    return json_({ ok: true, version: state.version });
  } catch (error) { return json_({ ok: false, error: /^drive_[0-9]{3}$/.test(error.message) ? error.message : 'request' }); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
