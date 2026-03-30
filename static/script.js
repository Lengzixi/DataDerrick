document.addEventListener('DOMContentLoaded', function () {
    const btnQuery = document.getElementById('btn-query');
    const btnOverlay = document.getElementById('btn-overlay');
    const displayArea = document.getElementById('result-message');

    // 通用的发送请求函数
    function sendRequest(endpoint) {
        // 获取诊断时间
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

        // 显示加载提示
        displayArea.innerHTML = "正在向后端发送请求...";

        // 使用 Fetch API 调用 Flask 接口
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                well_id: wellId,
                start_time: startTime,
                end_time: endTime
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // 将后端返回的信息展示在页面底部
                displayArea.innerHTML = `<span style="color: green;">✔ ${data.message} (时间: ${startTime} 至 ${endTime})</span>`;
            })
            .catch(error => {
                console.error('Error:', error);
                displayArea.innerHTML = `<span style="color: red;">❌ 请求失败，请检查控制台或后端运行状态。</span>`;
            });
    }

    // 绑定点击事件
    btnQuery.addEventListener('click', () => sendRequest('/api/query'));
    btnOverlay.addEventListener('click', () => sendRequest('/api/overlay'));
});