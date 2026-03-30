from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

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
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    
    # TODO: 在这里接入你的真实数据库查询逻辑
    print(f"收到查询请求 -> 井号：{well_id}，时间：{start_time} 至 {end_time}")
    
    # 返回模拟数据
    return jsonify({
        "status": "success",
        "message": f"查询请求已接收 (井号: {well_id})",
        "data": {"well_id": well_id, "start": start_time, "end": end_time}
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