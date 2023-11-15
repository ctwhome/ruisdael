import * as THREE from 'three';

import { scene } from './initScene';

export function addMap(boxWidth: number, boxHeight: number, boxDepth: number) {
	//
	// Adding the plane mesh to the scene to hold the Map texture
	//
	const textureLoader = new THREE.TextureLoader();
	const texture = textureLoader.load('/maps/nl-map.webp');

	// Create a plane geometry and mesh
	const planeGeometry = new THREE.PlaneGeometry(boxWidth * 4, boxHeight * 4);
	const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
	const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

	// Position the plane underneath the box
	planeMesh.position.set(-boxWidth / 1000, -boxHeight / 1000, boxDepth * -3); // Adjust position as needed

	// Rotate the plane to be horizontal
	// planeMesh.rotation.x = -Math.PI / 2;

	// Add the plane mesh to the scene
	scene.add(planeMesh);
}
