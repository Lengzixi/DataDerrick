from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)


MOCK_DATABASE = [
    {"well_id": "W001", "collection_time": "2026-03-25 16:30:00", "x_data": [1, 2, 3, 4, 1, 2, 3, 4], "y_data": [10, 25, 15, 5, 8, 20, 12, 3]},
    {"well_id": "W001", "collection_time": "2026-03-25 17:30:00", "x_data": [1, 2, 3, 4, 1, 2, 3, 4], "y_data": [12, 28, 18, 7, 9, 22, 14, 5]},
    {"well_id": "W001", "collection_time": "2026-03-25 18:30:00", "x_data": [1, 2, 3, 4, 1, 2, 3, 4], "y_data": [11, 26, 16, 6, 8.5, 21, 13, 4]},
    {"well_id": "W002", "collection_time": "2026-03-25 16:30:00", "x_data": [10, 20, 30, 40, 50, 60, 10, 20, 30, 40, 50, 60], "y_data": [100, 200, 150, 80, 40, 10, 90, 180, 130, 70, 35, 8]},
    {"well_id": "W002", "collection_time": "2026-03-25 17:30:00", "x_data": [10, 20, 30, 40, 50, 60, 10, 20, 30, 40, 50, 60], "y_data": [110, 210, 160, 90, 50, 15, 95, 190, 140, 80, 45, 12]},
    {"well_id": "W002", "collection_time": "2026-03-25 18:30:00", "x_data": [10, 20, 30, 40, 50, 60, 10, 20, 30, 40, 50, 60], "y_data": [105, 205, 155, 85, 45, 12, 92, 185, 135, 75, 40, 10]}
]

# 首页路由，渲染前端页面
@app.route('/')
def index():
    return render_template('index.html')

# --- 预留的 API 接口 ---

# 1. 查询接口
@app.route('/api/query', methods=['POST'])
def query_data():
    data = request.get_json()
    well_id = data.get('well_id')
    start_time_str = data.get('start_time')
    end_time_str = data.get('end_time')

    # 将前端时间字符串转换为 datetime 对象（若为空则设为 None）
    start_dt = None
    end_dt = None
    if start_time_str:
        # datetime-local 格式：2026-03-25T16:22
        start_dt = datetime.strptime(start_time_str, '%Y-%m-%dT%H:%M')
    if end_time_str:
        end_dt = datetime.strptime(end_time_str, '%Y-%m-%dT%H:%M')

    result_data = []
    for item in MOCK_DATABASE:
        # 井号过滤
        if well_id and well_id != item["well_id"]:
            continue

        # 时间过滤
        if start_dt or end_dt:
            # 将数据库中的时间字符串转换为 datetime 对象
            db_dt = datetime.strptime(item["collection_time"], '%Y-%m-%d %H:%M:%S')
            if start_dt and db_dt < start_dt:
                continue
            if end_dt and db_dt > end_dt:
                continue

        result_data.append(item)

    return jsonify({
        "status": "success",
        "message": "查询成功",
        "data": result_data
    })

# 2. 叠加接口
@app.route('/api/overlay', methods=['POST'])
def overlay_data():
    data = request.get_json()
    well_id = data.get('well_id')      # 新增：接收井号
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    
    print(f"收到叠加请求 -> 井号：{well_id}，时间：{start_time} 至 {end_time}")
    
    return jsonify({
        "status": "success",
        "message": f"叠加请求已接收 (井号: {well_id})"
    })

if __name__ == '__main__':
    # 开启 debug 模式方便开发
    app.run(debug=True, port=5000)