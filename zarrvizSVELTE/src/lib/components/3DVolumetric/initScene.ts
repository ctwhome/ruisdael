// import { writable } from 'svelte/store';
import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { getBoxSize } from '$lib/utils/Utils';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import OrbitUnlimitedControls from '@janelia/three-orbit-unlimited-controls';

// import fragmentShaderVolume from '$lib/shaders/simple.frag';
import fragmentShaderVolume from '$lib/shaders/volume.frag';
import vertexShaderVolume from '$lib/shaders/volume.vert';
import examplePoints from '../VolumetricRenderer/examplePoints';

// import { addPlainMap } from './addPlainMap';

export const scene: THREE.Scene | null = new THREE.Scene();
export let camera: THREE.PerspectiveCamera | null = null;
export let renderer: THREE.WebGLRenderer | null = null;
// export const controls: OrbitControls | null = null;

export let cameraControls: CameraControls | null = null;

const clock = new THREE.Clock();

CameraControls.install({ THREE: THREE });



export async function initScene(
	canvas,
	volumeSize,
	voxelSize,
	cameraPosition,
	cameraUp,
	cameraFovDegrees,
	cameraNear,
	cameraFar,
	volumeDataUint8
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

	window.addEventListener('resize', resize);
	resize();
	animate();


	camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
	camera.up.set(cameraUp[0], cameraUp[1], cameraUp[2]);

	//
	// Add a grid to the scene to help visualize camera movement.
	//
	const gridHelper = new THREE.GridHelper(50, 50);
	gridHelper.position.y = -1;
	scene.add(gridHelper);



	// Lights, to be used both during rendering the volume, and rendering the optional surface.
	const sunLightDir = new THREE.Vector3(0.0, 0.5, 0.5);
	const sunLightColor = new THREE.Color(0.99, 0.83, 0.62);
	const sunLight = new THREE.DirectionalLight(sunLightColor.getHex(), 1.0);
	sunLight.position.copy(sunLightDir);
	scene.add(sunLight);
	const seaLightColor = new THREE.Color(0.0, 0.0005, 0.0033);
	const toaLightColor = new THREE.Color(0.0, 0.0002, 0.033);
	const hemisphereLight = new THREE.HemisphereLight(seaLightColor.getHex(), toaLightColor.getHex(), 1.0);
	scene.add(hemisphereLight);

	//
	// Add an axes helper to the scene to help with debugging.
	//
	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	//






	// Add the points to the scene.
	scene.add(examplePoints());
	// END OF EXAMPLE POINTS



	//
	// Add clouds container
	//
	const [boxWidth = 1, boxHeight = 1, boxDepth = 0.3] = getBoxSize(volumeSize, voxelSize);
	const boxSize = new THREE.Vector3(boxWidth, boxHeight, boxDepth);
	console.log(`Voxel size ${voxelSize[0]}, ${voxelSize[1]}, ${voxelSize[2]}`);
	console.log(`Box size ${boxWidth}, ${boxHeight}, ${boxDepth}`);

	const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
	const box = new THREE.Mesh(boxGeometry);
	scene.add(box);


}


function initMaterial(box, boxSize, sunLight, hemisphereLight, volumeDataUint8, volumeSize, voxelSize, cameraNear, cameraFar) {
	const volumeTexture = new THREE.DataTexture3D(volumeDataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
	volumeTexture.format = THREE.RedFormat;
	volumeTexture.type = THREE.UnsignedByteType;
	// Disabling mimpaps saves memory.
	volumeTexture.generateMipmaps = false;
	// Linear filtering disables LODs, which do not help with volume rendering.
	volumeTexture.minFilter = THREE.LinearFilter;
	volumeTexture.magFilter = THREE.LinearFilter;
	volumeTexture.needsUpdate = true;



	// Create a buffer with your 3D texture data
	const size = volumeSize[0] * volumeSize[1] * volumeSize[2];
	const data = new Uint8Array(size);

	// Fill the data with your values
	for (let i = 0; i < size; i++) {
		data[i] = Math.random() * 255;
	}

	// Create the 3D texture
	const texture = new THREE.DataTexture3D(data, volumeSize[0], volumeSize[1], volumeSize[2]);

	// Set the texture parameters as needed
	texture.format = THREE.RedFormat;
	texture.type = THREE.UnsignedByteType;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.unpackAlignment = 1;






	const lightColor = sunLight.color;
	const lightColorV = new THREE.Vector3(lightColor.r, lightColor.g, lightColor.b);
	//      const ambientLightColorV = new THREE.Vector3(0.3, 0.7, 0.98);
	const ambientLightColorV = new THREE.Vector3(
		hemisphereLight.color.r,
		hemisphereLight.color.g,
		hemisphereLight.color.b
	);

	const boxMaterial = new THREE.ShaderMaterial({
		vertexShader: vertexShaderVolume,
		fragmentShader: fragmentShaderVolume,
		side: THREE.BackSide,
		transparent: true,
		opacity: 1.0,
		uniforms: {
			boxSize: new THREE.Uniform(boxSize),
			volumeTex: new THREE.Uniform(texture),
			// volumeTex: new THREE.Uniform(volumeTexture),
			voxelSize: new THREE.Uniform(voxelSize),
			sunLightDir: new THREE.Uniform(sunLight.position),
			sunLightColor: new THREE.Uniform(lightColorV),
			ambientLightColor: new THREE.Uniform(ambientLightColorV),
			near: new THREE.Uniform(cameraNear),
			far: new THREE.Uniform(cameraFar),
			// The following are set separately, since they are based on `props` values that can
			// change often, and should not trigger complete re-initialization.
			transferTex: new THREE.Uniform(null),
			dtScale: new THREE.Uniform(0),
			inScatFactor: new THREE.Uniform(0),
			qLScale: new THREE.Uniform(0),
			gHG: new THREE.Uniform(0),
			dataEpsilon: new THREE.Uniform(0),
			bottomColor: new THREE.Uniform(new THREE.Vector3(0.0, 0.0005, 0.0033)),
			finalGamma: new THREE.Uniform(0)
		}
	});


	/* eslint no-param-reassign: ["error", { "props": false }] */
	box.material = boxMaterial;

}


export function setCameraView(position: number[], up: number[]) {
	animate();
	camera.position.set(...position);
	camera.up.set(...up);
	camera.lookAt(0, 0, 0);

}

function animate(
	//time?: number
) {
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

function resize() {
	renderer.setSize(window.innerWidth, 400);
	camera.aspect = window.innerWidth / 400;
	camera.updateProjectionMatrix();
};


