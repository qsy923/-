// ==================== movie-fan-project/script.js ====================
console.log('✅ script.js 加载完成');

// ==================== 确保API可用（降级方案） ====================
if (typeof API === 'undefined') {
    console.warn('⚠️ API.js 未加载，创建最小化模拟API');
    window.API = {
        getConfig: async () => ({
            directTicketEnabled: false,
            examRequired: true,
            maintenanceMode: false,
            prices: { fullScore: 9.9, highScore: 19.9, mediumScore: 29.9, lowScore: 49.9 }
        }),
        updateConfig: async () => ({
            success: false,
            message: '前端控制功能已移除，请使用后端管理界面'
        }),
        getQuestions: async () => ({
            success: true,
            data: {
                questions: [
                    {
                        id: 'q1',
                        question: '电影《流浪地球》的导演是谁？',
                        options: ['郭帆', '吴京', '刘慈欣', '宁浩'],
                        correctAnswer: 0,
                        explanation: '《流浪地球》由郭帆执导。',
                        category: 'basic'
                    }
                ]
            }
        }),
        submitAnswers: async () => ({
            success: true,
            data: { score: 85, price: 19.9 }
        })
    };
}

// ==================== 通用工具函数 ====================
const utils = {
    // 显示消息提示
    showMessage: function(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    },
    
    // 保存数据到本地存储
    saveToLocal: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },
    
    // 从本地存储读取数据
    loadFromLocal: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('读取数据失败:', e);
            return null;
        }
    }
};

// 导出工具函数
window.appUtils = utils;

// ==================== 卡片动画效果 ====================
function animateCards() {
    const cards = document.querySelectorAll('.card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
}

// ==================== 直接抢票通道控制 ====================
// 当前通道状态（从后端API获取，前端只读）
let isDirectTicketOpen = false;

// 初始化通道状态（只从API获取，不操作本地存储）
async function initDirectTicketControl() {

// 检查API是否已加载
    if (typeof API === 'undefined') {
        console.warn('API未定义，使用默认状态');
        isDirectTicketOpen = false;
        updateDirectTicketDisplay();
        return;
    }
    try {
        // 从API获取配置（后端控制开关）
        const config = await API.getConfig();
        isDirectTicketOpen = config.directTicketEnabled;
        console.log('[API] 获取通道状态:', isDirectTicketOpen ? '开启' : '关闭');
    } catch (error) {
        // API失败时显示错误，不降级到本地存储
        console.error('❌ 获取通道状态失败:', error);
        isDirectTicketOpen = false; // 默认关闭
    }
    
    // 更新显示
    updateDirectTicketDisplay();
    
    console.log('直接抢票通道状态:', isDirectTicketOpen ? '开启' : '关闭');
}

// 更新显示（只负责显示，不包含控制功能）
function updateDirectTicketDisplay() {
    const icon = document.getElementById('directTicketIcon');
    const title = document.getElementById('directTicketTitle');
    const desc = document.getElementById('directTicketDesc');
    const statusBadge = document.getElementById('directTicketStatus');
    const button = document.getElementById('directTicketBtn');
    const toggleBtn = document.getElementById('toggleDirectBtn');
    
    if (!icon) return;
    
    if (isDirectTicketOpen) {
        // 通道开启状态（后端返回 true）
        icon.innerHTML = '<i class="fas fa-bolt fa-3x text-info"></i>';
        icon.style.background = 'linear-gradient(135deg, rgba(13, 110, 253, 0.1), rgba(13, 202, 240, 0.1))';
        
        title.textContent = '⚡ 直接抢票';
        title.className = 'card-title text-info';
        
        desc.textContent = '无答题环节，直接进入抢票流程。';
        
        statusBadge.textContent = '开放中';
        statusBadge.className = 'badge bg-success';
        
        button.textContent = '立即抢票';
        button.innerHTML = '<i class="fas fa-forward me-2"></i>直接抢票';
        button.className = 'btn btn-outline-info w-100';
        button.href = 'ticket.html?mode=direct';
        button.classList.remove('disabled');
    } else {
        // 通道关闭状态（后端返回 false）
        icon.innerHTML = '<i class="fas fa-clock fa-3x text-secondary"></i>';
        icon.style.background = 'linear-gradient(135deg, rgba(108, 117, 125, 0.1), rgba(173, 181, 189, 0.1))';
        
        title.textContent = '⏳ 通道待开放';
        title.className = 'card-title text-secondary';
        
        desc.textContent = '直接抢票通道暂未开放，请关注后续通知或使用答题抢票。';
        
        statusBadge.textContent = '未开放';
        statusBadge.className = 'badge bg-warning';
        
        button.textContent = '暂未开放';
        button.innerHTML = '<i class="fas fa-lock me-2"></i>暂未开放';
        button.className = 'btn btn-outline-secondary w-100 disabled';
        button.href = '#';
        button.classList.add('disabled');
    }
    
    // 如果还有切换按钮，更新它的文本
    if (toggleBtn) {
        toggleBtn.innerHTML = isDirectTicketOpen ? 
            '<i class="fas fa-times me-2"></i>关闭通道' : 
            '<i class="fas fa-check me-2"></i>开启通道';
    }
}

// ==================== 初始化各种功能 ====================
function initializeFeatures() {
    // 这里可以添加各种初始化代码
    console.log('✅ 功能初始化完成');
    
    // 示例：为所有按钮添加点击反馈
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 添加点击效果
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            console.log(`点击了按钮: ${this.textContent.trim()}`);
        });
    });
}

