<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { makeCloudTransferTex } from '$lib/utils/makeCloudTransferTex';
	import Vol3dViewer from '$lib/components/3DVolumetric/Volumetric3DViewer.svelte';
	import TimeLine from '$lib/components/TimeLine.svelte';
	import { fetchAllData } from '$lib/components/LoadZarrData';

	import { dataShape, dataCellSize, allTimeSlices } from '$lib/components/LoadZarrData';
	import { get } from 'svelte/store';

	let zarrUrl = 'http://localhost:5173/data/ql.zarr';
	// let zarrUrl = 'http://localhost:5173/data/unzip/ql.zarr';

	let dataUint8 = null;

	// TODO playback interval
	let interval;
	let currentTimeIndex = 0;

	onMount(() => {
		allTimeSlices.subscribe((val) => {
			console.log('---------allTimeSlices', val);
			console.log('🎹 allTimeSlices.subscribe.length', get(allTimeSlices).length);
		});
		console.log('fetching data...');
		fetchAllData(zarrUrl, 'ql');

		// TODO This invertal emulates the playback of the data, make it a real playback
		interval = setInterval(() => {
			if (allTimeSlices[currentTimeIndex]) {
				dataUint8 = allTimeSlices[currentTimeIndex];
				currentTimeIndex = (currentTimeIndex + 1) % 10;
			}
		}, 500);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="">
	<!-- <pre>Slices downloaded: {@JSON.stringify(allTimeSlices.length, null, 2)}</pre> -->
	<!-- <pre>dataUint8 {JSON.stringify(dataUint8, null, 2)}</pre> -->
	<pre>Slices downloaded: {JSON.stringify($allTimeSlices.length, null, 2)}</pre>

	<!-- <Vol3dViewer /> -->

	{#if dataUint8 && dataUint8.length !== 0 && dataCellSize.length !== 0}
		<div>SHOW ME THE MONEY</div>
		<Vol3dViewer
			volumeDataUint8={dataUint8}
			volumeSize={dataShape}
			voxelSize={dataCellSize}
			transferFunctionTex={makeCloudTransferTex()}
			dtScale={0.1}
			finalGamma={6.0}
		/>
		<TimeLine />
		<!-- <Test volumeDataUint8={dataUint8} /> -->
	{:else}
		LOADING DATA
		<progress class="progress w-56" />
	{/if}
</div>
