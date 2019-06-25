//模型加载类
class ObjectLoader {
    //构造方法
    constructor(o, config) {
        this.gl = config.gl;
        this.o = o;
    }

    init() {
        this.initShaders();
        this.modelMatrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        for (let t of this.o.transform) {
            this.modelMatrix[t.type].apply(this.modelMatrix, t.content);
        }

        this.objDoc = null;
        this.drawingInfo = null;

        this.buffers = {
            vertexBuffer: this.gl.createBuffer(),
            normalBuffer: this.gl.createBuffer(),
            colorBuffer: this.gl.createBuffer(),
            indexBuffer: this.gl.createBuffer()
        };

        if (!this.buffers) {
            console.log('Failed to create the buffers');
            return;
        }

        // 读取文件
        this.readOBJFile(this.o.objFilePath, 1, true);
        return this;
    }

    initShaders() {
        //Vertex shader program
        let VSHADER_SOURCE =
            `attribute vec4 a_Position;
             attribute vec4 a_Color;
             attribute vec4 a_Normal;
             uniform mat4 u_MvpMatrix;
             uniform mat4 u_NormalMatrix;
             uniform mat4 u_ModelMatrix;
             uniform vec3 u_Color;
             uniform vec3 u_LightDirection;
             uniform vec3 u_AmbientLight;
             uniform vec3 u_PointLightColor;
             uniform vec3 u_PointLightPosition;
             varying vec4 v_Color;
             
             uniform vec4 u_Eye;
             varying float v_Dist;
             void main(){
                gl_Position = u_MvpMatrix * a_Position;
                vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
                
                vec4 vertexPosition = u_ModelMatrix * a_Position;
                vec3 pointLightDirection = normalize(u_PointLightPosition - vec3(vertexPosition));
                
                float pointnDotL = max(dot(normal,pointLightDirection), 0.0);
                vec3 pointLightDiffuse = a_Color.rgb * pointnDotL * u_PointLightColor;
                
                float nDotL = max(dot(normal, u_LightDirection),0.0);
                
                vec3 diffuse = u_Color * nDotL;
                vec3 ambient = u_AmbientLight * u_Color;
                
               v_Color = vec4(diffuse + ambient + pointLightDiffuse, a_Color.a);
                // v_Color = vec4(diffuse , a_Color.a);
                v_Dist = distance(vertexPosition, u_Eye);
             }`;

        // Fragment shader program
        let FSHADER_SOURCE =
            `#ifdef GL_ES
             precision mediump float;
             #endif
             uniform vec2 u_FogDist;
             varying vec4 v_Color;
           
             varying float v_Dist;
             void main() {
                vec3 fogColor = vec3(0.137, 0.231, 0.423);
                float fogFactor = clamp((u_FogDist.y - v_Dist)/(u_FogDist.y - u_FogDist.x),0.0,1.0);
                vec3 color = mix(fogColor, vec3(v_Color), fogFactor);
                gl_FragColor = vec4(color, v_Color.a);
                //gl_FragColor = v_Color;
             }`;

        // 创建 program
        this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
        if (!this.program) {
            console.log('Failed to create program');
            return;
        }


        // Get the storage locations of attribute variables
        this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
        this.a_Color = this.gl.getAttribLocation(this.program, 'a_Color');
        this.a_Normal = this.gl.getAttribLocation(this.program, 'a_Normal');

        // Get the storage locations of uniform variables
        this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
        this.u_ModelMatrix = this.gl.getUniformLocation(this.program, 'u_ModelMatrix');
        this.u_NormalMatrix = this.gl.getUniformLocation(this.program, 'u_NormalMatrix');
        this.u_LightDirection = this.gl.getUniformLocation(this.program, 'u_LightDirection');
        this.u_AmbientLight = this.gl.getUniformLocation(this.program, 'u_AmbientLight');
        this.u_PointLightColor = this.gl.getUniformLocation(this.program, 'u_PointLightColor');
        this.u_PointLightPosition = this.gl.getUniformLocation(this.program, 'u_PointLightPosition');
        this.u_Eye = this.gl.getUniformLocation(this.program,'u_Eye');
        this.u_FogDist = this.gl.getUniformLocation(this.program,'u_FogDist');
        this.u_Color = this.gl.getUniformLocation(this.program, 'u_Color');

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.program = this.program;
    }