// ==================== 管理员控制（可选，如果你需要隐藏的管理功能） ====================
function setupAdminControl() {
    // 只在特定条件下显示管理员控制
    const adminBtn = document.createElement('button');
    adminBtn.id = 'adminToggleBtn';
    adminBtn.className = 'btn btn-sm btn-danger position-fixed';
    adminBtn.style.bottom = '80px';
    adminBtn.style.right = '20px';
    adminBtn.style.zIndex = '10000';
    adminBtn.style.opacity = '0.3';
    adminBtn.innerHTML = '🔧';
    adminBtn.title = '管理通道状态';
    
    document.body.appendChild(adminBtn);
    
    // 点击显示/隐藏切换按钮
    adminBtn.addEventListener('click', function() {
        const toggleBtn = document.getElementById('toggleDirectBtn');
        if (toggleBtn) {
            const isHidden = toggleBtn.style.display === 'none';
            toggleBtn.style.display = isHidden ? 'block' : 'none';
            
            utils.showMessage(
                isHidden ? '管理面板已显示' : '管理面板已隐藏',
                'info'
            );
        }
    });
}

// ==================== 页面加载初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 清清粉丝空间加载完成！');
    
    // 显示当前年份（页脚用）
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // 卡片动画效果
    animateCards();
    
    // 初始化通用功能
    initializeFeatures();
    
    // 初始化直接抢票通道控制（只读）
    initDirectTicketControl();
    
    // 设置管理员控制（如果你需要的话）
    // setupAdminControl();
});

// ==================== 工具函数（供其他页面使用） ====================
// 格式化日期
function formatDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 生成随机ID
function generateId(prefix = '') {
    return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 深拷贝对象
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 验证邮箱格式
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 验证手机号格式
function isValidPhone(phone) {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
}

// 获取URL参数
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 设置URL参数
function setUrlParam(name, value) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(name, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
}

// 复制文本到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('复制失败:', err);
        return false;
    }
}

// 下载文件
function downloadFile(content, fileName, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 读取本地文件
function readLocalFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// 导出到CSV
function exportToCSV(data, filename = 'data.csv') {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// 本地存储管理类
class StorageManager {
    constructor(namespace = 'movie_fan') {
        this.namespace = namespace;
    }
    
    set(key, value) {
        const fullKey = `${this.namespace}_${key}`;
        try {
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    }
    
    get(key, defaultValue = null) {
        const fullKey = `${this.namespace}_${key}`;
        try {
            const value = localStorage.getItem(fullKey);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('读取失败:', error);
            return defaultValue;
        }
    }
    
    remove(key) {
        const fullKey = `${this.namespace}_${key}`;
        localStorage.removeItem(fullKey);
    }
    
    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.namespace)) {
                localStorage.removeItem(key);
            }
        });
    }
}

