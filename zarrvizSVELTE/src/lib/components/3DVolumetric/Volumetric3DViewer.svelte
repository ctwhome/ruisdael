<script lang="ts">
	import * as THREE from 'three';

	import { afterUpdate, onMount } from 'svelte';

	import { initScene, camera, renderer, cameraControls, box, boxSize } from './initScene';
	import { addMaterial } from './addMaterial';

	/// Props
	export let volumeDataUint8: {
		buffer: { byteLength: number };
	};
	export let volumeSize: number[];
	export let voxelSize: number[] = [1, 1, 1];
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
	// export let orbitZoomSpeed: number = 0.15;
	// export let onCameraChange: Function | null = null;
	// export let onWebGLRender: Function | null = null;

	// Other variables and refs
	let canvas: HTMLElement;

	// let renderer: THREE.WebGLRenderer | null = null;
	// let camera: THREE.PerspectiveCamera | null = null;
	// let scene: THREE.Scene | null = null;
	// let box: THREE.Mesh | null = null;
	// let boxMaterial: THREE.Material | null = null;
	// let trackball: any = null; // OrbitUnlimitedControls doesn't have type definitions
	// let prevHeight: number | null = null;

	let cameraNear = 0.01;
	let cameraFar = 10.0;
	// $: {
	// 	console.log('volumeDataUint8', camera?.position);
	// }

	// TODO: CONTINUE:how to print the values of camera, etc etc etc... reactively in svelte
	// A reactive statement that updates whenever the camera position changes
	afterUpdate(() => {
		console.log(
			`AFTER UPDATE: Camera position: x: ${camera.position.x}, y: ${camera.position.y}, z: ${camera.position.z}`
		);
	});
	onMount(() => {
		initScene(canvas, volumeSize, voxelSize, cameraPosition, cameraUp, cameraFovDegrees, cameraNear, cameraFar);
		// TODO CONTINUE HERE
		box.material = addMaterial(volumeDataUint8, boxSize, volumeSize, voxelSize, cameraNear, cameraFar);

		// camera.addEventListener('onchange' as any, () => {
		// 	console.log('Camera changed');
		// 	// Do something when the camera changes
		// });

		// initMaterial(boxSize);

		// updateOrbitUnlimitedControls();
		// checkWebGLSupport();
		// handleResize();

		// window.innerWidth = 800; // sets the window width to 800 pixels

		// const windowWidth = window.innerWidth;
		// console.log(`Window width: ${windowWidth}px`);

		return () => {
			// Cleanup logic
			renderer.dispose();
			// mount.removeChild(renderer.domElement);
			// window.removeEventListener('resize', handleResize);
		};
	});
</script>

<canvas class="w-full h-[400px]" bind:this={canvas} />

<div class="info">
	<!-- <label
		><input
			type="checkbox"
			on:change={(cameraControls.verticalDragToForward = this.checked)}
		/>vertical drag to move forward</label
	> -->
	<br />
	<!-- <label> -->
	<!-- <input type="checkbox" bind:checked={cameraControls.dollyToCursor} />dolly to cursor -->
	<!-- </label> -->
	<br />
	<!-- <label> -->
	<!-- <input type="checkbox" bind:checked={cameraControls.dollyDragInverted} />dolly drag inverted -->
	<!-- </label> -->
	<br />
	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.rotate(45 * THREE.MathUtils.DEG2RAD, 0, true)}
		>rotate theta 45deg</button
	>
	<button class="btn btn-sm" on:click={() => cameraControls.rotate(-90 * THREE.MathUtils.DEG2RAD, 0, true)}
		>rotate theta -90deg</button
	>
	<button class="btn btn-sm" on:click={() => cameraControls.rotate(360 * THREE.MathUtils.DEG2RAD, 0, true)}
		>rotate theta 360deg</button
	>
	<button class="btn btn-sm" on:click={() => cameraControls.rotate(0, 20 * THREE.MathUtils.DEG2RAD, true)}
		>rotate phi 20deg</button
	>
	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.truck(1, 0, true)}> truck( 1, 0 ) </button>
	<button class="btn btn-sm" on:click={() => cameraControls.truck(0, 1, true)}> truck( 0, 1 ) </button>
	<button class="btn btn-sm" on:click={() => cameraControls.truck(-1, -1, true)}> truck( -1, -1 ) </button>
	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.dolly(1, true)}>dolly 1</button>
	<button class="btn btn-sm" on:click={() => cameraControls.dolly(-1, true)}>dolly -1</button>
	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.zoom(camera.zoom / 2, true)}>zoom `camera.zoom / 2`</button>
	<button class="btn btn-sm" on:click={() => cameraControls.zoom(-camera.zoom / 2, true)}
		>zoom `- camera.zoom / 2`</button
	>
	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.moveTo(3, 5, 2, true)}> move to( 3, 5, 2 )</button>
	<!-- <button class="btn btn-sm" on:click={()=> cameraControls.fitToBox(mesh, true)}>fit to the bounding box of the mesh</button -->

	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.setPosition(-5, 2, 1, true)}>move to ( -5, 2, 1 )</button>
	<button class="btn btn-sm" on:click={() => cameraControls.setTarget(3, 0, -3, true)}>look at ( 3, 0, -3 )</button>
	<button class="btn btn-sm" on:click={() => cameraControls.setLookAt(1, 2, 3, 1, 1, 0, true)}
		>move to ( 1, 2, 3 ), look at ( 1, 1, 0 )</button
	>
	<br />
	<button on:click={() => cameraControls.lerpLookAt(-2, 0, 0, 1, 1, 0, 0, 2, 5, -1, 0, 0, Math.random(), true)}
		>move to somewhere between ( -2, 0, 0 ) -> ( 1, 1, 0 ) and ( 0, 2, 5 ) -> ( -1, 0, 0 )</button
	>
	<br />
	<button class="btn btn-sm" on:click={() => cameraControls.reset(true)}>reset</button>
	<button class="btn btn-sm" on:click={() => cameraControls.saveState()}>saveState</button>
	<br />
	<button class="btn btn-sm" on:click={() => (cameraControls.enabled = false)}>disable mouse/touch controls</button>
	<button class="btn btn-sm" on:click={() => (cameraControls.enabled = true)}>enable mouse/touch controls</button>
	<button on:click={() => console.log(camera?.position)}>print camera</button>
</div>
