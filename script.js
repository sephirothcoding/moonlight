/*

  ★ Move your mouse around ★
    
  Moonlight at dawn - walk around my city
  Enjoy this poetic scene

  Letters are designed by me in Blender.
  Rest is parametric meshes done in three.js.
  
  Thanks to Szenia Zadvornykh for his great THREE.BAS extension:
  https://github.com/zadvorsky/three.bas
  
  Thanks to Lee Stemkoski for the "glow" shader:
  http://stemkoski.blogspot.com/2013/07/shaders-in-threejs-glow-and-halo.html
  
  art & code by 
  Anna Zenn Scavenger, September 2020
  https://twitter.com/ouchpixels
  
  License: You can remix, adapt, and build upon my code non-commercially.
  
*/

'use strict';

let container, scene, camera, controls, renderer;

// GLOBAL MESHES

let doodles, torus, rosette, waterlily, waterlily2, sphereLily, petalMeshes, flower;
let iCorn, cornHusk, branchGroup;
let lilySphere, sphereI, openSphere;
let moon, moon1, moon2, moon3, moon4;
let moonCurvePoints;

// ASSETS

const matcapURL = "https://assets.codepen.io/911157/matcapSilver_256.jpg";
const matcapShinyPowderURL = "https://assets.codepen.io/911157/matcapShinyPowder_256.jpg";
const matcapShinyBeigeURL = "https://assets.codepen.io/911157/matcapShinyBeige_256.jpg";
const doodlesURL = "https://assets.codepen.io/911157/MoonLightFinal_noNormals.glb";

let materials;

// LOADER

let loadingManager = null;

// PARTICLES SYSTEM PARAMS

let mParticleCount = 12000;
let mParticleSystem;

let mTime = 0.0;
let mTimeStep = (1 / 60);
let mDuration = 30;

// WANDERING MOON PROGRESS

let t = 0;

// BRANCH LEAF PARAMS

let leafParams = {
  
  leafCount: 10,
  leafThickness: 0.5,
  tubeThickness: 0.95,
  leafColor: 0x5ca300,
  tubeColor: 0x808c31,
  leafScale: 0.45,
  scaleFactor: 0.07
  
}

// OPENING FLOWER

let petalCount = 6; 
let rotationStep = Math.PI * 2 / petalCount;

// RADIAL GRADIENT COLORS

let bgColors = [
  
  // center
  [203, 213, 241],
  [17, 23, 40],
  
  // outside
  [89, 79, 71],
  [81, 54, 32]
  
];

let mouseX = 0;
let mouseY = 0;

let isMobile = /(Android|iPhone|iOS|iPod|iPad)/i.test(navigator.userAgent);
let windowRatio = window.innerWidth / window.innerHeight;
let isLandscape = (windowRatio > 1) ? true : false;

let isIntroFinished = false;

window.onload = function() {
  
  init();
  
};

function init() {
  
  initLoadingManager();
  initScene();
  
  materials = initMaterials();
  initLetters();
  initMeshes();
  initParticleSystem();
  animateParticles();
  
  requestAnimationFrame(render);

  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("touchmove", onTouchMove, false);
  window.addEventListener("resize", onResize);
  
}

function initLoadingManager() {
  
  loadingManager = new THREE.LoadingManager();
  
  loadingManager.onLoad = () => {
		
    const overlayDiv = document.querySelector("#scene-overlay");
    const sceneDiv = document.querySelector("#scene-container");
    overlayDiv.style.animation = "fadeOut 1.15s ease-out forwards";
    sceneDiv.style.animation = "fadeIn 1.15s ease-out forwards";
    overlayDiv.style.display = "none";
    
	};
  
}

// ⚪ ROSETTE GEOMETRY

function generateRosette(petals = 20, radius = 12) {
  
  let step = 2 * Math.PI / petals;
  
  let petalGeom = new THREE.SphereBufferGeometry(radius, 20, 20, Math.PI / 3, Math.PI / 3, 0, Math.PI);
  petalGeom.rotateZ(Math.PI / 2);
  petalGeom.translate(radius, 0, 0);
  
  let petalGeoms = [];
    
  for (let i = 0; i < petals; i++) {
    
    let p = petalGeom.clone();
    
    p.rotateZ(Math.PI * Math.abs(0.5 * 0.65));
    p.rotateY(step * i);
    p.rotateX(-Math.PI / 2);
    
    petalGeoms.push(p);
    
  }
  
  let rosetteGeom = THREE.BufferGeometryUtils.mergeBufferGeometries(petalGeoms, true);
  
  return rosetteGeom;
  
}

