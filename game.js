var canvas = document.getElementById('canvas');
var fpsIndicator = document.getElementById("fpsIndicator");
var engine = new BABYLON.Engine(canvas, true);

var ambientation = 0;
var difficulty = 0;
var changescene = 0;
var boolgamestart = false;
var boolgameend = false;

var boolkeyboard = true;

var playingGUIadvancedTexture;


//loading screen
var loadingScreenDiv = window.document.getElementById("loadingScreen");
loadingScreenDiv.style.visibility = "hidden";

function customLoadingScreen() {
}
customLoadingScreen.prototype.displayLoadingUI = function () {
    loadingScreenDiv.style.display = "inline";
};
customLoadingScreen.prototype.hideLoadingUI = function () {
    loadingScreenDiv.style.display = "none";
};
var loadingScreen = new customLoadingScreen();
engine.loadingScreen = loadingScreen;


//**********************MENU SCENE**********************************
var createScenemenu = function () {
    var scenemenu = new BABYLON.Scene(engine);

	var cameraMenu = new BABYLON.UniversalCamera("CamMenu", new BABYLON.Vector3(0, 0, 1), scenemenu);
		cameraMenu.attachControl(canvas, true);
			  
	createGUI(scenemenu, 0);
	var backgroundmusic = new BABYLON.Sound("backgroundmusic", "music/victory.wav", scenemenu, null, {volume: 0.1, loop:true, autoplay:true});


    return scenemenu;
}
//******************************************************************

