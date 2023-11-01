<script>
	import { onMount } from 'svelte';

	export let volumeDataUint8;
	onMount(() => {
		console.log('🎹 vol', volumeDataUint8);
	});

	// $: {
	// 	console.log('🎹 vol', volumeDataUint8);
	// }
</script>
