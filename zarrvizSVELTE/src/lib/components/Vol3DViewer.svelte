<script lang="ts">
	import * as THREE from 'three';
	import OrbitUnlimitedControls from '@janelia/three-orbit-unlimited-controls';
	import { getBoxSize } from '../utils/Utils';
	import vertexShaderVolume from '../shaders/volume.vert';
	import fragmentShaderVolume from '../shaders/volume.frag';
	import { onDestroy, onMount } from 'svelte';

	// Props
	export let volumeDataUint8;
	export let volumeSize;
	export let voxelSize;
	export let transferFunctionTex;
	// Vertical field of view

	export let dtScale: 1.0;
	export let inScatFactor: 0.06;
	export let qLScale: 0.00446;
	export let gHG: 0.8;
	export let dataEpsilon: 1e-5;
	export let bottomColor: [0.0, 0.0005, 0.0033];
	export let finalGamma: 4.5;
	export let interactionSpeedup: 1;
	export let cameraPosition: [0, 0, 2];
	// Gives the correct orientation for Janelia FlyLight datasets
	export let cameraUp: [0, 1, 0];
	export let cameraFovDegrees: 45.0;
	export let orbitZoomSpeed: 0.15;
	export let onCameraChange: null;
	export let onWebGLRender: null;

	let mount;
	let renderer, camera, trackball, scene, box, boxMaterial;
	let prevHeight = window.innerHeight;

	const cameraNear = 0.01;
	const cameraFar = 10.0;

	onMount(() => {
		// Similar to componentDidMount
		initRenderer();
		initScene();
		initMaterial();
		updateOrbitUnlimitedControls();
		checkWebGLSupport();
		handleResize();

		window.innerWidth = 800; // sets the window width to 800 pixels

		const windowWidth = window.innerWidth;
		console.log(`Window width: ${windowWidth}px`);

		return () => {
			// Cleanup logic, similar to componentWillUnmount
			mount.removeChild(renderer.domElement);
			window.removeEventListener('resize', handleResize);
		};
	});

	function initRenderer() {
		console.log('initRenderer');

		// Three.js now uses WebGL 2 by default, so no special canvas context is needed.
		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		//renderer.setClearColor("#000000");
		renderer.setClearAlpha(0);

		// For a shader using `gl_FragCoord`, as in this code (Shaders.js), the following
		// use of `setPixelRatio` is not recommended in this guide:
		// https://threejs.org/manual/#en/responsive
		// On the other hand, the Three.js authors say the following use is correct:
		// https://github.com/mrdoob/three.js/issues/12770

		// Eliminates some artifacts on MacBook Pros with Retina displays.
		renderer.setPixelRatio(window.devicePixelRatio);

		// Must be called after setPixelRatio().
		const width = window.innerWidth || mountRef.current.clientWidth;
		const height = window.innerWidth || 100 || mountRef.current.clientHeight;
		renderer.setSize(width, height);

		// The `clientHeight` does not seem to change when resizing to a shorter height.
		// So keep track of the `innerHeight`, which does change, and use it for a correction.
		prevHeightRef.current = window.innerHeight;

		mountRef.current.appendChild(renderer.domElement);
		return renderer;
	}

	function initScene() {
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

	function initMaterial() {
		// ...
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

	// Other functions and reactive statements can go here
</script>

<div class="h-full w-screen">
	{#if renderer}
		<div bind:this={mount} />
		<div class="camera-control">
			<button class="btn" on:click={() => setCameraView([0, -2, 0], [0, 0, 1])} id="viewAbove">
				View from Side
			</button>
			<button class="btn" on:click={() => setCameraView([0, 0, 2], [0, 1, 0])} id="viewFront">
				View from Front
			</button>
		</div>
	{:else}
		<div>WebGL 2 is not supported in this browser.</div>
	{/if}
</div>
