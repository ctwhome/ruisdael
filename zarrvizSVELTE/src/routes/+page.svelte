<script lang="ts">

	import TimeLine from '$lib/components/TimeLine.svelte';

	import { allTimeSlices, currentTimeIndex } from '$lib/components/VolumetricRenderer/allSlices.store';

	import Viewer from '$lib/components/VolumetricRenderer/Viewer.svelte';


</script>

<!--  Debugging info -->

<div class="">
	<a class="btn" href="/zarrExample">Zarr playground</a>
	<!-- <pre>Slices downloaded: {@JSON.stringify(allTimeSlices.length, null, 2)}</pre> -->
	<div class="flex gap-5">
		<!-- 1073741824 = 1GB -->
		<pre>dataUint8 (slice) {$allTimeSlices[0]?.length} - {($allTimeSlices[0]?.byteLength / 1073741824).toFixed(
				3
			)} GB |</pre>
		<!-- <pre>dataCellSize: {$dataCellSize.length} |</pre> -->
		<pre>Slices downloaded: {JSON.stringify($allTimeSlices.length, null, 2)} |</pre>
	</div>
	<!-- datashape = dataShape: {JSON.stringify($dataShape, null, 2)} -->
</div>

<Viewer {$currentTimeIndex} />
<TimeLine
	positionIndex={$currentTimeIndex}
	length={$allTimeSlices.length}
	on:onSelectedIndex={(value) => currentTimeIndex.set(value.detail.index)}
/>

{#if $allTimeSlices.length <= 1}
	<div>
		Loading data
		<progress class="progress w-56" />
	</div>
{/if}

<div class="info p-6">
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
