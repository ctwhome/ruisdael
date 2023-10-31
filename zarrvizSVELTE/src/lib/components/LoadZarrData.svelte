<script lang="ts">
	import { openArray, HTTPStore, slice } from 'zarr';
	import { Queue } from 'async-await-queue';
	import { makeCloudTransferTex } from '../utils/makeCloudTransferTex';
	import Vol3dViewer from './Vol3dViewer.svelte';

	let zarrUrl = 'http://localhost:3000/data/ql.zarr';
	let dataUint8;
	let dataShape = [];
	let dataCellSize = [];
	let allTimeSlices = [];
	let currentTimeIndex = 0;

	const fetchData = async (url: string, path: string, timeIndex: number) => {
		if (allTimeSlices[timeIndex]) return;

		const fetchOptions = { redirect: 'follow', mode: 'no-cors', credentials: 'include' };
		const store = new HTTPStore(url, { fetchOptions });
		const zarrdata = await openArray({ store, path, mode: 'r' });
		const { data, shape: currentShape } = await zarrdata.getRaw([timeIndex, null, null, null]);

		allTimeSlices[timeIndex] = data;

		if (timeIndex === 0) {
			const [xvals, yvals, zvals] = await Promise.all(
				['xt', 'yt', 'zt'].map((p) =>
					openArray({ store, path: p, mode: 'r' }).then((arr) => arr.getRaw([null]))
				)
			);
			const dx = xvals.data[1] - xvals.data[0];
			const dy = yvals.data[1] - yvals.data[0];
			const dz =
				zvals.data.slice(1).reduce((acc, val, i) => acc + Math.abs(val - zvals.data[i]), 0) /
				(zvals.data.length - 1);

			dataCellSize = [dx, dy, dz];
			dataShape = [currentShape[1], currentShape[2], currentShape[0]];
		}
	};

	const fetchAllData = async (url, path) => {
		const q = new Queue(1, 5000);
		const tasks = Array(10)
			.fill(null)
			.map(async (_, i) => {
				await q.wait(Symbol(), 10 - i);
				return fetchData(url, path, i).finally(() => q.end(Symbol()));
			});

		return Promise.all(tasks);
	};

	fetchAllData(zarrUrl, 'ql');

	let interval = setInterval(() => {
		if (allTimeSlices[currentTimeIndex]) {
			dataUint8 = allTimeSlices[currentTimeIndex];
			currentTimeIndex = (currentTimeIndex + 1) % 10;
		}
	}, 500);

	onDestroy(() => clearInterval(interval));
</script>

<div class="flex">
	<pre> Slices downloaded: {allTimeSlices.length} </pre>
	{#if dataUint8 && dataUint8.length !== 0 && dataCellSize.length !== 0}
		<Vol3dViewer
			volumeDataUint8={dataUint8}
			volumeSize={dataShape}
			voxelSize={dataCellSize}
			transferFunctionTex={makeCloudTransferTex()}
			dtScale={0.1}
			finalGamma={6.0}
		/>
	{:else}
		LOADING DATA...
	{/if}
</div>
