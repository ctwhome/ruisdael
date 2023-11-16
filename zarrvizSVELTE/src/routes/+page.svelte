<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { openArray, HTTPStore, slice } from 'zarr';
	import { Queue } from 'async-await-queue';
	import { makeCloudTransferTex } from '$lib/utils/makeCloudTransferTex';
	import Vol3dViewer from '$lib/components/3DVolumetric/Volumetric3DViewer.svelte';
	import TimeLine from '$lib/components/TimeLine.svelte';

	let zarrUrl = 'http://localhost:5173/data/ql.zarr';
	let dataUint8 = null;
	let dataShape = [];
	let dataCellSize = [];

	let allTimeSlices = [];
	let currentTimeIndex = 0;

	// const fetchSubset = async (url: string, path: string, timeIndex: number) => {
	//   // ... (same as your existing function)
	// };

	/**
	 * Fetches data from a given URL and path for a specific time index.
	 * @param {string} url - The URL to fetch data from.
	 * @param {string} path - The path to the data to fetch.
	 * @param {number} timeIndex - The time index of the data to fetch.
	 * @returns {Promise<void>} - A Promise that resolves when the data has been fetched.
	 */
	const fetchData = async (url: string, path: string, timeIndex: number) => {
		// If the data has already been fetched, return.
		if (allTimeSlices[timeIndex]) {
			return;
		}

		// Create a new Zarr HTTPStore with the given URL
		const fetchOptions = { redirect: 'follow', mode: 'no-cors', credentials: 'include' };
		const supportedMethods = ['GET', 'HEAD'];
		const store = new HTTPStore(url, { fetchOptions, supportedMethods });

		const zarrdata = await openArray({ store, path, mode: 'r' });
		console.log('downloading time slice', timeIndex, '...');
		const { data, strides, shape } = await zarrdata.getRaw([timeIndex, null, null, null]);
		console.log('...done.');

		allTimeSlices[timeIndex] = data;

		if (timeIndex === 0) {
			const zarrxvals = await openArray({ store, path: 'xt', mode: 'r' });
			const zarryvals = await openArray({ store, path: 'yt', mode: 'r' });
			const zarrzvals = await openArray({ store, path: 'zt', mode: 'r' });
			const xvals = await zarrxvals.getRaw([null]);
			const yvals = await zarryvals.getRaw([null]);
			const zvals = await zarrzvals.getRaw([null]);

			let xvalues = xvals.data;
			let dx = xvalues[1] - xvalues[0];
			let yvalues = yvals.data;
			let dy = yvalues[1] - yvalues[0];
			let zvalues = zvals.data;
			let sumDifferences = 0;

			for (let i = 1; i < zvalues.length; i++) {
				sumDifferences += Math.abs(zvalues[i] - zvalues[i - 1]);
			}
			let dz = sumDifferences / (zvalues.length - 1);
			console.log('I calculated ', dx, dy, dz);
			dataCellSize = [dx, dy, dz];
			dataShape = [shape[1], shape[2], shape[0]];
		}
	};

	/**
	 * Creates a new Queue instance with a concurrency of 1 and a timeout of 5000ms.
	 */
	const fetchAllData = async (url: string, path: string) => {
		console.log('here we go downloading data...');
		/**
		 * Creates a new Queue instance with a concurrency of 1 and a timeout of 5000ms.
		 */
		const q = new Queue(1, 5000);

		for (let i = 0; i < 10; ++i) {
			const me = Symbol();
			await q.wait(me, 10 - i);
			try {
				console.log('📕 fetching data', i);
				fetchData(url, path, i);
			} catch (e) {
				console.error(e);
			} finally {
				q.end(me);
			}
		}
		return await q.flush();
	};

	let interval;

	onMount(() => {
		console.log('fetching data...');
		fetchAllData(zarrUrl, 'ql');

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
	<pre>Slices downloaded: {JSON.stringify(allTimeSlices.length, null, 2)}</pre>

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