//**********************SCENE**************************************
var createScene = function(){

	var scene = new BABYLON.Scene(engine);

	boolgameend = false;

	var backgroundmusicgame = new BABYLON.Sound("backgroundmusicgame", "music/virtualworld.wav", scene, null, {volume: 0.07, loop:true, autoplay:true});

	//Optimization
	var optimizerOptions = new BABYLON.SceneOptimizerOptions(60, 500);
		optimizerOptions.addOptimization(new BABYLON.ShadowsOptimization(0));
		optimizerOptions.addOptimization(new BABYLON.LensFlaresOptimization(0));
		optimizerOptions.addOptimization(new BABYLON.PostProcessesOptimization(1));
		optimizerOptions.addOptimization(new BABYLON.ParticlesOptimization(1));
		optimizerOptions.addOptimization(new BABYLON.TextureOptimization(2, 512));
		optimizerOptions.addOptimization(new BABYLON.RenderTargetsOptimization(3));

	var sceneOptimizer = new BABYLON.SceneOptimizer(scene, optimizerOptions, true, true);

		sceneOptimizer.start();

	//Enable physic for the main scene
	var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
	var physicsPlugin = new BABYLON.CannonJSPlugin();
	scene.enablePhysics(gravityVector, physicsPlugin);

	scene.collisionsEnabled = true;
	scene.clearColor = new BABYLON.Color3(0.5, 0.8, 0.5);
	scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

	//Define the skyboxes
	var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.disableLighting = true;
		if(ambientation == 0){
			skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/cityBox/skybox2", scene);
		}
		if(ambientation == 1){
			skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/lightBlueSkyBox/lightBlueSky", scene);
		}
		skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skybox.material = skyboxMaterial;

	//Defininng the scene camera
	var camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 34, new BABYLON.Vector3(0, 0, 60), scene);
		scene.activeCamera = camera;
		scene.activeCamera.attachControl(canvas, true);
		camera.lowerRadiusLimit = 15;
		camera.upperRadiusLimit = 60;
		camera.wheelDeltaPercentage = 0.003;
		camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
		camera.checkCollisions = true;
		camera.lowerBetaLimit = Math.PI / 8;	//up
		camera.upperBetaLimit = Math.PI / 2.15;	//down

	//Defining the scene lights
	var directionalLight =  new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -10, 0), scene);
		directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
		directionalLight.specular = new BABYLON.Color3(1, 1, 1);
		directionalLight.intensity = 0.8;
		directionalLight.excludedMeshes.push(skybox);
	var hemisphericLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 0, 1), scene);

	//Luminescent light layer
	var glowlayer = new BABYLON.GlowLayer("glow", scene);
		glowlayer.intensity = 0.4;

	//Difining the grounds
	var ground = BABYLON.MeshBuilder.CreateGround("myGround", {width: 1000, height: 1000, subdivisions: 4}, scene);
	var groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
		if(ambientation == 0){
			groundMaterial.diffuseColor = new BABYLON.Color3(0.16, 0.30, 0.33);
			groundMaterial.specularColor = new BABYLON.Color3(0.16, 0.30, 0.33);
			hemisphericLight.excludedMeshes.push(ground);
		}
		if(ambientation == 1){
			groundMaterial.diffuseTexture = new BABYLON.Texture("textures/moon.jpg", scene);
			groundMaterial.specularTexture = new BABYLON.Texture("textures/moon.jpg", scene);
		}
		ground.material = groundMaterial;
	ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
	ground.checkCollisions = true;


	//*****************************AMBIENTATION MESHES IMPORT*********************************
	var perimeter_walls = [];
	const cubicWalls = BABYLON.Mesh.CreateBox("cubicWalls", 2, scene);
		hemisphericLight.excludedMeshes.push(cubicWalls);
		directionalLight.excludedMeshes.push(cubicWalls);
		cubicWalls.setEnabled(false);

	//*******************Moon**********************
	if(ambientation == 1){
		BABYLON.SceneLoader.ImportMesh("", "meshes/ScifiFloatingCity/", "ScifiFloatingCity.babylon", scene, function (meshes, particleSystems, skeletons, animationGroups){

			hemisphericLight.excludedMeshes.push(meshes[1]);
			directionalLight.excludedMeshes.push(meshes[1]);
			meshes[1].freezeWorldMatrix();
			meshes[1].convertToUnIndexedMesh();
			meshes[1].setEnabled(false);

			meshes[0].translate(BABYLON.Axis.Y, -12, BABYLON.Space.WORLD);

			meshes[2].translate(BABYLON.Axis.X, -20, BABYLON.Space.WORLD);
			meshes[2].translate(BABYLON.Axis.Y, -19.5, BABYLON.Space.WORLD);
			meshes[2].translate(BABYLON.Axis.Z, -150, BABYLON.Space.WORLD);
			meshes[2].scaling = new BABYLON.Vector3(0.5, 0.5, 1.5);

			var doubleBuildings = meshes[0].clone();
				doubleBuildings.rotation.y = Math.PI/2;
			var tripleBuildings = meshes[0].clone();
				tripleBuildings.scaling.scaleInPlace(2.2);
				tripleBuildings.rotation.y = Math.PI/4;
				tripleBuildings.translate(BABYLON.Axis.Y, -23, BABYLON.Space.WORLD);
			var quadrupleBuildings = meshes[0].clone();
				quadrupleBuildings.scaling.scaleInPlace(2.2);
				quadrupleBuildings.rotation.y = -Math.PI/4;
				quadrupleBuildings.translate(BABYLON.Axis.Y, -23, BABYLON.Space.WORLD);

			 var mergeMesh = BABYLON.Mesh.MergeMeshes([meshes[0], meshes[2], doubleBuildings, tripleBuildings, quadrupleBuildings], true, true);
				mergeMesh.freezeWorldMatrix();
				mergeMesh.convertToUnIndexedMesh();

			var newCubicWall__2 = cubicWalls.clone();
				newCubicWall__2.position = new BABYLON.Vector3(94, 80, 66);
				newCubicWall__2.scaling = new BABYLON.Vector3(27, 80, 23);
				newCubicWall__2.rotation = new BABYLON.Vector3(0, Math.PI/2.1, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall__2);
				directionalLight.excludedMeshes.push(newCubicWall__2);
				newCubicWall__2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall__2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall__2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall__2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall__2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall__2.freezeWorldMatrix();
				newCubicWall__2.convertToUnIndexedMesh();
				newCubicWall__2.setEnabled(true);
				newCubicWall__2.visibility = 0;
				newCubicWall__2.checkCollisions = true;
			perimeter_walls.push(newCubicWall__2);

			var newCubicWall__1 = cubicWalls.clone();
				newCubicWall__1.position = new BABYLON.Vector3(102, 80, 24.5);
				newCubicWall__1.scaling = new BABYLON.Vector3(30, 80, 4);
				newCubicWall__1.rotation = new BABYLON.Vector3(0, Math.PI/10, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall__1);
				directionalLight.excludedMeshes.push(newCubicWall__1);
				newCubicWall__1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall__1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall__1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall__1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall__1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall__1.freezeWorldMatrix();
				newCubicWall__1.convertToUnIndexedMesh();
				newCubicWall__1.setEnabled(true);
				newCubicWall__1.visibility = 0;
				newCubicWall__1.checkCollisions = true;
			perimeter_walls.push(newCubicWall__1);

			var newCubicWall_1 = cubicWalls.clone();
				newCubicWall_1.position = new BABYLON.Vector3(130, 80, -10);
				newCubicWall_1.scaling = new BABYLON.Vector3(25, 80, 4);
				newCubicWall_1.rotation = new BABYLON.Vector3(0, Math.PI/1.8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_1);
				directionalLight.excludedMeshes.push(newCubicWall_1);
				newCubicWall_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_1.freezeWorldMatrix();
				newCubicWall_1.convertToUnIndexedMesh();
				newCubicWall_1.setEnabled(true);
				newCubicWall_1.visibility = 0;
				newCubicWall_1.checkCollisions = true;
			perimeter_walls.push(newCubicWall_1);

			var newCubicWall_2 = cubicWalls.clone();
				newCubicWall_2.position = new BABYLON.Vector3(103.5, 80, -38);
				newCubicWall_2.scaling = new BABYLON.Vector3(16, 80, 12);
				newCubicWall_2.rotation = new BABYLON.Vector3(0, Math.PI*1.1, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_2);
				directionalLight.excludedMeshes.push(newCubicWall_2);
				newCubicWall_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_2.freezeWorldMatrix();
				newCubicWall_2.convertToUnIndexedMesh();
				newCubicWall_2.setEnabled(true);
				newCubicWall_2.visibility = 0;
				newCubicWall_2.checkCollisions = true;
			perimeter_walls.push(newCubicWall_2);

			var newCubicWall_3 = cubicWalls.clone();
				newCubicWall_3.position = new BABYLON.Vector3(75, 80, -70);
				newCubicWall_3.scaling = new BABYLON.Vector3(42, 80, 4);
				newCubicWall_3.rotation = new BABYLON.Vector3(0, Math.PI/1.1, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_3);
				directionalLight.excludedMeshes.push(newCubicWall_3);
				newCubicWall_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_3.freezeWorldMatrix();
				newCubicWall_3.convertToUnIndexedMesh();
				newCubicWall_3.setEnabled(true);
				newCubicWall_3.visibility = 0;
				newCubicWall_3.checkCollisions = true;
			perimeter_walls.push(newCubicWall_3);

			var newCubicWall_4 = cubicWalls.clone();
				newCubicWall_4.position = new BABYLON.Vector3(24, 80, -113);
				newCubicWall_4.scaling = new BABYLON.Vector3(30, 80, 4);
				newCubicWall_4.rotation = new BABYLON.Vector3(0, -Math.PI/2.5, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_4);
				directionalLight.excludedMeshes.push(newCubicWall_4);
				newCubicWall_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_4.freezeWorldMatrix();
				newCubicWall_4.convertToUnIndexedMesh();
				newCubicWall_4.setEnabled(true);
				newCubicWall_4.visibility = 0;
				newCubicWall_4.checkCollisions = true;
			perimeter_walls.push(newCubicWall_4);

			var newCubicWall_5 = cubicWalls.clone();
				newCubicWall_5.position = new BABYLON.Vector3(-11, 80, -137.5);
				newCubicWall_5.scaling = new BABYLON.Vector3(22, 80, 4);
				newCubicWall_5.rotation = new BABYLON.Vector3(0, Math.PI*1.1, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_5);
				directionalLight.excludedMeshes.push(newCubicWall_5);
				newCubicWall_5.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_5, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_5.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_5.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_5.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_5.freezeWorldMatrix();
				newCubicWall_5.convertToUnIndexedMesh();
				newCubicWall_5.setEnabled(true);
				newCubicWall_5.visibility = 0;
				newCubicWall_5.checkCollisions = true;
			perimeter_walls.push(newCubicWall_5);

			var newCubicWall_6 = cubicWalls.clone();
				newCubicWall_6.position = new BABYLON.Vector3(-38.5, 80, -107);
				newCubicWall_6.scaling = new BABYLON.Vector3(19.5, 80, 13);
				newCubicWall_6.rotation = new BABYLON.Vector3(0, -Math.PI/2.5, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_6);
				directionalLight.excludedMeshes.push(newCubicWall_6);
				newCubicWall_6.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_6, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_6.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_6.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_6.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_6.freezeWorldMatrix();
				newCubicWall_6.convertToUnIndexedMesh();
				newCubicWall_6.setEnabled(true);
				newCubicWall_6.visibility = 0;
				newCubicWall_6.checkCollisions = true;
			perimeter_walls.push(newCubicWall_6);

			var newCubicWall_7 = cubicWalls.clone();
				newCubicWall_7.position = new BABYLON.Vector3(-80.5, 80, -72);
				newCubicWall_7.scaling = new BABYLON.Vector3(38, 80, 4);
				newCubicWall_7.rotation = new BABYLON.Vector3(0, -Math.PI/1.15, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_7);
				directionalLight.excludedMeshes.push(newCubicWall_7);
				newCubicWall_7.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_7, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_7.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_7.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_7.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_7.freezeWorldMatrix();
				newCubicWall_7.convertToUnIndexedMesh();
				newCubicWall_7.setEnabled(true);
				newCubicWall_7.visibility = 0;
				newCubicWall_7.checkCollisions = true;
			perimeter_walls.push(newCubicWall_7);

			var newCubicWall_8 = cubicWalls.clone();
				newCubicWall_8.position = new BABYLON.Vector3(-128, 80, -28);
				newCubicWall_8.scaling = new BABYLON.Vector3(28.8, 80, 4);
				newCubicWall_8.rotation = new BABYLON.Vector3(0, Math.PI/2.6, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_8);
				directionalLight.excludedMeshes.push(newCubicWall_8);
				newCubicWall_8.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_8, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_8.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_8.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_8.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_8.freezeWorldMatrix();
				newCubicWall_8.convertToUnIndexedMesh();
				newCubicWall_8.setEnabled(true);
				newCubicWall_8.visibility = 0;
				newCubicWall_8.checkCollisions = true;
			perimeter_walls.push(newCubicWall_8);

			var newCubicWall_9 = cubicWalls.clone();
				newCubicWall_9.position = new BABYLON.Vector3(-142, 80, 10);
				newCubicWall_9.scaling = new BABYLON.Vector3(11.5, 80, 20);
				newCubicWall_9.rotation = new BABYLON.Vector3(0, Math.PI/2.6, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_9);
				directionalLight.excludedMeshes.push(newCubicWall_9);
				newCubicWall_9.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_9, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_9.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_9.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_9.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_9.freezeWorldMatrix();
				newCubicWall_9.convertToUnIndexedMesh();
				newCubicWall_9.setEnabled(true);
				newCubicWall_9.visibility = 0;
				newCubicWall_9.checkCollisions = true;
			perimeter_walls.push(newCubicWall_9);

			var newCubicWall_10 = cubicWalls.clone();
				newCubicWall_10.position = new BABYLON.Vector3(-166, 80, 38);
				newCubicWall_10.scaling = new BABYLON.Vector3(23, 80, 4);
				newCubicWall_10.rotation = new BABYLON.Vector3(0, Math.PI/2.6, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_10);
				directionalLight.excludedMeshes.push(newCubicWall_10);
				newCubicWall_10.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_10, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_10.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_10.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_10.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_10.freezeWorldMatrix();
				newCubicWall_10.convertToUnIndexedMesh();
				newCubicWall_10.setEnabled(true);
				newCubicWall_10.visibility = 0;
				newCubicWall_10.checkCollisions = true;
			perimeter_walls.push(newCubicWall_10);

			var newCubicWall_11 = cubicWalls.clone();
				newCubicWall_11.position = new BABYLON.Vector3(-135, 80, 80);
				newCubicWall_11.scaling = new BABYLON.Vector3(45, 80, 4);
				newCubicWall_11.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_11);
				directionalLight.excludedMeshes.push(newCubicWall_11);
				newCubicWall_11.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_11, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_11.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_11.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_11.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_11.freezeWorldMatrix();
				newCubicWall_11.convertToUnIndexedMesh();
				newCubicWall_11.setEnabled(true);
				newCubicWall_11.visibility = 0;
				newCubicWall_11.checkCollisions = true;
			perimeter_walls.push(newCubicWall_11);

			var newCubicWall_12 = cubicWalls.clone();
				newCubicWall_12.position = new BABYLON.Vector3(-73, 80, 96);
				newCubicWall_12.scaling = new BABYLON.Vector3(18, 80, 18);
				newCubicWall_12.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_12);
				directionalLight.excludedMeshes.push(newCubicWall_12);
				newCubicWall_12.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_12, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_12.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_12.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_12.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_12.freezeWorldMatrix();
				newCubicWall_12.convertToUnIndexedMesh();
				newCubicWall_12.setEnabled(true);
				newCubicWall_12.visibility = 0;
				newCubicWall_12.checkCollisions = true;
			perimeter_walls.push(newCubicWall_12);

			var newCubicWall_13 = cubicWalls.clone();
				newCubicWall_13.position = new BABYLON.Vector3(-33, 80, 130);
				newCubicWall_13.scaling = new BABYLON.Vector3(32, 80, 4);
				newCubicWall_13.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_13);
				directionalLight.excludedMeshes.push(newCubicWall_13);
				newCubicWall_13.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_13, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_13.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_13.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_13.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_13.freezeWorldMatrix();
				newCubicWall_13.convertToUnIndexedMesh();
				newCubicWall_13.setEnabled(true);
				newCubicWall_13.visibility = 0;
				newCubicWall_13.checkCollisions = true;
			perimeter_walls.push(newCubicWall_13);

			var newCubicWall_14 = cubicWalls.clone();
				newCubicWall_14.position = new BABYLON.Vector3(11, 80, 140);
				newCubicWall_14.scaling = new BABYLON.Vector3(14, 80, 20);
				newCubicWall_14.rotation = new BABYLON.Vector3(0, -Math.PI/10, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_14);
				directionalLight.excludedMeshes.push(newCubicWall_14);
				newCubicWall_14.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_14, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_14.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_14.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_14.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_14.freezeWorldMatrix();
				newCubicWall_14.convertToUnIndexedMesh();
				newCubicWall_14.setEnabled(true);
				newCubicWall_14.visibility = 0;
				newCubicWall_14.checkCollisions = true;
			perimeter_walls.push(newCubicWall_14);

			var newCubicWall_15 = cubicWalls.clone();
				newCubicWall_15.position = new BABYLON.Vector3(40, 80, 170);
				newCubicWall_15.scaling = new BABYLON.Vector3(23, 80, 4);
				newCubicWall_15.rotation = new BABYLON.Vector3(0, -Math.PI/10, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_15);
				directionalLight.excludedMeshes.push(newCubicWall_15);
				newCubicWall_15.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_15, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_15.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_15.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_15.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_15.freezeWorldMatrix();
				newCubicWall_15.convertToUnIndexedMesh();
				newCubicWall_15.setEnabled(true);
				newCubicWall_15.visibility = 0;
				newCubicWall_15.checkCollisions = true;
			perimeter_walls.push(newCubicWall_15);

			var newCubicWall_16 = cubicWalls.clone();
				newCubicWall_16.position = new BABYLON.Vector3(80.5, 80, 135);
				newCubicWall_16.scaling = new BABYLON.Vector3(44, 80, 4);
				newCubicWall_16.rotation = new BABYLON.Vector3(0, Math.PI*0.4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_16);
				directionalLight.excludedMeshes.push(newCubicWall_16);
				newCubicWall_16.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_16, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_16.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_16.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_16.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_16.freezeWorldMatrix();
				newCubicWall_16.convertToUnIndexedMesh();
				newCubicWall_16.setEnabled(true);
				newCubicWall_16.visibility = 0;
				newCubicWall_16.checkCollisions = true;
			perimeter_walls.push(newCubicWall_16);

			var newCubicWall_cap = cubicWalls.clone();
				newCubicWall_cap.position = new BABYLON.Vector3(0, 164, 0);
				newCubicWall_cap.scaling = new BABYLON.Vector3(150, 4, 140);
				newCubicWall_cap.rotation = new BABYLON.Vector3(0, Math.PI*11/6, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_cap);
				directionalLight.excludedMeshes.push(newCubicWall_cap);
				newCubicWall_cap.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_cap, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_cap.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_cap.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_cap.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_cap.freezeWorldMatrix();
				newCubicWall_cap.convertToUnIndexedMesh();
				newCubicWall_cap.setEnabled(true);
				newCubicWall_cap.visibility = 0
				newCubicWall_cap.checkCollisions = true;
			perimeter_walls.push(newCubicWall_cap);

			var drowCircleWithCubesForColums = function(){
				var radiants = [ Math.PI/4, Math.PI/2, Math.PI*(3/4), Math.PI, Math.PI*(5/4), Math.PI*(3/2), Math.PI*(7/4), 0];
				const num = 8;
				const u = 16;
				const alfa = 2*Math.PI/num;
				const p = (3*Math.PI - alfa)/2;
				var x = [];
				var y = [];
				x[0] = Math.cos(p);
				y[0] = -Math.sin(p);
				for (i=1; i<=num; i+=1){
					x[i]=x[i-1]*Math.cos(-alfa) - y[i-1]*Math.sin(-alfa);
					y[i]=x[i-1]*Math.sin(-alfa) + y[i-1]*Math.cos(-alfa);
				}
				for (i=1;i<=num;i+=1){
					const newSphericWall_center = cubicWalls.clone();
						newSphericWall_center.position = new BABYLON.Vector3(u*x[i], 8, u*y[i]);
						newSphericWall_center.scaling = new BABYLON.Vector3(6.5, 8, 0.3);
						newSphericWall_center.rotation = new BABYLON.Vector3(0, radiants[i-1]-Math.PI/8, 0);
						newSphericWall_center.translate(BABYLON.Axis.X, -16, BABYLON.Space.WORLD);
						newSphericWall_center.translate(BABYLON.Axis.Z, 12, BABYLON.Space.WORLD);
						hemisphericLight.excludedMeshes.push(newSphericWall_center);
						directionalLight.excludedMeshes.push(newSphericWall_center);
						newSphericWall_center.physicsImpostor = new BABYLON.PhysicsImpostor(newSphericWall_center, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
						newSphericWall_center.physicsImpostor.physicsBody.inertia.setZero();
						newSphericWall_center.physicsImpostor.physicsBody.invInertia.setZero();
						newSphericWall_center.physicsImpostor.physicsBody.invInertiaWorld.setZero();
						newSphericWall_center.freezeWorldMatrix();
						newSphericWall_center.convertToUnIndexedMesh();
						newSphericWall_center.setEnabled(true);
						newSphericWall_center.visibility = 0
						newSphericWall_center.checkCollisions = true;
					perimeter_walls.push(newSphericWall_center);
				}
			}
			drowCircleWithCubesForColums();

			var newCylindricWall_cap = BABYLON.Mesh.CreateCylinder("newCylindricWall_cap", 1, 35, 35, 10, 1, scene, BABYLON.Mesh.DEFAULT);
				newCylindricWall_cap.position = new BABYLON.Vector3(-16, 16, 12);
				hemisphericLight.excludedMeshes.push(newCylindricWall_cap);
				directionalLight.excludedMeshes.push(newCylindricWall_cap);
				newCylindricWall_cap.freezeWorldMatrix();
				newCylindricWall_cap.setEnabled(true);
				newCylindricWall_cap.visibility = 0;
				newCylindricWall_cap.checkCollisions = true;
			perimeter_walls.push(newCylindricWall_cap);

		});

	}

	//****************Laboratory*******************
	if(ambientation == 0){
		BABYLON.SceneLoader.ImportMesh("", "meshes/Laboratory/", "Laboratory.babylon", scene, function (meshes, particleSystems, skeletons, animationGroups){

			for (var i in meshes) {

				meshes[i].translate(BABYLON.Axis.Y, -0.1, BABYLON.Space.WORLD);
				meshes[i].scaling.scaleInPlace(1.5);

				if((i<82 || i>88) && (i!=0)){
					meshes[i].freezeWorldMatrix();
				}

				if( ((i<81) && (i!=0) && (i!=23) && (i!=76) && (i!=77) && (i!=75)) || (i>101) || (i==81) || (i==92) || (i==94) || (i==95) || (i==98)){
					meshes[i].setEnabled(false);
				}

			}

			//Movement of the ologram
			const hologramAction = scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnEveryFrameTrigger, function (evt) {
				meshes[82].rotation.z += 0.02;
				meshes[83].rotation.y += 0.01;
				meshes[84].rotation.y += 0.02;
				meshes[85].rotation.z += 0.01;
				meshes[86].rotation.y += 0.01;
				meshes[87].rotation.z += 0.02;
				meshes[88].rotation.z += 0.01;
				meshes[0].rotation.z -= 0.01;
			}));

			var newCubicWall_X = cubicWalls.clone();
				newCubicWall_X.position = new BABYLON.Vector3(136, 40, 0);
				newCubicWall_X.scaling = new BABYLON.Vector3(14, 40, 4);
				newCubicWall_X.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X);
				directionalLight.excludedMeshes.push(newCubicWall_X);
				newCubicWall_X.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X.freezeWorldMatrix();
				newCubicWall_X.convertToUnIndexedMesh();
				newCubicWall_X.setEnabled(true);
				newCubicWall_X.visibility = 0
				newCubicWall_X.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X);

			var newCubicWall_X1 = cubicWalls.clone();
				newCubicWall_X1.position = new BABYLON.Vector3(139, 40, -29.5);
				newCubicWall_X1.scaling = new BABYLON.Vector3(15, 40, 4);
				newCubicWall_X1.rotation = new BABYLON.Vector3(0, Math.PI/1.8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X1);
				directionalLight.excludedMeshes.push(newCubicWall_X1);
				newCubicWall_X1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X1.freezeWorldMatrix();
				newCubicWall_X1.convertToUnIndexedMesh();
				newCubicWall_X1.setEnabled(true);
				newCubicWall_X1.visibility = 0
				newCubicWall_X1.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X1);

			var newCubicWall_X2 = cubicWalls.clone();
				newCubicWall_X2.position = new BABYLON.Vector3(128, 40, -50);
				newCubicWall_X2.scaling = new BABYLON.Vector3(8, 40, 4);
				newCubicWall_X2.rotation = new BABYLON.Vector3(0, Math.PI/1.55, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X2);
				directionalLight.excludedMeshes.push(newCubicWall_X2);
				newCubicWall_X2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X2.freezeWorldMatrix();
				newCubicWall_X2.convertToUnIndexedMesh();
				newCubicWall_X2.setEnabled(true);
				newCubicWall_X2.visibility = 0
				newCubicWall_X2.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X2);

			var newCubicWall_X3 = cubicWalls.clone();
				newCubicWall_X3.position = new BABYLON.Vector3(113, 40, -76.5);
				newCubicWall_X3.scaling = new BABYLON.Vector3(22, 40, 4);
				newCubicWall_X3.rotation = new BABYLON.Vector3(0, Math.PI/1.34, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X3);
				directionalLight.excludedMeshes.push(newCubicWall_X3);
				newCubicWall_X3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X3.freezeWorldMatrix();
				newCubicWall_X3.convertToUnIndexedMesh();
				newCubicWall_X3.setEnabled(true);
				newCubicWall_X3.visibility = 0
				newCubicWall_X3.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X3);

			var newCubicWall_X4 = cubicWalls.clone();
				newCubicWall_X4.position = new BABYLON.Vector3(85, 40, -91);
				newCubicWall_X4.scaling = new BABYLON.Vector3(9, 40, 4);
				newCubicWall_X4.rotation = new BABYLON.Vector3(0, Math.PI/1.165, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X4);
				directionalLight.excludedMeshes.push(newCubicWall_X4);
				newCubicWall_X4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X4.freezeWorldMatrix();
				newCubicWall_X4.convertToUnIndexedMesh();
				newCubicWall_X4.setEnabled(true);
				newCubicWall_X4.visibility = 0
				newCubicWall_X4.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X4);

			var newCubicWall_X5 = cubicWalls.clone();
				newCubicWall_X5.position = new BABYLON.Vector3(65, 40, -105);
				newCubicWall_X5.scaling = new BABYLON.Vector3(14.5, 40, 4);
				newCubicWall_X5.rotation = new BABYLON.Vector3(0, Math.PI/1.06, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X5);
				directionalLight.excludedMeshes.push(newCubicWall_X5);
				newCubicWall_X5.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X5, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X5.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X5.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X5.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X5.freezeWorldMatrix();
				newCubicWall_X5.convertToUnIndexedMesh();
				newCubicWall_X5.setEnabled(true);
				newCubicWall_X5.visibility = 0
				newCubicWall_X5.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X5);

			var newCubicWall_X6 = cubicWalls.clone();
				newCubicWall_X6.position = new BABYLON.Vector3(42, 40, -108);
				newCubicWall_X6.scaling = new BABYLON.Vector3(7, 40, 12);
				newCubicWall_X6.rotation = new BABYLON.Vector3(0, -Math.PI/1.05, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X6);
				directionalLight.excludedMeshes.push(newCubicWall_X6);
				newCubicWall_X6.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X6, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X6.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X6.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X6.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X6.freezeWorldMatrix();
				newCubicWall_X6.convertToUnIndexedMesh();
				newCubicWall_X6.setEnabled(true);
				newCubicWall_X6.visibility = 0
				newCubicWall_X6.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X6);

			var newCubicWall_door = cubicWalls.clone();
				newCubicWall_door.position = new BABYLON.Vector3(0, 40, -116);
				newCubicWall_door.scaling = new BABYLON.Vector3(33, 40, 4);
				newCubicWall_door.rotation = new BABYLON.Vector3(0, Math.PI, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_door);
				directionalLight.excludedMeshes.push(newCubicWall_door);
				newCubicWall_door.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_door, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_door.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_door.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_door.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_door.freezeWorldMatrix();
				newCubicWall_door.convertToUnIndexedMesh();
				newCubicWall_door.setEnabled(true);
				newCubicWall_door.visibility = 0
				newCubicWall_door.checkCollisions = true;
			perimeter_walls.push(newCubicWall_door);

			var newCubicWall_X7 = cubicWalls.clone();
				newCubicWall_X7.position = new BABYLON.Vector3(-42, 40, -108);
				newCubicWall_X7.scaling = new BABYLON.Vector3(7, 40, 12);
				newCubicWall_X7.rotation = new BABYLON.Vector3(0, Math.PI/1.05, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X7);
				directionalLight.excludedMeshes.push(newCubicWall_X7);
				newCubicWall_X7.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X7, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X7.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X7.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X7.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X7.freezeWorldMatrix();
				newCubicWall_X7.convertToUnIndexedMesh();
				newCubicWall_X7.setEnabled(true);
				newCubicWall_X7.visibility = 0
				newCubicWall_X7.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X7);

			var newCubicWall_X8 = cubicWalls.clone();
				newCubicWall_X8.position = new BABYLON.Vector3(-65, 40, -105);
				newCubicWall_X8.scaling = new BABYLON.Vector3(14.5, 40, 4);
				newCubicWall_X8.rotation = new BABYLON.Vector3(0, -Math.PI/1.06, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X8);
				directionalLight.excludedMeshes.push(newCubicWall_X8);
				newCubicWall_X8.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X8, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X8.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X8.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X8.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X8.freezeWorldMatrix();
				newCubicWall_X8.convertToUnIndexedMesh();
				newCubicWall_X8.setEnabled(true);
				newCubicWall_X8.visibility = 0
				newCubicWall_X8.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X8);

			var newCubicWall_X9 = cubicWalls.clone();
				newCubicWall_X9.position = new BABYLON.Vector3(-85, 40, -91);
				newCubicWall_X9.scaling = new BABYLON.Vector3(9, 40, 4);
				newCubicWall_X9.rotation = new BABYLON.Vector3(0, -Math.PI/1.165, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X9);
				directionalLight.excludedMeshes.push(newCubicWall_X9);
				newCubicWall_X9.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X9, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X9.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X9.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X9.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X9.freezeWorldMatrix();
				newCubicWall_X9.convertToUnIndexedMesh();
				newCubicWall_X9.setEnabled(true);
				newCubicWall_X9.visibility = 0
				newCubicWall_X9.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X9);

			var newCubicWall_X10 = cubicWalls.clone();
				newCubicWall_X10.position = new BABYLON.Vector3(-113, 40, -76.5);
				newCubicWall_X10.scaling = new BABYLON.Vector3(22, 40, 4);
				newCubicWall_X10.rotation = new BABYLON.Vector3(0, -Math.PI/1.34, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X10);
				directionalLight.excludedMeshes.push(newCubicWall_X10);
				newCubicWall_X10.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X10, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X10.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X10.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X10.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X10.freezeWorldMatrix();
				newCubicWall_X10.convertToUnIndexedMesh();
				newCubicWall_X10.setEnabled(true);
				newCubicWall_X10.visibility = 0
				newCubicWall_X10.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X10);

			var newCubicWall_X11 = cubicWalls.clone();
				newCubicWall_X11.position = new BABYLON.Vector3(-128, 40, -50);
				newCubicWall_X11.scaling = new BABYLON.Vector3(8, 40, 4);
				newCubicWall_X11.rotation = new BABYLON.Vector3(0, -Math.PI/1.55, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X11);
				directionalLight.excludedMeshes.push(newCubicWall_X11);
				newCubicWall_X11.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X11, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X11.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X11.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X11.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X11.freezeWorldMatrix();
				newCubicWall_X11.convertToUnIndexedMesh();
				newCubicWall_X11.setEnabled(true);
				newCubicWall_X11.visibility = 0
				newCubicWall_X11.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X11);

			var newCubicWall_X12 = cubicWalls.clone();
				newCubicWall_X12.position = new BABYLON.Vector3(-139, 40, -29.5);
				newCubicWall_X12.scaling = new BABYLON.Vector3(15, 40, 4);
				newCubicWall_X12.rotation = new BABYLON.Vector3(0, -Math.PI/1.8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_X12);
				directionalLight.excludedMeshes.push(newCubicWall_X12);
				newCubicWall_X12.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_X12, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_X12.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_X12.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_X12.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_X12.freezeWorldMatrix();
				newCubicWall_X12.convertToUnIndexedMesh();
				newCubicWall_X12.setEnabled(true);
				newCubicWall_X12.visibility = 0
				newCubicWall_X12.checkCollisions = true;
			perimeter_walls.push(newCubicWall_X12);

			var newCubicWallX = cubicWalls.clone();
				newCubicWallX.position = new BABYLON.Vector3(-135, 40, 0);
				newCubicWallX.scaling = new BABYLON.Vector3(14, 40, 4);
				newCubicWallX.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX);
				directionalLight.excludedMeshes.push(newCubicWallX);
				newCubicWallX.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX.freezeWorldMatrix();
				newCubicWallX.convertToUnIndexedMesh();
				newCubicWallX.setEnabled(true);
				newCubicWallX.visibility = 0
				newCubicWallX.checkCollisions = true;
			perimeter_walls.push(newCubicWallX);

			var newCubicWallX1 = cubicWalls.clone();
				newCubicWallX1.position = new BABYLON.Vector3(-139, 40, 29.5);
				newCubicWallX1.scaling = new BABYLON.Vector3(15, 40, 4);
				newCubicWallX1.rotation = new BABYLON.Vector3(0, Math.PI/1.8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX1);
				directionalLight.excludedMeshes.push(newCubicWallX1);
				newCubicWallX1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX1.freezeWorldMatrix();
				newCubicWallX1.convertToUnIndexedMesh();
				newCubicWallX1.setEnabled(false);
				newCubicWallX1.setEnabled(true);
				newCubicWallX1.visibility = 0
				newCubicWallX1.checkCollisions = true;
			perimeter_walls.push(newCubicWallX1);

			var newCubicWallX2 = cubicWalls.clone();
				newCubicWallX2.position = new BABYLON.Vector3(-128, 40, 50);
				newCubicWallX2.scaling = new BABYLON.Vector3(8, 40, 4);
				newCubicWallX2.rotation = new BABYLON.Vector3(0, Math.PI/1.55, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX2);
				directionalLight.excludedMeshes.push(newCubicWallX2);
				newCubicWallX2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX2.freezeWorldMatrix();
				newCubicWallX2.convertToUnIndexedMesh();
				newCubicWallX2.setEnabled(true);
				newCubicWallX2.visibility = 0
				newCubicWallX2.checkCollisions = true;
			perimeter_walls.push(newCubicWallX2);

			var newCubicWallX3 = cubicWalls.clone();
				newCubicWallX3.position = new BABYLON.Vector3(-113, 40, 76.5);
				newCubicWallX3.scaling = new BABYLON.Vector3(22, 40, 4);
				newCubicWallX3.rotation = new BABYLON.Vector3(0, Math.PI/1.34, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX3);
				directionalLight.excludedMeshes.push(newCubicWallX3);
				newCubicWallX3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX3.freezeWorldMatrix();
				newCubicWallX3.convertToUnIndexedMesh();
				newCubicWallX3.setEnabled(true);
				newCubicWallX3.visibility = 0
				newCubicWallX3.checkCollisions = true;
			perimeter_walls.push(newCubicWallX3);

			var newCubicWallX4 = cubicWalls.clone();
				newCubicWallX4.position = new BABYLON.Vector3(-85, 40, 91);
				newCubicWallX4.scaling = new BABYLON.Vector3(9, 40, 4);
				newCubicWallX4.rotation = new BABYLON.Vector3(0, Math.PI/1.165, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX4);
				directionalLight.excludedMeshes.push(newCubicWallX4);
				newCubicWallX4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX4.freezeWorldMatrix();
				newCubicWallX4.convertToUnIndexedMesh();
				newCubicWallX4.setEnabled(true);
				newCubicWallX4.visibility = 0
				newCubicWallX4.checkCollisions = true;
			perimeter_walls.push(newCubicWallX4);

			var newCubicWallX5 = cubicWalls.clone();
				newCubicWallX5.position = new BABYLON.Vector3(-65, 40, 105);
				newCubicWallX5.scaling = new BABYLON.Vector3(14.5, 40, 4);
				newCubicWallX5.rotation = new BABYLON.Vector3(0, Math.PI/1.06, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX5);
				directionalLight.excludedMeshes.push(newCubicWallX5);
				newCubicWallX5.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX5, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX5.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX5.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX5.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX5.freezeWorldMatrix();
				newCubicWallX5.convertToUnIndexedMesh();
				newCubicWallX5.setEnabled(true);
				newCubicWallX5.visibility = 0
				newCubicWallX5.checkCollisions = true;
			perimeter_walls.push(newCubicWallX5);

			var newCubicWallX6 = cubicWalls.clone();
				newCubicWallX6.position = new BABYLON.Vector3(-42, 40, 108);
				newCubicWallX6.scaling = new BABYLON.Vector3(7, 40, 12);
				newCubicWallX6.rotation = new BABYLON.Vector3(0, -Math.PI/1.05, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX6);
				directionalLight.excludedMeshes.push(newCubicWallX6);
				newCubicWallX6.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX6, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX6.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX6.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX6.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX6.freezeWorldMatrix();
				newCubicWallX6.convertToUnIndexedMesh();
				newCubicWallX6.setEnabled(true);
				newCubicWallX6.visibility = 0
				newCubicWallX6.checkCollisions = true;
			perimeter_walls.push(newCubicWallX6);

			var newCubicWall_door1 = cubicWalls.clone();
				newCubicWall_door1.position = new BABYLON.Vector3(0, 40, 116);
				newCubicWall_door1.scaling = new BABYLON.Vector3(35, 40, 4);
				newCubicWall_door1.rotation = new BABYLON.Vector3(0, Math.PI, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_door1);
				directionalLight.excludedMeshes.push(newCubicWall_door1);
				newCubicWall_door1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_door1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_door1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_door1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_door1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_door1.freezeWorldMatrix();
				newCubicWall_door1.convertToUnIndexedMesh();
				newCubicWall_door1.setEnabled(true);
				newCubicWall_door1.visibility = 0
				newCubicWall_door1.checkCollisions = true;
			perimeter_walls.push(newCubicWall_door1);

			var newCubicWallX7 = cubicWalls.clone();
				newCubicWallX7.position = new BABYLON.Vector3(42, 40, 108);
				newCubicWallX7.scaling = new BABYLON.Vector3(7, 40, 12);
				newCubicWallX7.rotation = new BABYLON.Vector3(0, Math.PI/1.05, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX7);
				directionalLight.excludedMeshes.push(newCubicWallX7);
				newCubicWallX7.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX7, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX7.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX7.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX7.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX7.freezeWorldMatrix();
				newCubicWallX7.convertToUnIndexedMesh();
				newCubicWallX7.setEnabled(true);
				newCubicWallX7.visibility = 0
				newCubicWallX7.checkCollisions = true;
			perimeter_walls.push(newCubicWallX7);

			var newCubicWallX8 = cubicWalls.clone();
				newCubicWallX8.position = new BABYLON.Vector3(65, 40, 105);
				newCubicWallX8.scaling = new BABYLON.Vector3(14.5, 40, 4);
				newCubicWallX8.rotation = new BABYLON.Vector3(0, -Math.PI/1.06, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX8);
				directionalLight.excludedMeshes.push(newCubicWallX8);
				newCubicWallX8.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX8, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX8.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX8.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX8.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX8.freezeWorldMatrix();
				newCubicWallX8.convertToUnIndexedMesh();
				newCubicWallX8.setEnabled(true);
				newCubicWallX8.visibility = 0
				newCubicWallX8.checkCollisions = true;
			perimeter_walls.push(newCubicWallX8);

			var newCubicWallX9 = cubicWalls.clone();
				newCubicWallX9.position = new BABYLON.Vector3(85, 40, 91);
				newCubicWallX9.scaling = new BABYLON.Vector3(9, 40, 4);
				newCubicWallX9.rotation = new BABYLON.Vector3(0, -Math.PI/1.165, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX9);
				directionalLight.excludedMeshes.push(newCubicWallX9);
				newCubicWallX9.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX9, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX9.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX9.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX9.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX9.freezeWorldMatrix();
				newCubicWallX9.convertToUnIndexedMesh();
				newCubicWallX9.setEnabled(true);
				newCubicWallX9.visibility = 0
				newCubicWallX9.checkCollisions = true;
			perimeter_walls.push(newCubicWallX9);

			var newCubicWallX10 = cubicWalls.clone();
				newCubicWallX10.position = new BABYLON.Vector3(113, 40, 76.5);
				newCubicWallX10.scaling = new BABYLON.Vector3(22, 40, 4);
				newCubicWallX10.rotation = new BABYLON.Vector3(0, -Math.PI/1.34, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX10);
				directionalLight.excludedMeshes.push(newCubicWallX10);
				newCubicWallX10.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX10, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX10.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX10.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX10.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX10.freezeWorldMatrix();
				newCubicWallX10.convertToUnIndexedMesh();
				newCubicWallX10.setEnabled(true);
				newCubicWallX10.visibility = 0
				newCubicWallX10.checkCollisions = true;
			perimeter_walls.push(newCubicWallX10);

			var newCubicWallX11 = cubicWalls.clone();
				newCubicWallX11.position = new BABYLON.Vector3(128, 40, 50);
				newCubicWallX11.scaling = new BABYLON.Vector3(8, 40, 4);
				newCubicWallX11.rotation = new BABYLON.Vector3(0, -Math.PI/1.55, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX11);
				directionalLight.excludedMeshes.push(newCubicWallX11);
				newCubicWallX11.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX11, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX11.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX11.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX11.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX11.freezeWorldMatrix();
				newCubicWallX11.convertToUnIndexedMesh();
				newCubicWallX11.setEnabled(true);
				newCubicWallX11.visibility = 0
				newCubicWallX11.checkCollisions = true;
			perimeter_walls.push(newCubicWallX11);

			var newCubicWallX12 = cubicWalls.clone();
				newCubicWallX12.position = new BABYLON.Vector3(139, 40, 29.5);
				newCubicWallX12.scaling = new BABYLON.Vector3(15, 40, 4);
				newCubicWallX12.rotation = new BABYLON.Vector3(0, -Math.PI/1.8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWallX12);
				directionalLight.excludedMeshes.push(newCubicWallX12);
				newCubicWallX12.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWallX12, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWallX12.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWallX12.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWallX12.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWallX12.freezeWorldMatrix();
				newCubicWallX12.convertToUnIndexedMesh();
				newCubicWallX12.setEnabled(true);
				newCubicWallX12.visibility = 0
				newCubicWallX12.checkCollisions = true;
			perimeter_walls.push(newCubicWallX12);

			var newCubicWall_cap = cubicWalls.clone();
				newCubicWall_cap.position = new BABYLON.Vector3(0, 84, 0);
				newCubicWall_cap.scaling = new BABYLON.Vector3(150, 4, 120);
				hemisphericLight.excludedMeshes.push(newCubicWall_cap);
				directionalLight.excludedMeshes.push(newCubicWall_cap);
				newCubicWall_cap.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_cap, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_cap.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_cap.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_cap.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_cap.freezeWorldMatrix();
				newCubicWall_cap.convertToUnIndexedMesh();
				newCubicWall_cap.setEnabled(true);
				newCubicWall_cap.visibility = 0
				newCubicWall_cap.checkCollisions = true;
			perimeter_walls.push(newCubicWall_cap);

			var newCubicWall_col_Q1_1 = cubicWalls.clone();
				newCubicWall_col_Q1_1.position = new BABYLON.Vector3(59, 0.5, -32);
				newCubicWall_col_Q1_1.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q1_1);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q1_1);
				newCubicWall_col_Q1_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q1_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q1_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q1_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q1_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q1_1.freezeWorldMatrix();
				newCubicWall_col_Q1_1.convertToUnIndexedMesh();
				newCubicWall_col_Q1_1.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q1_1);

			var newCubicWall_col_Q1_2 = cubicWalls.clone();
				newCubicWall_col_Q1_2.position = new BABYLON.Vector3(59, 1.5, -32);
				newCubicWall_col_Q1_2.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q1_2.rotation = new BABYLON.Vector3(0, Math.PI/4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q1_2);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q1_2);
				newCubicWall_col_Q1_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q1_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q1_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q1_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q1_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q1_2.freezeWorldMatrix();
				newCubicWall_col_Q1_2.convertToUnIndexedMesh();
				newCubicWall_col_Q1_2.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q1_2);

			var newCubicWall_col_Q1_3 = cubicWalls.clone();
				newCubicWall_col_Q1_3.position = new BABYLON.Vector3(59, 2.5, -32);
				newCubicWall_col_Q1_3.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q1_3.rotation = new BABYLON.Vector3(0, Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q1_3);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q1_3);
				newCubicWall_col_Q1_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q1_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q1_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q1_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q1_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q1_3.freezeWorldMatrix();
				newCubicWall_col_Q1_3.convertToUnIndexedMesh();
				newCubicWall_col_Q1_3.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q1_3);

			var newCubicWall_col_Q1_4 = cubicWalls.clone();
				newCubicWall_col_Q1_4.position = new BABYLON.Vector3(59, 3.5, -32);
				newCubicWall_col_Q1_4.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q1_4.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q1_4);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q1_4);
				newCubicWall_col_Q1_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q1_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q1_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q1_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q1_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q1_4.freezeWorldMatrix();
				newCubicWall_col_Q1_4.convertToUnIndexedMesh();
				newCubicWall_col_Q1_4.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q1_4);

			var newCylindricWall_col_Q1 = BABYLON.Mesh.CreateCylinder("newCylindricWall_col_Q1", 5, 16, 16, 10, 1, scene, BABYLON.Mesh.DEFAULT);
				newCylindricWall_col_Q1.position = new BABYLON.Vector3(59, 6.5, -32);
				hemisphericLight.excludedMeshes.push(newCylindricWall_col_Q1);
				directionalLight.excludedMeshes.push(newCylindricWall_col_Q1);
				newCylindricWall_col_Q1.physicsImpostor = new BABYLON.PhysicsImpostor(newCylindricWall_col_Q1, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 10000, restitution: 0});
				newCylindricWall_col_Q1.physicsImpostor.physicsBody.inertia.setZero();
				newCylindricWall_col_Q1.physicsImpostor.physicsBody.invInertia.setZero();
				newCylindricWall_col_Q1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCylindricWall_col_Q1.freezeWorldMatrix();
				newCylindricWall_col_Q1.convertToUnIndexedMesh();
				newCylindricWall_col_Q1.setEnabled(false);
			perimeter_walls.push(newCylindricWall_col_Q1);

			var newCubicWall_col_Q2_1 = cubicWalls.clone();
				newCubicWall_col_Q2_1.position = new BABYLON.Vector3(-59, 0.5, -32);
				newCubicWall_col_Q2_1.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q2_1);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q2_1);
				newCubicWall_col_Q2_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q2_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q2_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q2_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q2_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q2_1.freezeWorldMatrix();
				newCubicWall_col_Q2_1.convertToUnIndexedMesh();
				newCubicWall_col_Q2_1.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q2_1);

			var newCubicWall_col_Q2_2 = cubicWalls.clone();
				newCubicWall_col_Q2_2.position = new BABYLON.Vector3(-59, 1.5, -32);
				newCubicWall_col_Q2_2.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q2_2.rotation = new BABYLON.Vector3(0, Math.PI/4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q2_2);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q2_2);
				newCubicWall_col_Q2_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q2_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q2_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q2_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q2_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q2_2.freezeWorldMatrix();
				newCubicWall_col_Q2_2.convertToUnIndexedMesh();
				newCubicWall_col_Q2_2.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q2_2);

			var newCubicWall_col_Q2_3 = cubicWalls.clone();
				newCubicWall_col_Q2_3.position = new BABYLON.Vector3(-59, 2.5, -32);
				newCubicWall_col_Q2_3.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q2_3.rotation = new BABYLON.Vector3(0, Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q2_3);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q2_3);
				newCubicWall_col_Q2_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q2_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q2_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q2_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q2_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q2_3.freezeWorldMatrix();
				newCubicWall_col_Q2_3.convertToUnIndexedMesh();
				newCubicWall_col_Q2_3.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q2_3);

			var newCubicWall_col_Q2_4 = cubicWalls.clone();
				newCubicWall_col_Q2_4.position = new BABYLON.Vector3(-59, 3.5, -32);
				newCubicWall_col_Q2_4.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q2_4.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q2_4);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q2_4);
				newCubicWall_col_Q2_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q2_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q2_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q2_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q2_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q2_4.freezeWorldMatrix();
				newCubicWall_col_Q2_4.convertToUnIndexedMesh();
				newCubicWall_col_Q2_4.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q2_4);

			var newCylindricWall_col_Q2 = BABYLON.Mesh.CreateCylinder("newCylindricWall_col_Q2", 5, 16, 16, 10, 1, scene, BABYLON.Mesh.DEFAULT);
				newCylindricWall_col_Q2.position = new BABYLON.Vector3(-59, 6.5, -32);
				hemisphericLight.excludedMeshes.push(newCylindricWall_col_Q2);
				directionalLight.excludedMeshes.push(newCylindricWall_col_Q2);
				newCylindricWall_col_Q2.physicsImpostor = new BABYLON.PhysicsImpostor(newCylindricWall_col_Q2, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 10000, restitution: 0});
				newCylindricWall_col_Q2.physicsImpostor.physicsBody.inertia.setZero();
				newCylindricWall_col_Q2.physicsImpostor.physicsBody.invInertia.setZero();
				newCylindricWall_col_Q2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCylindricWall_col_Q2.freezeWorldMatrix();
				newCylindricWall_col_Q2.convertToUnIndexedMesh();
				newCylindricWall_col_Q2.setEnabled(false);
			perimeter_walls.push(newCylindricWall_col_Q2);

			var newCubicWall_col_Q3_1 = cubicWalls.clone();
				newCubicWall_col_Q3_1.position = new BABYLON.Vector3(59, 0.5, 32);
				newCubicWall_col_Q3_1.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q3_1);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q3_1);
				newCubicWall_col_Q3_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q3_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q3_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q3_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q3_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q3_1.freezeWorldMatrix();
				newCubicWall_col_Q3_1.convertToUnIndexedMesh();
				newCubicWall_col_Q3_1.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q3_1);

			var newCubicWall_col_Q3_2 = cubicWalls.clone();
				newCubicWall_col_Q3_2.position = new BABYLON.Vector3(59, 1.5, 32);
				newCubicWall_col_Q3_2.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q3_2.rotation = new BABYLON.Vector3(0, Math.PI/4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q3_2);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q3_2);
				newCubicWall_col_Q3_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q3_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q3_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q3_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q3_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q3_2.freezeWorldMatrix();
				newCubicWall_col_Q3_2.convertToUnIndexedMesh();
				newCubicWall_col_Q3_2.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q3_2);

			var newCubicWall_col_Q3_3 = cubicWalls.clone();
				newCubicWall_col_Q3_3.position = new BABYLON.Vector3(59, 2.5, 32);
				newCubicWall_col_Q3_3.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q3_3.rotation = new BABYLON.Vector3(0, Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q3_3);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q3_3);
				newCubicWall_col_Q3_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q3_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q3_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q3_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q3_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q3_3.freezeWorldMatrix();
				newCubicWall_col_Q3_3.convertToUnIndexedMesh();
				newCubicWall_col_Q3_3.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q3_3);

			var newCubicWall_col_Q3_4 = cubicWalls.clone();
				newCubicWall_col_Q3_4.position = new BABYLON.Vector3(59, 3.5, 32);
				newCubicWall_col_Q3_4.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q3_4.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q3_4);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q3_4);
				newCubicWall_col_Q3_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q3_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q3_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q3_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q3_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q3_4.freezeWorldMatrix();
				newCubicWall_col_Q3_4.convertToUnIndexedMesh();
				newCubicWall_col_Q3_4.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q3_4);

			var newCylindricWall_col_Q3 = BABYLON.Mesh.CreateCylinder("newCylindricWall_col_Q3", 5, 16, 16, 10, 1, scene, BABYLON.Mesh.DEFAULT);
				newCylindricWall_col_Q3.position = new BABYLON.Vector3(59, 6.5, 32);
				hemisphericLight.excludedMeshes.push(newCylindricWall_col_Q3);
				directionalLight.excludedMeshes.push(newCylindricWall_col_Q3);
				newCylindricWall_col_Q3.physicsImpostor = new BABYLON.PhysicsImpostor(newCylindricWall_col_Q3, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 10000, restitution: 0});
				newCylindricWall_col_Q3.physicsImpostor.physicsBody.inertia.setZero();
				newCylindricWall_col_Q3.physicsImpostor.physicsBody.invInertia.setZero();
				newCylindricWall_col_Q3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCylindricWall_col_Q3.freezeWorldMatrix();
				newCylindricWall_col_Q3.convertToUnIndexedMesh();
				newCylindricWall_col_Q3.setEnabled(false);
			perimeter_walls.push(newCylindricWall_col_Q3);

			var newCubicWall_col_Q4_1 = cubicWalls.clone();
				newCubicWall_col_Q4_1.position = new BABYLON.Vector3(-59, 0.5, 32);
				newCubicWall_col_Q4_1.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q4_1);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q4_1);
				newCubicWall_col_Q4_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q4_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q4_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q4_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q4_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q4_1.freezeWorldMatrix();
				newCubicWall_col_Q4_1.convertToUnIndexedMesh();
				newCubicWall_col_Q4_1.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q4_1);

			var newCubicWall_col_Q4_2 = cubicWalls.clone();
				newCubicWall_col_Q4_2.position = new BABYLON.Vector3(-59, 1.5, 32);
				newCubicWall_col_Q4_2.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q4_2.rotation = new BABYLON.Vector3(0, Math.PI/4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q4_2);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q4_2);
				newCubicWall_col_Q4_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q4_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q4_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q4_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q4_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q4_2.freezeWorldMatrix();
				newCubicWall_col_Q4_2.convertToUnIndexedMesh();
				newCubicWall_col_Q4_2.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q4_2);

			var newCubicWall_col_Q4_3 = cubicWalls.clone();
				newCubicWall_col_Q4_3.position = new BABYLON.Vector3(-59, 2.5, 32);
				newCubicWall_col_Q4_3.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q4_3.rotation = new BABYLON.Vector3(0, Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q4_3);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q4_3);
				newCubicWall_col_Q4_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q4_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q4_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q4_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q4_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q4_3.freezeWorldMatrix();
				newCubicWall_col_Q4_3.convertToUnIndexedMesh();
				newCubicWall_col_Q4_3.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q4_3);

			var newCubicWall_col_Q4_4 = cubicWalls.clone();
				newCubicWall_col_Q4_4.position = new BABYLON.Vector3(-59, 3.5, 32);
				newCubicWall_col_Q4_4.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_col_Q4_4.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_col_Q4_4);
				directionalLight.excludedMeshes.push(newCubicWall_col_Q4_4);
				newCubicWall_col_Q4_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_col_Q4_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_col_Q4_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_col_Q4_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_col_Q4_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_col_Q4_4.freezeWorldMatrix();
				newCubicWall_col_Q4_4.convertToUnIndexedMesh();
				newCubicWall_col_Q4_4.setEnabled(false);
			perimeter_walls.push(newCubicWall_col_Q4_4);

			var newCylindricWall_col_Q4 = BABYLON.Mesh.CreateCylinder("newCylindricWall_col_Q4", 5, 16, 16, 10, 1, scene, BABYLON.Mesh.DEFAULT);
				newCylindricWall_col_Q4.position = new BABYLON.Vector3(-59, 6.5, 32);
				hemisphericLight.excludedMeshes.push(newCylindricWall_col_Q4);
				directionalLight.excludedMeshes.push(newCylindricWall_col_Q4);
				newCylindricWall_col_Q4.physicsImpostor = new BABYLON.PhysicsImpostor(newCylindricWall_col_Q4, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 10000, restitution: 0});
				newCylindricWall_col_Q4.physicsImpostor.physicsBody.inertia.setZero();
				newCylindricWall_col_Q4.physicsImpostor.physicsBody.invInertia.setZero();
				newCylindricWall_col_Q4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCylindricWall_col_Q4.freezeWorldMatrix();
				newCylindricWall_col_Q4.convertToUnIndexedMesh();
				newCylindricWall_col_Q4.setEnabled(false);
			perimeter_walls.push(newCylindricWall_col_Q4);

			var newCubicWall_centralObstacle_1 = cubicWalls.clone();
				newCubicWall_centralObstacle_1.position = new BABYLON.Vector3(0, 0.5, 0);
				newCubicWall_centralObstacle_1.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				hemisphericLight.excludedMeshes.push(newCubicWall_centralObstacle_1);
				directionalLight.excludedMeshes.push(newCubicWall_centralObstacle_1);
				newCubicWall_centralObstacle_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_centralObstacle_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_centralObstacle_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_centralObstacle_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_centralObstacle_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_centralObstacle_1.freezeWorldMatrix();
				newCubicWall_centralObstacle_1.convertToUnIndexedMesh();
				newCubicWall_centralObstacle_1.setEnabled(false);
			perimeter_walls.push(newCubicWall_centralObstacle_1);

			var newCubicWall_centralObstacle_2 = cubicWalls.clone();
				newCubicWall_centralObstacle_2.position = new BABYLON.Vector3(0, 1.5, 0);
				newCubicWall_centralObstacle_2.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_centralObstacle_2.rotation = new BABYLON.Vector3(0, Math.PI/4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_centralObstacle_2);
				directionalLight.excludedMeshes.push(newCubicWall_centralObstacle_2);
				newCubicWall_centralObstacle_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_centralObstacle_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_centralObstacle_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_centralObstacle_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_centralObstacle_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_centralObstacle_2.freezeWorldMatrix();
				newCubicWall_centralObstacle_2.convertToUnIndexedMesh();
				newCubicWall_centralObstacle_2.setEnabled(false);
			perimeter_walls.push(newCubicWall_centralObstacle_2);

			var newCubicWall_centralObstacle_3 = cubicWalls.clone();
				newCubicWall_centralObstacle_3.position = new BABYLON.Vector3(0, 2.5, 0);
				newCubicWall_centralObstacle_3.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_centralObstacle_3.rotation = new BABYLON.Vector3(0, Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_centralObstacle_3);
				directionalLight.excludedMeshes.push(newCubicWall_centralObstacle_3);
				newCubicWall_centralObstacle_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_centralObstacle_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_centralObstacle_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_centralObstacle_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_centralObstacle_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_centralObstacle_3.freezeWorldMatrix();
				newCubicWall_centralObstacle_3.convertToUnIndexedMesh();
				newCubicWall_centralObstacle_3.setEnabled(false);
			perimeter_walls.push(newCubicWall_centralObstacle_3);

			var newCubicWall_centralObstacle_4 = cubicWalls.clone();
				newCubicWall_centralObstacle_4.position = new BABYLON.Vector3(0, 3.5, 0);
				newCubicWall_centralObstacle_4.scaling = new BABYLON.Vector3(8.5, 0.5, 8.5);
				newCubicWall_centralObstacle_4.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_centralObstacle_4);
				directionalLight.excludedMeshes.push(newCubicWall_centralObstacle_4);
				newCubicWall_centralObstacle_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_centralObstacle_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_centralObstacle_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_centralObstacle_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_centralObstacle_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_centralObstacle_4.freezeWorldMatrix();
				newCubicWall_centralObstacle_4.convertToUnIndexedMesh();
				newCubicWall_centralObstacle_4.setEnabled(false);
			perimeter_walls.push(newCubicWall_centralObstacle_4);

			var newCubicWall_otherObstacle_1 = cubicWalls.clone();
				newCubicWall_otherObstacle_1.position = new BABYLON.Vector3(36, 0.5, 0);
				newCubicWall_otherObstacle_1.scaling = new BABYLON.Vector3(2.5, 0.5, 2.5);
				hemisphericLight.excludedMeshes.push(newCubicWall_otherObstacle_1);
				directionalLight.excludedMeshes.push(newCubicWall_otherObstacle_1);
				newCubicWall_otherObstacle_1.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_otherObstacle_1, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_otherObstacle_1.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_otherObstacle_1.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_otherObstacle_1.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_otherObstacle_1.freezeWorldMatrix();
				newCubicWall_otherObstacle_1.convertToUnIndexedMesh();
				newCubicWall_otherObstacle_1.setEnabled(false);
			perimeter_walls.push(newCubicWall_otherObstacle_1);

			var newCubicWall_otherObstacle_2 = cubicWalls.clone();
				newCubicWall_otherObstacle_2.position = new BABYLON.Vector3(36, 1.5, 0);
				newCubicWall_otherObstacle_2.scaling = new BABYLON.Vector3(2.5, 0.5, 2.5);
				newCubicWall_otherObstacle_2.rotation = new BABYLON.Vector3(0, Math.PI/4, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_otherObstacle_2);
				directionalLight.excludedMeshes.push(newCubicWall_otherObstacle_2);
				newCubicWall_otherObstacle_2.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_otherObstacle_2, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_otherObstacle_2.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_otherObstacle_2.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_otherObstacle_2.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_otherObstacle_2.freezeWorldMatrix();
				newCubicWall_otherObstacle_2.convertToUnIndexedMesh();
				newCubicWall_otherObstacle_2.setEnabled(false);
			perimeter_walls.push(newCubicWall_otherObstacle_2);

			var newCubicWall_otherObstacle_3 = cubicWalls.clone();
				newCubicWall_otherObstacle_3.position = new BABYLON.Vector3(36, 2.5, 0);
				newCubicWall_otherObstacle_3.scaling = new BABYLON.Vector3(2.5, 0.5, 2.5);
				newCubicWall_otherObstacle_3.rotation = new BABYLON.Vector3(0, Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_otherObstacle_3);
				directionalLight.excludedMeshes.push(newCubicWall_otherObstacle_3);
				newCubicWall_otherObstacle_3.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_otherObstacle_3, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_otherObstacle_3.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_otherObstacle_3.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_otherObstacle_3.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_otherObstacle_3.freezeWorldMatrix();
				newCubicWall_otherObstacle_3.convertToUnIndexedMesh();
				newCubicWall_otherObstacle_3.setEnabled(false);
			perimeter_walls.push(newCubicWall_otherObstacle_3);

			var newCubicWall_otherObstacle_4 = cubicWalls.clone();
				newCubicWall_otherObstacle_4.position = new BABYLON.Vector3(36, 3.5, 0);
				newCubicWall_otherObstacle_4.scaling = new BABYLON.Vector3(2.5, 0.5, 2.5);
				newCubicWall_otherObstacle_4.rotation = new BABYLON.Vector3(0, -Math.PI/8, 0);
				hemisphericLight.excludedMeshes.push(newCubicWall_otherObstacle_4);
				directionalLight.excludedMeshes.push(newCubicWall_otherObstacle_4);
				newCubicWall_otherObstacle_4.physicsImpostor = new BABYLON.PhysicsImpostor(newCubicWall_otherObstacle_4, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10000, restitution: 0});
				newCubicWall_otherObstacle_4.physicsImpostor.physicsBody.inertia.setZero();
				newCubicWall_otherObstacle_4.physicsImpostor.physicsBody.invInertia.setZero();
				newCubicWall_otherObstacle_4.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCubicWall_otherObstacle_4.freezeWorldMatrix();
				newCubicWall_otherObstacle_4.convertToUnIndexedMesh();
				newCubicWall_otherObstacle_4.setEnabled(false);
			perimeter_walls.push(newCubicWall_otherObstacle_4);

			var newCylindricWall_otherObstacle = BABYLON.Mesh.CreateCylinder("newCylindricWall_otherObstacle", 5, 6, 6, 10, 1, scene, BABYLON.Mesh.DEFAULT);
				newCylindricWall_otherObstacle.position = new BABYLON.Vector3(36, 6.5, 0);
				hemisphericLight.excludedMeshes.push(newCylindricWall_otherObstacle);
				directionalLight.excludedMeshes.push(newCylindricWall_otherObstacle);
				newCylindricWall_otherObstacle.physicsImpostor = new BABYLON.PhysicsImpostor(newCylindricWall_otherObstacle, BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 10000, restitution: 0});
				newCylindricWall_otherObstacle.physicsImpostor.physicsBody.inertia.setZero();
				newCylindricWall_otherObstacle.physicsImpostor.physicsBody.invInertia.setZero();
				newCylindricWall_otherObstacle.physicsImpostor.physicsBody.invInertiaWorld.setZero();
				newCylindricWall_otherObstacle.freezeWorldMatrix();
				newCylindricWall_otherObstacle.convertToUnIndexedMesh();
				newCylindricWall_otherObstacle.setEnabled(false);
			perimeter_walls.push(newCylindricWall_otherObstacle);

		});
		
	}

	//****************************BRAINSTEM (PLAYER) MESH IMPORT******************************
	var bodyBox = BABYLON.MeshBuilder.CreateBox("bodyBox",{ height: 7.0, width: 4.5, depth: 4.5 }, scene);
		bodyBox.position.y = 3.5;
	var bodyBoxMaterial = new BABYLON.StandardMaterial("bodyBoxMaterial", scene);
		bodyBoxMaterial.alpha = 0;
		bodyBox.material = bodyBoxMaterial;

	var meshShotStartPosition;

	var brainStem;
	var brainSkeleton;

	var startRotation10;
	var startRotation11;
	var startRotation12;
	var startRotation14;
	var startRotation15;
	var startRotation16;

	BABYLON.SceneLoader.ImportMesh("", "meshes/BrainStem/", "BrainStemMod.babylon", scene, function (meshes, particleSystems, skeletons, animationGroups) {

		brainStem = meshes[2];
		brainSkeleton = skeletons[0];
		brainStem.scaling.scaleInPlace(4.2);
		brainStem.position.y = -3.6;

		brainStem.parent = bodyBox;

		bodyBox.translate(BABYLON.Axis.Z, 60, BABYLON.Space.LOCAL);

		bodyBox.physicsImpostor = new BABYLON.PhysicsImpostor(bodyBox, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 150, restitution: 0});
		bodyBox.physicsImpostor.physicsBody.inertia.setZero();
		bodyBox.physicsImpostor.physicsBody.invInertia.setZero();
		bodyBox.physicsImpostor.physicsBody.invInertiaWorld.setZero();


		camera.target = bodyBox;

		meshShotStartPosition = BABYLON.MeshBuilder.CreateSphere("meshShotStartPosition", {diameterX: 0.1, diameterY: 0.1, diameterZ: 0.1}, scene);
		meshShotStartPosition.attachToBone(brainSkeleton.bones[4], brainStem);
		meshShotStartPosition.position.x = 0.4;

		//Adjust some skeleton
		brainSkeleton.bones[2].rotate(BABYLON.Axis.Y, Math.PI/4, BABYLON.Space.LOCAL);
		brainSkeleton.bones[2].rotate(BABYLON.Axis.Z, -Math.PI/8, BABYLON.Space.LOCAL);
		brainSkeleton.bones[10].rotate(BABYLON.Axis.X, Math.PI/8, BABYLON.Space.LOCAL);
		brainSkeleton.bones[10].rotate(BABYLON.Axis.Z, Math.PI/16, BABYLON.Space.LOCAL);
		brainSkeleton.bones[10].rotate(BABYLON.Axis.Y, Math.PI/16, BABYLON.Space.LOCAL);
		brainSkeleton.bones[11].rotate(BABYLON.Axis.Z, -Math.PI/8, BABYLON.Space.LOCAL);
		brainSkeleton.bones[14].rotate(BABYLON.Axis.Z, -Math.PI/64, BABYLON.Space.LOCAL);
		brainSkeleton.bones[14].rotate(BABYLON.Axis.Y, Math.PI/16, BABYLON.Space.LOCAL);
		brainSkeleton.bones[15].rotate(BABYLON.Axis.X, -Math.PI/16, BABYLON.Space.LOCAL);
		brainSkeleton.bones[16].rotate(BABYLON.Axis.Z, Math.PI/32, BABYLON.Space.LOCAL);
		brainSkeleton.bones[16].rotate(BABYLON.Axis.X, Math.PI/32, BABYLON.Space.LOCAL);
		brainSkeleton.bones[16].rotate(BABYLON.Axis.Y, Math.PI/16, BABYLON.Space.LOCAL);
		brainSkeleton.bones[12].rotate(BABYLON.Axis.X, Math.PI/32, BABYLON.Space.LOCAL);
		brainSkeleton.bones[12].rotate(BABYLON.Axis.Z, Math.PI/16, BABYLON.Space.LOCAL);
		brainSkeleton.bones[12].rotate(BABYLON.Axis.Y, -Math.PI/16, BABYLON.Space.LOCAL);
		//Bring the arms in shot position
		brainSkeleton.bones[3].rotate(BABYLON.Axis.X, -Math.PI/2, BABYLON.Space.LOCAL);
		brainSkeleton.bones[3].rotate(BABYLON.Axis.Z, Math.PI/2, BABYLON.Space.LOCAL);
		brainSkeleton.bones[5].rotate(BABYLON.Axis.Z, -Math.PI/4, BABYLON.Space.LOCAL);
		brainSkeleton.bones[5].rotate(BABYLON.Axis.X, -Math.PI/4, BABYLON.Space.LOCAL);
		brainSkeleton.bones[6].rotate(BABYLON.Axis.Y, -Math.PI/8, BABYLON.Space.LOCAL);

		startRotation10 =  brainSkeleton.bones[10].getRotation();
		startRotation11 =  brainSkeleton.bones[11].getRotation();
		startRotation12 =  brainSkeleton.bones[12].getRotation();
		startRotation14 =  brainSkeleton.bones[14].getRotation();
		startRotation15 =  brainSkeleton.bones[15].getRotation();
		startRotation16 =  brainSkeleton.bones[16].getRotation();

		scene.registerBeforeRender(function () {
			var dir = camera.getTarget().subtract(camera.position);
				dir.y = bodyBox.getDirection(new BABYLON.Vector3(0, 0, 1)).y;
				dir.z = -dir.z;
				dir.x = -dir.x;
			if(clicked){
				bodyBox.setDirection(dir);
				if(!alreadyWalking){
					walkForward(brainSpeed);
					alreadyWalking = true;
				}
				if(!outOfPosition){
					outOfPosition = true;
				}
			}
		});
	});

	//***********************WALKING ANIMATION OF BRAINSTEM**********************************
	var walkStepsCounter = 0;
	var outOfPosition = false;
	var walkForward = function(speed){
		outOfPosition = true;
		if((walkStepsCounter <= (15/(speed*10)))){
			brainSkeleton.bones[10].rotate(BABYLON.Axis.X, -speed/2.2, BABYLON.Space.LOCAL);
			if((walkStepsCounter <= (7/(speed*10)))){
				brainSkeleton.bones[11].rotate(BABYLON.Axis.Z, speed/1.7, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.X, speed/2, BABYLON.Space.LOCAL);
			}
		}else if((walkStepsCounter <= (22/(speed*10)))){
			brainSkeleton.bones[11].rotate(BABYLON.Axis.Z, -speed/1.7, BABYLON.Space.LOCAL);
			brainSkeleton.bones[12].rotate(BABYLON.Axis.X, -speed/2, BABYLON.Space.LOCAL);
		}else if (walkStepsCounter <= (37/(speed*10))){
			brainSkeleton.bones[10].rotate(BABYLON.Axis.X, speed/2.2, BABYLON.Space.LOCAL);
		}
		if (walkStepsCounter == (38/(speed*10))){
			brainSkeleton.bones[10].rotation = startRotation10;
			brainSkeleton.bones[11].rotation = startRotation11;
			brainSkeleton.bones[14].rotation = startRotation14;
			brainSkeleton.bones[16].rotation = startRotation16;
			outOfPosition = false;
		}
		if(walkStepsCounter <= (18/(speed*10))){
			brainSkeleton.bones[14].rotate(BABYLON.Axis.X, speed/3, BABYLON.Space.LOCAL);
			brainSkeleton.bones[16].rotate(BABYLON.Axis.X, -speed/4, BABYLON.Space.LOCAL);
			brainSkeleton.bones[16].rotate(BABYLON.Axis.Y, speed/12, BABYLON.Space.LOCAL);
			brainSkeleton.bones[16].rotate(BABYLON.Axis.Z, speed/12, BABYLON.Space.LOCAL);
		}else if(walkStepsCounter <= (36/(speed*10)) ){
			brainSkeleton.bones[14].rotate(BABYLON.Axis.X, -speed/3, BABYLON.Space.LOCAL);
			brainSkeleton.bones[16].rotate(BABYLON.Axis.X, speed/4, BABYLON.Space.LOCAL);
			brainSkeleton.bones[16].rotate(BABYLON.Axis.Y, -speed/12, BABYLON.Space.LOCAL);
			brainSkeleton.bones[16].rotate(BABYLON.Axis.Z, -speed/12, BABYLON.Space.LOCAL);
		}
		if(walkStepsCounter > (38/(speed*10))){
			if((walkStepsCounter <= (50/(speed*10)))){
				brainSkeleton.bones[14].rotate(BABYLON.Axis.X, -speed/2.2, BABYLON.Space.LOCAL);
				if((walkStepsCounter <= (45/(speed*10)))){
					brainSkeleton.bones[15].rotate(BABYLON.Axis.Z, -speed/1.7, BABYLON.Space.LOCAL);
					brainSkeleton.bones[16].rotate(BABYLON.Axis.X, speed/2, BABYLON.Space.LOCAL);
				}
			}else if((walkStepsCounter <= (60/(speed*10)))){
				brainSkeleton.bones[15].rotate(BABYLON.Axis.Z, speed/1.7, BABYLON.Space.LOCAL);
				brainSkeleton.bones[16].rotate(BABYLON.Axis.X, -speed/2, BABYLON.Space.LOCAL);
			}else if (walkStepsCounter <= (75/(speed*10))){
				brainSkeleton.bones[14].rotate(BABYLON.Axis.X, speed/2.2, BABYLON.Space.LOCAL);
			}else{
				brainSkeleton.bones[10].rotation = startRotation10;
				brainSkeleton.bones[11].rotation = startRotation11;
				brainSkeleton.bones[12].rotation = startRotation12;
				brainSkeleton.bones[14].rotation = startRotation14;
				brainSkeleton.bones[15].rotation = startRotation15;
				brainSkeleton.bones[16].rotation = startRotation16;
				walkStepsCounter = 0;
				outOfPosition = false;
			}
			if(walkStepsCounter <= (56/(speed*10))){
				brainSkeleton.bones[10].rotate(BABYLON.Axis.X, speed/3, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.X, -speed/4, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.Y, speed/16, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.Z, -speed/16, BABYLON.Space.LOCAL);
			}else if(walkStepsCounter <= (74/(speed*10)) ){
				brainSkeleton.bones[10].rotate(BABYLON.Axis.X, -speed/3, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.X, speed/4, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.Y, -speed/16, BABYLON.Space.LOCAL);
				brainSkeleton.bones[12].rotate(BABYLON.Axis.Z, speed/16, BABYLON.Space.LOCAL);
			}
		}
		if( (walkStepsCounter < (2/(speed*10))) && (walkStepsCounter > 0) ){
			brainWalkSound.play();
		}
		walkStepsCounter ++;
	}

	//****************************LITTLE ROBOT CONSTRUCTION*********************************
	{
		var eyematerial = new BABYLON.StandardMaterial("eyematerial", scene);
			eyematerial.diffuseTexture = new BABYLON.Texture("textures/eyerobot2.jpg", scene);

		var eyematerial2 = new BABYLON.StandardMaterial("eyematerial2", scene);
			eyematerial2.diffuseTexture = new BABYLON.Texture("textures/eyerobot3.jpg", scene);

		var steel = new BABYLON.StandardMaterial("steel", scene);
			steel.diffuseTexture = new BABYLON.Texture("textures/steel.jpg", scene);


		var wheelmaterial = new BABYLON.StandardMaterial("wheelmaterial", scene);
			wheelmaterial.diffuseTexture = new BABYLON.Texture("textures/wheel.jpg", scene);


		var colorblack = new BABYLON.StandardMaterial("black", scene);
			colorblack.diffuseColor = new BABYLON.Color3(0, 0, 0);

		var colorred = new BABYLON.StandardMaterial("red", scene);
			colorred.emissiveColor = new BABYLON.Color4(205, 0, 0, 0);


		var colorredlines = new BABYLON.StandardMaterial("red", scene);
			colorred.diffuseColor = new BABYLON.Color3(126, 0, 0);


		var original = BABYLON.MeshBuilder.CreateCylinder("original",{ height: 10, diameterTop: 15, diameterBottom: 18}, scene);
			original.setEnabled(true);
			original.position = new BABYLON.Vector3(0, 0.9, 0);
			original.material = steel;


		var sfe = BABYLON.Mesh.CreateSphere("sfe", 32,15,scene);
			sfe.position = new BABYLON.Vector3(0, 3, 0);
			sfe.parent = original;
			sfe.material = colorred;

		var dis = BABYLON.Mesh.CreateSphere("dis", 9,9,scene);
			dis.position = new BABYLON.Vector3(-5, 0, 0);
			dis.parent = original;
			dis.material = eyematerial;


		var ciltwo = BABYLON.MeshBuilder.CreateCylinder("ciltwo",{ height: 11, diameterTop: 17, diameterBottom: 20}, scene);
			ciltwo.parent = original;
			ciltwo.position = new BABYLON.Vector3(0, -13.5, 0);
			ciltwo.material = steel;


		//Array of points to construct a spiral with lines
		var myPoints = [];
		var deltaTheta = 0.009;
		var deltaY = 0.0004;
		var radius = 7.7;
		var theta = 0;
		var Y = -1.5;
		for (var i = 0; i<7000; i++) {
			myPoints.push(new BABYLON.Vector3(radius * Math.cos(theta), Y, radius * Math.sin(theta)));
			theta += deltaTheta;
			Y += deltaY
		}

		const red = new BABYLON.Color4(0.6,0,0,1)

		//Create lines
		var lines = BABYLON.MeshBuilder.CreateLines("spiral", { points: myPoints }, scene);
			lines.parent = original;
			lines.position = new BABYLON.Vector3(0, -6.5, 0);
			lines.color = BABYLON.Color3.Red();


		var foot = BABYLON.Mesh.CreateSphere("foot",32,13,scene);
			foot.parent = original;
			foot.position = new BABYLON.Vector3(0, -17, 0);
			foot.material = wheelmaterial;


		var arm1 = BABYLON.MeshBuilder.CreateCylinder("arm1",{ height: 4.5, diameterTop: 4, diameterBottom: 4}, scene);
			arm1.position = new BABYLON.Vector3(-4, 2, -8);
			arm1.rotate(BABYLON.Axis.X, -70, BABYLON.Space.LOCAL);
			arm1.rotate(BABYLON.Axis.Z, 70, BABYLON.Space.LOCAL);


		var armconj = BABYLON.MeshBuilder.CreateCylinder("armconj",{ height: 2.5, diameterTop: 4, diameterBottom: 4}, scene);
			armconj.parent = arm1;
			armconj.position = new BABYLON.Vector3(0, 3.5, 0);
			armconj.material = steel;


		var arm2 = BABYLON.MeshBuilder.CreateCylinder("arm2",{ height: 4.5, diameterTop: 4, diameterBottom: 4}, scene);
			arm2.parent = armconj;
			arm2.position = new BABYLON.Vector3(-1.5, 2.6, 0);
			arm2.rotate(BABYLON.Axis.Z, 0.7, BABYLON.Space.LOCAL);


		var sfearm = BABYLON.Mesh.CreateSphere("sfearm", 2.5,2.5,scene);
			sfearm.position = new BABYLON.Vector3(0, 3, 0);
			sfearm.material = steel;


		var pinz1 = BABYLON.MeshBuilder.CreateBox("pinz1", {height:4, width:1.5, depth:1.5}, scene);
			pinz1.position = new BABYLON.Vector3(0, 1, 2.7);
			pinz1.material = steel;
			pinz1.rotation.x = 1.2;


		var pinz2 = BABYLON.MeshBuilder.CreateBox("pinz2",{height:4, width:1.5, depth:1.5}, scene);
			pinz2.position = new BABYLON.Vector3(0, 1, -2.7);
			pinz2.rotation.x = -1.2;
			pinz2.material = steel;

		var pinz3 = BABYLON.MeshBuilder.CreateBox("pinz3",{height:5, width:1.5, depth:1.5}, scene);
			pinz3.parent = pinz1;
			pinz3.position = new BABYLON.Vector3(0, 2.7, -1.6);
			pinz3.material = steel;
			pinz3.rotation.x = -1.6;

		var pinz4 = BABYLON.MeshBuilder.CreateBox("pinz4",{height:5, width:1.5, depth:1.5}, scene);
			pinz4.parent = pinz2;
			pinz4.position = new BABYLON.Vector3(0, 2.7, 1.6);
			pinz4.material = steel;
			pinz4.rotation.x = -1.6;

		var pinz11 = BABYLON.MeshBuilder.CreateBox("pinz11", {height:4, width:1.5, depth:1.5}, scene);
			pinz11.position = new BABYLON.Vector3(2.7, 0.6, 0.2);
			pinz11.material = steel;
			pinz11.rotation.z = -1.2;

		var pinz22 = BABYLON.MeshBuilder.CreateBox("pinz22",{height:4, width:1.5, depth:1.5}, scene);
			pinz22.position = new BABYLON.Vector3(-2.7, 0.6, 0.2);
			pinz22.rotation.z = 1.2;
			pinz22.material = steel;

		var pinz33 = BABYLON.MeshBuilder.CreateBox("pinz33",{height:5, width:1.5, depth:1.5}, scene);
			pinz33.parent = pinz11;
			pinz33.position = new BABYLON.Vector3(-2, 2.7, 0);
			pinz33.material = steel;
			pinz33.rotation.z = 1.6;

		var pinz44 = BABYLON.MeshBuilder.CreateBox("pinz44",{height:5, width:1.5, depth:1.5}, scene);
			pinz44.parent = pinz22;
			pinz44.position = new BABYLON.Vector3(2, 2.7, 0);
			pinz44.material = steel;
			pinz44.rotation.z = 1.6;


		var arm1left = BABYLON.MeshBuilder.CreateCylinder("arm1left",{ height: 4.5, diameterTop: 4, diameterBottom: 4}, scene);
			arm1left.position = new BABYLON.Vector3(-4, 2, 8);
			arm1left.rotate(BABYLON.Axis.X, 70, BABYLON.Space.LOCAL);
			arm1left.rotate(BABYLON.Axis.Z, 70, BABYLON.Space.LOCAL);


		var armconjleft = BABYLON.MeshBuilder.CreateCylinder("armconjleft",{ height: 2.5, diameterTop: 4, diameterBottom: 4}, scene);
			armconjleft.parent = arm1left;
			armconjleft.position = new BABYLON.Vector3(0, 3.5, 0);
			armconjleft.material = steel;

		var arm2left = BABYLON.MeshBuilder.CreateCylinder("arm2left",{ height: 4.5, diameterTop: 4, diameterBottom: 4}, scene);
			arm2left.parent = armconjleft;
			arm2left.position = new BABYLON.Vector3(-1.5, 2.6, 0);
			arm2left.rotate(BABYLON.Axis.Z, 0.7, BABYLON.Space.LOCAL);

		var sfearmleft= BABYLON.Mesh.CreateSphere("sfearmleft", 2.5,2.5,scene);
			sfearmleft.rotate(BABYLON.Axis.Z, 0.08, BABYLON.Space.LOCAL);
			sfearmleft.position = new BABYLON.Vector3(0, 3, 0);
			sfearmleft.material = steel;

		var pinz1left = BABYLON.MeshBuilder.CreateBox("pinz1left", {height:4, width:1.5, depth:1.5}, scene);
			pinz1left.position = new BABYLON.Vector3(0, 1, 2.7);
			pinz1left.material = steel;
			pinz1left.rotation.x = 1.2;

		var pinz2left = BABYLON.MeshBuilder.CreateBox("pinz2left",{height:4, width:1.5, depth:1.5}, scene);
			pinz2left.position = new BABYLON.Vector3(0, 1, -2.7);
			pinz2left.rotation.x = -1.2;
			pinz2left.material = steel;

		var pinz3left = BABYLON.MeshBuilder.CreateBox("pinz3left",{height:5, width:1.5, depth:1.5}, scene);
			pinz3left.parent = pinz1left;
			pinz3left.position = new BABYLON.Vector3(0, 2.7, -1.6);
			pinz3left.material = steel;
			pinz3left.rotation.x = -1.6;

		var pinz4left = BABYLON.MeshBuilder.CreateBox("pinz4left",{height:5, width:1.5, depth:1.5}, scene);
			pinz4left.parent = pinz2left;
			pinz4left.position = new BABYLON.Vector3(0, 2.7, 1.6);
			pinz4left.material = steel;
			pinz4left.rotation.x = -1.6;

		var pinz11left = BABYLON.MeshBuilder.CreateBox("pinz11left", {height:4, width:1.5, depth:1.5}, scene);
			pinz11left.position = new BABYLON.Vector3(2.7, 0.6, 0.2);
			pinz11left.material = steel;
			pinz11left.rotation.z = -1.2;

		var pinz22left = BABYLON.MeshBuilder.CreateBox("pinz22",{height:4, width:1.5, depth:1.5}, scene);
			pinz22left.position = new BABYLON.Vector3(-2.7, 0.6, 0.2);
			pinz22left.rotation.z = 1.2;

			pinz22left.material = steel;

		var pinz33left = BABYLON.MeshBuilder.CreateBox("pinz33left",{height:5, width:1.5, depth:1.5}, scene);
			pinz33left.parent = pinz11left;
			pinz33left.position = new BABYLON.Vector3(-2, 2.7, 0);
			pinz33left.material = steel;
			pinz33left.rotation.z = 1.6;

		var pinz44left = BABYLON.MeshBuilder.CreateBox("pinz44left",{height:5, width:1.5, depth:1.5}, scene);
			pinz44left.parent = pinz22left;
			pinz44left.position = new BABYLON.Vector3(2, 2.7, 0);
			pinz44left.material = steel;
			pinz44left.rotation.z = 1.6;


	//HANDLING DIVISION OF ARMS IN MESHES
		var arraymesharms = [];
		var arraymesharms2 = [];
		var arraymesharmsleft = [];
		var arraymesharmsleft2 = [];

		arraymesharms = [arm1, armconj,arm2] 
		arraymesharms2 = [pinz1, pinz2, pinz3, pinz4, pinz11, pinz22, pinz33, pinz44];
		
		arraymesharmsleft = [arm1left,armconjleft, arm2left]
		arraymesharmsleft2 = [pinz1left, pinz2left,	pinz3left, pinz4left, pinz11left,	pinz22left, pinz33left, pinz44left];
		

	 	//RIGHT ARM
		var mesharms = BABYLON.Mesh.MergeMeshes(arraymesharms, true, true, undefined, false, true);
			mesharms.parent = original;
			mesharms.position = new BABYLON.Vector3(0, -13.5, 0);
		var mesharms2 = BABYLON.Mesh.MergeMeshes(arraymesharms2, true, true, undefined, false, true);
		
			sfearm.parent = mesharms;
			sfearm.position= new BABYLON.Vector3(-12.3,4,10);
			mesharms2.parent = sfearm;
			mesharms2.rotation.z = 1.6;


		//LEFT ARM
		var mesharmsleft = BABYLON.Mesh.MergeMeshes(arraymesharmsleft, true, true, undefined, false, true);
			mesharmsleft.parent = original;
			mesharmsleft.position = new BABYLON.Vector3(0, -13.5, 0);
		var mesharmsleft2 = BABYLON.Mesh.MergeMeshes(arraymesharmsleft2, true, true, undefined, false, true);

			sfearmleft.parent = mesharmsleft;
			sfearmleft.position = new BABYLON.Vector3(-12.3,4,-10);
			mesharmsleft2.parent = sfearmleft;
			mesharmsleft2.rotation.z = 1.6;


	//ROTATE LITTLE ROBOT IN THE BOX
	original.rotate(BABYLON.Axis.Y, 1.60, BABYLON.Space.LOCAL);

	//BODY BOX OF LITTLE ROBOTS
	var littleRobotBox = BABYLON.MeshBuilder.CreateCylinder("littleRobotBox",{ height: 5, diameterTop: 3, diameterBottom: 3}, scene);


	var littleRobotBoxMaterial = new BABYLON.StandardMaterial("littleRobotBoxMaterial", scene);
		littleRobotBoxMaterial.alpha = 0.3;
		littleRobotBox.material = bodyBoxMaterial;
		//bodyBox.visibility = 0.3;

	original.scaling = (new BABYLON.Vector3(0.16, 0.16,0.16));
	original.parent = littleRobotBox;
	original.position = new BABYLON.Vector3(0, 1.3,0);
	littleRobotBox.setEnabled(false);
	

	}
	//**************************************************************************************

	//****************************BIG ROBOT CONSTRUCTION*********************************
	{


		var steel1 = new BABYLON.StandardMaterial("steel1", scene);
			steel1.diffuseTexture = new BABYLON.Texture("textures/steel2.jpg", scene);

		var steelflower = new BABYLON.StandardMaterial("steelflower", scene);
			steelflower.diffuseTexture = new BABYLON.Texture("textures/steelflower.jpg", scene);
		
		var opaquehead = new BABYLON.StandardMaterial("opaque", scene);
			opaquehead.diffuseTexture = new BABYLON.Texture("textures/opaque.jpg", scene);

		var colorwhite = new BABYLON.StandardMaterial("white", scene);
			colorwhite.diffuseColor = new BABYLON.Color3(1, 1, 1);


		var arraymeshparent = [];
		var arraymeshbody = [];
		var arraymesharm1 = [];
		var arraymesharm2 = [];

		var cilboss = BABYLON.MeshBuilder.CreateCylinder("cilboss",{ height: 3, diameterTop: 16, diameterBottom: 16}, scene);
			arraymeshparent.push(cilboss);


		var ciltwoboss = BABYLON.MeshBuilder.CreateCylinder("ciltwoboss",{ height: 7, diameterTop: 19, diameterBottom: 19}, scene);
			ciltwoboss.position= new BABYLON.Vector3(0,-3,0);
			ciltwoboss.parent = cilboss;
			arraymeshparent.push(ciltwoboss);


		var cilthreeboss = BABYLON.MeshBuilder.CreateCylinder("cilthreeboss",{ height: 1, diameterTop: 17, diameterBottom: 15.5}, scene);
			cilthreeboss.position= new BABYLON.Vector3(0,-4.5,0);
			arraymeshbody.push(cilthreeboss);

		var cilfourboss = BABYLON.MeshBuilder.CreateCylinder("cilfourboss",{ height: 1, diameterTop: 15.5, diameterBottom: 13}, scene);
			cilfourboss.position= new BABYLON.Vector3(0,-1.8,0);
			cilfourboss.parent = cilthreeboss;
			arraymeshbody.push(cilfourboss);

		var cilfiveboss = BABYLON.MeshBuilder.CreateCylinder("cilfiveboss",{ height: 1, diameterTop: 13, diameterBottom: 11.5}, scene);
			cilfiveboss.position= new BABYLON.Vector3(0,-3.6,0);
			cilfiveboss.parent = cilthreeboss;
			arraymeshbody.push(cilfiveboss);

		var cilsixboss = BABYLON.MeshBuilder.CreateCylinder("cilsixboss",{ height: 1, diameterTop: 11.5, diameterBottom: 10}, scene);
			cilsixboss.position= new BABYLON.Vector3(0,-5.4,0);
			cilsixboss.parent = cilthreeboss;
			arraymeshbody.push(cilsixboss);

		var cilsevenboss = BABYLON.MeshBuilder.CreateCylinder("cilsevenboss",{ height: 1, diameterTop: 10, diameterBottom: 8.5}, scene);
			cilsevenboss.position= new BABYLON.Vector3(0,-7.2,0);
			cilsevenboss.parent = cilthreeboss;
			arraymeshbody.push(cilsevenboss);


		var mergeparent = BABYLON.Mesh.MergeMeshes(arraymeshparent, true, true, undefined, false, true);
			mergeparent.material = steelflower;

		var mergebody = BABYLON.Mesh.MergeMeshes(arraymeshbody, true, true, undefined, false, true);
			mergebody.parent = mergeparent;
			mergebody.position = new BABYLON.Vector3(0, -2.5, 0);
			mergebody.material = steel1;

		var sfeboss = BABYLON.Mesh.CreateSphere("sfeboss", 32,14,scene);
			sfeboss.parent= mergeparent;
			sfeboss.position= new BABYLON.Vector3(0,-1,0);
			sfeboss.material = opaquehead;

		var disboss = BABYLON.Mesh.CreateSphere("disboss", 2,4,scene);
			disboss.position= new BABYLON.Vector3(-8.5,-3,0);
			disboss.parent = mergeparent;
			disboss.material = colorred;


		var cilarm = BABYLON.MeshBuilder.CreateCylinder("cilarm",{ height: 0.4, diameterTop: 3, diameterBottom: 3}, scene);
			cilarm.rotation.x = 1.6;
			arraymesharm1.push(cilarm);


		var cilarm2 = BABYLON.MeshBuilder.CreateCylinder("cilarm2",{ height: 0.4, diameterTop: 5, diameterBottom: 5}, scene);
			cilarm2.position= new BABYLON.Vector3(0,-0.7,0);
			cilarm2.parent = cilarm;
			arraymesharm1.push(cilarm2);

		var cilarm3 = BABYLON.MeshBuilder.CreateCylinder("cilarm3",{ height: 0.4, diameterTop: 7, diameterBottom: 7}, scene);
			cilarm3.position= new BABYLON.Vector3(0,-0.7,0);
			cilarm3.parent = cilarm2;
			arraymesharm1.push(cilarm3);


		var cilarmbig = BABYLON.MeshBuilder.CreateCylinder("cilarmbig",{ height: 7, diameterTop: 4, diameterBottom: 4}, scene);
			cilarmbig.position= new BABYLON.Vector3(0,-3.3,1);
			cilarmbig.parent = cilarm3;
			cilarmbig.rotation.x = -0.3;
			arraymesharm1.push(cilarmbig);

		var cilarmconj = BABYLON.MeshBuilder.CreateCylinder("cilarmconj",{ height: 3, diameterTop: 4, diameterBottom: 4}, scene);
			cilarmconj.position= new BABYLON.Vector3(0,-5.2,0);
			cilarmconj.parent = cilarmbig;
			cilarmconj.rotation.x = 1.6;
			arraymesharm1.push(cilarmconj);

		var cilarmbig2 = BABYLON.MeshBuilder.CreateCylinder("cilarmbig2",{ height: 7, diameterTop: 4, diameterBottom: 2}, scene);
			cilarmbig2.position= new BABYLON.Vector3(0,-5.3,0);
			cilarmbig2.parent = cilarmconj;
			arraymesharm1.push(cilarmbig2);


		var cilarmapp = BABYLON.MeshBuilder.CreateCylinder("cilarmapp",{ height: 2, diameterTop: 3, diameterBottom: 3}, scene);
			cilarmapp.position= new BABYLON.Vector3(0,-4,0);
			cilarmapp.parent = cilarmbig2;
			cilarmapp.rotation.x = -1.6;
			arraymesharm1.push(cilarmapp);

		var cilarmcone1 = BABYLON.MeshBuilder.CreateCylinder("cilarmcone1",{ height: 1.5, diameterTop: 3, diameterBottom: 1}, scene);
			cilarmcone1.position= new BABYLON.Vector3(0,-1.8,0);
			cilarmcone1.parent = cilarmapp;
			arraymesharm1.push(cilarmcone1);

		var cilarmcone2 = BABYLON.MeshBuilder.CreateCylinder("cilarmcone2",{ height: 5, diameterTop: 0.2, diameterBottom: 3}, scene);
			cilarmcone2.position= new BABYLON.Vector3(0,3.3,0);
			cilarmcone2.parent = cilarmapp;
			arraymesharm1.push(cilarmcone2);


		var cilarmleft = BABYLON.MeshBuilder.CreateCylinder("cilarmleft",{ height: 0.4, diameterTop: 3, diameterBottom: 3}, scene);
			cilarmleft.rotation.x = 1.6;
			arraymesharm2.push(cilarmleft);


		var cilarm2left = BABYLON.MeshBuilder.CreateCylinder("cilarm2left",{ height: 0.4, diameterTop: 5, diameterBottom: 5}, scene);
			cilarm2left.position= new BABYLON.Vector3(0,0.7,0);
			cilarm2left.parent = cilarmleft;
			arraymesharm2.push(cilarm2left);

		var cilarm3left = BABYLON.MeshBuilder.CreateCylinder("cilarm3left",{ height: 0.4, diameterTop: 7, diameterBottom: 7}, scene);
			cilarm3left.position= new BABYLON.Vector3(0,0.7,0);
			cilarm3left.parent = cilarm2left;
			arraymesharm2.push(cilarm3left);


		var cilarmbigleft = BABYLON.MeshBuilder.CreateCylinder("cilarmbigleft",{ height: 7, diameterTop: 4, diameterBottom: 4}, scene);
			cilarmbigleft.position= new BABYLON.Vector3(0,3.3,1);
			cilarmbigleft.parent = cilarm3left;
			cilarmbigleft.rotation.x = +0.3;
			arraymesharm2.push(cilarmbigleft);

		var cilarmconjleft = BABYLON.MeshBuilder.CreateCylinder("cilarmconjleft",{ height: 3, diameterTop: 4, diameterBottom: 4}, scene);
			cilarmconjleft.position= new BABYLON.Vector3(0,5.2,0);
			cilarmconjleft.parent = cilarmbigleft;
			cilarmconjleft.rotation.x = 1.6;
			arraymesharm2.push(cilarmconjleft);

		var cilarmbig2left = BABYLON.MeshBuilder.CreateCylinder("cilarmbig2left",{ height: 7, diameterTop: 4, diameterBottom: 2}, scene);
			cilarmbig2left.position= new BABYLON.Vector3(0,-5.3,0);
			cilarmbig2left.parent = cilarmconjleft;
			arraymesharm2.push(cilarmbig2left);


		var cilarmappleft = BABYLON.MeshBuilder.CreateCylinder("cilarmappleft",{ height: 2, diameterTop: 3, diameterBottom: 3}, scene);
			cilarmappleft.position= new BABYLON.Vector3(0,-4,0);
			cilarmappleft.parent = cilarmbig2left;
			cilarmappleft.rotation.x = -1.6;
			arraymesharm2.push(cilarmappleft);

		var cilarmcone1left = BABYLON.MeshBuilder.CreateCylinder("cilarmcone1left",{ height: 1.5, diameterTop: 1, diameterBottom: 3}, scene);
			cilarmcone1left.position= new BABYLON.Vector3(0,1.8,0);
			cilarmcone1left.parent = cilarmappleft;
			arraymesharm2.push(cilarmcone1left);

		var cilarmcone2left = BABYLON.MeshBuilder.CreateCylinder("cilarmcone2left",{ height: 5, diameterTop: 3, diameterBottom: 0.2}, scene);
			cilarmcone2left.position= new BABYLON.Vector3(0,-3.3,0);
			cilarmcone2left.parent = cilarmappleft;
			arraymesharm2.push(cilarmcone2left);


		var mergearm1 = BABYLON.Mesh.MergeMeshes(arraymesharm1, true, true, undefined, false, true);
			mergearm1.parent = mergeparent;
			mergearm1.position = new BABYLON.Vector3(0, -3, -9.7);
			mergearm1.material = steel1;


		var mergearm2 = BABYLON.Mesh.MergeMeshes(arraymesharm2, true, true, undefined, false, true);
			mergearm2.parent = mergeparent;
			mergearm2.position = new BABYLON.Vector3(0, -3,9.7);
			mergearm2.material = steel1;


		var conefoot = BABYLON.MeshBuilder.CreateCylinder("conefoot",{ height: 6, diameterTop: 14, diameterBottom: 14}, scene);
			conefoot.parent = mergebody;
			conefoot.position = new BABYLON.Vector3(0, -15.7, 0);
			conefoot.material = steel;

		var sfefoot = BABYLON.Mesh.CreateSphere("sfefoot", 15,8,scene);
			sfefoot.parent= conefoot;
			sfefoot.position= new BABYLON.Vector3(0,-2,0);
			sfefoot.material = wheelmaterial;


		var bigRobotBox = BABYLON.MeshBuilder.CreateCylinder("bigRobotBox",{ height: 8.5, diameterTop: 8.5, diameterBottom: 8.5}, scene);

		var bigRobotBoxMaterial = new BABYLON.StandardMaterial("bigRobotBoxMaterial", scene);
		bigRobotBoxMaterial.alpha = 0.3;
		bigRobotBox.material = bodyBoxMaterial;

		//FINAL ADJUSTEMENTS
		mergeparent.scaling = (new BABYLON.Vector3(0.28, 0.28,0.28));
		mergeparent.parent = bigRobotBox;
		bigRobotBox.position = new BABYLON.Vector3(0, 30,0);
		mergeparent.position = new BABYLON.Vector3(0, 2.6,0);
		mergeparent.rotate(BABYLON.Axis.Y, 1.60, BABYLON.Space.LOCAL);

		//Health bar
		var bigRobotHealthBarMaterial = new BABYLON.StandardMaterial("bigRobotHealthBarMaterial", scene);
			bigRobotHealthBarMaterial.emissiveColor = BABYLON.Color3.Red();

		var bigRobotHealthBarContainerMaterial = new BABYLON.StandardMaterial("bigRobotHealthBarContainerMaterial", scene);
			bigRobotHealthBarContainerMaterial.emissiveColor = BABYLON.Color3.Black();

		var bigRobotHealthBar = new BABYLON.MeshBuilder.CreateBox("bigRobotHealthBar",{ height: 0.6, width: 3.8, depth: 0.11 }, scene);
			bigRobotHealthBar.material = bigRobotHealthBarMaterial;
		var bigRobotHealthBarContainer = new BABYLON.MeshBuilder.CreateBox("bigRobotHealthBarContainer",{ height: 0.9, width: 4.1, depth: 0.1 }, scene);
			bigRobotHealthBarContainer.position = new BABYLON.Vector3(0, 5, 0);
			bigRobotHealthBarContainer.material = bigRobotHealthBarContainerMaterial;

		bigRobotHealthBar.parent = bigRobotHealthBarContainer;
		bigRobotHealthBarContainer.parent = bigRobotBox;

		bigRobotBox.setEnabled(false);

	}
	//**************************************************************************************

	//****************************DISCS OF ENTRY OF ENEMIES*********************************
		{
		var materialentry = new BABYLON.StandardMaterial("red", scene);
			materialentry.emissiveColor = BABYLON.Color3.Gray();

		var vectorentry;
		var vectorentry2;
		var vectorentry3;
		var vectorentry4;


		var entry = BABYLON.MeshBuilder.CreateDisc("entry", {radius:4, arc:1, sideOrientation: BABYLON.Mesh.DOUBLESIDE},scene);

		if (ambientation ==0){
			entry.position = new BABYLON.Vector3(50, 0.4, 90);
			vectorentry= new BABYLON.Vector3(50, 0.4, 90);
		}
		else{
			entry.position = new BABYLON.Vector3(40, 0.4, 70);
			vectorentry = new BABYLON.Vector3(40, 0.4, 70);
		}
			entry.rotate(BABYLON.Axis.X, 1.58,scene);
			entry.material = materialentry;

		var entry2 = BABYLON.MeshBuilder.CreateDisc("entry2", {radius:4, arc:1, sideOrientation: BABYLON.Mesh.DOUBLESIDE},scene);
		if (ambientation ==0){
			entry2.position = new BABYLON.Vector3(-50, 0.4, 90);
			vectorentry2 = new BABYLON.Vector3(-50, 0.4, 90);
		}
		else{
			entry2.position = new BABYLON.Vector3(-70, 0.4, 70);
			vectorentry2 = new BABYLON.Vector3(-70, 0.4, 70);
		}

			entry2.rotate(BABYLON.Axis.X, 1.58,scene);
			entry2.material = materialentry;

		var entry3 = BABYLON.MeshBuilder.CreateDisc("entry3", {radius:4, arc:1, sideOrientation: BABYLON.Mesh.DOUBLESIDE},scene);
		if (ambientation ==0){
			entry3.position = new BABYLON.Vector3(50, 0.4, -90);
			vectorentry3 = new BABYLON.Vector3(50, 0.4, -90);
		}
		else{
			entry3.position = new BABYLON.Vector3(40, 0.4, -40);
			vectorentry3 = new BABYLON.Vector3(40, 0.4, -40);
		}

			entry3.rotate(BABYLON.Axis.X, 1.58,scene);
			entry3.material = materialentry;

		var entry4 = BABYLON.MeshBuilder.CreateDisc("entry4", {radius:4, arc:1, sideOrientation: BABYLON.Mesh.DOUBLESIDE},scene);
		if (ambientation ==0){
			entry4.position = new BABYLON.Vector3(-50, 0.4, -90);
			vectorentry4 = new BABYLON.Vector3(-50, 0.4, -90);
		}
		else{
			entry4.position = new BABYLON.Vector3(-70, 0.4, -40);
			vectorentry4 = new BABYLON.Vector3(-70, 0.4, -40);
		}

			entry4.rotate(BABYLON.Axis.X, 1.58,scene);
			entry4.material = materialentry;

		vectorentry.y = 4;
		vectorentry2.y = 4;
		vectorentry3.y = 4;
		vectorentry4.y = 4;

		glowlayer.addIncludedOnlyMesh(entry);
		glowlayer.addIncludedOnlyMesh(entry2);
		glowlayer.addIncludedOnlyMesh(entry3);
		glowlayer.addIncludedOnlyMesh(entry4);

	}
	//**************************************************************************************


	//*******************FUNCTION TO CREATE THE LITTLE ROBOTS ENEMIES***********************
	var arrayclone = [];
	var enemynumber = arrayclone.length;
	var intero;
	var interobis = 0;
	var createLittleRobot = function(){

		enemynumber = arrayclone.length;

		var littleRobotStructure = {};

		littleRobotStructure["littleRobotMesh"] = littleRobotBox.clone();
		littleRobotStructure["littleRobotLife"] = littleRobotLife;
		littleRobotStructure["hitBlock"] = false;

		//CREATE CLONE
		var enemy = arrayclone.push(littleRobotStructure);
		glowlayer.addIncludedOnlyMesh(littleRobotStructure.littleRobotMesh.getChildren()[0].getChildren()[0]);
		glowlayer.addIncludedOnlyMesh(littleRobotStructure.littleRobotMesh.getChildren()[0].getChildren()[3]);
		intero = Math.floor(Math.random() * 4);

	

		while(interobis == intero){
			intero = Math.floor(Math.random() * 4);
		}

		while(interotwo == (intero+6)){
			intero = Math.floor(Math.random() * 4);
			if(intero == interobis){
				intero = Math.floor(Math.random() * 4);
			}
		}

		interobis = intero;

		if(enemynumber >= 0){
			if(intero == 0){
				arrayclone[enemynumber].littleRobotMesh.position = vectorentry;
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclone[enemynumber].littleRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}else if (intero == 1){
				arrayclone[enemynumber].littleRobotMesh.position = vectorentry2;
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclone[enemynumber].littleRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}else if (intero == 2){
				arrayclone[enemynumber].littleRobotMesh.position = vectorentry3;
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclone[enemynumber].littleRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}else if (intero == 3){
				arrayclone[enemynumber].littleRobotMesh.position = vectorentry4;
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclone[enemynumber].littleRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclone[enemynumber].littleRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}
		}





		const littleRobotIntervaId = setInterval(()=>{
			
			if(!boolgameend){
				//ROBOT HIT BRAIN FUNCTION
				if ((littleRobotStructure.littleRobotMesh.intersectsMesh(bodyBox)) && !(littleRobotStructure.hitBlock)) {
					littleRobotStructure.hitBlock = true;
					brainLife -= littleRobotDamage;
					if(brainLife <= 0){
						boolgameend = true;

						//HANDLING SCENES
						gameoverscenevar = createGameOverscene();
						changescene = 4;
					}
					setTimeout(()=>{		//time between each hit of one robot
						littleRobotStructure.hitBlock = false;
					}, littleRobotTimeBetweenHit)
				}
				if(littleRobotStructure.littleRobotLife <= 0){
					clearInterval(littleRobotIntervaId);
				}
			}else if(boolgameend){
				clearInterval(littleRobotIntervaId);
			}

		},15)		//Time every which there is the control of the meshes hit
	}
	//**************************************************************************************


	//*******************FUNCTION TO CREATE THE BIG ROBOTS ENEMIES***********************
	var interotwo;
	var interobistwo = 0;
	var max = 10;
	var min = 6;
	var arrayclonebig = [];
	var l = 0;
	var enemynumberbig = arrayclonebig.length;

	var createBigRobot = function(){

		enemynumberbig = arrayclonebig.length;

		var bigRobotStructure = {};

		bigRobotStructure["bigRobotMesh"] = bigRobotBox.clone();
		bigRobotStructure["bigRobotLife"] = bigRobotLife;
		bigRobotStructure["hitBlock"] = false;

		directionalLight.excludedMeshes.push(bigRobotStructure.bigRobotMesh.getChildren()[1]);
		hemisphericLight.excludedMeshes.push(bigRobotStructure.bigRobotMesh.getChildren()[1]);
		directionalLight.excludedMeshes.push(bigRobotStructure.bigRobotMesh.getChildren()[1].getChildren()[0]);
		hemisphericLight.excludedMeshes.push(bigRobotStructure.bigRobotMesh.getChildren()[1].getChildren()[0]);

		//CREATE CLONE
		var enemybig = arrayclonebig.push(bigRobotStructure);
		

		rotationforward.push(0);

		interotwo = Math.floor(Math.random() * (max - min)) + min;

		while(interobistwo == interotwo){
			interotwo = Math.floor(Math.random() * (max - min)) + min;
		}

		while(interotwo == (intero+6)){
			interotwo = Math.floor(Math.random() * (max - min)) + min;
			if(interotwo == interobistwo){
				interotwo = Math.floor(Math.random() * (max - min)) + min;
			}
		}
		interobistwo = interotwo;

		if(enemynumberbig >= 0){
			if(interotwo == 6){
				arrayclonebig[enemynumberbig].bigRobotMesh.position = vectorentry;
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclonebig[enemynumberbig].bigRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}else if (interotwo == 7){
				arrayclonebig[enemynumberbig].bigRobotMesh.position = vectorentry2;
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclonebig[enemynumberbig].bigRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}else if (interotwo == 8){
				arrayclonebig[enemynumberbig].bigRobotMesh.position = vectorentry3;
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclonebig[enemynumberbig].bigRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}else if(interotwo == 9){
				arrayclonebig[enemynumberbig].bigRobotMesh.position = vectorentry4;
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor = new BABYLON.PhysicsImpostor(arrayclonebig[enemynumberbig].bigRobotMesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 10, restitution: 0});
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.inertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertia.setZero();
				arrayclonebig[enemynumberbig].bigRobotMesh.physicsImpostor.physicsBody.invInertiaWorld.setZero();
			}
		}



		const bigRobotIntervaId = setInterval(()=>{
			
			if(!boolgameend){
				//ROBOT HIT BRAIN FUNCTION
				if ((bigRobotStructure.bigRobotMesh.intersectsMesh(bodyBox)) && !(bigRobotStructure.hitBlock)) {
					bigRobotStructure.hitBlock = true;
					brainLife -= bigRobotDamage;
					if(brainLife <= 0){
						boolgameend = true;
						comingfromScenelosing = true;
						gameoverscenevar = createGameOverscene();
						changescene = 4;
					}
					setTimeout(()=>{		//time between each hit of one robot
						bigRobotStructure.hitBlock = false;
					}, bigRobotTimeBetweenHit)
				}
				if(bigRobotStructure.bigRobotLife <= 0){
					clearInterval(bigRobotIntervaId);
				}
			}else if(boolgameend){
				clearInterval(bigRobotIntervaId);
			}

		},15)		//Time every which there is the control of the meshes hit

	}


	//**************************************************************************************



	//ANIMATIONS LITTLE ROBOTS
	var animationlittlerobot = function(){
		enemynumber = arrayclone.length;
		if(arrayclone.lenght != 0){
			var i = 0;
			for(i;i<enemynumber;i++){

				enemyFollowBrain(arrayclone[i].littleRobotMesh, littleRobotSpeed);

				arrayclone[i].littleRobotMesh.getChildren()[0].getChildren()[4].rotate(BABYLON.Axis.Z, 0.08, BABYLON.Space.LOCAL);//WHEEL MOVING
				arrayclone[i].littleRobotMesh.getChildren()[0].getChildren()[5].getChildren()[0].rotate(BABYLON.Axis.X, -0.2, BABYLON.Space.LOCAL);//ARM MOVING
				arrayclone[i].littleRobotMesh.getChildren()[0].getChildren()[6].getChildren()[0].rotate(BABYLON.Axis.X, 0.2, BABYLON.Space.LOCAL);//ARM MOVING

			}
		}
	}
	//**************************************************************************************

	//**************************ANIMATIONS BIG ROBOTS***************************************
	var animationBigRobot = function(){
		enemynumberbig = arrayclonebig.length;
		if(arrayclonebig.lenght != 0){
			var l = 0;
			for(l;l<enemynumberbig;l++){


				enemyFollowBrain(arrayclonebig[l].bigRobotMesh, bigRobotSpeed);

				arrayclonebig[l].bigRobotMesh.getChildren()[0].getChildren()[0].getChildren()[0].getChildren()[0].rotate(BABYLON.Axis.Z, 0.08, BABYLON.Space.LOCAL);//WHEEL MOVING
				

			}
		}
	}
	//**************************************************************************************


	//***************************ANIMATIONS ARMS BIG ROBOTS**************************************

	var rotationforward = [];
	var moveArmsBigRobot = function(){
		enemynumberbig = arrayclonebig.length;
		if(arrayclonebig.lenght != 0){
			var t = 0;
			for(t;t<enemynumberbig;t++){

				rotationforward[t]++;

				if(arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z < 1.5 && arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z <= 0
			 				&& rotationforward[t] < 20){
						arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z += 0.09;
				}
				else if(arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z >= 1.5 && arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z <= 0
									&& rotationforward[t] < 40){

							arrayclonebig[t].bigRobotMesh.getChildren()[0].rotate(BABYLON.Axis.Y, 0.3, BABYLON.Space.LOCAL);
							arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[0].rotation.y -= 0.3;
						}
				else if (arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z >= 0 && arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z <= 0
							&& rotationforward[t] < 60){
								arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z -= 0.09;
				}

				else if(arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z < 1.5 && arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z <= 0
								&& rotationforward[t] < 80){
									arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z += 0.09;
				}

				else if(arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z >= 1.5 && arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z <= 0
							&& rotationforward[t] < 97){
					arrayclonebig[t].bigRobotMesh.getChildren()[0].rotate(BABYLON.Axis.Y, -0.3, BABYLON.Space.LOCAL);
					arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[0].rotation.y += 0.3;
				}

				else if(arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z >= 0 && arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[3].rotation.z <= 0
						&& rotationforward[t] < 120){
					arrayclonebig[t].bigRobotMesh.getChildren()[0].getChildren()[4].rotation.z -= 0.09;
				}
				else if (rotationforward[t] < 170){
					//PAUSE THE ROBOTS BEFORE START AGAIN

				}
				else{
					rotationforward[t] = 0;
				}

			}

			}

		}
	//**************************************************************************************

	//*********************************LEVEL MANAGEMENT***************************************
	var littleRobotSpownInterval;
		var littleRobotSpownIntervalLvl1;
		var littleRobotSpownIntervalLvl2;
		var littleRobotSpownIntervalLvl3;
		var littleRobotSpownIntervalLvl4;
		var littleRobotSpownIntervalLvl5;
	var littleRobotNumber;
		var littleRobotNumberLvl1;
		var littleRobotNumberLvl2;
		var littleRobotNumberLvl3;
		var littleRobotNumberLvl4;
		var littleRobotNumberLvl5;
	var littleRobotSpeed;
		var littleRobotSpeedLvl1;
		var littleRobotSpeedLvl2;
		var littleRobotSpeedLvl3;
		var littleRobotSpeedLvl4;
		var littleRobotSpeedLvl5;
	var littleRobotLife;
		var littleRobotLifeLvl1;
		var littleRobotLifeLvl2;
		var littleRobotLifeLvl3;
		var littleRobotLifeLvl4;
		var littleRobotLifeLvl5;
	var littleRobotDamage;
		var littleRobotDamageLvl1;
		var littleRobotDamageLvl2;
		var littleRobotDamageLvl3;
		var littleRobotDamageLvl4;
		var littleRobotDamageLvl5;
	var littleRobotTimeBetweenHit;
		var littleRobotTimeBetweenHitLvl1;
		var littleRobotTimeBetweenHitLvl2;
		var littleRobotTimeBetweenHitLvl3;
		var littleRobotTimeBetweenHitLvl4;
		var littleRobotTimeBetweenHitLvl5;
	var bigRobotSpownInterval;
		var bigRobotSpownIntervalLvl1;
		var bigRobotSpownIntervalLvl2;
		var bigRobotSpownIntervalLvl3;
		var bigRobotSpownIntervalLvl4;
		var bigRobotSpownIntervalLvl5;
	var bigRobotNumber;
		var bigRobotNumberLvl1;
		var bigRobotNumberLvl2;
		var bigRobotNumberLvl3;
		var bigRobotNumberLvl4;
		var bigRobotNumberLvl5;
	var bigRobotSpeed;
		var bigRobotSpeedLvl1;
		var bigRobotSpeedLvl2;
		var bigRobotSpeedLvl3;
		var bigRobotSpeedLvl4;
		var bigRobotSpeedLvl5;
	var bigRobotLife;
		var bigRobotLifeLvl1;
		var bigRobotLifeLvl2;
		var bigRobotLifeLvl3;
		var bigRobotLifeLvl4;
		var bigRobotLifeLvl5;
	var bigRobotDamage;
		var bigRobotDamageLvl1;
		var bigRobotDamageLvl2;
		var bigRobotDamageLvl3;
		var bigRobotDamageLvl4;
		var bigRobotDamageLvl5;
	var bigRobotTimeBetweenHit;
		var bigRobotTimeBetweenHitLvl1;
		var bigRobotTimeBetweenHitLvl2;
		var bigRobotTimeBetweenHitLvl3;
		var bigRobotTimeBetweenHitLvl4;
		var bigRobotTimeBetweenHitLvl5;

	if(difficulty == 0){
		littleRobotSpownIntervalLvl1 = Math.ceil(5000/1.5);
		littleRobotSpownIntervalLvl2 = Math.ceil(5000/1.5);
		littleRobotSpownIntervalLvl3 = Math.ceil(3600/1.5);
		littleRobotSpownIntervalLvl4 = Math.ceil(2800/1.5);
		littleRobotSpownIntervalLvl5 = Math.ceil(2300/1.5);

		littleRobotNumberLvl1 = Math.ceil(4/1.5);
		littleRobotNumberLvl2 = Math.ceil(7/1.5);
		littleRobotNumberLvl3 = Math.ceil(9/1.5);
		littleRobotNumberLvl4 = Math.ceil(12/1.5);
		littleRobotNumberLvl5 = Math.ceil(15/1.5);

		littleRobotSpeedLvl1 = 0.1;
		littleRobotSpeedLvl2 = 0.2;
		littleRobotSpeedLvl3 = 0.25;
		littleRobotSpeedLvl4 = 0.3/1.5;
		littleRobotSpeedLvl5 = 0.33/1.5;

		littleRobotLifeLvl1 = Math.ceil(1/1.5);
		littleRobotLifeLvl2 = Math.ceil(1/1.5);
		littleRobotLifeLvl3 = Math.ceil(1/1.5);
		littleRobotLifeLvl4 = Math.ceil(1/1.5);
		littleRobotLifeLvl5 = Math.ceil(1/1.5);

		littleRobotDamageLvl1 = 1;
		littleRobotDamageLvl2 = 1;
		littleRobotDamageLvl3 = 1;
		littleRobotDamageLvl4 = 1;
		littleRobotDamageLvl5 = 1;

		littleRobotTimeBetweenHitLvl1 = 1000;
		littleRobotTimeBetweenHitLvl2 = 1000;
		littleRobotTimeBetweenHitLvl3 = 1000;
		littleRobotTimeBetweenHitLvl4 = 1000;
		littleRobotTimeBetweenHitLvl5 = 1000;

		bigRobotSpownIntervalLvl1 = 3000;
		bigRobotSpownIntervalLvl2 = 3000;
		bigRobotSpownIntervalLvl3 = 2000;
		bigRobotSpownIntervalLvl4 = 1500;
		bigRobotSpownIntervalLvl5 = 1500;
	
		bigRobotNumberLvl1 = Math.ceil(7/1.5);
		bigRobotNumberLvl2 = Math.ceil(12/1.5);
		bigRobotNumberLvl3 = Math.ceil(15/1.5);
		bigRobotNumberLvl4 = Math.ceil(18/1.5);
		bigRobotNumberLvl5 = Math.ceil(21/1.5);

		bigRobotSpeedLvl1 = 0.08;
		bigRobotSpeedLvl2 = 0.1;
		bigRobotSpeedLvl3 = 0.12;
		bigRobotSpeedLvl4 = 0.13;
		bigRobotSpeedLvl5 = 0.15;

		bigRobotLifeLvl1 = 2;
		bigRobotLifeLvl2 = 2;
		bigRobotLifeLvl3 = 2;
		bigRobotLifeLvl4 = 3;
		bigRobotLifeLvl5 = 3;

		bigRobotDamageLvl1 = 1;
		bigRobotDamageLvl2 = 2;
		bigRobotDamageLvl3 = 2;
		bigRobotDamageLvl4 = 2;
		bigRobotDamageLvl5 = 2;

		bigRobotTimeBetweenHitLvl1 = 2500;
		bigRobotTimeBetweenHitLvl2 = 3000;
		bigRobotTimeBetweenHitLvl3 = 3000;
		bigRobotTimeBetweenHitLvl4 = 3000;
		bigRobotTimeBetweenHitLvl5 = 3000;

	} else if(difficulty == 1){

		littleRobotSpownIntervalLvl1 = 5000;
		littleRobotSpownIntervalLvl2 = 5000;
		littleRobotSpownIntervalLvl3 = 3600;
		littleRobotSpownIntervalLvl4 = 2800;
		littleRobotSpownIntervalLvl5 = 2300;

		littleRobotNumberLvl1 = 4;
		littleRobotNumberLvl2 = 7;
		littleRobotNumberLvl3 = 9;
		littleRobotNumberLvl4 = 12;
		littleRobotNumberLvl5 = 15;

		littleRobotSpeedLvl1 = 0.1;
		littleRobotSpeedLvl2 = 0.2;
		littleRobotSpeedLvl3 = 0.25;
		littleRobotSpeedLvl4 = 0.3;
		littleRobotSpeedLvl5 = 0.33;

		littleRobotLifeLvl1 = 1;
		littleRobotLifeLvl2 = 1;
		littleRobotLifeLvl3 = 1;
		littleRobotLifeLvl4 = 1;
		littleRobotLifeLvl5 = 1;

		littleRobotDamageLvl1 = 1;
		littleRobotDamageLvl2 = 1;
		littleRobotDamageLvl3 = 1;
		littleRobotDamageLvl4 = 1;
		littleRobotDamageLvl5 = 1;

		littleRobotTimeBetweenHitLvl1 = 1000;
		littleRobotTimeBetweenHitLvl2 = 1000;
		littleRobotTimeBetweenHitLvl3 = 1000;
		littleRobotTimeBetweenHitLvl4 = 1000;
		littleRobotTimeBetweenHitLvl5 = 1000;

		bigRobotSpownIntervalLvl1 = 3000;
		bigRobotSpownIntervalLvl2 = 3000;
		bigRobotSpownIntervalLvl3 = 2000;
		bigRobotSpownIntervalLvl4 = 1500;
		bigRobotSpownIntervalLvl5 = 1500;
	
		bigRobotNumberLvl1 = 7;
		bigRobotNumberLvl2 = 12;
		bigRobotNumberLvl3 = 15;
		bigRobotNumberLvl4 = 18;
		bigRobotNumberLvl5 = 21;

		bigRobotSpeedLvl1 = 0.08;
		bigRobotSpeedLvl2 = 0.1;
		bigRobotSpeedLvl3 = 0.12;
		bigRobotSpeedLvl4 = 0.13;
		bigRobotSpeedLvl5 = 0.15;

		bigRobotLifeLvl1 = 2;
		bigRobotLifeLvl2 = 2;
		bigRobotLifeLvl3 = 3;
		bigRobotLifeLvl4 = 3;
		bigRobotLifeLvl5 = 4;

		bigRobotDamageLvl1 = 1;
		bigRobotDamageLvl2 = 2;
		bigRobotDamageLvl3 = 2;
		bigRobotDamageLvl4 = 2;
		bigRobotDamageLvl5 = 2;

		bigRobotTimeBetweenHitLvl1 = 2500;
		bigRobotTimeBetweenHitLvl2 = 3000;
		bigRobotTimeBetweenHitLvl3 = 3000;
		bigRobotTimeBetweenHitLvl4 = 3000;
		bigRobotTimeBetweenHitLvl5 = 3000;

	} else if(difficulty == 2){

		littleRobotSpownIntervalLvl1 = 5000;
		littleRobotSpownIntervalLvl2 = 5000;
		littleRobotSpownIntervalLvl3 = 3600;
		littleRobotSpownIntervalLvl4 = 2800;
		littleRobotSpownIntervalLvl5 = 2300;

		littleRobotNumberLvl1 = 5;
		littleRobotNumberLvl2 = 8;
		littleRobotNumberLvl3 = 10;
		littleRobotNumberLvl4 = 13;
		littleRobotNumberLvl5 = 17;

		littleRobotSpeedLvl1 = 0.15;
		littleRobotSpeedLvl2 = 0.25;
		littleRobotSpeedLvl3 = 0.3;
		littleRobotSpeedLvl4 = 0.33;
		littleRobotSpeedLvl5 = 0.35;

		littleRobotLifeLvl1 = 1;
		littleRobotLifeLvl2 = 1;
		littleRobotLifeLvl3 = 1;
		littleRobotLifeLvl4 = 1;
		littleRobotLifeLvl5 = 1;

		littleRobotDamageLvl1 = 1;
		littleRobotDamageLvl2 = 1;
		littleRobotDamageLvl3 = 1;
		littleRobotDamageLvl4 = 1;
		littleRobotDamageLvl5 = 1;

		littleRobotTimeBetweenHitLvl1 = 1000;
		littleRobotTimeBetweenHitLvl2 = 1000;
		littleRobotTimeBetweenHitLvl3 = 1000;
		littleRobotTimeBetweenHitLvl4 = 800;
		littleRobotTimeBetweenHitLvl5 = 800;

		bigRobotSpownIntervalLvl1 = 3000;
		bigRobotSpownIntervalLvl2 = 3000;
		bigRobotSpownIntervalLvl3 = 2000;
		bigRobotSpownIntervalLvl4 = 1500;
		bigRobotSpownIntervalLvl5 = 1500;
	
		bigRobotNumberLvl1 = 8;
		bigRobotNumberLvl2 = 12;
		bigRobotNumberLvl3 = 16;
		bigRobotNumberLvl4 = 19;
		bigRobotNumberLvl5 = 23;

		bigRobotSpeedLvl1 = 0.1;
		bigRobotSpeedLvl2 = 0.12;
		bigRobotSpeedLvl3 = 0.14;
		bigRobotSpeedLvl4 = 0.16;
		bigRobotSpeedLvl5 = 0.17;

		bigRobotLifeLvl1 = 2;
		bigRobotLifeLvl2 = 3;
		bigRobotLifeLvl3 = 3;
		bigRobotLifeLvl4 = 4;
		bigRobotLifeLvl5 = 4;

		bigRobotDamageLvl1 = 1;
		bigRobotDamageLvl2 = 2;
		bigRobotDamageLvl3 = 2;
		bigRobotDamageLvl4 = 2;
		bigRobotDamageLvl5 = 3;

		bigRobotTimeBetweenHitLvl1 = 2000;
		bigRobotTimeBetweenHitLvl2 = 2500;
		bigRobotTimeBetweenHitLvl3 = 2500;
		bigRobotTimeBetweenHitLvl4 = 3000;
		bigRobotTimeBetweenHitLvl5 = 3000;
	}

	var currentLevel = 1;
	
	var totLittleRobotXlvl = 0;
	var totBigRobotXlvl = 0;
	var totRobotXlvl = 0;

	var totRobotLvl1 = littleRobotNumberLvl1 + bigRobotNumberLvl1;
	var totRobotLvl2 = totRobotLvl1 + littleRobotNumberLvl2 + bigRobotNumberLvl2;
	var totRobotLvl3 = totRobotLvl2 + littleRobotNumberLvl3 + bigRobotNumberLvl3;
	var totRobotLvl4 = totRobotLvl3 + littleRobotNumberLvl4 + bigRobotNumberLvl4;
	var totRobotLvl5 = totRobotLvl4 + littleRobotNumberLvl5 + bigRobotNumberLvl5;

	littleRobotSpownInterval = littleRobotSpownIntervalLvl1;
	littleRobotNumber = littleRobotNumberLvl1;
	littleRobotSpeed = littleRobotSpeedLvl1;
	littleRobotLife = littleRobotLifeLvl1;
	littleRobotDamage = littleRobotDamageLvl1;
	littleRobotTimeBetweenHit = littleRobotTimeBetweenHitLvl1;


	bigRobotSpownInterval = bigRobotSpownIntervalLvl1;
	bigRobotNumber = bigRobotNumberLvl1;
	bigRobotSpeed = bigRobotSpeedLvl1;
	bigRobotLife = bigRobotLifeLvl1;
	bigRobotDamage = bigRobotDamageLvl1;
	bigRobotTimeBetweenHit = bigRobotTimeBetweenHitLvl1;

	var timeoutXlvlTriggered = false;

	const checkLevelStatus = setInterval(()=>{
		
		if(!boolgameend){
			if( (totRobotXlvl == totRobotLvl1) && (arrayclonebig.length == 0) && (arrayclone.length == 0)){

				currentLevel = 2;

				if(!timeoutXlvlTriggered){

					timeoutXlvlTriggered = true;

					cylindricBulletAmmoFlag = true;
					specialnumber++;
					specialAmmoNumber.text = specialnumber.toString();
					playingGUIadvancedTexture.addControl(specialShotAmmoImage);
					playingGUIadvancedTexture.addControl(specialAmmoNumber);

					levelup.play();
					advancedTexture.addControl(imagelevel, 0, 0);

					setTimeout(function(){

						littleRobotSpownInterval = littleRobotSpownIntervalLvl2;
						littleRobotNumber = littleRobotNumberLvl2;
						littleRobotSpeed = littleRobotSpeedLvl2;
						littleRobotLife = littleRobotLifeLvl2;
						littleRobotDamage = littleRobotDamageLvl2;
						littleRobotTimeBetweenHit = littleRobotTimeBetweenHitLvl2;


						bigRobotSpownInterval = bigRobotSpownIntervalLvl2;
						bigRobotNumber = bigRobotNumberLvl2;
						bigRobotSpeed = bigRobotSpeedLvl2;
						bigRobotLife = bigRobotLifeLvl2;
						bigRobotDamage = bigRobotDamageLvl2;
						bigRobotTimeBetweenHit = bigRobotTimeBetweenHitLvl2;

						totBigRobotXlvl = 0;
						totLittleRobotXlvl = 0;

						advancedTexture.removeControl(imagelevel, 0, 0);

						flagLvlUpMusic = true;

					}, 5000);
				}

			}else if( (totRobotXlvl == totRobotLvl2) && (arrayclonebig.length == 0) && (arrayclone.length == 0)){

				currentLevel = 3;

				if(!timeoutXlvlTriggered){

					timeoutXlvlTriggered = true;

					cylindricBulletAmmoFlag = true;
					specialnumber++;
					specialAmmoNumber.text = specialnumber.toString();
					playingGUIadvancedTexture.addControl(specialShotAmmoImage);
					playingGUIadvancedTexture.addControl(specialAmmoNumber);

					advancedTexture.addControl(imagelevel, 0, 0);
					levelup.play();

					setTimeout(function(){

						littleRobotSpownInterval = littleRobotSpownIntervalLvl3;
						littleRobotNumber = littleRobotNumberLvl3;
						littleRobotSpeed = littleRobotSpeedLvl3;
						littleRobotLife = littleRobotLifeLvl3;
						littleRobotDamage = littleRobotDamageLvl3;
						littleRobotTimeBetweenHit = littleRobotTimeBetweenHitLvl3;


						bigRobotSpownInterval = bigRobotSpownIntervalLvl3;
						bigRobotNumber = bigRobotNumberLvl3;
						bigRobotSpeed = bigRobotSpeedLvl3;
						bigRobotLife = bigRobotLifeLvl3;
						bigRobotDamage = bigRobotDamageLvl3;
						bigRobotTimeBetweenHit = bigRobotTimeBetweenHitLvl3;

						totBigRobotXlvl = 0;
						totLittleRobotXlvl = 0;

						advancedTexture.removeControl(imagelevel, 0, 0);

						flagLvlUpMusic = true;

					}, 5000);
				}

			}else if( (totRobotXlvl == totRobotLvl3) && ((totBigRobotXlvl) == bigRobotNumberLvl3) && (arrayclonebig.length == 0) && (arrayclone.length == 0)){

				currentLevel = 4;

				if(!timeoutXlvlTriggered){

					timeoutXlvlTriggered = true;

					cylindricBulletAmmoFlag = true;
					specialnumber++;
					specialAmmoNumber.text = specialnumber.toString();
					playingGUIadvancedTexture.addControl(specialShotAmmoImage);
					playingGUIadvancedTexture.addControl(specialAmmoNumber);

					advancedTexture.addControl(imagelevel, 0, 0);
					levelup.play();

					setTimeout(function(){

						littleRobotSpownInterval = littleRobotSpownIntervalLvl4;
						littleRobotNumber = littleRobotNumberLvl4;
						littleRobotSpeed = littleRobotSpeedLvl4;
						littleRobotLife = littleRobotLifeLvl4;
						littleRobotDamage = littleRobotDamageLvl4;
						littleRobotTimeBetweenHit = littleRobotTimeBetweenHitLvl4;


						bigRobotSpownInterval = bigRobotSpownIntervalLvl4;
						bigRobotNumber = bigRobotNumberLvl4;
						bigRobotSpeed = bigRobotSpeedLvl4;
						bigRobotLife = bigRobotLifeLvl4;
						bigRobotDamage = bigRobotDamageLvl4;
						bigRobotTimeBetweenHit = bigRobotTimeBetweenHitLvl4;

						totBigRobotXlvl = 0;
						totLittleRobotXlvl = 0;

						advancedTexture.removeControl(imagelevel, 0, 0);

						flagLvlUpMusic = true;

					}, 5000);
				}

			}else if( (totRobotXlvl == totRobotLvl4) && (arrayclonebig.length == 0) && (arrayclone.length == 0)){

				currentLevel = 5;

				if(!timeoutXlvlTriggered){

					timeoutXlvlTriggered = true;

					cylindricBulletAmmoFlag = true;
					specialnumber++;
					specialAmmoNumber.text = specialnumber.toString();
					playingGUIadvancedTexture.addControl(specialShotAmmoImage);
					playingGUIadvancedTexture.addControl(specialAmmoNumber);

					advancedTexture.addControl(imagelevel, 0, 0);
					levelup.play();

					setTimeout(function(){

						littleRobotSpownInterval = littleRobotSpownIntervalLvl5;
						littleRobotNumber = littleRobotNumberLvl5;
						littleRobotSpeed = littleRobotSpeedLvl5;
						littleRobotLife = littleRobotLifeLvl5;
						littleRobotDamage = littleRobotDamageLvl5;
						littleRobotTimeBetweenHit = littleRobotTimeBetweenHitLvl5;


						bigRobotSpownInterval = bigRobotSpownIntervalLvl5;
						bigRobotNumber = bigRobotNumberLvl5;
						bigRobotSpeed = bigRobotSpeedLvl5;
						bigRobotLife = bigRobotLifeLvl5;
						bigRobotDamage = bigRobotDamageLvl5;
						bigRobotTimeBetweenHit = bigRobotTimeBetweenHitLvl5;

						totBigRobotXlvl = 0;
						totLittleRobotXlvl = 0;

						advancedTexture.removeControl(imagelevel, 0, 0);

						flagLvlUpMusic = true;

					}	,5000);
				}

			}else if( (totRobotXlvl == totRobotLvl5) && (arrayclonebig.length == 0) && (arrayclone.length == 0) ){

				cylindricBulletAmmoFlag = true;
				playingGUIadvancedTexture.addControl(specialShotAmmoImage);
				playingGUIadvancedTexture.addControl(specialAmmoNumber);

				boolgameend = true;

				winningScenevar = createwinningScene();
				changescene = 5;

			}
		}else if(boolgameend){
			clearInterval(checkLevelStatus);
		}
	}, 10);


	//INSERT LITTLE ROBOTS
	var insertLittleRobots =  setInterval(function () {
		if(!boolgameend){
			if(totLittleRobotXlvl < littleRobotNumber && boolgamestart == true){
				totLittleRobotXlvl ++;
				totRobotXlvl ++;
				createLittleRobot();
				timeoutXlvlTriggered = false;
			}
		}else if(boolgameend){
			clearInterval(insertLittleRobots);
		}
	}, littleRobotSpownInterval);


	//INSERT BIG ROBOTS
	var insertBigRobots =  setInterval(function () {
		if(!boolgameend){
			if(totBigRobotXlvl < bigRobotNumber && boolgamestart == true){
				totBigRobotXlvl ++;
				totRobotXlvl ++;
				createBigRobot();
				timeoutXlvlTriggered = false;
			}
		}else if(boolgameend){
			clearInterval(insertBigRobots);
		}
	}, bigRobotSpownInterval);

	//**************************************************************************************

	//*************************BEFORE RENDERE WITH COMMANDS*********************************
	var brainSpeed = 0.15;
	var brainLife = 7;

	var bulletsRate = 400;
	var bulletsRange = 1000;
    var specialnumber = 1;
	var sphericBulletDamage = 1;
	var cylindricBulletAmmoFlag = true;

	var alreadyWalking = false;

	var boolrandom = true;
	var boolLdown = false;

	scene.registerAfterRender(function () {
		if ((map["w"] || map["W"])) {
			bodyBox.translate(BABYLON.Axis.Z, -brainSpeed, BABYLON.Space.LOCAL);
			if(!alreadyWalking){
				walkForward(brainSpeed);
				alreadyWalking = true;
			}
			if(!outOfPosition){
				outOfPosition = true;
			}
		}
		if ((map["s"] || map["S"])) {
			bodyBox.translate(BABYLON.Axis.Z, brainSpeed, BABYLON.Space.LOCAL);
			if(!alreadyWalking){
				walkForward(brainSpeed);
				alreadyWalking = true;
			}
			if(!outOfPosition){
				outOfPosition = true;
			}
		}
		if ((map["a"] || map["A"])) {
			bodyBox.translate(BABYLON.Axis.X, brainSpeed, BABYLON.Space.LOCAL);
			if(!alreadyWalking){
				walkForward(brainSpeed);
				alreadyWalking = true;
			}
			if(!outOfPosition){
				outOfPosition = true;
			}
		}
		if ((map["d"] || map["D"])) {
			bodyBox.translate(BABYLON.Axis.X, -brainSpeed, BABYLON.Space.LOCAL);
			if(!alreadyWalking){
				walkForward(brainSpeed);
				alreadyWalking = true;
			}
			if(!outOfPosition){
				outOfPosition = true;
			}
		}
		if((!alreadyWalking) && (outOfPosition)){
			walkForward(brainSpeed);
		}
		alreadyWalking = false;

		currentTime = new Date().getTime();
		if ((map[" "] || map[" "]) && (currentTime >= nextBulletTime)) {
				fireBullet(bulletsRate, bulletsRange);
		}
		if ((map["v"] || map["V"]) && (currentTime >= nextBulletTime) && (cylindricBulletAmmoFlag)) {

			fireBulletCylinder(bulletsRate, bulletsRange);

			if(specialnumber == 0){
				cylindricBulletAmmoFlag = false;
  				playingGUIadvancedTexture.removeControl(specialShotAmmoImage);
				playingGUIadvancedTexture.removeControl(specialAmmoNumber);
			}

		}
		
		if((map["l"] || map["L"]) && (!boolLdown)){
			playingGUIadvancedTexture.addControl(rectanglecommgame);
			playingGUIadvancedTexture.addControl(imagecommgame);
			boolLdown = true;

		}
		
		if(boolLdown && !(map["l"] || map["L"]) ){
			playingGUIadvancedTexture.removeControl(rectanglecommgame);
			playingGUIadvancedTexture.removeControl(imagecommgame);
			boolLdown = false;
		}

		

		animationlittlerobot();
		animationBigRobot();
		moveArmsBigRobot();

	});

	//*******************ENEMY FOLLOW BRAIN FUNCTION********************
	var enemyFollowBrain = function(enemyMesh, enemySpeed){
		enemyMesh.translate(BABYLON.Axis.Z, enemySpeed, BABYLON.Space.LOCAL);
		var enemyDir = enemyMesh.getAbsolutePosition().subtract(bodyBox.getAbsolutePosition());
				enemyDir.y = bodyBox.getDirection(new BABYLON.Vector3(0, 0, 1)).y;
				enemyDir.z = -enemyDir.z;
				enemyDir.x = -enemyDir.x;
		enemyMesh.setDirection(enemyDir);
	}

	//*********************************SHOT GUNS****************************************

	var nextBulletTime = new Date().getTime();
	var currentTime;
	var forward = new BABYLON.Vector3(0, 0, -1);
	var bulletMaterialSphere = new BABYLON.StandardMaterial("bulletMaterial", scene);
		bulletMaterialSphere.emissiveColor = BABYLON.Color3.Teal();
	var bulletMaterialCylinder = new BABYLON.StandardMaterial("bulletMaterial", scene);
		bulletMaterialCylinder.emissiveColor = BABYLON.Color3.Purple();

	//****************************SPHERIC BULLETS*****************************
	var fireBullet = function (bulletsRate, bulletsRange) {

		var direction = bodyBox.getDirection(forward);
			direction.normalize();

		const bullet = BABYLON.Mesh.CreateSphere(`${currentTime}bullet`, 16, 0.5, scene);
			bullet.material = bulletMaterialSphere;
			glowlayer.addIncludedOnlyMesh(bullet);
			nextBulletTime = new Date().getTime() + bulletsRate;
			directionalLight.excludedMeshes.push(bullet);
			bullet.position = meshShotStartPosition.getAbsolutePosition().clone();

		const bulletAction = scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnEveryFrameTrigger, function (evt) {
			bullet.position.addInPlace(direction);
		}));

		sphericLaserShotSound.play();

		setTimeout(()=>{
			scene.actionManager.unregisterAction(bulletAction);
			bullet.dispose();
			clearInterval(bulletIntervaId);
		}, (bulletsRange/(engine.getFps()/65)))

		const bulletIntervaId = setInterval(()=>{
			if(!boolgameend){
				//Spheric bullets hit little robots
				for (var b = 0; b < arrayclone.length; b++){
					var cr = arrayclone[b];
					if (bullet.intersectsMesh(cr.littleRobotMesh, false)) {
						cr.littleRobotLife -= sphericBulletDamage;
						if(cr.littleRobotLife <= 0){
							cr.littleRobotMesh.dispose();
							arrayclone.splice(b, 1);
						}
						bullet.dispose();
						clearInterval(bulletIntervaId);
					}
				}
				//Spheric bullets hit big robots
				for (var b = 0; b < arrayclonebig.length; b++){
					var cr = arrayclonebig[b];
					if (bullet.intersectsMesh(cr.bigRobotMesh, false)) {

						//Life and lifebar
						var unit = (3.8*(cr.bigRobotLife/bigRobotLife));
						cr.bigRobotLife -= sphericBulletDamage;
						var hb = cr.bigRobotMesh.getChildren()[1].getChildren()[0];
						hb.scaling.x = cr.bigRobotLife/bigRobotLife;
						hb.translate(BABYLON.Axis.X, (unit*(1/cr.bigRobotLife))/2, BABYLON.Space.LOCAL);
						if(cr.bigRobotLife == 1 && bigRobotLife == 3){
							hb.translate(BABYLON.Axis.X, (unit*(1/cr.bigRobotLife))/4, BABYLON.Space.LOCAL);
						}else if(cr.bigRobotLife < 3 && bigRobotLife == 4){
							hb.translate(BABYLON.Axis.X, (unit*(1/cr.bigRobotLife))/(3*cr.bigRobotLife), BABYLON.Space.LOCAL);
						}

						if(cr.bigRobotLife <= 0){
							cr.bigRobotMesh.dispose();
							arrayclonebig.splice(b, 1);
							rotationforward.splice(b,1);

						}

						bullet.dispose();
						clearInterval(bulletIntervaId);
					}
				}
				//Spheric bullets hit walls
				for (var b = 0; b < perimeter_walls.length; b++){
					var cr = perimeter_walls[b];
					if (bullet.intersectsMesh(cr, false)) {
						bullet.dispose();
						clearInterval(bulletIntervaId);
					}
				}
			}else if(boolgameend){
				clearInterval(bulletIntervaId);
			}

		},10)
	}

	//***************************CYLINDRIC BULLETS****************************
	var fireBulletCylinder = function (bulletsRate, bulletsRange) {

		var forward = new BABYLON.Vector3(0, 0, -1);
		var direction = bodyBox.getDirection(forward);
			direction.normalize();

		const bullet = BABYLON.Mesh.CreateCylinder(`${currentTime}bullet`, 3.5, 0, 0.8, 10, 1, scene, BABYLON.Mesh.DEFAULT);
			bullet.material = bulletMaterialCylinder;
			glowlayer.addIncludedOnlyMesh(bullet);
			nextBulletTime = new Date().getTime() + bulletsRate;
			bullet.setDirection(direction);
			bullet.rotation.x = Math.PI/2;
			bullet.position = meshShotStartPosition.getAbsolutePosition().clone();
			directionalLight.excludedMeshes.push(bullet);

		const bulletAction = scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnEveryFrameTrigger, function (evt) {
			bullet.position.addInPlace(direction);
		}));

			specialLaserShotSound.play();
			specialnumber--;
			specialAmmoNumber.text = specialnumber.toString();

		const bulletIntervaId = setInterval(()=>{
			if(!boolgameend){
				//Cylindric bullets hit little robots
				for (var b = 0; b < arrayclone.length; b++){
					var cr = arrayclone[b];
					if (bullet.intersectsMesh(cr.littleRobotMesh, false)) {
						cr.littleRobotLife = 0;
						if(cr.littleRobotLife <= 0){
							cr.littleRobotMesh.dispose();
							arrayclone.splice(b, 1);
						}
					}
				}
				//Cylindric bullets hit big robots
				for (var b = 0; b < arrayclonebig.length; b++){
					var cr = arrayclonebig[b];
					if (bullet.intersectsMesh(cr.bigRobotMesh, false)) {
						cr.bigRobotLife = 0;
						if(cr.bigRobotLife <= 0){
							cr.bigRobotMesh.dispose();
							arrayclonebig.splice(b, 1);
							rotationforward.splice(b,1);
						}
					}
				}
				//Cylindric bullets hit walls
				for (var b = 0; b < perimeter_walls.length; b++){
					var cr = perimeter_walls[b];
					if (bullet.intersectsMesh(cr, false)) {
						bullet.dispose();
						clearInterval(bulletIntervaId);
					}
				}
			}else if(boolgameend){
				clearInterval(bulletIntervaId);
			}

		},10)
	}

	//Lvl up musuc

	var levelup = new BABYLON.Sound("levelup", "music/levelup.wav", scene, null, {volume: 0.2});
	var sphericLaserShotSound = new BABYLON.Sound("sphericLaserShotSound", "music/sphericLaserShot.wav", scene, null, {volume: 0.2});
	var specialLaserShotSound = new BABYLON.Sound("specialLaserShotSound", "music/specialLaserShot.wav", scene, null, {volume: 0.6});
	var brainWalkSound = new BABYLON.Sound("brainWalkSound", "music/brainWalk.wav", scene, null, {volume: 0.06});
	

	//**************************LEVEL UP GUI*********************************
	var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
	var imagelevel = new BABYLON.GUI.Image("levelup", "textures/index.png");
		imagelevel.position = new BABYLON.Vector3(0, 4,0);
		imagelevel.scaling = new BABYLON.Vector3(0.01,0.01,0.01);
		imagelevel.width = "384px";
		imagelevel.height = "120px";
		imagelevel.populateNinePatchSlicesFromImage = true;
		imagelevel.bottom = "100px";
		imagelevel.top = "-120px";

	//****************************PLAYING GUI*******************************
	{
		playingGUIadvancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

		var levelCounterText = new BABYLON.GUI.TextBlock();

		var rectanglecommgame = new BABYLON.GUI.Rectangle();
			rectanglecommgame.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
			rectanglecommgame.width = "70%";
			rectanglecommgame.height = "60%";
			rectanglecommgame.background = "Black";
			rectanglecommgame.alpha = 0.8;
			rectanglecommgame.top = "5%";
			rectanglecommgame.bottom = "-5%";
			rectanglecommgame.cornerRadius = 20;

		var imagecommgame = new BABYLON.GUI.Image("imagecommgame", "textures/commands.png");
			imagecommgame.position = new BABYLON.Vector3(0, 4,0);
			imagecommgame.width = "70%";
			imagecommgame.height = "60%";
			imagecommgame.populateNinePatchSlicesFromImage = true;
			imagecommgame.top = "5%";
			imagecommgame.bottom = "-5%";

		var closeimage = new BABYLON.GUI.Image("closeimage", "textures/keyL.png");
			closeimage.width = "50px";
			closeimage.height = "50px";
			closeimage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
			closeimage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			closeimage.paddingLeft = "-25px";
			closeimage.paddingRight = "25px";
			closeimage.paddingTop = "70px";
			closeimage.paddingBottom = "-70px";
			playingGUIadvancedTexture.addControl(closeimage);

		const myFont = new FontFace('GameOverFont', 'url(assets/autodestructbb_reg.ttf)');
		myFont.load().then((font) => {
			document.fonts.add(font);

			var brainLifeBarText = new BABYLON.GUI.TextBlock();
				brainLifeBarText.text = "Brainstem Life";
				brainLifeBarText.color = "white";
				brainLifeBarText.fontFamily = "GameOverFont";
				brainLifeBarText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
				brainLifeBarText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				brainLifeBarText.paddingLeft = "32px"
				brainLifeBarText.paddingRight = "-32px"
				brainLifeBarText.paddingTop = "5px"
				brainLifeBarText.paddingBottom = "-5px"
				brainLifeBarText.fontSize = 24;

			playingGUIadvancedTexture.addControl(brainLifeBarText);

				levelCounterText.text = "LVL " + currentLevel.toString();
				levelCounterText.color = "white";
				levelCounterText.fontFamily = "GameOverFont";
				levelCounterText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
				levelCounterText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				levelCounterText.paddingLeft = "-32px";
				levelCounterText.paddingRight = "32px";
				levelCounterText.paddingTop = "5px";
				levelCounterText.paddingBottom = "-5px";
				levelCounterText.fontSize = 36;

			playingGUIadvancedTexture.addControl(levelCounterText);

			var specialAmmoText = new BABYLON.GUI.TextBlock();
				specialAmmoText.text = "Special Ammo";
				specialAmmoText.color = "white";
				specialAmmoText.fontFamily = "GameOverFont";
				specialAmmoText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
				specialAmmoText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
				specialAmmoText.paddingLeft = "32px"
				specialAmmoText.paddingRight = "-32px"
				specialAmmoText.paddingTop = "-5px"
				specialAmmoText.paddingBottom = "5px"
				specialAmmoText.fontSize = 20;
        	playingGUIadvancedTexture.addControl(specialAmmoText);




		});

		var brainLifeBarFullImage = new BABYLON.GUI.Image('but', 'textures/BrainLifeBarFull.png');
			brainLifeBarFullImage.isDirty = true;

		var brainLifeBarEmptyImage = new BABYLON.GUI.Image('but', 'textures/BrainLifeBarEmpty.png');

		var brainLifeBarEmptyContainer = new BABYLON.GUI.Rectangle();
			brainLifeBarEmptyContainer.height = "40px";
			brainLifeBarEmptyContainer.width = "250px";
			brainLifeBarEmptyContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
			brainLifeBarEmptyContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			brainLifeBarEmptyContainer.paddingTop = "30px"
			brainLifeBarEmptyContainer.paddingBottom = "-30px"
			brainLifeBarEmptyContainer.paddingLeft = "20px"
			brainLifeBarEmptyContainer.paddingRight = "-20px"
			brainLifeBarEmptyContainer.thickness = 0;
			brainLifeBarEmptyContainer.background = "";
			brainLifeBarEmptyContainer.addControl(brainLifeBarEmptyImage);

		var brainLifeBarFullContainer = new BABYLON.GUI.Rectangle();
			brainLifeBarFullContainer.height = "40px";
			brainLifeBarFullContainer.width = "248px";
			brainLifeBarFullContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
			brainLifeBarFullContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			brainLifeBarFullContainer.paddingTop = "30px"
			brainLifeBarFullContainer.paddingBottom = "-30px"
			brainLifeBarFullContainer.paddingLeft = "22px"
			brainLifeBarFullContainer.paddingRight = "-22px"
			brainLifeBarFullContainer.thickness = 0;
			brainLifeBarFullContainer.background = "";
			brainLifeBarFullContainer.addControl(brainLifeBarFullImage);
			brainLifeBarFullContainer.isDirty = true;


		playingGUIadvancedTexture.addControl(brainLifeBarEmptyContainer);
		playingGUIadvancedTexture.addControl(brainLifeBarFullContainer);

		var alpha = 0;
		var beta = 0;
		var startingBrainLife = brainLife;

		scene.registerAfterRender(function(){
			brainLifeBarFullImage.left = beta;
			brainLifeBarFullContainer.left = alpha;
			alpha = (5*startingBrainLife)*(brainLife-startingBrainLife);
			beta = -((5*startingBrainLife)*(brainLife-startingBrainLife));
			levelCounterText.text = "LVL " + currentLevel.toString();

		});

    var specialAmmoNumber = new BABYLON.GUI.TextBlock();
      specialAmmoNumber.text = "1";
      specialAmmoNumber.color = "white";
      specialAmmoNumber.fontFamily = "GameOverFont";
      specialAmmoNumber.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      specialAmmoNumber.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      specialAmmoNumber.paddingLeft = "32px"
      specialAmmoNumber.paddingRight = "-32px"
      specialAmmoNumber.paddingTop = "-40px"
      specialAmmoNumber.paddingBottom = "40px"
      specialAmmoNumber.fontSize = 30;


	playingGUIadvancedTexture.addControl(specialAmmoNumber);

	var specialShotAmmoImage = new BABYLON.GUI.Image('specialShotAmmoImage', 'textures/SpecialBullet.png');
		specialShotAmmoImage.height = "8%";
		specialShotAmmoImage.width = "8%";
		specialShotAmmoImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
		specialShotAmmoImage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
		specialShotAmmoImage.paddingTop = "-35px"
		specialShotAmmoImage.paddingBottom = "35px"
		specialShotAmmoImage.paddingLeft = "58px"
		specialShotAmmoImage.paddingRight = "-58px"
		specialShotAmmoImage.thickness = 0;
		specialShotAmmoImage.background = "";
		playingGUIadvancedTexture.addControl(specialShotAmmoImage);


	}

	//************************MAP KEYBOARD KEYS*****************************
	var map = {};
	scene.actionManager = new BABYLON.ActionManager(scene);

	scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
		map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
	}));
	scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
		map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
	}));

	//************************MOUSE CLICK HANDLE****************************
	var clicked = false;
	canvas.addEventListener("pointerdown", function (evt) {
		clicked = true;
	});
	canvas.addEventListener("pointermove", function (evt) {
		if (!clicked) {
			return;
		}
	});
	canvas.addEventListener("pointerup", function (evt) {
		clicked = false;
	});

	return scene;
}
//******************************************************************