    // 读取文件
    readOBJFile(fileName, scale, reverse) {
        let request = new XMLHttpRequest();

        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status !== 404) {
                this.onReadOBJFile(request.responseText, fileName,scale, reverse);
            }
        };
        request.open('GET', fileName, true);
        request.send();
    }

    onReadOBJFile(fileString, fileName, scale, reverse) {
        let objDoc = new OBJDoc(fileName);
        let result = objDoc.parse(fileString, scale, reverse);
        if (!result) {
            this.objDoc = null;
            this.drawingInfo = null;
            console.log('OBJ file parsing error');
            return;
        }
        this.objDoc = objDoc;
    }

    onReadComplete() {
        // Acquire the vertex coordinates and colors from OBJ file
        this.drawingInfo = this.objDoc.getDrawingInfo();

        // Write date into the buffer object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.drawingInfo.vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.a_Position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.drawingInfo.normals, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.a_Normal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.a_Normal);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.drawingInfo.colors, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.a_Color, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.a_Color);

        // Write the indices to the buffer object
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.drawingInfo.indices, this.gl.STATIC_DRAW);
    }

    // render the object
    render(now) {

        //switch the shader
        this.gl.useProgram(this.program);

        if (this.objDoc != null && this.objDoc.isMTLComplete()) {
            this.onReadComplete();
        }

        if (!this.drawingInfo) {
            return;
        }

        // the next location of the bird
        if (this.hasOwnProperty('nextTick')) {
            this.nextTick(now);
            this.modelMatrix = new Matrix4();
            this.normalMatrix = new Matrix4();
            for (let t of this.o.transform) {
                this.modelMatrix[t.type].apply(this.modelMatrix, t.content);
            }
        }

        //平行光方向
        let lightDirection = new Vector3(sceneDirectionLight);
        lightDirection.normalize();

        this.gl.uniform3fv(this.u_LightDirection, new Vector3(sceneDirectionLight).normalize().elements);

        //环境光
        this.gl.uniform3fv(this.u_AmbientLight, new Vector3(sceneAmbientLight).elements);

        //雾化
        this.gl.uniform4fv(this.u_Eye, new Float32Array([Camera.eye.elements[0],Camera.eye.elements[1],Camera.eye.elements[2],1.0]));
        this.gl.uniform2fv(this.u_FogDist, new Float32Array([100,300]));

        //是否开启了跟随相机的点光源
        if (Camera.state.pointLight) {
            this.gl.uniform3fv(this.u_PointLightColor, new Vector3(scenePointLightColor).elements);
            this.gl.uniform3fv(this.u_PointLightPosition, Camera.eye.elements);
        } else {
            this.gl.uniform3fv(this.u_PointLightColor, new Vector3([0, 0, 0]).elements);
            this.gl.uniform3fv(this.u_PointLightPosition, new Vector3([0, 0, 0]).elements);
        }

        this.gl.uniform3fv(this.u_Color, new Vector3(this.o.color).elements);

        // mvp属性
        this.transform = this.o.transform;
        this.normalMatrix.setInverseOf(this.modelMatrix);
        this.normalMatrix.transpose();
        this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
        this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.modelMatrix.elements);

        this.mvpMatrix = Camera.getMvpMatrix();
        this.mvpMatrix.multiply(this.modelMatrix);
        this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.mvpMatrix.elements);

        // 画出模型
        this.gl.drawElements(this.gl.TRIANGLES, this.drawingInfo.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}