// ⚪ WATERLILY GEOMETRY 

function generateWaterlily(petals = 10, radius = 12) {
  
  let step = 2 * Math.PI / petals;
  
  let petalGeom = new THREE.SphereBufferGeometry(radius, 20, 20, Math.PI / 3, Math.PI / 3, 0, Math.PI);
  petalGeom.translate(0, -6, 0);
  petalGeom.rotateX(Math.PI / 2);
    
  let petalGeoms = [];
  
  for (let i = 0; i < petals; i++ ) {
    
    let p = petalGeom.clone();
    p.rotateY(step * i);
    petalGeoms.push(p);
    
  }
  
  let waterlilyGeom = THREE.BufferGeometryUtils.mergeBufferGeometries(petalGeoms, true);
  
  return waterlilyGeom;

}

// ⚪ SINGLE BARLEY GEOMETRY

function generateBarley() {
  
  let points = [];
  for ( let i = 0; i < 11; i ++ ) {
	  points.push(new THREE.Vector2(Math.sin(i * 0.3) * 5, (i - 0.5) * 2.75));
  }
  
  let barleyGeom = new THREE.LatheBufferGeometry(points, 10);
  // barleyGeom.rotateX(Math.PI);
  
  return barleyGeom;
  
}

// ⚪ INSTANCED CORN MESH

function generateCorn(cornSize = 1.75) {
  
  let barleyGeom = generateBarley();
  
  let baseGeom = new THREE.SphereBufferGeometry(cornSize, 9, 9);
  
  let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeom);
  let instanceCount = barleyGeom.attributes.position.length / 3;
  instancedGeometry.instanceCount = instanceCount;
  
  // get positions from barley lathe points
  let cornPointsFloat32 = barleyGeom.attributes.position.array;
  
  instancedGeometry.setAttribute(
    "aPosition",
    new THREE.InstancedBufferAttribute(cornPointsFloat32, 3, false)
  );
  
  instancedGeometry.computeBoundingBox();
  let box = instancedGeometry.boundingBox;
  let height = box.max.y - box.min.y;
  let width = box.max.x - box.min.x;
  instancedGeometry.translate(0, +height, 0);
 
  let cornMesh = new THREE.Mesh(instancedGeometry, materials.iShiny);
  
  return cornMesh;
  
}

// ⚪ CORN HUSK MESH

function generateCornHusk() {
  
  let numLeaves = 6;
  let numPoints = 16;
     
  let points = [];
  
  for (let i = 0; i < numPoints; i ++) {
    
	  points.push(new THREE.Vector2(Math.sin(i * 0.2) * 15 + 0, (i-2)*2));
    
  }
  
  let huskGeom = new THREE.LatheBufferGeometry(points, 16, 0, 0.45);
  huskGeom.computeBoundingBox();
  let huskHeight = huskGeom.boundingBox.max.y - huskGeom.boundingBox.min.y;
  huskGeom.translate(0, - huskHeight, 0);
  huskGeom.rotateX(Math.PI);
    
  let rotationStep = 2 * Math.PI / numLeaves;
  let huskGeoms = [];
  
  for (let i = 0; i < numLeaves; i++) {
    
    let leaf = huskGeom.clone();
    leaf.rotateZ(rotationStep * i);
    leaf.rotateX(Math.PI / 2);
    huskGeoms.push(leaf);
    
  }
  
  let huskMerged = THREE.BufferGeometryUtils.mergeBufferGeometries(huskGeoms, true);
  
  return huskMerged;
  
}

// ⚪ CURVE FOR BRANCH TUBE

function generateCurve() {
  
  let curve = new THREE.CubicBezierCurve3(
	  new THREE.Vector3(-20, -10, 0),
	  new THREE.Vector3(-10, 10, -10),
	  new THREE.Vector3(0, -20, 0),
	  new THREE.Vector3(10, 10, -20)
  );

  return curve;
   
}

// ⚪ BRANCH TUBE

function generateTube() {
  
  let curve = generateCurve();
  
  let tubeThickness = leafParams.tubeThickness;
  let tubeColor = leafParams.tubeColor;
  
  let geom = new THREE.TubeBufferGeometry(curve, 40, tubeThickness, 8, false);
  geom.computeVertexNormals();
  
  let tangents = geom.tangents;
  
  return {
    
    geom,
    tangents
    
  }
  
}

// ⚪ LEAVES BRANCH MESH

