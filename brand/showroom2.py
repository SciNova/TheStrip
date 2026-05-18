<!DOCTYPE html>
<html>
<head>
	<title>S1 Box Showroom</title>
	<style>
		body { margin: 0; background-color: #333; overflow: hidden; }
		canvas { display: block; }
	</style>
</head>
<body>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
	<script>
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x111111); 
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		const controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		const loader = new THREE.TextureLoader();
		const topTex = loader.load('S1.jpg');
		
		const createSideMaterial = (offset) => {
			const tex = loader.load('side.jpg');
			tex.repeat.set(0.25, 1);
			tex.offset.set(offset, 0);
			return new THREE.MeshStandardMaterial({ map: tex });
		};

		const materials = [
			createSideMaterial(0.0),  
			createSideMaterial(0.75), 
			new THREE.MeshStandardMaterial({ map: topTex }), 
			new THREE.MeshStandardMaterial({ color: 0x000000 }), 
			createSideMaterial(0.25), 
			createSideMaterial(0.5)   
		];

		const geometry = new THREE.BoxGeometry(20, 2.8, 20);
		const box = new THREE.Mesh(geometry, materials);
		scene.add(box);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const pointLight = new THREE.PointLight(0xffffff, 1.2);
		pointLight.position.set(20, 30, 20);
		scene.add(pointLight);

		camera.position.set(25, 20, 25);
		controls.update();

		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}

		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		animate();
	</script>
</body>
</html>
