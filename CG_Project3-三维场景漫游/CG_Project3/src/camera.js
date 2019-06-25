class Camera {
    static init() {
        Camera.fov = CameraPara.fov;
        Camera.near = CameraPara.near;
        Camera.far = CameraPara.far;
        Camera.at = new Vector3(CameraPara.at);
        Camera.eye = new Vector3(CameraPara.eye);
        Camera.up = new Vector3(CameraPara.up);

        Camera.state = {
            moveUp: 0, moveDown: 0, moveLeft: 0, moveRight: 0,
            rotateUp: 0, rotateDown: 0, rotateLeft: 0, rotateRight: 0,
            pointLight: false
        };
    }

    // 得到mvpMatrix
    static getMvpMatrix() {
        return new Matrix4()
            .perspective(Camera.fov, 1, Camera.near, Camera.far)
            .lookAt(Camera.eye.elements[0], Camera.eye.elements[1], Camera.eye.elements[2],
                Camera.at.elements[0], Camera.at.elements[1], Camera.at.elements[2],
                Camera.up.elements[0], Camera.up.elements[1], Camera.up.elements[2]);
    }

    // 相机的平移
    static move(x, y) {
        // vector of direction
        let v = VectorMinus(Camera.eye, Camera.at).normalize();
        let w = VectorCross(v, Camera.up);
        v = VectorMultNum(v, x);
        w = VectorMultNum(w, y);
        v = VectorAdd(v, w);
        Camera.at = VectorMinus(Camera.at, v);
        Camera.eye = VectorMinus(Camera.eye, v);
    }

    //相机的旋转
    static rotate(x, y) {
        let v = VectorMinus(Camera.at, Camera.eye).normalize();
        let w = VectorCross(v, Camera.up);
        Camera.at = VectorAdd(VectorMinus(Camera.at, VectorMultNum(Camera.up, -x)), VectorMultNum(w, y));
        v = VectorMinus(Camera.at, Camera.eye);
        Camera.at = VectorAdd(Camera.eye, v.normalize());
        Camera.up = VectorCross(w, v).normalize();
    }
}
