class TextureLoader {
    constructor(o, config) {
        this.o = o;
        this.gl = config.gl;
        this.config = config;
    }

    init() {
        this.initShaders();
        this.initTextures();
       // this.initPerspective();
        return this;
    }

    initShaders() {
        // Vertex shader program
        let VSHADER_SOURCE =
            `attribute vec4 a_Position;
             attribute vec2 a_TexCoord;
             attribute vec4 a_Normal;
             uniform mat4 u_ModelMatrix;
             uniform mat4 u_MvpMatrix;
             uniform mat4 u_NormalMatrix;
             uniform vec3 u_PointLightColor;
             uniform vec3 u_PointLightPosition;
             uniform vec3 u_LightDirection;
             uniform vec4 u_Eye;
             varying vec2 v_TexCoord;
             varying vec4 v_Color;
             varying float v_Dist;
             void main(){
                 gl_Position = u_MvpMatrix * a_Position;
                 vec3 normal = normalize(vec3(u_NormalMatrix)); 
                 
                 vec4 vertexPosition = u_ModelMatrix * a_Position;
                 vec3 pointLightDirection = normalize(u_PointLightPosition - vec3(vertexPosition));
                 
                 float pointnDotL = max(dot(normal,pointLightDirection), 0.0);
                 vec3 pointDiffuse = u_PointLightColor * pointnDotL;
                 
                 v_Color = vec4(pointDiffuse, 1.0);
                 
                 v_TexCoord = a_TexCoord;
                 v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);
             }`;

        // Fragment shader program
        let FSHADER_SOURCE=
            `#ifdef GL_ES
             precision mediump float;
             #endif
             uniform sampler2D u_Sampler;
             varying vec2 v_TexCoord;  
             varying vec4 v_Color;
             varying float v_Dist;
             uniform vec2 u_FogDist;
             void main() {
                 vec3 fogColor = vec3(0.2,0.2,0.2);
                 float fogFactor = clamp((u_FogDist.y - v_Dist)/(u_FogDist.y - u_FogDist.x),0.0,1.0);
                 vec3 color = mix(fogColor, vec3(v_Color), fogFactor);
                 gl_FragColor = texture2D(u_Sampler, v_TexCoord)+v_Color;
             }`;

        this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);

        if (!this.program){
            console.log('Failed to create texture program');
            return;
        }
        this.gl.enable(this.gl.DEPTH_TEST);

        // Get the storage locations of attribute variables
        this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
        this.a_TexCoord = this.gl.getAttribLocation(this.program,'a_TexCoord');
        //this.a_Normal = this.gl.getAttribLocation(this.program,'a_Normal');

        // Get the storage locations of uniform variables
        this.u_MvpMatrix = this.gl.getUniformLocation(this.program,'u_MvpMatrix');
        this.u_NormalMatrix = this.gl.getUniformLocation(this.program,'u_NormalMatrix');
        this.u_ModelMatrix = this.gl.getUniformLocation(this.program,'u_ModelMatrix');
        this.u_Eye = this.gl.getUniformLocation(this.program,'u_Eye');
        this.u_FogDist = this.gl.getUniformLocation(this.program,'u_FogDist');

        this.gl.program = this.program;
    }

    // 初始化纹理
    initTextures(){
        this.texture = this.gl.createTexture();
        if (!this.texture){
            console.log('Failed to create the texture object');
            return false;
        }

        // Get storage location of u_Sampler
        this.u_Sampler = this.gl.getUniformLocation(this.program,'u_Sampler');
        if (!this.u_Sampler){
            console.log('Failed to get the storage of u_Sampler');
            return;
        }

        // Create image object
        this.image = new Image();
        if (!this.image){
            console.log('Failed to create the image object');
            return false;
        }

        // Register the event handler to be called on loading an image
        this.image.onload = () => {
            this.loadTexture();
        };

        // Tell the browser to load an image
        this.image.src = this.o.texImagePath;
    }

    // 加载纹理
    loadTexture(){
        // switch the shader
        this.gl.useProgram(this.program);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
        // Enable texture unit
        this.gl.activeTexture(this.gl[`TEXTURE${this.config.textureIndex}`]);
        // Bind the texture object to the target
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        // Set the texture parameter
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        // Set the image to texture
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);

        // Set the texture unit 0 to the sampler
        this.gl.uniform1i(this.u_Sampler, this.config.textureIndex);
    }

    // 渲染纹理
    render(now){
        this.gl.useProgram(this.program);

        //create buffers
        this.vertexBuffer = this.gl.createBuffer();
        this.vertexTexCoordBuffer = this.gl.createBuffer();
        this.vertexIndexBuffer = this.gl.createBuffer();


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.o.vertex), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.a_Position);


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.o.texCoord), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.a_TexCoord,2,this.gl.FLOAT, false,0,0);
        this.gl.enableVertexAttribArray(this.a_TexCoord);

        //雾化
        this.gl.uniform4fv(this.u_Eye, new Float32Array([Camera.eye.elements[0],Camera.eye.elements[1],Camera.eye.elements[2],1.0]));
        this.gl.uniform2fv(this.u_FogDist, new Float32Array([100,300]));

        // 纹理单元
        let t = 'TEXTURE'+this.config.textureIndex;
        this.gl.activeTexture(this.gl[t]);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.o.index), this.gl.STATIC_DRAW);

        //是否开启跟随相机的点光源
        this.u_PointLightColor = this.gl.getUniformLocation(this.program, 'u_PointLightColor');
        this.u_PointLightPosition = this.gl.getUniformLocation(this.program, 'u_PointLightPosition');

        if (Camera.state.pointLight){
            this.gl.uniform3fv(this.u_PointLightColor, new Vector3(scenePointLightColor).elements);
            this.gl.uniform3fv(this.u_PointLightPosition, Camera.eye.elements);
        } else {
            this.gl.uniform3fv(this.u_PointLightColor, new Vector3([0,0,0]).elements);
            this.gl.uniform3fv(this.u_PointLightPosition, new Vector3([0,0,0]).elements);
        }

        // 一些视点
        this.normalMatrix = new Matrix4();
        this.modelMatrix = new Matrix4();
        this.modelMatrix.translate(this.o.translate[0], this.o.translate[1], this.o.translate[2]);
        this.modelMatrix.scale(this.o.scale[0], this.o.scale[1], this.o.scale[2]);
        this.normalMatrix.setInverseOf(this.modelMatrix);
        this.normalMatrix.transpose();
        this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
        this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.modelMatrix.elements);

        this.mvpMatrix = Camera.getMvpMatrix();
        this.mvpMatrix.multiply(this.modelMatrix);
        this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.mvpMatrix.elements);

        // 画出模型
        this.gl.drawElements(this.gl.TRIANGLE_STRIP, this.o.index.length, this.gl.UNSIGNED_SHORT, 0);
    }
}
