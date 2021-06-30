class ColorPoint {
    constructor(x, y) {
        const MAX_MOVE = 0.5;
        this.velocity = new THREE.Vector2(
            (Math.random() * 2 - 1) * MAX_MOVE,
            (Math.random() * 2 - 1) * MAX_MOVE
        );
        this.posV2 = new THREE.Vector2(x, y);
        this.colorV3 = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    }

    update() {
        const { innerWidth: width, innerHeight: height } = window;
        const newPosTest = this.posV2.clone().add(this.velocity);
        if (newPosTest.x < 0 || newPosTest.x >= width) {
            this.velocity.x *= -1;
        }

        if (newPosTest.y < 0 || newPosTest.y >= height) {
            this.velocity.y *= -1;
        }
        this.posV2.add(this.velocity);
    }

    static CreateRandom() {
        const { innerWidth: width, innerHeight: height } = window;
        return new ColorPoint(Math.random() * width, Math.random() * height);
    }
}

function populateUniforms(points) {
    const uniforms = {
        points_count: { type: 'i', value: points.length },
        points: { type: 'v2v', value: points.map(pt => pt.posV2) },
        points_color: { type: 'v3v', value: points.map(pt => pt.colorV3) }
    };
    return uniforms;
}

function resize() {
    const canvas = renderer.domElement;
    const dpr = window.devicePixelRatio;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    console.log('resize event', width, height);
    renderer.setSize(width, height, false);
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    colorPoints.forEach(cp => cp.update());
}

function run() {
    window.addEventListener('resize', resize);
    document.body.appendChild(renderer.domElement);
    resize();
    render();
}

const GEOMETRY_POINTS_CNT = 256;

const fragmentShaderColorByDistance = `
precision mediump float;

#define FLT_MAX 3.402823466e+38
#define MAX_POINTS ${GEOMETRY_POINTS_CNT}

uniform int points_count;
uniform vec2 points[MAX_POINTS];
uniform vec3 points_color[MAX_POINTS];

void main() {
  float nearest_d = FLT_MAX;
  vec2 px = gl_FragCoord.xy;
  vec3 best_color = vec3(0.,0.,0.);
  for(int i=0;i<MAX_POINTS;i++){
      vec2 pt = points[i];
      float dx = px.x-pt.x;
      float dy = px.y-pt.y; 
      float dist = dx*dx+dy*dy;
      if(dist < nearest_d) {
          nearest_d = dist;
          best_color = points_color[i];
      }
  }

  gl_FragColor = vec4(best_color, 1.0);
}`;

const $ = document.querySelector.bind(document);
const camera = new THREE.Camera();
const scene = new THREE.Scene();
const geometry = new THREE.PlaneBufferGeometry(2, 2);
const colorPoints = new Array(GEOMETRY_POINTS_CNT).fill().map(() => ColorPoint.CreateRandom());
const uniforms = populateUniforms(colorPoints);

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShaderColorByDistance,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const renderer = new THREE.WebGLRenderer();