function generateLeaves() {
    
  let leafCount = leafParams.leafCount;
  let leafThickness = leafParams.leafThickness;
  let scaleFactor = leafParams.scaleFactor;
  let scale = leafParams.leafScale;
  
  let curve = generateCurve();
  let tube = generateTube();
  
  const leafGeom = generateBarley();
  const leafMat = new THREE.MeshPhongMaterial({color: leafParams.leafColor});
  
  const spacedPoints = curve.getSpacedPoints(leafCount - 1);
    
  let leaves = new THREE.Group();
  
  let tangents = generateTube().tangents;
  
  for (let i = 0; i < leafCount; i++) {
    
    let tangentVector = new THREE.Vector3(tangents[i].x, tangents[i].y, tangents[i].z);
    
	  let leaf = new THREE.Mesh(leafGeom, materials.shinyBeige);
    leaf.position.copy(spacedPoints[i]);
    leaf.lookAt(tangentVector);
    leaf.scale.set(scale, scale, scale);
    leaf.scale.y = 1 - scaleFactor * 0.5 * i;
    
    let leaf2 = leaf.clone();
    leaf2.rotation.x = leaf.rotation.x + 3 * Math.PI / 2;
	  leaves.add(leaf);
    leaves.add(leaf2);

  }
  
  return leaves;

}

function initMeshes() {
    
  // flowers + spheres
  
  rosette = new THREE.Mesh(generateRosette(20, 12), materials.white);
  rosette.position.set(15, 44, 0);
  rosette.scale.set(1.2, 1.2, 1.2);
  scene.add(rosette);
  
  flower = new THREE.Mesh(generateFlower(), materials.purple);
  flower.rotation.x = - Math.PI * 0.8;
  flower.position.set(66, 47, -5);
  scene.add(flower);
  
  waterlily = new THREE.Mesh(generateWaterlily(8, 11), materials.shinyBeige);
  waterlily.position.set(-50, 12, -10);
  waterlily.rotation.x = Math.PI * 0.3;
  scene.add(waterlily);
  
  let sphereGeom = new THREE.SphereBufferGeometry(5, 18, 18);
  
  waterlily2 = waterlily.clone();
  waterlily2.position.set(-70, 15, -10);
  waterlily2.rotation.x = Math.PI * 1.5;
  waterlily2.scale.set(0.3, 0.3, 0.3);
  scene.add(waterlily2);
  
  lilySphere = new THREE.Mesh(sphereGeom, materials.disco);
  lilySphere.position.copy(waterlily.position);
  lilySphere.position.y = waterlily.position.y - 1;
  lilySphere.rotation.x = Math.PI * 0.3;
  scene.add(lilySphere);
  
  sphereI = new THREE.Mesh(sphereGeom, materials.disco)
  sphereI.position.set(-13, 1, 0);
  scene.add(sphereI);
  
  let flowerOpening = generateOpeningFlower();
  flowerOpening.position.set(1, 0, -15);
  scene.add(flowerOpening);
  
  openSphere = new THREE.Mesh(sphereGeom, materials.disco);
  openSphere.position.copy(flowerOpening.position);
  openSphere.position.y = 19.5;
  scene.add(openSphere);
  
  // branch with leaves
  
  branchGroup = new THREE.Group();
  
  let tube = new THREE.Mesh(generateTube().geom, materials.silver);
  
  let leavesBranch = generateLeaves();
  branchGroup.add(tube, leavesBranch);
  branchGroup.position.set(-30, -25, -20);
  branchGroup.rotation.y = Math.PI / 1.5;
  branchGroup.scale.set(0.75, 0.75, 0.75);
  
  scene.add(branchGroup);
  
  const torusGeom = new THREE.TorusBufferGeometry(13, 6.5, 30, 50);
  torus = new THREE.Mesh(torusGeom, materials.purple);
  torus.position.set(-18, 34, -30);
  torus.scale.set(1.0, 1.0, 1.0);
  scene.add(torus);
  
  // corn - spheres on lathe + corn husk
  
  let corn = new THREE.Mesh(generateBarley(), materials.shinyPowder);
  corn.position.set(-70, 0, 0);
  corn.rotation.set(- Math.PI * 0.85, 0, - Math.PI * 0.25);
  corn.scale.set(0.8, 0.8, 0.8);
  scene.add(corn);
  
  let corn2 = new THREE.Mesh(generateBarley(), materials.white);
  corn2.position.set(62, 2, 0);
  corn2.rotation.set(-Math.PI * 0.1, 0, -Math.PI * 0.25);
  corn2.scale.set(0.45, 0.45, 0.45);
  scene.add(corn2);
  
  iCorn = generateCorn();
  iCorn.position.set(50, -13, -7);
  scene.add(iCorn);
  
  cornHusk = new THREE.Mesh(generateCornHusk(), materials.purple);
  cornHusk.position.copy(iCorn.position);
  cornHusk.scale.set(0.7, 0.7, 0.7);
  scene.add(cornHusk);
  
  // moons
      
  let moonGeom = new THREE.SphereBufferGeometry(10, 17, 17);
  
  moon = new THREE.Mesh(moonGeom, materials.glow);
  moon.position.set(-10, -60, 40);
  scene.add(moon);
  
  moon1 = new THREE.Mesh(moonGeom, materials.glow);
  moon1.position.set(0, -2.5, 0);
  scene.add(moon1);
  
  moon2 = moon.clone();
  moon2.scale.set(1.35, 1.35, 1.35);
  moon2.position.set(-57, 48, -10);
  scene.add(moon2);
  
  moon3 = moon.clone();
  moon3.position.set(-35, 10, 5);
  moon3.scale.set(0.5, 0.5, 0.5);
  scene.add(moon3);
  
  moon4 = moon.clone();
  moon4.position.set(-20, 17, -15);
  moon4.scale.set(0.45, 0.45, 0.45);
  scene.add(moon4);
  
  moonCurvePoints = generateMoonCurve();
  
}

