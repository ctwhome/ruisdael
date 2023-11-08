import * as THREE from 'three';
import CameraControls from 'camera-controls';

import { getBoxSize } from '$lib/utils/Utils';
import { addPlainMap } from './addPlainMap';

export const scene: THREE.Scene | null = new THREE.Scene();
export let camera: THREE.PerspectiveCamera | null = null;
export let renderer: THREE.WebGLRenderer | null = null;
export let box: THREE.Mesh | null = null;
// export const controls: OrbitControls | null = null;

export let cameraControls: CameraControls | null = null;

export let boxSize: THREE.Vector3 | null = null;

const clock = new THREE.Clock();

CameraControls.install({ THREE: THREE });

export function initScene(
	canvas,
	volumeSize,
	voxelSize,
	cameraPosition,
	cameraUp,
	cameraFovDegrees,
	cameraNear,
	cameraFar
) {
	const size = new THREE.Vector2();

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: canvas
	});
	renderer.getSize(size);

	camera = new THREE.PerspectiveCamera(cameraFovDegrees, size.x / size.y, cameraNear, cameraFar);
	// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 400, 0.1, 1000);
	camera.position.set(0, -2, 1.7);
	cameraControls = new CameraControls(camera, canvas);

	// controls = new OrbitControls(camera, renderer.domElement);
	// controls.zoomSpeed = 0.5;
	// controls.update();

	resize();
	animate();

	window.addEventListener('resize', resize);

	camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
	camera.up.set(cameraUp[0], cameraUp[1], cameraUp[2]);
	//
	// Add a grid to the scene to help visualize camera movement.
	//
	const gridHelper = new THREE.GridHelper(50, 50);
	gridHelper.position.y = -1;
	scene.add(gridHelper);

	const [boxWidth, boxHeight, boxDepth] = getBoxSize(volumeSize, voxelSize);
	boxSize = new THREE.Vector3(boxWidth, boxHeight, boxDepth);
	const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	box = new THREE.Mesh(boxGeometry, material);
	scene.add(box);

	console.log(`Voxel size ${voxelSize[0]}, ${voxelSize[1]}, ${voxelSize[2]}`);
	console.log(`Box size ${boxWidth}, ${boxHeight}, ${boxDepth}`);

	// Lights, to be used both during rendering the volume, and rendering the optional surface.

	// const sunLightDir = new THREE.Vector3(0.0, 0.5, 0.5);
	// const sunLightColor = new THREE.Color(0.99, 0.83, 0.62);
	// const sunLight = new THREE.DirectionalLight(sunLightColor.getHex(), 1.0);
	// sunLight.position.copy(sunLightDir);
	// scene.add(sunLight);
	// const seaLightColor = new THREE.Color(0.0, 0.0005, 0.0033);
	// const toaLightColor = new THREE.Color(0.0, 0.0002, 0.033);
	// const hemisphereLight = new THREE.HemisphereLight(seaLightColor.getHex(), toaLightColor.getHex(), 1.0);
	// scene.add(hemisphereLight);

	//
	// Add an axes helper to the scene to help with debugging.
	//
	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	//
	// Add textured map to the scene
	//
	addPlainMap(boxWidth, boxHeight, boxDepth);
}

// export function setCameraView(position: number[], up: number[]) {
// 	animate();
// 	camera.position.set(...position);
// 	camera.up.set(...up);
// 	camera.lookAt(0, 0, 0);
// 	//  renderScene();

// 	// const duration = 1000; // Duration of the animation in milliseconds

// 	// // new Tween(camera.position)
// 	// // 	.to({ x: position[0], y: position[1], z: position[2] }, duration)
// 	// // 	.start();

// 	// new Tween(camera.position)
// 	// 	.to({ x: position[0], y: position[1], z: position[2] }, duration)
// 	// 	.onUpdate(() => camera.lookAt(lookAt[0], lookAt[1], lookAt[2]))
// 	// 	.start();

// 	// animate();
// }

function animate() {
	const delta = clock.getDelta();
	// const elapsed = clock.getElapsedTime();
	const updated = cameraControls.update(delta);

	// if ( elapsed > 30 ) { return; }

	requestAnimationFrame(animate);
	if (updated) {
		renderer.render(scene, camera);
	}
	// required if controls.enableDamping or controls.autoRotate are set to true
	// controls.update();
	// TWEEN.update(time);
	renderer.render(scene, camera);
}

const resize = () => {
	renderer.setSize(window.innerWidth, 400);
	camera.aspect = window.innerWidth / 400;
	camera.updateProjectionMatrix();
};
