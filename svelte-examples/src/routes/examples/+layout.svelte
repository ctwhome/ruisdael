<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="w-11/12 flex flex-col items-center mx-auto">
  <h1 class="mb-4">{$page.data.title}</h1>
  <slot />
  <p><a href="/">Back to Examples</a></p>
  <p><a target="_blank" href="https://github.com/ctwhome/ruisdael">Github</a></p>
</div>
