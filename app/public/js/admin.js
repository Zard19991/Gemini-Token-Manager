// 标签功能
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// 弹窗功能
let modalCallback = null;
let modalInputType = "text";

// 选中key
let selectedKeys = new Set();

// 停止检测
let isBatchProcessingStopped = false;

// 排序变量
let currentSortField = "added"; // 默认按添加时间排序
let currentSortOrder = "desc"; // 默认降序(最新添加的在前面)

// 打开弹窗
function showModal(options = {}) {
    const modal = document.getElementById("custom-modal");
    const title = document.getElementById("modal-title");
    const message = document.getElementById("modal-message");
    const confirmBtn = document.getElementById("modal-confirm");
    const cancelBtn = document.getElementById("modal-cancel");
    const inputContainer = document.getElementById("modal-input-container");
    const input = document.getElementById("modal-input");

    // 设置标题
    if (options.title) {
        document.querySelector(".modal-title").textContent = options.title;
    } else {
        document.querySelector(".modal-title").textContent = "提示";
    }

    // 设置消息
    message.textContent = options.message || "";

    // 设置按钮文本
    confirmBtn.textContent = options.confirmText || "确认";
    cancelBtn.textContent = options.cancelText || "取消";

    // 设置按钮颜色
    confirmBtn.className = options.confirmClass || "";

    // 处理输入框
    if (options.input) {
        inputContainer.style.display = "block";
        input.placeholder = options.placeholder || "";
        input.value = options.value || "";
        modalInputType = options.inputType || "text";
        input.type = modalInputType;
    } else {
        inputContainer.style.display = "none";
    }

    // 显示/隐藏取消按钮
    if (options.showCancel === false) {
        cancelBtn.style.display = "none";
    } else {
        cancelBtn.style.display = "inline-block";
    }

    // 保存回调
    modalCallback = options.callback;

    // 显示弹窗
    modal.classList.add("show");

    // 如果有输入框，聚焦它
    if (options.input) {
        setTimeout(() => input.focus(), 100);
    }
}

// 关闭弹窗
function closeModal() {
    const modal = document.getElementById("custom-modal");
    modal.classList.remove("show");
    modalCallback = null;
}

// 处理弹窗确认
function handleModalConfirm() {
    const input = document.getElementById("modal-input");
    const value = input.value;

    if (modalCallback) {
        modalCallback(value);
    }

    closeModal();
}

// 确认对话框
function confirmDialog(message, callback, options = {}) {
    showModal({
        title: options.title || "确认操作",
        message: message,
        confirmText: options.confirmText || "确认",
        cancelText: options.cancelText || "取消",
        confirmClass: options.confirmClass || "danger",
        callback: result => {
            if (callback) callback(true);
        },
        showCancel: true,
    });
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const tabId = tab.getAttribute("data-tab");

        // 更新活动标签
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        // 更新活动内容
        tabContents.forEach(content => {
            content.classList.remove("active");
            if (content.id === tabId) {
                content.classList.add("active");
            }
        });

        // 基于标签加载内容
        if (tabId === "dashboard") {
            loadDashboard();
        } else if (tabId === "keys") {
            loadAllKeys();
        } else if (tabId === "settings") {
            loadSettings();
        }
    });
});

// 通知消息
const toast = document.getElementById("toast");

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? "rgba(231, 76, 60, 0.9)" : "rgba(46, 204, 113, 0.9)";
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000); // 延长显示时间
}

// 图表实例对象
let balanceDistChart, keyStatusChart, balanceTrendChart;

// 增强的仪表盘加载函数
function loadDashboard() {
    loadStats();
    loadRecentKeys();

    // 添加图表数据加载和渲染
    loadChartData();
}

// 加载并处理图表数据
async function loadChartData() {
    try {
        const response = await fetch("/admin/api/keys");
        if (!response.ok) throw new Error("加载密钥失败");

        const result = await response.json();
        if (result.success) {
            const keys = result.data;

            // 处理余额分布数据
            renderBalanceDistributionChart(keys);

            // 处理密钥状态数据
            renderKeyStatusChart(keys);

            // 处理余额趋势数据
            renderBalanceTrendChart(keys);

            // 更新余额统计信息
            updateBalanceStats(keys);
        }
    } catch (error) {
        console.error("加载图表数据失败:", error);
        showToast("加载图表数据失败", true);
    }
}

// 渲染余额分布图表
function renderBalanceDistributionChart(keys) {
    const ctx = document.getElementById("balance-distribution-chart").getContext("2d");

    // 定义余额区间
    const ranges = [
        { min: 0, max: 10, label: "0-10" },
        { min: 10, max: 12, label: "10-12" },
        { min: 12, max: 13, label: "12-13" },
        { min: 13, max: 14, label: "13-14" },
        { min: 14, max: 100, label: "14-100" },
        { min: 100, max: 1000, label: "100-1000" },
        { min: 1000, max: Infinity, label: "1000+" },
    ];

    // 计算每个区间的密钥数量
    const distribution = ranges.map(range => {
        return keys.filter(key => {
            const balance = parseFloat(key.balance) || 0;
            return balance > range.min && balance <= range.max;
        }).length;
    });

    // 销毁旧图表
    if (balanceDistChart) {
        balanceDistChart.destroy();
    }

    // 创建新图表
    balanceDistChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ranges.map(r => r.label),
            datasets: [
                {
                    label: "密钥数量",
                    data: distribution,
                    backgroundColor: [
                        "rgba(52, 152, 219, 0.7)",
                        "rgba(46, 204, 113, 0.7)",
                        "rgba(155, 89, 182, 0.7)",
                        "rgba(52, 73, 94, 0.7)",
                        "rgba(22, 160, 133, 0.7)",
                        "rgba(241, 196, 15, 0.7)",
                    ],
                    borderColor: [
                        "rgba(52, 152, 219, 1)",
                        "rgba(46, 204, 113, 1)",
                        "rgba(155, 89, 182, 1)",
                        "rgba(52, 73, 94, 1)",
                        "rgba(22, 160, 133, 1)",
                        "rgba(241, 196, 15, 1)",
                    ],
                    borderWidth: 1,
                    borderRadius: 5,
                    maxBarThickness: 50,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            return `余额范围: ${tooltipItems[0].label}`;
                        },
                        label: function (context) {
                            return `数量: ${context.raw} 个密钥`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                    },
                    title: {
                        display: true,
                        text: "密钥数量",
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "余额范围",
                    },
                },
            },
        },
    });
}