//**********************COMMANDS SCENE******************************
var createScenecommands = function () {
    var scenecommands = new BABYLON.Scene(engine);
	
	var cameraCommands = new BABYLON.UniversalCamera("CamCommands", new BABYLON.Vector3(0, 0, 1), scenecommands);
		cameraCommands.attachControl(canvas, true);


    createGUI(scenecommands, 2);

    return scenecommands;
}
//******************************************************************

//**********************ABOUT SCENE**********************************
var createSceneabout = function () {
    var aboutscene = new BABYLON.Scene(engine);

	var cameraAbout = new BABYLON.UniversalCamera("CamAbout", new BABYLON.Vector3(0, 0, 1), aboutscene);
	cameraAbout.attachControl(canvas, true);

    createGUI(aboutscene, 3);

    return aboutscene;
}
//******************************************************************

//**************************GAME OVER SCENE**************************
var createGameOverscene = function () {



	//**************************GAME OVER SCENE**************************
	var gameOverScene = new BABYLON.Scene(engine);
		gameOverScene.clearColor = new BABYLON.Color3(0.00, 0.75, 1.00);
    var gameovermusic = new BABYLON.Sound("gameovermusic", "music/gameover.wav", gameOverScene, null, {volume: 0.1, autoplay:true});

	var cameraGameOver = new BABYLON.UniversalCamera("CamGameOver", new BABYLON.Vector3(0, 0, 1), gameOverScene);
	cameraGameOver.attachControl(canvas, true);

    createGUI(gameOverScene, 4);


    return gameOverScene;

  }
