import * as THREE from 'three';
// Shader imports
import vertexShaderVolume from '$lib/shaders/volume.vert';
import fragmentShaderVolume from '$lib/shaders/volume.frag';

export function addMaterial(volumeDataUint8, boxSize, volumeSize, voxelSize, cameraNear, cameraFar) {
	const volumeTexture = new THREE.Data3DTexture(volumeDataUint8, volumeSize[0], volumeSize[1], volumeSize[2]);
	volumeTexture.format = THREE.RedFormat;
	volumeTexture.type = THREE.UnsignedByteType;
	// Disabling mimpaps saves memory.
	volumeTexture.generateMipmaps = false;
	// Linear filtering disables LODs, which do not help with volume rendering.
	volumeTexture.minFilter = THREE.LinearFilter;
	volumeTexture.magFilter = THREE.LinearFilter;
	volumeTexture.needsUpdate = true;

	// const lightColor = sunLight.color;
	// const lightColorV = new THREE.Vector3(lightColor.r, lightColor.g, lightColor.b);
	// const ambientLightColorV = new THREE.Vector3(
	// 	hemisphereLight.color.r,
	// 	hemisphereLight.color.g,
	// 	hemisphereLight.color.b
	// );
	//      const ambientLightColorV = new THREE.Vector3(0.3, 0.7, 0.98);

	const boxMaterial = new THREE.ShaderMaterial({
		vertexShader: vertexShaderVolume,
		fragmentShader: fragmentShaderVolume,
		side: THREE.BackSide,
		transparent: true,
		opacity: 1.0,
		uniforms: {
			boxSize: new THREE.Uniform(boxSize),
			volumeTex: new THREE.Uniform(volumeTexture),
			voxelSize: new THREE.Uniform(voxelSize),
			// sunLightDir: new THREE.Uniform(sunLight.position),
			// sunLightColor: new THREE.Uniform(lightColorV),
			// ambientLightColor: new THREE.Uniform(ambientLightColorV),
			near: new THREE.Uniform(cameraNear),
			far: new THREE.Uniform(cameraFar),
			// The following are set separately, since they are based on `props` values that can
			// change often, and should not trigger complete re-initialization.
			transferTex: new THREE.Uniform(null),
			dtScale: new THREE.Uniform(0),
			inScatFactor: new THREE.Uniform(0),
			qLScale: new THREE.Uniform(0),
			gHG: new THREE.Uniform(0),
			dataEpsilon: new THREE.Uniform(0),
			bottomColor: new THREE.Uniform(new THREE.Vector3(0.0, 0.0005, 0.0033)),
			finalGamma: new THREE.Uniform(0)
		}
	});

	// setTimeout(() => {
	// console.log('🎹 box', box.material);
	// console.log('🎹 box', boxMaterial);
	return boxMaterial;
	// }, 3000);
	/* eslint no-param-reassign: ["error", { "props": false }] */
	// box.material = boxMaterial;
}