// 创建全局存储管理器实例
window.storage = new StorageManager();

// ==================== 座位图相关功能 ====================
// 初始化150座位布局并添加一键包场功能
function initializeSeatingChart() {
    const container = document.getElementById('seatingChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 创建屏幕
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.textContent = '🎬 IMAX巨幕厅 - 银幕';
    container.appendChild(screen);
    
    // 150个座位 (10行 x 15列)
    const rows = ['A','B','C','D','E','F','G','H','I','J'];
    let seatCount = 0;
    
    rows.forEach((row, rowIndex) => {
        // 添加行号标签
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.style.top = `${(rowIndex * 45) + 70}px`;
        rowLabel.textContent = row;
        container.appendChild(rowLabel);
        
        for (let col = 1; col <= 15; col++) {
            // 检查是否是过道 (第6、11列为过道)
            if (col === 6 || col === 11) {
                const aisle = document.createElement('div');
                aisle.className = 'aisle-gap';
                container.appendChild(aisle);
            }
            
            // 创建座位
            const seat = document.createElement('div');
            const seatId = `${row}${col}`;
            
            seat.className = 'seat available';
            seat.id = `seat-${seatId}`;
            seat.textContent = col;
            seat.dataset.seatId = seatId;
            seat.dataset.row = row;
            seat.dataset.col = col;
            seat.dataset.type = 'regular';
            
            // 价格区域区分
            if (row === 'A' || row === 'B') {
                seat.dataset.type = 'premium';
                seat.style.background = '#3498db';
                seat.title = 'VIP座 ¥120';
            } else if (row === 'C' || row === 'D') {
                seat.dataset.type = 'vip';
                seat.style.background = '#9b59b6';
                seat.title = '优选座 ¥90';
            } else {
                seat.title = '普通座 ¥60';
            }
            
            // 情侣座 (H7-H10)
            if (row === 'H' && (col === 7 || col === 8 || col === 9 || col === 10)) {
                seat.className = 'seat available love-seat';
                seat.dataset.type = 'love';
                seat.title = '情侣座 ¥150';
            }
            
            // 模拟已售座位
            const bookedSeats = ['A1', 'A2', 'J14', 'J15'];
            if (bookedSeats.includes(seatId)) {
                seat.className = 'seat booked';
                seat.title = '已售出';
                delete seat.dataset.type;
            }
            
            // 点击事件
            seat.addEventListener('click', toggleSeatSelection);
            container.appendChild(seat);
            seatCount++;
        }
    });
    
    console.log(`✅ 创建了 ${seatCount} 个座位`);
    
    // 初始化快速操作按钮
    initializeQuickActions();
    
    // 更新座位统计
    updateSeatCount();
}

// 初始化快速操作按钮（一键全选、全部取消、一键包场）
function initializeQuickActions() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const bookAllBtn = document.getElementById('bookAllBtn');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const availableSeats = document.querySelectorAll('.seat.available:not(.booked)');
            availableSeats.forEach(seat => {
                seat.classList.add('selected');
            });
            updateSelectionSummary();
            appUtils.showMessage(`已全选 ${availableSeats.length} 个可用座位`, 'success');
        });
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            const selectedSeats = document.querySelectorAll('.seat.selected');
            selectedSeats.forEach(seat => {
                seat.classList.remove('selected');
            });
            updateSelectionSummary();
            appUtils.showMessage('已清除所有选择', 'info');
        });
    }
    
    if (bookAllBtn) {
        bookAllBtn.addEventListener('click', function() {
            const availableSeats = document.querySelectorAll('.seat.available:not(.booked)');
            const selectedSeats = document.querySelectorAll('.seat.selected');
            
            if (availableSeats.length === 0) {
                appUtils.showMessage('没有可用座位了', 'warning');
                return;
            }
            
            // 一键包场逻辑
            availableSeats.forEach(seat => {
                seat.classList.add('selected');
            });
            
            updateSelectionSummary();
            
            // 计算价格
            const price = calculateTotalPrice();
            const confirmMsg = `🎉 一键包场成功！\n\n已选择全部 ${availableSeats.length} 个座位\n总金额：¥${price}\n\n是否确认购票？`;
            
            if (confirm(confirmMsg)) {
                appUtils.showMessage('正在处理包场订单...', 'success');
                
                // 模拟购票成功
                setTimeout(() => {
                    appUtils.showMessage('包场购票成功！请前往取票', 'success');
                    // 标记所有已选座位为已售
                    const selectedSeats = document.querySelectorAll('.seat.selected');
                    selectedSeats.forEach(seat => {
                        seat.className = 'seat booked';
                        seat.title = '已售出';
                    });
                    updateSelectionSummary();
                    updateSeatCount();
                }, 1500);
            } else {
                // 取消选择
                availableSeats.forEach(seat => {
                    seat.classList.remove('selected');
                });
                updateSelectionSummary();
            }
        });
    }
}