//******************************************************************

//**************************WIN SCENE**************************
var createwinningScene = function () {

	var winningScene = new BABYLON.Scene(engine);
		winningScene.clearColor = new BABYLON.Color3(0.00, 0.75, 1.00);
    var winningmusic = new BABYLON.Sound("winningmusic", "music/win.wav", winningScene, null, {volume: 0.1, autoplay:true});
	
	var cameraWin= new BABYLON.UniversalCamera("CamWin", new BABYLON.Vector3(0, 0, 1), winningScene);
		cameraWin.attachControl(canvas, true);

    createGUI(winningScene, 5);


    return winningScene;

}
//******************************************************************



var advancedTexturemenu;
var advancedTextureabout;
var advancedTexturecommands;
var advancedTexturegameover;
var advancedTexturescene;
var playingGUIadvancedTexture;

var boolimage1 = true;
var boolimage2 = true;
var comingfromSceneabout = false;
var comingfromScenecommands = false;
var comingfromScenemenu = false;
var comingfromScenewinning = false;
var comingfromScenelosing = false;

//***************************PLAYING GUI****************************
var createGUI = function(scene, showScene) {


    switch (showScene) {
        case 0:
	
            advancedTexturemenu = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
			const myFontmenu = new FontFace('MenuFont', 'url(assets/autodestructbb_reg.ttf)');
			myFontmenu.load().then((font) => {
				document.fonts.add(font);
				var title = new BABYLON.GUI.TextBlock();
				title.fontSize = 80;
				title.height = 0.2;
				title.text = "War Of The Robots";
				title.color = "White";
				title.fontFamily = "MenuFont";
				title.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				advancedTexturemenu.addControl(title);

			});


			var imagemenu = new BABYLON.GUI.Image("imagemenu", "textures/labimage.jpg");
				advancedTexturemenu.addControl(imagemenu);


			var textfield = new BABYLON.GUI.TextBlock();
				textfield.fontSize =24;
				textfield.width = "50%";
				textfield.height = "5%";
				textfield.text = "Choose your playing ground:";
				textfield.color = "White";
				textfield.fontFamily = "MenuFont";
				textfield.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                textfield.paddingTop = "25.5%";
                textfield.paddingBottom = "-25.5%";
                textfield.paddingRight = "-9%";
                textfield.paddingLeft = "9%";
				advancedTexturemenu.addControl(textfield);

			var textfielddifficulty = new BABYLON.GUI.TextBlock();
				textfielddifficulty.fontSize =24;
				textfielddifficulty.width = "30%";
				textfielddifficulty.height = "5%";
				textfielddifficulty.text = "Choose Difficulty:";
				textfielddifficulty.color = "White";
				textfielddifficulty.fontFamily = "MenuFont";
				textfielddifficulty.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				textfielddifficulty.paddingTop = "25.5%";
				textfielddifficulty.paddingBottom = "-25.5%";
				textfielddifficulty.paddingRight = "38%";
				textfielddifficulty.paddingLeft = "-38%";
				advancedTexturemenu.addControl(textfielddifficulty);


			imageone = new BABYLON.GUI.Image("imageone", "textures/LaboratoryImage.png");
				imageone.position = new BABYLON.Vector3(0, 4,0);
				imageone.scaling = new BABYLON.Vector3(0.01,0.01,0.01);
				imageone.width = "32%";
				imageone.height = "42%";
				imageone.populateNinePatchSlicesFromImage = true;
				imageone.top = "5%";
				imageone.bottom = "5%";
				imageone.right = "3%";
				imageone.left = "-3%";
				advancedTexturemenu.addControl(imageone);


			imagetwo = new BABYLON.GUI.Image("imagetwo", "textures/MoonImage.png");
				imagetwo.position = new BABYLON.Vector3(0, 4,0);
				imagetwo.scaling = new BABYLON.Vector3(0.01,0.01,0.01);
				imagetwo.width = "32%";
				imagetwo.height = "42%";
				imagetwo.populateNinePatchSlicesFromImage = true;
				imagetwo.top = "5%";
				imagetwo.bottom = "-5%";
				imagetwo.right = "-31%";
				imagetwo.left = "31%";
				advancedTexturemenu.addControl(imagetwo);

			var textfield2 = new BABYLON.GUI.TextBlock();
				textfield2.fontSize =24;
				textfield2.width = "20%";
				textfield2.height = "5%";
				textfield2.text = "Laboratory";
				textfield2.color = "White";
				textfield2.fontFamily = "MenuFont";
				textfield2.top = "-5%";
				textfield2.bottom = "5%";
				textfield2.right = "4%";
				textfield2.left = "-4%";
				textfield2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				

			var textfield3 = new BABYLON.GUI.TextBlock();
				textfield3.fontSize =24;
				textfield3.height = 0.2;
				textfield3.width = "10%";
				textfield3.height = "5%";
				textfield3.text = "Moon";
				textfield3.color = "White";
				textfield3.fontFamily = "MenuFont";
				textfield3.top = "-5%";
				textfield3.bottom = "5%";
				textfield3.right = "-31%";
				textfield3.left = "31%";
				textfield3.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

				advancedTexturemenu.addControl(textfield2);
				advancedTexturemenu.addControl(textfield3);


			var buttonimageone = BABYLON.GUI.Button.CreateSimpleButton("boh", "");
				buttonimageone.width = "32%";
				buttonimageone.height = "42%";
				buttonimageone.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				buttonimageone.background = "Black";
				buttonimageone.alpha = 0.5;
				buttonimageone.hoverCursor = "pointer";
				buttonimageone.top = "5%";
				buttonimageone.bottom = "-5%";
				buttonimageone.right = "-31%";
				buttonimageone.left = "31%";
				advancedTexturemenu.addControl(buttonimageone);

			var buttonimagetwo = BABYLON.GUI.Button.CreateSimpleButton("boh", "");
				buttonimagetwo.width = "32%";
				buttonimagetwo.height = "42%";
				buttonimagetwo.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				buttonimagetwo.background = "Black";
				buttonimagetwo.alpha = 0.5;
				buttonimagetwo.hoverCursor = "pointer";
				buttonimagetwo.top = "5%";
				buttonimagetwo.bottom = "-5%";
				buttonimagetwo.right = "3%";
				buttonimagetwo.left = "-3%";
				advancedTexturemenu.addControl(buttonimagetwo);



			buttonimageone.onPointerMoveObservable.add(function () {
				buttonimageone.alpha = 0;
			});


			buttonimagetwo.onPointerMoveObservable.add(function () {
				buttonimagetwo.alpha = 0;
								
			});

			buttonimageone.onPointerOutObservable.add(function () {
				if(boolimage1){
					buttonimageone.alpha = 0.5;
				}
			});

			buttonimagetwo.onPointerOutObservable.add(function () {
				if(boolimage2){
					buttonimagetwo.alpha = 0.5;
				}
			});

			buttonimageone.onPointerClickObservable.add(function () {
				boolimage1 = false;
				boolimage2 = true;

				buttonimageone.alpha = 0;
				buttonimagetwo.alpha = 0.5;
	
			});


			buttonimagetwo.onPointerClickObservable.add(function () {
				boolimage1 = true;
				boolimage2 = false;							
				buttonimageone.alpha = 0.5;
				buttonimagetwo.alpha = 0;   
			});

			buttonimageone.pointerEnterAnimation = function () {
			};
			buttonimageone.pointerOutAnimation = function () {
			};
			buttonimageone.pointerDownAnimation = function () {
			};
			buttonimageone.pointerUpAnimation = function () {
			};

			buttonimagetwo.pointerEnterAnimation = function () {
			};
			buttonimagetwo.pointerOutAnimation = function () {
			};
			buttonimagetwo.pointerDownAnimation = function () {
			};
			buttonimagetwo.pointerUpAnimation = function () {
			};


			var radiobuttoneasy = new BABYLON.GUI.RadioButton();
				radiobuttoneasy.width = "2%";
				radiobuttoneasy.height = "4%";
				radiobuttoneasy.color = "white";
				radiobuttoneasy.right = "45%";
				radiobuttoneasy.left = "-45%";
				radiobuttoneasy.top = "-10%";
				radiobuttoneasy.bottom = "10%";
				radiobuttoneasy.background = "black";

				
			
			var radiobuttonmedium = new BABYLON.GUI.RadioButton();
				radiobuttonmedium.width = "2%";
				radiobuttonmedium.height = "4%";
				radiobuttonmedium.color = "white";
				radiobuttonmedium.right = "45%";
				radiobuttonmedium.left = "-45%";
				radiobuttonmedium.top = "0%";
				radiobuttonmedium.bottom = "0%";
				radiobuttonmedium.background = "black";
				radiobuttonmedium.isChecked = true;

				

			var radiobuttonhard = new BABYLON.GUI.RadioButton();
				radiobuttonhard.width = "2%";
				radiobuttonhard.height = "4%";
				radiobuttonhard.color = "white";
				radiobuttonhard.right = "45%";
				radiobuttonhard.left = "-45%";
				radiobuttonhard.top = "10%";
				radiobuttonhard.bottom = "-10%";
				radiobuttonhard.background = "black";
				

			radiobuttoneasy.onPointerMoveObservable.add(function () {
				radiobuttoneasy.background = "white";
			});

			radiobuttoneasy.onPointerOutObservable.add(function () {
				radiobuttoneasy.background = "black";
			});

			radiobuttoneasy.onPointerClickObservable.add(function () {
				difficulty = 0;
			});

			radiobuttonmedium.onPointerMoveObservable.add(function () {
				radiobuttonmedium.background = "white";
			});

			radiobuttonmedium.onPointerOutObservable.add(function () {
				radiobuttonmedium.background = "black";
			});

			radiobuttonmedium.onPointerClickObservable.add(function () {
				difficulty = 1;
			});

			radiobuttonhard.onPointerMoveObservable.add(function () {
				radiobuttonhard.background = "white";
			});

			radiobuttonhard.onPointerOutObservable.add(function () {
				radiobuttonhard.background = "black";
			});


			radiobuttonhard.onPointerClickObservable.add(function () {
				difficulty = 2;
			});


			var textfieldeasy = new BABYLON.GUI.TextBlock();
				textfieldeasy.fontSize =24;
				textfieldeasy.width = "7%";
				textfieldeasy.height = "5%";
				textfieldeasy.text = "Easy";
				textfieldeasy.color = "White";
				textfieldeasy.fontFamily = "MenuFont";
				textfieldeasy.top = "-10%";
				textfieldeasy.bottom = "10%";
				textfieldeasy.right = "39%";
				textfieldeasy.left = "-39%";
				textfieldeasy.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				

			var textfieldmedium = new BABYLON.GUI.TextBlock();
				textfieldmedium.fontSize =24;
				textfieldmedium.width = "10%";
				textfieldmedium.height = "5%";
				textfieldmedium.text = "Medium";
				textfieldmedium.color = "White";
				textfieldmedium.fontFamily = "MenuFont";
				textfieldmedium.top = "0%";
				textfieldmedium.bottom = "0%";
				textfieldmedium.right = "38%";
				textfieldmedium.left = "-38%";
				textfieldmedium.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

			var textfieldhard = new BABYLON.GUI.TextBlock();
				textfieldhard.fontSize =24;
				textfieldhard.width = "10%";
				textfieldhard.height = "5%";
				textfieldhard.text = "Hard";
				textfieldhard.color = "White";
				textfieldhard.fontFamily = "MenuFont";
				textfieldhard.top = "10%";
				textfieldhard.bottom = "-10%";
				textfieldhard.right = "39%";
				textfieldhard.left = "-39%";
				textfieldhard.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;



			advancedTexturemenu.addControl(textfieldeasy);
			advancedTexturemenu.addControl(textfieldmedium);
			advancedTexturemenu.addControl(textfieldhard);
			advancedTexturemenu.addControl(radiobuttoneasy);
			advancedTexturemenu.addControl(radiobuttonmedium);
			advancedTexturemenu.addControl(radiobuttonhard);
			
			
			
		

			//BUTTONS BELOW
			var start = BABYLON.GUI.Button.CreateSimpleButton("startbutton", "START");
				start.width = "12%";
				start.height = "9%";
				start.right = "20%";
				start.left = "-20%";
				start.fontFamily = "MenuFont";
				start.textBlock.color = "white";
				start.textBlock.fontFamily = "MenuFont";
				start.background = "black";
				start.hoverCursor = "pointer";
				start.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				start.top = "40%";
				advancedTexturemenu.addControl(start);

			var commands = BABYLON.GUI.Button.CreateSimpleButton("commandbutton", "COMMANDS");
				commands.width = "12%";
				commands.height = "9%";
				commands.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				commands.top = "40%";
				commands.fontFamily = "MenuFont";
				commands.textBlock.color = "white";
				commands.textBlock.fontFamily = "MenuFont";
				commands.background = "black";
				commands.hoverCursor = "pointer";
				advancedTexturemenu.addControl(commands);


			var about = BABYLON.GUI.Button.CreateSimpleButton("aboutbutton", "ABOUT US");
				about.width = "12%";
				about.height = "9%";
				about.right = "-20%";
				about.left = "20%";
				about.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				about.top = "40%";
				about.fontFamily = "MenuFont";
				about.textBlock.color = "white";
				about.textBlock.fontFamily = "MenuFont";
				about.background = "black";
				about.hoverCursor = "pointer";
				advancedTexturemenu.addControl(about);


			start.onPointerMoveObservable.add(function () {
				start.background = "red";
				canvas.style.cursor = "pointer";});


			start.onPointerOutObservable.add(function () {
				start.background = "black";});

			commands.onPointerMoveObservable.add(function () {
				commands.background = "red";});

			commands.onPointerOutObservable.add(function () {
				commands.background = "black";});

			about.onPointerMoveObservable.add(function () {
				about.background = "red";});

			about.onPointerOutObservable.add(function () {
				about.background = "black";});

			start.onPointerUpObservable.add(function () {
				
				if(boolimage1 == false){
					ambientation = 1;
				}
				else if (boolimage2 == false){
					ambientation = 0;
				}
			comingfromScenemenu = true;
				scenevar = createScene();
				changescene = 1;  
			});

			commands.onPointerUpObservable.add(function () {
				
			scenecommandsvar = createScenecommands();
				changescene = 2;
				boolimage1 = true;
				boolimage2 = true;
			});

			about.onPointerUpObservable.add(function () {
				aboutscenevar = createSceneabout();
				changescene = 3;
				boolimage1 = true;
				boolimage2 = true;
			});


        break
        case 1:

        break
		
		case 2:


            advancedTexturecommands = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

			imagemenu2 = new BABYLON.GUI.Image("imagemenu2", "textures/labimage.jpg");
			advancedTexturecommands.addControl(imagemenu2);


			var titlecommands = new BABYLON.GUI.TextBlock();
				titlecommands.fontSize = 80;
				titlecommands.height = 0.2;
				titlecommands.text = "COMMANDS";
				titlecommands.color = "White";
				titlecommands.fontFamily = "MenuFont";
				titlecommands.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				advancedTexturecommands.addControl(titlecommands);

			var startf = BABYLON.GUI.Button.CreateSimpleButton("backtomenu", "Back to Menu");
				startf.width = "8%";
				startf.height = "7.4%";
				startf.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				startf.fontFamily = "MenuFont";
				startf.fontSize = 17;
				startf.textBlock.color = "white";
				startf.hoverCursor = "pointer";
				startf.right = "45%"
				startf.left = "-45%"
				startf.top = "5%";
              	startf.bottom = "-5%";
  						

			startf.onPointerUpObservable.add(function () {		
              	comingfromScenecommands = true;
              	scenemenuvar = createScenemenu();
				changescene = 0;
  			});

			advancedTexturecommands.addControl(startf);

			var rectanglecomm = new BABYLON.GUI.Rectangle();
				rectanglecomm.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				rectanglecomm.width = "70%";
				rectanglecomm.height = "60%";
				rectanglecomm.background = "Black";
				rectanglecomm.alpha = 0.8;
				rectanglecomm.top = "5%";
				rectanglecomm.bottom = "-5%";
				rectanglecomm.cornerRadius = 20;
				advancedTexturecommands.addControl(rectanglecomm);

         	 var imagecomm = new BABYLON.GUI.Image("imagecomm", "textures/commands.png");
				imagecomm.position = new BABYLON.Vector3(0, 4,0);
				imagecomm.scaling = new BABYLON.Vector3(0.01,0.01,0.01);
				imagecomm.width = "70%";
				imagecomm.height = "60%";
				imagecomm.populateNinePatchSlicesFromImage = true;
				imagecomm.top = "5%";
				imagecomm.bottom = "-5%";
				advancedTexturecommands.addControl(imagecomm);


        break
		
		case 3:
            advancedTextureabout = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

			var imagemenu3 = new BABYLON.GUI.Image("imagemenu3", "textures/labimage.jpg");
				advancedTextureabout.addControl(imagemenu3);

			var titleabout = new BABYLON.GUI.TextBlock();
				titleabout.fontSize = 80;
				titleabout.height = 0.2;
				titleabout.text = "ABOUT US";
				titleabout.color = "White";
				titleabout.fontFamily = "MenuFont";
				titleabout.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				advancedTextureabout.addControl(titleabout);

			var abouttext = new BABYLON.GUI.TextBlock();
				abouttext.text = "We are two students of the Faculty of Engineering on\n Computer Science at the "+
				"University of Sapienza in Rome.\n During the Interactive Graphics course held by Professor\n Schaerf Marco, "+
					"we developed a game application \n using Babylonjs libraries. \n"+
					"\n\n Created and developed by: \n\n Andrea Franceschi 1709888 \n Daniele Cantisani 1707633 \n"
				abouttext.fontSize = 23;
				abouttext.width = "80%";
				abouttext.height = "70%";
				abouttext.color = "White";
				abouttext.fontFamily = "MenuFont";

				abouttext.top = "15%";
				abouttext.bottom = "-15%";
				abouttext.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				advancedTextureabout.addControl(abouttext);


			var startj = BABYLON.GUI.Button.CreateSimpleButton("backtomenu2", "Back to Menu");
                startj.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
				startj.width = "8%";
				startj.height = "7.4%";
				startj.fontFamily = "MenuFont";
				startj.fontSize = 17;
				startj.textBlock.color = "white";	
				startj.hoverCursor = "pointer";
				startj.right = "45%"
				startj.left = "-45%"
				startj.top = "5%";
                startj.bottom = "-5%";
    						

			startj.onPointerUpObservable.add(function () {
				comingfromSceneabout = true;
                scenemenuvar = createScenemenu();
				changescene = 0;
			});

			advancedTextureabout.addControl(startj);


        break
        case 4:


            advancedTexturegameover = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("LOSEUI", true, scene);
            var imagebackgo = new BABYLON.GUI.Image("imagebackgo", "textures/labimage.jpg");
            advancedTexturegameover.addControl(imagebackgo);
            var gameOver = new BABYLON.GUI.TextBlock();
              	gameOver.fontFamily = "GameOverFont";
              	gameOver.text = "YOU LOSE";
              	gameOver.color = "white";
              	gameOver.fontSize = 150;
              	gameOver.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                advancedTexturegameover.addControl(gameOver);

            var restart = BABYLON.GUI.Button.CreateSimpleButton("restart", "RESTART");
				restart.width = "12%";
				restart.height = "9%";

				restart.right = "10%";
				restart.left = "-10%";
				
				restart.fontFamily = "MenuFont";
				restart.textBlock.color = "white";
				restart.textBlock.fontFamily = "MenuFont";
				restart.background = "black";
				restart.hoverCursor = "pointer";
              	restart.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
              	restart.top = "35%";
				advancedTexturegameover.addControl(restart);


			var gotomenurestrtfrom = BABYLON.GUI.Button.CreateSimpleButton("gotomenufromlose", "GO TO MENU");
				gotomenurestrtfrom.width = "12%";
				gotomenurestrtfrom.height = "9%";
				gotomenurestrtfrom.right = "-10%";
                gotomenurestrtfrom.left = "10%";
				gotomenurestrtfrom.fontFamily = "MenuFont";
				gotomenurestrtfrom.textBlock.color = "white";
				gotomenurestrtfrom.textBlock.fontFamily = "MenuFont";
				gotomenurestrtfrom.background = "black";
				gotomenurestrtfrom.hoverCursor = "pointer";
                gotomenurestrtfrom.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                gotomenurestrtfrom.top = "35%";
				advancedTexturegameover.addControl(gotomenurestrtfrom);

			restart.onPointerMoveObservable.add(function () {
				restart.background = "red";
			});

			restart.onPointerOutObservable.add(function () {
				restart.background = "black";
			});

			gotomenurestrtfrom.onPointerMoveObservable.add(function () {
				gotomenurestrtfrom.background = "red";
			});

			gotomenurestrtfrom.onPointerOutObservable.add(function () {
				gotomenurestrtfrom.background = "black";
			});

			restart.onPointerUpObservable.add(function () {
				if(boolimage1 == false){
					ambientation = 1;
				}
				else if (boolimage2 == false){
					ambientation = 0;
				}

				comingfromScenelosing = true;
				scenevar = createScene();
				changescene = 1;
			});


			gotomenurestrtfrom.onPointerUpObservable.add(function () {
				comingfromScenelosing = true;
				scenemenuvar = createScenemenu();
				changescene = 0;

			});

        break
        case 5:

			advancedTexturewin = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("WINUI", true, scene);
			
            var imagebackwin = new BABYLON.GUI.Image("imagebackwin", "textures/labimage.jpg");
			advancedTexturewin.addControl(imagebackwin);
		
            var win = new BABYLON.GUI.TextBlock();
                win.fontFamily = "GameOverFont";
                win.text = "YOU WIN";
                win.color = "white";
                win.fontSize = 150;
                win.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                advancedTexturewin.addControl(win);


            var gotomenurestrtfromwin = BABYLON.GUI.Button.CreateSimpleButton("gotomenufromwin", "GO TO MENU");
				gotomenurestrtfromwin.width = "12%";
				gotomenurestrtfromwin.height = "9%";
				gotomenurestrtfromwin.fontFamily = "MenuFont";
				gotomenurestrtfromwin.textBlock.color = "white";
				gotomenurestrtfromwin.textBlock.fontFamily = "MenuFont";
				gotomenurestrtfromwin.background = "black";
				gotomenurestrtfromwin.hoverCursor = "pointer";
				gotomenurestrtfromwin.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
				gotomenurestrtfromwin.top = "35%";
				advancedTexturewin.addControl(gotomenurestrtfromwin);

              	gotomenurestrtfromwin.onPointerMoveObservable.add(function () {
					gotomenurestrtfromwin.background = "red";
				});

				gotomenurestrtfromwin.onPointerOutObservable.add(function () {
						gotomenurestrtfromwin.background = "black";
				});


              	gotomenurestrtfromwin.onPointerUpObservable.add(function () {
                  scenemenuvar = createScenemenu();
                  comingfromScenewinning = true;
                  changescene = 0;


				});

        break
    }


	}

