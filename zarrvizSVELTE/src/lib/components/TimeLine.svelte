<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let playAnimation = false;
	export let length = 0;
	export let positionIndex = 0;

	const dispatch = createEventDispatcher();
</script>

<div class="flex gap-4 mt-10 items-center px-5">
	<!--  Play icon -->
	<button class="btn" class:btn-primary={playAnimation} on:click={() => dispatch('togglePlay')}>
		{#if !playAnimation}
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z"
				/>
			</svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M16 19q-.825 0-1.413-.588T14 17V7q0-.825.588-1.413T16 5q.825 0 1.413.588T18 7v10q0 .825-.588 1.413T16 19Zm-8 0q-.825 0-1.413-.588T6 17V7q0-.825.588-1.413T8 5q.825 0 1.413.588T10 7v10q0 .825-.588 1.413T8 19Z"
				/>
			</svg>
		{/if}
	</button>
	<div class="w-full">
		<!-- Timeline -->
		<input
			type="range"
			class="transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
			min="1"
			max={length}
			step="1"
			value={positionIndex + 1}
			on:input={(event) => {
				dispatch('onSelectedIndex', { index: parseInt(event.target.value) });
			}}
		/>
		<div class="w-full flex justify-between text-xs px-2">
			<!-- Steps -->
			<!--  array of steps from 0 to length -->
			{#each Array.from({ length }, (_, index) => index) as step}
				<div class="flex flex-col">
					<div>|</div>
					<div class="-ml-1">{step}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
