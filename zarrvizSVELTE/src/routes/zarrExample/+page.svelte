<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { openArray, HTTPStore, create } from 'zarr';
	import CameraControls from 'camera-controls';
	import vertexShaderVolume from '$lib/shaders/volume.vert';
	import fragmentShaderVolume from '$lib/shaders/volume.frag';
	import { makeCloudTransferTex } from '$lib/utils/makeCloudTransferTex';
	import { getBoxSize } from '$lib/utils/Utils';
	CameraControls.install({ THREE: THREE });
	// Other variables and refs

	const timeIndex = 0;
	let dataUint8: Uint8Array = new Uint8Array(0);
	let voxelSize: number[] = [100, 100, 37.46];
	let volumeSize = [1536, 1536, 123];
	// const zarrArray = await openArray({ store: 'http://localhost:5173/data/ql.zarr' });

	let cameraControls: CameraControls | null = null;
	let canvas: HTMLElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;

	// Be caruful with these valies, they can clip the date in the 3D scene
	let cameraNear = 0.1;
	let cameraFar = 10000.0;
	let cameraFovDegrees = 45.0;

	const sunLightDir = new THREE.Vector3(0.0, 0.5, 0.5);
	const sunLightColor = new THREE.Color(0.99, 0.83, 0.62);
	const sunLight = new THREE.DirectionalLight(sunLightColor.getHex(), 1.0);
	sunLight.position.copy(sunLightDir);

	const seaLightColor = new THREE.Color(0.0, 0.0005, 0.0033);
	const toaLightColor = new THREE.Color(0.0, 0.0002, 0.033);
	const hemisphereLight = new THREE.HemisphereLight(seaLightColor.getHex(), toaLightColor.getHex(), 1.0);

	const finalGamma = 6.0;

	let materialRef: THREE.ShaderMaterial | null = null;

	async function create3DScene() {
		// Set up the Three.js scene

		// Set up the Three.js scene
		scene = new THREE.Scene();
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas }); // Create a WebGLRenderer and specify the canvas to use
		camera = new THREE.PerspectiveCamera(
			cameraFovDegrees,
			window.innerWidth / window.innerHeight,
			cameraNear,
			cameraFar
		);
		camera.position.z = 5; // Adjust as needed
		cameraControls = new CameraControls(camera, canvas);

		renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the canvas
		renderer.setClearAlpha(0); // Make the canvas transparent

		// Create a cube
		const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
		const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.position.set(-1, 0, 0); // Set the position of the cube
		scene.add(cube); // Add the cube to the scene

		//
		// Add an axes helper to the scene to help with debugging.
		//
		const axesHelper = new THREE.AxesHelper(5);
		scene.add(axesHelper);
		//
		// Add a grid to the scene to help visualize camera movement.
		//
		const gridHelper = new THREE.GridHelper(50, 50);
		gridHelper.position.y = -1;
		scene.add(gridHelper);

		//
		// Add a plane with the Map to the scene
		//
		const planeMesh = createPlaneMesh({ width: 100, height: 100, depth: 37.46699284324961 });
		// scene.add(planeMesh);

		//
		// Lights, to be used both during rendering the volume, and rendering the optional surface.
		//
		// Add the sun light to the scene
		scene.add(sunLight);
		// Add the hemisphere light to the scene
		scene.add(hemisphereLight);

		//
		// Render loop
		//
		const clock = new THREE.Clock();
		function animate() {
			requestAnimationFrame(animate);
			const delta = clock.getDelta();
			cameraControls.update(delta);
			renderer.render(scene, camera);
		}
		animate();
		console.log('🔋 3d scene created');
	}

	function initMaterial({ renderer, dataUint8, box, boxSize }) {
		return new Promise((resolve, reject) => {
			console.log('🎹dataUint8 ', dataUint8);

			const volumeTexture = new THREE.Data3DTexture(dataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
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
			// Initial render to display the scene.
			renderScene();

			/* eslint no-param-reassign: ["error", { "props": false }] */
			// box.material = boxMaterial;

			// return [boxMaterial];
			console.log('🔋 init material');
			resolve(boxMaterial);
		});
	}

	// Render the scene. This function can be reused in other effects or callbacks.
	function renderScene() {
		renderer.render(scene, camera);
		console.log('🔥 rendered');
	}
	// function initMaterial({ dataUint8, volumeSize, boxSize }) {
	// 	const volumeTexture = new THREE.Data3DTexture(dataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
	// 	// const volumeTexture = new THREE.Data3DTexture(dataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
	// 	volumeTexture.format = THREE.RedFormat;
	// 	volumeTexture.type = THREE.UnsignedByteType;
	// 	// Disabling mimpaps saves memory.
	// 	volumeTexture.generateMipmaps = false;
	// 	// Linear filtering disables LODs, which do not help with volume rendering.
	// 	volumeTexture.minFilter = THREE.LinearFilter;
	// 	volumeTexture.magFilter = THREE.LinearFilter;
	// 	volumeTexture.needsUpdate = true;

	// 	const lightColor = sunLight.color;
	// 	const lightColorV = new THREE.Vector3(lightColor.r, lightColor.g, lightColor.b);
	// 	//  const ambientLightColorV = new THREE.Vector3(0.3, 0.7, 0.98);
	// 	const ambientLightColorV = new THREE.Vector3(
	// 		hemisphereLight.color.r,
	// 		hemisphereLight.color.g,
	// 		hemisphereLight.color.b
	// 	);

	// 	const boxMaterial = new THREE.ShaderMaterial({
	// 		vertexShader: vertexShaderVolume,
	// 		fragmentShader: fragmentShaderVolume,
	// 		side: THREE.BackSide,
	// 		transparent: true,
	// 		opacity: 1.0,
	// 		uniforms: {
	// 			boxSize: new THREE.Uniform(boxSize),
	// 			volumeTex: new THREE.Uniform(volumeTexture),
	// 			voxelSize: new THREE.Uniform(voxelSize),
	// 			sunLightDir: new THREE.Uniform(sunLight.position),
	// 			sunLightColor: new THREE.Uniform(lightColorV),
	// 			ambientLightColor: new THREE.Uniform(ambientLightColorV),
	// 			near: new THREE.Uniform(cameraNear),
	// 			far: new THREE.Uniform(cameraFar),
	// 			// The following are set separately, since they are based on `props` values that can
	// 			// change often, and should not trigger complete re-initialization.
	// 			transferTex: new THREE.Uniform(null),
	// 			dtScale: new THREE.Uniform(0),
	// 			inScatFactor: new THREE.Uniform(0),
	// 			qLScale: new THREE.Uniform(0),
	// 			gHG: new THREE.Uniform(0),
	// 			dataEpsilon: new THREE.Uniform(0),
	// 			bottomColor: new THREE.Uniform(new THREE.Vector3(0.0, 0.0005, 0.0033)),
	// 			finalGamma: new THREE.Uniform(0)
	// 		}
	// 	});

	// 	/* eslint no-param-reassign: ["error", { "props": false }] */
	// 	return boxMaterial;
	// }

	// TODO: CONTINUE HERE
	// This `useEffect` follows the first React rendering, so it is necessary to
	// explicitly force a Three.js rendering to make the volme visible before any
	// interactive camera motion.
	// renderScene();
	// }, [dtScale, inScatFactor, finalGamma, renderScene, transferFunctionTex]);

	let boxSize = new THREE.Vector3(1, 1, 1);
	let dtScale: number = 1.0;
	let inScatFactor: number = 0.06;
	let qLScale: number = 0.00446;
	let gHG: number = 0.8;
	let dataEpsilon: number = 1e-5;
	let bottomColor: number[] = [0.0, 0.0005, 0.0033];

	// let boxSize: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

	function updateMaterial({ dataUint8, volumeSize }) {
		console.log('update box material');

		materialRef.uniforms.volumeTex.value.dispose();
		// const volumeTexture = new THREE.DataTexture3D(dataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
		const volumeTexture = new THREE.Data3DTexture(dataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
		volumeTexture.format = THREE.RedFormat;
		volumeTexture.type = THREE.UnsignedByteType;
		// Disabling mimpaps saves memory.
		volumeTexture.generateMipmaps = false;
		// Linear filtering disables LODs, which do not help with volume rendering.
		volumeTexture.minFilter = THREE.LinearFilter;
		volumeTexture.magFilter = THREE.LinearFilter;
		volumeTexture.needsUpdate = true;
		materialRef.uniforms.volumeTex.value = volumeTexture;
		// materialRef.uniforms.transferTex.value = transferFunctionTex ;
		materialRef.uniforms.transferTex.value = makeCloudTransferTex();
		materialRef.uniforms.dtScale.value = dtScale;
		materialRef.uniforms.inScatFactor.value = inScatFactor;
		materialRef.uniforms.qLScale.value = qLScale;
		materialRef.uniforms.gHG.value = gHG;
		materialRef.uniforms.dataEpsilon.value = dataEpsilon;
		materialRef.uniforms.bottomColor.value = bottomColor;
		materialRef.uniforms.finalGamma.value = finalGamma;
	}

	function createPlaneMesh({ width = 100, height = 100, depth = 37.46699284324961 }) {
		//
		// Adding the plane mesh to the scene to hold the Map texture
		//
		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load('/maps/nl-map.webp');
		// Create a plane geometry and mesh
		const planeGeometry = new THREE.PlaneGeometry(width * 4, height * 4);
		const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
		const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

		planeMesh.position.set(-width / 1000, -height / 1000, depth * -3); // Adjust position as needed
		// planeMesh.position.set(0, 0, 0); // Adjust position as needed

		return planeMesh;
	}

	async function downloadZarrPoints() {
		return new Promise(async (resolve, reject) => {
			const getData = performance.now();
			// Create an HTTPStore pointing to the base of your Zarr hierarchy
			const fetchOptions = { redirect: 'follow', mode: 'no-cors', credentials: 'include' };
			const supportedMethods = ['GET', 'HEAD'];
			const store = new HTTPStore('http://localhost:5173/data/ql.zarr', { fetchOptions, supportedMethods });
			const zarrdata = await openArray({ store, path: 'ql', mode: 'r' });

			const { data, strides, shape } = await zarrdata.getRaw([timeIndex, null, null, null]);
			dataUint8 = data;
			// Open the Zarr arrays using the HTTPStore
			// const xtArray = await openArray({ store, path: 'xt' });
			// const ytArray = await openArray({ store, path: 'yt' });
			// const ztArray = await openArray({ store, path: 'zt' });

			// Assuming the arrays are 1D and of the same length
			// const [xt, yt, zt] = await Promise.all([xtArray.getRaw(null), ytArray.getRaw(null), ztArray.getRaw(null)]);
			// console.log('🎹 xt, yt, zt', xt, yt, zt);
			console.log('...done.), data:', data, strides, shape);

			// NOTE: THIS DATA IN NOT SOMETHING THAT THREEJS CAN RENDER,
			// IT NEEDS TO BE CONVERTED TO A THREEJS GEOMETRY

			const o = performance.now();

			if (timeIndex === 0) {
				const zarrxvals = await openArray({ store, path: 'xt', mode: 'r' });
				const zarryvals = await openArray({ store, path: 'yt', mode: 'r' });
				const zarrzvals = await openArray({ store, path: 'zt', mode: 'r' });
				const xvals = await zarrxvals.getRaw([null]);
				const yvals = await zarryvals.getRaw([null]);
				const zvals = await zarrzvals.getRaw([null]);

				const xvalues = xvals.data;
				const dx = xvalues[1] - xvalues[0];
				const yvalues = yvals.data;
				const dy = yvalues[1] - yvalues[0];
				const zvalues = zvals.data;
				let sumDifferences = 0;

				for (let i = 1; i < zvalues.length; i++) {
					sumDifferences += Math.abs(zvalues[i] - zvalues[i - 1]);
				}
				const dz = sumDifferences / (zvalues.length - 1);
				console.log('I calculated ', dx, dy, dz);
				voxelSize = [dx, dy, dz]; // [1536, 1536, 123]
				volumeSize = [shape[1], shape[2], shape[0]]; // [100, 100, 37.46699284324961]
			}

			const [boxWidth, boxHeight, boxDepth] = getBoxSize(volumeSize, voxelSize);
			boxSize = new THREE.Vector3(boxWidth, boxHeight, boxDepth);
			console.log(`Voxel size ${voxelSize[0]}, ${voxelSize[1]}, ${voxelSize[2]}`);
			console.log(`Box size ${boxWidth}, ${boxHeight}, ${boxDepth}`);

			const o2 = performance.now();
			console.log('⏱️ time to get data o', o2 - o, voxelSize, volumeSize);

			const getData2 = performance.now();
			console.log('⏰ downloading time slice', getData2 - getData, timeIndex, '...');

			// resolve promise
			resolve(true);
		});
		// renderScene();
		//
		//
		//
		// We have the data and the size of the volume here
		//
		//
		//
	}

	async function addBox({ dataUint8, volumeSize }) {
		// A box in which the 3D volume texture will be rendered.  The box will be
		// centered at the origin, with X in [-0.5, 0.5] so the width is 1, and
		// Y (height) and Z (depth) scaled to match.
		const [boxWidth, boxHeight, boxDepth] = getBoxSize(volumeSize, voxelSize);
		boxSize = new THREE.Vector3(boxWidth, boxHeight, boxDepth);
		console.log(`Voxel size ${voxelSize[0]}, ${voxelSize[1]}, ${voxelSize[2]}`);
		console.log(`Box size ${boxWidth}, ${boxHeight}, ${boxDepth}`);

		const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
		const box = new THREE.Mesh(boxGeometry);
		// create a yellow material

		scene.add(box);

		///
		//
		// CONTINUE HERE I THINK THIS IS THE KEY TO GETTING THE DATA INTO THE BOX

		///

		///
		materialRef = await initMaterial({ dataUint8, volumeSize, boxSize });
		box.material = materialRef;

		// Dispose of the old texture to free up memory.

		box.material.uniforms.volumeTex.value.dispose();

		// Create a new 3D texture for the volume data.
		const volumeTexture = new THREE.Data3DTexture(dataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
		volumeTexture.format = THREE.RedFormat;
		volumeTexture.type = THREE.UnsignedByteType;
		volumeTexture.generateMipmaps = false; // Saves memory.
		volumeTexture.minFilter = THREE.LinearFilter; // Better for volume rendering.
		volumeTexture.magFilter = THREE.LinearFilter;
		volumeTexture.needsUpdate = true;

		// Update material uniforms with new texture and parameters.
		box.material.uniforms.volumeTex.value = volumeTexture;
		// box.material.uniforms.transferTex.value = transferFunctionTex;
		box.material.uniforms.transferTex.value = makeCloudTransferTex();
		box.material.uniforms.dtScale.value = dtScale;
		box.material.uniforms.inScatFactor.value = inScatFactor;
		box.material.uniforms.qLScale.value = qLScale;
		box.material.uniforms.gHG.value = gHG;
		box.material.uniforms.dataEpsilon.value = dataEpsilon;
		box.material.uniforms.bottomColor.value = bottomColor;
		box.material.uniforms.finalGamma.value = finalGamma;

		// Initial render to display the scene.
		renderScene();
		///
		//

		//

		//

		// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

		console.log('🔋 add box');
		// box.material = material;
		renderScene();
		// updateMaterial({ dataUint8, volumeSize });
		// initMaterial({ dataUint8, volumeSize, boxSize });
	}

	onMount(async () => {
		console.log('🎹 1');

		await create3DScene();
		console.log('🎹 2');
		await downloadZarrPoints();
		console.log('🎹 3');
		await addBox({ dataUint8, volumeSize });
	});
</script>

<canvas class="w-full h-[400px]" bind:this={canvas} />