// 渲染密钥状态图表
function renderKeyStatusChart(keys) {
    const ctx = document.getElementById("key-status-chart").getContext("2d");

    // 计算状态分布
    const valid = keys.filter(k => parseFloat(k.balance) > 0 && !k.lastError).length;
    const noBalance = keys.filter(k => parseFloat(k.balance) <= 0 && !k.lastError).length;
    const hasError = keys.filter(k => k.lastError).length;

    // 销毁旧图表
    if (keyStatusChart) {
        keyStatusChart.destroy();
    }

    // 创建新图表
    keyStatusChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["有效", "余额不足", "错误"],
            datasets: [
                {
                    data: [valid, noBalance, hasError],
                    backgroundColor: [
                        "rgba(46, 204, 113, 0.8)",
                        "rgba(241, 196, 15, 0.8)",
                        "rgba(231, 76, 60, 0.8)",
                    ],
                    borderColor: [
                        "rgba(46, 204, 113, 1)",
                        "rgba(241, 196, 15, 1)",
                        "rgba(231, 76, 60, 1)",
                    ],
                    borderWidth: 1,
                    hoverOffset: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: "circle",
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || "";
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        },
                    },
                },
            },
        },
    });
}

// 渲染余额趋势图表
function renderBalanceTrendChart(keys) {
    const ctx = document.getElementById("balance-trend-chart").getContext("2d");

    // 获取有效密钥并按余额排序
    const validKeys = keys
        .filter(k => parseFloat(k.balance) > 0)
        .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

    // 获取选定范围
    const rangeSelect = document.getElementById("trend-range");
    const range = rangeSelect ? rangeSelect.value : "20";

    // 根据范围选择数据
    let displayKeys;
    if (range === "all") {
        displayKeys = validKeys;
    } else {
        displayKeys = validKeys.slice(0, parseInt(range));
    }

    // 准备数据
    const labels = displayKeys.map((_, index) => `密钥 ${index + 1}`);
    const balances = displayKeys.map(k => parseFloat(k.balance) || 0);

    // 销毁旧图表
    if (balanceTrendChart) {
        balanceTrendChart.destroy();
    }

    // 创建新图表
    balanceTrendChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "余额",
                    data: balances,
                    backgroundColor: balances.map(balance => {
                        if (balance >= 50) return "rgba(46, 204, 113, 0.7)"; // 高余额
                        if (balance >= 10) return "rgba(52, 152, 219, 0.7)"; // 中等余额
                        return "rgba(241, 196, 15, 0.7)"; // 低余额
                    }),
                    borderColor: balances.map(balance => {
                        if (balance >= 50) return "rgba(46, 204, 113, 1)";
                        if (balance >= 10) return "rgba(52, 152, 219, 1)";
                        return "rgba(241, 196, 15, 1)";
                    }),
                    borderWidth: 1,
                    borderRadius: 4,
                    maxBarThickness: 40,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            const keyIndex = tooltipItems[0].dataIndex;
                            return `密钥: ${displayKeys[keyIndex].key}`;
                        },
                        label: function (context) {
                            return `余额: ${context.raw}`;
                        },
                        afterLabel: function (context) {
                            const keyIndex = context.dataIndex;
                            const key = displayKeys[keyIndex];
                            if (key.lastUpdated) {
                                return `最后更新: ${new Date(key.lastUpdated).toLocaleString()}`;
                            }
                            return "";
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "余额",
                    },
                },
                x: {
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 20,
                    },
                    title: {
                        display: true,
                        text: "密钥编号",
                    },
                },
            },
        },
    });

    // 添加点击事件，显示详细信息
    ctx.canvas.onclick = function (evt) {
        const points = balanceTrendChart.getElementsAtEventForMode(
            evt,
            "nearest",
            { intersect: true },
            true
        );
        if (points.length) {
            const firstPoint = points[0];
            const keyIndex = firstPoint.index;
            const key = displayKeys[keyIndex];

            // 显示详细信息
            showKeyDetail(key);
        }
    };
}

// 显示密钥详细信息
function showKeyDetail(key) {
    showModal({
        title: "密钥详细信息",
        message: `余额: ${key.balance || 0}\n添加时间: ${new Date(key.added).toLocaleString()}${
            key.lastUpdated ? "\n最后更新: " + new Date(key.lastUpdated).toLocaleString() : ""
        }${key.lastError ? "\n错误: " + key.lastError : ""}`,
        confirmText: "复制密钥",
        callback: () => {
            navigator.clipboard
                .writeText(key.key)
                .then(() => showToast("密钥已复制到剪贴板"))
                .catch(() => showToast("复制失败", true));
        },
    });
}

// 更新余额统计信息
function updateBalanceStats(keys) {
    // 过滤有效键（余额大于0）
    const validBalances = keys.map(k => parseFloat(k.balance) || 0).filter(balance => balance > 0);

    if (validBalances.length > 0) {
        // 计算最大值、最小值、中位数和总和
        const max = Math.max(...validBalances);
        const min = Math.min(...validBalances);
        const total = validBalances.reduce((sum, b) => sum + b, 0);

        // 计算中位数
        const sorted = [...validBalances].sort((a, b) => a - b);
        let median;
        if (sorted.length % 2 === 0) {
            // 偶数个，取中间两个值的平均
            median = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
        } else {
            // 奇数个，取中间值
            median = sorted[Math.floor(sorted.length / 2)];
        }

        // 更新显示
        document.getElementById("max-balance").textContent = max.toFixed(2);
        document.getElementById("min-balance").textContent = min.toFixed(2);
        document.getElementById("median-balance").textContent = median.toFixed(2);
        document.getElementById("total-balance").textContent = total.toFixed(2);
    } else {
        // 没有有效数据
        document.getElementById("max-balance").textContent = "0.00";
        document.getElementById("min-balance").textContent = "0.00";
        document.getElementById("median-balance").textContent = "0.00";
        document.getElementById("total-balance").textContent = "0.00";
    }
}