var scenemenuvar = createScenemenu();
var scenevar;
var scenecommandsvar;
var aboutscenevar;
var gameoverscenevar;
var winningScenevar;


engine.runRenderLoop(function() {

	if(changescene == 0){
        if(comingfromSceneabout){
          aboutscenevar.dispose();
          comingfromSceneabout = false;
        }
        else if(comingfromScenecommands){
            scenecommandsvar.dispose();
            comingfromScenecommands = false;
          }
        else if (comingfromScenelosing) {
          gameoverscenevar.dispose();
          comingfromScenelosing = false;
        }
        else if (comingfromScenewinning){
          winningScenevar.dispose();
          comingfromScenewinning = false;
        }
		scenemenuvar.render();
		fpsIndicator.style.visibility = "hidden";
		loadingScreenDiv.style.visibility = "hidden";

  		}
		else if (changescene == 1){
        	if (scenevar.getWaitingItemsCount() === 0) {
            	loadingScreenDiv.style.visibility = "hidden";
            	engine.hideLoadingUI();

            	if(comingfromScenelosing){
              		gameoverscenevar.dispose();
              		comingfromScenelosing = false;
            	}
            	else if(comingfromScenemenu){
              		scenemenuvar.dispose();
              		comingfromScenemenu = false;
            	}

           		scenevar.render();

    			fpsIndicator.style.visibility = "visible";
    			fpsIndicator.innerHTML = "FPS: " + engine.getFps().toFixed();
				
				setTimeout(function(){
              		boolgamestart = true;
            	}, 5000);

        	} else {
            	loadingScreenDiv.style.visibility = "visible";
            	engine.displayLoadingUI();
			}
		}
		
		else if(changescene == 2){
        	scenemenuvar.dispose();
			scenecommandsvar.render();
		}
		
		else if (changescene == 3){
        	scenemenuvar.dispose();
			aboutscenevar.render();			
		}
		
		else if (changescene == 4){    	
			scenevar.dispose();
			gameoverscenevar.render();
			fpsIndicator.style.visibility = "hidden";
		}
      	else if (changescene == 5){
			scenevar.dispose();
			winningScenevar.render();
			fpsIndicator.style.visibility = "hidden";
		}

});
