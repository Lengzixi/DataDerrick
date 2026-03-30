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

    // ================= 2. 叠加按钮：触发叠加表格和画图 =================
    btnOverlay.addEventListener('click', () => {
        // 1. 获取所有选中的复选框
        const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
        if (checkedBoxes.length === 0) {
            alert("请在表格中至少勾选一项进行叠加！");
            return;
        }

        // 2. 收集选中的数据索引和详情
        const selectedIndices = [];
        const selectedData = [];
        checkedBoxes.forEach(cb => {
            const index = parseInt(cb.value);
            selectedIndices.push(index + 1); // 序号（加1因为索引从0开始）
            selectedData.push(window.currentChartData[index]);
        });

        // 3. 构造传递给后端预留接口的数据（可选）
        const wellId = document.getElementById('well_id').value || selectedData[0].well_id;
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;

        // 向后端发送请求（保留你要求的接口）
        fetch('/api/overlay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ well_id: wellId, start_time: startTime, end_time: endTime, selected_indices: selectedIndices })
        }).then(response => response.json()).then(data => console.log("后端叠加接口响应:", data));

        // 4. 前端直接渲染叠加视图
        renderOverlayView(selectedIndices, selectedData);
    });

    // ================= 3. 表格渲染函数（改造了容器结构） =================
    function renderTable(dataList) {
        // 我们在展示区内部划分两个区域：上方用于叠加，下方用于原始表格
        let layoutHTML = `
            <div id="overlay-area"></div>
            <div id="table-area">
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
            // 这里将 value 改为纯 index，方便叠加时直接从数组取数据
            layoutHTML += `
                <tr class="main-row">
                    <td><input type="checkbox" class="row-checkbox" value="${index}"></td>
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

        layoutHTML += `</tbody></table></div>`;
        displayArea.innerHTML = layoutHTML;

        // 挂载全局数据
        window.currentChartData = dataList;
        window.renderedCharts = {};
    }

    // ================= 4. 渲染叠加表格与图表 =================
    function renderOverlayView(indices, dataList) {
        const overlayArea = document.getElementById('overlay-area');
        const overlayContainerId = 'overlay-chart-container';
        
        // 拼接序号和时间
        const seqStr = indices.join(', ');
        const timeStr = dataList.map(item => item.collection_time).join('<br>');
        const wellIdStr = dataList[0].well_id; // 假设叠加的是同一口井

        // 构建叠加专用的表格（默认展开图表行）
        const overlayHTML = `
            <h3 style="margin-bottom: 10px; color: #1890ff; font-size: 16px;">📈 叠加分析结果</h3>
            <table class="data-table" style="margin-bottom: 30px; border: 2px solid #1890ff;">
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
                    <tr class="main-row" style="background-color: #e6f7ff;">
                        <td></td>
                        <td>${seqStr}</td>
                        <td>山东石油化工学院</td>
                        <td>${wellIdStr}</td>
                        <td>${timeStr}</td>
                        <td>正常工况</td>
                        <td>无报警</td>
                        <td><span class="toggle-btn" style="color: #999; cursor: default;">默认展开</span></td>
                    </tr>
                    <tr class="chart-row active" style="display: table-row;">
                        <td colspan="8">
                            <div id="${overlayContainerId}" class="chart-container"></div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;

        overlayArea.innerHTML = overlayHTML;

        // 调用专用的叠加绘图函数
        drawOverlayChart(dataList, overlayContainerId);
    }

    // ================= 5. 单行展开/收起 + 单图绘制 =================
    window.toggleChart = function(index, containerId) {
        const chartRow = document.getElementById(`row-chart-${index}`);
        const isHidden = window.getComputedStyle(chartRow).display === 'none';

        if (isHidden) {
            chartRow.classList.add('active');
            if (!window.renderedCharts[index]) {
                drawEchart(window.currentChartData[index], containerId);
                window.renderedCharts[index] = true;
            }
        } else {
            chartRow.classList.remove('active');
        }
    };

    function drawEchart(data, containerId) {
        const chartDom = document.getElementById(containerId);
        const myChart = echarts.init(chartDom);

        const halfLength = data.x_data.length / 2;
        const line1Data = [];
        const line2Data = [];

        for (let i = 0; i < halfLength; i++) {
            line1Data.push([data.x_data[i], data.y_data[i]]);
            line2Data.push([data.x_data[i + halfLength], data.y_data[i + halfLength]]);
        }

        const option = getBaseChartOption(`井号 ${data.well_id} 功图分析`);
        option.series = [
            { name: '曲线上半部分', type: 'line', smooth: true, data: line1Data, itemStyle: { color: 'red' }, lineStyle: { color: 'red' } },
            { name: '曲线下半部分', type: 'line', smooth: true, data: line2Data, itemStyle: { color: 'blue' }, lineStyle: { color: 'blue' } }
        ];

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    }

    // ================= 6. 叠加多图绘制逻辑 =================
    function drawOverlayChart(dataList, containerId) {
        const chartDom = document.getElementById(containerId);
        // 如果图表已存在，先销毁重新初始化
        let myChart = echarts.getInstanceByDom(chartDom);
        if (myChart) { myChart.dispose(); }
        myChart = echarts.init(chartDom);

        const series = [];

        // 遍历选中的每一条数据
        dataList.forEach((data, index) => {
            const halfLength = data.x_data.length / 2;
            const line1Data = [];
            const line2Data = [];

            for (let i = 0; i < halfLength; i++) {
                line1Data.push([data.x_data[i], data.y_data[i]]);
                line2Data.push([data.x_data[i + halfLength], data.y_data[i + halfLength]]);
            }

            // 提取时间后缀（HH:MM:SS）作为图例区分
            const timeLabel = data.collection_time.substring(11);
            
            // 为了视觉上区分叠加的线，后加入的线稍微加一点透明度或采用虚线
            const lineType = index === 0 ? 'solid' : 'dashed'; 

            series.push({
                name: `上半部 (${timeLabel})`,
                type: 'line',
                smooth: true,
                data: line1Data,
                itemStyle: { color: 'red' },
                lineStyle: { color: 'red', type: lineType, width: 2 }
            });
            series.push({
                name: `下半部 (${timeLabel})`,
                type: 'line',
                smooth: true,
                data: line2Data,
                itemStyle: { color: 'blue' },
                lineStyle: { color: 'blue', type: lineType, width: 2 }
            });
        });

        const option = getBaseChartOption(`井号 ${dataList[0].well_id} 叠加功图分析`);
        option.series = series;

        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    }

    // ================= 7. ECharts 基础配置提取 =================
    function getBaseChartOption(titleText) {
        return {
            title: { text: titleText, left: 'center' },
            tooltip: { trigger: 'item' },
            legend: { top: 'bottom' },
            xAxis: { type: 'value', name: '位移 (m)', scale: true },
            yAxis: { type: 'value', name: '载荷 (kN)', scale: true }
        };
    }
});