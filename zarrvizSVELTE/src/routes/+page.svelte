<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';

	import { makeCloudTransferTex } from '$lib/utils/makeCloudTransferTex';
	import Vol3dViewer from '$lib/components/3DVolumetric/Volumetric3DViewer.svelte';
	import TimeLine from '$lib/components/TimeLine.svelte';
	import { fetchAllData } from '$lib/components/3DVolumetric/LoadZarrData';

	import { dataShape, dataCellSize } from '$lib/components/3DVolumetric/LoadZarrData';
	import { allTimeSlices } from '$lib/components/VolumetricRenderer/allSlices.store';

	import Viewer from '$lib/components/VolumetricRenderer/Viewer.svelte';

	let zarrUrl = 'http://localhost:5173/data/ql.zarr';
	// let zarrUrl = 'http://localhost:5173/data/unzip/ql.zarr';

	let dataUint8 = null;
	let playAnimation = false;
	let playSpeedInMiliseconds = 500;

	// TODO playback interval
	let interval;
	let currentTimeIndex = 0;

	function play() {
		playAnimation = !playAnimation;
		// TODO This invertal emulates the playback of the data, make it a real playback

		if (playAnimation) {
			interval = setInterval(() => {
				// console.log('currentTimeIndex', currentTimeIndex);

				if (get(allTimeSlices)[currentTimeIndex]) {
					dataUint8 = get(allTimeSlices)[currentTimeIndex];
					currentTimeIndex = (currentTimeIndex + 1) % get(allTimeSlices).length;
				}
			}, playSpeedInMiliseconds);
		} else {
			clearInterval(interval);
		}
	}

	onMount(() => {
		console.log('fetching data...');
		// fetchAllData(zarrUrl, 'ql');

		// // Everytie a new value comes in, update the dataUint8
		// allTimeSlices.subscribe((val) => {
		// 	// console.log('---------allTimeSlices', val);
		// 	console.log('🎹---------- allTimeSlices.subscribe.length', get(allTimeSlices).length);
		// 	// dataUint8[currentTimeIndex] = get(allTimeSlices)[currentTimeIndex];
		// 	dataUint8 = get(allTimeSlices)[currentTimeIndex]; // TODO this is not working, how dows the dataUint8 get updated?
		// 	console.log('🎹 dataUint8?.length', dataUint8?.length);
		// });
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<!--  Debugging info -->

<div class="">
	<a class="btn" href="/zarrExample">Zarr playground</a>
	<!-- <pre>Slices downloaded: {@JSON.stringify(allTimeSlices.length, null, 2)}</pre> -->
	<div class="flex gap-5">
		<!-- 1073741824 = 1GB -->
		<pre>dataUint8 (slice) {dataUint8?.length} - {(dataUint8?.byteLength / 1073741824).toFixed(3)} GB |</pre>
		<pre>dataCellSize: {$dataCellSize.length} |</pre>
		<pre>Slices downloaded: {JSON.stringify($allTimeSlices.length, null, 2)} |</pre>
	</div>
	datashape = dataShape: {JSON.stringify($dataShape, null, 2)}
	<!-- <Vol3dViewer /> -->
</div>

<Viewer {currentTimeIndex} />
<TimeLine
	positionIndex={currentTimeIndex}
	length={$allTimeSlices.length}
	{playAnimation}
	on:onSelectedIndex={(value) => (currentTimeIndex = value.detail.index)}
	on:togglePlay={play}
/>

<div class="flex gap-4 mt-5">
	Play Speed in miliseconds:

	<input
		type="number"
		value={playSpeedInMiliseconds}
		step="500"
		min="500"
		class="w-20"
		on:input={(event) => (playSpeedInMiliseconds = parseInt(event?.target?.value))}
	/>
	currentTimeIndex: {currentTimeIndex}
</div>

{#if $allTimeSlices.length <= 1}
	<div>
		Loading data
		<progress class="progress w-56" />
	</div>
{/if}

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
</div>

<button on:click={() => console.log(camera?.position)}>print camera</button>