async function loadStats() {
    try {
        const response = await fetch("/admin/api/keys");
        if (!response.ok) throw new Error("加载密钥失败");

        const result = await response.json();
        if (result.success) {
            const keys = result.data;

            // 计算统计数据
            const totalKeys = keys.length;
            const validKeys = keys.filter(k => k.balance > 0).length;
            const invalidKeys = totalKeys - validKeys;

            // 修正计算平均余额的方式
            const validBalances = keys
                .map(k => parseFloat(k.balance) || 0)
                .filter(balance => balance > 0);

            const avgBalance =
                validBalances.length > 0
                    ? (validBalances.reduce((a, b) => a + b, 0) / validBalances.length).toFixed(2)
                    : "0.00";

            // 更新UI
            document.getElementById("total-keys-stat").textContent = totalKeys;
            document.getElementById("valid-keys-stat").textContent = validKeys;
            document.getElementById("invalid-keys-stat").textContent = invalidKeys;
            document.getElementById("avg-balance-stat").textContent = avgBalance;
        }
    } catch (error) {
        console.error("加载统计数据时出错:", error);
        showToast("加载统计数据失败", true);
    }
}

// 事件监听器
document.addEventListener("DOMContentLoaded", () => {
    // 初始化图表范围选择器
    const rangeSelector = document.getElementById("trend-range");
    if (rangeSelector) {
        rangeSelector.addEventListener("change", function () {
            // 更新余额趋势图
            loadChartData();
        });
    }

    // 初始化图表周期选择器
    const periodSelector = document.getElementById("chart-period");
    if (periodSelector) {
        periodSelector.addEventListener("change", function () {
            // 更新所有图表
            loadChartData();
        });
    }

    // 初始化趋势图显示切换按钮
    const trendViewToggle = document.getElementById("toggle-trend-view");
    if (trendViewToggle) {
        trendViewToggle.addEventListener("click", function () {
            // 切换异常值显示
            if (balanceTrendChart) {
                const hideOutliers = !balanceTrendChart.options.scales.y.max;

                if (hideOutliers) {
                    // 计算一个合理的最大值 (去除异常值)
                    const data = balanceTrendChart.data.datasets[0].data;
                    const sortedData = [...data].sort((a, b) => a - b);
                    const q3Index = Math.floor(sortedData.length * 0.75);
                    const q3 = sortedData[q3Index];
                    const maxNormal = q3 * 2; // 一个简单的启发式计算正常范围的最大值

                    balanceTrendChart.options.scales.y.max = maxNormal;
                    trendViewToggle.textContent = "显示异常值";
                } else {
                    // 恢复自动缩放
                    balanceTrendChart.options.scales.y.max = undefined;
                    trendViewToggle.textContent = "隐藏异常值";
                }

                balanceTrendChart.update();
            }
        });
    }
    
    // 全局多选控件
    document.getElementById("select-all-keys").addEventListener("change", function () {
        const tableCheckbox = document.getElementById("select-all-table");
        if (tableCheckbox) {
            tableCheckbox.checked = this.checked;

            // 触发表格全选按钮的change事件
            const event = new Event("change");
            tableCheckbox.dispatchEvent(event);
        }
    });

    // 显示/隐藏批量配置面板
    document.getElementById("toggle-batch-config").addEventListener("click", function () {
        const configPanel = document.getElementById("batch-config-panel");
        configPanel.classList.toggle("show");
        this.classList.toggle("active");

        // 使用平滑动画效果更新按钮文本
        const btnText = this.querySelector("span");
        const btnIcon = this.querySelector("svg");

        if (configPanel.classList.contains("show")) {
            // 配置面板显示状态
            btnIcon.style.transform = "rotate(180deg)";
            btnText.textContent = "点击收起";

            // 平滑滚动到配置面板
            setTimeout(() => {
                configPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 100);
        } else {
            // 配置面板隐藏状态
            btnIcon.style.transform = "rotate(0)";
            btnText.textContent = "高级设置";
        }
    });

    // 批量检测按钮
    document.getElementById("check-selected-keys").addEventListener("click", async () => {
        try {
            await batchCheckSelectedKeys();
        } catch (error) {
            console.error("批量检测出错:", error);
        }
    });
    // 批量删除按钮
    document
        .getElementById("delete-selected-keys")
        .addEventListener("click", batchDeleteSelectedKeys);

    // 回车按钮检测
    const modalInput = document.getElementById("modal-input");
    modalInput.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            handleModalConfirm();
        }
    });

    // 仪表盘
    document.getElementById("refresh-stats-btn").addEventListener("click", loadDashboard);
    document.getElementById("update-balances-btn").addEventListener("click", updateAllBalances);

    // 密钥
    document.getElementById("add-key-btn").addEventListener("click", addKey);
    document.getElementById("add-bulk-keys-btn").addEventListener("click", addBulkKeys);

    // 按Enter键添加单个密钥
    document.getElementById("add-key-input").addEventListener("keypress", event => {
        if (event.key === "Enter") {
            addKey();
        }
    });

    // 添加间隔类型切换逻辑
    const intervalTypeSelect = document.getElementById("interval-type");

    // 初始化输入框状态
    updateIntervalFields();

    // 监听间隔类型变化
    intervalTypeSelect.addEventListener("change", updateIntervalFields);

    function updateIntervalFields() {
        const intervalType = intervalTypeSelect.value;
        const minIntervalInput = document.getElementById("min-interval");
        const maxIntervalInput = document.getElementById("max-interval");
        const fixedIntervalInput = document.getElementById("concurrency");

        if (intervalType === "fixed") {
            // 启用固定间隔，禁用随机间隔
            fixedIntervalInput.disabled = false;
            minIntervalInput.disabled = true;
            maxIntervalInput.disabled = true;

            // 视觉反馈
            fixedIntervalInput.style.opacity = "1";
            minIntervalInput.style.opacity = "0.5";
            maxIntervalInput.style.opacity = "0.5";
        } else {
            // 启用随机间隔，禁用固定间隔
            fixedIntervalInput.disabled = true;
            minIntervalInput.disabled = false;
            maxIntervalInput.disabled = false;

            // 视觉反馈
            fixedIntervalInput.style.opacity = "0.5";
            minIntervalInput.style.opacity = "1";
            maxIntervalInput.style.opacity = "1";
        }
    }

    // 增强批量配置面板可见性
    enhanceBatchConfigPanelVisibility();

    // 下拉菜单控制
    const moreActionsBtn = document.getElementById("more-actions");
    const dropdownContent = document.querySelector(".dropdown-content");

    moreActionsBtn.addEventListener("click", e => {
        e.stopPropagation();
        dropdownContent.classList.toggle("show");

        // 添加或移除活跃状态样式
        moreActionsBtn.classList.toggle("active", dropdownContent.classList.contains("show"));
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener("click", e => {
        if (!moreActionsBtn.contains(e.target)) {
            dropdownContent.classList.remove("show");
            moreActionsBtn.classList.remove("active");
        }
    });

    // 导出选中密钥
    document.getElementById("export-selected-keys").addEventListener("click", exportSelectedKeys);

    // 清除无效密钥
    document.getElementById("clear-invalid-keys").addEventListener("click", clearInvalidKeys);

    // 导出有效密钥
    document.getElementById("export-valid-keys").addEventListener("click", exportValidKeys);

    // 导出高余额密钥
    document
        .getElementById("export-balance-keys")
        .addEventListener("click", showBalanceFilterModal);

    // 复制所有密钥
    document.getElementById("copy-all-keys").addEventListener("click", copyAllKeys);

    // 复制所选密钥
    document.getElementById("copy-selected-keys").addEventListener("click", copySelectedKeys);

    // 导出过滤后的密钥按钮
    document.getElementById("export-filtered-keys").addEventListener("click", exportFilteredKeys);

    // 停止批量处理按钮点击事件
    document.getElementById("stop-batch-process").addEventListener("click", stopBatchProcessing);

    // 更新分隔符文本显示
    document.getElementById("delimiter-select").addEventListener("change", updateDelimiterDisplay);

    // 更新导出按钮状态
    function updateExportButtonState() {
        document.getElementById("export-selected-keys").disabled = selectedKeys.size === 0;
    }

    // 初始化分隔符显示
    updateDelimiterDisplay();

    // 添加事件监听器
    document.getElementById("delimiter-select").addEventListener("change", updateDelimiterDisplay);
    document.getElementById("custom-delimiter").addEventListener("input", updateDelimiterDisplay);

    // 扩展更新选择状态函数
    const originalUpdateSelectionStatus = updateSelectionStatus;
    window.updateSelectionStatus = function () {
        originalUpdateSelectionStatus();
        updateExportButtonState();
    };

    // 访问控制选择变化时
    const accessControlSelect = document.getElementById("access-control-select");
    if (accessControlSelect) {
        accessControlSelect.addEventListener("change", function () {
            toggleGuestPasswordField(this.value);
        });
    }
    
    // 设置表单提交事件
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
        settingsForm.addEventListener("submit", function(event) {
            event.preventDefault();
            saveSettings(event);
        });
    }
    
    // 初始加载
    loadDashboard();
    
    // 如果在设置标签页，也加载设置
    const settingsTab = document.querySelector(".tab[data-tab='settings']");
    if (settingsTab && settingsTab.classList.contains("active")) {
        loadSettings();
    }
});

