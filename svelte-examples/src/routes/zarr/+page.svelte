<script>
  import * as THREE from "three";
  import { openArray, HTTPStore } from "zarr";
  import { Queue } from "async-await-queue";
  import { onMount } from "svelte";

  // State variables
  let zarrUrl = "/data/ql.zarr";
  let dataUint8 = null;
  let dataShape = [];
  let dataCellSize = [];
  let allTimeSlices = new Array(10);
  let currentTimeIndex = 0;
  let finalGamma = 1.0; // Assume defaultProp values as 1.0, replace with actual default values
  let ambientFactor = 1.0;
  let solarFactor = 1.0;
  let rayMarchStepSize = 1.0;
  let noiseFreq1 = 1.0;
  let noiseFreq2 = 1.0;
  let noiseScale1 = 1.0;
  let noiseScale2 = 1.0;

  // Effects
  onMount(() => {
    fetchAllData(zarrUrl, "ql");
    // Perform a cyclic operation that repeats every 10 iterations.
    const interval = setInterval(() => {
      if (allTimeSlices[currentTimeIndex]) {
        dataUint8 = allTimeSlices[currentTimeIndex];
        currentTimeIndex = (currentTimeIndex + 1) % 10;
      }
    }, 10000);
    return () => clearInterval(interval); // Cleanup
  });

  const fetchAllData = async (url, variable) => {
    console.log("here we go downloading data...");
    const q = new Queue(1, 10);
    for (let i = 0; i < 10; ++i) {
      const me = Symbol();
      await q.wait(me, 10 - i);
      try {
        fetchData(url, variable, i);
      } catch (e) {
        console.error(e);
      } finally {
        q.end(me);
      }
    }
    return await q.flush();
  };

  const fetchData = async (url, path, timeIndex) => {
    if (allTimeSlices.current[timeIndex]) {
      return;
    }
    const fetchOptions = { redirect: "follow", mode: "no-cors", credentials: "include" };
    const supportedMethods = ["GET", "HEAD"];
    const store = new HTTPStore(url, { fetchOptions, supportedMethods });
    const zarrdata = await openArray({ store, path, mode: "r" });

    console.log("downloading time slice", timeIndex, "...");
    const { data, strides, shape } = await zarrdata.getRaw([timeIndex, null, null, null]);
    console.log("...done.");

    allTimeSlices.current[timeIndex] = data;
    if (timeIndex === 0) {
      const zarrxvals = await openArray({ store, path: "xt", mode: "r" });
      const zarryvals = await openArray({ store, path: "yt", mode: "r" });
      const zarrzvals = await openArray({ store, path: "zt", mode: "r" });
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
      console.log("I calculated ", dx, dy, dz);
      dataCellSize.current = [dx, dy, dz];
      dataShape.current = [shape[1], shape[2], shape[0]];
    }
  };
  // Event handlers
  function onSliderChange(event, stateSetter) {
    stateSetter(event.target.value);
  }

  function makeCloudTransferTex() {
    // ... (Same as your original makeCloudTransferTex function)
  }
</script>

<div class="BasicUI">
  <div class="Middle" tabindex="0" role="link">
    {#if dataUint8 && dataUint8.length !== 0 && dataCellSize.length !== 0}
      <!-- Assuming Vol3dViewer is a Svelte component -->
      <!-- <Vol3dViewer
        volumeDataUint8={dataUint8}
        volumeSize={dataShape}
        voxelSize={dataCellSize}
        transferFunctionTex={makeCloudTransferTex()}
        dtScale={rayMarchStepSize}
        {finalGamma}
        {noiseFreq1}
        {noiseScale1}
        {noiseFreq2}
        {noiseScale2}
        {ambientFactor}
        {solarFactor}
        on:webGLRender={() => {
          /* handle WebGLRender event */
        }}
      /> -->
    {/if}
  </div>
  <div class="Controls">
    <div>
      Step size&nbsp;
      <input type="range" min="0.01" max="1.0" step="0.01" bind:value={rayMarchStepSize} />
      {rayMarchStepSize}
    </div>
    <!-- ... other sliders and controls -->
  </div>
</div>

<style>
  /* Include your CSS from CloudViewerUI.css */
</style>