function generateMoonCurve() {
  
  let curve = new THREE.CubicBezierCurve3(
    
	  new THREE.Vector3( -10, -60, 40 ),
	  new THREE.Vector3( 210, 150, 0 ),
	  new THREE.Vector3( 10, -170, 50 ),
	  new THREE.Vector3( -100, 120, -50 )
    
  );

  let points = curve.getPoints(50);
  let geometry = new THREE.BufferGeometry().setFromPoints(points);

  let material = new THREE.LineBasicMaterial({ color : 0xff00ff });

  // Create the final object to add to the scene
  let curveObject = new THREE.Line(geometry, material);
  
  // scene.add curveObject);
  
  return curve;
  
}

function generateFlower() {
  
  let radius = 4;
  let petalsCount = 5;
  let phiStart = Math.PI / 3;
  let phiLength = Math.PI / 3;
  let rotationStep = 2 * Math.PI / petalsCount;
  
  let petalGeom = new THREE.SphereBufferGeometry(radius, 15, 15, 0, phiLength, 0, Math.PI);
  petalGeom.translate(0, -radius, 0);
  petalGeom.rotateX(Math.PI / 2);
  petalGeom.rotateZ(Math.PI / 3);
  
  let petalGeoms = [];
  
  for (let i = 0; i < petalsCount; i++) {
    
    let p = petalGeom.clone();
    p.rotateY(rotationStep * i);
    
    petalGeoms.push(p);
    
  }
  
  let petals = THREE.BufferGeometryUtils.mergeBufferGeometries(petalGeoms, true);
  
  return petals;
  
}

function generateOpeningFlower() {
    
  let radius = 10;
  let phiStart = Math.PI / 3;
  let phiLength = Math.PI / 3;
  
  let petalGeom = new THREE.SphereBufferGeometry(radius, 16, 16, phiStart, phiLength, 0, Math.PI);
  
  petalGeom.translate(0, -radius, 0);
  petalGeom.rotateX(Math.PI / 2);
  
  let petalMesh = new THREE.Mesh(petalGeom, materials.white);
  
  petalMeshes = [];
  
  let petalCount = 6;
  let rotationStep = Math.PI * 2 / petalCount;
    
  let petalsGroup = new THREE.Group();
  
  for (let i = 0; i < petalCount; i ++) {
    
    petalMeshes[i] = petalMesh.clone();
    petalMeshes[i].position.y = 15;
    petalMeshes[i].rotation.set(0, Math.PI * 0.1, 0);
    petalMeshes[i].rotateY(rotationStep * i);
    
    petalsGroup.add(petalMeshes[i]);
    
  }
  
  return petalsGroup;
  
}

function initLetters() {
  
  let scale = 6.75;
  
  let loader = new THREE.GLTFLoader();

  loader.load(
    
    doodlesURL, function (gltf) {

      // console.log(gltf.scene);
      
      gltf.scene.traverse(function(child) {

        if (child instanceof THREE.Mesh) {
          
           child.geometry.computeVertexNormals();
           child.material = materials.silver;
          
        }

      });

      doodles = gltf.scene;
      doodles.scale.set(scale, scale, scale);
      doodles.position.set(0, 8, 0);

      scene.add(doodles);
      
    },
    
    function (xhr) {
      
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      
    },
    
    function (error) {
      
      console.log("GLTF loading error");
      
    }
    
  );

}