// 设置功能
async function loadSettings(attempts = 3) {
    console.log("开始加载设置...");
    try {
        // 添加一个随机参数防止缓存
        const timestamp = new Date().getTime();
        console.log("发送配置请求...");
        const response = await fetch(`/admin/api/config?_=${timestamp}`, {
            // 添加超时处理
            signal: AbortSignal.timeout(10000), // 10秒超时
        });

        if (!response.ok) {
            throw new Error(`加载配置失败: 状态码 ${response.status}`);
        }

        console.log("成功获取响应，解析JSON...");
        const result = await response.json();
        console.log("解析的响应数据:", result);
        
        if (result.success) {
            console.log("加载到的配置数据:", result.data);
            const config = result.data;
            
            // 设置各个字段的值，增加错误处理
            const apiKeyInput = document.getElementById("api-key-input");
            const adminUsernameInput = document.getElementById("admin-username-input");
            const adminPasswordInput = document.getElementById("admin-password-input");
            const pageSizeInput = document.getElementById("page-size-input");
            const httpProxyInput = document.getElementById("http-proxy-input");
            const accessControlSelect = document.getElementById("access-control-select");
            const guestPasswordInput = document.getElementById("guest-password-input");
            
            console.log("正在设置表单字段值...");
            if (apiKeyInput) apiKeyInput.value = config.apiKey || "";
            if (adminUsernameInput) adminUsernameInput.value = config.adminUsername || "";
            if (adminPasswordInput) adminPasswordInput.value = ""; // 不预填密码
            if (pageSizeInput) pageSizeInput.value = config.pageSize || 10;
            if (httpProxyInput) httpProxyInput.value = config.httpProxy || "";
            
            console.log("设置访问控制模式:", config.accessControl);
            // 设置访问控制选项
            if (accessControlSelect) {
                accessControlSelect.value = config.accessControl || "open";
                // 确保触发change事件
                const event = new Event('change');
                accessControlSelect.dispatchEvent(event);
            }
            
            // 显示/隐藏访客密码输入框
            toggleGuestPasswordField(config.accessControl || "open");

            // 预填访客密码（如果存在）
            if (guestPasswordInput) {
                guestPasswordInput.value = ""; // 出于安全考虑，不预填真实密码
                guestPasswordInput.placeholder = config.guestPassword ? "已设置访客密码 (不显示)" : "设置访客密码";
            }
            
            console.log("设置加载完成");
            showToast("设置加载成功");
        } else {
            throw new Error(result.message || "未知错误");
        }
    } catch (error) {
        console.error("加载设置时出错:", error);

        // 如果还有重试次数，尝试重试
        if (attempts > 0) {
            console.log(`尝试重新加载设置，剩余尝试次数: ${attempts - 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒再重试
            return loadSettings(attempts - 1);
        }

        // 显示错误提示
        showToast(`加载设置失败: ${error.message}`, true);
    }
}

// 保存设置功能
async function saveSettings(event) {
    if (event) event.preventDefault();
    
    try {
        // 获取所有输入值
        const apiKey = document.getElementById("api-key-input").value.trim();
        const adminUsername = document.getElementById("admin-username-input").value.trim();
        const adminPassword = document.getElementById("admin-password-input").value.trim();
        const pageSize = document.getElementById("page-size-input").value.trim();
        const httpProxy = document.getElementById("http-proxy-input").value.trim();
        const accessControl = document.getElementById("access-control-select").value;
        const guestPassword = document.getElementById("guest-password-input").value.trim();
        
        // 验证表单
        if (accessControl === "partial" && !guestPassword && !document.getElementById("guest-password-input").placeholder.includes("已设置")) {
            showToast("请设置访客密码", true);
            return;
        }
        
        // 准备数据
        const data = {
            apiKey,
            adminUsername,
            pageSize: parseInt(pageSize) || 10,
            httpProxy,
            accessControl
        };
        
        // 仅当有输入密码时才更新密码
        if (adminPassword) {
            data.adminPassword = adminPassword;
        }
        
        // 仅当访问控制为部分开放并且输入了密码时更新访客密码
        if (accessControl === "partial" && guestPassword) {
            data.guestPassword = guestPassword;
        }
        
        console.log("正在保存设置...", data);
        
        // 发送请求
        const response = await fetch("/admin/api/update-config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`保存设置失败: 状态码 ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            showToast("设置保存成功");
            
            // 清空密码字段
            document.getElementById("admin-password-input").value = "";
            document.getElementById("guest-password-input").value = "";
            
            // 更新访客密码提示
            if (accessControl === "partial" && guestPassword) {
                document.getElementById("guest-password-input").placeholder = "已设置访客密码 (不显示)";
            }
        } else {
            throw new Error(result.message || "保存设置失败");
        }
    } catch (error) {
        console.error("保存设置时出错:", error);
        showToast(`保存设置失败: ${error.message}`, true);
    }
}

// 切换访客密码输入框显示/隐藏
function toggleGuestPasswordField(accessControlValue) {
    const guestPasswordGroup = document.getElementById("guest-password-group");
    if (accessControlValue === "partial") {
        guestPasswordGroup.style.display = "block";
    } else {
        guestPasswordGroup.style.display = "none";
    }
}

// 更新分隔符显示
function updateDelimiterDisplay() {
    const delimiterSelect = document.getElementById("delimiter-select");
    const customDelimiterInput = document.getElementById("custom-delimiter");
    const delimiterDisplay = document.getElementById("delimiter-display");
    
    let delimiter = "";
    
    if (delimiterSelect.value === "custom") {
        customDelimiterInput.style.display = "inline-block";
        delimiter = customDelimiterInput.value || "";
    } else {
        customDelimiterInput.style.display = "none";
        
        switch (delimiterSelect.value) {
            case "newline": delimiter = "换行"; break;
            case "comma": delimiter = ","; break;
            case "tab": delimiter = "Tab"; break;
            case "space": delimiter = "空格"; break;
            default: delimiter = "换行";
        }
    }
    
    delimiterDisplay.textContent = delimiter ? `分隔符: "${delimiter}"` : "请选择分隔符";
}

// 批量删除选中的密钥
async function batchDeleteSelectedKeys() {
    if (selectedKeys.size === 0) {
        showToast("请选择要删除的密钥", true);
        return;
    }

    confirmDialog(`确定要删除选中的 ${selectedKeys.size} 个密钥吗？此操作不可恢复。`, async (confirmed) => {
        if (!confirmed) return;

        try {
            // 将 Set 转换为数组
            const keysToDelete = Array.from(selectedKeys);
            
            const response = await fetch("/admin/api/delete-keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ keys: keysToDelete })
            });

            if (!response.ok) {
                throw new Error("删除密钥失败");
            }

            const result = await response.json();
            if (result.success) {
                showToast(`成功删除 ${result.deleted} 个密钥`);
                // 清空选中的密钥
                selectedKeys.clear();
                // 重新加载密钥列表
                loadAllKeys();
                // 更新仪表盘
                loadDashboard();
            } else {
                throw new Error(result.message || "删除密钥失败");
            }
        } catch (error) {
            console.error("删除密钥时出错:", error);
            showToast(`删除密钥失败: ${error.message}`, true);
        }
    });
}

