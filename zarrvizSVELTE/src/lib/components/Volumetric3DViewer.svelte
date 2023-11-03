<script lang="ts">
	import * as THREE from 'three';
	import OrbitUnlimitedControls from '@janelia/three-orbit-unlimited-controls';
	import { getBoxSize } from '../utils/Utils';
	import vertexShaderVolume from '../shaders/volume.vert';
	import fragmentShaderVolume from '../shaders/volume.frag';
	import { onMount } from 'svelte';

	import { init3DScene } from './init3dScene';

	/// Props
	export let volumeDataUint8: {
		buffer: { byteLength: number };
	};
	export let volumeSize: number[];
	export let voxelSize: number[];
	export let dtScale: number = 1.0;
	export let inScatFactor: number = 0.06;
	export let qLScale: number = 0.00446;
	export let gHG: number = 0.8;
	export let dataEpsilon: number = 1e-5;
	export let bottomColor: number[] = [0.0, 0.0005, 0.0033];
	export let transferFunctionTex: { type: number };

	export let finalGamma: number = 4.5;
	export let interactionSpeedup: number = 1;
	export let cameraPosition: number[] = [0, 0, 2];
	export let cameraUp: number[] = [0, 1, 0];
	export let cameraFovDegrees: number = 45.0;
	export let orbitZoomSpeed: number = 0.15;
	export let onCameraChange: Function | null = null;
	export let onWebGLRender: Function | null = null;

	// Other variables and refs
	let canvas: HTMLElement;

	let renderer: THREE.WebGLRenderer | null = null;
	let camera: THREE.PerspectiveCamera | null = null;
	let scene: THREE.Scene | null = null;
	let box: THREE.Mesh | null = null;
	let boxMaterial: THREE.Material | null = null;
	let trackball: any = null; // OrbitUnlimitedControls doesn't have type definitions
	let prevHeight: number | null = null;
	const cameraNear = 0.01;
	const cameraFar = 10.0;

	onMount(() => {
		init3DScene(canvas);
		// Similar to componentDidMount
		// initRenderer();
		// initScene();

		// renderer = new THREE.WebGLRenderer({
		// 	canvas: canvas,
		// 	antialias: true
		// 	// alpha: true
		// 	// preserveDrawingBuffer: true,
		// 	// depth: false,
		// 	// stencil: false,
		// 	// premultipliedAlpha: false,
		// 	// powerPreference: 'high-performance',
		// 	// devicePixelRatio: window.devicePixelRatio
		// });

		// console.log('initScene');

		// const scene = new THREE.Scene();
		// const camera = new THREE.PerspectiveCamera(
		// 	75,
		// 	window.innerWidth / window.innerHeight,
		// 	0.1,
		// 	1000
		// );
		// camera.position.z = 5;
		// // renderer.setSize(window.innerWidth, window.innerHeight);
		// renderer.setSize(window.innerWidth, 400);

		// const geometry = new THREE.BoxGeometry(1, 1, 1);
		// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		// const cube = new THREE.Mesh(geometry, material);

		// scene.add(cube);

		// CONTINUE HERE
		// initMaterial();
		// updateOrbitUnlimitedControls();
		// checkWebGLSupport();
		// handleResize();

		// window.innerWidth = 800; // sets the window width to 800 pixels

		// const windowWidth = window.innerWidth;
		// console.log(`Window width: ${windowWidth}px`);

		return () => {
			// Cleanup logic
			// renderer.dispose();
			// mount.removeChild(renderer.domElement);
			// window.removeEventListener('resize', handleResize);
		};
	});

	// function initRenderer() {
	// 	console.log('initRenderer');

	// 	// Three.js now uses WebGL 2 by default, so no special canvas context is needed.
	// 	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	// 	//renderer.setClearColor("#000000");
	// 	renderer.setClearAlpha(0);

	// 	// For a shader using `gl_FragCoord`, as in this code (Shaders.js), the following
	// 	// use of `setPixelRatio` is not recommended in this guide:
	// 	// https://threejs.org/manual/#en/responsive
	// 	// On the other hand, the Three.js authors say the following use is correct:
	// 	// https://github.com/mrdoob/three.js/issues/12770

	// 	// Eliminates some artifacts on MacBook Pros with Retina displays.
	// 	renderer.setPixelRatio(window.devicePixelRatio);

	// 	// Must be called after setPixelRatio().
	// 	const width = window.innerWidth || mount.clientWidth;
	// 	const height = window.innerWidth || 100 || mount.clientHeight;
	// 	renderer.setSize(width, height);

	// 	// The `clientHeight` does not seem to change when resizing to a shorter height.
	// 	// So keep track of the `innerHeight`, which does change, and use it for a correction.
	// 	prevHeight = window.innerHeight;

	// 	mount.appendChild(renderer.domElement);
	// 	return renderer;
	// }

	function initScene() {
		console.log('initRenderer');

		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: true,
			preserveDrawingBuffer: true,
			depth: false,
			stencil: false,
			premultipliedAlpha: false,
			powerPreference: 'high-performance',
			devicePixelRatio: window.devicePixelRatio
		});
		renderer.setSize(window.innerWidth, window.innerHeight);

		console.log('initScene');

		const scene = new THREE.Scene();

		// A box in which the 3D volume texture will be rendered.  The box will be
		// centered at the origin, with X in [-0.5, 0.5] so the width is 1, and
		// Y (height) and Z (depth) scaled to match.

		const [boxWidth, boxHeight, boxDepth] = getBoxSize(volumeSize, voxelSize);
		const boxSize = new THREE.Vector3(boxWidth, boxHeight, boxDepth);
		console.log(`Voxel size ${voxelSize[0]}, ${voxelSize[1]}, ${voxelSize[2]}`);
		console.log(`Box size ${boxWidth}, ${boxHeight}, ${boxDepth}`);

		const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
		const box = new THREE.Mesh(boxGeometry);
		scene.add(box);

		// Lights, to be used both during rendering the volume, and rendering the optional surface.

		const sunLightDir = new THREE.Vector3(0.0, 0.5, 0.5);
		const sunLightColor = new THREE.Color(0.99, 0.83, 0.62);
		const sunLight = new THREE.DirectionalLight(sunLightColor.getHex(), 1.0);
		sunLight.position.copy(sunLightDir);
		scene.add(sunLight);
		const seaLightColor = new THREE.Color(0.0, 0.0005, 0.0033);
		const toaLightColor = new THREE.Color(0.0, 0.0002, 0.033);
		const hemisphereLight = new THREE.HemisphereLight(
			seaLightColor.getHex(),
			toaLightColor.getHex(),
			1.0
		);
		scene.add(hemisphereLight);

		// Add an axes helper to the scene to help with debugging.
		const axesHelper = new THREE.AxesHelper(5);
		scene.add(axesHelper);
		//
		// Adding the plane mesh to the scene to hold the Map texture
		//
		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load('/maps/nl-map.webp');
		// Create a plane geometry and mesh
		const planeGeometry = new THREE.PlaneGeometry(boxWidth * 4, boxHeight * 4);
		const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
		const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

		// Position the plane underneath the box
		planeMesh.position.set(-boxWidth / 1000, -boxHeight / 1000, boxDepth * -3); // Adjust position as needed

		// Rotate the plane to be horizontal
		// planeMesh.rotation.x = -Math.PI / 2;

		// Add the plane mesh to the scene
		scene.add(planeMesh);
	}

	function initMaterial(renderer, box, boxSize, sunLight, hemisphereLight) {
		const volumeTexture = new THREE.DataTexture3D(
			volumeDataUint8,
			volumeSize[0],
			volumeSize[1],
			volumeSize[2]
		);
		volumeTexture.format = THREE.RedFormat;
		volumeTexture.type = THREE.UnsignedByteType;
		// Disabling mimpaps saves memory.
		volumeTexture.generateMipmaps = false;
		// Linear filtering disables LODs, which do not help with volume rendering.
		volumeTexture.minFilter = THREE.LinearFilter;
		volumeTexture.magFilter = THREE.LinearFilter;
		volumeTexture.needsUpdate = true;

		const lightColor = sunLight.color;
		const lightColorV = new THREE.Vector3(lightColor.r, lightColor.g, lightColor.b);
		const ambientLightColorV = new THREE.Vector3(
			hemisphereLight.color.r,
			hemisphereLight.color.g,
			hemisphereLight.color.b
		);
		//      const ambientLightColorV = new THREE.Vector3(0.3, 0.7, 0.98);

		const boxMaterial = new THREE.ShaderMaterial({
			vertexShader: vertexShaderVolume,
			fragmentShader: fragmentShaderVolume,
			side: THREE.BackSide,
			transparent: true,
			opacity: 1.0,
			uniforms: {
				boxSize: new THREE.Uniform(boxSize),
				volumeTex: new THREE.Uniform(volumeTexture),
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

		return [boxMaterial];
	}

	function updateOrbitUnlimitedControls() {
		// ...
	}

	function checkWebGLSupport() {
		// ...
	}

	function handleResize() {
		// ...
	}

	function setCameraView(position: number[], up: number[]) {
		camera.position.set(...position);
		camera.up.set(...up);
		camera.lookAt(0, 0, 0);
		// renderScene();
	}
</script>

<canvas class="w-full h-[400px] bg-red-500" bind:this={canvas} />

<button class="btn" on:click={() => setCameraView([0, -2, 0], [0, 0, 1])} id="viewAbove">
	View from Side
</button>
<button class="btn" on:click={() => setCameraView([0, 0, 2], [0, 1, 0])} id="viewFront">
	View from Front
</button>
<!-- <div class="h-full w-screen"> -->
<!-- {#if renderer} -->
<!-- <div bind:this={mount} /> -->

<!-- <div class="camera-control"> -->
<!-- </div> -->
<!-- {:else} -->
<!-- <div>WebGL 2 is not supported in this browser.</div> -->
<!-- {/if} -->
<!-- </div> -->