function animateParticles() {
  
  let tl = gsap.timeline({paused: true});
  let particles = mParticleSystem;
  let particlesRot = particles.rotation;
  let particlesPos = particles.position;
  let particlesScale = particles.scale;
    
  tl
    .to(particlesRot, {y: 6 * Math.PI, duration: 5, ease: "power1.out"}, "startParticles")
    .to(particlesPos, {y: 0, duration: 3, ease: "none"},
       "startParticles")
    .to(particlesScale, {x: 1, duration: 2, ease: "power1.inOut"},
       "startParticles+=2")
    .to(particlesScale, {y: 1, duration: 2, ease: "power1.inOut"},
       "startParticles+=2")
    .to(particlesScale, {z: 1, duration: 2, ease: "power1.inOut", onComplete: complete},"startParticles+=2")
  ;
  
  function complete() {
    
    isIntroFinished = true;
    let credits = document.querySelector('.credits');
    credits.style.animation = "fadeIn 6s ease-out forwards";
    
  }

  tl.play();
  
}

function render() {

  requestAnimationFrame(render);
  renderer.render(scene, camera);

  if (isIntroFinished) {
    
    mParticleSystem.material.uniforms['uTime'].value = mTime;
    mTime += mTimeStep;
    mTime %= mDuration;
    
    update();
    
  }
  
}

function update() {
  
  // moon along a curve
  if (t > 0.99) {
    
    t = 0.0;
    let pos =  moonCurvePoints.getPoint(t);
    moon.position.set(pos.x, pos.y, pos.z);
    
  } else {
    
    t += 0.0007;
    let pos =  moonCurvePoints.getPoint(t);
    moon.position.set(pos.x, pos.y, pos.z);
    
  }
  
  // animate flowers
  torus.rotation.x = Math.PI * Math.sin(2 * mouseX);
  rosette.rotation.z = - 0.1 * Math.PI * (mouseX);
  waterlily.rotation.y = 0.2 * Math.PI * (mouseX);
  waterlily2.rotation.y = - 0.2 * Math.PI * (mouseX);
  flower.rotation.x = - Math.PI * 0.8 + 0.3 * mouseX;
  lilySphere.rotation.y = - 0.2 * Math.PI * (mouseX);
  sphereI.rotation.y = Math.PI * 0.25 * mouseX;
  openSphere.position.y = 19.5 - 12 * Math.abs(mouseX);
  openSphere.rotation.y = - Math.PI * 0.5 * mouseX;
    
  branchGroup.rotation.x = - 0.1 * Math.PI * Math.abs(mouseX);

  iCorn.rotation.y = Math.PI * mouseX;
  cornHusk.rotation.y = - 0.25 * Math.PI * mouseX;
  
  doodles.children[6].rotation.x = -0.05 * Math.PI * mouseX;
  
  // opening flower
  for (let i = 0; i < petalCount; i++) {
     
    petalMeshes[i].position.y = 15 - 15 * Math.abs(mouseX);
    petalMeshes[i].rotation.set(0, Math.PI * 0.1, 0);
    petalMeshes[i].rotateY(rotationStep * i);
    petalMeshes[i].rotateX((Math.PI / 2) * Math.abs(mouseX));
     
  }
  
}

function radialGradientTransition(colorsArr, element) {
  
  let colors = colorsArr;

  element.style.background = `radial-gradient(circle, 
rgba(
${colors[0][0] - (colors[0][0]-colors[1][0]) * Math.abs(mouseX)},
${colors[0][1] - (colors[0][1]-colors[1][1]) * Math.abs(mouseX)},
${colors[0][2] - (colors[0][2]-colors[1][2]) * Math.abs(mouseX)},
1) 0%, 
rgba(
${colors[2][0] - (colors[2][0]-colors[3][0]) * Math.abs(mouseX)},
${colors[2][1] - (colors[2][1]-colors[3][1]) * Math.abs(mouseX)},
${colors[2][2] - (colors[2][2]-colors[3][2]) * Math.abs(mouseX)},
1) 100%)`;

}

function onResize() {
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
}

function onMouseMove(event) {
  
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  
  radialGradientTransition(bgColors, container);

}

function onTouchMove(e) {
    
	let x = e.changedTouches[0].clientX;
  let y = e.changedTouches[0].clientY;
  
  mouseX = (x / window.innerWidth) * 2 - 1;
  mouseY = (x / window.innerWidth) * 2 - 1;
  
  radialGradientTransition(bgColors, container);
    
}