// loaders, such as texture loader, object loader and scene loader
let loaders = [];

// 记录时间点
let last = 0;

//主程序入口
function main() {
    let canvas = document.getElementById('webgl');

    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the context of gl');
        return;
    }
    init(gl);
}

function init(gl) {
    //加载模型
    //地板
    let floorLoader = new TextureLoader(floorRes, {
        'gl': gl,
        'textureIndex': 0
    }).init();
    loaders.push(floorLoader);
    //箱子
    let boxLoader = new TextureLoader(boxRes, {
        'gl': gl,
        'textureIndex': 1
    }).init();
    loaders.push(boxLoader);
    //其它模型
    for (let object of ObjectList) {
        let loader = new ObjectLoader(object, {
            'gl': gl
        }).init();

     //当模型是鸟时让鸟旋转
    if (object.objFilePath.indexOf('bird') > 0) {
        loader.nextTick = (now) => {
            let rotate = (now / 1000 * 120) % 360;
            let trans = (now / 500);
            loader.o.transform[1].content[0] = rotate;
            loader.o.transform[0].content[0] = Math.sin(trans) * 5;
            loader.o.transform[0].content[1] = Math.cos(trans) * 3 + 10;
            loader.o.transform[0].content[2] = Math.sin(trans) * 4 + 10;
        }
    }
        loaders.push(loader);
    }

    //初始化相机
    Camera.init();

    //添加键盘事件
    addEvent();

    // 渲染场景
    let tick = (now) => {

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        let time = now - last;
        last = now;

        let posX = (Camera.state.moveUp - Camera.state.moveDown) * MOVE_VELOCITY * time / 1000;
        let posY = (Camera.state.moveRight - Camera.state.moveLeft) * MOVE_VELOCITY * time / 1000;
        let rotX = (Camera.state.rotateUp - Camera.state.rotateDown) * ROT_VELOCITY * time / 1000 / 180 * Math.PI;
        let rotY = (Camera.state.rotateRight - Camera.state.rotateLeft) * ROT_VELOCITY * time / 1000 / 180 * Math.PI;
        if (posX || posY)
            Camera.move(posX, posY);
        if (rotX || rotY)
            Camera.rotate(rotX, rotY);

        for (let loader of loaders) {
            loader.render(now);
        }

        window.requestAnimationFrame(tick);
    };
    tick();
}

// 添加键盘的事件，根据需求文档
function addEvent() {
    let keys = new Map();
    keys.set('W', 'moveUp');
    keys.set('S', 'moveDown');
    keys.set('A', 'moveLeft');
    keys.set('D', 'moveRight');
    keys.set('I', 'rotateUp');
    keys.set('K', 'rotateDown');
    keys.set('J', 'rotateLeft');
    keys.set('L', 'rotateRight');
    keys.set('F', 'pointLight');

    //通过键盘点击改变各种状态
    keys.forEach(() => {
        window.addEventListener('keydown', (e) => {
            let key = String.fromCharCode(e.which);
            if (!keys.get(key))
                return;
            if (key === 'F') {
                Camera.state[keys.get(key)] = !Camera.state[keys.get(key)];
            } else
                Camera.state[keys.get(key)] = 1;
        });

        window.addEventListener('keyup', (e) => {
            let key = String.fromCharCode(e.which);
            if (!keys.get(key))
                return;
            if (key === 'F')
                return;
            Camera.state[keys.get(key)] = 0;
        });
    });


}


main();
