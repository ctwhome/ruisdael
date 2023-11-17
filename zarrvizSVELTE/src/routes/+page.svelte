<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';

	import { makeCloudTransferTex } from '$lib/utils/makeCloudTransferTex';
	import Vol3dViewer from '$lib/components/3DVolumetric/Volumetric3DViewer.svelte';
	import TimeLine from '$lib/components/TimeLine.svelte';
	import { fetchAllData } from '$lib/components/LoadZarrData';

	import { dataShape, dataCellSize, allTimeSlices } from '$lib/components/LoadZarrData';

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
				console.log('currentTimeIndex', currentTimeIndex);

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
		fetchAllData(zarrUrl, 'ql');

		allTimeSlices.subscribe((val) => {
			console.log('---------allTimeSlices', val);
			console.log('🎹---------- allTimeSlices.subscribe.length', get(allTimeSlices).length);
			// dataUint8 = get(allTimeSlices)[currentTimeIndex];
		});
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="">
	<!-- <pre>Slices downloaded: {@JSON.stringify(allTimeSlices.length, null, 2)}</pre> -->
	<pre>dataUint8 {dataUint8?.length}</pre>
	<pre>dataCellSize {$dataCellSize.length}</pre>
	<pre>Slices downloaded: {JSON.stringify($allTimeSlices.length, null, 2)}</pre>
	currentTimeIndex: {currentTimeIndex}
	<!-- <Vol3dViewer /> -->
	{#if dataUint8?.length !== 0 && $dataCellSize.length !== 0}
		<!-- <Test volumeDataUint8={dataUint8} /> -->
		<Vol3dViewer
			volumeDataUint8={dataUint8}
			volumeSize={dataShape}
			voxelSize={$dataCellSize}
			transferFunctionTex={makeCloudTransferTex()}
			dtScale={0.1}
			finalGamma={6.0}
		/>
	{:else}
		LOADING DATA
		<progress class="progress w-56" />
	{/if}
</div>

<TimeLine positionIndex={currentTimeIndex} length={$allTimeSlices.length} {playAnimation} on:togglePlay={play} />
Play Speed in miliseconds:

<input
	type="number"
	value={playSpeedInMiliseconds}
	step="500"
	min="500"
	on:input={(event) => (playSpeedInMiliseconds = parseInt(event?.target?.value))}
/>