// 切换座位选择状态
function toggleSeatSelection(event) {
    const seat = event.currentTarget;
    
    if (seat.classList.contains('booked')) {
        appUtils.showMessage('此座位已售出，请选择其他座位', 'warning');
        return;
    }
    
    seat.classList.toggle('selected');
    updateSelectionSummary();
}

// 更新选择摘要信息
function updateSelectionSummary() {
    const selectedSeats = document.querySelectorAll('.seat.selected');
    const countElement = document.getElementById('selectedCount');
    const priceElement = document.getElementById('totalPrice');
    
    if (countElement) {
        countElement.textContent = selectedSeats.length;
    }
    
    if (priceElement) {
        priceElement.textContent = calculateTotalPrice();
    }
}

// 计算总价格
function calculateTotalPrice() {
    const selectedSeats = document.querySelectorAll('.seat.selected');
    let total = 0;
    
    selectedSeats.forEach(seat => {
        const type = seat.dataset.type || 'regular';
        const prices = {
            'premium': 120,
            'vip': 90,
            'regular': 60,
            'love': 150
        };
        total += prices[type] || 60;
    });
    
    return total;
}

// 更新座位数量统计
function updateSeatCount() {
    const totalElement = document.getElementById('totalSeats');
    const availableElement = document.getElementById('availableSeats');
    
    if (totalElement) {
        totalElement.textContent = '150';
    }
    
    if (availableElement) {
        const bookedSeats = document.querySelectorAll('.seat.booked').length;
        availableElement.textContent = (150 - bookedSeats).toString();
    }
}

// ==================== 全局事件处理 ====================
// 处理页面卸载前的清理
window.addEventListener('beforeunload', function(e) {
    // 可以在这里保存状态或清理资源
    console.log('页面即将卸载');
});

// 处理网络状态变化
window.addEventListener('online', function() {
    utils.showMessage('网络已恢复', 'success');
});

window.addEventListener('offline', function() {
    utils.showMessage('网络连接已断开', 'warning');
});

// ==================== 错误处理 ====================
// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
    // 可以在这里发送错误日志到服务器
});

// 未处理的Promise rejection
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise rejection:', event.reason);
});

// ==================== 初始化完成 ====================
console.log('✅ script.js 所有功能已加载完成');

// 导出一些全局有用的函数
window.utils = utils;
window.formatDate = formatDate;
window.generateId = generateId;
window.getUrlParam = getUrlParam;
window.copyToClipboard = copyToClipboard;
// 导出座位相关函数
window.initializeSeatingChart = initializeSeatingChart;
window.toggleSeatSelection = toggleSeatSelection;