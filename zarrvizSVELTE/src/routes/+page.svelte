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
		fetchAllData(zarrUrl, 'ql');

		// // Everytie a new value comes in, update the dataUint8
		allTimeSlices.subscribe((val) => {
			// console.log('---------allTimeSlices', val);
			console.log('🎹---------- allTimeSlices.subscribe.length', get(allTimeSlices).length);
			// dataUint8[currentTimeIndex] = get(allTimeSlices)[currentTimeIndex];
			dataUint8 = get(allTimeSlices)[currentTimeIndex]; // TODO this is not working, how dows the dataUint8 get updated?
			console.log('🎹 dataUint8?.length', dataUint8?.length);
		});
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<!--  Debugging info -->

<pre>{JSON.stringify(get(allTimeSlices)[currentTimeIndex], null, 2)}</pre>

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
	{#if !!get(allTimeSlices)[currentTimeIndex] && $dataCellSize.length !== 0}
		<!-- <Test volumeDataUint8={dataUint8} /> -->
		<Vol3dViewer
			volumeDataUint8={get(allTimeSlices)[currentTimeIndex]}
			volumeSize={$dataShape}
			voxelSize={$dataCellSize}
			transferFunctionTex={makeCloudTransferTex()}
			dtScale={0.1}
			finalGamma={6.0}
		/>

		<TimeLine
			positionIndex={currentTimeIndex}
			length={$allTimeSlices.length}
			{playAnimation}
			on:onSelectedIndex={(value) => (currentTimeIndex = value.detail.index)}
			on:togglePlay={play}
		/>
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
	{:else}
		<div>
			LOADING DATA
			<progress class="progress w-56" />
		</div>
	{/if}
</div>
