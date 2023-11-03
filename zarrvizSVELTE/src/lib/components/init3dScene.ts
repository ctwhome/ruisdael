import { writable } from 'svelte/store';
import * as THREE from 'three';

export let scene = writable(null);

export function init3DScene(canvas) {
	scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 400, 0.1, 1000);
	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const cube = new THREE.Mesh(geometry, material);

	scene.add(cube);
	camera.position.z = 4;

	const animate = () => {
		requestAnimationFrame(animate);
		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;
		renderer.render(scene, camera);
	};

	const resize = () => {
		renderer.setSize(window.innerWidth, 400);
		camera.aspect = window.innerWidth / 400;
		camera.updateProjectionMatrix();
	};

	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
	resize();
	animate();

	window.addEventListener('resize', resize);
}
