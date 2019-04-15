//canvas初始化
function init() {
    let width = canvasSize.maxX;
    let height = canvasSize.maxY;
    let myCanvas = document.getElementById("myCanvas");
    myCanvas.setAttribute("width", width);
    myCanvas.setAttribute("height", height);
    myCanvas.getContext("2d").clearRect(0, 0, width, height);
    return myCanvas.getContext("2d");
}

//画出所有多边形
function draw() {
    let cxt = init();
    //将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
    cxt.translate(0.5, 0.5);
    //画一个多边形
    for (let a = 0; a < polygon.length; a++) {
        let points = [];//多边形顶点坐标集
        for (let i = 0; i < polygon[a].length; i++) {
            points.push(vertex_pos[polygon[a][i]]);
        }
        let color = vertex_color[polygon[a][0]];//一个多边形的颜色为第一个点的颜色

        let edges = [];//记录非水平边
        for (let i = 0; i < points.length; i++) {
            let j = (i + 1) % points.length;
            let k, x, y_min, y_max;
            if (points[j][1] > points[i][1]) {
                k = (points[j][0] - points[i][0]) / (points[j][1] - points[i][1]);
                x = points[i][0];
                y_min = points[i][1];
                y_max = points[j][1];
            } else {
                k = (points[i][0] - points[j][0]) / (points[i][1] - points[j][1]);
                x = points[j][0];
                y_min = points[j][1];
                y_max = points[i][1];
            }
            let edge = [y_min, x, k, y_max];//x为比较高的顶点x   k为斜率倒数
            //若k不是无穷则添加，否则直接绘出
            if (isFinite(k)) {
                edges.push(edge);
            } else {//水平线
                drawLine(cxt, points[j][0], points[j][1], points[i][0], points[i][1], color);
            }
        }

        //确定多边形的上界min和下界max
        let min = points[0][1];
        let max = 0;
        for (let i in points) {
            min = min < points[i][1] ? min : points[i][1];
            max = max > points[i][1] ? max : points[i][1];
        }

        //线性扫描，从上界到下界，按照每个像素点移动，不计算临界（上下界）
        for (let i = min + 1; i < max; i++) {
            //y与每条边的交点集合
            let intersections = [];
            for (let j in edges) {
                if (edges[j][0] <= i && edges[j][3] > i) {
                    edges[j][1] += edges[j][2];
                    intersections.push(edges[j][1]);
                }
            }

            //交点排序，按照x的升序
            intersections.sort(function (a, b) {
                return a - b;
            });

            //得到的交点集合，肯定能保证其是偶数的值，每两个交点配对，绘出直线
            for (let j = 0; j < intersections.length - 1; j += 2) {
                drawLine(cxt, intersections[j], i, intersections[j + 1], i, color);
            }

        }
    }
    //绘出所有的顶点
    for (let i = 0; i < vertex_pos.length; i++) {
        drawCircle(cxt, vertex_pos[i][0], vertex_pos[i][1], 10);

    }
}

//事件添加
function addEvents() {
    let movingVertex = undefined;//确定被移动的点
    let myCanvas = document.getElementById("myCanvas");

    //鼠标左键按下事件，光标与点的距离小于10px
    myCanvas.addEventListener("mousedown", function (e) {
        let pos = [event.offsetX, event.offsetY];//鼠标所在点
        for (let i = 0; i < vertex_pos.length; i++) {
            let length = Math.sqrt(Math.pow((pos[0] - vertex_pos[i][0]), 2) + Math.pow((pos[1] - vertex_pos[i][1]), 2));
            if (length <= 10) {
                movingVertex = i;
                return;
            }
        }
    });

    //鼠标左键松开事件
    myCanvas.addEventListener("mouseup", function () {
        movingVertex = undefined;
    });

    //鼠标移动事件
    myCanvas.addEventListener("mousemove", function () {
        if (movingVertex === undefined)
            return;
        vertex_pos[movingVertex] = [event.offsetX, event.offsetY, 0];
        draw();
    });

    //鼠标离开画布事件
    myCanvas.addEventListener("mouseleave", function () {
        movingVertex = undefined;
    });
}

draw();
addEvents();