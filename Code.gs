// Cấu hình Google Sheets
const SHEET_ID = '1NsidBIqji_uf0pSoEqvNrqQwwScfm33Sa0LVqfSXeiQ';
const SS = SpreadsheetApp.openById(SHEET_ID);

// Tên các sheet
const SHEETS = {
  USERS: 'Users',
  LEAVE_REQUESTS: 'LeaveRequests',
  SALARY: 'Salary',
  DEVICES: 'Devices',
  FILES: 'Files'
};

// Hàm chính xử lý request
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let response;
    
    switch(action) {
      case 'login':
        response = handleLogin(data);
        break;
      case 'submitLeave':
        response = handleSubmitLeave(data);
        break;
      case 'getLeaveHistory':
        response = handleGetLeaveHistory(data);
        break;
      case 'getPendingRequests':
        response = handleGetPendingRequests();
        break;
      case 'getRequestDetails':
        response = handleGetRequestDetails(data);
        break;
      case 'approveRequest':
        response = handleApproveRequest(data);
        break;
      case 'calculateSalary':
        response = handleCalculateSalary(data);
        break;
      case 'exportSalary':
        response = handleExportSalary(data);
        break;
      case 'createMonthlyFile':
        response = handleCreateMonthlyFile(data);
        break;
      case 'getUsers':
        response = handleGetUsers();
        break;
      case 'addUser':
        response = handleAddUser(data);
        break;
      default:
        response = { success: false, message: 'Action không hợp lệ' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Lỗi server: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== XỬ LÝ ĐĂNG NHẬP ==========
function handleLogin(data) {
  const { username, password, deviceId } = data;
  
  const usersSheet = SS.getSheetByName(SHEETS.USERS);
  const users = usersSheet.getDataRange().getValues();
  
  // Bỏ qua header
  for (let i = 1; i < users.length; i++) {
    const user = users[i];
    if (user[0] === username && user[1] === password) {
      
      // Kiểm tra thiết bị
      const allowedDevices = user[7] ? user[7].split(',') : [];
      if (allowedDevices.length > 0 && !allowedDevices.includes(deviceId)) {
        // Ghi log thiết bị mới
        logNewDevice(username, deviceId);
        return { 
          success: false, 
          message: 'Thiết bị chưa được đăng ký. Vui lòng liên hệ quản lý.' 
        };
      }
      
      // Tạo token đơn giản
      const token = Utilities.base64Encode(username + ':' + Date.now());
      
      return {
        success: true,
        token: token,
        user: {
          id: i,
          username: user[0],
          fullname: user[2],
          department: user[3],
          position: user[4],
          role: user[6] || 'user',
          leaveDays: user[5] || 12
        }
      };
    }
  }
  
  return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
}

// ========== GỬI ĐƠN NGHỈ PHÉP ==========
function handleSubmitLeave(data) {
  try {
    const sheet = SS.getSheetByName(SHEETS.LEAVE_REQUESTS);
    
    // Tạo ID duy nhất
    const requestId = 'REQ_' + Utilities.getUuid().substring(0, 8);
    
    // Thêm dòng mới
    const newRow = [
      requestId,
      data.userId,
      data.username,
      data.fullname,
      data.department,
      data.leaveType,
      data.startDate,
      data.endDate,
      data.totalDays,
      data.reason,
      data.contactInfo,
      data.deviceId,
      data.status,
      data.submitDate,
      '', // Người duyệt
      '', // Ngày duyệt
      '', // Ghi chú
      'Chưa duyệt' // Trạng thái duyệt
    ];
    
    sheet.appendRow(newRow);
    
    // Gửi email thông báo cho quản lý
    sendNotificationEmail(requestId, data);
    
    return { success: true, requestId: requestId };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ========== LẤY LỊCH SỬ ĐƠN ==========
function handleGetLeaveHistory(data) {
  const sheet = SS.getSheetByName(SHEETS.LEAVE_REQUESTS);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  let filteredData = [];
  
  // Bỏ qua header
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    
    // Lọc theo userId
    if (parseInt(row[1]) === data.userId) {
      
      // Lọc theo trạng thái
      if (data.filterStatus && row[12] !== data.filterStatus) {
        continue;
      }
      
      // Lọc theo tháng
      if (data.filterMonth) {
        const submitDate = new Date(row[13]);
        const rowMonth = submitDate.getFullYear() + '-' + 
                        String(submitDate.getMonth() + 1).padStart(2, '0');
        if (rowMonth !== data.filterMonth) {
          continue;
        }
      }
      
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      filteredData.push(item);
    }
  }
  
  return { success: true, data: filteredData };
}

// ========== LẤY ĐƠN CHỜ DUYỆT ==========
function handleGetPendingRequests() {
  const sheet = SS.getSheetByName(SHEETS.LEAVE_REQUESTS);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  let pendingData = [];
  
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    if (row[12] === 'Chờ duyệt') {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      pendingData.push(item);
    }
  }
  
  return { success: true, data: pendingData };
}

// ========== DUYỆT ĐƠN ==========
function handleApproveRequest(data) {
  try {
    const sheet = SS.getSheetByName(SHEETS.LEAVE_REQUESTS);
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.requestId) {
        // Cập nhật trạng thái
        sheet.getRange(i + 1, 13).setValue(data.approved ? 'Đã duyệt' : 'Từ chối');
        sheet.getRange(i + 1, 14).setValue(data.approvedBy);
        sheet.getRange(i + 1, 15).setValue(data.approveDate);
        sheet.getRange(i + 1, 17).setValue(data.approved ? 'Đã duyệt' : 'Đã từ chối');
        
        // Gửi email thông báo cho nhân viên
        sendApprovalEmail(allData[i], data.approved);
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'Không tìm thấy đơn' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ========== TÍNH LƯƠNG ==========
function handleCalculateSalary(data) {
  try {
    const { month, baseSalary, salaryPerDay } = data;
    
    // Lấy dữ liệu nhân viên
    const usersSheet = SS.getSheetByName(SHEETS.USERS);
    const users = usersSheet.getDataRange().getValues();
    
    // Lấy dữ liệu nghỉ phép tháng đó
    const leaveSheet = SS.getSheetByName(SHEETS.LEAVE_REQUESTS);
    const leaves = leaveSheet.getDataRange().getValues();
    
    let salaryData = [];
    
    // Bỏ qua header của users
    for (let i = 1; i < users.length; i++) {
      const user = users[i];
      if (user[6] === 'user') { // Chỉ tính cho user, không tính admin
        const userId = i;
        let totalLeaveDays = 0;
        
        // Tính tổng số ngày nghỉ trong tháng
        for (let j = 1; j < leaves.length; j++) {
          const leave = leaves[j];
          if (parseInt(leave[1]) === userId && leave[12] === 'Đã duyệt') {
            const leaveDate = new Date(leave[6]); // startDate
            const leaveMonth = leaveDate.getFullYear() + '-' + 
                              String(leaveDate.getMonth() + 1).padStart(2, '0');
            
            if (leaveMonth === month) {
              totalLeaveDays += parseFloat(leave[8]);
            }
          }
        }
        
        const deduction = totalLeaveDays * salaryPerDay;
        const actualSalary = baseSalary - deduction;
        
        salaryData.push({
          employeeId: 'NV' + String(i).padStart(3, '0'),
          fullname: user[2],
          department: user[3],
          workDays: 22 - totalLeaveDays,
          leaveDays: totalLeaveDays,
          baseSalary: baseSalary,
          deduction: deduction,
          actualSalary: actualSalary,
          notes: totalLeaveDays > 5 ? 'Nghỉ nhiều ngày' : 'Bình thường'
        });
      }
    }
    
    return { success: true, data: salaryData };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ========== TẠO FILE THÁNG ==========
function handleCreateMonthlyFile(data) {
  try {
    const { month } = data;
    
    // Tạo Google Sheet mới
    const newSheetName = `QuyetToanLuong_${month}`;
    const newSheet = SpreadsheetApp.create(newSheetName);
    
    // Copy dữ liệu
    const salarySheet = SS.getSheetByName(SHEETS.SALARY);
    const salaryData = salarySheet.getDataRange().getValues();
    
    newSheet.getRange(1, 1, salaryData.length, salaryData[0].length)
      .setValues(salaryData);
    
    // Lưu thông tin file
    const filesSheet = SS.getSheetByName(SHEETS.FILES);
    filesSheet.appendRow([
      newSheet.getId(),
      newSheetName,
      month,
      new Date().toISOString(),
      Session.getActiveUser().getEmail(),
      newSheet.getUrl()
    ]);
    
    return { 
      success: true, 
      fileId: newSheet.getId(),
      fileUrl: newSheet.getUrl()
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ========== HÀM HỖ TRỢ ==========
function sendNotificationEmail(requestId, data) {
  try {
    const subject = `[THÔNG BÁO] Đơn xin nghỉ phép mới - ${requestId}`;
    const body = `
      Có đơn xin nghỉ phép mới cần duyệt:
      
      Thông tin đơn:
      - Mã đơn: ${requestId}
      - Nhân viên: ${data.fullname} (${data.department})
      - Loại nghỉ: ${data.leaveType}
      - Thời gian: ${data.startDate} đến ${data.endDate}
      - Số ngày: ${data.totalDays}
      - Lý do: ${data.reason}
      - Liên hệ: ${data.contactInfo}
      - Thiết bị đăng ký: ${data.deviceId}
      - Ngày gửi: ${new Date(data.submitDate).toLocaleString('vi-VN')}
      
      Vui lòng đăng nhập hệ thống để duyệt đơn.
      
      Trân trọng,
      Hệ thống Quản lý Nghỉ phép
    `;
    
    // Gửi cho quản lý (có thể cấu hình danh sách email)
    const managers = ['manager@company.com'];
    managers.forEach(manager => {
      MailApp.sendEmail(manager, subject, body);
    });
  } catch (error) {
    Logger.log('Lỗi gửi email: ' + error);
  }
}

function sendApprovalEmail(leaveData, isApproved) {
  try {
    const subject = `[KẾT QUẢ] Đơn xin nghỉ phép ${isApproved ? 'được duyệt' : 'bị từ chối'}`;
    const status = isApproved ? 'ĐÃ ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI';
    
    const body = `
      Kính gửi ${leaveData[3]},
      
      Đơn xin nghỉ phép của bạn đã ${status}:
      
      Thông tin đơn:
      - Mã đơn: ${leaveData[0]}
      - Loại nghỉ: ${leaveData[5]}
      - Thời gian: ${leaveData[6]} đến ${leaveData[7]}
      - Số ngày: ${leaveData[8]}
      - Lý do: ${leaveData[9]}
      - Trạng thái: ${isApproved ? 'Đã duyệt' : 'Từ chối'}
      - Người duyệt: ${leaveData[14]}
      - Ngày duyệt: ${new Date(leaveData[15]).toLocaleDateString('vi-VN')}
      ${!isApproved ? '- Lý do từ chối: ' + (leaveData[16] || 'Không có') : ''}
      
      ${isApproved ? 'Vui lòng sắp xếp công việc và nghỉ theo đúng thời gian đã đăng ký.' : 'Vui lòng liên hệ quản lý để biết thêm chi tiết.'}
      
      Trân trọng,
      Phòng Nhân sự
    `;
    
    // Cần có email của nhân viên trong database
    // MailApp.sendEmail(employeeEmail, subject, body);
    
  } catch (error) {
    Logger.log('Lỗi gửi email: ' + error);
  }
}

function logNewDevice(username, deviceId) {
  const devicesSheet = SS.getSheetByName(SHEETS.DEVICES);
  devicesSheet.appendRow([
    username,
    deviceId,
    new Date().toISOString(),
    'Pending',
    'Thiết bị mới chưa đăng ký'
  ]);
}

// Hàm khởi tạo Google Sheet (chạy 1 lần đầu)
function initializeSheets() {
  // Tạo sheet Users nếu chưa có
  let sheet = SS.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    sheet = SS.insertSheet(SHEETS.USERS);
    sheet.getRange('A1:I1').setValues([[
      'Username', 'Password', 'Fullname', 'Department', 'Position', 
      'LeaveDays', 'Role', 'Devices', 'JoinDate'
    ]]);
    
    // Thêm user mẫu
    sheet.getRange('A2:I2').setValues([[
      'admin', 'admin123', 'Nguyễn Văn Quản lý', 'Nhân sự', 'Quản lý', 
      30, 'admin', 'MAC1,192.168.1.100', '2023-01-01'
    ]]);
    sheet.getRange('A3:I3').setValues([[
      'user1', 'user123', 'Trần Thị Nhân viên', 'Kế toán', 'Nhân viên', 
      12, 'user', 'MAC2', '2023-06-01'
    ]]);
  }
  
  // Tạo sheet LeaveRequests
  if (!SS.getSheetByName(SHEETS.LEAVE_REQUESTS)) {
    sheet = SS.insertSheet(SHEETS.LEAVE_REQUESTS);
    sheet.getRange('A1:R1').setValues([[
      'RequestID', 'UserID', 'Username', 'Fullname', 'Department', 'LeaveType',
      'StartDate', 'EndDate', 'TotalDays', 'Reason', 'ContactInfo', 'DeviceID',
      'Status', 'SubmitDate', 'ApprovedBy', 'ApproveDate', 'Notes', 'ApprovalStatus'
    ]]);
  }
  
  // Tạo sheet Salary
  if (!SS.getSheetByName(SHEETS.SALARY)) {
    sheet = SS.insertSheet(SHEETS.SALARY);
    sheet.getRange('A1:J1').setValues([[
      'Month', 'EmployeeID', 'Fullname', 'Department', 'WorkDays', 'LeaveDays',
      'BaseSalary', 'Deduction', 'ActualSalary', 'Notes'
    ]]);
  }
  
  // Tạo sheet Devices
  if (!SS.getSheetByName(SHEETS.DEVICES)) {
    sheet = SS.insertSheet(SHEETS.DEVICES);
    sheet.getRange('A1:F1').setValues([[
      'Username', 'DeviceID', 'Timestamp', 'Status', 'Notes', 'ApprovedBy'
    ]]);
  }
  
  // Tạo sheet Files
  if (!SS.getSheetByName(SHEETS.FILES)) {
    sheet = SS.insertSheet(SHEETS.FILES);
    sheet.getRange('A1:F1').setValues([[
      'FileID', 'FileName', 'Month', 'CreatedDate', 'CreatedBy', 'FileURL'
    ]]);
  }
}