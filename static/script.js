document.addEventListener('DOMContentLoaded', function () {
    const btnQuery = document.getElementById('btn-query');
    const btnOverlay = document.getElementById('btn-overlay');
    const displayArea = document.getElementById('result-message');

    // ================= 1. 查询按钮：生成表格 + ECharts 功图 =================
    btnQuery.addEventListener('click', () => {
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;
        const wellId = document.getElementById('well_id').value;

        if (!startTime || !endTime) {
            alert("请选择完整的诊断时间！");
            return;
        }
        if (!wellId) {
            alert("请输入井号！");
            return;
        }

        displayArea.innerHTML = "正在查询数据...";

        fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ well_id: wellId, start_time: startTime, end_time: endTime })
        })
        .then(response => response.json())
        .then(res => {
            if (res.data && res.data.length > 0) {
                renderTable(res.data);
            } else {
                displayArea.innerHTML = "<div style='text-align:center; padding: 20px;'>未查询到数据</div>";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayArea.innerHTML = `<span style="color: red;">❌ 请求失败</span>`;
        });
    });

    // ================= 2. 叠加按钮：保留原来的简单提示（未覆盖表格逻辑） =================
    btnOverlay.addEventListener('click', () => {
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;
        const wellId = document.getElementById('well_id').value;

        if (!startTime || !endTime) {
            alert("请选择完整的诊断时间！");
            return;
        }
        if (!wellId) {
            alert("请输入井号！");
            return;
        }

        displayArea.innerHTML = "正在向后端发送叠加请求...";

        fetch('/api/overlay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ well_id: wellId, start_time: startTime, end_time: endTime })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displayArea.innerHTML = `<span style="color: green;">✔ ${data.message} (时间: ${startTime} 至 ${endTime})</span>`;
        })
        .catch(error => {
            console.error('Error:', error);
            displayArea.innerHTML = `<span style="color: red;">❌ 叠加请求失败，请检查控制台或后端运行状态。</span>`;
        });
    });

    // ================= 3. 表格渲染函数 =================
    function renderTable(dataList) {
        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>选择</th>
                        <th>序号</th>
                        <th>单位</th>
                        <th>井号</th>
                        <th>采集时间</th>
                        <th>工况类型</th>
                        <th>报警类型</th>
                        <th>功图操作</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dataList.forEach((item, index) => {
            let rowId = `chart-container-${index}`;
            let checkboxVal = `${item.well_id}|${item.collection_time}`;

            tableHTML += `
                <tr class="main-row">
                    <td><input type="checkbox" class="row-checkbox" value="${checkboxVal}"></td>
                    <td>${index + 1}</td>
                    <td>山东石油化工学院</td>
                    <td>${item.well_id}</td>
                    <td>${item.collection_time}</td>
                    <td>正常工况</td>
                    <td>无报警</td>
                    <td><span class="toggle-btn" onclick="toggleChart(${index}, '${rowId}')">展开功图 ▼</span></td>
                </tr>
                <tr class="chart-row" id="row-chart-${index}">
                    <td colspan="8">
                        <div id="${rowId}" class="chart-container"></div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        displayArea.innerHTML = tableHTML;

        // 挂载全局数据，供 toggleChart 使用
        window.currentChartData = dataList;
        window.renderedCharts = {};
    }

    // ================= 4. 展开/收起 + 绘图 =================
    window.toggleChart = function(index, containerId) {
        const chartRow = document.getElementById(`row-chart-${index}`);
        const isHidden = window.getComputedStyle(chartRow).display === 'none';

        if (isHidden) {
            chartRow.classList.add('active');
            if (!window.renderedCharts[index]) {
                drawEchart(index, containerId);
                window.renderedCharts[index] = true;
            }
        } else {
            chartRow.classList.remove('active');
        }
    };

    function drawEchart(index, containerId) {
        const chartDom = document.getElementById(containerId);
        const myChart = echarts.init(chartDom);
        const data = window.currentChartData[index];

        // 拆分前后半段数据
        const halfLength = data.x_data.length / 2;
        const line1Data = [];
        const line2Data = [];

        for (let i = 0; i < halfLength; i++) {
            line1Data.push([data.x_data[i], data.y_data[i]]);
            line2Data.push([data.x_data[i + halfLength], data.y_data[i + halfLength]]);
        }

        const option = {
            title: { text: `井号 ${data.well_id} 功图分析`, left: 'center' },
            tooltip: { trigger: 'item' },
            legend: { top: 'bottom' },
            xAxis: { type: 'value', name: '位移 (m)' },
            yAxis: { type: 'value', name: '载荷 (kN)' },
            series: [
                {
                    name: '曲线上半部分',
                    type: 'line',
                    smooth: true,
                    data: line1Data,
                    itemStyle: { color: 'red' },
                    lineStyle: { color: 'red' }
                },
                {
                    name: '曲线下半部分',
                    type: 'line',
                    smooth: true,
                    data: line2Data,
                    itemStyle: { color: 'blue' },
                    lineStyle: { color: 'blue' }
                }
            ]
        };

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    }
});