import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";
import { DeviceOrientationControls } from "https://unpkg.com/three@0.161.0/examples/jsm/controls/DeviceOrientationControls.js";

let scene, camera, renderer, controls;
let model;
let video, videoStream;

// === カメラ初期化 ===
const initVideo = async () => {
  video = document.getElementById("camera");
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = videoStream;
    video.play();
  } catch (err) {
    alert("カメラの使用が許可されていません。");
    console.error(err);
  }
};

// === iOS向けモーション許可 ===
const checkDeviceOrien = async () => {
  const ua = navigator.userAgent.toLowerCase();
  const isiOS =
    ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod");

  if (!isiOS) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const modal = document.getElementById("device-orien-modal");
    const btn = document.getElementById("device-orien-modal-button");

    modal.classList.remove("is-hidden");

    btn.onclick = async () => {
      try {
        const motion = await DeviceMotionEvent.requestPermission();
        const orient = await DeviceOrientationEvent.requestPermission();
        if (motion === "granted" || orient === "granted") {
          modal.classList.add("is-hidden");
          resolve();
        } else {
          alert("センサーのアクセスが拒否されました。");
          reject();
        }
      } catch (err) {
        alert("センサー許可が必要です。");
        reject(err);
      }
    };
  });
};

// === Three.js初期化 ===
const initThree = () => {
  const canvas = document.getElementById("canvas");
  const w = window.innerWidth;
  const h = window.innerHeight;

  scene = new THREE.Scene();

  // 環境光・太陽光
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(1, 3, 2);
  scene.add(dirLight);

  // カメラ設定
  camera = new THREE.PerspectiveCamera(60, w / h, 0.01, 1000);
  camera.position.set(0, 0, 3);
  scene.add(camera);

  // レンダラー
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);

  // デバイス方向操作
  controls = new DeviceOrientationControls(camera);

  // 地層モデル読み込み
  const loader = new GLTFLoader();
  loader.load(
    "./assets/tinker2.glb",
    (gltf) => {
      model = gltf.scene;
      model.scale.set(50,50, 50); // 実寸大に近づけたい場合は調整
      model.position.set(0, -1, 0);
      scene.add(model);
    },
    (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% 読み込み完了`),
    (err) => console.error("モデル読み込みエラー:", err)
  );

  animate();
};

// === 描画ループ ===
const animate = () => {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (model) model.rotation.y += 0.002;
  renderer.render(scene, camera);
};

// === 実行 ===
window.addEventListener("load", async () => {
  await checkDeviceOrien();
  await initVideo();
  initThree();
});
