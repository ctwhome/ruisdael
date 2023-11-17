import { writable, get } from 'svelte/store';
import { openArray, HTTPStore, slice } from 'zarr';
import { Queue } from 'async-await-queue';

export let dataShape = [];
export const dataCellSize = writable([]);
export const allTimeSlices = writable([]);

/**
 * Fetches data from a given URL and path for a specific time index.
 * @param {string} url - The URL to fetch data from.
 * @param {string} path - The path to the data to fetch.
 * @param {number} timeIndex - The time index of the data to fetch.
 * @returns {Promise<void>} - A Promise that resolves when the data has been fetched.
 */
export async function fetchData(url: string, path: string, timeIndex: number) {
	// If the data has already been fetched, return.

	// check if allTimeSlices[timeIndex] is already in the store
	// important during the loop
	if (get(allTimeSlices)[timeIndex]) {
		console.log('🔥 RETURN');
		return;
	}

	// if (allTimeSlices[timeIndex]) {
	// 	return;
	// }

	// read allTimeSlices[timeIndex] form the store

	// Create a new Zarr HTTPStore with the given URL
	const fetchOptions = { redirect: 'follow', mode: 'no-cors', credentials: 'include' };
	const supportedMethods = ['GET', 'HEAD'];
	const store = new HTTPStore(url, { fetchOptions, supportedMethods });

	const zarrdata = await openArray({ store, path, mode: 'r' });
	console.log('downloading time slice', timeIndex, '...');
	const { data, strides, shape } = await zarrdata.getRaw([timeIndex, null, null, null]);
	console.log('...done.');

	// Update the time slices store
	allTimeSlices.update((timeSlices) => {
		timeSlices[timeIndex] = data;
		return timeSlices;
	});
	console.log('🎹 allTimeSlices', get(allTimeSlices)[timeIndex]);

	// If this is the first time slice, calculate the cell size and shape
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
		dataCellSize.update(() => [dx, dy, dz]);
		dataShape = [shape[1], shape[2], shape[0]];
	}
}

/**
 * Creates a new Queue instance with a concurrency of 1 and a timeout of 5000ms.
 */
export async function fetchAllData(url: string, path: string) {
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
}
