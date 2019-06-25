// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

//是否画三角形网格
let isPaintLine = true;
//是否要旋转缩放
let isRotate = false;
// Current rotation angle
let currentAngle = 0.0;
// Rotation angle (degrees/second)
let ANGLE_STEP = 45.0;
//缩放比例
let scaleArray = 1;
//是否可以编辑
let isExit = true;

function main() {
    //将多边形的第一个顶点和第二个顶点交换
    for (let i = 0; i < 4; i++) {
        let a = polygon[i][0];
        polygon[i][0] = polygon[i][1];
        polygon[i][1] = a;
    }

    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');
    canvas.setAttribute("width", canvasSize.maxX);
    canvas.setAttribute("height", canvasSize.maxY);

    // Get the rendering context for WebGL
    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Write the positions of vertices to a vertex shader
    let n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Get storage location of u_ModelMatrix
    let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Model matrix
    let modelMatrix = new Matrix4();

    //键盘输入处理
    document.onkeydown = function (ev) {
        keydown(ev, gl, n, modelMatrix, u_ModelMatrix, canvas);
    };

    // Start drawing
    // let tick = function () {
    //     // currentAngle = animate(currentAngle);  // Update the rotation angle并更新缩放比例
    //     paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);   // Draw the triangle
    //     requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
    // };
    // tick();

    // Draw the triangle
    paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);
    //添加鼠标事件
    addEvents(gl, n, modelMatrix, u_ModelMatrix);
}

let id = null;

//键盘输入处理
function keydown(ev, gl, n, modelMatrix, u_ModelMatrix, canvas) {
    // console.log(ev.keyCode);
    if (ev.keyCode == 69) { // 输入E：变为可编辑，没有经过旋转缩放的状态
        isExit = true;
        isRotate = false;
        window.cancelAnimationFrame(id);
        currentAngle = 0.0;
        scaleArray = 1;
        paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);   // Draw the triangle
    } else if (ev.keyCode == 84) { // 输入T：变为不可编辑，再根据isRotate判断是否旋转缩放
        isExit = false;
        if (isRotate) {//旋转中
            isRotate = false;
            window.cancelAnimationFrame(id);
            paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);   // Draw the triangle
        } else {//静止中
            isRotate = true;
            g_last = Date.now();
            let tick = function () {
                currentAngle = animate(currentAngle);  // Update the rotation angle并更新缩放比例
                paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);   // Draw the triangle
                id = requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
            };
            tick();
        }
    } else if (ev.keyCode == 66) {// 输入B：根据isPaintLine判断是否画线
        isPaintLine = !isPaintLine;
        paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);   // Draw the triangle
    } else {
        return;
    }
}

//绘制四边形和三角形网格
function paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray) {
    //根据currentAngle和scaleArray变换矩阵
    modelMatrix.setRotate(currentAngle, 0, 0, 1);//旋转
    // modelMatrix.translate(0.35, 0, 0);//平移
    modelMatrix.scale(scaleArray, scaleArray, scaleArray);//缩放

    // Pass the rotation matrix to the vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);

    //根据isPaintLine决定是否画三角形网格
    if (isPaintLine) {
        gl.drawArrays(gl.LINE_LOOP, 16, 3);
        gl.drawArrays(gl.LINE_LOOP, 17, 3);
        gl.drawArrays(gl.LINE_LOOP, 20, 3);
        gl.drawArrays(gl.LINE_LOOP, 21, 3);
        gl.drawArrays(gl.LINE_LOOP, 24, 3);
        gl.drawArrays(gl.LINE_LOOP, 25, 3);
        gl.drawArrays(gl.LINE_LOOP, 28, 3);
        gl.drawArrays(gl.LINE_LOOP, 29, 3);
    }

}


function initVertexBuffers(gl) {
    let vertices = new Float32Array(initVertexArray());
    let n = 4; // The number of vertices

    // Create a buffer object
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let FSIZE = vertices.BYTES_PER_ELEMENT;

    // Get the storage location of a_Position, assign buffer and enable
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    //颜色
    let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return n;
}

//获得顶点位置和颜色的一维数组,并转换成webgl坐标,后面再加上画线的点的webgl坐标
function initVertexArray() {
    //[x,y,r,g,b]
    let verticesArray = [];
    let index = 0;//记录添加到数组的顶点index
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let polyIndex = polygon[i][j];
            verticesArray[index * 5] = (vertex_pos[polyIndex][0] - canvasSize.maxX / 2) / (canvasSize.maxX / 2);
            verticesArray[index * 5 + 1] = (canvasSize.maxY / 2 - vertex_pos[polyIndex][1]) / (canvasSize.maxY / 2);

            verticesArray[index * 5 + 2] = vertex_color[polyIndex][0] / 255;
            verticesArray[index * 5 + 3] = vertex_color[polyIndex][1] / 255;
            verticesArray[index * 5 + 4] = vertex_color[polyIndex][2] / 255;
            index++;
        }
    }
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let polyIndex = polygon[i][j];
            verticesArray[index * 5] = (vertex_pos[polyIndex][0] - canvasSize.maxX / 2) / (canvasSize.maxX / 2);
            verticesArray[index * 5 + 1] = (canvasSize.maxY / 2 - vertex_pos[polyIndex][1]) / (canvasSize.maxY / 2);

            verticesArray[index * 5 + 2] = 1;
            verticesArray[index * 5 + 3] = 0;
            verticesArray[index * 5 + 4] = 0;
            index++;
        }
    }
    // console.log(verticesArray);
    return verticesArray;

}

//事件添加
function addEvents(gl, n, modelMatrix, u_ModelMatrix) {
    let myCanvas = document.getElementById("webgl");
    let movingVertex = undefined;//确定被移动的点
    //鼠标左键按下事件，光标与点的距离小于10px
    myCanvas.addEventListener("mousedown", function (event) {
        let pos = [event.offsetX, event.offsetY];//鼠标所在点
        // console.log(event.offsetX);
        // console.log(event.offsetY);
        for (let i = 0; i < vertex_pos.length; i++) {
            let length = Math.sqrt(Math.pow((pos[0] - vertex_pos[i][0]), 2) + Math.pow((pos[1] - vertex_pos[i][1]), 2));
            if (length <= 10) {
                movingVertex = i;
                console.log(movingVertex);
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
        if (movingVertex === undefined || !isExit)//判断是否可以编辑
            return;

        let n = 4;
        vertex_pos[movingVertex] = [event.offsetX, event.offsetY, 0];
        initVertexBuffers(gl);
        paint(gl, n, currentAngle, modelMatrix, u_ModelMatrix, scaleArray);
    });

    //鼠标离开画布事件
    myCanvas.addEventListener("mouseleave", function () {
        movingVertex = undefined;
    });
}

// Last time that this function was called
let g_last = Date.now();
//是否缩小
let isDown = true;
function animate(angle) {
    // Calculate the elapsed time
    let now = Date.now();
    let elapsed = now - g_last;
    g_last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    let newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    //根据isDown决定是缩小还是放大
    if (isDown) {
        scaleArray = scaleArray - 0.2 * (elapsed / 1000);
    } else {
        scaleArray = scaleArray + 0.2 * (elapsed / 1000);
    }
    if (scaleArray <= 0.2) {//停止缩小，并从0.2比例开始放大
        scaleArray = 0.2
        isDown = false;
    } else if (scaleArray > 1) {//停止放大，并从1比例开始缩小
        scaleArray = 1;
        isDown = true;
    }
    return newAngle %= 360;
}