// 加载所有密钥到密钥管理页面
async function loadAllKeys(page = 1) {
    try {
        const keysPerPage = parseInt(document.getElementById("keys-per-page").value) || 10;
        const searchQuery = document.getElementById("search-input").value.trim();
        
        // 构建查询参数
        const params = new URLSearchParams({
            page: page,
            limit: keysPerPage,
            sort: currentSortField,
            order: currentSortOrder
        });
        
        // 如果有搜索查询，添加到参数中
        if (searchQuery) {
            params.append("search", searchQuery);
        }
        
        const response = await fetch(`/admin/api/keys?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error("加载密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderKeysTable(result.data, result.total, page, keysPerPage);
            updateSelectionStatus();
        } else {
            throw new Error(result.message || "加载密钥失败");
        }
    } catch (error) {
        console.error("加载密钥时出错:", error);
        showToast(`加载密钥失败: ${error.message}`, true);
    }
}

// 渲染密钥表格
function renderKeysTable(keys, totalKeys, currentPage, keysPerPage) {
    const tableBody = document.getElementById("keys-table-body");
    const paginationContainer = document.getElementById("pagination-container");
    
    // 清空表格
    tableBody.innerHTML = "";
    
    if (keys.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">没有找到密钥</td></tr>';
        paginationContainer.innerHTML = "";
        return;
    }
    
    // 填充表格数据
    keys.forEach(key => {
        const row = document.createElement("tr");
        row.setAttribute("data-key", key.key);
        
        // 确定行的状态类
        let rowClass = "";
        if (key.lastError) {
            rowClass = "error";
        } else if (parseFloat(key.balance) <= 0) {
            rowClass = "warning";
        }
        
        if (rowClass) {
            row.classList.add(rowClass);
        }
        
        // 如果密钥在选中集合中，设置选中状态
        const isSelected = selectedKeys.has(key.key);
        if (isSelected) {
            row.classList.add("selected");
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="key-checkbox" ${isSelected ? 'checked' : ''} 
                       onchange="toggleKeySelection('${key.key}', this.checked)">
            </td>
            <td class="key-cell">${key.key}</td>
            <td>${key.balance || "0.00"}</td>
            <td>${key.lastError ? '<span class="error-text">失败</span>' : 
                   (parseFloat(key.balance) <= 0 ? '<span class="warning-text">余额不足</span>' : 
                   '<span class="success-text">正常</span>')}</td>
            <td>${new Date(key.added).toLocaleString()}</td>
            <td>${key.lastUpdated ? new Date(key.lastUpdated).toLocaleString() : '从未'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-outline" onclick="checkKey('${key.key}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="copyKey('${key.key}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button class="btn btn-sm btn-outline danger" onclick="deleteKey('${key.key}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 创建分页
    renderPagination(totalKeys, currentPage, keysPerPage);
    
    // 更新选择状态显示
    updateSelectionStatus();
}

// 创建分页控件
function renderPagination(totalItems, currentPage, itemsPerPage) {
    const paginationContainer = document.getElementById("pagination-container");
    paginationContainer.innerHTML = "";
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        return;
    }
    
    const ul = document.createElement("ul");
    ul.className = "pagination";
    
    // 上一页按钮
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" ${currentPage > 1 ? `onclick="loadAllKeys(${currentPage - 1})"` : ''}>上一页</a>`;
    ul.appendChild(prevLi);
    
    // 页码按钮
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement("li");
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" onclick="loadAllKeys(${i})">${i}</a>`;
        ul.appendChild(pageLi);
    }
    
    // 下一页按钮
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" ${currentPage < totalPages ? `onclick="loadAllKeys(${currentPage + 1})"` : ''}>下一页</a>`;
    ul.appendChild(nextLi);
    
    paginationContainer.appendChild(ul);
}

// 加载最近添加的密钥到仪表盘
async function loadRecentKeys() {
    try {
        const response = await fetch("/admin/api/keys?limit=5&sort=added&order=desc");
        
        if (!response.ok) {
            throw new Error("加载最近密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            renderRecentKeysTable(result.data);
        } else {
            throw new Error(result.message || "加载最近密钥失败");
        }
    } catch (error) {
        console.error("加载最近密钥时出错:", error);
        showToast(`加载最近密钥失败: ${error.message}`, true);
    }
}

// 渲染最近添加的密钥表格
function renderRecentKeysTable(keys) {
    const tableBody = document.getElementById("recent-keys-table-body");
    
    // 清空表格
    tableBody.innerHTML = "";
    
    if (keys.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">没有找到密钥</td></tr>';
        return;
    }
    
    // 填充表格数据
    keys.forEach(key => {
        const row = document.createElement("tr");
        
        // 确定行的状态类
        let rowClass = "";
        if (key.lastError) {
            rowClass = "error";
        } else if (parseFloat(key.balance) <= 0) {
            rowClass = "warning";
        }
        
        if (rowClass) {
            row.classList.add(rowClass);
        }
        
        row.innerHTML = `
            <td class="key-cell">${key.key}</td>
            <td>${key.balance || "0.00"}</td>
            <td>${key.lastError ? '<span class="error-text">失败</span>' : 
                   (parseFloat(key.balance) <= 0 ? '<span class="warning-text">余额不足</span>' : 
                   '<span class="success-text">正常</span>')}</td>
            <td>${new Date(key.added).toLocaleString()}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-outline" onclick="checkKey('${key.key}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="copyKey('${key.key}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 更新选择状态显示
function updateSelectionStatus() {
    const selectedCount = document.getElementById("selected-count");
    if (selectedCount) {
        selectedCount.textContent = selectedKeys.size;
    }
    
    // 显示/隐藏批量操作工具栏
    const batchTools = document.getElementById("batch-tools");
    if (batchTools) {
        if (selectedKeys.size > 0) {
            batchTools.classList.add("show");
        } else {
            batchTools.classList.remove("show");
        }
    }
    
    // 更新全选复选框
    const selectAllCheckbox = document.getElementById("select-all-table");
    if (selectAllCheckbox) {
        const allCheckboxes = document.querySelectorAll(".key-checkbox");
        if (allCheckboxes.length > 0 && selectedKeys.size === allCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedKeys.size > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
}

// 切换单个密钥选择状态
function toggleKeySelection(key, isSelected) {
    if (isSelected) {
        selectedKeys.add(key);
    } else {
        selectedKeys.delete(key);
    }
    
    // 更新表格行的选中状态
    const row = document.querySelector(`tr[data-key="${key}"]`);
    if (row) {
        if (isSelected) {
            row.classList.add("selected");
        } else {
            row.classList.remove("selected");
        }
    }
    
    // 更新显示
    updateSelectionStatus();
}

// 批量检测选中的密钥
async function batchCheckSelectedKeys() {
    if (selectedKeys.size === 0) {
        showToast("请选择要检测的密钥", true);
        return;
    }
    
    // 重置停止标志
    isBatchProcessingStopped = false;
    
    // 显示进度条
    const progressContainer = document.getElementById("batch-progress-container");
    const progressBar = document.getElementById("batch-progress");
    const progressText = document.getElementById("batch-progress-text");
    const cancelButton = document.getElementById("stop-batch-process");
    
    if (progressContainer) progressContainer.style.display = "block";
    if (progressBar) progressBar.style.width = "0%";
    if (progressText) progressText.textContent = "0/" + selectedKeys.size;
    if (cancelButton) cancelButton.style.display = "inline-block";
    
    // 获取并验证间隔设置
    const intervalType = document.getElementById("interval-type").value;
    let delay = 0;
    
    try {
        // 根据间隔类型设置延迟
        if (intervalType === "fixed") {
            // 固定间隔
            const concurrency = parseInt(document.getElementById("concurrency").value) || 1;
            if (concurrency < 1) throw new Error("并发数必须大于0");
            
            // 使用并发处理
            const keysArray = Array.from(selectedKeys);
            const results = [];
            let completed = 0;
            
            // 分批处理
            for (let i = 0; i < keysArray.length; i += concurrency) {
                if (isBatchProcessingStopped) {
                    showToast("批量检测已停止");
                    break;
                }
                
                const batch = keysArray.slice(i, i + concurrency);
                const batchPromises = batch.map(key => checkKeyWithRetry(key));
                const batchResults = await Promise.allSettled(batchPromises);
                
                results.push(...batchResults);
                completed += batch.length;
                
                // 更新进度
                if (progressBar) progressBar.style.width = (completed / selectedKeys.size * 100) + "%";
                if (progressText) progressText.textContent = completed + "/" + selectedKeys.size;
            }
            
            // 处理结果
            handleBatchResults(results);
        } else {
            // 随机间隔
            const minInterval = parseInt(document.getElementById("min-interval").value) || 1000;
            const maxInterval = parseInt(document.getElementById("max-interval").value) || 3000;
            
            if (minInterval < 0) throw new Error("最小间隔不能小于0");
            if (maxInterval < minInterval) throw new Error("最大间隔不能小于最小间隔");
            
            // 依次处理每个密钥
            const keysArray = Array.from(selectedKeys);
            const results = [];
            
            for (let i = 0; i < keysArray.length; i++) {
                if (isBatchProcessingStopped) {
                    showToast("批量检测已停止");
                    break;
                }
                
                const key = keysArray[i];
                // 随机延迟
                if (i > 0) {
                    const randomDelay = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
                    await new Promise(resolve => setTimeout(resolve, randomDelay));
                }
                
                try {
                    const result = await checkKeyWithRetry(key);
                    results.push({ status: "fulfilled", value: result });
                } catch (error) {
                    results.push({ status: "rejected", reason: error });
                }
                
                // 更新进度
                if (progressBar) progressBar.style.width = ((i + 1) / selectedKeys.size * 100) + "%";
                if (progressText) progressText.textContent = (i + 1) + "/" + selectedKeys.size;
            }
            
            // 处理结果
            handleBatchResults(results);
        }
    } catch (error) {
        showToast(error.message, true);
    } finally {
        // 隐藏进度条
        if (progressContainer) progressContainer.style.display = "none";
        if (cancelButton) cancelButton.style.display = "none";
    }
}

// 处理批量检测结果
function handleBatchResults(results) {
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - successful;
    
    showToast(`批量检测完成。成功: ${successful}, 失败: ${failed}`);
    
    // 重新加载数据
    loadAllKeys();
}

// 带有重试的密钥检测
async function checkKeyWithRetry(key, maxRetries = 2) {
    let retries = 0;
    
    while (retries <= maxRetries) {
        try {
            return await checkKey(key);
        } catch (error) {
            retries++;
            if (retries > maxRetries) throw error;
            // 等待一段时间再重试
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// 检测单个密钥
async function checkKey(key) {
    try {
        const response = await fetch("/admin/api/check-key", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ key })
        });
        
        if (!response.ok) {
            throw new Error("检测密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            const row = document.querySelector(`tr[data-key="${key}"]`);
            
            if (row) {
                // 更新表格行
                const balanceCell = row.querySelector("td:nth-child(3)");
                const statusCell = row.querySelector("td:nth-child(4)");
                const lastUpdatedCell = row.querySelector("td:nth-child(6)");
                
                if (balanceCell) balanceCell.textContent = result.balance || "0.00";
                
                if (statusCell) {
                    if (result.error) {
                        statusCell.innerHTML = '<span class="error-text">失败</span>';
                        row.className = "error";
                    } else if (parseFloat(result.balance) <= 0) {
                        statusCell.innerHTML = '<span class="warning-text">余额不足</span>';
                        row.className = "warning";
                    } else {
                        statusCell.innerHTML = '<span class="success-text">正常</span>';
                        row.className = "";
                    }
                }
                
                if (lastUpdatedCell) lastUpdatedCell.textContent = new Date().toLocaleString();
            }
            
            showToast(`密钥检测完成: ${result.error ? "失败" : "成功"}`);
            return result;
        } else {
            throw new Error(result.message || "检测密钥失败");
        }
    } catch (error) {
        console.error("检测密钥时出错:", error);
        showToast(`检测密钥失败: ${error.message}`, true);
        throw error;
    }
}

// 停止批量处理
function stopBatchProcessing() {
    isBatchProcessingStopped = true;
    showToast("正在停止批量处理...");
}

// 更新所有密钥余额
async function updateAllBalances() {
    try {
        const response = await fetch("/admin/api/update-all-balances", {
            method: "POST"
        });
        
        if (!response.ok) {
            throw new Error("更新余额失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast("已开始后台更新所有密钥余额，请稍后刷新页面查看结果");
        } else {
            throw new Error(result.message || "更新余额失败");
        }
    } catch (error) {
        console.error("更新余额时出错:", error);
        showToast(`更新余额失败: ${error.message}`, true);
    }
}

// 添加单个密钥
async function addKey() {
    const input = document.getElementById("add-key-input");
    const key = input.value.trim();
    
    if (!key) {
        showToast("请输入密钥", true);
        return;
    }
    
    try {
        const response = await fetch("/admin/api/add-key", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ key })
        });
        
        if (!response.ok) {
            throw new Error("添加密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast("密钥添加成功");
            input.value = ""; // 清空输入框
            
            // 刷新数据
            loadAllKeys();
            loadDashboard();
        } else {
            throw new Error(result.message || "添加密钥失败");
        }
    } catch (error) {
        console.error("添加密钥时出错:", error);
        showToast(`添加密钥失败: ${error.message}`, true);
    }
}

// 批量添加密钥
async function addBulkKeys() {
    const textarea = document.getElementById("bulk-keys-input");
    const text = textarea.value.trim();
    
    if (!text) {
        showToast("请输入密钥", true);
        return;
    }
    
    // 分割文本
    const keys = text
        .split(/[\n,;\s]+/) // 支持多种分隔符：换行、逗号、分号、空格
        .map(key => key.trim())
        .filter(key => key); // 过滤空值
    
    if (keys.length === 0) {
        showToast("没有找到有效的密钥", true);
        return;
    }
    
    try {
        const response = await fetch("/admin/api/add-keys-bulk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keys })
        });
        
        if (!response.ok) {
            throw new Error("批量添加密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`成功添加 ${result.added} 个密钥，已存在 ${result.existing} 个`);
            textarea.value = ""; // 清空输入框
            
            // 关闭批量添加模态框
            const modal = document.getElementById("bulk-add-modal");
            if (modal) modal.classList.remove("show");
            
            // 刷新数据
            loadAllKeys();
            loadDashboard();
        } else {
            throw new Error(result.message || "批量添加密钥失败");
        }
    } catch (error) {
        console.error("批量添加密钥时出错:", error);
        showToast(`批量添加密钥失败: ${error.message}`, true);
    }
}

// 删除单个密钥
async function deleteKey(key) {
    confirmDialog(`确定要删除此密钥吗？此操作不可恢复。`, async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const response = await fetch("/admin/api/delete-key", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ key })
            });
            
            if (!response.ok) {
                throw new Error("删除密钥失败");
            }
            
            const result = await response.json();
            
            if (result.success) {
                showToast("密钥删除成功");
                
                // 如果密钥在选中集合中，从中移除
                if (selectedKeys.has(key)) {
                    selectedKeys.delete(key);
                }
                
                // 刷新数据
                loadAllKeys();
                loadDashboard();
            } else {
                throw new Error(result.message || "删除密钥失败");
            }
        } catch (error) {
            console.error("删除密钥时出错:", error);
            showToast(`删除密钥失败: ${error.message}`, true);
        }
    });
}

// 复制单个密钥
function copyKey(key) {
    navigator.clipboard
        .writeText(key)
        .then(() => showToast("密钥已复制到剪贴板"))
        .catch(() => showToast("复制失败", true));
}

// 复制所有密钥
async function copyAllKeys() {
    try {
        const response = await fetch("/admin/api/keys?limit=1000");
        
        if (!response.ok) {
            throw new Error("获取密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            const keys = result.data.map(k => k.key).join("\n");
            
            navigator.clipboard
                .writeText(keys)
                .then(() => showToast(`已复制 ${result.data.length} 个密钥到剪贴板`))
                .catch(() => showToast("复制失败", true));
        } else {
            throw new Error(result.message || "获取密钥失败");
        }
    } catch (error) {
        console.error("复制所有密钥时出错:", error);
        showToast(`复制所有密钥失败: ${error.message}`, true);
    }
}

// 复制选中的密钥
function copySelectedKeys() {
    if (selectedKeys.size === 0) {
        showToast("请选择要复制的密钥", true);
        return;
    }
    
    const keys = Array.from(selectedKeys).join("\n");
    
    navigator.clipboard
        .writeText(keys)
        .then(() => showToast(`已复制 ${selectedKeys.size} 个密钥到剪贴板`))
        .catch(() => showToast("复制失败", true));
}

// 导出选中的密钥
function exportSelectedKeys() {
    if (selectedKeys.size === 0) {
        showToast("请选择要导出的密钥", true);
        return;
    }
    
    const keys = Array.from(selectedKeys).join("\n");
    const blob = new Blob([keys], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected_keys_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// 清除无效密钥
async function clearInvalidKeys() {
    confirmDialog("确定要删除所有无效密钥吗？包括余额为0和出错的密钥。此操作不可恢复。", async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const response = await fetch("/admin/api/clear-invalid-keys", {
                method: "POST"
            });
            
            if (!response.ok) {
                throw new Error("清除无效密钥失败");
            }
            
            const result = await response.json();
            
            if (result.success) {
                showToast(`成功删除 ${result.deleted} 个无效密钥`);
                
                // 清空选中的密钥
                selectedKeys.clear();
                
                // 刷新数据
                loadAllKeys();
                loadDashboard();
            } else {
                throw new Error(result.message || "清除无效密钥失败");
            }
        } catch (error) {
            console.error("清除无效密钥时出错:", error);
            showToast(`清除无效密钥失败: ${error.message}`, true);
        }
    });
}

// 导出有效密钥
async function exportValidKeys() {
    try {
        const response = await fetch("/admin/api/keys?filter=valid");
        
        if (!response.ok) {
            throw new Error("获取有效密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            const keys = result.data.map(k => k.key).join("\n");
            
            if (keys.length === 0) {
                showToast("没有找到有效密钥", true);
                return;
            }
            
            const blob = new Blob([keys], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `valid_keys_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            
            URL.revokeObjectURL(url);
        } else {
            throw new Error(result.message || "获取有效密钥失败");
        }
    } catch (error) {
        console.error("导出有效密钥时出错:", error);
        showToast(`导出有效密钥失败: ${error.message}`, true);
    }
}

// 显示余额过滤模态框
function showBalanceFilterModal() {
    showModal({
        title: "导出高余额密钥",
        message: "请输入最小余额值，将导出所有余额大于等于此值的密钥",
        input: true,
        inputType: "number",
        placeholder: "例如：10",
        value: "10",
        confirmText: "导出",
        callback: (value) => {
            const minBalance = parseFloat(value);
            if (isNaN(minBalance) || minBalance < 0) {
                showToast("请输入有效的余额值", true);
                return;
            }
            
            exportKeysWithMinBalance(minBalance);
        }
    });
}

// 导出高余额密钥
async function exportKeysWithMinBalance(minBalance) {
    try {
        const response = await fetch(`/admin/api/keys?filter=min_balance&value=${minBalance}`);
        
        if (!response.ok) {
            throw new Error("获取高余额密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            const keys = result.data.map(k => k.key).join("\n");
            
            if (keys.length === 0) {
                showToast(`没有找到余额 >= ${minBalance} 的密钥`, true);
                return;
            }
            
            const blob = new Blob([keys], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `keys_min_balance_${minBalance}_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showToast(`已导出 ${result.data.length} 个余额 >= ${minBalance} 的密钥`);
        } else {
            throw new Error(result.message || "获取高余额密钥失败");
        }
    } catch (error) {
        console.error("导出高余额密钥时出错:", error);
        showToast(`导出高余额密钥失败: ${error.message}`, true);
    }
}

// 导出过滤后的密钥
function exportFilteredKeys() {
    const searchQuery = document.getElementById("search-input").value.trim();
    
    if (!searchQuery) {
        showToast("请先输入搜索条件", true);
        return;
    }
    
    exportKeysWithFilter(searchQuery);
}

// 导出带过滤条件的密钥
async function exportKeysWithFilter(filter) {
    try {
        const response = await fetch(`/admin/api/keys?search=${encodeURIComponent(filter)}&limit=1000`);
        
        if (!response.ok) {
            throw new Error("获取过滤密钥失败");
        }
        
        const result = await response.json();
        
        if (result.success) {
            const keys = result.data.map(k => k.key).join("\n");
            
            if (keys.length === 0) {
                showToast("没有找到匹配的密钥", true);
                return;
            }
            
            const blob = new Blob([keys], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `filtered_keys_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showToast(`已导出 ${result.data.length} 个匹配的密钥`);
        } else {
            throw new Error(result.message || "获取过滤密钥失败");
        }
    } catch (error) {
        console.error("导出过滤密钥时出错:", error);
        showToast(`导出过滤密钥失败: ${error.message}`, true);
    }
}

// 增强批量配置面板可见性
function enhanceBatchConfigPanelVisibility() {
    const configButton = document.getElementById("toggle-batch-config");
    const configPanel = document.getElementById("batch-config-panel");
    
    if (!configButton || !configPanel) return;
    
    // 如果用户曾经展开过配置面板，记住这个状态
    const wasExpanded = localStorage.getItem("batch_config_expanded") === "true";
    
    if (wasExpanded) {
        configPanel.classList.add("show");
        configButton.classList.add("active");
        
        // 更新按钮文本和图标
        const btnText = configButton.querySelector("span");
        const btnIcon = configButton.querySelector("svg");
        
        if (btnText) btnText.textContent = "点击收起";
        if (btnIcon) btnIcon.style.transform = "rotate(180deg)";
    }
    
    // 监听配置面板的展开/折叠状态变化
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === "class") {
                const isExpanded = configPanel.classList.contains("show");
                localStorage.setItem("batch_config_expanded", isExpanded);
            }
        });
    });
    
    observer.observe(configPanel, { attributes: true });
}
